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
