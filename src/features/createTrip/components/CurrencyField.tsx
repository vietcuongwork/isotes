import PickerField from "@/components/formfield/PickerField";
import { colors } from "@/themes/color";
import { ChevronsUpDown } from "lucide-react-native";
import { Text, View } from "react-native";
import { Currency } from "../../../types/TCreateTrip";

interface CurrencyFieldProps {
  value: Currency;
  /** is the currency sheet open — drives the accent look */
  open?: boolean;
  onPress: () => void;
}

export default function CurrencyField(props: CurrencyFieldProps) {
  const { value, open, onPress } = props;

  return (
    <PickerField label="Default Currency" open={open} onPress={onPress}>
      <View className="flex-row items-center justify-between">
        {/* Left cluster: badge + label stack */}
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-badge border border-orange-700 bg-orange-800">
            <Text className="text-orange-400 text-body-medium-flat">
              {value.symbol}
            </Text>
          </View>
          <View>
            <Text className="text-grey-50 text-body">{value.name}</Text>
            <Text className="text-grey-400 text-meta">{value.code}</Text>
          </View>
        </View>
        <ChevronsUpDown size={20} color={colors.grey[400]} />
      </View>
    </PickerField>
  );
}
