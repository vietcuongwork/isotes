import PickerField from "@/components/formfield/PickerField";
import { colors } from "@/themes/color";
import { Activity } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Text, View } from "react-native";

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
    <PickerField
      label="Activity"
      open={open}
      onPress={onPress}
      className="flex-1"
      boxClassName={cn(
        "px-4 py-3",
        open && "border border-orange-700 bg-orange-800",
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon size={18} color={colors.orange[400]} />
          <Text className={cn("text-grey-50 text-row", open && "text-orange-400")}>
            {selected.label}
          </Text>
        </View>
        <Chevron size={18} color={colors.orange[400]} />
      </View>
    </PickerField>
  );
}
