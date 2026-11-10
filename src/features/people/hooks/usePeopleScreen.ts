import {
  canRemovePerson,
  getPersonSummaries,
} from "@/features/people/helpers/peopleHelpers";
import useRemovePerson from "@/features/people/hooks/useRemovePerson";
import useUndoToast from "@/features/people/hooks/useUndoToast";
import { restoreMember } from "@/db/members";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useMemo, useState } from "react";

export default function usePeopleScreen() {
  const tripName = useExpenseSheetStore((s) => s.tripName);
  const members = useExpenseSheetStore((s) => s.members);
  const expenses = useExpenseSheetStore((s) => s.expenses);
  const currency = useExpenseSheetStore((s) => s.currency);

  const { hiddenIds, removePerson, unhide } = useRemovePerson();
  const { removed, showToast, dismissToast, takeForUndo } = useUndoToast();
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

  const handleRemove = async (memberId: string) => {
    setOpenRowId(null);
    const member = members.find((m) => m.id === memberId); // copied now: trip home's query drops it after the delete
    if (!member) return;
    const result = await removePerson(memberId, ownerId); // a throw logs in dev, like insertMember's callers
    if (result.kind === "removed") showToast(member);
  };

  const handleUndo = async () => {
    const member = takeForUndo(); // null on a second tap
    if (!member) return;
    await restoreMember(member);
    unhide(member.id); // a failed restore throws first, so the person stays gone
  };

  const handleAddPersonPress = () => {
    setOpenRowId(null);
    dismissToast(); // opening Add person ends the toast
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
    removed,
    handleUndo,
    handleAddPersonPress,
  };
}
