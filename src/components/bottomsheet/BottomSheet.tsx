import { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import {
  BackHandler,
  Dimensions,
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

export type BottomSheetMethods = {
  open: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
};

export interface BottomSheetProps {
  onClose?: () => void;
  /** Tap on backdrop to dismiss. Default: true */
  dismissOnBackdropPress?: boolean;
  /** Max height in pixels for auto-sized sheets. Only applies when snapPoints is omitted. Default: 90% of screen height */
  maxDynamicContentSize?: number;
  /** Snap point heights e.g. ['35%', '75%']. When omitted, the sheet auto-sizes to content. */
  snapPoints?: string[];
  /** Show the drag handle indicator. Default: true */
  showHandle?: boolean;
  /** Height in pixels of the draggable zone at the top of the sheet.
   * Increase to make it easier to grab. Default: 30 */
  draggableAreaHeight?: number;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DEFAULT_MAX_DYNAMIC_SIZE = SCREEN_HEIGHT * 0.9;
const SPRING_CONFIG = { damping: 25, stiffness: 300, mass: 0.5 };
const DISMISS_THRESHOLD_RATIO = 0.3; // drag past 30% of the sheet's own height → dismiss
const VELOCITY_THRESHOLD = 500; // px/s — a flick this fast steps snap index regardless of drag distance

const parseSnapPoint = (point: string): number =>
  point.endsWith("%")
    ? SCREEN_HEIGHT * (parseFloat(point) / 100)
    : parseFloat(point);

const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  function BottomSheet(
    {
      onClose,
      dismissOnBackdropPress = true,
      maxDynamicContentSize,
      snapPoints,
      showHandle = true,
      draggableAreaHeight = 30,
      children,
    },
    ref,
  ) {
    const isDynamicSizing = snapPoints === undefined;

    // Sorted ascending regardless of prop order — index i here always means
    // "the i-th smallest snap height," not the position in the snapPoints array.
    const parsedSnapHeights = isDynamicSizing
      ? []
      : [...snapPoints].map(parseSnapPoint).sort((a, b) => a - b);
    const maxSnapHeight = parsedSnapHeights[parsedSnapHeights.length - 1] ?? 0;
    // translateY is measured from the sheet's fully-open (tallest) position,
    // so the tallest snap height gets translateY 0 and shorter ones get pushed down.
    const snapTranslations = parsedSnapHeights.map((h) => maxSnapHeight - h);

    const sheetHeight = useSharedValue(isDynamicSizing ? 0 : maxSnapHeight);
    const measuredContentHeight = useSharedValue(0);
    const measuredHandleHeight = useSharedValue(0);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const isOpen = useSharedValue(false);
    const currentSnapIndex = useSharedValue(0);

    const handleContentLayout = useCallback(
      (event: LayoutChangeEvent) => {
        if (!isDynamicSizing) return;
        measuredContentHeight.value = event.nativeEvent.layout.height;
      },
      [isDynamicSizing, measuredContentHeight],
    );

    const handleHandleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        measuredHandleHeight.value = event.nativeEvent.layout.height;
      },
      [measuredHandleHeight],
    );

    useAnimatedReaction(
      () => measuredContentHeight.value + measuredHandleHeight.value,
      (childrenHeight, previousChildrenHeight) => {
        if (
          !isDynamicSizing ||
          childrenHeight === 0 ||
          childrenHeight === previousChildrenHeight
        ) {
          return;
        }

        const cap = maxDynamicContentSize ?? DEFAULT_MAX_DYNAMIC_SIZE;
        const newHeight = Math.min(childrenHeight, cap);
        sheetHeight.value = newHeight;

        if (isOpen.value) {
          translateY.value = withSpring(0, SPRING_CONFIG);
        } else {
          translateY.value = newHeight;
        }
      },
      [isDynamicSizing, maxDynamicContentSize],
    );

    const open = () => {
      isOpen.value = true;
      currentSnapIndex.value = 0;
      translateY.value = withSpring(
        isDynamicSizing ? 0 : snapTranslations[0],
        SPRING_CONFIG,
      );
    };

    const close = () => {
      isOpen.value = false;
      currentSnapIndex.value = 0;
      // onClose fires only after the close animation actually finishes, not on
      // call — avoids unmounting content while it's still animating offscreen.
      translateY.value = withSpring(
        sheetHeight.value,
        SPRING_CONFIG,
        (finished) => {
          if (finished && onClose) {
            runOnJS(onClose)();
          }
        },
      );
    };

    const snapToIndex = (index: number) => {
      if (isDynamicSizing) return;
      const clampedIndex = Math.max(
        0,
        Math.min(index, snapTranslations.length - 1),
      );
      currentSnapIndex.value = clampedIndex;
      isOpen.value = true;
      translateY.value = withSpring(
        snapTranslations[clampedIndex],
        SPRING_CONFIG,
      );
    };

    useImperativeHandle(ref, () => ({ open, close, snapToIndex }));

    // Android back button: close the sheet instead of letting the default
    // back behavior (e.g. navigating away) happen while it's open.
    // Re-subscribes every render since `close` isn't memoized — cheap
    // enough here, and avoids a stale closure holding an old `onClose`.
    useEffect(() => {
      if (Platform.OS !== "android") return;

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (isOpen.value) {
            close();
            return true; // handled — swallow the back press
          }
          return false; // already closed — let the default behavior run
        },
      );

      return () => subscription.remove();
    }, [close, isOpen]);

    const panGesture = isDynamicSizing
      ? Gesture.Pan()
          .onUpdate((event) => {
            "worklet";
            translateY.value = Math.max(0, event.translationY);
          })
          .onEnd((event) => {
            "worklet";
            const dismissThreshold =
              sheetHeight.value * DISMISS_THRESHOLD_RATIO;
            const shouldDismiss =
              event.translationY > dismissThreshold ||
              event.velocityY > VELOCITY_THRESHOLD;

            if (shouldDismiss) {
              runOnJS(close)();
            } else {
              translateY.value = withSpring(0, SPRING_CONFIG);
            }
          })
      : Gesture.Pan()
          .onUpdate((event) => {
            "worklet";
            const baseTranslation =
              snapTranslations[currentSnapIndex.value] ?? 0;
            const newTranslateY = baseTranslation + event.translationY;
            translateY.value = Math.max(
              0,
              Math.min(sheetHeight.value, newTranslateY),
            );
          })
          .onEnd((event) => {
            "worklet";
            const velocity = event.velocityY;

            // Positive velocity = flicking down (toward closed); negative =
            // flicking up (toward open).
            if (velocity > VELOCITY_THRESHOLD) {
              const prevIndex = currentSnapIndex.value - 1;
              if (prevIndex < 0) {
                runOnJS(close)();
              } else {
                currentSnapIndex.value = prevIndex;
                translateY.value = withSpring(
                  snapTranslations[prevIndex],
                  SPRING_CONFIG,
                );
              }
              return;
            }

            if (velocity < -VELOCITY_THRESHOLD) {
              const nextIndex = Math.min(
                currentSnapIndex.value + 1,
                snapTranslations.length - 1,
              );
              currentSnapIndex.value = nextIndex;
              translateY.value = withSpring(
                snapTranslations[nextIndex],
                SPRING_CONFIG,
              );
              return;
            }

            let nearestIndex = -1;
            // Distance to "closed" (translateY === sheetHeight) is a candidate
            // too, so a slow drag past the last snap point can settle into
            // closing rather than snapping back.
            let minDistance = Math.abs(sheetHeight.value - translateY.value);
            for (let i = 0; i < snapTranslations.length; i++) {
              const distance = Math.abs(snapTranslations[i] - translateY.value);
              if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
              }
            }

            if (nearestIndex < 0) {
              runOnJS(close)();
            } else {
              currentSnapIndex.value = nearestIndex;
              translateY.value = withSpring(
                snapTranslations[nearestIndex],
                SPRING_CONFIG,
              );
            }
          });

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      ...(isDynamicSizing ? {} : { height: sheetHeight.value }),
    }));

    const fixedContentWrapperStyle = useAnimatedStyle(() => {
      if (isDynamicSizing) return {};

      const visibleSheetHeight = sheetHeight.value - translateY.value;
      const contentHeight = visibleSheetHeight - measuredHandleHeight.value;

      return { height: Math.max(0, contentHeight) };
    });

    const backdropStyle = useAnimatedStyle(() => {
      const canShow = isOpen.value && sheetHeight.value > 0;

      return {
        opacity: canShow
          ? interpolate(translateY.value, [0, sheetHeight.value], [1, 0])
          : 0,
        pointerEvents: canShow ? ("auto" as const) : ("none" as const),
      };
    });

    return (
      <View className="absolute inset-0" pointerEvents="box-none">
        <Animated.View
          className="absolute inset-0 bg-grey-scrimSheet"
          style={backdropStyle}
        >
          <Pressable
            className="absolute inset-0"
            onPress={dismissOnBackdropPress ? close : undefined}
            accessibilityRole="button"
            accessibilityLabel="Close bottom sheet"
          />
        </Animated.View>
        <Animated.View
          className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-sheet bg-grey-905"
          style={[
            isDynamicSizing
              ? {
                  maxHeight: maxDynamicContentSize ?? DEFAULT_MAX_DYNAMIC_SIZE,
                }
              : null,
            sheetStyle,
          ]}
        >
          {showHandle && (
            <View
              onLayout={handleHandleLayout}
              className="bg-grey-905 pb-2.5 pt-3"
            >
              <View className="h-1 w-10 self-center rounded-full bg-grey-700" />
            </View>
          )}
          {/* Scoped to just this top strip, not the whole content, so
              dragging lower down (a ScrollView, a TextInput) scrolls/types
              instead of being captured as a sheet drag. */}
          <GestureDetector gesture={panGesture}>
            <View
              className="absolute left-0 right-0 top-0 z-10"
              style={{ height: draggableAreaHeight }}
            />
          </GestureDetector>
          {isDynamicSizing ? (
            <View onLayout={handleContentLayout}>{children}</View>
          ) : (
            <Animated.View style={fixedContentWrapperStyle}>
              {children}
            </Animated.View>
          )}
        </Animated.View>
      </View>
    );
  },
);

export default BottomSheet;
