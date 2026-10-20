import {
  computeTripBalance,
  getTripCardState,
  TripCardState,
} from "@/features/trips/helpers/tripsHelpers";
import { Expense } from "@/types/TExpense";
import { roundToDecimals } from "@/utils/currency";

export interface TripSummary {
  total: number;
  count: number;
  share: number;
  balance: number;
  state: TripCardState;
}

export interface ExpenseDay {
  dateId: string;
  total: number;
  expenses: Expense[];
}

// Relies on the query's date-descending order, so a new date always starts a new day
export function groupExpensesByDay(expenses: Expense[]): ExpenseDay[] {
  const days: ExpenseDay[] = [];

  for (const expense of expenses) {
    const lastDay = days[days.length - 1];
    if (lastDay?.dateId === expense.date) {
      lastDay.expenses.push(expense);
      lastDay.total += expense.amount;
    } else {
      days.push({
        dateId: expense.date,
        total: expense.amount,
        expenses: [expense],
      });
    }
  }

  return days;
}

// A date-time string with no offset parses as local time; "2026-10-12" alone would parse as UTC
export function formatDayHeader(dateId: string, now: Date): string {
  const day = new Date(`${dateId}T00:00`);
  const isThisYear = day.getFullYear() === now.getFullYear();
  return day.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: isThisYear ? undefined : "numeric",
  });
}

// `count` includes you
export function formatPeopleLabel(count: number): string {
  const others = count - 1;
  if (others === 0) return "Just you";
  return `You and ${others} ${others === 1 ? "other" : "others"}`;
}

export function formatExpenseCount(count: number): string {
  return `${count} ${count === 1 ? "expense" : "expenses"}`;
}

// The share is what you were split into, whoever paid
export function getTripSummary(
  expenses: Expense[],
  viewerMemberId: string,
  decimalDigits: number,
): TripSummary {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const share = expenses.reduce(
    (sum, expense) =>
      sum +
      (expense.splits.find((split) => split.memberId === viewerMemberId)
        ?.individualAmount ?? 0),
    0,
  );
  // Rounded here too, so the amount the tile shows agrees with its state
  const balance = roundToDecimals(
    computeTripBalance(expenses, viewerMemberId),
    decimalDigits,
  );
  const state = getTripCardState({
    expenseCount: expenses.length,
    balance,
    decimalDigits,
  });

  return { total, count: expenses.length, share, balance, state };
}
