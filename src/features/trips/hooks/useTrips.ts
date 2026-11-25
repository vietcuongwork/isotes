import { getTripsWithRelations } from "@/db/trips";
import { transformTripWithRelationsRow } from "@/domain/transforms";
import {
  getTripCardData,
  matchesTripSearch,
} from "@/features/trips/helpers/tripsHelpers";
import { TripCardData } from "@/types/TTrips";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput } from "react-native";

// [DEBUG-loading] temporary, removed in T11: above 0 holds the loading state
const DEBUG_LOADING_DELAY_MS = 0;

// null until the first fetch resolves, so the screen can tell "loading" from
// "no trips" and never flashes the empty state
export function useTrips() {
  const [trips, setTrips] = useState<TripCardData[] | null>(null);
  // [DEBUG-loading] temporary, removed in T11
  const [mountedAt] = useState(() => Date.now());

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
      // [DEBUG-loading] temporary, removed in T11
      const focusedAt = Date.now();
      getTripsWithRelations().then((rows) => {
        // [DEBUG-loading] temporary, removed in T11
        const now = Date.now();
        console.log(
          "[DEBUG-loading] read",
          now - focusedAt,
          now - mountedAt,
          rows.length,
        );
        const apply = () =>
          setTrips(
            rows.map((row) =>
              getTripCardData(transformTripWithRelationsRow(row)),
            ),
          );
        // [DEBUG-loading] temporary, removed in T11
        if (DEBUG_LOADING_DELAY_MS > 0)
          setTimeout(apply, DEBUG_LOADING_DELAY_MS);
        else apply();
      });
    }, [mountedAt]),
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
