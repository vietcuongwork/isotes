import { ACTIVITIES } from "@/domain/activities";
import { computeTripBalance, getTripCardState } from "@/domain/tripBalance";
import { Expense, Split } from "@/types/TExpense";

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

describe("getTripCardState", () => {
  it("is empty when nothing is logged, whatever the balance", () => {
    expect(
      getTripCardState({ expenseCount: 0, balance: 60_000, decimalDigits: 0 }),
    ).toBe("empty");
  });

  it("is get when the others owe you", () => {
    expect(
      getTripCardState({ expenseCount: 1, balance: 60_000, decimalDigits: 0 }),
    ).toBe("get");
  });

  it("is owe when you owe the others", () => {
    expect(
      getTripCardState({ expenseCount: 2, balance: -64.5, decimalDigits: 2 }),
    ).toBe("owe");
  });

  it("is square when the balance is zero", () => {
    expect(
      getTripCardState({ expenseCount: 1, balance: 0, decimalDigits: 0 }),
    ).toBe("square");
  });

  // Amounts are stored as floats, so a settled trip can carry dust
  it("rounds the balance to the currency's decimals first", () => {
    const stateOf = (balance: number, decimalDigits: number) =>
      getTripCardState({ expenseCount: 3, balance, decimalDigits });

    expect(stateOf(0.0000001, 2)).toBe("square");
    expect(stateOf(-0.004, 2)).toBe("square");
    expect(stateOf(0.4, 0)).toBe("square");
  });
});
