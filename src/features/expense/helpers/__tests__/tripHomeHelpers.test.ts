import { ACTIVITIES } from "@/features/expense/constants";
import {
  formatDayHeader,
  formatExpenseCount,
  formatPeopleLabel,
  getTripSummary,
  groupExpensesByDay,
} from "@/features/expense/helpers/tripHomeHelpers";
import { Expense, Split } from "@/types/TExpense";

// tripHomeHelpers → tripsHelpers → expenseHelpers imports the draft store; the real
// store pulls flash-calendar → flash-list ESM, which Jest doesn't transform
jest.mock("@/stores/useExpenseSheetStore", () => ({ draftInitialState: {} }));

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

describe("formatPeopleLabel", () => {
  it("says just you when you're the only person", () => {
    expect(formatPeopleLabel(1)).toBe("Just you");
  });

  it("counts the others, singular for one", () => {
    expect(formatPeopleLabel(2)).toBe("You and 1 other");
    expect(formatPeopleLabel(4)).toBe("You and 3 others");
  });
});

describe("formatExpenseCount", () => {
  it("is singular for one expense", () => {
    expect(formatExpenseCount(1)).toBe("1 expense");
  });

  it("is plural for none and for many", () => {
    expect(formatExpenseCount(0)).toBe("0 expenses");
    expect(formatExpenseCount(23)).toBe("23 expenses");
  });
});

describe("getTripSummary", () => {
  const paid = (
    paidByMemberId: string,
    amount: number,
    splits: Record<string, number>,
  ): Expense => ({
    ...expense(`${paidByMemberId}-${amount}`, "2026-10-12", amount),
    paidByMemberId,
    splits: Object.entries(splits).map(
      ([memberId, individualAmount]): Split => ({
        id: `${memberId}-${amount}`,
        expenseId: `${paidByMemberId}-${amount}`,
        memberId,
        individualAmount,
        shares: null,
      }),
    ),
  });

  it("gets back what others owe on what you paid", () => {
    const lodging = paid("you", 90_000, {
      you: 30_000,
      mai: 30_000,
      ana: 30_000,
    });

    expect(getTripSummary([lodging], "you", 0)).toEqual({
      total: 90_000,
      count: 1,
      share: 30_000,
      balance: 60_000,
      state: "get",
    });
  });

  // 0.1 + 0.2 − 0.3 leaves 5.55e-17, which must read as square and show as 0
  it("rounds float dust to the currency's decimals, so it's all square", () => {
    const expenses = [
      paid("you", 0.1, { mai: 0.1 }),
      paid("you", 0.2, { mai: 0.2 }),
      paid("mai", 0.3, { you: 0.3 }),
    ];

    const summary = getTripSummary(expenses, "you", 2);

    expect(summary.state).toBe("square");
    expect(summary.balance).toBe(0);
  });

  it("owes your split on what someone else paid", () => {
    const dinner = paid("mai", 129, { you: 64.5, mai: 64.5 });

    expect(getTripSummary([dinner], "you", 2)).toEqual({
      total: 129,
      count: 1,
      share: 64.5,
      balance: -64.5,
      state: "owe",
    });
  });

  it("is empty with zeros when the trip has no expenses", () => {
    expect(getTripSummary([], "you", 0)).toEqual({
      total: 0,
      count: 0,
      share: 0,
      balance: 0,
      state: "empty",
    });
  });

  it("is all square with no share when you're in no split and paid nothing", () => {
    const taxi = paid("mai", 50, { mai: 25, ana: 25 });

    expect(getTripSummary([taxi], "you", 2)).toEqual({
      total: 50,
      count: 1,
      share: 0,
      balance: 0,
      state: "square",
    });
  });
});
