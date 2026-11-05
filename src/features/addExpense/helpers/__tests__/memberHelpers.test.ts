import { filterMembers } from "@/features/addExpense/helpers/memberHelpers";
import { Member } from "@/types/TExpense";

const member = (id: string, name: string): Member => ({
  id,
  tripId: "t1",
  name,
  isOwner: false,
  memberColor: "sky",
  createdAt: 0,
});

const members = [
  member("1", "You"),
  member("2", "Tuấn"),
  member("3", "Đức"),
  member("4", "Mai"),
];

const names = (list: Member[]): string[] => list.map((m) => m.name);

describe("filterMembers", () => {
  it("finds an accented name from an unaccented query", () => {
    expect(names(filterMembers(members, "tuan"))).toEqual(["Tuấn"]);
  });

  it("finds a name starting with a stroke letter", () => {
    expect(names(filterMembers(members, "duc"))).toEqual(["Đức"]);
  });

  it("ignores case and surrounding spaces in the query", () => {
    expect(names(filterMembers(members, " MAI "))).toEqual(["Mai"]);
  });

  it("matches anywhere in the name", () => {
    expect(names(filterMembers(members, "ai"))).toEqual(["Mai"]);
  });

  it("returns every member in order for an empty or blank query", () => {
    expect(names(filterMembers(members, ""))).toEqual([
      "You",
      "Tuấn",
      "Đức",
      "Mai",
    ]);
    expect(names(filterMembers(members, "   "))).toEqual([
      "You",
      "Tuấn",
      "Đức",
      "Mai",
    ]);
  });

  it("returns none when no name matches", () => {
    expect(filterMembers(members, "zoe")).toEqual([]);
  });
});
