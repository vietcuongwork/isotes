# TypeScript — Notes

Quick reference for TS concepts/gotchas worth revising, grouped by topic.

---

## `forwardRef` typing

### The two type parameters

```ts
function forwardRef<T, P = {}>(
  render: ForwardRefRenderFunction<T, P>
): ...
```

- `T` — what the ref points to (the imperative handle type, e.g. `BottomSheetModal`).
- `P` — the props shape.

Both need to be known. TS infers generics from **argument shapes at the call site**, not by looking inside the function body at how you later use something — so annotating only `props` inside the callback does not pin down `T`:

```tsx
// Wrong: T has nothing to infer from, resolves to `unknown`
forwardRef((props: CurrencyPickerProps, ref) => {
  return <BottomSheetModal ref={ref} />; // error: Ref<unknown> not assignable to Ref<BottomSheetModal>
});
```

```tsx
// Right: give forwardRef both type arguments explicitly
forwardRef<BottomSheetModal, CurrencyPickerProps>((props, ref) => {
  return <BottomSheetModal ref={ref} />; // ref is ForwardedRef<BottomSheetModal>
});
```

With explicit type args, `props` no longer needs an inline annotation — it's inferred from `CurrencyPickerProps`.

### `displayName`

`forwardRef` components don't get an automatic `displayName` the way named function components do — set it manually so DevTools/error stacks don't show "Anonymous":

```tsx
CurrencyPicker.displayName = "CurrencyPicker";
```

### Imperative handle vs. callback prop — which direction does data go?

- **Parent calls a method on the child** (open/close, focus, scroll-to) → `ref` + `useImperativeHandle` (or a library's own imperative ref, like `BottomSheetModal`'s `.present()`/`.dismiss()`).
- **Child reports a value/event up to the parent** (a selection changed, a value updated) → a plain callback prop (`onChange`, `onSelectionChange`, etc.). This is regular one-directional data flow, not what refs are for.

Don't reach for `useImperativeHandle` just because a ref already exists on the component for other purposes — the two data directions are unrelated and can coexist (e.g. `CurrencyPicker` exposes `.present()`/`.dismiss()` via ref, and separately reports the chosen currency via an `onCurrencyChange` prop).
