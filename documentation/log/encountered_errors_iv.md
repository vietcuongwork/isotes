# Encountered errors (IV)

Continuation of [encountered_errors_iii.md](./encountered_errors_iii.md). Same
**Problem / Explanation / Solution** format.

---

## `typeof`/`keyof` on an imported plain-object module, and importing a `module.exports` object as a value (2026-09-19)

**Problem**
Given a plain CommonJS module like:
```js
// color.js
module.exports = {
  colors: {
    member: {
      sand: "#D9C48A",
      olive: "#A8C98A",
      // ...
    },
  },
};
```
and a derived type:
```ts
import { colors } from "./color";
type MemberColor = keyof typeof colors.member;
```
it wasn't clear (a) that `colors` — a runtime JS object — can be imported
and used directly as a *value*, and (b) what `keyof typeof colors.member`
actually produces.

**Explanation**
- `import { colors } from "./color"` imports the real object at runtime,
  same as importing it in a `.js` file — there's nothing TS-specific about
  being able to import a plain object exported via `module.exports`/`export`.
  Once imported, it can be used as a value (e.g. `colors.member.olive`) or
  fed into a type position.
- `typeof x` in a **type position** is TypeScript's own operator (distinct
  from the JS runtime `typeof`, which returns a string like `"object"`).
  It takes a value and produces the *type* TS inferred for it. So
  `typeof colors.member` is the object type:
  ```ts
  { sand: string; olive: string; /* ...rest of the keys, each string */ }
  ```
- `keyof (object type)` produces a union of that object's key names as
  string-literal types: `keyof typeof colors.member` becomes
  `"sand" | "olive" | "citron" | ...` — one literal per key currently in the
  object.
- Naming that union (`type MemberColor = keyof typeof colors.member`) gives
  a reusable type that only accepts one of those exact key strings, and
  stays in sync automatically: renaming or adding a key in the source object
  changes the union without touching the type alias.

**Solution**
No fix needed — this was a comprehension question, not a bug. Use
`keyof typeof someObject` whenever a prop/parameter should be restricted to
"one of this object's own keys," instead of hand-maintaining a parallel
union type that can drift out of sync with the object.

---

## `members.memberColor`'s enum array is hand-kept in sync with `MemberColor`, not derived from it (2026-09-19)

**Problem**
`src/db/schema.ts`'s `members.memberColor` column needs the same 12 keys as
`MemberColor` (`src/types/TExpense.ts`, `keyof typeof colors.member` from
`color.js`). Since `Object.keys(colors.member)` is available at runtime, it
was worth asking whether the schema's enum array could just be derived from
it instead of duplicated by hand.

**Explanation**
Decided against deriving it, even though it's technically possible via
`Object.keys(colors.member) as [MemberColor, ...MemberColor[]]`:
- A palette edit in `color.js` would then silently change what the DB
  column accepts — a migration-affecting change with no visible diff in
  `schema.ts` itself, which is a surprising place for that to happen from.
- It would pull a theme/design-token import (`@/themes/color`) into the DB
  layer, which currently has no UI-layer imports at all.
- The palette is a fixed design decision (12 named colours), not
  user-generated or frequently-changing data — the case where derivation
  earns back its cost (avoiding repeated manual edits) doesn't really apply.

**Solution**
Kept `schema.ts`'s `memberColor` enum array hand-written, with a comment
pointing at `MemberColor` (`src/types/TExpense.ts`) and vice versa, so
editing one is a deliberate prompt to check the other — sync by convention,
not automation.

---

## `currencySchema` in `createProjectFormSchema.ts` was missing `decimalDigits`, silently narrowing `CreateTripFormData["currency"]` (2026-09-20)

**Problem**
`src/features/createTrip/validation/createProjectFormSchema.ts`'s
`currencySchema` (a zod object) only declared `name`/`code`/`symbol`. Since
`CreateTripFormData = z.infer<typeof createTripFormSchema>`, the inferred
`currency` field was missing `decimalDigits` — even though the real
`Currency` type (`src/types/TCreateTrip.ts`) has it. This surfaced as a type
error passing `value={value}` into `CurrencyField`, which requires the full
`Currency` shape.

**Explanation**
Two fixes were considered and dropped before the simple one:
- `z.custom<Currency>(predicate)` — works, but replaces zod's per-field
  validation with one opaque predicate over the whole object, so
  `errors.currency.code` etc. would no longer exist, only a single generic
  `errors.currency` message. Rejected because it's a real capability loss
  even if this form's `CurrencyField` (a picker trigger, not per-field
  inputs) wouldn't currently exploit it.
- A hand-rolled `toZod` helper (`<T>() => <S extends z.ZodType<T>>(schema: S)
  => schema`) to catch schema/type drift at compile time. This turned out to
  only check assignability (a schema with *extra* fields, or narrower field
  types, would still satisfy `S extends z.ZodType<T>` silently) — a much
  weaker guarantee than it looks like it gives. A real `z.toZod` exists
  upstream (colinhacks/zod PR #5913) with exact per-key type equality
  checking, but it ships in zod's `4.5.x` line, which as of this entry only
  has unpublished canary builds (`4.5.0-canary.*`) — not something to depend
  on for a real feature, and not worth approximating with a version that
  gives false confidence.

**Solution**
Added the missing field directly:
```ts
// Keep in sync with Currency (src/types/TCreateTrip.ts) by hand.
const currencySchema = z.object({
  name: z.string(),
  code: z.string(),
  symbol: z.string(),
  decimalDigits: z.number(),
});
```
Same "sync by convention, not automation" call as `memberColor` above — the
object is small (4 fields) and changes rarely, so a pointer comment costs
less than either of the more clever options.

**References**
- https://zod.dev/api#custom
- https://github.com/colinhacks/zod/pull/5913/changes#diff-22c8e6df681ac92b8f6c73108cc92d6f75c13232421cb54f7024195a9b631980

---

## When a value needs an `undefined` guard vs when it doesn't: a live/synchronous read vs a resolved promise (2026-09-20)

**Problem**
Two async data-reading patterns look similar (both eventually hand you rows
to map/transform into a UI type) but only one of them actually needs an
`undefined` guard before that mapping happens.

**Explanation**
- A hook that subscribes to a data source and re-renders as it changes
  exposes its data as a value read on every render. Before the first result
  exists, a render happens with that value as `undefined` — its type
  reflects this (`T | undefined`), and any code consuming it must narrow it
  first.
- A promise's `.then(callback)` only ever runs once the promise has resolved
  with a real value. There's no "not loaded yet" branch inside that
  callback — if a loading state is needed, it's tracked separately (e.g. a
  boolean flag set before the call and cleared in `.finally`), not encoded
  in the resolved value's type. The resolved value is never `undefined`
  because of loading; at most it's an empty collection if there was nothing
  to return.

**Solution**
Guard only where the type actually says `| undefined`: narrow
(`value ? fn(value) : fallback`) at the point of reading a live/synchronous
value. For a promise's resolved value, don't add a redundant undefined
check or fabricate a placeholder object to satisfy a mapping function's
input type — trust the type, and let a genuinely empty result flow through
as an empty collection (e.g. `.map()` over `[]` already returns `[]`)
instead of a fake fallback.
