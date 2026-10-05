import { Currency } from "@/types/TCreateTrip";
import { Expense, Member } from "@/types/TExpense";
import { formatDisplayAmount } from "@/utils/currency";
import { formatDateLabel } from "@/utils/date";
import { View } from "react-native";
import { getViewerNetForExpense } from "../../helpers/expenseHelpers";
import ExpenseItem from "./ExpenseItem";
import ExpenseSeparator from "./ExpenseSeparator";

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  currency: Currency;
}

export default function ExpenseList({
  expenses,
  members,
  currency,
}: ExpenseListProps) {
  const viewerMemberId = members.find((member) => member.isOwner)?.id ?? "";

  // expenses arrives ordered by date desc (getExpensesWithSplitsByTripId), so
  // consecutive same-date rows can just be appended to the last group instead
  // of a separate sort/group-by pass.
  const groups: { dateId: string; expenses: Expense[] }[] = [];
  for (const expense of expenses) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.dateId === expense.date) {
      lastGroup.expenses.push(expense);
    } else {
      groups.push({ dateId: expense.date, expenses: [expense] });
    }
  }

  return (
    <View className="gap-3 px-5 pt-5">
      {groups.map((group) => {
        const dayTotal = group.expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );

        return (
          <View key={group.dateId} className="gap-3">
            <ExpenseSeparator
              label={formatDateLabel(group.dateId)}
              total={formatDisplayAmount(
                dayTotal,
                currency.symbol,
                currency.decimalDigits,
              )}
            />
            {group.expenses.map((expense) => {
              const payer =
                members.find((member) => member.id === expense.paidByMemberId) ??
                members[0];

              return (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  payer={payer}
                  viewerNet={getViewerNetForExpense(
                    expense,
                    expense.splits,
                    viewerMemberId,
                  )}
                  currency={currency}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
