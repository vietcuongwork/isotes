import { MemberRow, TripRow } from "@/db/schema";
import { CURRENCY_OPTIONS } from "@/features/createTrip/constants";
import { Trip } from "@/types/TCreateTrip";
import { Member } from "@/types/TExpense";

export function transformTripRow(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    currency:
      CURRENCY_OPTIONS.find((c) => c.code === row.currencyCode) ??
      CURRENCY_OPTIONS[0],
    createdAt: row.createdAt,
  };
}

export function transformMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    tripId: row.tripId,
    name: row.name,
    isOwner: row.isOwner,
    memberColor: row.memberColor,
    createdAt: row.createdAt,
  };
}

export function getDefaultExpenseSplit(members: Member[]) {
  const owner = members.find((member) => member.isOwner) ?? members[0];
  return {
    paidByMemberId: owner.id,
    equallySelectedMemberIds: members.map((member) => member.id),
    splitShares: Object.fromEntries(members.map((member) => [member.id, 1])),
  };
}
