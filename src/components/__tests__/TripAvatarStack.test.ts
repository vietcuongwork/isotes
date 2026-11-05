import { getAvatarStack } from "@/components/TripAvatarStack";

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
