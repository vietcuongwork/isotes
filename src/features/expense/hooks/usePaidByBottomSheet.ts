import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useMemo, useState } from "react";

export default function usePaidByBottomSheet() {
  const [query, setQuery] = useState<string>("");

  const selectedPayerId = useExpenseSheetStore((s) => s.paidByMemberId);
  const onSelectPayer = useExpenseSheetStore((s) => s.setPaidByMemberId);
  const members = useExpenseSheetStore((s) => s.members);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => member.name.toLowerCase().includes(q));
  }, [members, query]);

  return {
    query,
    setQuery,
    filteredMembers,
    selectedPayerId,
    onSelectPayer,
    members,
  };
}
