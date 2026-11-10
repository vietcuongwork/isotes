import { ACTIVITIES } from "@/domain/activities";
import { getPersonSummaries } from "@/features/people/helpers/peopleHelpers";
import { Expense, Member, Split } from "@/types/TExpense";
import { roundToDecimals } from "@/utils/currency";

const person = (id: string, isOwner = false): Member => ({
  id,
  tripId: "t1",
  name: id,
  isOwner,
  memberColor: "sand",
  createdAt: 100,
});
const split = (memberId: string, individualAmount: number): Split => ({
  id: `s-${memberId}`,
  expenseId: "e",
  memberId,
  individualAmount,
  shares: null,
});
const expense = (
  id: string,
  paidByMemberId: string,
  amount: number,
  splits: Split[],
): Expense => ({
  id,
  tripId: "t1",
  paidByMemberId,
  amount,
  description: id,
  activity: ACTIVITIES[0],
  date: "2026-11-09",
  splitMethod: "equally",
  createdAt: 0,
  splits,
});

describe("getPersonSummaries", () => {
  it("puts You first when createdAt ties, and keeps the rest in order", () => {
    const ids = getPersonSummaries(
      [person("mai"), person("you", true), person("linh")],
      [],
    ).map((p) => p.id);
    expect(ids).toEqual(["you", "mai", "linh"]);
  });

  it("counts a payer who isn't in the split", () => {
    const taxi = expense("taxi", "mai", 30, [
      split("you", 15),
      split("linh", 15),
    ]);
    const mai = getPersonSummaries(
      [person("you", true), person("mai")],
      [taxi],
    )[1];
    expect(mai.expenseCount).toBe(1);
  });

  it("counts a payer who is also in the split once", () => {
    const lunch = expense("lunch", "you", 20, [
      split("you", 10),
      split("mai", 10),
    ]);
    expect(
      getPersonSummaries([person("you", true)], [lunch])[0].expenseCount,
    ).toBe(1);
  });

  it("gives nets that sum to zero after rounding", () => {
    const dinner = expense("dinner", "you", 10, [
      split("you", 3.34),
      split("mai", 3.33),
      split("linh", 3.33),
    ]);
    const nets = getPersonSummaries(
      [person("you", true), person("mai"), person("linh")],
      [dinner],
    ).map((p) => p.net);
    expect(
      roundToDecimals(
        nets.reduce((a, b) => a + b, 0),
        2,
      ),
    ).toBe(0);
  });
});
