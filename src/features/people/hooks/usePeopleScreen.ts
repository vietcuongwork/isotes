import {
  canRemovePerson,
  getPersonSummaries,
} from "@/features/people/helpers/peopleHelpers";
import useDeletePerson from "@/features/people/hooks/useDeletePerson";
import useUndoToast from "@/features/people/hooks/useUndoToast";
import { restoreMember } from "@/db/members";
import { getOwnerId } from "@/domain/memberHelpers";
import { EXPO_ROUTER } from "@/navigation/route";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";

export default function usePeopleScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const tripName = useExpenseSheetStore((s) => s.tripName);
  const members = useExpenseSheetStore((s) => s.members);
  const expenses = useExpenseSheetStore((s) => s.expenses);
  const currency = useExpenseSheetStore((s) => s.currency);
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const deletePerson = useDeletePerson();
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const { removed, dismissToast, takeForUndo } = useUndoToast();
  const summaries = useMemo(
    () =>
      getPersonSummaries(members, expenses).filter(
        (person) => !hiddenIds.has(person.id),
      ),
    [members, expenses, hiddenIds],
  );

  const ownerId = getOwnerId(members);
  const showSwipeHint = summaries.some(canRemovePerson);

  const unhide = (memberId: string) =>
    setHiddenIds((ids) => {
      const next = new Set(ids);
      next.delete(memberId);
      return next;
    });

  const handleOpenChange = (memberId: string, open: boolean) => {
    if (open) setOpenRowId(memberId);
    else setOpenRowId((current) => (current === memberId ? null : current));
  };

  const closeOpenRow = () => setOpenRowId(null);

  const handleRowPress = (memberId: string) => {
    if (openRowId !== null) {
      setOpenRowId(null); // a tap with a row open only closes it
      return;
    }
    router.push(EXPO_ROUTER.PERSON(tripId, memberId));
  };

  const handleRemove = async (memberId: string) => {
    setOpenRowId(null);
    setHiddenIds((ids) => new Set(ids).add(memberId)); // the swipe hides at once; stays hidden on success
    try {
      await deletePerson(memberId, ownerId); // sets the toast's person on success
    } catch (error) {
      unhide(memberId); // the row comes back in its old place
      throw error; // logs in dev as an unhandled rejection, like insertMember's callers
    }
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

  return {
    tripName,
    summaries,
    currency,
    openRowId,
    handleOpenChange,
    closeOpenRow,
    handleRowPress,
    showSwipeHint,
    handleRemove,
    removed,
    handleUndo,
    handleAddPersonPress,
  };
}
