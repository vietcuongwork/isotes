import { colors } from "@/themes/color";
import { ChevronLeft } from "lucide-react-native";
import { Pressable } from "react-native";

export default function BackButton(props: { onPress: () => void }) {
  const { onPress } = props;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      // NOTE - no token for the 44pt touch target, falling back to h-[44px] w-[44px]
      className="h-[44px] w-[44px] items-center justify-center rounded-pill bg-ink-100"
    >
      <ChevronLeft size={24} strokeWidth={1.75} color={colors.ink[900]} />
    </Pressable>
  );
}
