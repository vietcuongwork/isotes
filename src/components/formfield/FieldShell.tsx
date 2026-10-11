import { cn } from "@/utils/cn";
import { useEffect, useEffectEvent } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface FieldShellProps {
  label?: string;
  optionalLabel?: string;
  error?: string;
  //NOTE - bump this (e.g. RHF submitCount) to re-fire the error shake on submit.
  shakeTrigger?: number;
  className?: string;
  children: React.ReactNode;
}

export default function FieldShell(props: FieldShellProps) {
  const { label, optionalLabel, error, shakeTrigger, className, children } =
    props;

  const translateX = useSharedValue(0);

  //NOTE - An effect event reads the latest error without making it a dep, so a
  // submit re-fires the shake but revalidation while typing (reValidateMode) doesn't.
  const shakeIfError = useEffectEvent(() => {
    if (!error) return;
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
  }, [shakeTrigger]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className={cn("gap-2", className)}>
      <View className="flex-row justify-between">
        <Text className="text-grey-200 text-label">{label}</Text>
        {optionalLabel && (
          <Text className="text-grey-500 text-meta">{optionalLabel}</Text>
        )}
      </View>
      <Animated.View style={shakeStyle}>{children}</Animated.View>
      {error && <Text className="px-2 text-red-400 text-meta">{error}</Text>}
    </View>
  );
}
