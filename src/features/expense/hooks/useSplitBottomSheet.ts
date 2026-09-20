import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { Member } from "@/types/TExpense";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UseSplitBottomSheetProps {
  members: Member[];
}

export default function useSplitBottomSheet(props: UseSplitBottomSheetProps) {
  const { members } = props;

  const [query, setQuery] = useState<string>("");

  const equallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.equallySelectedMemberIds,
  );
  const onChangeEquallySelected = useExpenseSheetStore(
    (s) => s.setEquallySelectedMemberIds,
  );
  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const selectedAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const onChangeAmounts = useExpenseSheetStore((s) => s.setSplitAmounts);
  const selectedShares = useExpenseSheetStore((s) => s.splitShares);
  const onChangeShares = useExpenseSheetStore((s) => s.setSplitShares);
  const totalAmount = Number(useExpenseSheetStore((s) => s.amount)) || 0;
  const currency = useExpenseSheetStore((s) => s.currency);

  const { symbol, decimalDigits } = currency;

  const { bottom } = useSafeAreaInsets();

  const flatListContentContainerStyle = useMemo(
    () => ({ paddingHorizontal: 20, paddingBottom: bottom, gap: 8 }),
    [bottom],
  );
  const safeBottomStyle = useMemo(
    () => ({ flex: 1, paddingBottom: bottom }),
    [bottom],
  );
  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => member.name.toLowerCase().includes(q));
  }, [members, query]);

  const handleToggleEquallyMember = (memberId: string) =>
    onChangeEquallySelected(
      equallySelectedMemberIds.includes(memberId)
        ? equallySelectedMemberIds.filter((id) => id !== memberId)
        : [...equallySelectedMemberIds, memberId],
    );

  const effectiveAmounts = useMemo<Record<string, string>>(() => {
    const equalShare = (totalAmount / (members.length || 1)).toFixed(
      decimalDigits,
    );
    return Object.fromEntries(
      members.map((member) => [
        member.id,
        selectedAmounts[member.id] ?? equalShare,
      ]),
    );
  }, [members, selectedAmounts, totalAmount]);

  const handleChangeAmount = (memberId: string, amount: string) =>
    onChangeAmounts({ ...selectedAmounts, [memberId]: amount });

  const handleChangeShares = (memberId: string, delta: number) => {
    const currentShares = selectedShares[memberId] ?? 0;
    const nextShares = Math.max(0, currentShares + delta);
    onChangeShares({ ...selectedShares, [memberId]: nextShares });
  };

  return {
    query,
    setQuery,
    filteredMembers,
    flatListContentContainerStyle,
    effectiveAmounts,
    handleToggleEquallyMember,
    handleChangeAmount,
    handleChangeShares,
    safeBottomStyle,
    splitMethod,
    currency,
    selectedShares,
    equallySelectedMemberIds,
    totalAmount,
  };
}
