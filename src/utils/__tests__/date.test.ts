import { formatShortDate } from "@/utils/date";

describe("formatShortDate", () => {
  it("drops the year when the date is in now's year", () => {
    expect(formatShortDate("2026-10-12", new Date(2026, 11, 25))).toBe(
      "Oct 12",
    );
  });

  it("keeps the year when the date isn't in now's year", () => {
    expect(formatShortDate("2026-10-12", new Date(2027, 0, 3))).toBe(
      "Oct 12, 2026",
    );
  });

  it("doesn't shift the day at either end of a month", () => {
    const now = new Date(2026, 5, 1);
    expect(formatShortDate("2026-01-01", now)).toBe("Jan 1");
    expect(formatShortDate("2026-12-31", now)).toBe("Dec 31");
  });
});
