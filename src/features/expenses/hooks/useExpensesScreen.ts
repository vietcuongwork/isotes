import { getExpensesWithSplitsByTripId } from "@/db/expenses";
import { getMembersByTripId } from "@/db/members";
import { getTripById } from "@/db/trips";
import { CURRENCY_OPTIONS } from "@/domain/currencies";
import { getDefaultExpenseSplit } from "@/domain/defaultSplit";
import {
  transformExpenseRow,
  transformMemberRow,
  transformTripRow,
} from "@/domain/transforms";
import { useAddPersonStore } from "@/stores/useAddPersonStore";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";

export default function useTripHomeScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const { data: trip, error } = useLiveQuery(getTripById(tripId));
  const { data: memberRows } = useLiveQuery(getMembersByTripId(tripId));
  const { data: expenseRows } = useLiveQuery(
    getExpensesWithSplitsByTripId(tripId),
  );
  const setCurrency = useExpenseSheetStore((s) => s.setCurrency);
  const setMembers = useExpenseSheetStore((s) => s.setMembers);
  const paidByMemberId = useExpenseSheetStore((s) => s.paidByMemberId);
  const setPaidByMemberId = useExpenseSheetStore((s) => s.setPaidByMemberId);
  const setSelectedMemberIds = useExpenseSheetStore(
    (s) => s.setSelectedMemberIds,
  );
  const setSplitShares = useExpenseSheetStore((s) => s.setSplitShares);
  const reset = useExpenseSheetStore((s) => s.reset);
  const resetAddPerson = useAddPersonStore((s) => s.reset);

  const transformedTrip = useMemo(
    () => (trip ? transformTripRow(trip) : undefined),
    [trip],
  );

  const transformedExpenses = useMemo(
    () => (expenseRows ?? []).map(transformExpenseRow),
    [expenseRows],
  );

  const transformedMembers = useMemo(
    () => (memberRows ?? []).map(transformMemberRow),
    [memberRows],
  );

  const viewerMemberId = transformedMembers.find((m) => m.isOwner)?.id;

  if (__DEV__ && error) {
    console.error("[useTripHomeScreen] Trip query failed", error);
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
    if (transformedMembers.length === 0) return;

    setMembers(transformedMembers);

    // Seed the draft's paid-by/split defaults as soon as members are known
    // (moved here 2026-09-23, from useAddExpenseBottomSheet), so
    // paidByMemberId is almost always already seeded by the time the
    // add-expense sheet opens rather than seeded on the sheet's own first
    // render. Guarded on paidByMemberId, not a ref: it must re-seed after
    // resetDraft()/reset() clears it back to "", not only when the member
    // list itself changes.
    if (paidByMemberId) return;

    const defaults = getDefaultExpenseSplit(transformedMembers);
    setPaidByMemberId(defaults.paidByMemberId);
    setSelectedMemberIds(defaults.selectedMemberIds);
    setSplitShares(defaults.splitShares);
  }, [
    transformedMembers,
    paidByMemberId,
    setMembers,
    setPaidByMemberId,
    setSelectedMemberIds,
    setSplitShares,
  ]);

  useEffect(() => {
    // Unmount only, so the draft survives the sheet closing and reopening.
    // Holds while switching trips replaces this screen (push, or the drawer's
    // root Stack replace); setParams would skip it. why: ADR 0004
    return () => {
      reset();
      resetAddPerson();
    };
  }, [reset, resetAddPerson]);

  return {
    transformedTrip,
    transformedExpenses,
    transformedMembers,
    viewerMemberId,
  };
}
