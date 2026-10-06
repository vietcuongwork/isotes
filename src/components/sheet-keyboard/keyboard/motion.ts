import { Easing } from "react-native";

/**
 * One curve for everything that moves with "the keyboard" (the sheet lift,
 * the sheet height clamp and the number pad), so they cannot drift apart.
 *
 * LayoutAnimation's 'keyboard' type is not an option: on Fabric it falls
 * through to linear (ReactCommon/react/renderer/animations/utils.cpp). This
 * bezier approximates UIKit's keyboard curve; tune it against a screen
 * recording if the sheet and the system keyboard separate mid-animation.
 */
export const KEYBOARD_EASING = Easing.bezier(0.38, 0.7, 0.125, 1);

/** Used when no system event provides a duration (the number pad). */
export const PAD_DURATION_MS = 250;

export const SHEET_OPEN = { duration: 320, easing: Easing.out(Easing.cubic) };
export const SHEET_CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) };
/** Open and close with Reduce Motion on: a fade instead of a slide. */
export const SHEET_FADE = { duration: 200, easing: Easing.inOut(Easing.quad) };

/**
 * Render latency between starting a JS-driven layout animation and its first
 * frame reaching the screen (measured on the iOS 26 simulator: the sheet
 * trailed the system keyboard by ~3 frames, of which up to one is the
 * host's frame coalescing, which is measured separately at run time).
 */
export const RENDER_LATENCY_MS = 20;

/**
 * Hand-offs between keyboards start when the leaving one is visibly gone, not
 * when its animation formally ends: the keyboard curve's long flat tail showed
 * as a ~0.2 s pause with no keyboard (measured from video).
 *  - HANDOFF_PT: the system keyboard is this close to gone (pt) -> the pad starts.
 *    iOS reports up to 383 ms for the swap's hide while the keyboard is visibly
 *    gone after ~170-250 ms; the curve has 12 pt left at 60% of its duration.
 *    The system keyboard draws above the pad, so the overlap doesn't show.
 *  - PAD_RELEASE_AT: this much of the pad is left (0..1) -> a deferred native
 *    field gets its keyboard; iOS takes ~150 ms to start it after that.
 */
export const HANDOFF_PT = 12;
export const PAD_RELEASE_AT = 0.15;

/**
 * Starts an easing `lead` (0..1) of the way in. The system keyboard is already
 * moving by the time JS animates, so the sheet jumps to where the keyboard is
 * on the shared curve, then runs the remainder with an easing remapped onto
 * the remaining time.
 */
export function leadIn(
  easing: (t: number) => number,
  lead: number,
): { start: number; easing: (u: number) => number } {
  const l = Math.min(0.9, Math.max(0, lead));
  const start = easing(l);
  if (start >= 1) return { start: 1, easing: () => 1 };
  return {
    start,
    easing: (u: number) => (easing(l + u * (1 - l)) - start) / (1 - start),
  };
}
