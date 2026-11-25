import { ACTIVITIES } from "@/domain/activities";
import {
  canRemovePerson,
  formatNetBadge,
  getPersonExpenses,
  getPersonSummaries,
} from "@/features/people/helpers/peopleHelpers";
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
  date = "2026-11-09",
  createdAt = 0,
): Expense => ({
  id,
  tripId: "t1",
  paidByMemberId,
  amount,
  description: id,
  activity: ACTIVITIES[0],
  date,
  splitMethod: "equally",
  createdAt,
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

describe("getPersonExpenses", () => {
  const taxi = expense("taxi", "mai", 30, [
    split("you", 15),
    split("linh", 15),
  ]);
  const lunch = expense("lunch", "you", 20, [
    split("you", 10),
    split("mai", 10),
  ]);

  it("lists a payer who isn't in the split with a share of 0", () => {
    const rows = getPersonExpenses("mai", [taxi]);
    expect(rows.map((r) => [r.id, r.share])).toEqual([["taxi", 0]]);
  });

  it("lists a split member who didn't pay with their individualAmount", () => {
    const rows = getPersonExpenses("linh", [taxi]);
    expect(rows.map((r) => [r.id, r.share])).toEqual([["taxi", 15]]);
  });

  it("leaves out an expense the person is in neither as payer nor in the split", () => {
    expect(getPersonExpenses("ben", [taxi, lunch])).toEqual([]);
  });

  it("lists a payer who is also in the split once, with their split amount", () => {
    const rows = getPersonExpenses("you", [lunch]);
    expect(rows.map((r) => [r.id, r.share])).toEqual([["lunch", 10]]);
  });

  it("orders by date descending, then createdAt descending within a day", () => {
    const older = expense(
      "older",
      "you",
      5,
      [split("you", 5)],
      "2026-11-08",
      5,
    );
    const earlyToday = expense(
      "early",
      "you",
      5,
      [split("you", 5)],
      "2026-11-10",
      1,
    );
    const lateToday = expense(
      "late",
      "you",
      5,
      [split("you", 5)],
      "2026-11-10",
      9,
    );
    const ids = getPersonExpenses("you", [older, earlyToday, lateToday]).map(
      (r) => r.id,
    );
    expect(ids).toEqual(["late", "early", "older"]);
  });
});

describe("formatNetBadge", () => {
  it.each([
    ["owe", "−¥6,200", "owes", "Owes ¥6,200"],
    ["get", "+¥12,300", "gets back", "Gets back ¥12,300"],
    ["owe", "−¥6,200", "you owe", "You owe ¥6,200"],
    ["get", "+¥12,300", "you get back", "You get back ¥12,300"],
    ["square", "¥0", "all square", "All square"],
  ] as const)("%s, %s, %s reads %s", (tone, amount, word, expected) => {
    expect(formatNetBadge({ tone, amount, word })).toBe(expected);
  });

  it("gives no badge to a person with no expenses", () => {
    expect(formatNetBadge({ tone: "empty", amount: "", word: "" })).toBeNull();
  });
});

describe("canRemovePerson", () => {
  it.each([
    [true, 0, false], // You, even with no expenses
    [false, 0, true],
    [false, 1, false], // paid for or in the split of one expense
  ])("isOwner %p, expenseCount %p", (isOwner, expenseCount, expected) => {
    expect(canRemovePerson({ isOwner, expenseCount })).toBe(expected);
  });
});
