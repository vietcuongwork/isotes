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

// createdAt is in Unix seconds
export function formatTripDateLine(
  createdAt: number,
  currencyCode: string,
  now: Date,
): string {
  const created = new Date(createdAt * 1000);
  const isThisYear = created.getFullYear() === now.getFullYear();
  const date = created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: isThisYear ? undefined : "numeric",
  });

  return `Created ${date} · ${currencyCode}`;
}
