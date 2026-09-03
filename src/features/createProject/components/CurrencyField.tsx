import { colors } from "@/themes/color";
import { ChevronsUpDown } from "lucide-react-native";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { Currency } from "../types/TCreateProject";

interface CurrencyFieldProps {
  value: Currency;
  touchableOpacityProps: TouchableOpacityProps;
}
export default function CurrencyField(props: CurrencyFieldProps) {
  const { value, touchableOpacityProps } = props;

  return (
    <TouchableOpacity className="gap-2" {...touchableOpacityProps}>
      <Text className="font-outfit-medium text-label text-grey-300">
        Default Currency
      </Text>

      <View className="rounded-row bg-grey-950 border-grey-815 flex-row items-center justify-between gap-3 border p-4">
        {/* Left cluster: badge + label stack */}
        <View className="flex-row items-center gap-3">
          <View className="rounded-badge h-10 w-10 items-center justify-center border border-orange-700 bg-orange-800">
            <Text className="font-outfit-medium text-field text-orange-400">
              {value.symbol}
            </Text>
          </View>

          <View>
            <Text className="text-grey-50 text-body font-outfit-regular">
              {value.name}
            </Text>
            <Text className="text-grey-400 text-meta font-outfit-regular">
              {value.code}
            </Text>
          </View>
        </View>

        {/* Right side */}
        <ChevronsUpDown size={20} color={colors.grey[400]} />
      </View>
    </TouchableOpacity>
  );
}
