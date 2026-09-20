import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { formatAmountInput } from "@/utils/currency";
import { ChevronsUpDown, CircleAlert } from "lucide-react-native";
import { Text, TextInput, View } from "react-native";

interface AmountFieldProps {
  error: boolean;
}

const ErrorText = () => {
  return (
    <View className="flex-row items-center gap-2">
      <CircleAlert size={16} color={colors.red[400]} />
      <Text className="text-red-400 text-meta">
        Enter an amount before saving
      </Text>
    </View>
  );
};
export default function AmountField(props: AmountFieldProps) {
  const { error } = props;

  const amount = useExpenseSheetStore((s) => s.amount);
  const setAmount = useExpenseSheetStore((s) => s.setAmount);
  const currency = useExpenseSheetStore((s) => s.currency);

  const decimalDigits = currency?.decimalDigits;
  const placeholder = decimalDigits === 0 ? "0" : "0.00";

  return (
    <View
      className={cn(
        "flex-1 gap-1 bg-grey-965 px-5 py-3.5",
        error && "border-y border-red-400",
      )}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            "flex-row items-center gap-1 rounded-badge border border-grey-800 bg-grey-900 px-2.5 py-2",
            error && "border-red-400",
          )}
        >
          <Text className="text-grey-50 text-body-medium">
            {currency?.symbol}
          </Text>
          <ChevronsUpDown size={16} color={colors.grey[200]} />
        </View>

        <TextInput
          className={cn(
            "flex-1 text-grey-50 text-hero-amount",
            error && "text-red-400",
          )}
          placeholder={placeholder}
          placeholderTextColor={error ? colors.red[400] : colors.grey[400]}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(text) =>
            setAmount(formatAmountInput(text, decimalDigits))
          }
        />
      </View>
      {error && <ErrorText />}
    </View>
  );
}
