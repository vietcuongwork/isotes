import { Expense, Split } from "@/types/TExpense";
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

// Positive = viewer lent this amount (they paid and are owed back),
// negative = viewer owes this amount, 0 = viewer wasn't part of this expense.
// Payer's net is amount minus THEIR OWN split row, not the sum of everyone
// else's — this now reads the rounding/leftover remainder directly, since
// resolveSplitAmounts already baked it into the payer's stored row. See
// design_decisions.md "Split rounding/leftover is assigned to the payer"
// (2026-09-25).
export function getViewerNetForExpense(
  expense: Pick<Expense, "paidByMemberId" | "amount">,
  splits: Pick<Split, "memberId" | "individualAmount">[],
  viewerMemberId: string,
): number {
  const viewerSplit = splits.find((s) => s.memberId === viewerMemberId);
  const isPayer = expense.paidByMemberId === viewerMemberId;

  if (isPayer) return expense.amount - (viewerSplit?.individualAmount ?? 0);
  if (viewerSplit) return -viewerSplit.individualAmount;
  return 0;
}
