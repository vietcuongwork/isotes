# Scrolling a field above the NumberPad sheet

How `AmountField` / `MemberListRow`'s amount field stay visible above
`NumberPadBottomSheet`, and how that compares to
`react-native-keyboard-controller`'s `KeyboardAwareScrollView` (KASV).

Files:
- `src/features/expense/components/amount/NumberPadBottomSheet.tsx`
- `src/features/expense/hooks/useScrollFieldAboveSheet.ts`
- `src/features/expense/hooks/useSplitNumberPad.tsx` (one shared numpad for Split → Amounts)
- `src/components/bottomsheet/BottomSheet.tsx` (`onContentHeightChange`, `onDismissStart`)
- `src/components/bottomsheet/BottomSheetStack.tsx` + `useTapOutsideTopSheet.ts` + `SheetCoverContext.ts` (`passThrough`: how the numpad closes without blocking touches)
- Callers: `AddExpenseBottomSheet.tsx` (amount field), `SplitBottomSheet.tsx` + `MemberListRow.tsx` (per-member amounts)

Design decisions: `design_decisions.md` — "The number pad is a pass-through sheet…" and "The Split numpad target lives in the store…" (2026-09-30).

History of what was tried and ruled out: `log/encountered_errors_iv.md`
("Scrolling a field above a custom (non-keyboard) sheet…", 2026-09-28).

---

## 1. Why we need our own version

The amount fields use `showSoftInputOnFocus={false}`, so tapping one opens
`NumberPadBottomSheet` and **no real keyboard**. KASV only reacts to real
keyboard events (`onStart` / `onMove` / `onEnd` from the native keyboard), so
it never learns that something is covering the field. We reproduce its
behavior by hand, using the sheet's height instead of the keyboard's.

## 2. The pieces

### `NumberPadBottomSheet`
A thin wrapper around our `BottomSheet`:
- No `snapPoints` → dynamic sizing, so `BottomSheet` measures its content and
  reports it through `onContentHeightChange` (content height + handle height).
  `NumberPadBottomSheet` forwards this as `onHeightChange`. This is our
  equivalent of "keyboard height".
- `onDismissStart` → forwarded to `BottomSheet`, which calls it at the very
  start of `close()` (before the close spring runs). This is our equivalent
  of KASV's `onStart` with `height === 0`.
- `onClose` fires only after the close spring finishes; the stack turns it
  into the caller's `onDismiss`.
- `target: "expenseAmount" | "activeSplitMember"` (required) — what the keys
  edit. `"activeSplitMember"` reads `activeSplitMemberId` from the store at
  keypress time, so the same pushed sheet can be retargeted.
- `showBackdrop={false}`, `dismissOnBackdropPress={false}`,
  `dragToDismissEnabled={false}` — the caller pushes it with
  `passThrough`, so the content behind stays scrollable and the stack's root
  tap detector closes it on a tap outside (a touch that moved ≤ 10px). A tap
  on the field being edited is ignored (`isTapIgnored`), like a real keyboard.

### `useScrollFieldAboveSheet(scrollTo, measureViewportBottom?)`
The caller passes in how to scroll its own list
(`flatListRef.current?.scrollToOffset(...)` / `scrollViewRef.current?.scrollTo(...)`,
both `animated: true`) and, when something sits below the scroll view
(Split's `AddPerson` footer), where its visible area ends on screen. The
reserve is only the part of the scroll view the sheet covers —
`max(0, viewportBottom − (SCREEN_HEIGHT − h))` — so the furthest scroll
leaves the last row just above the numpad. See [[Debug_numpad-reserve-overshoot]].

| Returned | Used for |
|---|---|
| `handleScroll` | Wire to `onScroll`; keeps `scrollOffsetRef` = current offset |
| `extraBottomSpace` | Plain state; the caller adds it as bottom space (`paddingBottom` on the FlatList content, a spacer in the ScrollView) |
| `scrollFieldIntoView(fieldRef, sheetHeight)` | Call from `onHeightChange`, and again when switching fields while open |
| `resetExtraBottomSpace()` | Call from `onDismissStart` |

### `useSplitNumberPad` (Split → Amounts only)
One numpad for every amount row. Rows register their field
(`registerField`) and report focus (`onRequest`). The hook pushes the sheet
once, and on a tap on another row's field retargets `activeSplitMemberId`
instead of closing and re-pushing. The caret follows `isActive`.

## 3. Flow

**Open**
```
tap amount field
  → caller pushSheet(<NumberPadBottomSheet …/>)
  → BottomSheet lays out content → onContentHeightChange(h) → onHeightChange(h)
  → scrollFieldIntoView(fieldRef, h)
       - fresh open? save offsetBeforeOpenRef = current scroll offset
       - measureViewportBottom? → reserve = covered part only (else h)
       - setExtraBottomSpace(reserve) + scrollRequest++   ← 1 re-render
  → useEffect([scrollRequest, extraBottomSpace]) → requestAnimationFrame
       - fieldRef.measure() → pageY, height
       - overlap = pageY + height + 16 − (SCREEN_HEIGHT − h)
       - overlap > 0 → scrollTo(currentOffset + overlap)   ← native animated scroll (~300ms)
```

**Switch field (Split, numpad open)**
```
tap B's field
  → stack root endCapture: tap outside the numpad → isTapIgnored(B's field) → activeSplitMemberId = B
  → A blur (not active → no side effects) → B focus → openFor(B)
       - already open → scrollFieldIntoView(B, h) (scrollRequest++ re-runs the scroll even if the reserve is unchanged)
```

**Close**
```
tap outside the numpad (moved ≤ 10px, not on the edited field)
  → stack root → sheet ref.close()   (not popSheet — see design_decisions)
  → onDismissStart → (Split: activeSplitMemberId = null, blur) resetExtraBottomSpace()
       - scrollTo(offsetBeforeOpenRef)      ← native animated scroll, runs alongside the sheet's close spring
       - setTimeout(SCROLL_BACK_MS = 350) → setExtraBottomSpace(0)   ← 1 re-render, no jump
  → close spring finishes → onClose → caller's onDismiss (AddExpense caret cleanup only)
```

Why removing the space can't jump: `offsetBeforeOpenRef` was a valid offset
*before* the space existed, so once we're back there the space is entirely
below the viewport.

## 4. Compared with KeyboardAwareScrollView

The overall shape is the same as KASV's: **reserve space up front → scroll
the field into view → on close, scroll back to the saved offset → drop the
space in one step**. Where we differ:

| | KASV | Ours | Does it matter? |
|---|---|---|---|
| What covers the field | Real keyboard, height from native keyboard events | Our sheet, height from `onContentHeightChange` | No — just a different source |
| How space is reserved | `contentInset` via `useAnimatedProps` — not a layout prop, no React re-render | `extraBottomSpace` state as padding/spacer, sized to the covered part of the scroll view — 1 re-render on open, 1 on close | Barely. 2 re-renders per open/close cycle is cheap. (A Reanimated value here broke measure/scroll — see the log.) |
| Scroll timing | Frame-synced: every keyboard frame (`onMove`), `scrollTo` on the UI thread, interpolated from keyboard height | Two independent animations started together: the sheet's spring + iOS's own `~300ms` animated scroll | **This is the one visible difference.** Both move together, but their curves differ, so the list may finish slightly before the sheet |
| When the space is removed | `onEnd` — exactly when the keyboard animation ends | A fixed `SCROLL_BACK_MS` timer | Small risk if iOS's scroll ever took longer than 350ms |
| Finding the field | Native focused-input layout events, even while typing (multiline growth, selection changes) | One `.measure()` after a frame | Not needed — the amount field is single-line and fixed height |
| Switching fields while open | Handles focus changes | Split: one shared numpad retargets via the store; `scrollRequest` re-runs the scroll; `offsetBeforeOpenRef` only saved on a fresh open | Equivalent for our use |
| Scrolling while open | Always possible | Possible since the `passThrough` change — the covered sheet stays touchable | Equivalent |
| Closing on a tap outside | ScrollView blurs the input (needs real keyboard metrics) | Stack root tap detector (distance ≤ 10px); a tap that stops momentum counts as a tap | Small: RN skips momentum-stop taps by timing (16ms); we accepted not doing that |
| Screen height | `useWindowDimensions()` (live) | `Dimensions.get("window")` at import | Only matters with rotation / split screen, which we don't support |

**Bottom line:** functionally we match KASV. The only gap is that KASV's scroll is
locked frame-by-frame to the thing covering the field; ours runs alongside it.

## 5. What closing that gap would take (the "Option 2" notes)

To be frame-synced like KASV, the scroll must be driven on the UI thread
from `BottomSheet`'s `translateY` (its animated position). Reanimated's
`scrollTo(animatedRef, x, y, false)` is the only way to scroll from the UI
thread, and it needs an **animated ref** — a ref made with `useAnimatedRef()`
that Reanimated can resolve to the native view. A normal `useRef` won't do.

Three changes would be needed:

1. **`BottomSheet.tsx` exposes its position.** It would expose `translateY` (or
   the visible sheet height) as a shared value, so the caller can react to it
   every frame with `useAnimatedReaction`. That changes a shared component used
   by every sheet in the app.

2. **`SplitBottomSheet`: the plain `FlatList` becomes Reanimated's `Animated.FlatList`.**
   Our `useRef<FlatList>` gets swapped for `useAnimatedRef()`, passed as its
   `ref`. The list is a plain `FlatList` with `ref={flatListRef}` today, so this
   swap is straightforward. The old problem was different: `renderScrollComponent`
   used to wrap the list in a KASV, and `FlatList` replaced any ref set there
   with its own (`_captureScrollRef`). That's no longer the case, but the comment
   at `SplitBottomSheet.tsx:52-56` still describes it. The comment is stale and
   should be updated.

3. **`AddExpenseBottomSheet`: getting an animated ref out of KASV.** KASV
   builds its own animated ref internally for its own scrolling. What it hands
   back through `ref` is the plain ScrollView instance, with an extra
   `assureFocusedInputVisible` method attached. We'd pass our own
   `useAnimatedRef()` as KASV's `ref` and hope Reanimated can resolve that
   instance to the native scroll view. That probably works, but it's
   **unverified** and relies on KASV internals, so it would need a test before
   we rely on it.

Then, in the hook, a worklet reads the sheet's `translateY` every frame. As
the sheet goes from open to closed, it interpolates the scroll offset from
"field in view" back to `offsetBeforeOpenRef` and calls `scrollTo(animatedRef, …)`.
This is what KASV's `maybeScroll` does with `e.height`. The space would be removed
in the close spring's finished callback instead of a timer.

### Is it worth it?

Probably not right now. The difference is the curve mismatch over a
~300ms motion. What was clearly visible before, the list waiting until the
sheet had fully closed, is already fixed by starting the scroll in
`onDismissStart`. Option 2 touches the shared `BottomSheet.tsx`, both callers
and the hook, and it depends on an unverified KASV ref detail. Consider it if
the list and sheet visibly drift apart on close.
