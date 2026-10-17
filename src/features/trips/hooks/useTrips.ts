import { getAllTripsWithMembersAndExpenses } from "@/db/trips";
import {
  transformExpenseRow,
  transformMemberRow,
  transformTripRow,
} from "@/features/expense/helpers/expenseHelpers";
import { computeTripBalance } from "@/features/trips/helpers/tripsHelpers";
import { TripCardData } from "@/types/TTrips";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

// null until the first fetch resolves, so the screen can tell "loading" from
// "no trips" and never flashes the empty state
export function useTrips(): TripCardData[] | null {
  const [trips, setTrips] = useState<TripCardData[] | null>(null);

  // One-shot fetch on every focus, so a trip edited and left shows its new
  // totals (ADR 0009 allows one combined query here)
  useFocusEffect(
    useCallback(() => {
      getAllTripsWithMembersAndExpenses().then((rows) => {
        setTrips(
          rows.map((row) => {
            const members = row.members.map(transformMemberRow);
            const expenses = row.expenses.map(transformExpenseRow);
            const owner = members.find((member) => member.isOwner);

            return {
              trip: transformTripRow(row),
              members,
              expenseCount: expenses.length,
              totalAmount: expenses.reduce(
                (sum, expense) => sum + expense.amount,
                0,
              ),
              balance: owner ? computeTripBalance(expenses, owner.id) : 0,
            };
          }),
        );
      });
    }, []),
  );

  return trips;
}
