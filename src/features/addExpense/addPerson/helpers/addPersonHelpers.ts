import { colors } from "@/themes/color";
import { Member, MemberColor } from "@/types/TExpense";

export const MEMBER_COLORS = Object.keys(colors.member) as MemberColor[];

// The first palette color no member has; sand when all 12 are taken
export function firstUnusedColor(members: Member[]): MemberColor {
  const used = members.map((m) => m.memberColor);
  return (
    MEMBER_COLORS.find((color) => !used.includes(color)) ?? MEMBER_COLORS[0]
  );
}
