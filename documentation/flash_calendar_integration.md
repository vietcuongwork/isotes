# `@marceloterreiro/flash-calendar` integration notes

Issues hit building `src/features/expense/components/date/DateCalendar.tsx` on
top of `@marceloterreiro/flash-calendar@2.0.0`. Same **Problem / Explanation /
Solution** format as [encountered_errors.md](./log/encountered_errors.md).

We don't use the library's top-level `<Calendar>` component — the day grid is
built directly from `useCalendar()` + `Calendar.Row.*`/`Calendar.Item.*` (see
[the flash-calendar section of this session's log] for why: needing dimmed,
tappable adjacent-month days that `<Calendar>` renders as blank
`CalendarItemEmpty` cells). Several of these issues are specifically a
consequence of that — going through the low-level pieces instead of
`<Calendar>` skips some of what it wires up for you.

---

## Selected day renders as a rounded square, not a circle (2026-09-11)

**Problem**
`itemDay.active`'s theme override set `borderRadius: 999` (the usual "make it
maximally round" trick), same as `itemDay.today`. `today` rendered as a clean
circle; `active` rendered as a rounded square/squircle instead.

**Explanation**
The two states aren't styled symmetrically once you look past your own theme
object — the library's *own* built-in styling for `active` isn't. From
`CalendarItemDay.tsx`'s `buildBaseStyles`:

```ts
active: ({ isStartOfRange, isEndOfRange, ... }) => {
  const baseStyles = { container: { ...styles.baseContainer, backgroundColor: ... }, ... };
  baseStyles.container.borderRadius = 0;
  if (isStartOfRange) {
    baseStyles.container.borderTopLeftRadius = 16;
    baseStyles.container.borderBottomLeftRadius = 16;
  }
  if (isEndOfRange) {
    baseStyles.container.borderTopRightRadius = 16;
    baseStyles.container.borderBottomRightRadius = 16;
  }
  return baseStyles;
}
```

For a single selected day (`calendarActiveDateRanges={[{ startId: selectedDateId, endId: selectedDateId }]}`),
that day is both `isStartOfRange` **and** `isEndOfRange`, so the library bakes
in all four *specific* corner radii at `16`.

The final style is `{...libraryBase, height, ...yourTheme.base, ...yourTheme[state]}`
— your theme is spread last, so it should win. It doesn't here because
`borderRadius` (the shorthand) and `borderTopLeftRadius` etc. (the specific
corners) are different style keys, not the same key with the later value
winning. React Native — like CSS — always lets a specific corner property win
over the general shorthand, regardless of spread order. So the merged style
ends up with both `borderRadius: 999` *and* `borderTopLeftRadius: 16` (etc.)
present at once, and the specific ones win on all four corners. `999` never
gets a chance.

`today`'s handler has no such per-corner logic (only sets `borderColor`/
`borderWidth`), so nothing competes with a plain `borderRadius` override there
— which is why it worked for `today` and not `active`.

**Solution**
Override all four specific corners too, not just the shorthand:

```tsx
active: () => ({
  container: {
    aspectRatio: 1,
    borderRadius: DAY_CIRCLE_RADIUS,
    borderTopLeftRadius: DAY_CIRCLE_RADIUS,
    borderTopRightRadius: DAY_CIRCLE_RADIUS,
    borderBottomLeftRadius: DAY_CIRCLE_RADIUS,
    borderBottomRightRadius: DAY_CIRCLE_RADIUS,
    backgroundColor: colors.orange[400],
    ...
  },
  ...
}),
```

Reference: `.../flash-calendar/src/components/CalendarItemDay.tsx`, the
`active` branch of `buildBaseStyles`.

---

## Day cell flashes white while pressed (2026-09-11)

**Problem**
Screen-recorded a tap on a day cell and stepped through it frame-by-frame
(`ffmpeg` extraction): idle → **solid white circle** while held → orange once
released. Confirmed on `idle` *and* `today` cells; `active` was unaffected.

**Explanation**
`itemDay`'s theme functions receive `isPressed`, and the library's *own*
default styling reacts to it independently of your theme. From
`buildBaseStyles`:

```ts
idle: ({ isPressed, isHovered }) =>
  isPressed || isHovered
    ? { container: { ...styles.baseContainer, backgroundColor: theme.colors.background.tertiary }, ... }
    : { container: styles.baseContainer, ... },
```

`theme.colors.background.tertiary` comes from the library's own internal
color tokens (`helpers/tokens.ts`):

```ts
export const lightTheme = { colors: { background: { tertiary: "#EDEFEE", tertiaryPressed: "#D1D2D3" } } };
export const darkTheme  = { colors: { background: { tertiary: "#111111", tertiaryPressed: "#212121" } } };
```

Which one applies is decided by `useTheme()`:

```ts
const appearance = useColorScheme();        // OS-level appearance
const { colorScheme } = useCalendarTheme();  // from <CalendarThemeProvider>
return (colorScheme ?? appearance) === "dark" ? darkTheme : lightTheme;
```

`<CalendarThemeProvider>` is what the top-level `<Calendar>` component
normally wraps everything in automatically. Since we build the grid from the
lower-level pieces directly, that provider never mounts, so `useTheme()`
falls back to the simulator's OS-level appearance — light, in this case —
resolving to `tertiary: "#EDEFEE"` (near-white). Our own `idle`/`today` theme
functions never set a `backgroundColor` at all, so this light-theme value
passed through the merge unopposed.

`<CalendarThemeProvider>`/`useCalendarTheme` aren't part of the library's
public API (not re-exported from `src/index.ts` or `src/components/index.ts`),
so wrapping in it isn't actually available without reaching into the
package's internals.

**Solution**
`isPressed` is already a parameter the theme functions receive — claim
`backgroundColor` yourself instead of leaving it to the library's default:

```tsx
idle: ({ isDifferentMonth, isPressed }) => ({
  container: {
    aspectRatio: 1,
    backgroundColor: isPressed ? colors.grey[900] : "transparent",
  },
  content: { color: isDifferentMonth ? colors.grey[500] : colors.grey[100] },
}),
today: ({ isPressed }) => ({
  container: {
    aspectRatio: 1,
    borderRadius: DAY_CIRCLE_RADIUS,
    borderWidth: 1,
    borderColor: colors.orange[700],
    backgroundColor: isPressed ? colors.grey[900] : "transparent",
  },
  content: { color: colors.orange[400] },
}),
```

`active` didn't need this — its `backgroundColor: colors.orange[400]` is set
unconditionally, so it already won over the library's pressed-state default
regardless of `isPressed`.

No `patch-package` needed for either of these two issues — both turned out to
be fully controllable through the theme API's existing parameters
(`isStartOfRange`/`isEndOfRange`/`isPressed`); we just weren't using them yet.
Patching would only be worth reaching for if a behavior weren't reachable
through the public API at all, which isn't the case here.

Reference: `.../flash-calendar/src/hooks/useTheme.ts`,
`.../flash-calendar/src/helpers/tokens.ts`.

---

## `Calendar.Row.Month`'s children get wrapped in `<Text>`, and its `width: 100%` fights `justify-between` (2026-09-11)

**Problem**
Tried to lay the month title and prev/next chevrons out side by side using
`Calendar.Row.Month` as the row:

```tsx
<View className="flex-row justify-between">
  <Calendar.Row.Month theme={theme.rowMonth}>{calendarRowMonth}</Calendar.Row.Month>
  <View className="flex-1 flex-row">...chevrons...</View>
</View>
```

The chevron group got pushed off the right edge of the screen instead of
sitting beside the title.

**Explanation**
`CalendarRowMonth`'s own base style hardcodes `width: "100%"` on its
container, and its `children` prop is placed unconditionally inside a
`<Text>`:

```tsx
// CalendarRowMonth.tsx
const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center", justifyContent: "center" },
});
return (
  <View style={[styles.container, { height }, theme?.container]}>
    <Text style={contentStyles}>{children}</Text>
  </View>
);
```

Two separate problems stack here:
- Passing a `<View>`/`<Pressable>` tree as `children` (to combine title +
  chevrons in one slot) breaks outright — RN's `<Text>` can only contain
  text/`<Image>`, not arbitrary Views.
- Even with just the title text as `children`, the component's own container
  still claims `width: "100%"` of its parent row. React Native's default
  `flexShrink` is `0` (unlike web's `1`), so a sibling with an explicit
  `width` never shrinks for others — the chevron group's request for space is
  simply added on top, overflowing the row. `justify-content: space-between`
  only redistributes *leftover* space between children; it can't compress a
  child that refuses to shrink.

Tried setting `width: "50%"` on a `theme.rowMonth.container` override as a
middle ground — with a bit more tweaking that likely would have worked, but
it's a fragile magic-number width tied to how much room the chevron group
happens to need, so simplicity won out over chasing it.

**Solution**
Stop using `Calendar.Row.Month` for this row entirely — it's a thin wrapper
(`<View><Text>{children}</Text></View>` plus some default styling), and
everything it provides is exactly what fights this layout. Build it as plain
JSX from the raw `calendarRowMonth` string flash-calendar's `useCalendar()`
hook already returns:

```tsx
<View className="w-full flex-row items-center justify-between">
  <Text style={{ fontSize: 16, fontWeight: "500", color: colors.grey[50] }}>
    {calendarRowMonth}
  </Text>
  <View className="flex-row">
    <Pressable onPress={() => goToMonth(-1)} .../>
    <Pressable onPress={() => goToMonth(1)} .../>
  </View>
</View>
```

The library's other row/item components used elsewhere in the same grid
(`Calendar.Row.Week`, `Calendar.Item.WeekName`, `Calendar.Item.Day.WithContainer`)
don't have this problem — `CalendarRowWeek` lays out its children as an
`HStack`, no forced `width: 100%` or `<Text>` wrapping.

---

## Packaging note: the published package ships a broken `tsconfig.json` (2026-09-11, not something we hit — found while auditing)

`node_modules/@marceloterreiro/flash-calendar/tsconfig.json` (as published in
`2.0.0`) extends a workspace-internal preset that isn't published to npm:

```json
{ "extends": "@marceloterreiro/tsconfig/base", ... }
```

Running `tsc` from inside that package directory confirms it's broken in
isolation:

```
tsconfig.json(2,14): error TS6053: File '@marceloterreiro/tsconfig/base' not found.
tsconfig.json(6,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
```

This doesn't affect us — nothing in our own `tsconfig.json` extends or
references it, and TypeScript never resolves a dependency's own
`tsconfig.json` during a normal build. It's just a maintainer packaging slip
(devDependency-only monorepo files like `tsconfig.json`/`tsup.config.ts`
shipped to npm without a `files` allowlist excluding them) — noted here only
so it isn't mistaken for something in our setup if it's ever noticed again.

Related: [encountered_errors_ii.md](./log/encountered_errors_ii.md).
