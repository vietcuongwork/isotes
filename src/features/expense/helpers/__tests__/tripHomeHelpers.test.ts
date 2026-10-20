import { ACTIVITIES } from "@/features/expense/constants";
import {
  formatDayHeader,
  groupExpensesByDay,
} from "@/features/expense/helpers/tripHomeHelpers";
import { Expense } from "@/types/TExpense";

const expense = (id: string, date: string, amount: number): Expense => ({
  id,
  tripId: "t1",
  paidByMemberId: "you",
  amount,
  description: id,
  activity: ACTIVITIES[0],
  date,
  splitMethod: "equally",
  createdAt: 0,
  splits: [],
});

describe("groupExpensesByDay", () => {
  it("groups the date-descending list into one entry per day, with its total", () => {
    const dinner = expense("dinner", "2026-10-12", 6_200);
    const taxi = expense("taxi", "2026-10-12", 2_280);
    const museum = expense("museum", "2026-10-11", 1_500);

    expect(groupExpensesByDay([dinner, taxi, museum])).toEqual([
      { dateId: "2026-10-12", total: 8_480, expenses: [dinner, taxi] },
      { dateId: "2026-10-11", total: 1_500, expenses: [museum] },
    ]);
  });

  it("returns no days for a trip with no expenses", () => {
    expect(groupExpensesByDay([])).toEqual([]);
  });

  it("keeps a single day as one entry", () => {
    const coffee = expense("coffee", "2026-10-12", 4.5);

    expect(groupExpensesByDay([coffee])).toEqual([
      { dateId: "2026-10-12", total: 4.5, expenses: [coffee] },
    ]);
  });

  // Amounts are real columns, so the total carries float dust until it's formatted
  it("sums decimal amounts to within float precision", () => {
    const [day] = groupExpensesByDay([
      expense("tea", "2026-10-12", 0.1),
      expense("cake", "2026-10-12", 0.2),
    ]);

    expect(day.total).toBeCloseTo(0.3, 10);
  });
});

describe("formatDayHeader", () => {
  const now = new Date(2026, 9, 19, 10, 0);

  it("shows weekday, month and day for a day this year", () => {
    expect(formatDayHeader("2026-10-17", now)).toBe("Saturday, Oct 17");
  });

  it("adds the year for a day in an earlier year", () => {
    expect(formatDayHeader("2025-10-11", now)).toBe("Saturday, Oct 11, 2025");
  });
});
