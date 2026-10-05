import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const PADDING = 16; // breathing room between the field and the sheet's top edge
const SCROLL_BACK_MS = 350; // iOS animated setContentOffset (~300ms, fixed) + slack

// Scrolls a focused field above a custom bottom sheet (e.g. NumberPadBottomSheet)
// that KeyboardAwareScrollView can't react to on its own, since no real keyboard
// opens for it. A short list/form often has no scrollable overflow to begin
// with, so extraBottomSpace reserves room the same way a real keyboard's
// content inset would, before we try to scroll into it.
//
// Closing mirrors KeyboardAwareScrollView: animate only the scroll offset back
// to where it was before opening, then drop extraBottomSpace to 0 in one step —
// no per-frame state/layout animation. why: encountered_errors_iv.md (2026-09-28)
export default function useScrollFieldAboveSheet(
  scrollTo: (y: number) => void,
  // Where the scroll view's visible area ends on screen; omit when it
  // reaches the screen bottom (nothing sits below it)
  measureViewportBottom?: (callback: (bottom: number) => void) => void,
) {
  const scrollOffsetRef = useRef(0);
  const offsetBeforeOpenRef = useRef(0);
  const currentHeightRef = useRef(0);
  const clearSpaceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [extraBottomSpace, setExtraBottomSpace] = useState(0);
  // Bumped with every reservation — a field switch that yields the same
  // reserve leaves extraBottomSpace unchanged, so it can't trigger the scroll
  const [scrollRequest, setScrollRequest] = useState(0);
  const pendingScrollRef = useRef<{
    fieldRef: RefObject<TextInput | null>;
    sheetHeight: number;
  } | null>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const scrollFieldIntoView = useCallback(
    (fieldRef: RefObject<TextInput | null>, sheetHeight: number) => {
      // A reopen within SCROLL_BACK_MS must not have its new reservation cleared
      if (clearSpaceTimeoutRef.current) {
        clearTimeout(clearSpaceTimeoutRef.current);
        clearSpaceTimeoutRef.current = null;
      }
      // Only on a fresh open — switching fields while open keeps the original offset
      if (currentHeightRef.current === 0) {
        offsetBeforeOpenRef.current = scrollOffsetRef.current;
      }
      pendingScrollRef.current = { fieldRef, sheetHeight };
      currentHeightRef.current = sheetHeight;
      // Only the part of the visible area the sheet covers needs extra room —
      // reserving the full sheetHeight also counts whatever sits below the list
      const reserveCoveredPart = (viewportBottom: number) => {
        setExtraBottomSpace(
          Math.max(0, viewportBottom - (SCREEN_HEIGHT - sheetHeight)),
        );
        setScrollRequest((n) => n + 1);
      };
      if (measureViewportBottom) measureViewportBottom(reserveCoveredPart);
      else reserveCoveredPart(SCREEN_HEIGHT);
    },
    [measureViewportBottom],
  );

  const resetExtraBottomSpace = useCallback(() => {
    if (currentHeightRef.current === 0) return;

    // The pre-open offset was valid before the space existed, so removing the
    // space once we're back there can't cause a jump.
    scrollTo(offsetBeforeOpenRef.current);
    clearSpaceTimeoutRef.current = setTimeout(() => {
      clearSpaceTimeoutRef.current = null;
      currentHeightRef.current = 0;
      setExtraBottomSpace(0);
    }, SCROLL_BACK_MS);
  }, [scrollTo]);

  useEffect(
    () => () => {
      if (clearSpaceTimeoutRef.current) {
        clearTimeout(clearSpaceTimeoutRef.current);
      }
    },
    [],
  );

  // Runs once extraBottomSpace has actually laid out, so there's real
  // scrollable room for the field to move into.
  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (extraBottomSpace === 0 || !pending) return;
    pendingScrollRef.current = null;

    requestAnimationFrame(() => {
      pending.fieldRef.current?.measure(
        (_x, _y, _width, height, _pageX, pageY) => {
          const occlusionTop = SCREEN_HEIGHT - pending.sheetHeight;
          const overlap = pageY + height + PADDING - occlusionTop;
          if (overlap <= 0) return;

          scrollTo(scrollOffsetRef.current + overlap);
        },
      );
    });
  }, [scrollRequest, extraBottomSpace, scrollTo]);

  return {
    handleScroll,
    scrollFieldIntoView,
    extraBottomSpace,
    resetExtraBottomSpace,
  };
}
