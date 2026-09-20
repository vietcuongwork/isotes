# Encountered errors (III)

Continuation of [encountered_errors_ii.md](./encountered_errors_ii.md). Same
**Problem / Explanation / Solution** format.

---

## `BottomSheet.tsx`'s content wrapper had no bounded height, so a `FlatList` child (with `flex-1`) had nothing to flex against — fixed by porting lift-fe-mobile's explicit animated height (2026-09-17)

**Problem**
`PaidByBottomSheet.tsx` and `SplitBottomSheet.tsx` (both `snapPoints={["80%"]}`)
put a `FlatList` between a fixed header/search block and a fixed `AddPerson`
footer, expecting the header/search/footer to stay put ("sticky") while only
the member list scrolled. Once the member list was long enough, list rows
kept rendering past the sheet's visible 80%-height boundary and `AddPerson`
ended up invisible, clipped below the sheet — even though `FlatList` had
`className="flex-1"` set.

**Explanation**
`flex-1` on `FlatList` only has an effect if its *immediate parent* is itself
bounded and has leftover space to hand out. In `src/components/bottomsheet/BottomSheet.tsx`,
the outer `Animated.View` does get a real fixed height for `snapPoints`
sheets (`sheetStyle` merges `height: sheetHeight.value`) — but its child,
`<View onLayout={handleContentLayout}>{children}</View>`, had no
`flex`/height styling at all. Under Yoga's default column layout, a plain
`View` sizes to the natural sum of its children's heights, not to its own
parent's fixed height; a fixed height on a grandparent does not
automatically propagate down two levels unless every intervening View
participates (via `flex`, `height`, or `%`). So that wrapper just grew past
80% of the screen, got silently clipped by the `Animated.View`'s
`overflow-hidden`, and `FlatList`'s own `flex-1` had no bounded parent to
grow into — it was effectively a no-op.

This exact class of bug was already solved in the library our `BottomSheet.tsx`
was recreated from: `@lift-ui-kit/react-native`'s `BottomSheet`
(`lift-fe-mobile/node_modules/@lift-ui-kit/react-native/src/components/molecules/BottomSheet/BottomSheet.tsx`).
Rather than a static `flex-1`, it computes an **explicit animated height**
for the content wrapper, off the same shared values that drive the sheet's
drag/snap animation:
```tsx
const fixedContentWrapperAnimatedStyle = useAnimatedStyle(() => {
  if (isDynamicSizing) return {};
  const visibleSheetHeight = maxSheetHeight.value - translateY.value;
  const contentHeight = visibleSheetHeight - measuredHandleHeight.value;
  return { height: Math.max(0, contentHeight) };
});
```
This is more precise than `flex-1` in two ways: it tracks the sheet's live
*visible* height during drag (since `translateY` changes continuously while
dragging between snap points, not just once on open), and it subtracts the
handle's actual *measured* height (via its own `onLayout`) rather than
assuming/ignoring it.

**Solution**
Ported the same technique into `BottomSheet.tsx`:
- Added `measuredHandleHeight` (a shared value) and `handleHandleLayout`,
  measuring the handle block's real height via `onLayout`, folded into the
  existing dynamic-sizing height reaction (`measuredContentHeight.value + measuredHandleHeight.value`).
- Added `fixedContentWrapperStyle`, the same `useAnimatedStyle` computation
  as above, applied to an `Animated.View` (not a plain `View`) wrapping
  `children`, used only when `!isDynamicSizing` — dynamic-sizing sheets
  (`AddDateBottomSheet`) still use the plain `onLayout`-measured `View`
  unchanged, since they depend on its *natural* content height for
  auto-sizing; giving them an explicit height too would break that
  measurement.
- With the wrapper now genuinely bounded, `FlatList`'s existing `className="flex-1"`
  (in both `PaidByBottomSheet.tsx` and `SplitBottomSheet.tsx`) finally has a
  real parent to flex against, and the header/search/`AddPerson` are sticky
  for free — they're already plain siblings outside `FlatList`, not
  `ListHeaderComponent`/`ListFooterComponent` inside it.

General takeaway, now in `AGENTS.md`: this `BottomSheet.tsx` is a recreation
of `@lift-ui-kit/react-native`'s `BottomSheet` — check that library's source
(and its real usages, e.g. `GuestDetailsPassengerSheet.tsx`/`GuestDetailsForm.tsx`
in `lift-fe-mobile`) before inventing a fix for a BottomSheet-shaped problem
here; it likely already solved the same problem, often more precisely than
an obvious first attempt.

---

## `FlatList` has no keyboard-avoidance, and nesting it inside `KeyboardAwareScrollView` breaks scrolling — the fix is `renderScrollComponent`, not wrapping (2026-09-17)

**Problem**
Neither `FlatList` (a `VirtualizedList`) nor our `BottomSheet.tsx` does
anything when the keyboard opens — no resizing, no scrolling the focused
input into view. Typing in `PaidByBottomSheet.tsx`'s search bar or
`SplitBottomSheet.tsx`'s Amounts-variant `TextInput` (inside `MemberRow.tsx`)
could end up hidden behind the keyboard with nothing compensating. A first
attempt at fixing this — nesting the existing `<FlatList>` as a child inside
`<KeyboardAwareScrollView>` — didn't work.

**Explanation**
`react-native-keyboard-controller`'s `KeyboardAwareScrollView` (used
elsewhere in this codebase — `AddExpenseBottomSheet.tsx`,
`CreateProjectScreen.tsx`) is API-compatible with `ScrollView`. Nesting a
`FlatList` inside it is the classic React Native anti-pattern of a
`VirtualizedList` inside a plain `ScrollView` sharing the same scroll
orientation: the outer scroll view's gesture/scroll handling fights with
`FlatList`'s own internal virtualization and windowing, so scrolling breaks
or goes janky — and keyboard-focus tracking (which works by the scroll view
measuring its own *direct* children's layout to know how far to scroll) has
no visibility into a nested virtualized list's individual row layouts, so it
can't scroll a focused input inside one into view anyway.

The library's own docs (FlatList/FlashList/SectionList Integration section
of the `KeyboardAwareScrollView` docs) are explicit that it deliberately
does **not** export a `KeyboardAwareFlatList` — instead, `FlatList` stays the
outer/owning component, and `KeyboardAwareScrollView` is injected as its
*internal* scroll engine via the `renderScrollComponent` prop:
```tsx
<FlatList
  renderScrollComponent={(props) => <KeyboardAwareScrollView {...props} />}
/>
```

**Solution**
Applied `renderScrollComponent` directly on the existing `FlatList` in both
`PaidByBottomSheet.tsx` and `SplitBottomSheet.tsx` — no nesting, no change to
`data`/`renderItem`/`keyExtractor`/`contentContainerStyle`. Extra
`KeyboardAwareScrollView`-only props (`bottomOffset`, `extraKeyboardSpace`,
`keyboardShouldPersistTaps`, etc., as already used in
`AddExpenseBottomSheet.tsx`) can be added after the `{...props}` spread
inside the render function — safe to append since `FlatList` never sets
those particular props itself, so there's no merge conflict:
```tsx
renderScrollComponent={(props) => (
  <KeyboardAwareScrollView {...props} bottomOffset={50} />
)}
```
General rule: when a component needs *both* `FlatList`'s virtualization and
`KeyboardAwareScrollView`'s keyboard handling, inject via
`renderScrollComponent` — never nest one inside the other.

---

## Reactive store values passed as props into a pushed `BottomSheetStack` sheet are frozen at push-time (2026-09-17)

**Problem**
`PaidByBottomSheet` and `SplitBottomSheet` were originally given the "live"
selection state as props from `PaidAndSplitSection.tsx` — e.g.
`selectedMemberIds={splitMemberId}`, sourced from
`useExpenseSheetStore((s) => s.splitMemberId)` in the parent. Tapping a
member row inside the pushed sheet correctly called the store setter (the
store's `splitMemberId` really did update), but the sheet's own UI —
checkmarks, highlighted background — never visibly updated to reflect the
new selection. Only closing and reopening the sheet showed the change.

**Explanation**
`useBottomSheetStack()`'s `pushSheet` (`src/components/bottomsheet/BottomSheetStack.tsx`)
takes a `ReactElement` — e.g. `<SplitBottomSheet selectedMemberIds={splitMemberId} .../>`
— already fully constructed with its props evaluated at the call site, inside
the `onPress` handler that calls `handlePeopleSummaryRowPress`. A
`ReactElement` is a plain, immutable object (`{type, props, key, ref}`); once
created, `.props.selectedMemberIds` is permanently whatever the store held at
that exact JS tick. `pushSheet` stores that frozen element in `sheets` state,
and `StackedSheetWrapper` later renders it via
`cloneElement(sheet.component, { ref: mergedRef, onClose: ... })` —
`cloneElement` only overrides the two keys it's given; every other prop rides
along unchanged from the frozen snapshot.

When a row tap fires the real Zustand setter, `PaidAndSplitSection`
re-renders (it subscribes to the same store slice) — but re-rendering
`PaidAndSplitSection` does not call `pushSheet` again; that only happens on
the next `onPress`. The already-pushed element sitting in
`BottomSheetStackProvider`'s `sheets` array is never recreated, so the sheet
component keeps computing `isSelected = selectedMemberIds.includes(...)`
against the stale array from the moment it was opened. The underlying data
was always correct — only the sheet's own rendering of it was stuck.

**Solution**
Any value that must reflect live external state inside a component rendered
through this push-once queue has to be sourced by the component itself
subscribing directly to the source of truth, not via a prop passed in at the
`pushSheet(...)` call site (which is a one-time snapshot, never a live
binding). Fixed in both `PaidByBottomSheet.tsx` and `SplitBottomSheet.tsx` by
reading directly off `useExpenseSheetStore` inside the sheet component
itself:
```tsx
const selectedMemberIds = useExpenseSheetStore((s) => s.splitMemberId);
const onChangeSelected = useExpenseSheetStore((s) => s.setSplitMemberId);
const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
const selectedAmounts = useExpenseSheetStore((s) => s.splitAmounts);
const onChangeAmounts = useExpenseSheetStore((s) => s.setSplitAmounts);
```
`SplitBottomSheetProps`/`PaidByBottomSheetProps` now only carry `members`,
`onAddPerson`, and `onClose` — values that don't need to be "live" across the
sheet's open lifetime. General rule for this codebase: never pass a
store-derived value as a prop into a `pushSheet` element if the sheet needs
to see later updates to it — pull it from the store inside the pushed
component instead.

---

## A plain object literal used to seed store/reset state widens string-literal fields, breaking assignability to the typed interface (2026-09-17)

**Problem**
A Zustand (or similar) store defines its state shape as an interface with a
union-typed field (e.g. `status: "idle" | "loading" | "done"`), then builds
an `initialState` object literal — spread into the store's initializer and
reused in a `reset()` — without annotating that object's type. TypeScript
then reports the spread/`reset` call as not assignable to the state
interface, even though the literal value looks correct at a glance.

**Explanation**
Without a type annotation, TypeScript infers an object literal's property
types by widening: a property initialized to `"idle"` is inferred as the
general `string`, not the literal type `"idle"`. That's normal behavior for
a plain `const` object — literal types are only preserved with `as const`,
an explicit `as SomeUnion` cast, or by annotating the object against a type
that itself pins the field to the union. So `string` ends up incompatible
with the interface's narrower union field, and every place that object gets
used against the interface (a spread into the store, an argument to `set()`)
fails to typecheck.

**Solution**
Annotate the object against the state type (minus the action/method keys it
doesn't include), rather than casting each literal field individually:
```ts
const initialState: Omit<StoreState, "setStatus" | "reset"> = {
  status: "idle", // now correctly narrowed to the union, not widened to string
  // ...other fields
};
```
This scales better than annotating a single field with `as SomeUnion`,
since it automatically catches the same widening for any future field added
to the interface, not just the one that happened to trigger the error.

---

## Draft-reset guard on `onAnimate` couldn't survive an interrupted close (2026-09-12)

**Problem**
`AddDateBottomSheet` seeds a local `draftDate` from the committed `selectedDate`
on open, so Cancel/swipe/backdrop can discard the draft. The reset was wired
to `BottomSheetModal`'s `onAnimate` callback. Two bugs surfaced in sequence
while getting this right:

1. Guarding on the *close* transition (`fromIndex === 0 && toIndex === -1`)
   made `Done` intermittently revert to the previous committed date instead
   of the one just picked.
2. After fixing (1) by guarding on the *open* transition instead
   (`toIndex === 0`), tapping the date field again while the sheet was still
   mid-close (interrupting it) reopened the sheet with a stale, uncommitted
   draft still showing — e.g. picking 4 Sep, tapping the backdrop to cancel,
   then immediately reopening showed "04 Sep 2026" still selected instead of
   resetting to the actual committed value.

**Explanation**
Bug (1): `handleDone` calls `onSelectDate(draftDate)` (schedules the
*parent's* `selectedDate` update) then `sheetRef.current?.dismiss()` in the
same handler. `dismiss()` starts the close animation, but `onAnimate` is
driven by a Reanimated shared value on the UI thread and calls back into JS
via `runOnJS` — a separate, later commit, not synchronous with the `onPress`
handler. So the parent's `selectedDate` commit could land *before* the
close-triggered guard actually ran, and the guard's closure — still holding
the pre-commit `selectedDate` — overwrote the fresh draft with the stale one.
Switching `draftDate` from `useState` to `useRef` didn't help here: the ref
made *draftDate* reads never stale, but the variable that was actually stale
was `selectedDate` (a plain destructured prop, fresh only as of whichever
render defined the specific closure that ended up running).

Bug (2): `BottomSheetModal` (unlike plain `BottomSheet`) mounts/unmounts its
portal content around `present()`/`dismiss()`. Calling `present()` while a
`dismiss()` is still resolving lands in a transition the library's animation
lifecycle doesn't cleanly fire `onAnimate` for — there's no reliable
`fromIndex`/`toIndex` pair to guard on when a close is interrupted by a new
open. No amount of fixing the guard's condition or the closure's staleness
helps if the callback body doesn't run at all for that interruption.

**Solution**
Stop resetting on any animation callback. Reset the draft at the one moment
that's never ambiguous: the instant the sheet is asked to open, before
`present()` is even called — by wrapping `present()` in the hook itself:

```ts
const handlePresent = () => {
  draftDate.current = selectedDate;
  setMonthId(selectedDate);
  sheetRef.current?.present();
};
```

---

## Clarifying what actually causes a re-render (2026-09-17)

**Problem**
Assumed a prop change and a parent's own re-render were two separate triggers
that could independently affect the same child — worth double-checking
whether React "batches" them into one render, or the child renders twice.

**Explanation**
A prop is never an independent trigger. Tracing any "re-rendered because a
prop changed" back far enough always lands on one of two true sources: a
component's own local state (`useState`/`useReducer`) or a subscription to
external state (context, a store selector). Everything else is propagation:
when a parent re-renders for one of those reasons, React calls every
non-memoized descendant's render function as part of that same synchronous
tree walk — not a second, separate render event that then needs merging with
the first. There was only ever one render to begin with.

`React.memo` is the only thing that turns "did this specific prop change"
into an actual gate: on a parent cascade, a memoized child's render call is
skipped if its shallow-compared props are referentially equal to last time.
Without `memo`, the child re-renders on every parent re-render regardless of
whether the props it receives actually differ.

**Solution**
Treat renders as originating only from local/subscribed state, propagating
down via unmemoized cascade. To stop an unrelated parent re-render from
re-rendering a child, wrap the child in `React.memo` rather than reasoning
about the prop in isolation.

This is synchronous and runs before any animation starts, so it can't race
a pending commit and doesn't depend on the library firing any particular
callback during an interrupted transition.

Since the parent must call `handlePresent` (not `sheetRef.current.present()`
directly) for this to take effect, `AddDateBottomSheet` now exposes a
curated handle via `useImperativeHandle` instead of forwarding the raw
`BottomSheetModal` ref:

```tsx
export interface AddDateBottomSheetHandle {
  present: () => void;
  dismiss: () => void;
}

const AddDateBottomSheet = forwardRef<AddDateBottomSheetHandle, AddDateBottomSheetProps>(
  function AddDateBottomSheet(props, ref) {
    const { sheetRef, handlePresent, handleDismiss, ... } = useAddDateBottomSheet(...);

    useImperativeHandle(ref, () => ({
      present: handlePresent,
      dismiss: handleDismiss,
    }));

    return <BottomSheetModal ref={sheetRef} ... />; // no mergeRefs needed anymore
  },
);
```

`mergeRefs` (see "[A component that uses its own forwarded ref internally
can't just pass it through]" in `encountered_errors_ii.md`) is no longer
needed on this element: it existed because both the forwarded `ref` and the
internal `sheetRef` needed the *same* raw `BottomSheetModal` instance. Now
only `sheetRef` does — `useImperativeHandle` satisfies the forwarded `ref`
with a synthesized object, independent of what's physically attached to the
element. The consuming screen's ref type changes from
`useRef<BottomSheetModal>` to `useRef<AddDateBottomSheetHandle>`, but every
call site (`addDateSheetRef.current?.present()` /
`.dismiss()`) is unchanged, since the handle exposes the same two methods.

---

## `Avatar.Stack` compound component: plain object vs. namespace merge, and the default-export conflict (2026-09-13)

**Problem**
Wanted `Avatar.Stack` (a stacked-avatar-with-overflow-count variant) attached
to the existing `Avatar` component, similar to a `TicketField.InfoField` /
`TicketField.SectionField` pattern already used elsewhere in the app. Copying
that pattern verbatim (`const Avatar = { Stack: AvatarStack }`) would have
broken every existing call site, since `Avatar` is already used directly as
a component everywhere (e.g. `<Avatar label={...} bg={...} />` in
`MemberRow.tsx`) — a plain object isn't callable/renderable as JSX.

Switching to a TS `namespace` merge instead (to attach `Stack` onto the
actual function) then hit a compiler error:

```
Merged declaration 'Avatar' cannot include a default export declaration.
Consider adding a separate 'export default Avatar' declaration instead.
```

**Explanation**
`TicketField`'s object-literal pattern only works because `TicketField`
itself is never rendered on its own — it's an inert grouping label for two
unrelated sibling components, so a plain object suffices. `Avatar` has to
stay both **callable** (`<Avatar/>`) and **carry a static** (`Avatar.Stack`),
which a plain object can't do — you need something that attaches a property
onto the actual function.

TypeScript supports this via declaration merging: a `function` and a
`namespace` sharing the same name merge into one symbol, with the namespace's
exports becoming typed statics on the function. But TS disallows putting
`export default` directly on the function declaration when a later
`namespace Avatar { ... }` block merges with it — the default-export marker
has to attach to the *merged* symbol, not just the function half of it.

**Solution**
Drop `export default` from the function declaration itself, and add a
separate `export default Avatar;` after the namespace block so it applies to
the fully-merged symbol:

```tsx
function Avatar(props: AvatarProps) {
  /* ... */
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Avatar {
  export function Stack(props: { members: AvatarProps[]; total?: number }) {
    /* ... */
  }
}

export default Avatar;
```

Alternative considered: skip `namespace` entirely and use
`export default Object.assign(Avatar, { Stack })` — no eslint-disable
needed, and closer to the `TicketField` object-literal style but applied to
a callable function instead of a plain object. Equivalent typing, kept
`namespace` here since it was already in place and both compile cleanly.

---

## Nested `BottomSheetModal` + keyboard + scroll corrupts layout (2026-09-13)

**Problem**
In `AddExpenseBottomSheet.tsx`, reproducible sequence: focus `AmountField`
(keyboard opens, `keyboardBehavior="extend"` expands the sheet) → scroll the
`BottomSheetScrollView` → press `ActivityField` to open `ActivityPicker`.
Content below the picker (`Paid & Split`, `AmountField`) renders blank —
not just visually covered, genuinely gone — and the sheet layout stays
corrupted for the rest of that presentation.

**Explanation**
`PaidAndSplitSection.tsx` unconditionally mounts `PaidByBottomSheet` — its
own `BottomSheetModal` — as a descendant inside `AddExpenseBottomSheet`'s
`BottomSheetModal` content tree, not as a sibling. Gorhom portals a modal's
*visual* output elsewhere, but React context still follows the actual JSX
tree, so the nested sheet inherits the outer sheet's internal
keyboard/content-height/animated-position context. Anything that forces the
outer sheet to recompute layout (keyboard-driven `extend`, then a scroll,
then the picker's `z-20` toggle) can corrupt or collide with the nested
sheet's own internal state. This matches gorhom's own troubleshooting notes
that nested `BottomSheetModal`s sharing one `BottomSheetModalProvider` are
an unsupported/complex case — the documented fix (render every
`BottomSheetModal` as a sibling, never nested in another sheet's content)
would mean restructuring `PaidByBottomSheet` out of `PaidAndSplitSection`
and up to the screen level.

**Solution**
Not fixed. Deferred until the in-house bottom sheet replaces
`@gorhom/bottom-sheet` (see `AGENTS.md`/roadmap notes on migrating off
gorhom). Interim mitigation: disable scrolling on
`AddExpenseBottomSheet`'s `BottomSheetScrollView` while the keyboard is
open (`scrollEnabled={false}` driven by `Keyboard` show/hide listeners),
which prevents the specific scroll-while-keyboard-open step in the repro
from being reachable. Doesn't address the root cause — just removes the
trigger for this one interaction path.

---

## `close()` vs `popSheet()`, and why `onClose` isn't dead even though the stack overwrites it (2026-09-15)

**Problem**
While migrating `AddDateBottomSheet` off gorhom to the in-house
`BottomSheet`/`BottomSheetStack`, `handleDone`/`handleCancel` were written to
call `sheetRef.current?.close()` rather than `popSheet()` from
`useBottomSheetStack()`. Two things weren't obvious from reading the stack
code:

1. Why `close()` over `popSheet()` — an initial explanation claimed
   `popSheet()` would skip the close animation and vanish the sheet
   instantly. That claim was **wrong** and got caught on review.
2. Separately: `BottomSheetStack.tsx`'s `StackedSheetWrapper` always
   overwrites the `onClose` prop on whatever component is pushed (via
   `cloneElement`), which raised the question of whether `BottomSheetProps.onClose`
   is pointless to keep around at all if the stack always claims it.

**Explanation**

*(1) `close()` vs `popSheet()` — they trigger the same animation.*
`popSheet(id?)` in `BottomSheetStack.tsx` does **not** do synchronous state
removal — it calls `.ref.current?.close()` on the target sheet, exactly like
`sheetRef.current?.close()` does:

```ts
const popSheet = useCallback((id) => {
  setSheets((prev) => {
    if (id) prev.find((s) => s.id === id)?.ref.current?.close();
    else prev[prev.length - 1]?.ref.current?.close();
    return prev; // removal happens via onClose, after the close animation finishes
  });
}, []);
```

So both paths are equally animated — there's no instant-vanish difference.
Given `StackedSheetWrapper` also sets `pointerEvents="none"` on every
non-top sheet, a Cancel/Done button inside a sheet can only ever be pressed
while that sheet is the top one — so `popSheet()`'s no-`id` branch
(`prev[prev.length - 1]`, "whichever sheet is on top") would, in practice,
always resolve to "this sheet" too. The two calls are behaviorally
identical here.

The actual reason to prefer `sheetRef.current?.close()` is architectural,
not behavioral: `popSheet` only exists on `useBottomSheetStack()`'s context
value, so calling it from inside `AddDateBottomSheet` would require that
component to assume it's always rendered under a `BottomSheetStackProvider`.
`sheetRef.current?.close()` needs nothing but the `BottomSheetMethods` ref
the component already receives via `forwardRef` — the same contract a
swipe-down or backdrop-tap dismissal already uses internally. Keeps the
sheet's own content component agnostic to how it's hosted.

*(2) `onClose` isn't dead code — only one specific *use* of it was.*
`StackedSheetWrapper` clones the pushed element with its own `onClose`:

```tsx
const element = cloneElement(sheet.component as ..., {
  ref: mergedRef,
  onClose: () => {
    sheet.onDismiss?.();
    onClose(); // = () => removeSheet(sheet.id)
  },
});
```

`cloneElement`'s second argument always wins on matching prop keys, so
whatever `onClose` value was on the JSX passed into `pushSheet` (e.g.
`<AddDateBottomSheet onClose={popSheet} .../>` in `ExpenseScreen.tsx`) gets
discarded before the component ever renders — that specific
`onClose={popSheet}` assignment at the push call site is genuinely inert.

But `BottomSheetProps.onClose` itself — the prop `<BottomSheet>` calls once
its close animation finishes — is not redundant. It's the exact mechanism
the stack depends on: it's how `StackedSheetWrapper` finds out "this sheet
finished closing, it's now safe to `removeSheet`." Removing that channel
would break the stack's own cleanup, since `removeSheet` only ever runs from
inside that callback. What's redundant is only passing something into it
from the app layer when using the stack — since the stack always overrides
it with its own bookkeeping closure.

**Solution**
- Sheet content components close themselves via their own
  `BottomSheetMethods` ref (`sheetRef.current?.close()`), never by reaching
  into `useBottomSheetStack()` for `popSheet` — keeps them decoupled from
  whether they're hosted by the stack, a bare ref, or something else later.
- To run app-level logic when a *stacked* sheet closes (for any reason —
  gesture, button, or `popSheet`), use `pushSheet`'s (or `useBottomSheet`'s)
  `onDismiss` option, not the component's `onClose` prop:
  ```tsx
  pushSheet({
    component: <AddDateBottomSheet ... />,
    onDismiss: () => { /* runs regardless of how the sheet closed */ },
  });
  ```
  `sheet.onDismiss` is preserved untouched in stack state and invoked from
  the same `StackedSheetWrapper` closure right before `removeSheet` — it's
  the one hook actually meant for this, unlike `onClose={...}` passed at the
  JSX call site.
- `onClose={popSheet}` on the JSX passed to `pushSheet` in
  `ExpenseScreen.tsx` (present on both `AddExpenseBottomSheet` and, in the
  in-progress `AddDateBottomSheet` migration) should be dropped — it never
  does anything, since `cloneElement` always overrides it.
