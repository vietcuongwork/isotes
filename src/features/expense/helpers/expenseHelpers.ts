import { NewExpenseSplit } from "@/db/schema";
import { getDefaultExpenseSplit } from "@/domain/defaultSplit";
import { draftInitialState } from "@/stores/useExpenseSheetStore";
import {
  ExpenseDraft,
  ExpenseSheetErrors,
  Member,
  SplitMethod,
  SplitSelection,
} from "@/types/TExpense";
import {
  floorToDecimals,
  parseAmountInput,
  roundToDecimals,
} from "@/utils/currency";

// Minimal shape shared by every split-row computation below — a narrowing of
// Omit<NewExpenseSplit, "id" | "expenseId">, which additionally carries
// `shares`. Named so distributeRemainderToPayer's generic bound and
// computeSplitRows's return type both point at one definition instead of
// repeating the object-literal shape.
export type SplitRow = { memberId: string; individualAmount: number };

// Splits selected "amounts" members into explicit (typed, incl. "0") vs
// auto (no key), and what's left of totalAmount after explicit entries.
// Shared by getEffectiveSplitAmounts and SplitSummary.tsx so both agree on
// the same split. See design_decisions.md "Amounts split validates against
// an exact sum" (2026-09-25).
export function getAmountsRemainder(
  members: Member[],
  splitAmounts: Record<string, string>,
  selectedMemberIds: string[],
  totalAmount: number,
  decimalDigits: number,
): { remainder: number; autoMembers: Member[] } {
  const selected = members.filter((member) =>
    selectedMemberIds.includes(member.id),
  );
  const explicitSum = selected.reduce((sum, member) => {
    const entered = splitAmounts[member.id];
    return entered === undefined ? sum : sum + parseAmountInput(entered);
  }, 0);
  const autoMembers = selected.filter(
    (member) => splitAmounts[member.id] === undefined,
  );

  return {
    remainder: roundToDecimals(totalAmount - explicitSum, decimalDigits),
    autoMembers,
  };
}

// Who absorbs "equally"/"shares" rounding drift and by how much, for
// display (SplitSummary.tsx, useSplitBottomSheet.ts) — resolveSplitAmounts
// itself only needs the final rows, not this. `remainder` is always >= 0
// (floorToDecimals in computeSplitRows guarantees it). See
// design_decisions.md "Equally/shares base amounts floor, not round"
// (2026-09-27).
export function getRoundingRemainder(
  members: Member[],
  splitMethod: "equally" | "shares",
  totalAmount: number,
  decimalDigits: number,
  selection: SplitSelection,
  paidByMemberId: string,
): { absorberId: string; baseAmount: number; remainder: number } {
  const rows = computeSplitRows(
    members,
    splitMethod,
    totalAmount,
    decimalDigits,
    selection,
    paidByMemberId,
  );
  const { remainder, absorberId } = distributeRemainderToPayer(
    rows,
    totalAmount,
    paidByMemberId,
    decimalDigits,
  );
  const baseAmount =
    rows.find((row) => row.memberId === absorberId)?.individualAmount ?? 0;
  return { absorberId, baseAmount, remainder };
}

// Explicit entries stay as typed. Auto members split what's left evenly,
// remainder to the payer — clamped to 0 first so an over-total entry shows
// $0 rather than a negative amount rendered without its sign. See
// design_decisions.md "Amounts split validates against an exact sum"
// (2026-09-25).
export function getEffectiveSplitAmounts(
  members: Member[],
  splitAmounts: Record<string, string>,
  selectedMemberIds: string[],
  totalAmount: number,
  decimalDigits: number,
  paidByMemberId: string,
): Record<string, string> {
  const { remainder, autoMembers } = getAmountsRemainder(
    members,
    splitAmounts,
    selectedMemberIds,
    totalAmount,
    decimalDigits,
  );
  // Deselected members get "" so AmountsInput shows its placeholder.
  const deselectedEntries = members
    .filter((member) => !selectedMemberIds.includes(member.id))
    .map((member): [string, string] => [member.id, ""]);
  const explicitEntries = members
    .filter(
      (member) =>
        selectedMemberIds.includes(member.id) &&
        splitAmounts[member.id] !== undefined,
    )
    .map((member): [string, string] => [member.id, splitAmounts[member.id]]);

  if (autoMembers.length === 0) {
    return Object.fromEntries([...deselectedEntries, ...explicitEntries]);
  }

  const distributable = Math.max(remainder, 0);
  const baseRows = autoMembers.map((member) => ({
    memberId: member.id,
    individualAmount: floorToDecimals(
      distributable / autoMembers.length,
      decimalDigits,
    ),
  }));
  const resolvedAutoRows = distributeRemainderToPayer(
    baseRows,
    distributable,
    paidByMemberId,
    decimalDigits,
  ).rows;

  return Object.fromEntries([
    ...deselectedEntries,
    ...explicitEntries,
    ...resolvedAutoRows.map((row): [string, string] => [
      row.memberId,
      row.individualAmount.toFixed(decimalDigits),
    ]),
  ]);
}

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

// Per-split-method row math (perPerson rounding for "equally", weighted
// rounding for "shares", entered/effective amounts for "amounts") — the one
// piece validateExpenseSheet and resolveSplitAmounts both need, so it's
// computed here once instead of each function re-deriving it independently.
// `shares` is always present (null for "equally"/"amounts") so the result
// already matches resolveSplitAmounts's persisted row shape.
function computeSplitRows(
  members: Member[],
  splitMethod: SplitMethod,
  totalAmount: number,
  decimalDigits: number,
  selection: SplitSelection,
  paidByMemberId: string,
): (SplitRow & { shares: number | null })[] {
  if (splitMethod === "amounts") {
    const effectiveAmounts = getEffectiveSplitAmounts(
      members,
      selection.splitAmounts,
      selection.selectedMemberIds,
      totalAmount,
      decimalDigits,
      paidByMemberId,
    );
    return members
      .filter((member) => selection.selectedMemberIds.includes(member.id))
      .map((member) => ({
        memberId: member.id,
        individualAmount: parseAmountInput(effectiveAmounts[member.id] ?? "0"),
        shares: null,
      }));
  }

  if (splitMethod === "shares") {
    // Selected AND > 0 shares: the store keeps a selected member at >= 1
    // share, so the > 0 check is only a guard against a stale zero.
    const participants = members.filter(
      (member) =>
        selection.selectedMemberIds.includes(member.id) &&
        (selection.splitShares[member.id] ?? 0) > 0,
    );
    const totalShares = participants.reduce(
      (sum, member) => sum + (selection.splitShares[member.id] ?? 0),
      0,
    );
    return participants.map((member) => {
      const memberShares = selection.splitShares[member.id] ?? 0;
      return {
        memberId: member.id,
        individualAmount: floorToDecimals(
          (totalAmount * memberShares) / (totalShares || 1),
          decimalDigits,
        ),
        shares: memberShares,
      };
    });
  }

  // "equally"
  const participants = members.filter((member) =>
    selection.selectedMemberIds.includes(member.id),
  );
  const perPerson = floorToDecimals(
    totalAmount / (participants.length || 1),
    decimalDigits,
  );
  return participants.map((member) => ({
    memberId: member.id,
    individualAmount: perPerson,
    shares: null,
  }));
}

// Adds any total-vs-assigned remainder onto a given row so the rows it's
// handed sum exactly to the totalAmount passed in. Falls back to the first
// row in list order if paidByMemberId doesn't match any row (e.g. deselected
// from "equally", 0 shares, or already has an explicit "amounts" entry).
//
// Two callers, two different scopes: resolveSplitAmounts uses it over the
// whole row set for "equally"/"shares" (pure rounding drift — there's no
// per-member typed input for those methods); getEffectiveSplitAmounts uses
// it only over the "amounts" auto/fallback pool, against `remainder`
// (totalAmount minus explicit entries), never the whole split — see
// design_decisions.md "Amounts split validates against an exact sum" and its
// superseded "Split rounding/leftover is assigned to the payer" (2026-09-25)
// entry.
export function distributeRemainderToPayer<T extends SplitRow>(
  rows: T[],
  totalAmount: number,
  paidByMemberId: string,
  decimalDigits: number,
): {
  rows: T[];
  remainder: number;
  absorberId: string;
  absorberFinal: number;
  wouldGoNegative: boolean;
} {
  if (rows.length === 0) {
    return {
      rows,
      remainder: totalAmount,
      absorberId: "",
      absorberFinal: 0,
      wouldGoNegative: false,
    };
  }

  const assignedTotal = rows.reduce(
    (sum, row) => sum + row.individualAmount,
    0,
  );
  const remainder = roundToDecimals(totalAmount - assignedTotal, decimalDigits);
  const absorberIndex = rows.findIndex(
    (row) => row.memberId === paidByMemberId,
  );
  const index = absorberIndex === -1 ? 0 : absorberIndex;
  const absorberFinal = roundToDecimals(
    rows[index].individualAmount + remainder,
    decimalDigits,
  );

  return {
    rows:
      remainder === 0
        ? rows
        : rows.map((row, i) =>
            i === index ? { ...row, individualAmount: absorberFinal } : row,
          ),
    remainder,
    absorberId: rows[index].memberId,
    absorberFinal,
    wouldGoNegative: absorberFinal < 0,
  };
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

// "equally"/"shares" amounts floor to the currency's decimalDigits and the
// payer absorbs the leftover (distributeRemainderToPayer), so persisted splits
// sum exactly to totalAmount. See design_decisions.md "Equally/shares base
// amounts floor, not round" (2026-09-27).
export function resolveSplitAmounts(
  members: Member[],
  splitMethod: SplitMethod,
  totalAmount: number,
  decimalDigits: number,
  selection: SplitSelection,
  paidByMemberId: string,
): Omit<NewExpenseSplit, "id" | "expenseId">[] {
  const rows = computeSplitRows(
    members,
    splitMethod,
    totalAmount,
    decimalDigits,
    selection,
    paidByMemberId,
  );
  // "amounts" already resolves its own remainder inside the auto-member
  // pool (getEffectiveSplitAmounts) — running distributeRemainderToPayer
  // again over the whole row set here would also touch explicit entries.
  if (splitMethod === "amounts") return rows;
  return distributeRemainderToPayer(
    rows,
    totalAmount,
    paidByMemberId,
    decimalDigits,
  ).rows;
}
