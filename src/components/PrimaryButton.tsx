import { Pressable, Text } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** The Ink & Shine `button-primary` (DESIGN.md). One per screen. */
export default function PrimaryButton(props: PrimaryButtonProps) {
  const { label, onPress, disabled = false } = props;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      // NOTE - no token for the 52pt height, falling back to h-[52px] (button-primary's own size)
      className="h-[52px] items-center justify-center rounded-pill bg-ink-900 px-space-6"
    >
      <Text className="text-card text-body">{label}</Text>
    </Pressable>
  );
}
