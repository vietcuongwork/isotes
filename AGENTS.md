# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Smallest steps

Break implementation work into the smallest reviewable increments. Wait for explicit confirmation on each file's proposed change before writing it. Agreement on a general plan or direction ("yes, continue") is not confirmation to write a specific file — only a yes on that file's proposed change is. Don't chain file writes or installs off a single approval.

Default to proposing one file per answer. For small, low-risk tasks (e.g. extracting a component, adding a constants file, simple refactors), it's fine to propose up to a few related files in a single answer — but still wait for confirmation before writing any of them.

# Debugging — confirm with logs before fixing

When diagnosing a bug (especially anything involving native/library
interactions — focus/blur, keyboard, gestures, animations), don't implement a
fix based on a plausible-sounding theory. Add logging first, get the user to
reproduce, and read the actual timestamps/ordering before writing any code
change. A theory that sounds mechanically sound (e.g. "an unmemoized
`Gesture.Pan()` forces `GestureDetector` to re-register, which is what steals
focus") is still a guess until a log confirms that specific mechanism is
actually what's firing — it's easy to find *a* plausible cause without it
being *the* cause, especially in a codebase with several overlapping
candidates (a shared `BottomSheet`, gesture-handler, a keyboard-controller
library all touching focus at once).

This matters most for changes to shared/foundational files (e.g.
`BottomSheet.tsx`, used by every sheet in the app) — an unconfirmed fix there
risks being reverted wholesale once the log rules it out, same as any other
speculative change. See the numpad-caret-blur discussion (2026-09-28) for a
worked example: two theories (`showSoftInputOnFocus` fighting
`react-native-keyboard-controller`'s native tracking, then a non-memoized
`panGesture` in `BottomSheet.tsx`) were each implemented before being
disproven by the next log capture, and the second had to be reverted out of
a shared component.

# Logging minor issues

When an issue gets resolved through discussion (not big enough for its own Investigate → Solution → Fix chain — see "Issue Scoping" in CLAUDE.md), record it in the vault by what it is:

- **Codebase-specific** (a real bug, a library quirk in this setup, a design decision): `Debug_{slug}.md` using `templates/Debug_template.md` — **Problem / Investigation / Root Cause / Resolution / References**. Keep concrete references — file paths, component/type names, snippets. Investigation can be one line when it was a one-reply answer.
- **Generic knowledge** (language/library/API semantics that would read the same in any codebase): `Learn_{field}_{slug}.md` using `templates/Learn_template.md` — no file names, component names, or project-specific types. `{field}` is one of: `js`, `ts`, `react`, `react-native`, `expo`, `drizzle`, `sqlite`, `css`, `git`, `tooling` (add a new field only when none fits); tag it `field/{field}`.

One discussion can produce both — link them (`Seen in` ↔ `related`). The existing `documentation/log/encountered_errors*.md` files are an archive; don't append new entries there.

# Reference links in logged discussions

When a discussion that gets logged (per "Logging minor issues" above) involved links the user shared — docs, a GitHub PR/issue, an external article — include them in the `Debug_`/`Learn_` note's **References** section, so the source stays attached to the reasoning.

# Labeling JSX blocks

A render tree of several sibling `<View>`s doesn't always read as sections at
a glance. Label a block with a one-line `{/* Name */}` comment when it isn't
already obvious (3+ mixed elements, a distinct visual section) — skip it on
blocks that are self-evident (a single `<Text>`, a one-line wrapper). When a
block also carries its own logic or state (a `.map`, local selection state),
prefer pulling it out into a named sibling component instead of a comment —
the name shows up in the JSX call site and in React DevTools, and doesn't
rot the way a comment can. Define such components at module scope, never
inside another component's render body (that recreates the type every
render and breaks reconciliation/local state).

# Schema types stop at the transform boundary

DB schema types (`ExpenseRow`, `TripRow`, `MemberRow`, `ExpenseSplitRow`, etc.
from `src/db/schema.ts`) are only valid on the DB-access side of a transform
function (`transformTripRow` and similar). Once a transform function has run,
everything downstream — helpers, hooks, components — uses the app-level UI
types (`src/types/TExpense.ts`, `src/types/TCreateTrip.ts`, etc.), never the
raw schema types. Don't reach for a schema type in a helper/component just
because the data originated from a DB row.

# Function scope

Each function should do one reasonable thing and be readable on its own —
not "do everything a call site needs" bundled into one body. When a
function accumulates multiple genuinely separable concerns (e.g. "compute
the numbers" + "decide who absorbs a remainder" + "check a guard
condition"), split it into named functions even if nothing is called
elsewhere yet — the split is for readability/single-responsibility, not
just reuse. See `documentation/design_decisions.md`'s "Split-method
branching stays as explicit per-function if/switch..." entry for a worked
example (`computeSplitRows` / `distributeRemainderToPayer` /
`hasNoSplitParticipants` in `expenseHelpers.ts`) and its boundary: this is
about function-level decomposition, not a mandate to add an
interface/strategy/registry abstraction over a fixed small set of cases.

# Code comments

Keep inline comments to 1–3 lines. State the non-obvious *why* — a constraint, a gotcha, a magic number's derivation — not what the code already says. Show the arithmetic for a computed constant (`marginTop: 22 // 14 parent pad + 8 gap`), not a prose paragraph.

When the reasoning is longer than that, put it in a `Debug_{slug}.md` vault note (or a dedicated doc) and leave a one-line pointer in the code: `// why: [[Debug_{slug}]]`. Existing `// why: encountered_errors_*.md (YYYY-MM-DD)` pointers stay valid — those files remain as an archive.

# Walking through a function

When asked to walk through or explain a function (or a small group of related functions):
- One-line purpose per function: what it takes, what it returns, why it exists in the flow.
- A concrete example: a real input value from the codebase and the exact output value it produces.
- Trace the branches: a second example that hits the optional paths / guards / error cases.
- For pipelines (map/filter/reduce, `Object.entries`/`fromEntries`, chained transforms): show the intermediate value between every step.
- Close with a flow diagram tying the functions together: source data → each transform → final consumer.
- Use real values and names from the code, not `foo`/`bar`.

# No-token styles

When implementing UI, if a style value has no matching design token (color,
spacing, text style, etc.) and you have to fall back to a raw/adjacent value,
flag it with a one-line comment right above the line, so it's greppable
(`no token`) and easy to swap once a token exists:

```tsx
{/* //NOTE - no token, falling back to text-grey-400 */}
<Text className="text-grey-400 text-seg-idle">$</Text>
```

State what's missing and what you fell back to — not just "no token" alone.

# Commit message template

When asked to `git diff` and suggest a commit message, use this template:
- Header: `<category>: <short summary>`, lowercase first word after the colon.
- Only use these three categories: `feature`, `refactor`, `bugfix`.
- Body: one bullet per change, each prefixed with its own category
  (`feature:`, `refactor:`, or `bugfix:`), lowercase first word, grouped
  feature bullets first, then refactor, then bugfix.

Also give the runnable `git commit` command itself (message passed via a
`cat <<'EOF' ... EOF` heredoc), not just the message text, so it can be
copy-pasted straight into the terminal. Do not append any
`Co-Authored-By:`/`Claude-Session:` attribution lines to the commit message.
