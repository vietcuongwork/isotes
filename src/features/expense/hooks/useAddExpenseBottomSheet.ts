import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { toDateId } from "@marceloterreiro/flash-calendar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDefaultExpenseSplit } from "../helpers/expenseHelpers";

const today = toDateId(new Date());

export default function useAddExpenseBottomSheet() {
  const [isActivityPickerOpen, setActivityPickerOpen] = useState(false);

  const { bottom } = useSafeAreaInsets();
  const safeBottomStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);
  const { pushSheet, popSheet } = useBottomSheetStack();

  const members = useExpenseSheetStore((s) => s.members);
  const setPaidByMemberId = useExpenseSheetStore((s) => s.setPaidByMemberId);
  const setEquallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.setEquallySelectedMemberIds,
  );
  const setSplitShares = useExpenseSheetStore((s) => s.setSplitShares);

  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (hasSeededRef.current || members.length === 0) return;
    hasSeededRef.current = true;

    const defaults = getDefaultExpenseSplit(members);
    setPaidByMemberId(defaults.paidByMemberId);
    setEquallySelectedMemberIds(defaults.equallySelectedMemberIds);
    setSplitShares(defaults.splitShares);
  }, [members, setPaidByMemberId, setEquallySelectedMemberIds, setSplitShares]);

  return {
    today,
    isActivityPickerOpen,
    setActivityPickerOpen,
    safeBottomStyle,
    pushSheet,
    popSheet,
  };
}
