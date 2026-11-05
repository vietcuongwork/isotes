import {
  formatSwitcherMeta,
  matchesTripSearch,
} from "@/features/trips/helpers/tripsHelpers";

// tripsHelpers → expenseHelpers imports the draft store only for its dirty
// check; the real store pulls flash-calendar → flash-list ESM, which Jest doesn't transform
jest.mock("@/stores/useExpenseSheetStore", () => ({ draftInitialState: {} }));

describe("formatSwitcherMeta", () => {
  it("joins the currency, people and expenses with dots", () => {
    expect(formatSwitcherMeta("JPY", 4, 23)).toBe(
      "JPY · 4 people · 23 expenses",
    );
  });

  it("is singular for one person and one expense", () => {
    expect(formatSwitcherMeta("EUR", 1, 1)).toBe("EUR · 1 person · 1 expense");
  });
});

describe("matchesTripSearch", () => {
  it("finds part of a name in any case", () => {
    expect(matchesTripSearch("Lisbon with the team", "LIS")).toBe(true);
    expect(matchesTripSearch("Lisbon with the team", "the team")).toBe(true);
    expect(matchesTripSearch("Lisbon", "kyoto")).toBe(false);
  });

  // NFD splits "à" into "a" plus a mark, but leaves "Đ" whole
  it("ignores Vietnamese accents and Đ on either side", () => {
    expect(matchesTripSearch("Đà Lạt", "da lat")).toBe(true);
    expect(matchesTripSearch("Đà Lạt", "ĐÀ LẠT")).toBe(true);
    expect(matchesTripSearch("Da Lat", "đà lạt")).toBe(true);
    expect(matchesTripSearch("Đà Nẵng", "da lat")).toBe(false);
  });

  it("matches every trip when the query is empty or only spaces", () => {
    expect(matchesTripSearch("Lisbon", "")).toBe(true);
    expect(matchesTripSearch("Lisbon", "  ")).toBe(true);
  });

  it("ignores spaces around the query", () => {
    expect(matchesTripSearch("Lisbon with the team", "  lisbon ")).toBe(true);
  });
});
