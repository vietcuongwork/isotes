import {
  getAvatarStack,
  matchesTripSearch,
} from "@/features/trips/helpers/tripsHelpers";

// tripsHelpers → expenseHelpers imports the draft store only for its dirty
// check; the real store pulls flash-calendar → flash-list ESM, which Jest doesn't transform
jest.mock("@/stores/useExpenseSheetStore", () => ({ draftInitialState: {} }));

describe("getAvatarStack", () => {
  const people = (count: number) =>
    ["An", "Binh", "Chi", "Dung", "Em", "Giang", "Hoa", "Khoa", "Lan"].slice(
      0,
      count,
    );

  it("shows everyone when there are 4 people or fewer", () => {
    expect(getAvatarStack(people(0))).toEqual({ visible: [], overflow: 0 });
    expect(getAvatarStack(people(1))).toEqual({
      visible: ["An"],
      overflow: 0,
    });
    expect(getAvatarStack(people(4))).toEqual({
      visible: ["An", "Binh", "Chi", "Dung"],
      overflow: 0,
    });
  });

  it("shows 3 people and the rest as overflow when there are 5 or more", () => {
    expect(getAvatarStack(people(5))).toEqual({
      visible: ["An", "Binh", "Chi"],
      overflow: 2,
    });
    expect(getAvatarStack(people(9))).toEqual({
      visible: ["An", "Binh", "Chi"],
      overflow: 6,
    });
  });

  it("keeps one disc for the overflow when maxDiscs is smaller", () => {
    expect(getAvatarStack(people(4), 3)).toEqual({
      visible: ["An", "Binh"],
      overflow: 2,
    });
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
