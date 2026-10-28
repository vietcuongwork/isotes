import { filterMembers } from "@/features/expense/helpers/memberHelpers";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { Member, SplitSelection } from "@/types/TExpense";
import { formatDisplayAmount, parseAmountInput } from "@/utils/currency";
import { useMemo, useState } from "react";
import {
  getAmountsRemainder,
  getEffectiveSplitAmounts,
  getRoundingRemainder,
  resolveSplitAmounts,
  SplitRow,
} from "../helpers/expenseHelpers";
import useChangeSplitAmount from "./useChangeSplitAmount";

type RemainderInfo = ReturnType<typeof getRoundingRemainder>;

// Fills in "0" (formatted) for a member with no row — filtered out of
// "shares"'s persisted rows entirely when they have 0 shares. The absorber
// (if remainder > 0) shows the base share here; their extra is in
// toDisplayExtras, so their row explains why it differs from everyone else's.
function toDisplayAmounts(
  members: Member[],
  rows: SplitRow[],
  remainderInfo: RemainderInfo,
  symbol: string,
  decimalDigits: number,
): Record<string, string> {
  return Object.fromEntries(
    members.map((member) => {
      if (
        member.id === remainderInfo.absorberId &&
        remainderInfo.remainder > 0
      ) {
        return [
          member.id,
          formatDisplayAmount(remainderInfo.baseAmount, symbol, decimalDigits),
        ];
      }
      const row = rows.find((r) => r.memberId === member.id);
      return [
        member.id,
        formatDisplayAmount(row?.individualAmount ?? 0, symbol, decimalDigits),
      ];
    }),
  );
}

// Only the remainder's absorber has an extra: "+$0.01" after their share
function toDisplayExtras(
  remainderInfo: RemainderInfo,
  symbol: string,
  decimalDigits: number,
): Record<string, string> {
  if (remainderInfo.remainder <= 0) return {};
  return {
    [remainderInfo.absorberId]: `+${formatDisplayAmount(remainderInfo.remainder, symbol, decimalDigits)}`,
  };
}

function getEffectiveDisplayAmounts(
  splitMethod: "equally" | "shares",
  members: Member[],
  totalAmount: number,
  decimalDigits: number,
  selection: SplitSelection,
  paidByMemberId: string,
  symbol: string,
): { amounts: Record<string, string>; extras: Record<string, string> } {
  const remainderInfo = getRoundingRemainder(
    members,
    splitMethod,
    totalAmount,
    decimalDigits,
    selection,
    paidByMemberId,
  );
  return {
    amounts: toDisplayAmounts(
      members,
      resolveSplitAmounts(
        members,
        splitMethod,
        totalAmount,
        decimalDigits,
        selection,
        paidByMemberId,
      ),
      remainderInfo,
      symbol,
      decimalDigits,
    ),
    extras: toDisplayExtras(remainderInfo, symbol, decimalDigits),
  };
}

export default function useSplitBottomSheet() {
  const [query, setQuery] = useState<string>("");

  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);
  const onChangeSelected = useExpenseSheetStore((s) => s.setSelectedMemberIds);
  const selectMembers = useExpenseSheetStore((s) => s.selectMembers);
  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const selectedAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const selectedShares = useExpenseSheetStore((s) => s.splitShares);
  const onChangeShares = useExpenseSheetStore((s) => s.setSplitShares);
  const totalAmount = parseAmountInput(useExpenseSheetStore((s) => s.amount));
  const currency = useExpenseSheetStore((s) => s.currency);
  const members = useExpenseSheetStore((s) => s.members);
  const paidByMemberId = useExpenseSheetStore((s) => s.paidByMemberId);

  const { symbol, decimalDigits } = currency;

  // Hides rows only: selection, amounts and shares stay as they are (ADR 0010)
  const filteredMembers = useMemo(
    () => filterMembers(members, query),
    [members, query],
  );

  const selection: SplitSelection = useMemo(
    () => ({
      selectedMemberIds,
      splitAmounts: selectedAmounts,
      splitShares: selectedShares,
    }),
    [selectedMemberIds, selectedAmounts, selectedShares],
  );

  // Live-typed field — must stay the raw value, never remainder-adjusted.
  // why: encountered_errors_iv.md (2026-09-25).
  const effectiveAmounts = useMemo<Record<string, string>>(
    () =>
      getEffectiveSplitAmounts(
        members,
        selectedAmounts,
        selectedMemberIds,
        totalAmount,
        decimalDigits,
        paidByMemberId,
      ),
    [
      members,
      selectedAmounts,
      selectedMemberIds,
      totalAmount,
      decimalDigits,
      paidByMemberId,
    ],
  );

  // Read-only displays — safe to mirror resolveSplitAmounts exactly.
  // why: encountered_errors_iv.md (2026-09-25).
  const equallyDisplay = useMemo(
    () =>
      getEffectiveDisplayAmounts(
        "equally",
        members,
        totalAmount,
        decimalDigits,
        selection,
        paidByMemberId,
        symbol,
      ),
    [members, selection, totalAmount, decimalDigits, paidByMemberId, symbol],
  );

  const sharesDisplay = useMemo(
    () =>
      getEffectiveDisplayAmounts(
        "shares",
        members,
        totalAmount,
        decimalDigits,
        selection,
        paidByMemberId,
        symbol,
      ),
    [members, selection, totalAmount, decimalDigits, paidByMemberId, symbol],
  );

  // Every field turns red together once the typed amounts pass the total
  const isOverAssigned = useMemo(
    () =>
      getAmountsRemainder(
        members,
        selectedAmounts,
        selectedMemberIds,
        totalAmount,
        decimalDigits,
      ).remainder < 0,
    [members, selectedAmounts, selectedMemberIds, totalAmount, decimalDigits],
  );

  // A deselected member always reads as 0 shares, whatever's stored.
  const effectiveShares = useMemo<Record<string, number>>(
    () =>
      Object.fromEntries(
        members.map((member) => [
          member.id,
          selectedMemberIds.includes(member.id)
            ? (selectedShares[member.id] ?? 0)
            : 0,
        ]),
      ),
    [members, selectedMemberIds, selectedShares],
  );

  const deselectMember = (memberId: string) =>
    onChangeSelected(selectedMemberIds.filter((id) => id !== memberId));

  const handleToggleMember = (memberId: string) =>
    selectedMemberIds.includes(memberId)
      ? deselectMember(memberId)
      : selectMembers([memberId]);

  const handleChangeAmount = useChangeSplitAmount();

  // Stepping to 0 deselects; stepping up from deselected selects with the
  // 1 share selectMembers resets them to.
  const handleChangeShares = (memberId: string, delta: number) => {
    if (!selectedMemberIds.includes(memberId)) {
      if (delta > 0) selectMembers([memberId]);
      return;
    }

    const nextShares = Math.max(0, (selectedShares[memberId] ?? 0) + delta);
    onChangeShares({ ...selectedShares, [memberId]: nextShares });
    if (nextShares === 0) deselectMember(memberId);
  };

  return {
    query,
    setQuery,
    filteredMembers,
    // What each member actually typed (absent = auto-split); a number-pad
    // field's value, so typing never edits the auto figure
    typedAmounts: selectedAmounts,
    effectiveAmounts,
    effectiveEquallyAmounts: equallyDisplay.amounts,
    equallyExtras: equallyDisplay.extras,
    effectiveShareAmounts: sharesDisplay.amounts,
    shareExtras: sharesDisplay.extras,
    isOverAssigned,
    handleToggleMember,
    handleChangeAmount,
    handleChangeShares,
    splitMethod,
    currency,
    effectiveShares,
    selectedMemberIds,
    totalAmount,
    members,
  };
}
