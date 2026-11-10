import { colors } from "@/themes/color";
import { Member, MemberColor } from "@/types/TExpense";

export const MEMBER_COLORS = Object.keys(colors.member) as MemberColor[];

// NFC, trimmed, runs of whitespace collapsed to one space; case kept (saved names)
export function cleanName(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ");
}

// The comparison form: cleanName plus case folded; accents still count
export function normalizeName(name: string): string {
  return cleanName(name).toLowerCase();
}

// The member whose name matches under normalizeName, if any
export function findMemberByName(
  members: Member[],
  name: string,
): Member | undefined {
  const target = normalizeName(name);
  if (target === "") return undefined;
  return members.find((m) => normalizeName(m.name) === target);
}

// The first palette color no member has; sand when all 12 are taken
export function firstUnusedColor(members: Member[]): MemberColor {
  const used = members.map((m) => m.memberColor);
  return (
    MEMBER_COLORS.find((color) => !used.includes(color)) ?? MEMBER_COLORS[0]
  );
}
