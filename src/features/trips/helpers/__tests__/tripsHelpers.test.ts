import { ACTIVITIES } from "@/features/expense/constants";
import { computeTripBalance } from "@/features/trips/helpers/tripsHelpers";
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
