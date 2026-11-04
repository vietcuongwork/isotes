import { Member } from "@/types/TExpense";

export function getDefaultExpenseSplit(members: Member[]) {
  const owner = members.find((member) => member.isOwner) ?? members[0];
  return {
    paidByMemberId: owner.id,
    selectedMemberIds: members.map((member) => member.id),
    splitShares: Object.fromEntries(members.map((member) => [member.id, 1])),
  };
}
