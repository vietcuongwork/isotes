import { getOwnerId } from "@/domain/memberHelpers";

describe("getOwnerId", () => {
  it("returns the owner's id among several members", () => {
    const members = [
      { id: "a", isOwner: false },
      { id: "you", isOwner: true },
      { id: "b", isOwner: false },
    ];
    expect(getOwnerId(members)).toBe("you");
  });

  it("returns an empty string when no member is the owner", () => {
    expect(getOwnerId([{ id: "a", isOwner: false }])).toBe("");
  });

  it("returns an empty string for an empty list", () => {
    expect(getOwnerId([])).toBe("");
  });
});
