import { colors } from "@/themes/color";
import { tabularNums } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { Expense, Member } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { formatDisplayAmount, roundToDecimals } from "@/utils/currency";
import { Text, View } from "react-native";

interface ExpenseRowProps {
  expense: Expense;
  payer: Member;
  viewerNet: number;
  currency: Currency;
}

function getNetLine(
  viewerNet: number,
  currency: Currency,
): { text: string; isLent: boolean } | null {
  // Amounts are real columns, so float dust must not show as "you lent ₫0"
  const net = roundToDecimals(viewerNet, currency.decimalDigits);
  if (net === 0) return null;

  const amount = formatDisplayAmount(
    Math.abs(net),
    currency.symbol,
    currency.decimalDigits,
  );
  return net > 0
    ? { text: `you lent ${amount}`, isLent: true }
    : { text: `you owe ${amount}`, isLent: false };
}

export default function ExpenseRow(props: ExpenseRowProps) {
  const { expense, payer, viewerNet, currency } = props;
  const { Icon } = expense.activity;
  const title = expense.description || expense.activity.label;
  const payerText = payer.isOwner ? "You paid" : `${payer.name} paid`;
  const amount = formatDisplayAmount(
    expense.amount,
    currency.symbol,
    currency.decimalDigits,
  );
  const net = getNetLine(viewerNet, currency);

  return (
    <View
      accessible
      accessibilityLabel={[title, payerText, amount, net?.text]
        .filter(Boolean)
        .join(", ")}
      className="flex-row items-center gap-space-3 py-space-3"
    >
      <View className="h-space-10 w-space-10 items-center justify-center rounded-md bg-ink-100">
        <Icon size={20} color={colors.ink[900]} />
      </View>

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-ink-900 text-body">
          {title}
        </Text>
        <Text className="text-ink-500 text-caption">{payerText}</Text>
      </View>

      <View className="items-end">
        <Text style={tabularNums} className="text-ink-900 text-amount">
          {amount}
        </Text>
        {net && (
          <Text
            style={tabularNums}
            className={cn(
              "text-label",
              net.isLent ? "text-get-600" : "text-owe-600",
            )}
          >
            {net.text}
          </Text>
        )}
      </View>
    </View>
  );
}
