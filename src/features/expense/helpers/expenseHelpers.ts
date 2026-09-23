import { MemberRow, NewExpenseSplit, TripRow } from "@/db/schema";
import { CURRENCY_OPTIONS } from "@/features/createTrip/constants";
import { draftInitialState } from "@/stores/useExpenseSheetStore";
import { Trip } from "@/types/TCreateTrip";
import {
  Activity,
  ExpenseSheetErrors,
  Member,
  SplitMethod,
  SplitSelection,
} from "@/types/TExpense";
import {
  getAcceptableSplitGap,
  parseAmountInput,
  roundToDecimals,
} from "@/utils/currency";

export function transformTripRow(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    currency:
      CURRENCY_OPTIONS.find((c) => c.code === row.currencyCode) ??
      CURRENCY_OPTIONS[0],
    createdAt: row.createdAt,
  };
}

export function transformMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    tripId: row.tripId,
    name: row.name,
    isOwner: row.isOwner,
    memberColor: row.memberColor,
    createdAt: row.createdAt,
  };
}

export function getDefaultExpenseSplit(members: Member[]) {
  const owner = members.find((member) => member.isOwner) ?? members[0];
  return {
    paidByMemberId: owner.id,
    equallySelectedMemberIds: members.map((member) => member.id),
    splitShares: Object.fromEntries(members.map((member) => [member.id, 1])),
  };
}

// Unedited members default to an equal split of the total — same rule
// SplitSummary.tsx renders, kept here so validation and split-resolution
// can share it instead of re-deriving it.
export function getEffectiveSplitAmounts(
  members: Member[],
  splitAmounts: Record<string, string>,
  totalAmount: number,
  decimalDigits: number,
): Record<string, string> {
  const equalShare = (totalAmount / (members.length || 1)).toFixed(
    decimalDigits,
  );
  return Object.fromEntries(
    members.map((member) => [member.id, splitAmounts[member.id] ?? equalShare]),
  );
}

export function getIsDraftRestored(params: {
  amount: string;
  description: string;
  date: string;
  activity: Activity;
  splitMethod: SplitMethod;
  splitAmounts: Record<string, string>;
  paidByMemberId: string;
  equallySelectedMemberIds: string[];
  splitShares: Record<string, number>;
  members: Member[];
}): boolean {
  const {
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
  } = params;

  if (amount !== draftInitialState.amount) return true;
  if (description !== draftInitialState.description) return true;
  if (date !== draftInitialState.date) return true;
  if (activity.id !== draftInitialState.activity.id) return true;
  if (splitMethod !== draftInitialState.splitMethod) return true;
  if (Object.keys(splitAmounts).length > 0) return true;

  if (members.length === 0) return false;

  // paidByMemberId/equallySelectedMemberIds/splitShares get auto-seeded from
  // current members (getDefaultExpenseSplit) as soon as paidByMemberId is
  // empty — so by the time this runs, an untouched session may already be
  // seeded rather than blank. "Not edited" means the value is EITHER still
  // blank (not yet seeded) OR matches what seeding would currently produce —
  // only flag it once it's neither, i.e. the user actually changed it.
  const defaults = getDefaultExpenseSplit(members);

  const isPaidByEdited =
    paidByMemberId !== "" && paidByMemberId !== defaults.paidByMemberId;
  if (isPaidByEdited) return true;

  const isEquallySelectedEdited =
    equallySelectedMemberIds.length > 0 &&
    (equallySelectedMemberIds.length !== defaults.equallySelectedMemberIds.length ||
      !defaults.equallySelectedMemberIds.every((id) =>
        equallySelectedMemberIds.includes(id),
      ));
  if (isEquallySelectedEdited) return true;

  const isSplitSharesEdited =
    Object.keys(splitShares).length > 0 &&
    (Object.keys(splitShares).length !== Object.keys(defaults.splitShares).length ||
      Object.entries(defaults.splitShares).some(
        ([memberId, shares]) => splitShares[memberId] !== shares,
      ));
  if (isSplitSharesEdited) return true;

  return false;
}

export function validateExpenseSheet(params: {
  amount: string;
  paidByMemberId: string;
  splitMethod: SplitMethod;
  members: Member[];
  equallySelectedMemberIds: string[];
  splitAmounts: Record<string, string>;
  splitShares: Record<string, number>;
  decimalDigits: number;
}): ExpenseSheetErrors {
  const {
    amount,
    paidByMemberId,
    splitMethod,
    members,
    equallySelectedMemberIds,
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

  if (splitMethod === "equally") {
    if (equallySelectedMemberIds.length === 0) {
      errors.split = true;
    } else {
      const perPerson = roundToDecimals(
        totalAmount / equallySelectedMemberIds.length,
        decimalDigits,
      );
      const assignedTotal = perPerson * equallySelectedMemberIds.length;
      const gap = getAcceptableSplitGap(
        equallySelectedMemberIds.length,
        decimalDigits,
      );
      if (Math.abs(totalAmount - assignedTotal) > gap) errors.split = true;
    }
  } else if (splitMethod === "amounts") {
    const effectiveAmounts = getEffectiveSplitAmounts(
      members,
      splitAmounts,
      totalAmount,
      decimalDigits,
    );
    const assignedTotal = members.reduce(
      (sum, member) =>
        sum + parseAmountInput(effectiveAmounts[member.id] ?? "0"),
      0,
    );
    const gap = getAcceptableSplitGap(members.length, decimalDigits);
    if (Math.abs(totalAmount - assignedTotal) > gap) errors.split = true;
  } else {
    const participants = members.filter(
      (member) => (splitShares[member.id] ?? 0) > 0,
    );
    const totalShares = participants.reduce(
      (sum, member) => sum + (splitShares[member.id] ?? 0),
      0,
    );
    if (totalShares === 0) {
      errors.split = true;
    } else {
      const assignedTotal = participants.reduce((sum, member) => {
        const memberShares = splitShares[member.id] ?? 0;
        return (
          sum +
          roundToDecimals(
            (totalAmount * memberShares) / totalShares,
            decimalDigits,
          )
        );
      }, 0);
      const gap = getAcceptableSplitGap(participants.length, decimalDigits);
      if (Math.abs(totalAmount - assignedTotal) > gap) errors.split = true;
    }
  }

  return errors;
}



// Rounds each member's share to the currency's decimalDigits (nearest, not
// floor) — the sum of the returned splits can miss totalAmount by up to
// getAcceptableSplitGap's bound. Deliberate; see design_decisions.md
// "Equal/shares split rounds to nearest, tolerated via an acceptable
// rounding gap" (2026-09-23).
export function resolveSplitAmounts(
  members: Member[],
  splitMethod: SplitMethod,
  totalAmount: number,
  decimalDigits: number,
  selection: SplitSelection,
): Omit<NewExpenseSplit, "id" | "expenseId">[] {
  if (splitMethod === "amounts") {
    return members.map((member) => ({
      memberId: member.id,
      individualAmount: parseAmountInput(
        selection.splitAmounts[member.id] ?? "0",
      ),
      shares: null,
    }));
  }

  if (splitMethod === "shares") {
    const totalShares = members.reduce(
      (sum, member) => sum + (selection.splitShares[member.id] ?? 0),
      0,
    );
    return members
      .filter((member) => (selection.splitShares[member.id] ?? 0) > 0)
      .map((member) => {
        const memberShares = selection.splitShares[member.id] ?? 0;
        return {
          memberId: member.id,
          individualAmount: roundToDecimals(
            (totalAmount * memberShares) / (totalShares || 1),
            decimalDigits,
          ),
          shares: memberShares,
        };
      });
  }

  // "equally"
  const participants = members.filter((member) =>
    selection.equallySelectedMemberIds.includes(member.id),
  );
  const perPerson = roundToDecimals(
    totalAmount / (participants.length || 1),
    decimalDigits,
  );
  return participants.map((member) => ({
    memberId: member.id,
    individualAmount: perPerson,
    shares: null,
  }));
}
