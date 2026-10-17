import { getViewerNetForExpense } from "@/features/expense/helpers/expenseHelpers";
import { Expense } from "@/types/TExpense";

export function computeTripBalance(
  expenses: Expense[],
  viewerMemberId: string,
): number {
  return expenses.reduce(
    (total, expense) =>
      total + getViewerNetForExpense(expense, expense.splits, viewerMemberId),
    0,
  );
}
