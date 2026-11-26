import { formatPersonNet } from "@/domain/tripFormat";
import {
  canRemovePerson,
  formatNetBadge,
  getPersonExpenses,
  getPersonSummaries,
} from "@/features/people/helpers/peopleHelpers";
import useDeletePerson from "@/features/people/hooks/useDeletePerson";
import { EXPO_ROUTER } from "@/navigation/route";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { formatDisplayAmount } from "@/utils/currency";
import { formatShortDate } from "@/utils/date";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

export default function usePersonScreen() {
  const { tripId, memberId } = useLocalSearchParams<{
    tripId: string;
    memberId: string;
  }>();
  const members = useExpenseSheetStore((s) => s.members);
  const expenses = useExpenseSheetStore((s) => s.expenses);
  const currency = useExpenseSheetStore((s) => s.currency);
  const deletePerson = useDeletePerson();
  const leavingRef = useRef(false); // the footer sets it before its delete

  const person = useMemo(
    () => getPersonSummaries(members, expenses).find((p) => p.id === memberId),
    [members, expenses, memberId],
  );
  const rows = useMemo(() => {
    const now = new Date();
    return getPersonExpenses(memberId, expenses).map((expense) => {
      const payer = members.find((m) => m.id === expense.paidByMemberId);
      const payerText = payer?.isOwner
        ? "You paid"
        : `${payer?.name ?? ""} paid`;
      return {
        id: expense.id,
        title: expense.description || expense.activity.label,
        meta: `${payerText} · ${formatShortDate(expense.date, now)}`,
        share: formatDisplayAmount(
          expense.share,
          currency.symbol,
          currency.decimalDigits,
        ),
      };
    });
  }, [memberId, expenses, members, currency]);

  const net = person
    ? formatPersonNet({
        net: person.net,
        expenseCount: person.expenseCount,
        decimalDigits: currency.decimalDigits,
        symbol: currency.symbol,
        isOwner: person.isOwner,
      })
    : null;

  const ownerId = members.find((m) => m.isOwner)?.id ?? "";

  const handleRemove = async () => {
    leavingRef.current = true; // the live query will drop them; the missing-person effect must not go back too
    try {
      await deletePerson(memberId, ownerId); // sets the toast's person on success; "not-found" sets nothing
      router.dismissTo(EXPO_ROUTER.PEOPLE(tripId));
    } catch (error) {
      leavingRef.current = false; // spec: the screen stays, the error logs in dev
      throw error;
    }
  };

  // No path reaches a missing person today; a removal sets leavingRef and navigates itself
  useEffect(() => {
    if (!person && !leavingRef.current) router.back();
  }, [person]);

  return {
    person,
    rows,
    badge: net ? formatNetBadge(net) : null,
    tone: net?.tone ?? "empty",
    handleRemove,
    canRemove: person !== undefined && canRemovePerson(person),
    hasFooter: person !== undefined && !person.isOwner,
  };
}
