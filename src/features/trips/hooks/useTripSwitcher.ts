import { getAllTripsWithMembersAndExpenses } from "@/db/trips";
import { transformTripWithRelationsRow } from "@/features/expense/helpers/expenseHelpers";
import { getTripCardData } from "@/features/trips/helpers/tripsHelpers";
import { TripCardData } from "@/types/TTrips";
import { useEffect, useState } from "react";

// The rest keep the query's newest-first order
function moveTripToTop(trips: TripCardData[], tripId: string): TripCardData[] {
  const current = trips.filter((data) => data.trip.id === tripId);
  const others = trips.filter((data) => data.trip.id !== tripId);
  return [...current, ...others];
}

// Refetched each time the drawer opens; the last list shows until the query
// resolves (ADR 0009 allows one combined query here)
export function useTripSwitcher(
  isOpen: boolean,
  currentTripId: string,
): TripCardData[] {
  const [trips, setTrips] = useState<TripCardData[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    getAllTripsWithMembersAndExpenses().then((rows) => {
      if (isCancelled) return;
      const cards = rows.map((row) =>
        getTripCardData(transformTripWithRelationsRow(row)),
      );
      setTrips(moveTripToTop(cards, currentTripId));
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentTripId]);

  return trips;
}
