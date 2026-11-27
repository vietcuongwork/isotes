import { getMemberNetForTrip, TripCardState } from "@/domain/tripBalance";
import { formatExpenseCount, formatPersonNet } from "@/domain/tripFormat";
import { Currency } from "@/types/TCreateTrip";
import { Expense, Member } from "@/types/TExpense";
import { capitalize } from "@/utils/utils";

export type PersonSummary = Member & { expenseCount: number; net: number };
export type PersonExpense = Expense & { share: number };

function isInExpense(expense: Expense, memberId: string): boolean {
  return (
    expense.paidByMemberId === memberId ||
    expense.splits.some((split) => split.memberId === memberId)
  );
}

export function getPersonExpenses(
  memberId: string,
  expenses: Expense[],
): PersonExpense[] {
  return expenses
    .filter((expense) => isInExpense(expense, memberId))
    .map((expense) => ({
      ...expense,
      share:
        expense.splits.find((split) => split.memberId === memberId)
          ?.individualAmount ?? 0, // a payer outside the split (spec, Not asked)
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export function getPersonSummaries(
  members: Member[],
  expenses: Expense[],
): PersonSummary[] {
  return members
    .map((member) => ({
      ...member,
      expenseCount: expenses.filter((expense) =>
        isInExpense(expense, member.id),
      ).length,
      net: getMemberNetForTrip(expenses, member.id),
    }))
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner)); // createdAt can tie
}

// The Person badge: "Owes ¥6,200" from formatPersonNet's unsigned money and its word
export function formatNetBadge(
  net: ReturnType<typeof formatPersonNet>,
): { tone: Exclude<TripCardState, "empty">; text: string } | null {
  if (net.tone === "empty") return null;
  if (net.tone === "square") return { tone: net.tone, text: "All square" };
  return { tone: net.tone, text: `${capitalize(net.word)} ${net.money}` };
}

// One person's count line and net, for the People row and the Person top
export function formatPersonSummary(
  person: Pick<PersonSummary, "net" | "expenseCount" | "isOwner">,
  currency: Pick<Currency, "symbol" | "decimalDigits">,
): { count: string; net: ReturnType<typeof formatPersonNet> } {
  const { net, expenseCount, isOwner } = person;
  return {
    count:
      expenseCount === 0 ? "No expenses yet" : formatExpenseCount(expenseCount),
    net: formatPersonNet({
      net,
      expenseCount,
      isOwner,
      decimalDigits: currency.decimalDigits,
      symbol: currency.symbol,
    }),
  };
}

export function canRemovePerson(
  summary: Pick<PersonSummary, "isOwner" | "expenseCount">,
): boolean {
  return !summary.isOwner && summary.expenseCount === 0;
}
