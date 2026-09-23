import { getMembersByTripId } from "@/db/members";
import { getTripById } from "@/db/trips";
import { CURRENCY_OPTIONS } from "@/features/createTrip/constants";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  getDefaultExpenseSplit,
  transformMemberRow,
  transformTripRow,
} from "../helpers/expenseHelpers";

export default function useExpenseScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const { data: trip, error } = useLiveQuery(getTripById(tripId));
  const { data: memberRows } = useLiveQuery(getMembersByTripId(tripId));
  const setCurrency = useExpenseSheetStore((s) => s.setCurrency);
  const setMembers = useExpenseSheetStore((s) => s.setMembers);
  const paidByMemberId = useExpenseSheetStore((s) => s.paidByMemberId);
  const setPaidByMemberId = useExpenseSheetStore((s) => s.setPaidByMemberId);
  const setEquallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.setEquallySelectedMemberIds,
  );
  const setSplitShares = useExpenseSheetStore((s) => s.setSplitShares);
  const reset = useExpenseSheetStore((s) => s.reset);

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
    if (!memberRows) return;

    const members = memberRows.map(transformMemberRow);
    setMembers(members);

    // Seed the draft's paid-by/split defaults as soon as members are known
    // (moved here 2026-09-23, from useAddExpenseBottomSheet), so
    // paidByMemberId is almost always already seeded by the time the
    // add-expense sheet opens rather than seeded on the sheet's own first
    // render. Guarded on paidByMemberId, not a ref: it must re-seed after
    // resetDraft()/reset() clears it back to "", not only when the member
    // list itself changes.
    if (paidByMemberId || members.length === 0) return;

    const defaults = getDefaultExpenseSplit(members);
    setPaidByMemberId(defaults.paidByMemberId);
    setEquallySelectedMemberIds(defaults.equallySelectedMemberIds);
    setSplitShares(defaults.splitShares);
  }, [
    memberRows,
    paidByMemberId,
    setMembers,
    setPaidByMemberId,
    setEquallySelectedMemberIds,
    setSplitShares,
  ]);

  useEffect(() => {
    // Cleared only on unmount, not on every render — useExpenseSheetStore's
    // draft (amount/description/split/etc.) is meant to persist across the
    // add-expense sheet closing/reopening within the same trip (the "picked
    // up where you left off" resume UI in screen_ui_drafts/04-add-expense.html),
    // and should only be wiped when actually leaving this trip. This only
    // holds as long as trip-switching always navigates to a new tripId route
    // via router.push/replace (a real unmount+remount) rather than
    // router.setParams on the same route entry — if that ever changes, this
    // cleanup stops firing and the reset needs to move to a tripId-change
    // effect instead.
    return () => reset();
  }, [reset]);

  return { transformedTrip };
}
