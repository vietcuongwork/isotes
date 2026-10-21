import { useShakeOnTrigger } from "@/components/formfield/useShakeOnTrigger";
import { cn } from "@/utils/cn";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

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

  const shakeStyle = useShakeOnTrigger(shakeTrigger, !!error);

  return (
    <View className={cn("gap-2", className)}>
      <View className="flex-row justify-between">
        <Text className="text-grey-200 text-legacy-label">{label}</Text>
        {optionalLabel && (
          <Text className="text-grey-500 text-meta">{optionalLabel}</Text>
        )}
      </View>
      <Animated.View style={shakeStyle}>{children}</Animated.View>
      {error && <Text className="px-2 text-red-400 text-meta">{error}</Text>}
    </View>
  );
}
