import { getMemberNetForTrip } from "@/domain/tripBalance";
import { Expense, Member } from "@/types/TExpense";

export type PersonSummary = Member & { expenseCount: number; net: number };

export function getPersonSummaries(
  members: Member[],
  expenses: Expense[],
): PersonSummary[] {
  return members
    .map((member) => ({
      ...member,
      expenseCount: expenses.filter(
        (expense) =>
          expense.paidByMemberId === member.id ||
          expense.splits.some((split) => split.memberId === member.id),
      ).length,
      net: getMemberNetForTrip(expenses, member.id),
    }))
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner)); // createdAt can tie
}
