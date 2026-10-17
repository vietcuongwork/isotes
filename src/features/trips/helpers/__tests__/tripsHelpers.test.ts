import { ACTIVITIES } from "@/features/expense/constants";
import {
  computeTripBalance,
  formatTripDateLine,
} from "@/features/trips/helpers/tripsHelpers";
import { Expense, Split } from "@/types/TExpense";

// tripsHelpers → expenseHelpers imports the draft store only for its dirty
// check; the real store pulls flash-calendar → flash-list ESM, which Jest doesn't transform
jest.mock("@/stores/useExpenseSheetStore", () => ({ draftInitialState: {} }));

const split = (memberId: string, individualAmount: number): Split => ({
  id: `s-${memberId}`,
  expenseId: "e1",
  memberId,
  individualAmount,
  shares: null,
});

// createdAt is stored in Unix seconds (schema default `unixepoch()`)
const toUnixSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

describe("computeTripBalance", () => {
  it("gives the payer back what the others owe on an equal split", () => {
    const lodging: Expense = {
      id: "e1",
      tripId: "t1",
      paidByMemberId: "you",
      amount: 90_000,
      description: "Lodging",
      activity: ACTIVITIES[0],
      date: "2026-10-17",
      splitMethod: "equally",
      createdAt: 0,
      splits: [
        split("you", 30_000),
        split("an", 30_000),
        split("binh", 30_000),
      ],
    };

    expect(computeTripBalance([lodging], "you")).toBe(60_000);
  });
});

describe("formatTripDateLine", () => {
  const now = new Date(2026, 9, 17, 10, 0);

  it("shows month, day and currency for a trip created this year", () => {
    const createdAt = toUnixSeconds(new Date(2026, 9, 10, 9, 0));

    expect(formatTripDateLine(createdAt, "JPY", now)).toBe(
      "Created Oct 10 · JPY",
    );
  });

  it("adds the year for a trip created in an earlier year", () => {
    const createdAt = toUnixSeconds(new Date(2025, 11, 28, 9, 0));

    expect(formatTripDateLine(createdAt, "JPY", now)).toBe(
      "Created Dec 28, 2025 · JPY",
    );
  });

  // Both sides of local midnight, so a UTC year check fails in any non-UTC zone
  it("uses the local calendar year around New Year", () => {
    const newYearsDay = new Date(2026, 0, 1, 10, 0);
    const lateOnDec31 = toUnixSeconds(new Date(2025, 11, 31, 23, 30));
    const earlyOnJan1 = toUnixSeconds(new Date(2026, 0, 1, 0, 30));

    expect(formatTripDateLine(lateOnDec31, "VND", newYearsDay)).toBe(
      "Created Dec 31, 2025 · VND",
    );
    expect(formatTripDateLine(earlyOnJan1, "VND", newYearsDay)).toBe(
      "Created Jan 1 · VND",
    );
  });
});
