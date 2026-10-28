import { filterMembers } from "@/features/expense/helpers/memberHelpers";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useMemo, useState } from "react";

export default function usePaidByBottomSheet() {
  const [query, setQuery] = useState<string>("");

  const selectedPayerId = useExpenseSheetStore((s) => s.paidByMemberId);
  const onSelectPayer = useExpenseSheetStore((s) => s.setPaidByMemberId);
  const members = useExpenseSheetStore((s) => s.members);

  const filteredMembers = useMemo(
    () => filterMembers(members, query),
    [members, query],
  );

  return {
    query,
    setQuery,
    filteredMembers,
    selectedPayerId,
    onSelectPayer,
    members,
  };
}
