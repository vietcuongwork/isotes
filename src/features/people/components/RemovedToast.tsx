import { useEffect } from "react";
import { AccessibilityInfo, Pressable, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

interface RemovedToastProps {
  name: string;
  onUndo: () => void;
}

export default function RemovedToast(props: RemovedToastProps) {
  const { name, onUndo } = props;
  const message = `${name} removed from the trip`;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    // NOTE - no token for the 52pt toast height, falling back to min-h-[52px]
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      className="absolute bottom-space-8 left-space-5 right-space-5 min-h-[52px] flex-row items-center gap-space-3 rounded-md bg-ink-900 py-space-1 pl-space-4 pr-space-1 shadow-lifted"
    >
      {/* NOTE - no token for 14/20 regular (the board's message), falling back to text-label (medium) */}
      <Text className="flex-1 text-card text-label">{message}</Text>
      {/* NOTE - no token for the 44pt touch target, falling back to min-h-[44px] */}
      <Pressable
        onPress={onUndo}
        accessibilityRole="button"
        className="min-h-[44px] justify-center px-space-3"
      >
        {/* NOTE - no token for 14/20 semibold (the board's Undo), falling back to text-label (medium) */}
        <Text className="text-card text-label">Undo</Text>
      </Pressable>
    </Animated.View>
  );
}
