import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";

// Shared by useSplitBottomSheet (native keyboard path) and
// useNumberPadBottomSheet (custom numpad path) so both agree on the same
// select/deselect side effects — clearing the field deselects the member,
// typing into a deselected member's field selects them again.
export default function useChangeSplitAmount() {
  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);
  const setSelectedMemberIds = useExpenseSheetStore(
    (s) => s.setSelectedMemberIds,
  );
  const selectMembers = useExpenseSheetStore((s) => s.selectMembers);
  const splitAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const setSplitAmounts = useExpenseSheetStore((s) => s.setSplitAmounts);

  return function changeSplitAmount(memberId: string, amount: string) {
    const isSelected = selectedMemberIds.includes(memberId);

    if (amount === "") {
      if (!isSelected) return;
      const nextAmounts = { ...splitAmounts };
      delete nextAmounts[memberId];
      setSplitAmounts(nextAmounts);
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
      return;
    }

    if (!isSelected) selectMembers([memberId]);
    setSplitAmounts({ ...splitAmounts, [memberId]: amount });
  };
}
