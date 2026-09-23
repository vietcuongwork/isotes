import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { formatDisplayAmount, roundToDecimals } from "@/utils/currency";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function useSplitBottomSheet() {
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
  const members = useExpenseSheetStore((s) => s.members);

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

  // Mirrors resolveSplitAmounts's "shares" branch (expenseHelpers.ts) — same
  // round-to-nearest rule, kept in sync manually so the stepper row shows
  // exactly what submit will persist per member.
  const effectiveShareAmounts = useMemo<Record<string, string>>(() => {
    const totalShares = members.reduce(
      (sum, member) => sum + (selectedShares[member.id] ?? 0),
      0,
    );
    return Object.fromEntries(
      members.map((member) => {
        const memberShares = selectedShares[member.id] ?? 0;
        const amount = roundToDecimals(
          (totalAmount * memberShares) / (totalShares || 1),
          decimalDigits,
        );
        return [member.id, formatDisplayAmount(amount, symbol, decimalDigits)];
      }),
    );
  }, [members, selectedShares, totalAmount, symbol, decimalDigits]);

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
    effectiveShareAmounts,
    handleToggleEquallyMember,
    handleChangeAmount,
    handleChangeShares,
    safeBottomStyle,
    splitMethod,
    currency,
    selectedShares,
    equallySelectedMemberIds,
    totalAmount,
    members,
  };
}
