import { getAllTripsWithMembersAndExpenses } from "@/db/trips";
import { transformTripWithRelationsRow } from "@/features/expense/helpers/expenseHelpers";
import { getTripCardData } from "@/features/trips/helpers/tripsHelpers";
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
          rows.map((row) =>
            getTripCardData(transformTripWithRelationsRow(row)),
          ),
        );
      });
    }, []),
  );

  return trips;
}
