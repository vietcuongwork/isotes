# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# No direct file edits

Do not modify files directly unless the user explicitly asks for the change. Propose the change (diff, explanation, or plan) and wait for confirmation first.

# Smallest steps

Break implementation work into the smallest reviewable increments. For each file, describe the change in natural language — what's changing and why — rather than pasting the full proposed code or a diff first; the user reviews the actual diff after it's written (via `git diff` or the editor), so pasting code beforehand just means reviewing the same change twice. Wait for explicit confirmation on that per-file description before writing it. Agreement on a general plan or direction ("yes, continue") is not confirmation to write a specific file — only a yes on that file's described change is. Don't chain file writes or installs off a single approval.

Default to describing one file per answer. For small, low-risk tasks (e.g. extracting a component, adding a constants file, simple refactors), it's fine to describe up to a few related files in a single answer — but still wait for confirmation before writing any of them.

# Logging minor issues

When a minor issue gets resolved through discussion (not big enough for its own doc), log it briefly in `documentation/encountered_errors.md` using the existing template — **Problem / Explanation / Solution**, kept short — with a `(YYYY-MM-DD)` timestamp in the heading.

When the current `encountered_errors*.md` file (the one new entries are being appended to) passes 500 lines, start a new one instead of continuing to grow it — same pattern `encountered_errors_ii.md` already follows off `encountered_errors.md`: increment the numeral suffix (`_iii.md`, `_iv.md`, ...), open it with a one-line pointer back to the previous file ("Continuation of [...]. Same Problem / Explanation / Solution format."), and append new entries there going forward.

Scale the entry to the issue:
- **Syntax/concept-level** (e.g. language or API semantics, not tied to this codebase's specific files): write it generically, without file names, component names, or project-specific types — it should read the same in any codebase.
- **Codebase-specific/complex** (a real bug, a library quirk, a design decision): keep concrete references — file paths, component/type names, code snippets — since the fix only makes sense in that context.

# Reference links in logged discussions

When a discussion that gets logged (per "Logging minor issues" above) involved links the user shared — docs, a GitHub PR/issue, an external article — include them in the log entry as a **References** list at the end, so the source stays attached to the reasoning.

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

# Code comments

Keep inline comments to 1–3 lines. State the non-obvious *why* — a constraint, a gotcha, a magic number's derivation — not what the code already says. Show the arithmetic for a computed constant (`marginTop: 22 // 14 parent pad + 8 gap`), not a prose paragraph.

When the reasoning is longer than that, put it in `documentation/log/encountered_errors_ii.md` (or a dedicated doc) and leave a one-line pointer in the code: `// why: encountered_errors_ii.md (YYYY-MM-DD)`. The date is the entry heading's timestamp so the reference stays findable.

# Walking through a function

When asked to walk through or explain a function (or a small group of related functions):
- One-line purpose per function: what it takes, what it returns, why it exists in the flow.
- A concrete example: a real input value from the codebase and the exact output value it produces.
- Trace the branches: a second example that hits the optional paths / guards / error cases.
- For pipelines (map/filter/reduce, `Object.entries`/`fromEntries`, chained transforms): show the intermediate value between every step.
- Close with a flow diagram tying the functions together: source data → each transform → final consumer.
- Use real values and names from the code, not `foo`/`bar`.

# BottomSheet issues — check lift-fe-mobile first

Our `src/components/bottomsheet/BottomSheet.tsx` is a from-scratch recreation
modeled on `@lift-ui-kit/react-native`'s `BottomSheet`, used throughout
`/Users/admin/repository/lift-fe-mobile`. Before diagnosing or fixing any
BottomSheet-related bug here (sizing/height, sticky headers, keyboard
avoidance, drag/snap behavior, stale props on a pushed sheet, etc.), check
whether the original already solved the same problem:
- Library source: `lift-fe-mobile/node_modules/@lift-ui-kit/react-native/src/components/molecules/BottomSheet/BottomSheet.tsx`
  and `BottomSheetStack.tsx` in the same folder.
- Real usages worth cross-referencing: `src/journeys/booking/screens/GuestDetails/components/GuestDetailsPassengerSheet.tsx`,
  `GuestDetailsForm.tsx`, `GuestDetailsPassportSheet.tsx`, `modals/BaseModal.tsx`.

Their solution is frequently more precise than an obvious first fix (e.g. a
content wrapper's height is driven by an explicit `useAnimatedStyle`
computed off the same shared values as the drag/snap animation, not a static
`flex-1`) — read their approach before reinventing one from scratch.

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
