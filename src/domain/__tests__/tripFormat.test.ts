import {
  formatExpenseCount,
  formatPersonNet,
  formatTripDateLine,
} from "@/domain/tripFormat";

// createdAt is stored in Unix seconds (schema default `unixepoch()`)
const toUnixSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

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

describe("formatExpenseCount", () => {
  it("is singular for one expense", () => {
    expect(formatExpenseCount(1)).toBe("1 expense");
  });

  it("is plural for none and for many", () => {
    expect(formatExpenseCount(0)).toBe("0 expenses");
    expect(formatExpenseCount(23)).toBe("23 expenses");
  });
});

describe("formatPersonNet", () => {
  const base = { expenseCount: 3, decimalDigits: 0, symbol: "¥" };

  it.each([
    [12300, true, "get", "+¥12,300", "you get back"],
    [12300, false, "get", "+¥12,300", "gets back"],
    [-6200, true, "owe", "−¥6,200", "you owe"],
    [-6200, false, "owe", "−¥6,200", "owes"],
    [0, false, "square", "¥0", "all square"],
    [0.0000001, false, "square", "¥0", "all square"],
  ])("net %p, isOwner %p", (net, isOwner, tone, amount, word) => {
    expect(formatPersonNet({ ...base, net, isOwner })).toEqual({
      tone,
      amount,
      word,
    });
  });

  it("shows nothing for a person with no expenses", () => {
    expect(
      formatPersonNet({ ...base, expenseCount: 0, net: 0, isOwner: false }),
    ).toEqual({ tone: "empty", amount: "", word: "" });
  });
});
