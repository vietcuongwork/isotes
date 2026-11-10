import { getPersonSummaries } from "@/features/people/helpers/peopleHelpers";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useMemo } from "react";

export default function usePeopleScreen() {
  const tripName = useExpenseSheetStore((s) => s.tripName);
  const members = useExpenseSheetStore((s) => s.members);
  const expenses = useExpenseSheetStore((s) => s.expenses);
  const currency = useExpenseSheetStore((s) => s.currency);

  const summaries = useMemo(
    () => getPersonSummaries(members, expenses),
    [members, expenses],
  );

  return { tripName, summaries, currency };
}
