import { getAllTripsWithMembersAndExpenses } from "@/db/trips";
import { transformTripWithRelationsRow } from "@/domain/transforms";
import {
  getTripCardData,
  matchesTripSearch,
} from "@/features/trips/helpers/tripsHelpers";
import { TripCardData } from "@/types/TTrips";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput } from "react-native";

// null until the first fetch resolves, so the screen can tell "loading" from
// "no trips" and never flashes the empty state
export function useTrips() {
  const [trips, setTrips] = useState<TripCardData[] | null>(null);

  const router = useRouter();

  // StatusBar props merge in mount order and a pushed screen keeps this one
  // mounted, so dark text is rendered only while Trips is on top.
  const isFocused = useIsFocused();
  // Kept in this screen, which stays mounted under a pushed trip, so the
  // query survives the trip and back
  const [query, setQuery] = useState("");
  const searchRef = useRef<TextInput>(null);
  const listedTrips = trips?.filter((data) =>
    matchesTripSearch(data.trip.name, query),
  );
  // Still null while loading, so the empty state can't flash
  const hasNoTrips = trips?.length === 0;

  // A pushed screen keeps Trips mounted, so its search would stay focused
  // under it and still have the caret on Back
  useEffect(() => {
    if (!isFocused) searchRef.current?.blur();
  }, [isFocused]);
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

  return {
    router,
    isFocused,
    query,
    setQuery,
    searchRef,
    listedTrips,
    hasNoTrips,
  };
}
