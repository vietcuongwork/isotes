import { Member } from "@/types/TExpense";

// The trip owner's (You's) id; "" before the members load
export function getOwnerId(members: Pick<Member, "id" | "isOwner">[]): string {
  return members.find((m) => m.isOwner)?.id ?? "";
}
