/**
 * Pure geometry and gesture decisions for the sheet and its scroll view.
 * Kept free of React Native so they are proven by unit tests.
 */

export interface SheetGeometry {
  /** Resting height: the snap height, or header + content + home indicator (Infinity until measured). */
  preferredHeight: number;
  /** Space between the top safe-area gap and the screen bottom. */
  room: number;
  safeBottom: number;
  /** What must stay visible above a keyboard: the header plus a usable strip of the scroll view. */
  minAboveKeyboard: number;
}

/** The usable scroll strip kept visible above a keyboard (pt), below the header. */
export const MIN_VISIBLE_SCROLL = 96;

/**
 * Height of the sheet when a keyboard covers `inset` px. The sheet stays docked to the screen
 * bottom and keyboards slide over it; it only grows (its top rises) when its resting height would
 * leave less than `minAboveKeyboard` visible above the keyboard.
 */
export function surfaceHeightAt(inset: number, g: SheetGeometry): number {
  const resting = Math.min(g.preferredHeight, g.room);
  const needed = inset > 0 ? inset + g.minAboveKeyboard : 0;
  return Math.max(0, Math.min(g.room, Math.max(resting, needed)));
}

/** How much the sheet grows above its resting height for a keyboard of `inset` px. */
export function raiseAt(inset: number, g: SheetGeometry): number {
  return Math.max(
    0,
    surfaceHeightAt(inset, g) - Math.min(g.preferredHeight, g.room),
  );
}

/**
 * How much of the scroll viewport is covered at the bottom. The scroll view reaches the sheet's
 * bottom edge (the screen bottom: content is drawn behind keyboards and the home indicator, so
 * no blank strip ever shows next to a keyboard); this much of it becomes bottom content inset.
 */
export function coveredAt(inset: number, g: SheetGeometry): number {
  return Math.max(inset, g.safeBottom);
}

/**
 * How much the visible scroll area grows (+) or shrinks (-) when the keyboard
 * inset moves from `from` to `to`. Lets the scroll view reveal the focused
 * field at the start of a keyboard transition instead of after it.
 */
export function viewportDelta(
  from: number,
  to: number,
  g: SheetGeometry,
): number {
  const visible = (inset: number) =>
    surfaceHeightAt(inset, g) - coveredAt(inset, g);
  return visible(to) - visible(from);
}

/**
 * The sheet's raise during one keyboard transition, moving linearly in the
 * inset from `from` to `to`. Linear (instead of following the clamped geometry)
 * so the top edge eases along the keyboard's own curve instead of starting late
 * and moving 1:1 with the keyboard. Immutable: swapping a whole segment is
 * atomic (updating several Animated values one by one rendered a torn
 * in-between frame).
 */
export interface Segment {
  from: number;
  to: number;
  raise: [number, number];
}

/** A segment's raise at `inset`, clamped to its range. */
export function segmentValue(seg: Segment, inset: number): number {
  const [start, end] = seg.raise;
  if (seg.to === seg.from) return end;
  const t = Math.min(1, Math.max(0, (inset - seg.from) / (seg.to - seg.from)));
  return start + (end - start) * t;
}

/**
 * The segment for a transition from `from` to `to`. It starts from what is
 * *displayed* now (the previous segment at `from`), so retargeting mid-flight
 * is continuous, and ends at the true geometry for `to`. Without a previous
 * segment (mount, geometry change) it starts from the true geometry.
 * `hold` keeps the raise where it is: a hand-off between keyboards, where the
 * next one moves the top once instead of it dropping and rising again.
 */
export function nextSegment(
  prev: Segment | null,
  from: number,
  to: number,
  g: SheetGeometry,
  hold = false,
): Segment {
  const raise0 = prev ? segmentValue(prev, from) : raiseAt(from, g);
  return { from, to, raise: [raise0, hold ? raise0 : raiseAt(to, g)] };
}

export interface ScrollSession {
  /** Offset when the keyboard opened. */
  baseline: number;
  /** We scrolled (to reveal a field) while it was up. */
  auto: boolean;
  /** The user scrolled while it was up. */
  manual: boolean;
}

/**
 * Where to scroll when the keyboard closes: back to where the user was before it opened if only
 * our reveal moved the content, else stay; always within the scrollable range ending at `end`.
 */
export function restoreOffset(
  session: ScrollSession,
  current: number,
  end: number,
): number {
  const preferred =
    session.auto && !session.manual ? session.baseline : current;
  return Math.min(Math.max(0, end), Math.max(0, preferred));
}

export interface RevealInput {
  /** Top of the focused field, in scroll-content coordinates. */
  fieldY: number;
  fieldHeight: number;
  /** Current content offset. */
  scrollY: number;
  /** Visible height of the scroll view. */
  viewportHeight: number;
  contentHeight: number;
  /** Space to keep between the field and the viewport edge. */
  margin: number;
}

/**
 * The smallest scroll that shows the whole field plus `margin`, clamped to the
 * scrollable range. `null` means "don't scroll" (already visible, or the
 * viewport hasn't been measured). A field taller than the viewport gets its
 * top aligned, so the caret line stays visible.
 */
export function revealOffset({
  fieldY,
  fieldHeight,
  scrollY,
  viewportHeight,
  contentHeight,
  margin,
}: RevealInput): number | null {
  if (viewportHeight <= 0) return null;
  const top = fieldY - margin;
  const bottom = fieldY + fieldHeight + margin;

  let wanted: number;
  if (bottom - top > viewportHeight || top < scrollY) wanted = top;
  else if (bottom > scrollY + viewportHeight) wanted = bottom - viewportHeight;
  else return null;

  const max = Math.max(0, contentHeight - viewportHeight);
  const clamped = Math.min(max, Math.max(0, wanted));
  return Math.abs(clamped - scrollY) < 1 ? null : clamped;
}

export const DISMISS = {
  /** px/ms downward velocity that closes regardless of distance. */
  flickVelocity: 1,
  /** Fraction of the sheet height that closes on a slow drag. */
  distanceRatio: 0.3,
  /** Upper bound on the distance threshold, for tall sheets. */
  maxDistance: 150,
  /** Threshold used before the sheet has been measured. */
  unmeasuredDistance: 150,
  /** Pull-down past the top of the scroll content that closes the sheet (px). */
  overscrollDistance: 90,
  /** Downward release velocity at the top of the content that closes (iOS reports px/ms, negative = down). */
  overscrollVelocity: -1.6,
};

/** Should releasing a handle drag of `dy` px at `vy` px/ms close the sheet? */
export function shouldDismissDrag(
  dy: number,
  vy: number,
  sheetHeight: number,
): boolean {
  if (dy <= 0) return false;
  if (vy >= DISMISS.flickVelocity) return true;
  const threshold =
    sheetHeight > 0
      ? Math.min(DISMISS.maxDistance, sheetHeight * DISMISS.distanceRatio)
      : DISMISS.unmeasuredDistance;
  return dy >= threshold;
}

/**
 * Should a scroll gesture that ends while the content is pulled past its top
 * close the sheet? `offsetY` is negative while overscrolled; `velocityY` is
 * the iOS `onScrollEndDrag` velocity (negative when flicking down).
 */
export function shouldDismissOverscroll(
  offsetY: number,
  velocityY: number,
): boolean {
  if (offsetY >= 0) return false;
  return (
    -offsetY >= DISMISS.overscrollDistance ||
    velocityY <= DISMISS.overscrollVelocity
  );
}

/** How far (0..1) the keyboard is through a transition from `from` to `to`, read from the inset. */
export function transitionProgress(
  inset: number,
  from: number,
  to: number,
): number {
  if (to === from) return 1;
  return Math.min(1, Math.max(0, (inset - from) / (to - from)));
}

/**
 * Scroll offset that moves from `y0` to `target` in step with the keyboard: it starts at
 * progress `p0` (where the keyboard was when the scroll started) and lands with it at 1.
 */
export function followOffset(
  y0: number,
  target: number,
  p0: number,
  p: number,
): number {
  if (p0 >= 1) return target;
  const t = Math.min(1, Math.max(0, (p - p0) / (1 - p0)));
  return y0 + (target - y0) * t;
}

/** Finger travel (pt) beyond which a touch is a drag, not a tap. */
export const TAP_SLOP = 10;

export interface Tap {
  /** Distance between touch start and end. */
  moved: number;
  /** The touch turned into a scroll. */
  scrolled: boolean;
  /** keyboardShouldPersistTaps="always". */
  persistAlways: boolean;
  /** A text input is focused (some keyboard is up or coming). */
  hasFocus: boolean;
  /** Native tags of the touched view and of the focused input (null if unknown). */
  targetTag: number | null;
  focusedTag: number | null;
}

/** A tap anywhere but the focused text input (buttons included) closes the keyboard. */
export function tapDismissesKeyboard(t: Tap): boolean {
  if (!t.hasFocus || t.persistAlways || t.scrolled || t.moved > TAP_SLOP)
    return false;
  return t.targetTag !== null && t.targetTag !== t.focusedTag; // unknown target: keep the keyboard
}

// ---------------------------------------------------------------------------
// Snap mode

export type SnapPoint = number | `${number}%`;

/** Snap heights in px, ascending, each limited to `room` (the space below the top gap). */
export function resolveSnapPoints(
  points: readonly SnapPoint[],
  windowHeight: number,
  room: number,
): number[] {
  const px = points.map((p) =>
    typeof p === "number" ? p : (parseFloat(p) / 100) * windowHeight,
  );
  return [
    ...new Set(px.map((h) => Math.round(Math.min(room, Math.max(0, h))))),
  ].sort((a, b) => a - b);
}

export const SNAP = {
  /** How far ahead the release velocity is projected (ms) when choosing a snap point. */
  projectionMs: 200,
  /** Fraction of the pull past the highest point that the sheet follows (rubber band). */
  rubberBand: 0.25,
};

/**
 * Sheet height and closing offset while dragging the handle: between snap
 * points the sheet resizes; past the highest it rubber-bands; below the lowest
 * it keeps that height and translates down (towards closing).
 */
export function dragGeometry(
  baseHeight: number,
  dy: number,
  snaps: readonly number[],
): { height: number; translate: number } {
  const min = snaps[0];
  const max = snaps[snaps.length - 1];
  const wanted = baseHeight - dy;
  if (wanted > max)
    return { height: max + (wanted - max) * SNAP.rubberBand, translate: 0 };
  if (wanted < min) return { height: min, translate: min - wanted };
  return { height: wanted, translate: 0 };
}

/**
 * Where a released drag settles. `height` is the unclamped dragged height
 * (baseHeight - dy), `velocity` the finger velocity in px/ms (positive = down).
 * Projects the motion forward and picks the nearest snap point, or 'close' when
 * the projection falls well below the lowest point (or a fast flick down from it).
 */
export function chooseSnap(
  height: number,
  velocity: number,
  snaps: readonly number[],
): number | "close" {
  const projected = height - velocity * SNAP.projectionMs;
  const min = snaps[0];
  if (shouldDismissDrag(min - height, velocity, min) && projected < min)
    return "close";
  let best = 0;
  snaps.forEach((s, i) => {
    if (Math.abs(s - projected) < Math.abs(snaps[best] - projected)) best = i;
  });
  return best;
}
