import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function usePaidByBottomSheet() {
  const [query, setQuery] = useState<string>("");

  const selectedPayerId = useExpenseSheetStore((s) => s.paidByMemberId);
  const onSelectPayer = useExpenseSheetStore((s) => s.setPaidByMemberId);
  const members = useExpenseSheetStore((s) => s.members);

  const { bottom } = useSafeAreaInsets();
  const safeBottomStyle = useMemo(
    () => ({ flex: 1, paddingBottom: bottom }),
    [bottom],
  );
  const flatListContentContainerStyle = useMemo(
    () => ({ paddingHorizontal: 20, paddingBottom: bottom + 12, gap: 7 }),
    [bottom],
  );
  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => member.name.toLowerCase().includes(q));
  }, [members, query]);

  return {
    query,
    setQuery,
    filteredMembers,
    flatListContentContainerStyle,
    safeBottomStyle,
    selectedPayerId,
    onSelectPayer,
    members,
  };
}
