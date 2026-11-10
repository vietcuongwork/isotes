import { Expense, Split } from "@/types/TExpense";
import { roundToDecimals } from "@/utils/currency";

export function getMemberNetForTrip(
  expenses: Expense[],
  memberId: string,
): number {
  return expenses.reduce(
    (total, expense) =>
      total + getMemberNetForExpense(expense, expense.splits, memberId),
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

// Positive = the member lent this amount (they paid and are owed back),
// negative = the member owes this amount, 0 = they weren't part of this expense.
// Payer's net is amount minus THEIR OWN split row, not the sum of everyone
// else's — this now reads the rounding/leftover remainder directly, since
// resolveSplitAmounts already baked it into the payer's stored row. See
// design_decisions.md "Split rounding/leftover is assigned to the payer"
// (2026-09-25).
export function getMemberNetForExpense(
  expense: Pick<Expense, "paidByMemberId" | "amount">,
  splits: Pick<Split, "memberId" | "individualAmount">[],
  memberId: string,
): number {
  const memberSplit = splits.find((s) => s.memberId === memberId);
  const isPayer = expense.paidByMemberId === memberId;

  if (isPayer) return expense.amount - (memberSplit?.individualAmount ?? 0);
  if (memberSplit) return -memberSplit.individualAmount;
  return 0;
}
