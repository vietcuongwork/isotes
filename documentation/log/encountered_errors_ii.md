# Encountered errors (II)

Continuation of [encountered_errors.md](./encountered_errors.md). Same
**Problem / Explanation / Solution** format.

---

## TextInput border box grows then snaps back on empty↔non-empty transitions (2026-09-03)

**Problem**
`FormField`'s bordered input box visibly stretched a couple of px taller and
immediately sprang back each time the field crossed between empty and
non-empty — most obvious when clearing all text and retyping. A screen
recording, diffed frame-to-frame, showed the whole rounded border outline
(not just the text) shifting for ~1 frame at that transition.

**Explanation**
The border is drawn on a wrapper `View` that had no fixed height, so it hugged
its child `TextInput`. A bare single-line `TextInput` sizes to its measured
content height, and with the custom "Outfit" font that height is not stable:
the placeholder state and the value state measure ~1–2px apart (iOS measures
the placeholder string differently, and there was no single `lineHeight`
pinning the line box). Every empty↔non-empty switch flipped the input's
height, the wrapper followed, and the border moved.

It was compounded by a competing-`lineHeight` bug in the className: the
`text-body` typography token is a tuple `["15px", { lineHeight: "22px" }]`, so
it emits `lineHeight: 22`, while a sibling `leading-5` utility emitted
`lineHeight: 20`. Two sources setting the same property — which one landed
was not stable across NativeWind's re-flatten on each keystroke re-render, so
the line box also flipped 20↔22 independently. `text-base` (a single Tailwind
default) + `leading-5` didn't show this because there's only one source.

**Solution**
Pin the wrapper's height so the visible box is decoupled from the input's
content measurement:

```tsx
<View className="bg-grey-925 rounded-row h-14 flex-row items-center justify-between border px-4 ...">
  <TextInput className="text-grey-50 text-field h-full flex-1 font-outfit-regular" ... />
```

- `h-14` on the wrapper — fixed height, border can't move.
- `h-full flex-1` on the `TextInput` — fills the box on both axes so the
  entire visible field stays tappable (with only `flex-1` the hit area
  shrinks to the ~20px text line; with only `h-full` and no `flex-1` it
  shrinks to content *width* and is nearly untappable).
- Don't stack a `leading-*` utility on a typography token that already
  bundles a `lineHeight` — pick one source. `text-field`
  (`src/themes/typography.js`) exists as a bundled-lineHeight token for
  input text so no separate `leading-*` is needed.

Related: [encountered_errors.md](./encountered_errors.md) —
"Custom font text not vertically centered in TextInput" and
"Split padding between the row wrapper and the TextInput".

---

## Custom `text-<role>` typography utilities silently dropped by `cn()` (2026-09-06)

**Problem**
After migrating typography from two-class pairs (`font-outfit-medium text-label`)
to single composite `text-<role>` utilities — registered by a Tailwind plugin
via `addUtilities`, defined in `src/themes/typography.js`, see
[tailwindcss_setup.md §10](../tailwindcss_setup.md) — any element styled through
`cn()` lost its role entirely. In `AmountField`:

```
cn("text-hero-amount flex-1 text-grey-50")  →  "flex-1 text-grey-50"
```

`text-hero-amount` vanished; the field rendered at default size. Same for
`cn("text-label text-orange-300")` → `text-label` dropped. Plain
`className="..."` strings (no `cn`) were unaffected.

**Explanation**
`cn` is `twMerge(clsx(...))`. `tailwind-merge` resolves every class to exactly
one class group and keeps only the last within a group. It has no knowledge of
the plugin's custom `text-*` utilities, so it falls them back into its built-in
`text-color` group (they share the `text-` prefix), then sees `text-hero-amount`
and `text-grey-50` as two competing colours and keeps the later one. The old
`font-outfit-* text-*` pairs never hit this — `font-outfit-*` is a different
group.

Also surfaced in the same file: `className={(cn(...), "leading-0")}` — the
parenthesised comma operator evaluates `cn(...)`, discards it, and returns
`"leading-0"`. Unrelated to tokens; fixed by passing both strings as arguments
to `cn`.

**Solution**
Give the role utilities their own tailwind-merge class group in
`src/utils/cn.ts`:

```ts
type AdditionalClassGroupIds = "text-role";

const twMerge = extendTailwindMerge<AdditionalClassGroupIds>({
  extend: {
    classGroups: {
      "text-role": [{ text: Object.keys(roles) }],
    },
  },
});
```

- The `<AdditionalClassGroupIds>` generic is required — without it tsc rejects
  the key: *"'text-role' does not exist in type 'Partial<Record<
  DefaultClassGroupIds, ...>>'"*. tailwind-merge only permits built-in group ids
  unless new ones are declared as type parameters.
- `{ text: Object.keys(roles) }` expands to `text-hero`, `text-hero-amount`, …
  from the single `roles` source — no hand-maintained list.
- `text-<role>` and `text-<color>` are now different groups (both survive); two
  roles still dedupe to the last.
- No `conflictingClassGroups` entry, so a role deliberately coexists with a
  sibling `leading-*` / `text-<color>` — `cn("text-hero-amount leading-5")`
  keeps both (role gives size/family, `leading-5` tweaks the line box).

**Why the group is load-bearing (naming note)**
The clash exists only because the roles use the `text-` prefix, overlapping
tailwind-merge's built-in `text-color` / `font-size` groups. A non-`text-`
prefix (`type-hero`, `t-hero`) would sidestep it — `type-*` matches no built-in
group — making the `cn.ts` group *optional* (needed only if `cn(roleA, roleB)`
must dedupe; without it both emit and CSS source order, not class order, wins).
`text-` was kept for readability on `<Text>`, so the group stays mandatory.
`addUtilities` registration is required regardless of prefix — it is what makes
the utility compile and what Tailwind IntelliSense enumerates.

Related: the "competing-`lineHeight`" note in the entry above — same
"two sources for one property" family.

---

## Absolute child `top: "100%"` ignores the parent's top padding (2026-09-10)

**Problem**
A popover positioned `absolute` under an anchor row with `top: "100%"` sat
~14px too high and overlapped the row instead of clearing it. Bumping
`marginTop` from the intended `8` to `22` fixed it, which looked like a magic
number.

**Explanation**
`top: "100%"` on an absolute child means *offset my top edge down by 100% of
the parent's height* — nominally dropping it to the parent's bottom edge.
Percentages resolve against parent height for `top`/`bottom`, parent width for
`left`/`right`.

But Yoga measures that percentage against the parent's **content box**
(padding excluded) and offsets from the parent's top edge. When the parent has
`paddingTop` (the anchor row used `pt-3.5` = 14px), `top: "100%"` stops 14px
short of the real bottom edge, landing over the field.

**Solution**
Add the parent's `paddingTop` back into `marginTop`:

```ts
popover: {
  position: "absolute",
  left: 0,        // row already has px-5; absolute inset is from the padding edge
  right: 0,
  top: "100%",
  marginTop: 22,  // 14 (parent pt-3.5) + 8 (desired gap under the field)
}
```

Or move the top padding off the anchor row (onto a wrapper above it) so
`top: "100%"` equals the true bottom edge and `marginTop` is just the gap.

The same padding-edge rule is why `left: 0` (not `left: 20`) already aligns the
popover with the fields — an absolute child's inset is measured from the
parent's padding edge, so the row's own `px-5` is not double-counted.

---

## Toggling a `shadow-*` class on only one ternary branch crashes with a bogus navigation error (2026-09-11)

**Problem**
Selecting a tile in `ActivityPicker`'s popover threw a red-screen render error:
`Couldn't find a navigation context. Have you wrapped your app with
'NavigationContainer'?` — despite `expo-router` already providing one. The
crash only appeared after adding `shadow-selected` to the `isSelected` branch
of the tile's className ternary:

```tsx
className={cn(
  "flex-row items-center gap-2.5 rounded-row px-3 py-2.5",
  isSelected
    ? "shadow-selected border border-orange-700 bg-orange-800"
    : "bg-grey-950",
)}
```

**Explanation**
The navigation-context message was a red herring — the real failure was inside
`react-native-css-interop` (NativeWind v4's runtime, `0.2.6`), triggered by a
dev-only warning path that crashes while building its own log message.

Tailwind's `box-shadow` utilities aren't a plain style value like
`backgroundColor` — they compile through CSS custom properties (`--tw-shadow`
etc.), which `react-native-css-interop` has to thread down via a
`VariableContext.Provider`. The library tracks this per component instance:

- `css-to-rn/index.js:96-97` flags a parsed ruleset `variables: true` when a
  class (e.g. `shadow-selected`) declares one of these custom properties.
- `runtime/native/native-interop.js:479` latches that onto the component:
  `sharedState.variables ||= UpgradeState.SHOULD_UPGRADE`.
- `runtime/native/render-component.js:78-91` checks this flag every render. If
  it flips from `NONE` to `SHOULD_UPGRADE` **after** the component's initial
  render (i.e. the first render's className had no `shadow-*` class, a later
  render's did), it can't retrofit the `Provider` without a remount, so it
  calls `printUpgradeWarning` to warn about it.
- `printUpgradeWarning` → `stringify(originalProps)` (`render-component.js:121-135`)
  `JSON.stringify`s the component's props with a recursive replacer. Since the
  props tree includes React Navigation's default context sentinel — whose
  `getKey`/`setKey` are getters that `throw new Error(MISSING_CONTEXT_ERROR)`
  (`NavigationStateContext.js:43`) — enumerating it throws, and *that* surfaces
  as the "Couldn't find a navigation context" render error.

So: the `false` branch (`"bg-grey-950"`) had no shadow-family class, the `true`
branch did. The very first tap that flips `isSelected` to `true` is the
render where the flag transitions mid-lifetime — which is exactly what the
warning path watches for, and the (buggy) warning builder crashes.

**Solution**
Give every ternary branch a class from the same variable-backed family, even a
no-op one, so the flag is already set on the component's first render and
never *transitions* later:

```tsx
isSelected
  ? "shadow-selected border border-orange-700 bg-orange-800"
  : "bg-grey-950 shadow-none",
```

`shadow-none` still declares the `--tw-shadow` custom property (just as
`0 0 #0000`), so `ruleSet.variables` is `true` on both branches from render 1.

Rule of thumb: never let a conditional className add/remove a `shadow-*`,
`ring-*`, or other CSS-variable-backed utility on only one branch — always
pair it with the same utility's "off" value (`shadow-none`, `ring-0`, ...).
Plain style utilities (`bg-*`, `border-*` color, `p-*`, `text-*` color) don't
have this problem — they compile straight to a style value, no variable
provider involved.

References (installed package, matches this project's exact version):
`node_modules/.pnpm/react-native-css-interop@0.2.6.../dist/{css-to-rn/index.js:96-97,
runtime/native/native-interop.js:479, runtime/native/render-component.js:78-135}`.

---

## `AddDateBottomSheet` nested inside `AddExpenseBottomSheet` closes itself immediately on `present()` (2026-09-11)

**Problem**
Calling `addDateSheetRef.current?.present()` from `DateField`'s `onPress`
opened `AddDateBottomSheet` for a single frame, then it closed itself
immediately — no user interaction, no error.

**Explanation**
`AddDateBottomSheet` (a `BottomSheetModal`) was rendered as a *child* inside
`AddExpenseBottomSheet`'s own `BottomSheetView` content, not as a sibling.
`@gorhom/bottom-sheet`'s `BottomSheetModalProvider` tracks every presented
modal in a shared stack (`BottomSheetModalProvider.tsx`, `handleMountSheet`).
Whenever a new modal presents, it looks at whichever modal is currently on
top and — unless `stackBehavior="push"` is set — either dismisses it
(`stackBehavior="replace"`) or minimizes it (`stackBehavior="switch"`, the
default: `DEFAULT_STACK_BEHAVIOR` in `bottomSheetModal/constants.ts`).

Neither sheet set `stackBehavior`, so presenting `AddDateBottomSheet`
minimized `AddExpenseBottomSheet` — the very sheet whose content tree
`AddDateBottomSheet` was mounted inside. Minimizing the parent tore down the
content it was sitting in, pulling the just-presented child sheet down with
it a frame later.

**Solution**
`BottomSheetModal` instances must be siblings, never nested inside another
modal's content — each should be a direct child of a common ancestor (ideally
close to `BottomSheetModalProvider`, e.g. `src/app/_layout.tsx`), with the
presenting screen holding both refs and wiring one's `onPress` to the other's
`.present()`:

```tsx
// ExpenseScreen.tsx
const addDateSheetRef = useRef<BottomSheetModal>(null);
...
<AddExpenseBottomSheet
  ref={addExpenseSheetRef}
  onDatePress={() => addDateSheetRef.current?.present()}
/>
<AddDateBottomSheet ref={addDateSheetRef} />
```

Also give the sheet being opened on top of another `stackBehavior="push"`, so
it layers above instead of minimizing/dismissing whatever's already open:

```tsx
<BottomSheetModal ref={ref} stackBehavior="push" ...>
```

References: `node_modules/.pnpm/@gorhom+bottom-sheet@5.2.14.../src/
{components/bottomSheetModalProvider/BottomSheetModalProvider.tsx (handleMountSheet),
components/bottomSheetModal/constants.ts (DEFAULT_STACK_BEHAVIOR)}`.
