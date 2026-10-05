import { useRef } from "react";
import type { GestureResponderEvent } from "react-native";

const TAP_SLOP = 10; // px — a finger that moved further was scrolling, not tapping

interface Point {
  x: number;
  y: number;
}

interface UseTapOutsideTopSheetOptions {
  /** Called on a tap that didn't start inside the top sheet. The caller
   * decides whether that tap should close anything. */
  onTapOutside: (e: GestureResponderEvent) => void;
}

// A tap vs a scroll is decided by distance alone: onTouchEndCapture fires
// after a scroll too, and onScrollBeginDrag can be missing or arrive late.
// why: [[Feat_numpad-scroll-passthrough_implementation]] (T1)
function isTap(start: Point, e: GestureResponderEvent): boolean {
  return (
    Math.abs(e.nativeEvent.pageX - start.x) <= TAP_SLOP &&
    Math.abs(e.nativeEvent.pageY - start.y) <= TAP_SLOP
  );
}

// Handlers for the stack's root View. It only observes touches — it never
// becomes the responder, so scrolls and presses underneath run as usual.
export default function useTapOutsideTopSheet({
  onTapOutside,
}: UseTapOutsideTopSheetOptions) {
  const touchStartRef = useRef<Point>({ x: 0, y: 0 });
  const touchStartedInTopSheetRef = useRef(false);

  // Typed stand-in for onTouchStartCapture: RN asks this on every touch
  // start, top-down; returning false never claims the touch.
  const onStartShouldSetResponderCapture = (e: GestureResponderEvent) => {
    touchStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    touchStartedInTopSheetRef.current = false;
    return false;
  };

  // Wire to the top sheet wrapper's onTouchStart — it bubbles up after the
  // root's capture start, and before the root's capture end.
  const markTouchInTopSheet = () => {
    touchStartedInTopSheetRef.current = true;
  };

  // A cancelled touch never reaches here, so it's never counted as a tap.
  const onTouchEndCapture = (e: GestureResponderEvent) => {
    if (touchStartedInTopSheetRef.current) return;
    if (!isTap(touchStartRef.current, e)) return;
    onTapOutside(e);
  };

  return {
    onStartShouldSetResponderCapture,
    onTouchEndCapture,
    markTouchInTopSheet,
  };
}
