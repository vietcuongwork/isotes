import { getMembersByTripId } from "@/db/members";
import { getTripById } from "@/db/trips";
import { CURRENCY_OPTIONS } from "@/features/createTrip/constants";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { transformMemberRow, transformTripRow } from "../helpers/expenseHelpers";

export default function useExpenseScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const { data: trip, error } = useLiveQuery(getTripById(tripId));
  const { data: memberRows } = useLiveQuery(getMembersByTripId(tripId));
  const setCurrency = useExpenseSheetStore((s) => s.setCurrency);
  const setMembers = useExpenseSheetStore((s) => s.setMembers);

  const transformedTrip = useMemo(
    () => (trip ? transformTripRow(trip) : undefined),
    [trip],
  );

  if (__DEV__ && error) {
    console.error("[useExpenseScreen] Trip query failed", error);
  }

  useEffect(() => {
    if (trip) {
      setCurrency(
        CURRENCY_OPTIONS.find((c) => c.code === trip.currencyCode) ??
          CURRENCY_OPTIONS[0],
      );
    }
  }, [trip, setCurrency]);

  useEffect(() => {
    if (memberRows) {
      setMembers(memberRows.map(transformMemberRow));
    }
  }, [memberRows, setMembers]);

  return { transformedTrip };
}
