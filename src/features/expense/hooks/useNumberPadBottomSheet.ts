import { NumPadKey } from "@/components/numberpad/NumberPad";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { formatAmountInput } from "@/utils/currency";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useChangeSplitAmount from "./useChangeSplitAmount";

export type NumberPadTarget = "expenseAmount" | "activeSplitMember";

interface UseNumberPadBottomSheetProps {
  // What the keys edit: the expense total, or whichever member is active in
  // Split → Amounts — read from the store, so switching members needs no re-push
  target: NumberPadTarget;
}

// Reads/writes the expense-draft store directly (never via a prop) — a value
// passed as a prop into a pushed sheet is frozen at push time (see
// BottomSheetStack's pushSheet), so every keystroke would start over from
// whatever the field held the moment the sheet opened. See discussion in
// chat (2026-09-27).
export default function useNumberPadBottomSheet(
  props: UseNumberPadBottomSheetProps,
) {
  const { target } = props;

  const currency = useExpenseSheetStore((s) => s.currency);
  const draftAmount = useExpenseSheetStore((s) => s.amount);
  const setDraftAmount = useExpenseSheetStore((s) => s.setAmount);
  const splitAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const activeSplitMemberId = useExpenseSheetStore(
    (s) => s.activeSplitMemberId,
  );
  const changeSplitAmount = useChangeSplitAmount();

  const decimalDigits = currency?.decimalDigits;
  const splitMemberId =
    target === "activeSplitMember" ? activeSplitMemberId : null;
  // The member's raw typed value, not the auto-calculated display amount —
  // typing always builds a fresh explicit value, never appends onto an
  // auto-split placeholder.
  const amount = splitMemberId
    ? (splitAmounts[splitMemberId] ?? "")
    : draftAmount;

  function handleKeyPress(key: NumPadKey) {
    // Split target with no active member: nothing to write to — never fall
    // back to editing the expense total
    if (target === "activeSplitMember" && !splitMemberId) return;

    const raw = amount.replace(/,/g, "");
    const nextRaw = key === "backspace" ? raw.slice(0, -1) : raw + key;
    const next = formatAmountInput(nextRaw, decimalDigits);

    if (splitMemberId) {
      changeSplitAmount(splitMemberId, next);
    } else {
      setDraftAmount(next);
    }
  }

  const { bottom } = useSafeAreaInsets();
  const safeBottomStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);

  return { handleKeyPress, safeBottomStyle };
}
