import { getViewerNetForExpense } from "@/features/expense/helpers/expenseHelpers";
import {
  ExpenseDay,
  formatDayHeader,
} from "@/features/expense/helpers/tripHomeHelpers";
import { tabularNums } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { Member } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { formatDisplayAmount } from "@/utils/currency";
import { Text, View } from "react-native";
import ExpenseRow from "./ExpenseRow";

interface ExpenseDayCardProps {
  day: ExpenseDay;
  members: Member[];
  viewerMemberId: string;
  currency: Currency;
  now: Date;
}

// One card per day, so the day has one shadow instead of a seam between rows
export default function ExpenseDayCard(props: ExpenseDayCardProps) {
  const { day, members, viewerMemberId, currency, now } = props;

  return (
    <View className="gap-space-2">
      {/* Day header */}
      <View className="flex-row items-baseline justify-between">
        <Text accessibilityRole="header" className="text-ink-900 text-heading">
          {formatDayHeader(day.dateId, now)}
        </Text>
        <Text style={tabularNums} className="text-ink-500 text-caption">
          {formatDisplayAmount(
            day.total,
            currency.symbol,
            currency.decimalDigits,
          )}
        </Text>
      </View>

      <View className="rounded-lg bg-card px-space-4 py-space-1 shadow-card">
        {day.expenses.map((expense, index) => (
          <View
            key={expense.id}
            className={cn(index > 0 && "border-t border-ink-100")}
          >
            <ExpenseRow
              expense={expense}
              payer={
                members.find(
                  (member) => member.id === expense.paidByMemberId,
                ) ?? members[0]
              }
              viewerNet={getViewerNetForExpense(
                expense,
                expense.splits,
                viewerMemberId,
              )}
              currency={currency}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
