import { colors } from "@/themes/color";
import { formatDateLabel } from "@/utils/date";
import { Calendar } from "lucide-react-native";
import { Pressable, Text } from "react-native";

interface DateFieldProps {
  selected: string;
  onPress: () => void;
}
export default function DateField(props: DateFieldProps) {
  const { onPress, selected } = props;
  const label = formatDateLabel(selected);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Date, ${label}`}
      className="h-space-12 flex-1 flex-row items-center gap-space-2 rounded-md bg-ink-100 px-space-3"
    >
      <Calendar size={20} color={colors.ink[500]} />
      <Text className="flex-1 text-ink-900 text-body" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
