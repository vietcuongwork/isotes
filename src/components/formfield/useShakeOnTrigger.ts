import { useEffect, useEffectEvent } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/** A sideways shake each time `trigger` changes while `hasError` is true; put the style on an `Animated.View`. */
export function useShakeOnTrigger(
  trigger: number | undefined,
  hasError: boolean,
) {
  const translateX = useSharedValue(0);

  //NOTE - An effect event reads the latest error without making it a dep, so a
  // submit re-fires the shake but revalidation while typing (reValidateMode) doesn't.
  const shakeIfError = useEffectEvent(() => {
    if (!hasError) return;
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  });

  useEffect(() => {
    shakeIfError();
  }, [trigger]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
}
