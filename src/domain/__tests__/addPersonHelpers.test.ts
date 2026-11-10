import {
  MEMBER_COLORS,
  cleanName,
  findMemberByName,
  firstUnusedColor,
  normalizeName,
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

describe("cleanName", () => {
  it("trims outer spaces", () => {
    expect(cleanName(" Mai ")).toBe("Mai");
  });

  it("collapses runs of spaces to one", () => {
    expect(cleanName("Mai  Lan")).toBe("Mai Lan");
  });

  it("collapses tabs and newlines too", () => {
    expect(cleanName("Mai\t\nLan")).toBe("Mai Lan");
  });

  it("composes a decomposed name to NFC", () => {
    const decomposed = "Tuấn".normalize("NFD");
    expect(decomposed).not.toBe("Tuấn");
    expect(cleanName(decomposed)).toBe("Tuấn");
  });

  it("keeps the case", () => {
    expect(cleanName("  zOe ")).toBe("zOe");
  });
});

describe("normalizeName", () => {
  it("folds case", () => {
    expect(normalizeName("TUẤN")).toBe(normalizeName("tuấn"));
  });

  it("keeps accents, so Tuan and Tuấn differ", () => {
    expect(normalizeName("Tuan")).not.toBe(normalizeName("Tuấn"));
  });
});

describe("findMemberByName", () => {
  const mai = member("Mai", "sand");
  const maiLan = member("Mai Lan", "olive");
  const tuan = member("TUẤN", "citron");

  it.each(["mai", " Mai ", "Mai"])("matches %j to Mai", (typed) => {
    expect(findMemberByName([mai], typed)).toBe(mai);
  });

  it("matches across a run of spaces", () => {
    expect(findMemberByName([maiLan], "Mai  Lan")).toBe(maiLan);
  });

  it("ignores case on the stored side", () => {
    expect(findMemberByName([tuan], "tuấn")).toBe(tuan);
  });

  it("does not match Tuan to Tuấn", () => {
    expect(findMemberByName([member("Tuấn", "sand")], "Tuan")).toBeUndefined();
  });

  it("returns the stored member, so the message can use its name", () => {
    expect(findMemberByName([mai, tuan], "tuấn")?.name).toBe("TUẤN");
  });

  it("returns undefined for a blank name", () => {
    expect(findMemberByName([mai], "   ")).toBeUndefined();
  });

  it("returns undefined when no one matches", () => {
    expect(findMemberByName([mai], "Zoe")).toBeUndefined();
  });
});
