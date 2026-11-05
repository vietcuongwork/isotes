import {
  MEMBER_COLORS,
  firstUnusedColor,
} from "@/features/addExpense/addPerson/helpers/addPersonHelpers";
import { Member, MemberColor } from "@/types/TExpense";

const member = (id: string, memberColor: MemberColor): Member => ({
  id,
  tripId: "t1",
  name: id,
  isOwner: false,
  memberColor,
  createdAt: 0,
});

describe("firstUnusedColor", () => {
  it("gives sand when nobody is on the trip yet", () => {
    expect(firstUnusedColor([])).toBe("sand");
  });

  it("skips the color You already has", () => {
    expect(firstUnusedColor([member("You", "sand")])).toBe("olive");
  });

  it("fills a gap in the middle of the palette", () => {
    const members = [member("a", "sand"), member("b", "citron")];
    expect(firstUnusedColor(members)).toBe("olive");
  });

  it("moves past colors that two members share", () => {
    const members = [
      member("a", "sand"),
      member("b", "sand"),
      member("c", "olive"),
    ];
    expect(firstUnusedColor(members)).toBe("citron");
  });

  it("gives sand when all 12 colors are used", () => {
    const members = MEMBER_COLORS.map((color) => member(color, color));
    expect(firstUnusedColor(members)).toBe("sand");
  });
});
