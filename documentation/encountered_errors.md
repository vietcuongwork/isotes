iOS Bundling failed 261ms node_modules/.pnpm/expo-router@57.0.12_8989c4ca98b673634f2bfd5700c9d2ba/node_modules/expo-router/entry.js (1169 modules)
Unable to resolve "react-native-css-interop/jsx-runtime" from "src/app/index.tsx"

> 1 | import { Text, View, StyleSheet } from "react-native";
> 2 |
> 3 | export default function Index() {
> 4 | return (

Import stack:

src/app/index.tsx
| import "react-native-css-interop/jsx-runtime"

src/app (require.context)

---

## White flash at screen corners during swipe-back gesture

**Problem**
Swiping back (e.g. create-project → onboarding) briefly showed white at the
top-right/bottom-right corners of the screen mid-gesture, even though the
root `<Stack>` was already wrapped in a black `<View>` and each screen used
`contentStyle: { backgroundColor: "#0a0a0a" }`.

**Explanation**
Three separate layers determine background color during a native-stack
transition, and only one was actually black:

1. Native `UIWindow` / root view — the base of the app before React mounts.
2. `react-native-screens`' `ScreenStack` native container
   (`UIViewController.view`) — sits _behind_ each screen and is exactly
   what's revealed at the corners during the interactive swipe gesture.
3. Each screen's own content view — controlled by `contentStyle`.

`contentStyle` only controls layer 3. Layer 2's color comes from React
Navigation's theme (`colors.background`, read via `useTheme()` inside
`react-native-screens`), not from stack `screenOptions`. Since no theme was
provided, it fell back to the default light theme's white — that's the
white seen at the corners mid-swipe. Traced via source, not docs:
`node_modules/expo-router/build/react-navigation/native-stack/views/NativeStackView.native.js`
→ `ScreenStack nativeContainerStyle={{ backgroundColor: colors.background }}`
→ `node_modules/react-native-screens/src/components/ScreenStack.tsx`
→ `node_modules/react-native-screens/ios/RNSScreenStack.mm`
(`_controller.view.backgroundColor = _nativeContainerBackgroundColor`).

**Solution**
Wrap the root `<Stack>` in a `ThemeProvider` with a custom theme so
`colors.background` matches the app, in addition to keeping
`SystemUI.setBackgroundColorAsync` (layer 1) and `contentStyle` (layer 3):

```tsx
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SystemUI from "expo-system-ui";

SystemUI.setBackgroundColorAsync("#0a0a0a");

const AppTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: "#0a0a0a", card: "#0a0a0a" },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={AppTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0a0a0a" },
        }}
      />
    </ThemeProvider>
  );
}
```

**References**

- https://github.com/react-navigation/react-navigation/issues/9883
- https://stackoverflow.com/questions/72707322/how-to-get-rid-of-white-flashes-on-navigation-using-react-navigation-native-and
- https://reactnavigation.org/docs/themes/
- https://docs.expo.dev/develop/user-interface/color-themes/

---

## Custom font text not vertically centered in TextInput (2026-08-17)

**Problem**
Text in a `TextInput` (e.g. `FormField`) looked pinned toward the top/off-center vertically, even with padding removed.

**Explanation**
Custom fonts (e.g. "Outfit") bake in their own ascender/descender/line-gap metrics. Without an explicit `lineHeight`, RN uses the font's own line box, which can be taller/uneven vs. the visible glyphs — so centering the line box doesn't visually center the text.

**Solution**
Set an explicit, tighter `lineHeight` to override the font's metrics, e.g. `className="... leading-5 ..."`. Tune the value until it looks centered.

---

## `TouchableOpacity`'s `onPress` not firing when wrapping a `TextInput` (2026-08-17)

**Problem**
A non-editable `TextInput` (`editable={false}`) nested inside a `TouchableOpacity`, used as a fake "picker trigger" field, swallowed taps — `TouchableOpacity`'s `onPress` never fired.

**Explanation**
RN's touch handling has two stages: hit-testing (`pointerEvents`) decides which views are eligible targets; among eligible components that actively want to respond, the **innermost** one wins responder negotiation. `TextInput` always wants to respond (it also hooks into the native OS focus chain for keyboard handling, on top of RN's JS responder system), so being innermost, it wins over the outer `TouchableOpacity` — `editable={false}` only disables keyboard editing, not touch capturing.

**Solution**
Set `pointerEvents="none"` at the hit-testing stage so the `TextInput` (and its subtree) is skipped entirely, before responder negotiation ever starts — most reliable applied via a plain wrapping `View`, since threading `style.pointerEvents` through a custom component + NativeWind's `className`/`style` merge can be unreliable for `TextInput` specifically. Alternatively, avoid the conflict altogether: don't nest a real `TextInput` inside a `TouchableOpacity` for a non-editable "trigger" field — render a plain `Text` styled to look like the input instead.

---

## Arrow function with brace body silently returns `void` instead of JSX (2026-08-18)

**Problem**
`@gorhom/bottom-sheet`'s `backdropComponent` prop rejected a `renderBackdrop` callback with a TS error: `Type '(props: BottomSheetBackdropProps) => void' is not assignable to type 'FunctionComponent<BottomSheetBackdropProps>'`.

**Explanation**
The callback was written with a curly-brace body but no `return` statement:

```tsx
const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
  <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />;
}, []);
```

Arrow functions have two body forms. An expression body (`=> <JSX />`, no braces) implicitly returns its value. A block body (`=> { ... }`) is a sequence of statements like a regular function — nothing is returned unless you write `return` explicitly. Here the JSX was evaluated as a standalone expression statement and discarded, so the function always returned `undefined`, which TS correctly typed as `void`.

**Solution**
Either drop the braces for an implicit return, or add `return` inside them:

```tsx
const renderBackdrop = useCallback(
  (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  ),
  [],
);
```

---

## Default-imported a CommonJS module and indexed one level too shallow (2026-08-18)

**Problem**
`import fontFamily from "@/themes/typography"` compiled, but `fontFamily["outfit-regular"]` failed with: `Element implicitly has an 'any' type because expression of type '"outfit-regular"' can't be used to index type '{ fontFamily: { fraunces: string; "outfit-regular": string; ... } }'`.

**Explanation**
`themes/typography.js` is CommonJS (`module.exports = { fontFamily: {...} }`), not an ES module — it has no real `default` export. Under the interop TS/Babel use for CommonJS files, `import x from "..."` (no braces) binds `x` to the _entire_ `module.exports` object, since there's no `default` key to unwrap. So `fontFamily` ended up holding `{ fontFamily: { fraunces, "outfit-regular", ... } }` — one level too shallow — instead of the inner map.

General rule: `import { name }` (braces) destructures a specific named export/key by name; `import name` (no braces) grabs "the one default thing" a module hands out. For CommonJS files there's no default, so `import { fontFamily } from "..."` (matching the `fontFamily` key on `module.exports`) is what actually reaches the inner object.

**Solution**
Use the named import to match the CommonJS export shape:

```ts
import { fontFamily } from "@/themes/typography";
```

---

## `Picker` inside `BottomSheetModal` snaps back to old value then re-scrolls to current (2026-08-18)

**Problem**
`@react-native-picker/picker`'s wheel, used as the currency picker inside a `@gorhom/bottom-sheet` `BottomSheetModal`, would settle at one row after a scroll/fling, then — well after the touch had ended — reverse and animate through several more rows before landing on the actually-selected one. Confirmed via frame-by-frame screen recording: the wheel kept moving for seconds after the finger was already off-screen, changing direction mid-flight. A bare `Picker` outside the bottom sheet (or the original plain RN `Modal` implementation) never showed this.

**Explanation**
`Picker` is a fully controlled component — the native wheel's position is forced to match its `selectedValue` prop on _every_ render, not just when the user interacts with it. The normal update round-trip is: native fires `onValueChange` → `setState` in whatever component owns that state → React re-renders → the new `selectedValue` flows back down → the wheel re-syncs. Between step 2 and step 4 there's a real window where `selectedValue` is still the _old_ value.

On its own, that window is too short to notice (a single React commit). The problem is that when `selectedValue` is threaded down from an ancestor (e.g. `CurrencyPicker`), _every_ re-render of that ancestor — for any reason at all — re-passes whatever its state currently holds back into `Picker` as `selectedValue`, forcing a re-sync. `BottomSheetModal`/`BottomSheetView` re-render their content repeatedly for reasons that have nothing to do with the picker: backdrop opacity animating, snap-point/position tracking, dynamic-sizing remeasurement, all driven by Reanimated crossing from the UI thread back into JS. Each of those is an independent chance to shove the not-yet-updated old value back onto the wheel while it's still mid-fling — repeated over several seconds, competing against the wheel's own native momentum. That tug-of-war is the multi-row oscillation seen on video. Gesture arbitration (`enableContentPanningGesture`, wrapping the picker in `Gesture.Native()`) and dynamic sizing (`enableDynamicSizing={false}`) were both ruled out first via recording evidence — the wheel kept moving long after all touch input had ended, which neither theory explains.

Documented independently by other users hitting the same thing inside modals/portals/bottom sheets: https://github.com/react-native-picker/picker/issues/615

**Solution**
Move the picker's value state out of the ancestor and into the same component that renders `Picker`, so nothing external can write to it. Accept an `intialValue` used only to _seed_ `useState` (read once, at mount) instead of a continuously-synced `selectedValue` prop — a `useState` initializer argument is ignored on every render after the first, so no amount of ancestor re-rendering can force a stale value back onto the wheel. The parent only receives the final selection via an `onValueChange(option)` callback, for its own use:

```tsx
// Picker.tsx
function Picker<T extends ItemValue>(props: PickerProps<T>) {
  const { intialValue, onValueChange, options } = props;
  const [localValue, setLocalValue] = useState<T>(intialValue);

  const handleValueChange = (value: string) => {
    const selectedOption = options.find((option) => option.value === value);
    if (!selectedOption) return;
    setLocalValue(selectedOption.value);
    onValueChange(selectedOption);
  };

  return (
    <RNPicker
      selectedValue={localValue as unknown as string}
      onValueChange={handleValueChange}
    >
      {options.map((option, index) => (
        <RNPicker.Item
          key={index}
          label={option.label}
          value={option.value as unknown as string}
        />
      ))}
    </RNPicker>
  );
}
```

Caution for future changes: don't add a `useEffect(() => setLocalValue(intialValue), [intialValue])` to "keep it in sync" — that silently turns `intialValue` back into a continuously-controlled input and reintroduces the same bug. To legitimately reset the picker's value from outside, remount it with a changed `key` prop instead.

**References**

- https://github.com/react-native-picker/picker/issues/615

---

## `TouchableOpacity` inside `KeyboardAwareScrollView` needs two taps to fire while keyboard is open (2026-08-22)

**Problem**
After wrapping `CreateProjectScreen`'s content in `react-native-keyboard-controller`'s `KeyboardAwareScrollView`, tapping the "Default currency" field (a `TouchableOpacity` that calls `Keyboard.dismiss()` then presents a `BottomSheetModal`) while a text input still had focus only closed the keyboard — the bottom sheet didn't open. A second tap was required.

**Explanation**
`KeyboardAwareScrollView` (like plain `ScrollView`) defaults to `keyboardShouldPersistTaps="never"`: the first tap outside the currently focused `TextInput` is intercepted purely to dismiss the keyboard, and is not forwarded to whatever touchable is underneath. Only the second tap, with the keyboard already closed, reaches `TouchableOpacity`'s `onPress`.

**Solution**
Set `keyboardShouldPersistTaps="handled"` on the `KeyboardAwareScrollView` so taps on components with their own handler (e.g. `TouchableOpacity`) are forwarded immediately instead of being swallowed for dismissal first. Taps on truly empty space still dismiss the keyboard as before, so the usual "tap outside to close keyboard" UX is preserved:

```tsx
<KeyboardAwareScrollView keyboardShouldPersistTaps="handled" ...>
```

Keep the explicit `Keyboard.dismiss()` inside `onPress` — `"handled"` only forwards the tap, it doesn't dismiss the keyboard on its own, so without it the keyboard would stay open behind the bottom sheet.

`keyboardShouldPersistTaps="always"` was considered but rejected: it disables tap-to-dismiss entirely, even on blank space, which would remove that convenience everywhere else on the screen.

---

## Generic `Picker`'s value type should stay primitive, not the full domain object (2026-08-22)

**Problem**
While reshaping currency data from a flat `{ label, value }` pair into a richer `Currency` type (`{ name, code, symbol }`), it wasn't obvious whether `src/features/createProject/components/Picker.tsx`'s generic `T extends ItemValue` should be instantiated with the whole `Currency` object as the wheel's `value`, instead of a primitive.

**Explanation**
`@react-native-picker/picker`'s bundled TS typings (`ItemValue = number | string | object`) suggest an object is fine. But the library's actual implementation is written in Flow, and every real platform file (`Picker.js`, `PickerIOS.ios.js`, `PickerAndroid.android.js`, `PickerMacOS.macos.js`) types `selectedValue` as `?(number | string)` — the shipped `.d.ts` is looser than what the library itself type-checks and tests. Worse, the row-matching logic on every platform is strict reference equality: `child.props.value === props.selectedValue`. For an object, that's identity comparison, not structural — it would only "happen to work" because `CURRENCY_OPTIONS` is a static module-level array, so the same object reference flows through every render. That's incidental to the data being static today, not a contract the library guarantees; any future change that produces a fresh object per render (fetching from an API, mapping/filtering the list) would silently break selection with no type error to catch it.

**Solution**
Keep `Picker<T extends ItemValue>` instantiated with a primitive (the currency's `code: string`), and do the `PickerOption<string>` ↔ `Currency` translation at the call site instead of inside the generic component:

```ts
const currencyOptions = CURRENCY_OPTIONS.map((c) => ({
  label: `${c.name} (${c.code}) - ${c.symbol}`,
  value: c.code,
}));
```

This also keeps `Picker.tsx` fully decoupled from currency-specific shape — it stays reusable for any future picker, not just this one.

**References**

- https://github.com/react-native-picker/picker/blob/master/typings/Picker.d.ts
- `node_modules/@react-native-picker/picker/js/PickerAndroid.android.js`, `PickerIOS.ios.js`, `PickerMacOS.macos.js`

---

## A hook should own both its state and the logic that transitions it (2026-08-22)

**Problem**
After extracting `selectedCurrency`/`setSelectedCurrency` into `useCreateProjectForm`, a translation handler (`PickerOption<string>` → `Currency`, via a `CURRENCY_OPTIONS.find`) was still sitting in `CurrencyPicker.tsx`, taking `onCurrencyChange` in as a prop and calling it once translated. It wasn't obvious this handler could just move.

**Explanation**
The handler existed purely to reshape data before handing it to a setter the hook already owned — it had nothing to do with `CurrencyPicker` being a component, it was currency-selection business logic. General principle: if a component's handler exists only to translate data before calling a function it received as a prop, and that prop function ultimately comes from a hook further up, lift the handler up into that hook instead of keeping it in the component. A hook should own both the state and the logic that transitions it, not just the state.

**Solution**
Move the translation into the hook, calling `setSelectedCurrency` directly instead of an injected `onCurrencyChange`:

```ts
// useCreateProjectForm.ts
const handleCurrencySelectionChange = (option: PickerOption<string>) => {
  const currency = CURRENCY_OPTIONS.find((c) => c.code === option.value);
  if (!currency) return;
  setSelectedCurrency(currency);
};

return { currencyPickerRef, selectedCurrency, handleCurrencySelectionChange };
```

This has a bonus effect: since the hook's returned handler now has exactly the shape `Picker`'s `onSelectionChange` expects, `CurrencyPicker` no longer needs its own adapter function at all — it becomes a straight reference pass-through the whole way down (`onCurrencyChange={handleCurrencySelectionChange}` → `<Picker onSelectionChange={onCurrencyChange} />`), one less indirection layer to reason about.

---

## Spreading `textInputProps` instead of passing it as a named prop swallowed `onChangeText`/`onBlur` (2026-08-24)

**Problem**
After wiring `react-hook-form`'s `Controller` around `FormField` for the `projectName` field, typing into the input showed each keystroke for an instant, then the field snapped back to `""`. `Controller`'s `field.onChange` never fired.

**Explanation**
`FormField` forwarded its `textInputProps` prop down to `CustomTextInput` by spreading it:

```tsx
<CustomTextInput
  value={value}
  placeholder={placeholder}
  {...textInputProps}
/>
```

`CustomTextInput`'s own prop type is `{ value, placeholder, textInputProps }` — it expects one prop literally named `textInputProps` holding an object. But `{...textInputProps}` doesn't pass that object through as-is; it unpacks the object's keys (`onChangeText`, `onBlur`) and re-attaches each one as its own flat, sibling prop on `<CustomTextInput>`. No prop named `textInputProps` ever reaches `CustomTextInput`, so its destructure `const { textInputProps } = props` resolved to `undefined`. Its own inner spread onto the real `<TextInput>` (`{...textInputProps}`) then spread nothing, so the actual `TextInput` never received `onChangeText`/`onBlur` — only `value`. A controlled `TextInput` with no change handler visually flashes the typed character, then React's next render re-forces it back to the unchanged `value` prop.

General rule: `{...obj}` inlines an object's *keys* as individual props on whatever it's spread onto — it does not hand the object itself to a prop of the same name. To pass an object through intact as a single prop, it must be assigned explicitly: `propName={obj}`.

The bug was invisible on the "Default currency" field because that field is wrapped in an outer `<View pointerEvents="none">` (see the `TouchableOpacity`/`TextInput` entry above) — that View already blocks all touch/focus to the `TextInput` beneath it, so the field's own `editable`/`style` never needed to reach the real input for the UI to behave correctly.

**Solution**
Pass `textInputProps` through as the named prop, not spread, in both branches of `FormField`:

```tsx
<CustomTextInput
  value={value}
  placeholder={placeholder}
  textInputProps={textInputProps}
/>
```

---

## Split padding between the row wrapper and the `TextInput` by which one owns the concern (2026-08-24)

**Problem**
While moving `FormField`'s error icon inside the same bordered box as the `TextInput` (`flex-row justify-between`), it wasn't obvious why horizontal padding (`px`) should move to the new wrapping `View` while vertical padding (`py`) should stay on the `TextInput` itself, instead of moving both together.

**Explanation**
The two paddings serve different concerns, so they have different correct owners:

`px` needs to apply symmetrically to *both* children (the input on the left, the icon on the right) relative to the shared border. If `px` stayed on the `TextInput` alone, only the text side would be inset from the border — the icon, as a separate sibling with no padding of its own, would sit flush against the border with no gap. Putting `px` on the row container gives both children the same inset in one place, instead of duplicating matching padding onto the icon too.

`py` needs to stay on the `TextInput` because it defines the input's *interactive surface*, not just its visual spacing. Padding lives inside the element's own layout box, so with the original single-element `p-4`, tapping anywhere in that padded area focused the input and opened the keyboard. If `py` moved to the wrapping `View` instead, that vertical space would belong to the row container — which has no focus behavior — shrinking the actual tappable/focusable area down to roughly the text's line-height, a usability regression from what existed before.

General rule: padding belongs wherever the property it's protecting actually lives — shared visual spacing between siblings belongs on their common parent; padding that also defines an element's own interactive/tap area belongs on that element, even after introducing a wrapper around it.

**Solution**
```tsx
<View className="flex-row items-center justify-between rounded-xl border bg-[#0e0e0e] px-4">
  <TextInput className="flex-1 py-4 ..." ... />
  {errorState && <CircleAlert size={20} color="#e5484d" />}
</View>
```

---

## Prefer lifting form state up over exposing it through `useImperativeHandle` (2026-08-25)

**Problem**
`CreateProjectForm` owned its `useForm()` instance internally, but the submit `Button` lives in the parent `CreateProjectScreen` — there's no native `<form>` in React Native for submission to bubble through, so it wasn't obvious whether the parent should trigger submission via a `forwardRef`/`useImperativeHandle` exposing a `submit()` method on the child, or whether the form hook should move up to the screen and hand `control`/`handleSubmit` down as props instead.

**Explanation**
`useImperativeHandle` is designed for genuinely one-way, stateless imperative actions a parent can't otherwise reach (`.focus()`, `.scrollTo()`) — not for form submission, which is inherently two-way. The screen doesn't just need to *trigger* submit; it will also need to *read back* form state soon after (disable the button while `formState.isSubmitting`, show a spinner, react to validation errors). Each of those needs would mean bolting another method/property onto the imperative handle (`submit()`, then `isSubmitting()`, then `getErrors()`...), growing a parallel imperative channel to carry data that ordinary top-down props already carry for free.

Lifting the `useCreateProjectForm()` call up to `CreateProjectScreen` and passing `control` down to `CreateProjectForm` (with `form.handleSubmit(onSubmit)` wired directly to the `Button`'s `onPress` in the screen) keeps everything flowing as ordinary props in both directions, with one form instance instead of risking two out-of-sync instances from calling the hook in two places. It also matches how `react-hook-form` is meant to be composed across component boundaries (the same shape `FormProvider`/`useFormContext` uses), and follows the same principle already applied elsewhere in this codebase — a hook owns its state and the logic that transitions it; components consume what it returns rather than reaching into each other imperatively.

**Solution**
Call `useCreateProjectForm()` in `CreateProjectScreen`, pass `control` (and `currencyPickerRef`/`handleCurrencyChange`) down to `CreateProjectForm` as props, and wire the button directly:

```tsx
// CreateProjectScreen.tsx
const { currencyPickerRef, handleCurrencyChange, form } = useCreateProjectForm();

<CreateProjectForm
  control={form.control}
  currencyPickerRef={currencyPickerRef}
  handleCurrencyChange={handleCurrencyChange}
/>

<Button buttonText="Create" onPress={form.handleSubmit(onSubmit)} />
```
