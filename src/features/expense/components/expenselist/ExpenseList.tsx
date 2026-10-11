import { getViewerNetForExpense } from "@/features/expense/helpers/expenseHelpers";
import { Currency } from "@/types/TCreateTrip";
import { Expense, Member } from "@/types/TExpense";
import { formatDisplayAmount } from "@/utils/currency";
import { formatDateLabel } from "@/utils/date";
import { SectionList, View } from "react-native";
import ExpenseItem from "./ExpenseItem";
import ExpenseSeparator from "./ExpenseSeparator";

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  currency: Currency;
}

type DateSection = { dateId: string; data: Expense[] };

export default function ExpenseList({
  expenses,
  members,
  currency,
}: ExpenseListProps) {
  const viewerMemberId = members.find((member) => member.isOwner)?.id ?? "";

  const RowGap = () => {
    return <View className="h-3" />;
  };

  // expenses arrives ordered by date desc (getExpensesWithSplitsByTripId), so
  // consecutive same-date rows can just be appended to the last section instead
  // of a separate sort/group-by pass.
  const sections: DateSection[] = [];
  for (const expense of expenses) {
    const lastSection = sections[sections.length - 1];
    if (lastSection?.dateId === expense.date) {
      lastSection.data.push(expense);
    } else {
      sections.push({ dateId: expense.date, data: [expense] });
    }
  }

  return (
    <SectionList
      // NativeWind doesn't map className on SectionList, so the one layout style is plain
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 84 }} // ListBottomSpace
      sections={sections}
      keyExtractor={(expense) => expense.id}
      // iOS sticks section headers by default; the design scrolls them with the list
      stickySectionHeadersEnabled={true}
      ItemSeparatorComponent={RowGap}
      renderSectionHeader={({ section }) => {
        const dayTotal = section.data.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );

        return (
          <View className="px-5">
            <ExpenseSeparator
              label={formatDateLabel(section.dateId)}
              total={formatDisplayAmount(
                dayTotal,
                currency.symbol,
                currency.decimalDigits,
              )}
            />
          </View>
        );
      }}
      renderItem={({ item: expense }) => {
        const payer =
          members.find((member) => member.id === expense.paidByMemberId) ??
          members[0];

        return (
          <View className="px-5">
            <ExpenseItem
              expense={expense}
              payer={payer}
              viewerNet={getViewerNetForExpense(
                expense,
                expense.splits,
                viewerMemberId,
              )}
              currency={currency}
            />
          </View>
        );
      }}
    />
  );
}
