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

---

## Split-by-amounts defaulted to 0 for VND but not USD, from `Number(amount)` instead of `parseAmountInput(amount)` (2026-09-24)

**Problem**
On the "Amounts" split screen, VND expenses showed every member's field as
`0` and "0 of 3 have an amount", while `SplitSummary.tsx`'s "Fully assigned"
line above them reported the correct total from the same store value. USD
expenses under 1,000 didn't show the bug at all.

**Explanation**
`useExpenseSheetStore`'s `amount` is a display-formatted string —
`formatAmountInput` (`src/utils/currency.ts`) inserts thousands commas once
the integer part crosses 1,000, regardless of the currency's
`decimalDigits`. A ₫10,000 expense is stored as the literal string
`"10,000"`; a $10 expense never reaches 1,000, so it stays `"10"` with no
comma. `useSplitBottomSheet.ts` and `SelectionSummaryBar.tsx` both read that
value with `Number(amount) || 0` instead of the codebase's own
`parseAmountInput` (which strips commas before parsing, exactly for this
reason — see its comment in `currency.ts`). `Number("10,000")` is `NaN`, so
`|| 0` silently produced `0`, which then flowed into `effectiveAmounts`'s
`equalShare = (0 / memberCount).toFixed(decimalDigits)`. `SplitSummary.tsx`
was unaffected because it already used `parseAmountInput(totalAmount)` —
same store value, two different parsers, inconsistent result on the same
screen.

**Solution**
Replaced both `Number(useExpenseSheetStore((s) => s.amount)) || 0` call
sites with `parseAmountInput(useExpenseSheetStore((s) => s.amount))`,
importing it from `@/utils/currency` in `useSplitBottomSheet.ts` (already
imported in `SelectionSummaryBar.tsx`). Any code reading the store's
`amount` string for arithmetic should go through `parseAmountInput`, never
`Number(...)` directly, since the string is comma-grouped display text, not
a plain numeric literal.

---

## Split-preview amounts diverged from persisted values — `distributeRemainderToPayer` never applied to the display path (2026-09-25)

**Problem**
`useSplitBottomSheet.ts`'s `effectiveShareAmounts` (the dollar figure shown
next to each member's shares stepper) could show a different number than
what actually got saved to `expenseSplits.individualAmount` on submit.
`effectiveAmounts` (the "amounts" split's per-member fallback default) had
a related but separate issue: its own duplicated base-math calc could
diverge from the real one even before remainder was considered.

**Explanation**
The real persisted values come from `resolveSplitAmounts`
(`expenseHelpers.ts`): `computeSplitRows` computes each method's base
per-member amount, then `distributeRemainderToPayer` adds whatever
rounding leftover remains onto the *payer's* row so the split always sums
exactly to the total. `effectiveShareAmounts` reimplemented only the base
"shares" math inline (with a comment noting it was "kept in sync
manually") and never called `distributeRemainderToPayer` — `paidByMemberId`
wasn't even pulled into the hook's scope. So the payer's row in the
stepper UI never showed the extra/fewer cents `resolveSplitAmounts` would
silently add on save. Separately, `effectiveAmounts`'s "amounts" fallback
used a raw `(totalAmount / members.length).toFixed(decimalDigits)` instead
of the shared `getEffectiveSplitAmounts` helper `computeSplitRows` itself
uses, so it could diverge on the base number alone.

**Solution**
Fixed each field according to what it actually is, not identically:
- `effectiveShareAmounts` is a **read-only** `<Text>` (`SharesStepper`'s
  amount label in `MemberListRow.tsx`, never an editable field), so it's
  safe to mirror the real persisted math exactly. It now calls
  `resolveSplitAmounts(members, "shares", totalAmount, decimalDigits,
  selection, paidByMemberId)` directly (`paidByMemberId` newly pulled from
  `useExpenseSheetStore`) instead of re-deriving the arithmetic, so display
  and persistence share one implementation.
- `effectiveAmounts` feeds a **live-typed** `TextInput` (`AmountsInput` in
  `MemberListRow.tsx`, re-masked via `formatAmountInput` on every render).
  Routing it through `distributeRemainderToPayer` too would silently
  rewrite the payer's own field with extra/fewer cents mid-keystroke, so it
  was fixed only to call the shared `getEffectiveSplitAmounts` base-math
  helper (no remainder step) — same fix category, deliberately narrower
  scope. `SplitSummary.tsx` already separately surfaces the "amounts"
  split's imbalance, so this field was never meant to show the
  remainder-adjusted persisted number.

---

## A focused `TextInput` blurs the instant a sibling `BottomSheet` mounts — a Fabric mounting-transaction side effect, not our code (2026-09-28)

**Problem**
Building a custom numpad keyboard (`src/components/numberpad/`) for
`AmountField.tsx` and `MemberListRow.tsx`'s `AmountsInput`: tapping the
amount `TextInput` (with `showSoftInputOnFocus={false}`, so no real
keyboard shows) focused it correctly — the caret appeared — but it blurred
again within ~15–70ms, right as the pushed `NumberPadBottomSheet` mounted.
Visually: the cursor flickers on then instantly vanishes.

**Explanation**
Every plausible JS-level theory was tried and disproven, each backed by a
log before moving to the next (see "Debugging — confirm with logs before
fixing" in `AGENTS.md`):
- `showSoftInputOnFocus` fighting `react-native-keyboard-controller`'s
  native keyboard tracking → disproven (`KeyboardController.dismiss({
  keepFocus: true })` never even reached the native side; its `isClosed`
  guard short-circuited because the real keyboard never opens).
- `BottomSheet.tsx`'s `panGesture` (`Gesture.Pan()`) being recreated on
  every render, forcing `GestureDetector` to re-register its native
  recognizer whenever `BottomSheetStackProvider`'s `sheets` state changed
  anywhere in the stack → disproven (memoizing it made no difference).
- `BottomSheet.tsx`'s backdrop `Animated.View` flipping `pointerEvents`
  from `"none"` to `"auto"` the moment `isOpen && sheetHeight > 0` →
  disproven (forcing it to stay `"none"` the whole time didn't help).
- The dynamic-sizing content-measurement path (`handleContentLayout` →
  `useAnimatedReaction` → `sheetHeight.value = newHeight`) → disproven
  (switching to a fixed `snapPoints` sheet, which skips that path
  entirely, didn't help).
- `GestureDetector` mounting at all (not just re-registering) → disproven
  (removing it from the sheet entirely didn't help).
- `BottomSheetStack.tsx`'s `StackedSheetWrapper` wrapper `View`'s
  synchronous, un-animated `pointerEvents={isTopSheet ? "auto" : "none"}`
  → disproven (forcing it to stay `"none"` for the pushed sheet didn't
  help).
- Finally, swapping `NumberPadBottomSheet`'s entire render for an inert
  stub `<View>` — zero Reanimated, zero gestures, zero custom
  `pointerEvents`, still pushed through the same `pushSheet`/
  `StackedSheetWrapper` path → the blur **still happened**. That isolated
  it to `BottomSheetStackProvider`/`pushSheet` itself, or something even
  more fundamental about inserting a sibling into the tree.

At that point JS-level instrumentation hit its ceiling — RN's
`TextInput.onBlur` carries no `relatedTarget`/caller info (unlike the DOM
`FocusEvent`), so there is no way to see *why* from JS. The actual answer
came from a native symbolic breakpoint on `-[UIResponder
resignFirstResponder]` in Xcode (Product breakpoint navigator → + →
Symbolic Breakpoint → add a Debugger Command `bt` with "automatically
continue" checked, so it logs every hit without ever halting the app). The
backtrace right before the blur:

```
-[UITextField resignFirstResponder]
__UIViewWillBeRemovedFromSuperview
-[UIView(Hierarchy) removeFromSuperview]
-[RCTViewComponentView unmountChildComponentView:index:]
RCTPerformMountInstructions(...)
```

React Native's Fabric mounting manager, applying the native view mutations
for the commit that inserts the new sheet as a sibling elsewhere in the
tree, emits an `unmountChildComponentView:index:` instruction that detaches
some other `RCTViewComponentView` (a sibling being reordered/reinserted,
unrelated to the numpad itself) from its superview as part of the *same*
transaction. UIKit's `__UIViewWillBeRemovedFromSuperview` hook automatically
calls `resignFirstResponder` on any focused text field whose native view is
detached — even momentarily, even if it's reattached immediately after. This
is why every variant above (real sheet, no gestures, no backdrop, fixed
sizing, even the bare stub) triggered it identically: they all insert a new
sibling into the same parent tree via `BottomSheetStackProvider`, and
Fabric's mounting-instruction batching does this detach/reattach regardless
of what that sibling actually is. It is a platform/renderer-level quirk, not
a bug in `BottomSheet.tsx`, `BottomSheetStack.tsx`, or the numpad feature —
a true native `Modal` (its own `UIWindow`) would sidestep it, but that's a
much bigger architecture change than this custom, from-scratch `BottomSheet`
was built for.

**Solution**
Since there's no smaller code change that avoids the detach/reattach,
refocus the `TextInput` after it happens — but only while the numpad sheet
is still meant to be open, tracked with explicit state
(`isNumberPadOpen`/`setNumberPadOpen`, in `useAddExpenseBottomSheet.ts` for
`AmountField` and local `useState` in `AmountsInput` for the per-member
case), not a blind time window. The sheet's `onClose` sets it back to
`false` before calling `popSheet()`, so a legitimate close is never fought:

```tsx
onBlur={() => {
  if (isNumberPadOpen) {
    requestAnimationFrame(() => inputRef.current?.focus());
  }
}}
```

**References**
- https://adueck.github.io/blog/keep-focus-when-clicking-on-element-react/
  (the web-only `e.relatedTarget` pattern that prompted checking whether RN's
  `TextInput.onBlur` has an equivalent — it doesn't)

---

## `pushSheet({ component: <X onClose={...} /> })`'s `onClose` prop is always discarded — use `onDismiss` (2026-09-28)

**Problem**
Wiring `setNumberPadOpen(false)` into `<NumberPadBottomSheet onClose={() =>
{ setNumberPadOpen(false); popSheet(); }} />` (passed as `pushSheet`'s
`component`): the callback never ran, on any dismissal path (swipe-down,
backdrop tap, or an external `popSheet()` call) — confirmed with a
`console.log` inside it that never printed.

**Explanation**
`BottomSheetStack.tsx`'s `StackedSheetWrapper` does:
```tsx
const element = cloneElement(sheet.component, {
  ref: mergedRef,
  onClose: () => {
    sheet.onDismiss?.();
    onClose(); // StackedSheetWrapper's own prop — removeSheet(sheet.id)
  },
});
```
`cloneElement`'s second argument **overwrites** props of the same name on
the element being cloned. Whatever `onClose` you write on the JSX element
passed as `component` to `pushSheet` is unconditionally replaced by this
wrapper closure before the component ever sees it — it's discarded
regardless of how the sheet closes. This is true for every existing
`pushSheet({ component: <X onClose={...} /> })` call site in the codebase
(e.g. `handleDateFieldPress`'s `onClose={popSheet}` on `AddDateBottomSheet`)
— it just never mattered there because nothing extra needed to happen on
close beyond the wrapper's own `removeSheet`.

**Solution**
Side effects that must run when a pushed sheet closes belong in `pushSheet`'s
separate `onDismiss` option, which the wrapper calls *before* its own
cleanup (`sheet.onDismiss?.()`) — not in the `component` JSX's `onClose`
prop, which exists only because `BottomSheet.tsx` itself requires an
`onClose` to call once its close animation finishes (pass `popSheet` there
for that internal plumbing, but treat it as inert for anything else):
```tsx
pushSheet({
  component: <NumberPadBottomSheet onClose={popSheet} />,
  onDismiss: () => setNumberPadOpen(false),
});
```

---

## Passing `ref.current` as a prop value snapshots it at render time — pass the ref object instead (2026-09-28)

**Problem**
`AmountField`'s `isIntentionalDismiss` guard (skip the refocus-on-spurious-blur
logic during a deliberate close) was fed via
`isIntentionalDissmiss={isIntentionalDismiss.current}` — reading `.current`
and handing the boolean *value* to the child as a prop.

**Explanation**
Mutating `.current` doesn't by itself trigger a re-render (refs are
explicitly designed not to). Whether the child ever saw the updated value
depended entirely on some *other* re-render happening to fire before the
native `onBlur` bridge event arrived, and picking up the mutated `.current`
along the way — an incidental, non-obvious coupling between two lines that
don't look related (`isIntentionalDismiss.current = true` and
`setNumberPadOpen(false)` in the same callback). Reorder those two
statements, or move `setNumberPadOpen(false)` elsewhere later, and the guard
would silently go back to always reading `false`.

Also confirmed while chasing this: `TextInput.onBlur` in React Native isn't
synchronous with a `.blur()` call. `.blur()` only kicks off native focus
resignation; the `onBlur` JS callback is delivered later via the bridge once
the native event actually fires — so any prop the callback depends on has
to already be updated by render time, not "whenever the code calling
`.blur()` happens to run."

**Solution**
Pass the ref object itself as the prop, and read `.current` live inside the
callback that needs it, instead of dereferencing before handing it down:
```tsx
// AddExpenseBottomSheet.tsx
<AmountField isIntentionalDismiss={isIntentionalDismiss} ... />

// AmountField.tsx
onBlur={() => {
  if (isIntentionalDismiss.current) return;
  ...
}}
```
This removes the dependency on re-render timing — the ref is read at the
exact moment `onBlur` fires, not baked into a prop snapshot from whenever
the parent last rendered.

## Scrolling a field above a custom (non-keyboard) sheet — animate the scroll offset, not the reserved space (2026-09-28)

**Problem**
`useScrollFieldAboveSheet.ts` reserves `extraBottomSpace` so a field can
scroll above `NumberPadBottomSheet`. Shrinking that space back to 0 on close
either snapped (LayoutAnimation), broke scrolling (Reanimated shared value),
or stuttered (stepping plain state every `requestAnimationFrame` — ~36
re-renders of the whole `SplitBottomSheet` tree).

**Explanation**
- LayoutAnimation does nothing in this app on iOS/Fabric, even for a plain
  `View`'s height outside any list. Confirmed with an isolated test screen:
  `Platform.isDisableAnimations === false`, `nativeFabricUIManager.configureNextLayoutAnimation`
  exists, `onAnimationDidFail` never fires, native layout does change
  (`onLayout` 300 → 40), yet it always snaps. Root cause not found (native side).
- `configureNext`'s end callback is **not** proof anything animated: RN races
  it against a `setTimeout(duration + 17)` (`LayoutAnimation.js`), so it
  always fires.
- `KeyboardAwareScrollView` never animates layout. Its reserved space is a
  non-layout `contentInset` set in full up front; on close it only moves the
  scroll offset back (Reanimated `scrollTo` per keyboard frame, to the offset
  saved before the keyboard opened), then drops the inset to 0 in `onEnd`.
  No jump, because that offset was valid before the space existed.

**Solution**
Same shape in `useScrollFieldAboveSheet.ts`: save `offsetBeforeOpenRef` on a
fresh open; on close `scrollTo(offsetBeforeOpenRef.current)` (native animated
scroll), then `setExtraBottomSpace(0)` once after `SCROLL_BACK_MS`. Two
re-renders per close instead of ~36.

**References**
- `node_modules/react-native-keyboard-controller/src/components/KeyboardAwareScrollView/index.tsx` (`onStart`/`onMove`/`onEnd`, `maybeScroll`, `removeGhostPadding`)
- `node_modules/react-native/Libraries/LayoutAnimation/LayoutAnimation.js` (`configureNext` timeout race)
