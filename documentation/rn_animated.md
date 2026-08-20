# React Native Reanimated — Essentials

A quick reference for the core building blocks: shared values, `useAnimatedStyle`, and how they differ from `useEffect`.

---

## 1. `useSharedValue` — a live variable, not React state

```tsx
const scale = useSharedValue(0);
```

- Creates a "box" holding a value (number, string, object, etc).
- Changing it does **not** trigger a React re-render.
- Both the JS thread and the UI thread can read/write it directly, at 60fps.
- Always access the contents through `.value`:

```tsx
scale.value; // read
scale.value = 5; // write (instant, no animation)
```

---

## 2. Starting an animation — `withSpring` / `withTiming` / `withDelay`

```tsx
scale.value = withSpring(1, { damping: 8 });
```

This is **not** an instant assignment. `withSpring(1, ...)` returns an animation descriptor meaning: _"starting from the current value, animate toward `1` using spring physics."_ From that point, `scale.value` keeps updating every frame on its own until it settles.

```tsx
withDelay(index * 130, withSpring(1));
```

= wait `index * 130`ms, then start that animation.

**Where this belongs:** inside `useEffect`, a gesture handler, or an event callback — anywhere that represents "something happened, now start animating."

---

## 3. `useAnimatedStyle` — a reactive style formula

```tsx
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: opacity.value,
}));
```

- Runs on the **UI thread**, continuously — not just once.
- Reanimated automatically tracks which shared values the function reads (like an implicit dependency list).
- Every time a tracked value changes (e.g. because a `withSpring` you started earlier is still animating), this function **re-runs** and returns a fresh style object.
- No React re-render is involved — this is why Reanimated stays smooth under load.

Think of it as: **`useEffect` starts the motion, `useAnimatedStyle` reports the motion's current state as a style, every frame.**

You can return any number of style properties, sourced from any number of shared values:

```tsx
useAnimatedStyle(() => ({
  transform: [{ translateX: x.value }, { scale: scale.value }],
  opacity: opacity.value,
  backgroundColor: interpolateColor(progress.value, [0, 1], ["#000", "#f00"]),
}));
```

### ✅ OK: wrapping a _read_ in `withSpring` inline

```tsx
useAnimatedStyle(() => ({
  transform: [{ translateX: withSpring(translateX.value * 2) }],
}));
```

This only **reads** `translateX.value` and smooths the _output_ style toward a derived target. No shared value is mutated. Common pattern for "always animate smoothly toward whatever this value currently is."

### ❌ Avoid: writing to `.value` inside `useAnimatedStyle`

```tsx
useAnimatedStyle(() => {
  sv.value = withTiming(1); // side effect inside a function meant to only read
  return { opacity: sv.value };
});
```

Mutating a shared value from inside the function that's supposed to just _report_ it causes the function to keep re-triggering itself. Starting/mutating animations belongs in `useEffect` or a handler, not inside `useAnimatedStyle`.

---

## 4. `useAnimatedStyle`'s return vs. `useEffect`'s return

These look similar (both are `return` inside a hook) but mean different things:

|            | `useAnimatedStyle`'s return                                 | `useEffect`'s return                            |
| ---------- | ----------------------------------------------------------- | ----------------------------------------------- |
| What it is | The actual style object output                              | A **cleanup** function                          |
| Runs when  | Every time the function re-runs (any tracked value changes) | Right before the effect re-runs, and on unmount |
| Purpose    | Report current values as a style                            | Undo/cancel whatever the previous run set up    |

```tsx
useEffect(() => {
  console.log("effect ran");
  return () => {
    console.log("cleanup ran");
  };
}, [someValue]);
```

Timeline:

1. Mount → effect runs.
2. `someValue` changes → cleanup (from previous run) fires, **then** effect runs again.
3. Repeats on every change.
4. Unmount → cleanup fires one last time.

With `[]` as deps, the effect only runs once on mount, so cleanup — if present — only fires on unmount (there's no "re-run" to clean up before).

---

## 5. Mental model summary

| Piece                                   | Role                                               | Runs                                                          |
| --------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `useSharedValue(0)`                     | Creates the live variable                          | Once, on mount                                                |
| `sv.value = withSpring(1)`              | **Starts** a value animating toward a target       | Once (in `useEffect`/handler), but plays out over many frames |
| `useAnimatedStyle(() => ({...}))`       | **Reads** current value(s), returns a style object | Continuously, every frame the tracked values change           |
| `<Animated.View style={animatedStyle}>` | Applies the live style to the native view          | Continuously                                                  |

**Analogy:** `useSharedValue` + `withSpring` is a dimmer switch slowly rotating on its own. `useAnimatedStyle` is a sensor that constantly reads the dimmer's current position and reports it as "brightness: X%" — it doesn't turn the dimmer, it just reports what it currently reads.




