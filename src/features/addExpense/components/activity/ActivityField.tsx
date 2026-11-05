import { colors } from "@/themes/color";
import { Activity } from "@/types/TExpense";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Pressable, Text } from "react-native";

interface ActivityFieldProps {
  selected: Activity;
  open?: boolean;
  onPress: () => void;
}

export default function ActivityField(props: ActivityFieldProps) {
  const { selected, open, onPress } = props;

  const { Icon } = selected;
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Activity, ${selected.label}`}
      accessibilityState={{ expanded: !!open }}
      className="h-space-12 flex-1 flex-row items-center gap-space-2 rounded-md bg-ink-100 px-space-3"
    >
      <Icon size={20} color={colors.ink[900]} />
      <Text className="flex-1 text-ink-900 text-body" numberOfLines={1}>
        {selected.label}
      </Text>
      <Chevron size={20} color={colors.ink[500]} />
    </Pressable>
  );
}
