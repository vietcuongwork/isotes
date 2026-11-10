import { DeleteMemberResult, deleteMember } from "@/db/members";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useState } from "react";

export default function useRemovePerson() {
  const removeMemberFromDraft = useExpenseSheetStore(
    (state) => state.removeMemberFromDraft,
  );
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());

  const unhide = (memberId: string) =>
    setHiddenIds((ids) => {
      const next = new Set(ids);
      next.delete(memberId);
      return next;
    });

  const removePerson = async (
    memberId: string,
    ownerId: string,
  ): Promise<DeleteMemberResult> => {
    setHiddenIds((ids) => new Set(ids).add(memberId)); // hidden at once; stays hidden on success
    try {
      const result = await deleteMember(memberId);
      if (__DEV__ && result.kind === "not-found") {
        console.warn("[useRemovePerson] member already gone", memberId);
      }
      removeMemberFromDraft(memberId, ownerId);
      return result; // Phase 4 shows the toast on "removed"
    } catch (error) {
      unhide(memberId);
      throw error; // logs in dev as an unhandled rejection, like insertMember's callers
    }
  };

  return { hiddenIds, removePerson, unhide }; // Undo unhides after a restore (Phase 4)
}
