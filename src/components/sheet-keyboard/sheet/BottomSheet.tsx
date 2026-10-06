import { colors as tokens } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { X } from "lucide-react-native";
import React, {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityActionEvent,
  AccessibilityInfo,
  Animated,
  GestureResponderEvent,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardHost, useKeyboardHost } from "../keyboard/KeyboardHost";
import { SHEET_CLOSE, SHEET_FADE, SHEET_OPEN } from "../keyboard/motion";
import { useReduceMotion } from "../keyboard/reduceMotion";
import type { EdgeInsets } from "../keyboard/safeArea";
import { SheetApi, SheetContext } from "./SheetContext";
import {
  chooseSnap,
  coveredAt,
  dragGeometry,
  MIN_VISIBLE_SCROLL,
  nextSegment,
  resolveSnapPoints,
  Segment,
  segmentValue,
  SheetGeometry,
  shouldDismissDrag,
  SnapPoint,
  viewportDelta,
} from "./sheetMath";

export interface BottomSheetProps {
  /** Controlled. The sheet animates in and out, and unmounts once hidden. */
  visible: boolean;
  /** Backdrop tap, drag down, pull past the top, or hardware back. Set `visible` to false in response. */
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /**
   * Snap mode: the heights the sheet rests at (px, or '%' of the window height). Drag the
   * handle between them; dragging below the lowest closes. Omit for dynamic mode: the sheet
   * sizes to its content and, once that no longer fits, stops growing and the content scrolls.
   * Either way the sheet is clamped to the space above the keyboard and below the top safe area.
   */
  snapPoints?: readonly SnapPoint[];
  /** Snap mode: index of the point to open at. Default 0 (lowest). */
  initialSnap?: number;
  /** Snap mode: called when the sheet settles on another point. */
  onSnapChange?: (index: number) => void;
  /**
   * Called once the sheet has closed and its modal is gone. Move VoiceOver focus back to the
   * control that opened it here (AccessibilityInfo.sendAccessibilityEvent(ref, 'focus')).
   */
  onAfterClose?: () => void;
  /** Minimum gap kept below the top safe area. */
  topGap?: number;
  closeOnBackdropPress?: boolean;
  /** An X at the end of the title row that closes the sheet, like a backdrop tap. Needs `title`. */
  showCloseButton?: boolean;
  /** Real insets (e.g. from react-native-safe-area-context). Skips the core SafeAreaView probe. */
  safeAreaInsets?: EdgeInsets;
}

/**
 * Modal bottom sheet built from core primitives. It hosts the keyboard
 * (system or number pad) and stays docked to the screen bottom: keyboards
 * slide over its content, which scrolls above them. Its top only rises when
 * its resting height would leave too little visible above a keyboard.
 *
 * Native- and JS-driven values never share a node:
 *   slide    translateY (native-driven: open, close, drag)
 *   surface  height = resting height + raise (JS-driven layout)
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  title,
  snapPoints,
  initialSnap = 0,
  onSnapChange,
  onAfterClose,
  topGap = 12,
  closeOnBackdropPress = true,
  showCloseButton = false,
  safeAreaInsets,
}: BottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [slide] = useState(() => new Animated.Value(windowHeight));
  // Reduce Motion: open and close fade (`appear`) instead of sliding; snap changes jump.
  const reduceMotion = useReduceMotion();
  const [appear] = useState(() => new Animated.Value(1));
  const headerRef = useRef<View>(null);
  const visibleRef = useRef(visible);
  const latest = useRef({ reduceMotion, onAfterClose });
  useLayoutEffect(() => {
    visibleRef.current = visible;
    latest.current = { reduceMotion, onAfterClose };
  });

  // Opening is a tap outside any text input, so the keyboard closes and stays closed. iOS
  // remembers the first responder when a Modal is presented and restores it when the Modal goes
  // away, which would reopen the keyboard after this sheet closes. So blur first, and present a
  // frame later, once nothing is focused.
  useEffect(() => {
    if (!visible || mounted) return;
    const focused = TextInput.State.currentlyFocusedInput();
    if (focused) TextInput.State.blurTextInput(focused);
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [visible, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const fade = latest.current.reduceMotion;
    if (visible) {
      // Once open, VoiceOver starts on the sheet's title (it would otherwise stay on the opener).
      const focusTitle = ({ finished }: { finished: boolean }) => {
        if (finished && headerRef.current)
          AccessibilityInfo.sendAccessibilityEvent(headerRef.current, "focus");
      };
      if (fade) {
        slide.setValue(0);
        appear.setValue(0);
        Animated.timing(appear, {
          toValue: 1,
          ...SHEET_FADE,
          useNativeDriver: true,
        }).start(focusTitle);
      } else {
        appear.setValue(1);
        Animated.timing(slide, {
          toValue: 0,
          ...SHEET_OPEN,
          useNativeDriver: true,
        }).start(focusTitle);
      }
      return;
    }
    Keyboard.dismiss(); // whichever keyboard is up animates down alongside the sheet
    const closed = ({ finished }: { finished: boolean }) => {
      if (!finished) return;
      slide.setValue(windowHeight); // ready for the next open, whichever way it animates
      appear.setValue(1);
      setMounted(false);
      requestAnimationFrame(() => latest.current.onAfterClose?.()); // after the modal is gone
    };
    if (fade)
      Animated.timing(appear, {
        toValue: 0,
        ...SHEET_FADE,
        useNativeDriver: true,
      }).start(closed);
    else
      Animated.timing(slide, {
        toValue: windowHeight,
        ...SHEET_CLOSE,
        useNativeDriver: true,
      }).start(closed);
  }, [mounted, visible, slide, appear, windowHeight]);

  const snapBack = () => {
    if (latest.current.reduceMotion) slide.setValue(0);
    else
      Animated.spring(slide, {
        toValue: 0,
        bounciness: 0,
        speed: 18,
        useNativeDriver: true,
      }).start();
  };

  /** The parent owns `visible`. If it ignores the request, snap back instead of freezing mid-drag. */
  const requestClose = () => {
    onClose();
    requestAnimationFrame(() => {
      if (visibleRef.current) snapBack();
    });
  };

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      supportedOrientations={["portrait"]}
      onRequestClose={requestClose}
    >
      <KeyboardHost safeAreaInsets={safeAreaInsets}>
        <SheetLayout
          title={title}
          showCloseButton={showCloseButton}
          snapPoints={snapPoints}
          initialSnap={initialSnap}
          onSnapChange={onSnapChange}
          topGap={topGap}
          slide={slide}
          appear={appear}
          reduceMotion={reduceMotion}
          headerRef={headerRef}
          onBackdropPress={closeOnBackdropPress ? requestClose : undefined}
          onRequestClose={requestClose}
          onSnapBack={snapBack}
        >
          {children}
        </SheetLayout>
      </KeyboardHost>
    </Modal>
  );
}

interface SheetLayoutProps {
  title?: string;
  showCloseButton: boolean;
  snapPoints?: readonly SnapPoint[];
  initialSnap: number;
  onSnapChange?: (index: number) => void;
  topGap: number;
  slide: Animated.Value;
  /** Opacity of sheet and backdrop (animated only with Reduce Motion). */
  appear: Animated.Value;
  reduceMotion: boolean;
  headerRef: RefObject<View | null>;
  onBackdropPress?: () => void;
  onRequestClose: () => void;
  onSnapBack: () => void;
  children: ReactNode;
}

function SheetLayout({
  title,
  showCloseButton,
  snapPoints,
  initialSnap,
  onSnapChange,
  topGap,
  slide,
  appear,
  reduceMotion,
  headerRef,
  onBackdropPress,
  onRequestClose,
  onSnapBack,
  children,
}: SheetLayoutProps) {
  const {
    inset,
    safeArea,
    currentInset,
    onTransitionStart,
    onSettled,
    dismissKeyboard,
  } = useKeyboardHost();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = useRef(0);
  const drag = useRef({ y0: 0, lastY: 0, lastT: 0, vy: 0 });

  const room = Math.max(0, windowHeight - safeArea.top - topGap);

  // Snap mode. `snapHeight` is the sheet's own height (JS-driven layout, animated by drags and snaps).
  const snaps = useMemo(
    () =>
      snapPoints?.length
        ? resolveSnapPoints(snapPoints, windowHeight, room)
        : null,
    [snapPoints, windowHeight, room],
  );
  const [snapIndex, setSnapIndex] = useState(() =>
    snaps ? Math.min(Math.max(0, initialSnap), snaps.length - 1) : 0,
  );
  const [snapHeight] = useState(
    () =>
      new Animated.Value(
        snaps ? snaps[Math.min(Math.max(0, initialSnap), snaps.length - 1)] : 0,
      ),
  );

  // Dynamic mode: natural height = header + scroll content + home indicator (the scroll view's bottom inset).
  const [headerHeight, setHeaderHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const natural =
    headerHeight > 0 && contentHeight > 0
      ? headerHeight + contentHeight + safeArea.bottom
      : Infinity;

  const preferredHeight = snaps ? snaps[snapIndex] : natural;
  // Docked in both modes: keyboards slide over the sheet and the scroll view insets its content.
  // The sheet only grows (raise) to keep the header and a usable strip above a keyboard.
  const geometry = useMemo<SheetGeometry>(
    () => ({
      preferredHeight,
      room,
      safeBottom: safeArea.bottom,
      minAboveKeyboard: headerHeight + MIN_VISIBLE_SCROLL,
    }),
    [preferredHeight, room, safeArea.bottom, headerHeight],
  );

  // Raise, moving *linearly* in the inset over the current keyboard transition (see
  // sheetMath.Segment): following the clamped geometry made the top edge start late and move
  // 1:1 with the keyboard.
  //
  // Swapping segments must be atomic *and* happen before the transition's first frame:
  //  - several setValue calls on one mapping rendered a torn in-between frame (-85pt);
  //  - a segment in React state can commit a frame late, and a stale segment maps backwards
  //    when the inset reverses into its range (+11pt blip).
  // So there are two slots: the new segment is written into the inactive one (weight 0, so
  // those writes can't show), then a single setValue on `pick` flips to it.
  const [slots] = useState(() => {
    const slot = () => ({
      from: new Animated.Value(0),
      raise: new Animated.Value(0),
      raiseSlope: new Animated.Value(0),
    });
    return { a: slot(), b: slot(), pick: new Animated.Value(0) }; // pick: 0 -> a, 1 -> b
  });
  const live = useRef<{ slot: "a" | "b"; segment: Segment | null }>({
    slot: "a",
    segment: null,
  });

  const raise = useMemo(() => {
    const map = (slot: typeof slots.a) =>
      Animated.add(
        slot.raise,
        Animated.multiply(slot.raiseSlope, Animated.subtract(inset, slot.from)),
      );
    return Animated.add(
      Animated.multiply(map(slots.a), Animated.subtract(1, slots.pick)),
      Animated.multiply(map(slots.b), slots.pick),
    );
  }, [inset, slots]);
  // Resting height (the snap height, animated by drags; or the measured natural height) plus raise.
  const surfaceHeight = useMemo(() => {
    if (snaps) return Animated.add(snapHeight, raise);
    return Number.isFinite(natural)
      ? Animated.add(Math.min(natural, room), raise)
      : undefined;
  }, [snaps, snapHeight, raise, natural, room]);

  useEffect(() => {
    const show = (segment: Segment) => {
      const next = live.current.slot === "a" ? "b" : "a";
      const slot = slots[next];
      const slope = ([start, end]: [number, number]) =>
        segment.to === segment.from
          ? 0
          : (end - start) / (segment.to - segment.from);
      slot.from.setValue(segment.from);
      slot.raise.setValue(segment.raise[0]);
      slot.raiseSlope.setValue(slope(segment.raise));
      slots.pick.setValue(next === "b" ? 1 : 0); // the one atomic switch
      live.current = { slot: next, segment };
    };
    const now = currentInset();
    show(nextSegment(null, now, now, geometry)); // geometry changed (mount, safe area): re-anchor here
    // A keyboard leaving while a field stays focused is a hand-off to the other keyboard: hold the
    // raise, so the next keyboard moves the top once instead of it dropping and rising again.
    const handingOff = (to: number) =>
      to === 0 && !!TextInput.State.currentlyFocusedInput();
    const offStart = onTransitionStart(({ from, to }) =>
      show(
        nextSegment(live.current.segment, from, to, geometry, handingOff(to)),
      ),
    );
    // A held raise with no keyboard following (e.g. a hardware keyboard) drops once nothing is focused.
    const offSettled = onSettled(() => {
      const held =
        live.current.segment && segmentValue(live.current.segment, 0) > 0;
      if (
        held &&
        currentInset() === 0 &&
        !TextInput.State.currentlyFocusedInput()
      )
        show(nextSegment(null, 0, 0, geometry));
    });
    return () => {
      offStart();
      offSettled();
    };
    // Stable host functions only: the context value itself changes when `padUp` flips, and
    // re-subscribing mid-transition re-anchored and froze the sheet height.
  }, [currentInset, onTransitionStart, onSettled, geometry, slots]);

  /** Snap mode: settle on `index`, carrying the release velocity (px/ms, + = down). */
  const settleOn = useCallback(
    (index: number, velocity = 0) => {
      if (!snaps) return;
      const settled = () => {
        if (index !== snapIndex) {
          setSnapIndex(index);
          onSnapChange?.(index);
        }
      };
      if (reduceMotion) {
        snapHeight.setValue(snaps[index]);
        slide.setValue(0);
        settled();
        return;
      }
      Animated.parallel([
        Animated.spring(snapHeight, {
          toValue: snaps[index],
          velocity: -velocity * 1000,
          bounciness: 0,
          speed: 16,
          useNativeDriver: false,
        }),
        Animated.spring(slide, {
          toValue: 0,
          bounciness: 0,
          speed: 16,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) settled();
      });
    },
    [snaps, snapHeight, slide, snapIndex, onSnapChange, reduceMotion],
  );

  const sheetApi = useMemo<SheetApi>(
    () => ({
      // Pulling the content down past its top: one snap point down, or close from the lowest.
      pullDown: () =>
        snaps && snapIndex > 0 ? settleOn(snapIndex - 1) : onRequestClose(),
      viewportDelta: (from, to) => viewportDelta(from, to, geometry),
      coveredAt: (inset) => coveredAt(inset, geometry),
      reportContentHeight: (h) => setContentHeight(Math.round(h)),
    }),
    [onRequestClose, geometry, snaps, snapIndex, settleOn],
  );
  const backdropOpacity = useMemo(
    () =>
      Animated.multiply(
        slide.interpolate({
          inputRange: [0, Math.max(1, windowHeight * 0.6)],
          outputRange: [1, 0],
          extrapolate: "clamp",
        }),
        appear,
      ),
    [slide, appear, windowHeight],
  );

  // VoiceOver: there is no visible close button and the backdrop is hidden from VoiceOver while
  // the sheet is modal, so the handle and the escape gesture (two-finger Z) close it: the
  // keyboard first if one is up, then the sheet. With several snap points the handle is
  // adjustable (swipe up / down: expand / collapse).
  const adjustable = !!snaps && snaps.length > 1;
  const closeButton = showCloseButton && !!title;
  const closeKeyboardOrSheet = () =>
    TextInput.State.currentlyFocusedInput()
      ? dismissKeyboard()
      : onRequestClose();
  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const action = e.nativeEvent.actionName;
    if (action === "increment" && snaps)
      settleOn(Math.min(snapIndex + 1, snaps.length - 1));
    else if (action === "decrement" && snaps)
      settleOn(Math.max(snapIndex - 1, 0));
    else if (action === "activate") closeKeyboardOrSheet();
  };

  // Drag to dismiss on the handle and header only, so it never competes with the ScrollView.
  // The header claims the touch on start: on Fabric/iOS onMoveShouldSetResponder
  // was never consulted for it (verified in the simulator), so a move-based
  // claim never started a drag. Nothing in the header is tappable, so claiming
  // early costs nothing; a plain tap releases with dy = 0 and snaps back.
  // The close X (showCloseButton) is a sibling laid over the header, not a
  // child, so it never negotiates with this claim.
  const onResponderGrant = (e: GestureResponderEvent) => {
    const { pageY, timestamp } = e.nativeEvent;
    drag.current = { y0: pageY, lastY: pageY, lastT: timestamp, vy: 0 };
  };
  const onResponderMove = (e: GestureResponderEvent) => {
    const { pageY, timestamp } = e.nativeEvent;
    const d = drag.current;
    const dt = timestamp - d.lastT;
    if (dt > 0) d.vy = 0.7 * ((pageY - d.lastY) / dt) + 0.3 * d.vy; // px/ms, smoothed
    d.lastY = pageY;
    d.lastT = timestamp;
    if (snaps) {
      // Between snap points the sheet resizes; below the lowest it slides towards closing.
      const g = dragGeometry(snaps[snapIndex], pageY - d.y0, snaps);
      snapHeight.setValue(g.height);
      slide.setValue(g.translate);
    } else {
      slide.setValue(Math.max(0, pageY - d.y0));
    }
  };
  const onResponderRelease = (e: GestureResponderEvent) => {
    const dy = e.nativeEvent.pageY - drag.current.y0;
    if (Math.abs(dy) < 6) dismissKeyboard(); // a tap on the header is a tap outside any text input
    if (snaps) {
      const target = chooseSnap(snaps[snapIndex] - dy, drag.current.vy, snaps);
      if (target === "close") onRequestClose();
      else settleOn(target, drag.current.vy);
      return;
    }
    if (shouldDismissDrag(dy, drag.current.vy, sheetHeight.current))
      onRequestClose();
    else onSnapBack();
  };
  const onResponderTerminate = () =>
    snaps ? settleOn(snapIndex) : onSnapBack();

  return (
    <View style={styles.fill}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={styles.fill}
          onPress={onBackdropPress}
          disabled={!onBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
        />
      </Animated.View>

      <View pointerEvents="box-none" style={styles.anchor}>
        <Animated.View
          testID="sheet-motion"
          style={{ opacity: appear, transform: [{ translateY: slide }] }}
        >
          <Animated.View
            testID="sheet-surface"
            accessibilityViewIsModal
            onAccessibilityEscape={closeKeyboardOrSheet}
            onLayout={(e) => {
              sheetHeight.current = Math.round(e.nativeEvent.layout.height);
            }}
            style={[
              styles.surface,
              {
                height: surfaceHeight,
                maxHeight: room,
              },
            ]}
          >
            <View
              ref={headerRef}
              testID="sheet-handle"
              accessible
              accessibilityRole={adjustable ? "adjustable" : "button"}
              accessibilityLabel={title ?? "Sheet"}
              accessibilityHint={
                adjustable
                  ? "Swipe up or down to resize. Double-tap to close the keyboard or the sheet."
                  : "Double-tap to close the keyboard or the sheet."
              }
              accessibilityValue={
                adjustable && snaps
                  ? { text: `Height ${snapIndex + 1} of ${snaps.length}` }
                  : undefined
              }
              accessibilityActions={
                adjustable
                  ? [
                      { name: "increment", label: "Expand" },
                      { name: "decrement", label: "Collapse" },
                      { name: "activate", label: "Close" },
                    ]
                  : [{ name: "activate", label: "Close" }]
              }
              onAccessibilityAction={onAccessibilityAction}
              style={styles.header}
              onLayout={(e) =>
                setHeaderHeight(Math.round(e.nativeEvent.layout.height))
              }
              onStartShouldSetResponder={() => true}
              onResponderGrant={onResponderGrant}
              onResponderMove={onResponderMove}
              onResponderRelease={onResponderRelease}
              onResponderTerminate={onResponderTerminate}
              onResponderTerminationRequest={() => false}
            >
              <View style={styles.grabber} />
              {title ? (
                <Text
                  accessibilityRole="header"
                  style={[styles.title, closeButton && styles.titleBesideClose]}
                >
                  {title}
                </Text>
              ) : null}
            </View>
            {closeButton ? (
              <Pressable
                testID="sheet-close"
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
                onPress={onRequestClose}
                style={styles.close}
              >
                <X size={CLOSE_ICON} color={tokens.grey[200]} />
              </Pressable>
            ) : null}
            <SheetContext.Provider value={sheetApi}>
              {children}
            </SheetContext.Provider>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const CLOSE_ICON = 24;
// Title row's top: 12 header pad + 4 grabber + 10 gap; centred on its 16pt line
const TITLE_ROW_CENTER = 12 + 4 + 10 + 16 / 2;

// isotes is dark-only: fixed tokens, matching the old components/bottomsheet look.
const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: tokens.grey.scrimSheet,
  },
  anchor: { position: "absolute", left: 0, right: 0, bottom: 0 },
  surface: {
    backgroundColor: tokens.grey[905],
    borderTopLeftRadius: 26, // = rounded-sheet token (spacing.js stores px strings)
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    paddingTop: 12, // = pt-3 on the old sheet handle
    paddingHorizontal: 20, // = px-5
  },
  // 40×4 pill = old handle's w-10 h-1 rounded-full; 10 below = its pb-2.5
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
    backgroundColor: tokens.grey[700],
  },
  // Left-aligned, as the old sheets' title rows were
  title: {
    ...textStyle("label"),
    alignSelf: "stretch",
    marginBottom: 16, // = pb-4 under the old sheets' title row
    color: tokens.grey[50],
  },
  titleBesideClose: { paddingRight: CLOSE_ICON + 12 }, // icon + gap
  close: {
    position: "absolute",
    top: TITLE_ROW_CENTER - CLOSE_ICON / 2,
    right: 20, // = header px-5
  },
});
