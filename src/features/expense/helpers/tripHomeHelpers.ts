import { Expense } from "@/types/TExpense";

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
