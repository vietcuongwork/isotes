import { ExpenseRow, ExpenseSplitRow, MemberRow, TripRow } from "@/db/schema";
import { ACTIVITIES } from "@/domain/activities";
import { CURRENCY_OPTIONS } from "@/domain/currencies";
import { Trip } from "@/types/TCreateTrip";
import { Expense, Member } from "@/types/TExpense";

export const transformTripRow = (row: TripRow): Trip => {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    currency:
      CURRENCY_OPTIONS.find((c) => c.code === row.currencyCode) ??
      CURRENCY_OPTIONS[0],
    createdAt: row.createdAt,
  };
};

export const transformMemberRow = (row: MemberRow): Member => {
  return {
    id: row.id,
    tripId: row.tripId,
    name: row.name,
    isOwner: row.isOwner,
    memberColor: row.memberColor,
    createdAt: row.createdAt,
  };
};

export function transformExpenseRow(
  row: ExpenseRow & { splits: ExpenseSplitRow[] },
): Expense {
  return {
    id: row.id,
    tripId: row.tripId,
    paidByMemberId: row.paidByMemberId,
    amount: row.amount,
    description: row.description ?? "",
    // activityId is an untyped text() column (design_decisions.md, "Source of
    // truth for shared concepts..."), so a stale/typo'd id falls back to the
    // last ACTIVITIES entry ("other") rather than throwing.
    activity:
      ACTIVITIES.find((activity) => activity.id === row.activityId) ??
      ACTIVITIES[ACTIVITIES.length - 1],
    date: row.date,
    splitMethod: row.splitMethod,
    createdAt: row.createdAt,
    splits: row.splits,
  };
}

// One row of getTripsWithRelations(), with its members and expenses
export function transformTripWithRelationsRow(
  row: TripRow & {
    members: MemberRow[];
    expenses: (ExpenseRow & { splits: ExpenseSplitRow[] })[];
  },
): { trip: Trip; members: Member[]; expenses: Expense[] } {
  return {
    trip: transformTripRow(row),
    members: row.members.map(transformMemberRow),
    expenses: row.expenses.map(transformExpenseRow),
  };
}
