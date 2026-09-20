# Design decisions

A log of deliberate architecture/design choices for this codebase — kept
separate from `log/encountered_errors*.md`, which is for one-off bugs and
concept mix-ups resolved through discussion. This file is for the *why* behind
a direction we chose, what we were trying to prevent, and what alternatives
lost — so a future implementation doesn't accidentally re-litigate (or
accidentally violate) a call that was already made deliberately.

Each entry:
- **Decision** — what we chose, stated plainly.
- **Why** — the reasoning, framed around what we're preventing.
- **Alternatives considered** — what else was on the table and why it lost.
- **Revisit when** — the condition that would make this worth reconsidering.

---

## Source of truth for shared concepts is split across `schema.ts`, `types/`, `color.js`, and feature `constants.ts` — deliberately, by concept type (2026-09-20)

**Decision**
There is no single "source of truth" file for concepts shared across the
data layer and UI (member colour, split method, activity, currency).
Instead, which file is canonical depends on what kind of value it is:

- **`memberColor`** — canonical source is `colors.member`'s keys in
  `src/themes/color.js` (a design-token object). `MemberColor`
  (`src/types/TExpense.ts`) derives from it: `keyof typeof colors.member`.
  `src/db/schema.ts`'s `members.memberColor` column re-declares the same
  12 keys as a literal `enum: [...]` tuple **by hand** — drizzle needs a
  literal tuple there, so it can't be derived at runtime from the color.js
  object. This is the one genuinely hand-synced copy, flagged by comments
  in both files.
- **`splitMethod`** — canonical source is `src/db/schema.ts`'s
  `expenses.splitMethod` drizzle column (`enum: ["equally","amounts","shares"]`);
  drizzle infers that literal union for `ExpenseRow["splitMethod"]`.
  `src/types/TExpense.ts`'s `SplitMethod` derives from it directly
  (`export type SplitMethod = ExpenseRow["splitMethod"]`) instead of
  hand-typing a parallel union. **Known gap:** `src/features/expense/constants.ts:25`
  still separately hand-declares its own `export type SplitMethod = "equally" | "amounts" | "shares"`
  — an unreconciled third copy that should instead import `SplitMethod`
  from `@/types/TExpense`.
- **`activity`** — canonical source is `ACTIVITIES: Activity[]` in
  `src/features/expense/constants.ts` (each entry carries an icon + label,
  not just an id). `src/db/schema.ts`'s `expenses.activityId` is a plain
  `text()` column with **no** `enum:` tuple — just a comment saying it
  "matches an id in ACTIVITIES ... app-level enum, not FK'd". Unlike
  `memberColor`/`splitMethod`, there's no type-level link at all here; a
  typo'd `activityId` string type-checks fine. Resolution back to the full
  `Activity` object happens at read time via `ACTIVITIES.find(...)` inside
  `transformExpenseRow` (`src/features/expense/helpers/expenseHelpers.ts`).
- **`currency`** — canonical source is `CURRENCY_OPTIONS: Currency[]` in
  `src/features/createTrip/constants.ts` (code/symbol/decimalDigits/name).
  `src/db/schema.ts`'s `trips.currencyCode` is the same loose `text()`
  situation as `activityId` — no enum tuple, comment-only contract.
  `transformTripRow` resolves `currencyCode` → full `Currency` via
  `CURRENCY_OPTIONS.find(...)`.

**Why**
Each concept's canonical file follows from what kind of value it is, not
from a single "always put shared types here" rule:
- **Visual/design token** (a colour meant for reuse elsewhere in the UI) →
  `color.js` is the source of truth; `schema.ts` mirrors it by hand in a
  literal `enum` tuple, since drizzle can't import a JS object's keys as a
  type.
- **Small fixed set with a real drizzle `enum: [...]` column** → `schema.ts`
  is the source of truth; derive the TS union in the types file off
  `XRow["column"]` (the `SplitMethod = ExpenseRow["splitMethod"]` pattern)
  rather than hand-typing a parallel literal union that can silently drift.
- **Richer static lookup list** (id → full display object: icon+label for
  activity, symbol+decimalDigits for currency) → the feature-level
  `constants.ts` array is the source of truth; `schema.ts` only stores the
  raw id/code as untyped `text()`, and a `transformXRow` helper
  (`expenseHelpers.ts`) resolves id → object via `.find()` at read time.

What this is preventing: a single shared "enum registry" file would mean
either (a) the DB layer importing UI-only concerns like `color.js` tokens or
`lucide-react-native` icons, or (b) `schema.ts` losing its literal-tuple
enums (drizzle needs those inline) in favor of importing a type it can't
actually enforce at the SQL level anyway.

**Alternatives considered**
- Deriving `schema.ts`'s `memberColor` enum array from `colors.member` at
  runtime (`Object.keys(colors.member) as [MemberColor, ...MemberColor[]]`).
  Rejected: a palette edit in `color.js` would silently change what the DB
  column accepts with no visible diff in `schema.ts`, and it would pull a
  theme/design-token import into the DB layer, which currently has zero
  UI-layer imports. See `log/encountered_errors_iv.md`'s
  "`members.memberColor`'s enum array is hand-kept in sync..." entry for the
  full reasoning.
- A single shared "enums" or "constants" file importable from both
  `schema.ts` and the UI. Not pursued — would require the DB layer to
  import UI concerns (icons, colour tokens) for `activity`/`memberColor`,
  which is the exact coupling the current split avoids.

**Revisit when**
- If `activityId`/`currencyCode` ever need real DB-level enforcement (e.g.
  a `CHECK` constraint or FK), which would push `schema.ts` to gain a real
  `enum: [...]` tuple for them too — at that point they'd move into the
  "small fixed set with a drizzle enum column" bucket like `splitMethod`.
- Known outstanding cleanup (not yet done): `src/features/expense/constants.ts:25`'s
  duplicate `SplitMethod` should import from `@/types/TExpense` instead of
  re-declaring the literal union.
