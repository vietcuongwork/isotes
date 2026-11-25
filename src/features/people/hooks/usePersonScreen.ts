import { formatPersonNet } from "@/domain/tripFormat";
import {
  formatNetBadge,
  getPersonExpenses,
  getPersonSummaries,
} from "@/features/people/helpers/peopleHelpers";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { formatDisplayAmount } from "@/utils/currency";
import { formatShortDate } from "@/utils/date";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

export default function usePersonScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const members = useExpenseSheetStore((s) => s.members);
  const expenses = useExpenseSheetStore((s) => s.expenses);
  const currency = useExpenseSheetStore((s) => s.currency);
  const leavingRef = useRef(false); // Phase 2's footer sets it before its delete

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

  // No path reaches a missing person today; a removal sets leavingRef and navigates itself
  useEffect(() => {
    if (!person && !leavingRef.current) router.back();
  }, [person]);

  const net = person
    ? formatPersonNet({
        net: person.net,
        expenseCount: person.expenseCount,
        decimalDigits: currency.decimalDigits,
        symbol: currency.symbol,
        isOwner: person.isOwner,
      })
    : null;

  return {
    person,
    rows,
    badge: net ? formatNetBadge(net) : null,
    tone: net?.tone ?? "empty",
    leavingRef,
  };
}
