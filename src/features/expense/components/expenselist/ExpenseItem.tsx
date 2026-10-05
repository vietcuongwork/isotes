import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { Expense, Member } from "@/types/TExpense";
import { formatDisplayAmount } from "@/utils/currency";
import { Text, View } from "react-native";

interface ExpenseItemProps {
  expense: Expense;
  payer: Member;
  viewerNet: number;
  currency: Currency;
}

export default function ExpenseItem({
  expense,
  payer,
  viewerNet,
  currency,
}: ExpenseItemProps) {
  const { Icon } = expense.activity;
  const title = expense.description || expense.activity.label;
  const isLent = viewerNet > 0;

  return (
    <View className="flex-row items-center justify-between rounded-btn bg-grey-925 p-3.5">
      {/* Left cluster */}
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-pill bg-orange-850 ">
          <Icon size={16} color={colors.orange[400]} />
        </View>
        <View>
          <Text className="text-grey-50 text-body">{title}</Text>
          <Text className="text-grey-200 text-meta">
            {payer.isOwner ? "You paid" : `${payer.name} paid`}
          </Text>
        </View>
      </View>

      <View>
        <Text className="text-grey-50 text-body">
          {formatDisplayAmount(
            expense.amount,
            currency.symbol,
            currency.decimalDigits,
          )}
        </Text>
        {viewerNet !== 0 && (
          <Text
            className={`text-label ${isLent ? "text-green-400" : "text-red-400"}`}
          >
            {isLent ? "you lent " : "you owe "}
            {formatDisplayAmount(
              Math.abs(viewerNet),
              currency.symbol,
              currency.decimalDigits,
            )}
          </Text>
        )}
      </View>
    </View>
  );
}
