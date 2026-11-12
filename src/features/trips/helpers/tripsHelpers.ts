import { getMemberNetForTrip } from "@/domain/tripBalance";
import { transformTripWithRelationsRow } from "@/domain/transforms";
import { formatExpenseCount } from "@/domain/tripFormat";
import { TripCardData } from "@/types/TTrips";
import { foldForSearch } from "@/utils/text";

// A trip with no owner member has nobody to be the viewer, so its balance is 0
export function getTripCardData(
  input: ReturnType<typeof transformTripWithRelationsRow>,
): TripCardData {
  const { trip, members, expenses } = input;
  const owner = members.find((member) => member.isOwner);

  return {
    trip,
    members,
    expenseCount: expenses.length,
    totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    balance: owner ? getMemberNetForTrip(expenses, owner.id) : 0,
  };
}

export function formatSwitcherMeta(
  currencyCode: string,
  peopleCount: number,
  expenseCount: number,
): string {
  const people = `${peopleCount} ${peopleCount === 1 ? "person" : "people"}`;
  return `${currencyCode} · ${people} · ${formatExpenseCount(expenseCount)}`;
}

export function matchesTripSearch(name: string, query: string): boolean {
  return foldForSearch(name).includes(foldForSearch(query));
}
