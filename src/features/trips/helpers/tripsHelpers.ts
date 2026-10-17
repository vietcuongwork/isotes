import { getViewerNetForExpense } from "@/features/expense/helpers/expenseHelpers";
import { Expense } from "@/types/TExpense";
import { roundToDecimals } from "@/utils/currency";

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

// createdAt is in Unix seconds; the year shows only when it isn't now's year
export function formatTripCreatedDate(createdAt: number, now: Date): string {
  const created = new Date(createdAt * 1000);
  const isThisYear = created.getFullYear() === now.getFullYear();
  return created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: isThisYear ? undefined : "numeric",
  });
}

export function formatTripDateLine(
  createdAt: number,
  currencyCode: string,
  now: Date,
): string {
  return `Created ${formatTripCreatedDate(createdAt, now)} · ${currencyCode}`;
}

export type TripCardState = "get" | "owe" | "square" | "empty";

export function getTripCardState(input: {
  expenseCount: number;
  balance: number;
  decimalDigits: number;
}): TripCardState {
  if (input.expenseCount === 0) return "empty";

  // Amounts are stored as floats, so dust like 0.0000001 must read as square
  const balance = roundToDecimals(input.balance, input.decimalDigits);
  if (balance > 0) return "get";
  if (balance < 0) return "owe";
  return "square";
}

export function getAvatarStack<T>(
  members: T[],
  maxDiscs = 4,
): { visible: T[]; overflow: number } {
  if (members.length <= maxDiscs) return { visible: members, overflow: 0 };

  // The last disc becomes "+N", so one fewer person fits
  const shown = maxDiscs - 1;
  return { visible: members.slice(0, shown), overflow: members.length - shown };
}
