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
   (`UIViewController.view`) — sits *behind* each screen and is exactly
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
  []
);
```

---

## Default-imported a CommonJS module and indexed one level too shallow (2026-08-18)

**Problem**
`import fontFamily from "@/themes/typography"` compiled, but `fontFamily["outfit-regular"]` failed with: `Element implicitly has an 'any' type because expression of type '"outfit-regular"' can't be used to index type '{ fontFamily: { fraunces: string; "outfit-regular": string; ... } }'`.

**Explanation**
`themes/typography.js` is CommonJS (`module.exports = { fontFamily: {...} }`), not an ES module — it has no real `default` export. Under the interop TS/Babel use for CommonJS files, `import x from "..."` (no braces) binds `x` to the *entire* `module.exports` object, since there's no `default` key to unwrap. So `fontFamily` ended up holding `{ fontFamily: { fraunces, "outfit-regular", ... } }` — one level too shallow — instead of the inner map.

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
`Picker` is a fully controlled component — the native wheel's position is forced to match its `selectedValue` prop on *every* render, not just when the user interacts with it. The normal update round-trip is: native fires `onValueChange` → `setState` in whatever component owns that state → React re-renders → the new `selectedValue` flows back down → the wheel re-syncs. Between step 2 and step 4 there's a real window where `selectedValue` is still the *old* value.

On its own, that window is too short to notice (a single React commit). The problem is that when `selectedValue` is threaded down from an ancestor (e.g. `CurrencyPicker`), *every* re-render of that ancestor — for any reason at all — re-passes whatever its state currently holds back into `Picker` as `selectedValue`, forcing a re-sync. `BottomSheetModal`/`BottomSheetView` re-render their content repeatedly for reasons that have nothing to do with the picker: backdrop opacity animating, snap-point/position tracking, dynamic-sizing remeasurement, all driven by Reanimated crossing from the UI thread back into JS. Each of those is an independent chance to shove the not-yet-updated old value back onto the wheel while it's still mid-fling — repeated over several seconds, competing against the wheel's own native momentum. That tug-of-war is the multi-row oscillation seen on video. Gesture arbitration (`enableContentPanningGesture`, wrapping the picker in `Gesture.Native()`) and dynamic sizing (`enableDynamicSizing={false}`) were both ruled out first via recording evidence — the wheel kept moving long after all touch input had ended, which neither theory explains.

Documented independently by other users hitting the same thing inside modals/portals/bottom sheets: https://github.com/react-native-picker/picker/issues/615

**Solution**
Move the picker's value state out of the ancestor and into the same component that renders `Picker`, so nothing external can write to it. Accept an `intialValue` used only to *seed* `useState` (read once, at mount) instead of a continuously-synced `selectedValue` prop — a `useState` initializer argument is ignored on every render after the first, so no amount of ancestor re-rendering can force a stale value back onto the wheel. The parent only receives the final selection via an `onValueChange(option)` callback, for its own use:

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
    <RNPicker selectedValue={localValue as unknown as string} onValueChange={handleValueChange}>
      {options.map((option, index) => (
        <RNPicker.Item key={index} label={option.label} value={option.value as unknown as string} />
      ))}
    </RNPicker>
  );
}
```

Caution for future changes: don't add a `useEffect(() => setLocalValue(intialValue), [intialValue])` to "keep it in sync" — that silently turns `intialValue` back into a continuously-controlled input and reintroduces the same bug. To legitimately reset the picker's value from outside, remount it with a changed `key` prop instead.

**References**
- https://github.com/react-native-picker/picker/issues/615