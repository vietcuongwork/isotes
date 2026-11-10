import {
  canRemovePerson,
  getPersonSummaries,
} from "@/features/people/helpers/peopleHelpers";
import useRemovePerson from "@/features/people/hooks/useRemovePerson";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useMemo, useState } from "react";

export default function usePeopleScreen() {
  const tripName = useExpenseSheetStore((s) => s.tripName);
  const members = useExpenseSheetStore((s) => s.members);
  const expenses = useExpenseSheetStore((s) => s.expenses);
  const currency = useExpenseSheetStore((s) => s.currency);

  const { hiddenIds, removePerson } = useRemovePerson();
  const ownerId = members.find((member) => member.isOwner)?.id ?? "";

  const summaries = useMemo(
    () =>
      getPersonSummaries(members, expenses).filter(
        (person) => !hiddenIds.has(person.id),
      ),
    [members, expenses, hiddenIds],
  );

  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const handleOpenChange = (memberId: string, open: boolean) => {
    if (open) setOpenRowId(memberId);
    else setOpenRowId((current) => (current === memberId ? null : current));
  };

  const closeOpenRow = () => setOpenRowId(null);

  const handleRemove = (memberId: string) => {
    setOpenRowId(null);
    void removePerson(memberId, ownerId); // a throw logs in dev, like insertMember's callers
  };

  const showSwipeHint = summaries.some(canRemovePerson);

  return {
    tripName,
    summaries,
    currency,
    openRowId,
    handleOpenChange,
    closeOpenRow,
    showSwipeHint,
    handleRemove,
  };
}
