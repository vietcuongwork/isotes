/**
 * Who owns the bottom of the screen, decided by focus rather than by keyboard
 * events:
 *  - "pad":    a number-pad input is focused. iOS still sends keyboard frames
 *              for the empty `inputView` it installs; those only ever mean
 *              "the system keyboard is leaving".
 *  - "system": some other TextInput is focused, so trust the system frames.
 *  - "none":   nothing is focused, so no inset, even if a stale frame says otherwise.
 */
export type KeyboardOwner = "pad" | "system" | "none";

/** Height of the screen covered by the system keyboard, from an event's end frame. */
export function coveredBySystemKeyboard(
  screenHeight: number,
  keyboardTopY: number,
  hostBottomGap = 0,
): number {
  return Math.max(0, Math.round(screenHeight - keyboardTopY - hostBottomGap));
}

/**
 * How one value moves in a transition:
 *  - "now":     jump at the start (hidden under the system keyboard, so it doesn't show)
 *  - "animate": animate with the transition
 *  - "after":   jump once the transition has finished (the system keyboard covers it by then)
 *  - "keep":    leave as is
 */
export type StepMode = "now" | "animate" | "after" | "keep";
export interface Step {
  to: number;
  mode: StepMode;
}

export interface TransitionPlan {
  /** Where the tracked system keyboard height animates to. */
  system: number;
  /** Minimum inset while the pad owns the bottom (its height), else 0. */
  padFloor: Step;
  /** Number pad visibility, 0 (hidden below the screen) to 1 (in place). */
  padShown: Step;
  /** Final inset once everything has settled. */
  settledInset: number;
}

/**
 * Plans a keyboard hand-off. The sheet's inset is `max(system, padFloor)`.
 *
 *  - system -> pad: the pad slides in. KeyboardHost runs this as a sequence:
 *    first system -> none (the system keyboard slides down), then none -> pad.
 *  - pad -> system: the pad stays until the rising system keyboard has
 *    covered it, then hides (plain TextInputs). If the system keyboard is
 *    shorter than the pad, nothing would cover it, so the pad slides out.
 *    FormTextInput instead defers its keyboard until the pad has left.
 *  - none <-> pad: the pad slides like a keyboard.
 */
export function planTransition(
  prev: KeyboardOwner,
  next: KeyboardOwner,
  padHeight: number,
  systemHeight: number,
): TransitionPlan {
  const pad = Math.max(0, Math.round(padHeight));
  const system = next === "system" ? Math.max(0, Math.round(systemHeight)) : 0;
  const keep: Step = { to: prev === "pad" ? pad : 0, mode: "keep" };

  let padFloor: Step = keep;
  let padShown: Step = { to: prev === "pad" ? 1 : 0, mode: "keep" };

  if (next === "pad" && prev !== "pad") {
    padFloor = { to: pad, mode: "animate" };
    padShown = { to: 1, mode: "animate" };
  } else if (next === "pad") {
    padFloor = { to: pad, mode: pad === keep.to ? "keep" : "animate" }; // pad height changed (e.g. safe area)
  } else if (prev === "pad") {
    const covered = next === "system" && system >= pad;
    const mode: StepMode = covered ? "after" : "animate";
    padFloor = { to: 0, mode };
    padShown = { to: 0, mode };
  }

  return {
    system,
    padFloor,
    padShown,
    settledInset: Math.max(system, padFloor.to),
  };
}
