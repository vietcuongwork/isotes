import { computeTripBalance } from "@/domain/tripBalance";
import { transformTripWithRelationsRow } from "@/domain/transforms";
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
    balance: owner ? computeTripBalance(expenses, owner.id) : 0,
  };
}

export function getAvatarStack<T>(
  members: T[],
  maxDiscs = 4,
): { visible: T[]; overflow: number } {
  if (members.length <= maxDiscs) return { visible: members, overflow: 0 };

  // The last disc becomes "+N", so one fewer person fits
  const shown = maxDiscs - 1;
  return { visible: members.slice(0, shown), overflow: members.length - shown };
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
