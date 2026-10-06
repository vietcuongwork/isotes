import React, {
  ComponentRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  findNodeHandle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardTransition,
  useOptionalKeyboardHost,
} from "../keyboard/KeyboardHost";
import { useSheet } from "./SheetContext";
import {
  followOffset,
  restoreOffset,
  revealOffset,
  ScrollSession,
  shouldDismissOverscroll,
  tapDismissesKeyboard,
  transitionProgress,
} from "./sheetMath";

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /** Space kept between the focused field and the viewport edge. */
  revealMargin?: number;
}

/**
 * A ScrollView that keeps the focused TextInput visible.
 *
 * It reaches the sheet's bottom edge, so content is drawn behind keyboards and
 * the home indicator, and the covered part becomes bottom `contentInset` (the
 * way UIKit scroll views handle the keyboard). In a dynamic sheet only the
 * home indicator covers it (the sheet rides on the keyboard); in a snap
 * (fixed) sheet the keyboard slides over it. Either way it stays scrollable
 * while the number pad is shown. When the keyboard closes, the content goes
 * back to where it was before it opened, unless the user scrolled meanwhile.
 *
 * The focused field is revealed when a keyboard transition *starts*, against
 * the viewport size the sheet predicts for its end, so the scroll moves
 * together with the keyboard. A second pass when the transition settles
 * corrects any misprediction (normally a no-op).
 *
 * Any TextInput descendant works (it uses the globally focused input).
 */
export function KeyboardAwareScrollView({
  revealMargin = 20,
  keyboardShouldPersistTaps = "handled",
  children,
  onScroll,
  onLayout,
  onContentSizeChange,
  onScrollEndDrag,
  ...rest
}: KeyboardAwareScrollViewProps) {
  const host = useOptionalKeyboardHost();
  const sheet = useSheet();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  const metrics = useRef({ scrollY: 0, viewport: 0, content: 0 });
  const tap = useRef({
    x: 0,
    y: 0,
    target: null as number | null,
    scrolled: false,
  });
  // Bottom content inset: the part of the viewport covered by a keyboard or the home indicator
  // (sheet.coveredAt). Held as the inset it was computed for, so a safe-area change re-renders it.
  const [coverInset, setCoverInset] = useState(0);
  const coverInsetNow = useRef(0);
  const cover = sheet ? sheet.coveredAt(coverInset) : 0;
  // Scroll restore: where the content was when a keyboard opened, and who moved it since.
  const session = useRef<ScrollSession | null>(null);

  // Stable host values only (the context value changes whenever `padUp` flips).
  const onTransitionStart = host?.onTransitionStart;
  const onSettled = host?.onSettled;
  const currentInset = host?.currentInset;
  const inset = host?.inset;

  // During a keyboard transition the scroll follows the keyboard frame by frame (same progress as
  // the inset), instead of UIKit's own scroll animation, whose timing differs: on a fixed sheet the
  // content trailed a falling pad by up to ~100pt.
  const following = useRef<string | null>(null);
  const stopFollowing = useCallback(() => {
    if (following.current !== null) inset?.removeListener(following.current);
    following.current = null;
  }, [inset]);
  const scrollTo = useCallback(
    (y: number, transition?: KeyboardTransition) => {
      stopFollowing();
      if (session.current) session.current.auto = true;
      const p0 =
        transition && currentInset
          ? transitionProgress(currentInset(), transition.from, transition.to)
          : 1;
      if (!transition || !inset || p0 >= 1) {
        scrollRef.current?.scrollTo({ y, animated: true });
        return;
      }
      const y0 = metrics.current.scrollY;
      following.current = inset.addListener(({ value }) => {
        const p = transitionProgress(value, transition.from, transition.to);
        scrollRef.current?.scrollTo({
          y: followOffset(y0, y, p0, p),
          animated: false,
        });
        if (p >= 1) stopFollowing();
      });
    },
    [inset, currentInset, stopFollowing],
  );
  useEffect(() => stopFollowing, [stopFollowing]);

  /**
   * Scrolls the focused field into view; `viewport` overrides the measured height (a prediction),
   * and `transition` makes the scroll move with the keyboard.
   */
  const reveal = useCallback(
    (viewport?: number, transition?: KeyboardTransition) => {
      const focused = TextInput.State.currentlyFocusedInput();
      const content = contentRef.current;
      if (!focused || !content) return;
      focused.measureLayout(
        content,
        (_x, y, _w, h) => {
          const m = metrics.current;
          const offset = revealOffset({
            fieldY: y,
            fieldHeight: h,
            scrollY: m.scrollY,
            viewportHeight:
              viewport ??
              m.viewport - (sheet ? sheet.coveredAt(coverInsetNow.current) : 0), // the uncovered part
            contentHeight: m.content,
            margin: revealMargin,
          });
          if (offset !== null) scrollTo(offset, transition);
        },
        () => {}, // the focused input is not inside this scroll view
      );
    },
    [revealMargin, scrollTo, sheet],
  );

  useEffect(() => {
    if (!onTransitionStart || !onSettled || !currentInset) return;
    const covered = (at: number) => (sheet ? sheet.coveredAt(at) : 0);
    const applyCover = (at: number) => {
      coverInsetNow.current = at;
      setCoverInset(at);
    };
    const offStart = onTransitionStart((transition) => {
      const { from, to } = transition;
      const m = metrics.current;
      const visible =
        m.viewport -
        covered(from) +
        (sheet ? sheet.viewportDelta(from, to) : 0);
      if (to > 0 && !session.current)
        session.current = { baseline: m.scrollY, auto: false, manual: false };
      // Closing, not handing over to the other keyboard (a field is still focused during a hand-off).
      const closing = to === 0 && !TextInput.State.currentlyFocusedInput();
      // More inset: room to scroll right away. Less: it goes once the keyboard has settled, so
      // nothing jumps mid-way; meanwhile the content moves with the keyboard (below).
      if (covered(to) >= covered(coverInsetNow.current)) applyCover(to);
      // Back to where the user was before the keyboard opened, or (hand-off) just back within the
      // new end if the content is past it.
      const end = Math.max(0, m.content - visible);
      const target =
        closing && session.current
          ? restoreOffset(session.current, m.scrollY, end)
          : Math.min(m.scrollY, end);
      if (Math.abs(target - m.scrollY) > 1) scrollTo(target, transition);
      if (closing) session.current = null;
      else reveal(visible, transition);
    });
    const offSettled = onSettled(() => {
      stopFollowing();
      applyCover(currentInset());
      reveal();
    });
    return () => {
      offStart();
      offSettled();
    };
  }, [
    onTransitionStart,
    onSettled,
    currentInset,
    sheet,
    reveal,
    scrollTo,
    stopFollowing,
  ]);

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode="none"
      automaticallyAdjustKeyboardInsets={false}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      scrollEventThrottle={16}
      {...rest}
      contentInset={{
        ...rest.contentInset,
        bottom: (rest.contentInset?.bottom ?? 0) + cover,
      }}
      scrollIndicatorInsets={{
        ...rest.scrollIndicatorInsets,
        bottom: (rest.scrollIndicatorInsets?.bottom ?? 0) + cover,
      }}
      // A reveal can be sent before the new inset is mounted, and UIKit would clamp it to the old
      // end. revealOffset already clamps to the right range.
      scrollToOverflowEnabled
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        metrics.current.scrollY = e.nativeEvent.contentOffset.y;
        onScroll?.(e);
      }}
      onLayout={(e) => {
        metrics.current.viewport = e.nativeEvent.layout.height;
        // Outside a KeyboardHost there is no transition signal: reveal on resize.
        if (!host) reveal();
        onLayout?.(e);
      }}
      onContentSizeChange={(w, h) => {
        metrics.current.content = h;
        sheet?.reportContentHeight(h);
        onContentSizeChange?.(w, h);
      }}
      onScrollBeginDrag={(e) => {
        tap.current.scrolled = true;
        stopFollowing(); // the finger takes over
        if (session.current) session.current.manual = true;
        rest.onScrollBeginDrag?.(e);
      }}
      onScrollEndDrag={(e) => {
        const { contentOffset, velocity } = e.nativeEvent;
        if (sheet && shouldDismissOverscroll(contentOffset.y, velocity?.y ?? 0))
          sheet.pullDown();
        onScrollEndDrag?.(e);
      }}
    >
      <View
        ref={contentRef}
        collapsable={false}
        testID="keyboard-aware-content"
        // A tap anywhere that isn't a text input closes whichever keyboard is up (pad or system),
        // buttons included. Raw touch events fire even when a child (a button) handles the press,
        // so the button still gets this same tap. Scrolls and drags don't count.
        onTouchStart={(e) => {
          const { pageX, pageY, target } = e.nativeEvent;
          tap.current = {
            x: pageX,
            y: pageY,
            target: typeof target === "number" ? target : null,
            scrolled: false,
          };
        }}
        onTouchEnd={(e) => {
          const t = tap.current;
          const moved = Math.hypot(
            e.nativeEvent.pageX - t.x,
            e.nativeEvent.pageY - t.y,
          );
          if (!host) return;
          // Decide after the tap's own focus change: a tap on a text input keeps a keyboard.
          requestAnimationFrame(() => {
            const focused = TextInput.State.currentlyFocusedInput();
            const dismiss = tapDismissesKeyboard({
              moved,
              scrolled: t.scrolled,
              persistAlways: keyboardShouldPersistTaps === "always",
              hasFocus: !!focused,
              targetTag: t.target,
              // findNodeHandle accepts Fabric host instances at run time; its typings predate them.
              focusedTag: focused
                ? findNodeHandle(focused as unknown as View)
                : null,
            });
            if (dismiss) host.dismissKeyboard();
          });
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
