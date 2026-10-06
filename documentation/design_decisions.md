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

---

## Equal/shares split rounds down per person; split rows may not sum to the expense total (2026-09-22)

**Decision**
For the `equally` and `shares` split methods, each member's persisted
`individualAmount` is rounded down (`floor` to the currency's
`decimalDigits`) rather than using a largest-remainder distribution to
force `expenseSplits.individualAmount` rows to sum exactly to
`expenses.amount`. Any shortfall (up to `memberCount - 1` minor units, e.g.
1-2 cents) is not assigned to anyone.

**Why**
Simpler to implement now, and nothing enforces the sum at the DB level —
`expenseSplits.individualAmount` (`schema.ts:98`) is a plain `real` with no
`CHECK` tying it back to `expenses.amount`. Reconciliation correctness is
being deliberately deferred, not solved.

**Alternatives considered**
- Largest-remainder method: floor every share, then hand the leftover minor
  units out one at a time (e.g. to members in list order) so persisted
  splits always sum exactly to the total. Not used yet — more logic for a
  discrepancy that isn't blocking anything today.

**Revisit when**
- Any feature sums `expenseSplits.individualAmount` to reconcile against
  `expenses.amount` (trip balance screen, "settle up" math, export/audit
  view) — at that point the shortfall stops being cosmetic and starts
  silently understating what's owed.

**Superseded by**: "Equal/shares split rounds to nearest, tolerated via an
acceptable rounding gap" (2026-09-23) below — the revisit condition above
was hit sooner than expected, by expense-submit validation itself.

---

## Equal/shares split rounds to nearest, tolerated via an acceptable rounding gap (2026-09-23)

**Decision**
Supersedes the 2026-09-22 entry above. For `"equally"` and `"shares"`,
each member's persisted `individualAmount` is now rounded to the nearest
minor unit (`roundToDecimals`, half-up) instead of floored. The resulting
per-member sum can still miss `expenses.amount`, but only by an amount
bounded by `getAcceptableSplitGap(participantCount, decimalDigits)`
(`src/utils/currency.ts`) — `⌈participantCount / 2⌉` minor units, the
mathematical worst case when N independently-rounded shares are summed.
That bound is treated as acceptable rounding noise, not a real assignment
gap: `SplitSummary.tsx`'s `"amounts"` variant and
`validateExpenseSheet`'s equivalent check both compare the actual
remaining amount against this gap rather than requiring an exact match.

**Why**
The floor-and-ignore approach's own "Revisit when" condition was hit: expense
submit now validates the split before allowing insert, which needs a real
answer for "is this total close enough" rather than deferring it
indefinitely. Rounding to nearest (instead of always down) also halves the
expected drift compared to always-floor, and a closed-form acceptable-gap
bound is simpler to reuse across the UI and the validator than a
largest-remainder distribution (considered and rejected here too — see
below).

**Alternatives considered**
- Largest-remainder / single-absorber: round every share, then force the
  sum to match exactly by assigning the whole rounding remainder to one
  member (e.g. first in list order). Rejected: always exact, but
  concentrates every expense's rounding drift onto the same one person
  (typically whoever is first in `members` order) rather than treating it
  as shared, unassigned noise — a fairness tradeoff not worth taking for a
  discrepancy this small (at most a few minor units).

**Revisit when**
- Any feature needs `expenseSplits.individualAmount` to sum *exactly* to
  `expenses.amount` with zero tolerance (e.g. a strict ledger export or an
  accounting integration) — at that point the acceptable-gap tolerance
  itself becomes the problem, not just the old floor shortfall.

**Superseded by**: "Split rounding/leftover is assigned to the payer"
(2026-09-25) below — the revisit condition above was hit: a strict zero-
tolerance sum turned out to be simpler to reach directly than to keep
tolerating.

---

## Split rounding/leftover is assigned to the payer, not tolerated via a gap (2026-09-25)

**Decision**
Supersedes the 2026-09-23 entry above. `expenseSplits.individualAmount` rows
now always sum *exactly* to `expenses.amount`, for all three split methods —
`getAcceptableSplitGap` is removed entirely. `resolveSplitAmounts`
(`expenseHelpers.ts`) computes each method's natural per-member amounts via
`computeSplitRows`, then `distributeRemainderToPayer` adds whatever's left
(`totalAmount - sum(rows)`, positive or negative) onto the payer's own row:

- **`equally`/`shares`** — the leftover is pure rounding drift from rounding
  each share to the currency's `decimalDigits`; the payer absorbs it instead
  of it going unassigned. (Rounding mode for these two later changed to
  floor — see "Equally/shares base amounts floor, not round" (2026-09-27),
  which supersedes only this detail, not the payer-absorbs mechanism.)
- **`amounts`** (manual entry) — if the user's entered amounts don't sum to
  the total, the difference is now silently assigned to the payer too,
  rather than blocking submit with a "left to assign"/"over" error. If the
  user already balanced their own entries by hand, the difference is `0` and
  nothing changes — this isn't a separate mode, just what the same mechanism
  produces when there's nothing left to absorb.
- **Fallback**: if the payer isn't a participant in the split (deselected
  from `equally`, or `0` shares in `shares`), the remainder falls to the
  first participant in list order instead. `amounts` always includes every
  member as a row, so this fallback is `equally`/`shares`-only in practice.
- **The one remaining real error**: if other members' amounts already
  exceed the total by more than the absorbing member's own row can cover,
  absorption would drive that row negative. `distributeRemainderToPayer`
  reports this as `wouldGoNegative`, and `validateExpenseSheet` still blocks
  submit on it — this is the only case `errors.split` can still be `true`
  once there's at least one participant.

**Why**
Discussed directly (2026-09-25): simpler mental model than a tolerance
bound — "the split always sums exactly, and someone always owns the odd
cent" — and it removes `getAcceptableSplitGap` plus the duplicated
`Math.abs(...) > gap` check that had been independently re-derived in three
places (`SplitSummary.tsx`, and twice inside `validateExpenseSheet`).
Choosing the payer specifically (not list-order-first) was a deliberate
call: the payer already fronted the money, so absorbing rounding noise on
top of that is a defensible default the user picks each time via "paid by,"
rather than a name that happens to sort first.

**Alternatives considered**
- Keep the 2026-09-23 acceptable-gap tolerance, but also apply it to
  `amounts`. Rejected — see the superseded entry's own alternatives and
  `SplitSummary.tsx`/`validateExpenseSheet`'s "left to assign" behavior;
  the gap conflated pure rounding noise with genuine missing-entry mistakes
  in `amounts`, and this decision's design conversation resolved that by
  having the payer absorb both rather than trying to tell them apart.
- Largest-remainder / first-participant-always absorbs. This is the
  2026-09-23 entry's already-rejected "single absorber" concern — rejected
  there for concentrating drift onto whoever sorts first in `members`
  order, trip-wide, expense after expense. The payer isn't exempt from that
  same concentration risk (a payer who pays often will absorb often too),
  but the payer is chosen by the user per-expense rather than being a fixed
  property of list order, which is why this decision doesn't extend the
  2026-09-23 rejection.

**Revisit when**
- If the same member is repeatedly the payer across many expenses in a
  trip and users report noticing they always end up covering the odd
  cent — at that point the "payer absorbs" default itself becomes the
  fairness problem the 2026-09-23 entry was trying to avoid, not the
  rounding math.
- If `amounts`-split validation needs to distinguish "rounding noise" from
  "user forgot to assign a real chunk of the expense" again — this decision
  deliberately stopped trying to tell those apart (see Why above).

**Superseded (for `"amounts"` only) by**: "Amounts split validates against
an exact sum, not payer absorption" (2026-09-25) below — the "amounts"
payer-absorbs-any-imbalance behavior this entry introduced turned out to
silently swallow a real user-entry error (a single member's amount larger
than the total) with no way for the math to ever catch it. `"equally"` and
`"shares"` are unaffected — this entry's reasoning still holds for their
pure rounding-remainder case.

---

## Amounts split validates against an exact sum, not payer absorption (2026-09-25)

**Decision**
For the `"amounts"` split method only, `resolveSplitAmounts` no longer runs
`distributeRemainderToPayer` over the whole row set. Instead:
- Selected members are split into **explicit** (typed a value, including
  `"0"`, which is a real $0 participant) and **auto** (untouched — no key in
  `splitAmounts`). Explicit entries are never touched by anything.
- Auto members split whatever's left after explicit entries are
  subtracted from the total (`getAmountsRemainder`'s `remainder`, clamped to
  0 before dividing), evenly among themselves — `distributeRemainderToPayer`
  still runs, but scoped only to that auto pool, against `remainder`, not the
  whole split. This is the same pure rounding-remainder handling `"equally"`
  already does, just applied to a subset of members instead of all of them.
- `validateExpenseSheet` blocks submit (`errors.split = true`) whenever the
  resolved rows don't sum exactly to `totalAmount`, or any row is negative
  — both checks apply uniformly across all three split methods now, but are
  only ever actually restrictive for `"amounts"`: `"equally"`/`"shares"`
  always sum exactly by construction (that's what `distributeRemainderToPayer`
  guarantees), so the sum check trivially passes for them.
- `SplitSummary.tsx`'s `AmountsSummary` no longer shows "$X to/off
  {payer}" — it shows "Fully assigned" (green) whenever the auto pool
  will cover the remainder or it's already exact, "$X left to assign" (red)
  once every selected member has an explicit entry and they still don't sum
  to the total, or "$X over" (red) whenever explicit entries alone already
  exceed the total, auto pool or not.

**Why**
Discussed directly (2026-09-25): the previous "amounts" absorption design
had a real gap — `distributeRemainderToPayer`'s formula makes the payer's
absorbed row `totalAmount − sum(everyone else's rows)`, which is
mathematically independent of whatever the payer themselves typed. A payer
could type an amount far larger than the total (e.g. $150 on a $100 total)
and it would never trip `wouldGoNegative` (the only guard that existed),
since the payer's own entry never appears in that check at all — it just
silently vanished, replaced by the leftover. Splitting into
explicit-vs-auto and only ever absorbing rounding drift within the
auto pool removes that gap: an explicit entry now always contributes
to the exact-sum check. If it alone already exceeds the total, `remainder`
goes negative; it is clamped to 0 before dividing (a negative auto share
would render as a garbled positive number, since `formatAmountInput` strips
"-"), so the auto members show $0 and the sum-mismatch check blocks submit.

This also fixes a related but separate issue: the old fallback denominator
(`totalAmount / members.length`) ignored what was already typed, so the
remaining members' equal-share default didn't redistribute around explicit
entries. `getEffectiveSplitAmounts` now divides `remainder` (total minus
explicit entries) by the auto pool's own count.

**Alternatives considered**
- Keep whole-split absorption, but add a narrower guard specifically for "a
  single explicit entry exceeds the total." Rejected: still an ad-hoc patch
  on top of a formula that structurally ignores the payer's own input; the
  explicit/auto split fixes the root cause instead of one symptom of it.
- Apply the same explicit/auto remainder scoping to `"equally"`/`"shares"`
  too. Not needed — those methods have no per-member typed entry at all
  (just a checkbox or a share count), so "explicit vs auto" isn't a
  meaningful distinction for them; whole-row absorption was already exactly
  equivalent to "the whole set is the auto pool."

**Revisit when**
- If `"amounts"` needs partial-progress saving (e.g. a draft that's
  intentionally under-assigned, not meant to validate yet) — the current
  design treats "every member explicit but not summing" as a hard block,
  with no distinction between "still working on it" and "made a mistake."

---

## Member participation is one shared `selectedMemberIds`, not derived per split method (2026-09-26)

**Decision**
`useExpenseSheetStore.selectedMemberIds` alone decides who is in the split,
for all three methods. It replaces `equallySelectedMemberIds` and the two
implicit rules that used to define participation for the other methods
(`splitShares[id] > 0` for shares, a missing key or non-`"0"` value for
amounts).
- **equally**: row toggle adds/removes the member.
- **amounts**: clearing a member's field to `""` deselects them; typing into
  a deselected member's field selects them again. `"0"` is a selected member
  at $0, not a deselected one.
- **shares**: stepping to 0 deselects; stepping up from deselected selects
  with 1 share. A deselected member always displays 0 shares.
- Selecting a member (row toggle, Everyone chip, or typing/stepping into a
  deselected row) goes through the store's `selectMembers`, which resets the
  newly selected members to defaults: amount key deleted (back to auto),
  shares set to 1. Deselecting keeps stored values, but they're ignored
  while unselected.
- Only selected members get an `expense_splits` row, for all three methods
  (amounts used to write a row for every member). `schema.ts` is unchanged.
- Everyone/None chips apply to all three methods; amounts' old "Clear" chip
  was dropped because it's now identical to None.

**Why**
Selection carried no meaning across methods: deselecting someone under
"equally" didn't survive switching to shares or amounts, and the amounts and
shares rules were side effects of the inputs themselves (a typed `"0"`
silently opting a member out, a share count of 0 doing the same). One list
makes participation a single fact that `getParticipatedMemberNumber`,
`validateExpenseSheet`, `getAmountsRemainder` and the summaries all read the
same way. Resetting on re-select avoids a member reappearing pinned to an
amount or share count they had before being deselected.

**Alternatives considered**
- Keep three per-method participation rules and only share the equally list.
  Rejected: that's the inconsistency this decision removes.
- Keep stored amounts/shares on re-select so a member comes back exactly as
  they were. Rejected: an auto member is supposed to float with the
  remainder, and a stale pinned value makes the split silently wrong.

**Revisit when**
- Users expect a re-selected member to get their previous typed amount back —
  that would mean `selectMembers` stops deleting the key and the auto/explicit
  distinction needs another way to mark "was explicit before".

---

## Split-method branching stays as explicit per-function `if`/`switch`, not a strategy/registry pattern (2026-09-25)

**Decision**
`computeSplitRows`, `resolveSplitAmounts`, `validateExpenseSheet`,
`SplitSummary.tsx`, and `useSplitBottomSheet.ts` each still branch on
`SplitMethod` ("equally"/"amounts"/"shares") directly with `if`/`switch`,
rather than each split method being expressed as an object implementing a
shared `SplitStrategy` interface (`computeRows`, `isValid`, etc.) looked up
from a `Record<SplitMethod, SplitStrategy>`. Where the same per-method row
math was genuinely duplicated in the same file for the same purpose (the
2026-09-25 payer-remainder change above found this between
`validateExpenseSheet` and `resolveSplitAmounts`), it was pulled into one
shared function (`computeSplitRows`) that both call — but that's ordinary
function extraction, not a strategy pattern.

**Why**
There are exactly three split methods, no more are planned, and they aren't
interchangeable enough for a shared interface to earn its cost:
- `equally`'s participant selection is a member-id list
  (`selectedMemberIds`); `shares`'s is a weight map (`splitShares`,
  filtered to `> 0`). Forcing both through one `computeRows(selection)`
  shape either loses that distinction or just re-adds an `if` inside the
  interface implementation anyway.
- The three UI variants (`SplitSummary.tsx`'s three return blocks) differ in
  copy, icon, and error condition per method — a strategy object would only
  dedupe the numeric core, not this, which is most of what differs.
- A registry adds a layer of indirection (interface + lookup) for a fixed,
  small set of cases, which is a cost even when nothing is duplicated
  through it.

The actual guiding rule, restated plainly: **each function should be
readable and responsible for one reasonable scope** — that's why
`computeSplitRows` (per-method row math), `distributeRemainderToPayer`
(remainder absorption), and `hasNoSplitParticipants` (the "nobody selected"
guard) are three separate functions in `expenseHelpers.ts` rather than one
function doing all three. That's the same principle as avoiding duplicate
logic; it just doesn't imply a strategy-object abstraction for a fixed set
of three cases.

**Alternatives considered**
- Full `SplitStrategy` interface + `Record<SplitMethod, SplitStrategy>`
  registry spanning `expenseHelpers.ts` and the UI components. Rejected for
  now — see Why above. The concrete, bounded duplication that did exist
  (`validateExpenseSheet`/`resolveSplitAmounts`'s row math) was fixed via
  plain extraction (`computeSplitRows`) instead, which solves the same
  problem without committing to an interface for a fixed set of variants.

**Revisit when**
- A 4th split method is actually added — at that point re-evaluate whether
  the number of scattered per-method branch points (still just the same
  five files above) justifies a registry, versus continuing to add one more
  `if`/`case` per file.

---

## `useExpenseSheetStore` is reset on `ExpenseScreen` unmount, not on sheet close or expense submit alone (2026-09-23)

**Decision**
`useExpenseScreen.ts` resets `useExpenseSheetStore` in a `useEffect`
cleanup (i.e. on unmount), rather than resetting whenever the add-expense
sheet closes. The draft (amount/description/split selection/etc.) is
otherwise left to persist across the sheet closing and reopening within
the same trip — matching the "picked up where you left off" / "Start
over" resume UI in `screen_ui_drafts/04-add-expense.html`, which expects
a half-filled expense to survive a sheet dismiss and reopen.

**Why**
The store is global (module-level Zustand), so it outlives any single
component's mount. Without an explicit reset somewhere, a leftover draft
from Trip A (e.g. `selectedMemberIds` holding Trip A's member ids)
would still be sitting in the store after navigating to Trip B's expense
screen, since none of Trip B's members match those stale ids — this
produces the bug "equally split always shows 1 person selected in state,
but the UI shows nobody checked" once Trip B's member list is compared
against it. Resetting on `ExpenseScreen` unmount clears the draft exactly
when leaving a trip, without clearing it on every sheet close, which
would break the resume feature above.

**This only holds as long as trip-switching always navigates to a new
`tripId` route via `router.push`/`router.replace` (a real unmount +
remount of `ExpenseScreen`), rather than `router.setParams` on the same
route entry.** `push`/`replace` to a different dynamic segment produces a
new screen instance, so the cleanup fires; `setParams` keeps the same
instance alive, so it wouldn't. If a future trip-switcher (e.g. the
planned drawer-based trip switching, or a header dropdown) is ever
implemented with `setParams` instead — typically done to avoid a jarring
full remount — this cleanup silently stops firing, and the reset would
need to move to an effect keyed on `tripId` changing instead.

**Alternatives considered**
- Reset on successful expense submit only (already done via `reset()` in
  `useAddExpenseBottomSheet`'s `handleSubmit`), with no unmount-based
  reset at all. Rejected as the sole mechanism: doesn't address stale
  cross-trip state left behind by a sheet that was opened, half-filled,
  and dismissed without submitting.
- Reset on `AddExpenseBottomSheet` mount. Rejected: this store is a
  single shared draft, and mount-based reset would wipe it every time the
  sheet reopens — directly breaking the "picked up where you left off"
  resume feature this store is meant to support.

**Revisit when**
- Trip-switching navigation is implemented and it does **not** use
  `router.push`/`router.replace` to a new `tripId` route (e.g. it uses
  `router.setParams`, or trip switching becomes an in-place UI change with
  no navigation at all) — at that point this reset needs to move to an
  effect keyed on `tripId` changing, not on unmount.

---

## `ExpenseScreen`'s trip-id-scoped data is fetched as three separate queries, not one combined fetch (2026-09-24)

**Decision**
Data for a given `tripId` (trip, members, expenses-with-splits) is fetched
via three separate `getXByTripId` functions (`getTripById`,
`getMembersByTripId`, `getExpensesWithSplitsByTripId`), each wired to its
own `useLiveQuery` call in `useExpenseScreen.ts`, rather than one combined
fetch function that returns all three together.

**Why**
Each `useLiveQuery` call is its own watched SQLite subscription. Keeping
the three separate means an expense insert only re-runs the expenses
query — the trip and members queries, and any effects keyed on their data
(e.g. the `setCurrency`/`setMembers` effects in `useExpenseScreen.ts`),
don't re-fire. A single combined fetch function would either have to
re-run all three on any one table's change, or get split back into three
live queries internally anyway. This also matches the split already in
place for `trip`/`memberRows` before `expenses` was added, so the third
fetch follows the same shape instead of introducing a second pattern on
the same screen.

**Alternatives considered**
- One combined `getTripScreenData(tripId)` function returning
  `{ trip, members, expenses }` from a single call site. Rejected: would
  need to either watch all three tables in one subscription (any table's
  change re-renders everything downstream of it) or internally call three
  separate live queries anyway, just hidden behind one function name.

**Revisit when**
- If these three ever need to be read as one atomic snapshot (all three
  guaranteed to reflect the exact same instant, never a partially-updated
  combination) — not currently a requirement for this screen.

---

## `TripList`'s per-trip balance data is fetched as one combined query, not split like `ExpenseScreen`'s (2026-09-25)

**Decision**
`src/features/onboarding/components/TripList.tsx` fetches every trip
together with its members and expenses-with-splits via a single function,
`getAllTripsWithMembersAndExpenses` (`src/db/trips.ts`), using drizzle's
relational `db.query.trips.findMany({ with: { members: true, expenses: {
with: { splits: true } } } })` — one call, not three separate
`getXByTripId` calls per trip.

**Why**
The entry above ("`ExpenseScreen`'s trip-id-scoped data is fetched as three
separate queries") splits its fetch specifically to limit which
`useLiveQuery` subscription re-fires on a given table change. `TripList`
doesn't use `useLiveQuery` at all — it's a one-shot fetch inside
`useFocusEffect`, run again only when the screen regains focus. With no
live subscription to keep narrow, there's no subscription-granularity
reason to pay for N separate round trips (members + expenses, per trip) when
one combined relational query returns the same nested shape in one call.
The two screens deliberately differ here; this isn't an inconsistency to
reconcile.

**Alternatives considered**
- Mirroring `ExpenseScreen`'s split (separate `getMembersByTripId` /
  `getExpensesWithSplitsByTripId` calls per trip, `Promise.all`'d across all
  trips). This was the first implementation, and is what motivated writing
  this entry once it was noticed the two screens now look inconsistent
  without an written reason. Rejected/replaced: the granularity that split
  buys is for live-query re-render scoping, which doesn't apply to a
  one-shot fetch, so it was strictly more round trips for no benefit here.

**Revisit when**
- If `TripList` ever moves to `useLiveQuery` per trip for live-updating
  balances while the screen stays focused — at that point the
  `ExpenseScreen` reasoning would start to apply here too, and the combined
  query would need to be reconsidered (or split back out, or kept as the
  live query's own `with` clause, which `useLiveQuery` supports the same
  way).

---

## Equally/shares base amounts floor, not round (2026-09-27)

**Decision**
`computeSplitRows`'s `"equally"` and `"shares"` branches use the new
`floorToDecimals` (`src/utils/currency.ts`) instead of `roundToDecimals` for
each participant's base `individualAmount`. `"amounts"`'s auto pool
(`getEffectiveSplitAmounts`) is unaffected — still round-to-nearest.

This guarantees `distributeRemainderToPayer`'s `remainder` for these two
methods is always `>= 0`: for `"equally"`, `perPerson = totalAmount / N`
exactly, and `floor(perPerson) <= perPerson`, so `N × floor(perPerson) <=
totalAmount`; for `"shares"`, each participant's exact share already sums to
`totalAmount`, and flooring each one only ever removes from that sum. The
absorber's row is always `base + extra`, never `base − extra`.

A new `getRoundingRemainder` (`expenseHelpers.ts`) exposes `{ absorberId,
baseAmount, remainder }` for display — used by `SplitSummary.tsx` (a line
under the per-person/per-share summary naming who covers the extra, shown
only when `remainder > 0`) and `useSplitBottomSheet.ts` (the absorbing
member's row reads `$33.33 + $0.01` instead of a plain `$33.34`). This is a
read-only derivation, not new store state — the same pattern as
`getAmountsRemainder`. `resolveSplitAmounts`/`validateExpenseSheet`/submit
are unaffected; they only ever needed the final `rows`.

**Why**
Discussed directly (2026-09-27): with round-to-nearest, `remainder` could be
negative (assigned rows summed to slightly more than the total), so the
absorber's row could end up as their base amount *minus* a cent. Displaying
that meant either showing a confusing "+ -$0.01", or a sign-branching UI
just to say "− $0.01". Floor removes the case entirely by construction,
rather than handling it in the display layer.

**Alternatives considered**
- Keep round-to-nearest, sign-branch the display (`+`/`−` depending on
  `remainder`'s sign). Rejected: works, but leaves the underlying "the
  person covering the rounding might get less than everyone else" outcome
  in place — floor removes the actual case, not just how it's labeled.
**Update (2026-09-28)**: extended to `"amounts"`'s auto pool too —
`getEffectiveSplitAmounts`'s `baseRows` now also use `floorToDecimals`
instead of `roundToDecimals`, for the identical reason: the auto pool's own
`distributeRemainderToPayer` call (against `distributable`, already clamped
to `>= 0` by the separate over-total guard) is now guaranteed a non-negative
remainder, so its absorber can never end up with less than the other auto
members. This doesn't change the `"amounts"` display — the live-typed field
still can't show a composed `"+ $0.01"` string (it would fight the user's
typing, per `encountered_errors_iv.md`, 2026-09-25) — it's a persisted-value
correctness fix only.

**Revisit when**
- Floor increases the absorber's typical top-up versus round-to-nearest (up
  to just under 1 minor unit per participant, vs. up to half that) — if that
  ever reads as "the payer always eats a bigger-than-expected rounding
  cost," this trade-off is the first thing to revisit.

---

## The number pad is a pass-through sheet closed by a root tap detector, not a backdrop (2026-09-30)

**Decision**
`NumberPadBottomSheet` is pushed with `pushSheet({ …, passThrough })`
instead of relying on its own (invisible) backdrop. For a pass-through top
sheet, `BottomSheetStack`:
- makes its own wrapper `pointerEvents="box-none"` and the one sheet
  directly under it touchable again (`getWrapperPointerEvents`);
- tells that covered sheet via `SheetCoverContext` to swallow backdrop taps
  without closing;
- closes it from a root `View` that only observes touches
  (`useTapOutsideTopSheet`: `onStartShouldSetResponderCapture` returning
  `false` + `onTouchEndCapture`) — a touch that moved ≤ 10px, didn't start
  inside the top sheet, and isn't claimed by `isTapIgnored` closes it via
  `ref.close()`.
The content behind the numpad scrolls, and a tapped control still fires —
the same as a real keyboard with `keyboardShouldPersistTaps="handled"`.

**Why**
The old invisible backdrop swallowed every touch, so nothing behind the
numpad could scroll. RN's own ScrollView tap-to-blur can't help: it's gated
on real keyboard metrics (`_keyboardIsDismissible`), which
`showSoftInputOnFocus={false}` never produces. A root observer sees every
touch without taking the responder, so scrolls and presses underneath run
unchanged. Distance is the only reliable tap/scroll signal (T1 logs):
`onTouchEndCapture` fires after scrolls too, and `onScrollBeginDrag` can be
missing or arrive after the touch ends.

**Alternatives considered**
- Keep the scrim and raise the list with `zIndex`. Rejected: `zIndex` only
  orders siblings; the list and the scrim live in different stack branches.
- A list-only trigger (`onScrollBeginDrag` + `onTouchEnd` on the
  `FlatList`). Rejected: taps outside the list stop closing the numpad, and
  switching split tabs would orphan a per-row numpad.
- Close on the field's `onBlur`. Rejected: nothing blurs a numpad field on
  tap (see above).
- `popSheet(id)` from the tap handler. Rejected (T11): `popSheet` calls
  `close()` inside a `setSheets` updater, which can run during render.

**Revisit when**
- A second pass-through sheet type appears — "covered" is only ever the
  one sheet under the top, and a pass-through sheet pushed while another is
  still closing lands the covered flag on the closing one.
- A tap that stops momentum scroll closing the numpad becomes a problem —
  RN detects that case only by timing (`_isAnimating`, 16ms), which was
  declined here.
- `popSheet`'s side effect inside its state updater is fixed — the tap
  handler could then go back through `popSheet`.

**Superseded by**: "Sheets and the number pad come from a port of
sheet-keyboard-rebuild" (2026-10-05) below — the number pad is no longer a
sheet, so the pass-through stack, `SheetCoverContext` and
`useTapOutsideTopSheet` were deleted with `src/components/bottomsheet/`.

---

## The Split numpad target lives in the store (`activeSplitMemberId`), not local state (2026-09-30)

**Decision**
Split → Amounts uses one shared numpad (`useSplitNumberPad`), whose target
member is `useExpenseSheetStore.activeSplitMemberId`. `useNumberPadBottomSheet`
takes an explicit, required `target: "expenseAmount" | "activeSplitMember"`
and reads the active member at keypress time. Switching fields retargets the
store value instead of closing and re-pushing the sheet. The value sits in
`draftInitialState` and is cleared on numpad dismiss.

**Why**
A pushed sheet renders under `BottomSheetStackProvider`, outside
`SplitBottomSheet`'s tree, and its props are frozen at push time — so
neither a prop nor `SplitBottomSheet`-local state/context can retarget it.
Re-pushing per row (the interim flow) briefly left two numpads on the stack,
which dropped Split to `pointerEvents="none"` and blurred the focused field.

**Alternatives considered**
- Local state in `SplitBottomSheet` + context. Rejected: the pushed numpad
  isn't a descendant of `SplitBottomSheet`.
- One numpad per row, closed and re-pushed on switch. Rejected: visible
  flicker and the spurious blur above.
- Optional `memberId` (omit = expense total). Rejected: forgetting it
  silently edited the total; `target` is required and a split target with
  no active member does nothing.

**Revisit when**
- The split method can change without a tap while the numpad is open
  (e.g. draft restore) — nothing then closes the numpad (T17 was skipped
  because a tap on the tab already closes it).
- A second screen needs a retargetable numpad — generalise the target
  beyond Split.

**Superseded by**: "Sheets and the number pad come from a port of
sheet-keyboard-rebuild" (2026-10-05) below — each Split row is its own
`NumberPadInput`, and native focus picks the target, so
`activeSplitMemberId` and `useSplitNumberPad` were removed.

---

## Sheets and the number pad come from a port of sheet-keyboard-rebuild (2026-10-05)

**Decision**
`src/components/sheet-keyboard/` is a copy of `~/repository/sheet-keyboard-rebuild`'s
`src/sheet/` and `src/keyboard/` (TECH_SPEC path A: port, don't
reimplement). The number pad is a *keyboard* owned by a `KeyboardHost`
inside each `BottomSheet`, and every number field is a real `TextInput`
(`NumberPadInput`). The only adaptations are `@/` imports, Prettier, isotes'
dark tokens in `StyleSheet` objects, `keyboardAppearance="dark"` defaults,
the grouping extension and `showCloseButton` (entries below). The reference's
tests came along (194 with the isotes ones).

**Why**
The old model pushed the numpad as a separate sheet on top of the stack.
The shared root stack, the pass-through wrapper, the Fabric blur/refocus
workarounds and tap-outside fought over focus
([[Investigate_numpad-focus-switching]], [[Investigate_numpad-reopen-while-closing]]).
In the rebuild, focus is native and the pad follows it, so that machinery
has nothing left to do. The reference was already verified against
TECH_SPEC B1–B17 on the simulator; reimplementing it would mean re-earning
that verification.

**Alternatives considered**
- Keep fixing the push stack (Solution_numpad-focus-switching A/B/C).
  Rejected: each fix closed one window and the next log found another.
- Reimplement the rebuild's model in isotes' own style (TECH_SPEC path B).
  Rejected: path B is for targets that can't take the code; isotes can.

**Revisit when**
- Android becomes a target — the sheets may work there, but keyboard sync
  (`HANDOFF_PT`, `PAD_RELEASE_AT`, `RENDER_LATENCY_MS`) is iOS-only tuning.
- The reference repo fixes a bug — port the fix by diffing
  `integration.test.tsx` and the shared files, which were kept diffable.
- RN is bumped — re-check TECH_SPEC §2.3's RN internals (0.86.3 changes a
  Modal-boundary event path in `NativeDOM.cpp`).

---

## Sheets nest declaratively, not through a push stack (2026-10-05)

**Decision**
Each opener owns a `visible` boolean (`ExpenseScreen: isAddExpenseOpen`,
`AddExpenseBottomSheet: isDateOpen`, …), and a child sheet is rendered
inside its parent sheet. `BottomSheetStack`, `pushSheet` and
`useBottomSheet` are gone. Per-open state lives in a module-scope content
component (e.g. `AddExpenseContent`), because the outer `BottomSheet` stays
mounted while hidden.

**Why**
The rebuild's ordering, tap-outside and keyboard hand-off are verified for
nested Modals (host depth). A pushed sheet rendered under a root provider,
outside its opener's tree, so its props froze at push time — the reason
`activeSplitMemberId` had to live in the store.

**Alternatives considered**
- Keep `pushSheet` on top of the new `BottomSheet`. Rejected: sibling Modals
  and host-depth ranking don't match the rebuild's verified model.

**Revisit when**
- A sheet must be opened from somewhere that isn't its parent's subtree
  (e.g. a deep link or a global command) — nesting then needs lifting
  state up or a small open-sheet store.

---

## Amount fields group live in `numberPadLogic` (2026-10-05)

**Decision**
`numberPadLogic.ts` gains `grouping` and `maxIntegerDigits`. With
`grouping`, each key is applied to the raw text (commas stripped): display
caret → raw caret, `applyNumberPadKey`, regroup, raw caret → display caret.
`MAX_INTEGER_DIGITS = 15`. The output matches `formatAmountInput` for every
canonical input. Amount and Split → Amounts rows pass `grouping`.

**Why**
Chosen in the spec (user, 2026-10-05): "1,234.5" while typing. Matching
`formatAmountInput` exactly matters because `NumberPadInput`'s in-flight
queue compares strings — a parent echo formatted differently would reset
the caret.

**Alternatives considered**
- Group only in read-only displays. Rejected by the user: live grouping is
  the expected feel.
- Group in the field's `onChangeText` (outside the pad logic). Rejected:
  the caret would be computed on the wrong string and jump when a comma
  appears.

**Revisit when**
- A locale with a different group/decimal separator is supported — `,`/`.`
  are hard-coded in the grouping path.
- `formatAmountInput` changes — the two must stay identical (there's a test
  over canonical inputs).

---

## `showCloseButton` lives in the ported sheet header, laid over it (2026-10-05)

**Decision**
The ported `BottomSheet` takes `showCloseButton` (needs a `title`). The X
is a sibling laid over the header, not a child of it, and calls
`onRequestClose` — the same path as a backdrop tap. The title gets
`paddingRight: 36` (24 icon + 12 gap).

**Why**
The rebuild's header claims the responder on touch start, assuming nothing
inside it is tappable. Overlaying the X as a sibling keeps that assumption
true instead of negotiating responders, and keeps the X its own VoiceOver
element (the header is `accessible`, which would group a child into it).

**Alternatives considered**
- X as a child of the header. Rejected: it would fight the header's
  claim-on-start, and VoiceOver would merge it into the header.
- Keep each sheet's own in-content X row. Rejected: duplicated per sheet,
  and AddExpense's was dead after the switch.

**Revisit when**
- The header gains another control (e.g. a "Done" action) — at that point
  a header-actions slot is worth more than a single boolean.
