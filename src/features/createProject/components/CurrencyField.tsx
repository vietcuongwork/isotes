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
      <Text className="text-label text-grey-300">
        Default Currency
      </Text>

      <View className="flex-row items-center justify-between gap-3 rounded-row border border-grey-815 bg-grey-950 p-4">
        {/* Left cluster: badge + label stack */}
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-badge border border-orange-700 bg-orange-800">
            <Text className="text-body-medium-flat text-orange-400">
              {value.symbol}
            </Text>
          </View>

          <View>
            <Text className="text-body text-grey-50">
              {value.name}
            </Text>
            <Text className="text-meta text-grey-400">
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
