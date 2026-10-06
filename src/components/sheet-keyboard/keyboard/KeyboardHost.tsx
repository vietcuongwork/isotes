import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  LayoutChangeEvent,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  coveredBySystemKeyboard,
  KeyboardOwner,
  planTransition,
  Step,
} from "./keyboardInset";
import {
  HANDOFF_PT,
  KEYBOARD_EASING,
  leadIn,
  PAD_DURATION_MS,
  PAD_RELEASE_AT,
  RENDER_LATENCY_MS,
} from "./motion";
import { NumberPadKeyboard } from "./NumberPadKeyboard";
import type { NumberPadKey } from "./numberPadLogic";
import { EdgeInsets, useSafeAreaInsets } from "./safeArea";

/** What a focused number-pad input hands to the host. */
export interface PadTarget {
  id: string;
  onKey: (key: NumberPadKey) => void;
  blur: () => void;
  decimalEnabled: boolean;
}

export interface KeyboardHostApi {
  /** Animated px of the screen bottom covered by whichever keyboard is up. */
  inset: Animated.AnimatedAddition<number>;
  safeArea: EdgeInsets;
  /** A number-pad input gained focus. */
  claimPad: (target: PadTarget) => void;
  /** A number-pad input lost focus. Ignored unless `id` still owns the pad. */
  releasePad: (id: string) => void;
  /**
   * Any input gained focus (keeps the focused-field reveal working when no keyboard moves).
   * `deferredKeyboard`: the input suppressed its system keyboard for now (it rises after the
   * pad has gone), so any system keyboard height recorded earlier is stale.
   */
  notifyFocus: (options?: { deferredKeyboard?: boolean }) => void;
  /** Called once each keyboard transition has finished. Returns an unsubscribe function. */
  onSettled: (listener: () => void) => () => void;
  /**
   * Called synchronously when a keyboard transition starts, before its first frame, with the
   * inset it moves from (the current, possibly mid-flight value) and to. Returns an unsubscribe.
   */
  onTransitionStart: (
    listener: (transition: KeyboardTransition) => void,
  ) => () => void;
  /** The inset right now (mid-animation values included). */
  currentInset: () => number;
  /** Closes whichever keyboard is up (tap outside): blurs the pad input, or dismisses the system keyboard. */
  dismissKeyboard: () => void;
  /** The pad is up and interactive. Changes re-render consumers. */
  padUp: boolean;
  /** Nesting depth among KeyboardHosts (stacked sheets). */
  depth: number;
}

export interface KeyboardTransition {
  from: number;
  to: number;
}

type HostInternals = Omit<KeyboardHostApi, "safeArea" | "padUp" | "depth"> & {
  schedule: () => void;
};

const HostContext = createContext<KeyboardHostApi | null>(null);

/**
 * Mounted hosts (stacked sheets). Only the top one answers to the system
 * keyboard; hosts below treat it as not theirs. "Top" is the most deeply
 * nested host (a sheet opened from inside another sheet's content), with
 * mount order as the tiebreak. Not mount order alone: React runs effects
 * child-first, so a nested host mounting together with its parent would
 * register first.
 */
interface StackEntry {
  depth: number;
  reschedule: () => void;
}
const hostStack: StackEntry[] = [];
const topHost = () =>
  hostStack.reduce<StackEntry | undefined>(
    (top, entry) => (!top || entry.depth >= top.depth ? entry : top),
    undefined,
  );

export function useKeyboardHost(): KeyboardHostApi {
  const api = useContext(HostContext);
  if (!api)
    throw new Error(
      "Render this inside a <KeyboardHost> (BottomSheet provides one).",
    );
  return api;
}

export function useOptionalKeyboardHost(): KeyboardHostApi | null {
  return useContext(HostContext);
}

export interface KeyboardHostProps {
  children: ReactNode;
  /** Real insets (e.g. from react-native-safe-area-context). Skips the core SafeAreaView probe. */
  safeAreaInsets?: EdgeInsets;
}

/**
 * Owns "the keyboard" for its subtree. It tracks the system keyboard, renders
 * the number pad, and publishes one animated `inset` that layout follows.
 * Must fill the screen (e.g. be the root of a Modal).
 *
 * Focus, blur and keyboard events from a single focus switch arrive in no
 * fixed order. They only record facts, and one `requestAnimationFrame` flush
 * resolves them together, so switching fields never animates through 0.
 */
export function KeyboardHost({ children, safeAreaInsets }: KeyboardHostProps) {
  const { insets: safeArea, probe } = useSafeAreaInsets(safeAreaInsets);

  // inset = max(systemTrack, padFloor): the sheet never drops below whatever covers the screen bottom.
  const [systemTrack] = useState(() => new Animated.Value(0));
  const [padFloor] = useState(() => new Animated.Value(0));
  const [inset] = useState(() =>
    Animated.add(
      systemTrack,
      Animated.subtract(padFloor, systemTrack).interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: "clamp",
        extrapolateRight: "extend",
      }),
    ),
  );
  const [padShown] = useState(() => new Animated.Value(0));
  const [padHeight, setPadHeight] = useState(0);
  const [padInteractive, setPadInteractive] = useState(false);
  const [decimalEnabled, setDecimalEnabled] = useState(true);

  const facts = useRef({
    pad: null as PadTarget | null,
    padHeight: 0,
    systemHeight: 0,
    hostBottomGap: 0,
    duration: null as number | null,
    eventAt: null as number | null,
  });
  const applied = useRef({
    system: 0,
    padHeight: 0,
    owner: "none" as KeyboardOwner,
    token: 0,
    settled: true,
  });
  const frame = useRef<number | null>(null);
  /** False once unmounted: inputs released in their own unmount cleanup must not schedule a flush on a dead host. */
  const alive = useRef(false);
  const listeners = useRef(new Set<() => void>());
  const startListeners = useRef(
    new Set<(transition: KeyboardTransition) => void>(),
  );
  /** System -> pad sequence: the system keyboard is still leaving; the pad waits for it. */
  const systemLeaving = useRef(false);
  /** Mirrors of the animated values, so a transition can start from where the sheet really is. */
  const current = useRef({ system: 0, floor: 0 });
  const hostRef = useRef<View>(null);
  const parentHost = useContext(HostContext);
  const [depth] = useState(() => (parentHost ? parentHost.depth + 1 : 0));
  const stackEntry = useRef<StackEntry | null>(null);

  // `flush` reads refs only, so it can be created once and stay stable.
  const [api] = useState<HostInternals>(() => {
    const notify = () => listeners.current.forEach((listener) => listener());
    const currentInset = () =>
      Math.max(current.current.system, current.current.floor);

    const flush = () => {
      frame.current = null;
      const f = facts.current;
      const isTop = topHost() === stackEntry.current;
      const wanted: KeyboardOwner = f.pad
        ? "pad"
        : isTop && TextInput.State.currentlyFocusedInput()
          ? "system"
          : "none";
      const duration =
        f.duration && f.duration > 0 ? f.duration : PAD_DURATION_MS;
      const eventAt = f.eventAt;
      f.duration = null;
      f.eventAt = null;

      const prev = applied.current;
      // System -> pad runs as a sequence: the system keyboard slides down first (planned as
      // system -> none), and once it is visibly gone a second flush slides the pad up (none -> pad).
      // The pad keeps waiting through any flush in between: iOS sends the swap's frame events
      // before or after the focus change, and one arriving mid-way started the pad early.
      const holdPad =
        wanted === "pad" &&
        ((prev.owner === "system" && prev.system > 0) || systemLeaving.current);
      const owner: KeyboardOwner = holdPad ? "none" : wanted;
      const deferred = owner !== wanted;

      if (f.pad) setDecimalEnabled(f.pad.decimalEnabled);
      if (owner === "pad") setPadInteractive(true);

      const plan = planTransition(
        prev.owner,
        owner,
        f.padHeight,
        f.systemHeight,
      );
      if (
        prev.owner === owner &&
        prev.system === plan.system &&
        prev.padHeight === f.padHeight
      ) {
        // Focus moved without any keyboard motion (e.g. pad A -> pad B). Keep the
        // token: a transition still in flight must be allowed to finish, and it
        // announces "settled" itself (iOS sends frames for the pad's empty
        // inputView mid-transition; announcing then stopped the scroll midway).
        if (prev.settled) notify();
        return;
      }
      const token = prev.token + 1;
      applied.current = {
        system: plan.system,
        padHeight: f.padHeight,
        owner,
        token,
        settled: false,
      };
      systemLeaving.current = deferred;
      const padMayStart = () => {
        systemLeaving.current = false;
        schedule(); // phase 2: the pad slides up
      };

      const timing = (value: Animated.Value, toValue: number) =>
        Animated.timing(value, {
          toValue,
          duration,
          easing: KEYBOARD_EASING,
          useNativeDriver: false,
        });
      const steps: [Animated.Value, Step][] = [
        [padFloor, plan.padFloor],
        [padShown, plan.padShown],
      ];
      steps.forEach(([value, step]) => {
        if (step.mode === "now") value.setValue(step.to);
      });
      // Before the first frame, so layout (sheet geometry, scroll reveal) moves with the keyboard.
      // A flush that moves nothing (e.g. focus landed a frame before the keyboard's event) is not a transition.
      const transition = { from: currentInset(), to: plan.settledInset };
      if (transition.from !== transition.to)
        startListeners.current.forEach((listener) => listener(transition));

      // The system keyboard started animating when its event fired; by the time this frame's
      // animation reaches the screen it is ~3 frames ahead (measured). Start the tracked keyboard
      // that far along the same curve: time since the event plus the render latency.
      const systemFrom = current.current.system;
      const leadMs =
        eventAt === null
          ? 0
          : Math.min(
              duration / 2,
              performance.now() - eventAt + RENDER_LATENCY_MS,
            );
      const lead = leadIn(KEYBOARD_EASING, leadMs / duration);
      if (leadMs > 0)
        systemTrack.setValue(
          systemFrom + (plan.system - systemFrom) * lead.start,
        );
      // Starting a timing on a value stops the running one, so a quick second
      // switch retargets from wherever the keyboard currently is.
      const animations = [
        Animated.timing(systemTrack, {
          toValue: plan.system,
          duration: duration - leadMs,
          easing: leadMs > 0 ? lead.easing : KEYBOARD_EASING,
          useNativeDriver: false,
        }),
      ];
      steps.forEach(([value, step]) => {
        if (step.mode === "animate") animations.push(timing(value, step.to));
      });
      const whenBelow = (
        value: Animated.Value,
        threshold: number,
        run: () => void,
      ) => {
        const id = value.addListener(({ value: now }) => {
          if (applied.current.token !== token) return value.removeListener(id);
          if (now > threshold) return;
          value.removeListener(id);
          run();
        });
      };
      if (deferred) whenBelow(systemTrack, HANDOFF_PT, padMayStart);
      if (plan.padShown.to === 0 && plan.padShown.mode === "animate") {
        whenBelow(padShown, PAD_RELEASE_AT, () => setPadInteractive(false)); // a deferred field gets its keyboard
      }
      // stopTogether: false. A later transition retargets only the values it animates; the pad
      // finishes sliding out even if the next keyboard starts before it is gone.
      Animated.parallel(animations, { stopTogether: false }).start(
        ({ finished }) => {
          // A newer transition owns the values now; don't apply this one's leftovers.
          if (!finished || applied.current.token !== token) return;
          applied.current.settled = true;
          steps.forEach(([value, step]) => {
            if (step.mode === "after") value.setValue(step.to);
          });
          if (owner !== "pad") setPadInteractive(false);
          if (deferred)
            padMayStart(); // (normally already started once the keyboard was visibly gone)
          else notify();
        },
      );
    };

    const schedule = () => {
      if (alive.current && frame.current === null)
        frame.current = requestAnimationFrame(flush);
    };

    return {
      inset,
      schedule,
      claimPad: (target) => {
        facts.current.pad = target;
        schedule();
      },
      releasePad: (id) => {
        // Focus can move A -> B before A's blur arrives; only the owner may release.
        if (facts.current.pad?.id !== id) return;
        facts.current.pad = null;
        schedule();
      },
      notifyFocus: (options) => {
        if (options?.deferredKeyboard) facts.current.systemHeight = 0;
        schedule();
      },
      onSettled: (listener) => {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
      onTransitionStart: (listener) => {
        startListeners.current.add(listener);
        return () => {
          startListeners.current.delete(listener);
        };
      },
      currentInset,
      dismissKeyboard: () =>
        facts.current.pad ? facts.current.pad.blur() : Keyboard.dismiss(),
    };
  });

  // System keyboard frames. Recorded even while the pad owns the bottom; flush decides.
  useEffect(() => {
    const subs = [
      systemTrack.addListener(({ value }) => (current.current.system = value)),
      padFloor.addListener(({ value }) => (current.current.floor = value)),
    ];
    return () => {
      systemTrack.removeListener(subs[0]);
      padFloor.removeListener(subs[1]);
    };
  }, [systemTrack, padFloor]);

  useEffect(() => {
    const entry: StackEntry = { depth, reschedule: api.schedule };
    stackEntry.current = entry;
    hostStack.push(entry);
    return () => {
      const index = hostStack.indexOf(entry);
      if (index !== -1) hostStack.splice(index, 1);
      topHost()?.reschedule(); // the host below is on top again
    };
  }, [depth, api]);

  useEffect(() => {
    alive.current = true;
    const onFrame = (e: KeyboardEvent) => {
      const f = facts.current;
      f.systemHeight =
        e.endCoordinates.screenY > 0
          ? coveredBySystemKeyboard(
              Dimensions.get("screen").height,
              e.endCoordinates.screenY,
              f.hostBottomGap,
            )
          : 0;
      f.duration = e.duration;
      f.eventAt = performance.now();
      api.schedule();
    };
    const subs = [
      Keyboard.addListener("keyboardWillChangeFrame", onFrame),
      Keyboard.addListener("keyboardWillHide", onFrame),
    ];
    const metrics = Keyboard.metrics();
    if (Keyboard.isVisible() && metrics) {
      facts.current.systemHeight = coveredBySystemKeyboard(
        Dimensions.get("screen").height,
        metrics.screenY,
      );
      api.schedule();
    }
    return () => {
      alive.current = false;
      subs.forEach((s) => s.remove());
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [api]);

  const onHostLayout = () => {
    hostRef.current?.measureInWindow((_x, y, _w, h) => {
      facts.current.hostBottomGap = Math.max(
        0,
        Dimensions.get("screen").height - (y + h),
      );
    });
  };

  const onPadLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h === facts.current.padHeight) return;
    facts.current.padHeight = h;
    setPadHeight(h);
    if (facts.current.pad) api.schedule();
  };

  const onKey = useCallback(
    (key: NumberPadKey) => facts.current.pad?.onKey(key),
    [],
  );
  const onDone = useCallback(() => facts.current.pad?.blur(), []);

  // Insets can arrive after mount (probe), so they join the stable api here.
  const contextValue = useMemo<KeyboardHostApi>(
    () => ({ ...api, safeArea, padUp: padInteractive, depth }),
    [api, safeArea, padInteractive, depth],
  );

  // Layout (`bottom`), not a transform: the sheet rides the pad through layout too, and a transform
  // and a layout prop land a frame apart (the pad's hide started a frame late, measured 19pt).
  const padBottom = padShown.interpolate({
    inputRange: [0, 1],
    outputRange: [padHeight > 0 ? -padHeight : -2000, 0],
  });

  return (
    <View ref={hostRef} style={styles.host} onLayout={onHostLayout}>
      <HostContext.Provider value={contextValue}>
        {children}
      </HostContext.Provider>
      <Animated.View
        testID="number-pad-dock"
        pointerEvents={padInteractive ? "auto" : "none"}
        accessibilityElementsHidden={!padInteractive}
        importantForAccessibility={
          padInteractive ? "auto" : "no-hide-descendants"
        }
        style={[styles.dock, { bottom: padBottom }]}
      >
        <View onLayout={onPadLayout}>
          <NumberPadKeyboard
            onKey={onKey}
            onDone={onDone}
            decimalEnabled={decimalEnabled}
            bottomInset={safeArea.bottom}
          />
        </View>
      </Animated.View>
      {probe}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  dock: { position: "absolute", left: 0, right: 0 },
});
