import { cn } from "@/utils/cn";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface FieldShellProps {
  label: string;
  error?: string;
  //NOTE - bump this (e.g. RHF submitCount) to re-fire the error shake on submit.
  shakeTrigger?: number;
  className?: string;
  children: React.ReactNode;
}

export default function FieldShell(props: FieldShellProps) {
  const { label, error, shakeTrigger, className, children } = props;

  const translateX = useSharedValue(0);

  //NOTE - Read the error via ref (not a dep) so a submit re-fires the shake,
  // but revalidation-on-change while typing (RHF's reValidateMode) doesn't.
  const errorRef = useRef<string | undefined>(error);
  errorRef.current = error;

  useEffect(() => {
    if (!errorRef.current) return;
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeTrigger]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className={cn("gap-2", className)}>
      <Text className="text-label text-grey-200">{label}</Text>
      <Animated.View style={shakeStyle}>{children}</Animated.View>
      {error && <Text className="text-meta px-2 text-red-400">{error}</Text>}
    </View>
  );
}
