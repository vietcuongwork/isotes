# Rebuilding BottomSheet From Scratch — Learning Guide

This is a self-study guide for rebuilding an equivalent of this repo's `BottomSheet`
component (`@lift-ui-kit/react-native`'s `BottomSheet.tsx` + `BottomSheetStack.tsx`)
from first principles, as a learning exercise. It is **not** a proposal to change the
production component — the real one lives in the design-system package and is out of
scope for this app repo.

## What the real component does

- Bespoke implementation on `react-native-gesture-handler` (`Gesture.Pan()`) +
  `react-native-reanimated` (shared values, `withSpring`) — **not** `@gorhom/bottom-sheet`.
- Imperative ref API: `open()`, `close()`, `snapToIndex(index)`.
- Either fixed `snapPoints` (e.g. `['35%', '75%']`) or auto-sizing to content height
  (capped at ~90% of screen height).
- Drag-to-dismiss with a distance threshold (dynamic mode) or velocity-based snap
  stepping (multi-snap mode).
- Animated backdrop with optional tap-to-dismiss.
- A stack/portal layer (`BottomSheetStackProvider`) so multiple sheets can be pushed,
  with only the top one interactive.
- A `useBottomSheet()` hook (`present(node)` / `dismiss()`) as the app-facing API,
  debounced to swallow double-taps.
- Android hardware back-button closes the open sheet.

No app-level tests exist for the app's usage (`ConditionalBottomSheet`, the stack
provider, or the service bridge) — only the design-system package itself has
component tests (RTL + `GestureHandlerRootView`).

## Scope phasing

Build in this order — each stage is independently demoable:

1. Single fixed-height sheet, no animation, boolean prop for open/closed.
2. Add `translateY` shared value + `withSpring` toggle.
3. Add `GestureDetector` + `Gesture.Pan()` for drag-to-dismiss only.
4. Add `useImperativeHandle` (`open`/`close`) — replace the boolean prop with a ref.
5. Add dynamic content sizing (`onLayout` measurement + `useAnimatedReaction`).
6. Add `snapPoints` + `snapToIndex`, velocity-based index stepping.
7. Add backdrop opacity interpolation + tap-to-dismiss.
8. Add Android back-button handling.
9. Build the stack/portal context, migrate to push/pop instead of direct refs.
10. Wrap in `useBottomSheet()` with debounce as the final public API.

## Starting sketch (stages 1–3)

```tsx
// BottomSheet.tsx
import React, { forwardRef, useImperativeHandle } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5; // fixed for stage 1-3; dynamic sizing comes in stage 5
const SPRING_CONFIG = { damping: 25, stiffness: 300, mass: 0.5 };
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.3;

export type BottomSheetMethods = {
  open: () => void;
  close: () => void;
};

type Props = {
  children: React.ReactNode;
  onClose?: () => void;
  dismissOnBackdropPress?: boolean;
};

export const BottomSheet = forwardRef<BottomSheetMethods, Props>(
  ({ children, onClose, dismissOnBackdropPress = true }, ref) => {
    // 0 = open (on screen), SHEET_HEIGHT = fully offscreen below
    const translateY = useSharedValue(SHEET_HEIGHT);

    const open = () => {
      translateY.value = withSpring(0, SPRING_CONFIG);
    };

    const close = () => {
      translateY.value = withSpring(SHEET_HEIGHT, SPRING_CONFIG, (finished) => {
        if (finished && onClose) runOnJS(onClose)();
      });
    };

    useImperativeHandle(ref, () => ({ open, close }));

    // stage 3: drag-to-dismiss
    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        // clamp so you can't drag above the open position
        translateY.value = Math.max(0, event.translationY);
      })
      .onEnd((event) => {
        const shouldDismiss =
          event.translationY > DISMISS_THRESHOLD || event.velocityY > 500;

        if (shouldDismiss) {
          translateY.value = withSpring(SHEET_HEIGHT, SPRING_CONFIG, (finished) => {
            if (finished && onClose) runOnJS(onClose)();
          });
        } else {
          translateY.value = withSpring(0, SPRING_CONFIG);
        }
      });

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      // opacity fades out as the sheet slides down and off screen
      opacity: 1 - translateY.value / SHEET_HEIGHT,
    }));

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnBackdropPress ? close : undefined}
          />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, sheetStyle]}>{children}</Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
});
```

Notes on this sketch:

- The drag gesture in stage 3 lets you drag the sheet *up* past its open position too
  (no clamp on the upper bound beyond `0`) — intentional at this stage; snap points
  (stage 6) are what introduce a real upper bound and multi-position stepping.
- `runOnJS` is required because `onClose` is a normal JS callback and the spring
  callback runs on the UI thread.
- `pointerEvents="box-none"` on the outer wrapper lets touches pass through to
  whatever is behind the sheet/backdrop except where the backdrop's `Pressable`
  actually sits.

## Patterns worth weighing before you copy them

- **Imperative ref API (`open/close/snapToIndex`)** — helps here because open/close
  is usually triggered from event handlers deep in a tree (button taps), not derived
  from render state; passing an `isOpen` prop down would mean prop-drilling or a store
  just to flip a boolean. Cost: less declarative, needs `forwardRef` boilerplate.
  Reasonable tradeoff for a sheet specifically, since its internal animation state
  (mid-drag position) is inherently imperative anyway.
- **Context-based stack/portal** — only pays off once you need more than one sheet
  coexisting, or a global `dismissAll()`. If your rebuild only ever needs one sheet on
  screen at a time, skip this layer — it's unneeded indirection for that case. Add it
  only when you reach stage 9 and actually need stacking.
- **Debounced `present()`** — masks a symptom (double-tap firing two opens) rather
  than fixing it at the source (disabling the trigger button while opening). Fine as a
  pragmatic guard, but worth noting it's a band-aid rather than a design requirement.

## Testing plan

Mirror the real component's test coverage:

- Renders children / handle / backdrop.
- Custom `testID`s propagate.
- Backdrop press dismisses only when `dismissOnBackdropPress` is true.
- Scrollable content doesn't break layout.
- Imperative `open`/`close`/`snapToIndex` actually move `translateY` (read shared-value
  state via reanimated test utilities, or assert on rendered style).

Gesture math itself (velocity thresholds, spring settling) is hard to unit test
meaningfully — the real repo doesn't test it either. Treat it as manual/e2e
verification territory.

## Differences from the original

Diffed our `src/components/bottomsheet/{BottomSheet,BottomSheetStack}.tsx` against the
real source at
`node_modules/@lift-ui-kit/react-native/src/components/molecules/BottomSheet/` (2026-09-14).
`BottomSheetStack.tsx` is a near-exact match; the gaps are in `BottomSheet.tsx`.

### `BottomSheet.tsx` — dropped feature surface

Not bugs, just capability the recreation doesn't expose:

- No `enableBackdrop` toggle or `backdropOpacity` prop. Original lets a consumer hide
  the backdrop or dim it to a custom opacity; ours always renders a fixed-opacity
  backdrop (`bg-grey-scrimSheet`, hardcoded).
- No `className`/`classNames.{handle,contentWrapper}`/`style`/
  `fixedContentWrapperStyle` overrides, no `testID`/`fsClasses`. Original exposes a full
  styling/testing override surface via its `cn()` merge helper; ours hardcodes all
  classNames inline.
- No `draggableContent` slot. Original lets you render extra content (e.g. a sticky
  search bar) inside the same gesture-draggable zone as the handle.

### `BottomSheet.tsx` — real behavior differences

- **Gesture activation bounds**: original sets `.activeOffsetY([-SCREEN_HEIGHT, 5])`
  (dynamic sheets) / `.activeOffsetY([-5, 5])` (snap-point sheets) on `Gesture.Pan()`.
  Ours sets none — falls back to gesture-handler's default activation, which is far
  more eager to claim the touch in any direction. Most likely source of a
  nested-`ScrollView` gesture conflict or a twitchy drag-start versus the original.
- **Dynamic-size height excludes the handle**: original sums
  `measuredContentHeight + measuredHandleHeight` (measures the handle bar separately
  via its own `onLayout`) into the height driving `translateY`/backdrop math. Ours only
  measures the content `View`, so the JS-side "sheet height" used for
  animation/dismiss-threshold math slightly undercounts the real rendered height.
- **`fixedContentWrapperAnimatedStyle` (snap-point sheets only)**: original gives the
  content wrapper its own animated height (`visibleSheetHeight - handleHeight`) that
  live-resizes as you drag between snap points. Ours has no equivalent — the content
  area doesn't get a resized height during drag, it just sits inside the outer
  `Animated.View`'s `overflow-hidden` clip.
- **Closed `translateY` initial value for snap-point sheets**: original initializes
  `translateY` to `maxSnapHeight` when snap points are set; ours always initializes to
  `SCREEN_HEIGHT` regardless of mode. Both start off-screen, but the original's number
  is tied to the sheet's own max height rather than the device screen height — matters
  when `maxSnapHeight < SCREEN_HEIGHT` (first-frame backdrop opacity/flash).
- **Explicit z-index**: original sets `zIndex: 100` (backdrop) / `101` (sheet); ours
  relies purely on JSX order with no explicit z-index. Only matters if a sheet shares a
  stacking context with other absolutely-positioned siblings that declare their own.

### `BottomSheetStack.tsx`

- **Depth-based scale/translate animation plumbing is gone, not just inert.** Original's
  `StackedSheetWrapper` wraps each sheet in an `Animated.View` with real
  `useSharedValue`/`useAnimatedStyle`/`useEffect` driving `scale`/`translateY` by stack
  depth — currently a no-op there too (`SCALE_FACTOR = 1`, `TRANSLATE_Y_FACTOR = 0`),
  matching the comment already in our file (stage 9 note). But ours doesn't just have
  inert constants — the whole mechanism was dropped in favor of a plain `View`. If depth
  visuals are ever turned on upstream, porting that forward means re-adding the
  Animated.View machinery from scratch, not just changing two constants.
- **Ref merging**: original reads any `ref` already attached to the incoming
  `sheet.component` (checks both the new JSX ref-as-prop and legacy `.ref`) and chains
  it with its own internal ref, so a caller's own ref on the JSX handed to `present()`
  still gets called. Ours only ever assigns `sheet.ref.current` — a ref pre-attached by
  the caller would be silently dropped by `cloneElement`. Low risk today since our
  `present()` API returns the ref rather than expecting one passed in, but it's a real
  capability gap versus the original.
- **`pushSheet` opens sheets differently**: original calls
  `ref.current?.snapToIndex(0)`; ours calls `ref.current?.open()`. Equivalent for
  snap-point sheets. For dynamic-sizing sheets, `snapToIndex` no-ops in the original's
  `BottomSheet.tsx` (`if (isDynamicSizing) return`) — meaning, as far as the source
  shows, pushing a dynamic-sizing sheet through the *original* stack never actually
  opens it (unconfirmed whether that combination is even used upstream). Our use of
  `open()` correctly handles both dynamic and snap-point sheets — a spot where this
  recreation is arguably more correct than the source it's copying.
- **`stackedSheetWrapperProps` passthrough**: original's `BottomSheetStackProvider`
  accepts optional per-wrapper overrides (`style`, `fsClass`) forwarded to every
  `StackedSheetWrapper`. Ours doesn't expose this —
  `BottomSheetStackProviderProps` is just `{ children }`.

### Priority if porting any of this forward

`activeOffsetY` gesture bounds and the handle-height measurement are the two most
likely to produce a visibly different feel from the original component; the rest are
either inert (depth animation) or edge cases (ref merging, dynamic+stack combo).
