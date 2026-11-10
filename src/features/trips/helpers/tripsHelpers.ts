import { getMemberNetForTrip } from "@/domain/tripBalance";
import { transformTripWithRelationsRow } from "@/domain/transforms";
import { formatExpenseCount } from "@/domain/tripFormat";
import { TripCardData } from "@/types/TTrips";

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

// NFD splits "à" into "a" plus a combining mark (U+0300 to U+036F),
// but has no decomposition for "Đ"/"đ", so those map to "d" by hand
function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}

export function matchesTripSearch(name: string, query: string): boolean {
  return normalizeForSearch(name).includes(normalizeForSearch(query));
}
