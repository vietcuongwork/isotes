import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
import { insertExpenseWithSplits } from "@/db/expenses";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { parseAmountInput } from "@/utils/currency";
import { toDateId } from "@marceloterreiro/flash-calendar";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getIsDraftRestored,
  resolveSplitAmounts,
  validateExpenseSheet,
} from "../helpers/expenseHelpers";

const today = toDateId(new Date());

export default function useAddExpenseBottomSheet() {
  const [isActivityPickerOpen, setActivityPickerOpen] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const { bottom } = useSafeAreaInsets();
  const safeBottomStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);
  const { pushSheet, popSheet } = useBottomSheetStack();

  const members = useExpenseSheetStore((s) => s.members);
  const paidByMemberId = useExpenseSheetStore((s) => s.paidByMemberId);

  const amount = useExpenseSheetStore((s) => s.amount);
  const description = useExpenseSheetStore((s) => s.description);
  const date = useExpenseSheetStore((s) => s.date);
  const activity = useExpenseSheetStore((s) => s.activity);
  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const equallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.equallySelectedMemberIds,
  );
  const splitAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const currency = useExpenseSheetStore((s) => s.currency);
  const resetDraft = useExpenseSheetStore((s) => s.resetDraft);

  // Captured once, at mount, via a lazy initializer — re-evaluating this on
  // every render would flip it true the instant the user types anything in
  // the CURRENT session, showing "picked up where you left off" on a
  // session that never left anything. See getIsDraftRestored for why the
  // comparison itself isn't a simple blank check.
  const [isDraftRestored] = useState(() =>
    getIsDraftRestored({
      amount,
      description,
      date,
      activity,
      splitMethod,
      splitAmounts,
      paidByMemberId,
      equallySelectedMemberIds,
      splitShares,
      members,
    }),
  );
  const [isStartOverDialogOpen, setStartOverDialogOpen] = useState(false);

  const errors = validateExpenseSheet({
    amount,
    paidByMemberId,
    splitMethod,
    members,
    equallySelectedMemberIds,
    splitAmounts,
    splitShares,
    decimalDigits: currency.decimalDigits,
  });

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    if (Object.values(errors).some(Boolean)) return;

    const tripId = members[0]?.tripId;
    if (!tripId) return;

    const totalAmount = parseAmountInput(amount);
    const splits = resolveSplitAmounts(
      members,
      splitMethod,
      totalAmount,
      currency.decimalDigits,
      { equallySelectedMemberIds, splitAmounts, splitShares },
    );

    await insertExpenseWithSplits(
      {
        tripId,
        paidByMemberId,
        amount: totalAmount,
        description: description || null,
        activityId: activity.id,
        date,
        splitMethod,
      },
      splits,
    );
    resetDraft();
    popSheet();
  };

  const handleStartOver = () => setStartOverDialogOpen(true);
  const handleCancelStartOver = () => setStartOverDialogOpen(false);
  const handleConfirmStartOver = () => {
    resetDraft();
    setStartOverDialogOpen(false);
  };

  return {
    today,
    isActivityPickerOpen,
    setActivityPickerOpen,
    safeBottomStyle,
    pushSheet,
    popSheet,
    handleSubmit,
    amountError: hasAttemptedSubmit && errors.amount,
    isDraftRestored,
    isStartOverDialogOpen,
    handleStartOver,
    handleCancelStartOver,
    handleConfirmStartOver,
  };
}
