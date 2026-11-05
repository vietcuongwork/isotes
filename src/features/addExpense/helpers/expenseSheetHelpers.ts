import { getDefaultExpenseSplit } from "@/domain/defaultSplit";
import { resolveSplitAmounts } from "@/features/addExpense/split/helpers/splitHelpers";
import { draftInitialState } from "@/stores/useExpenseSheetStore";
import {
  ExpenseDraft,
  ExpenseSheetErrors,
  Member,
  SplitSelection,
} from "@/types/TExpense";
import { parseAmountInput, roundToDecimals } from "@/utils/currency";

export function getIsDraftRestored(
  params: ExpenseDraft & { members: Member[] },
): boolean {
  const {
    amount,
    description,
    date,
    activity,
    splitMethod,
    splitAmounts,
    paidByMemberId,
    selectedMemberIds,
    splitShares,
    members,
  } = params;

  if (amount !== draftInitialState.amount) return true;
  if (description !== draftInitialState.description) return true;
  if (date !== draftInitialState.date) return true;
  if (activity.id !== draftInitialState.activity.id) return true;
  if (splitMethod !== draftInitialState.splitMethod) return true;
  if (Object.keys(splitAmounts).length > 0) return true;

  // paidByMemberId/selectedMemberIds/splitShares get auto-seeded from
  // current members (getDefaultExpenseSplit) as soon as paidByMemberId is
  // empty — so by the time this runs, an untouched session may already be
  // seeded rather than blank. "Not edited" means the value is EITHER still
  // blank (not yet seeded) OR matches what seeding would currently produce —
  // only flag it once it's neither, i.e. the user actually changed it.
  const defaults = getDefaultExpenseSplit(members);

  if (paidByMemberId !== defaults.paidByMemberId) return true;

  const isEquallySelectedEdited =
    selectedMemberIds.length !== defaults.selectedMemberIds.length ||
    !defaults.selectedMemberIds.every((id) => selectedMemberIds.includes(id));
  if (isEquallySelectedEdited) return true;

  const isSplitSharesEdited =
    Object.keys(splitShares).length !==
      Object.keys(defaults.splitShares).length ||
    Object.entries(defaults.splitShares).some(
      ([memberId, shares]) => splitShares[memberId] !== shares,
    );
  if (isSplitSharesEdited) return true;

  return false;
}

export function validateExpenseSheet(
  params: Pick<
    ExpenseDraft,
    | "amount"
    | "paidByMemberId"
    | "splitMethod"
    | "selectedMemberIds"
    | "splitAmounts"
    | "splitShares"
  > & { members: Member[]; decimalDigits: number },
): ExpenseSheetErrors {
  const {
    amount,
    paidByMemberId,
    splitMethod,
    members,
    selectedMemberIds,
    splitAmounts,
    splitShares,
    decimalDigits,
  } = params;

  const totalAmount = parseAmountInput(amount);
  const errors: ExpenseSheetErrors = {
    amount: false,
    paidByMemberId: false,
    split: false,
  };

  if (totalAmount <= 0) errors.amount = true;
  if (!paidByMemberId) errors.paidByMemberId = true;

  const selection: SplitSelection = {
    selectedMemberIds,
    splitAmounts,
    splitShares,
  };

  if (selectedMemberIds.length === 0) {
    errors.split = true;
  } else {
    const rows = resolveSplitAmounts(
      members,
      splitMethod,
      totalAmount,
      decimalDigits,
      selection,
      paidByMemberId,
    );
    const sum = roundToDecimals(
      rows.reduce((total, row) => total + row.individualAmount, 0),
      decimalDigits,
    );
    const sumMismatch = roundToDecimals(sum - totalAmount, decimalDigits) !== 0;
    const hasNegativeRow = rows.some((row) => row.individualAmount < 0);
    if (sumMismatch || hasNegativeRow) errors.split = true;
  }

  return errors;
}
