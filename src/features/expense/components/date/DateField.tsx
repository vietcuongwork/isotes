import PickerField from "@/components/formfield/PickerField";
import { colors } from "@/themes/color";
import { formatDateLabel } from "@/utils/date";
import { Calendar } from "lucide-react-native";
import { Text, View } from "react-native";

interface DateFieldProps {
  selected: string;
  onPress: () => void;
}
export default function DateField(props: DateFieldProps) {
  const { onPress, selected } = props;
  return (
    <PickerField
      label="Date"
      onPress={onPress}
      className="flex-1"
      boxClassName="px-4 py-3"
    >
      <View className="flex-row items-center gap-2">
        <Calendar size={18} color={colors.grey[500]} />
        <Text className="text-grey-50 text-row">
          {formatDateLabel(selected)}
        </Text>
      </View>
    </PickerField>
  );
}
