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
      return result; // the caller offers Undo only on "removed": a "not-found" row has nothing to restore
    } catch (error) {
      unhide(memberId);
      throw error; // logs in dev as an unhandled rejection, like insertMember's callers
    }
  };

  return { hiddenIds, removePerson, unhide }; // Undo calls unhide after its restore succeeds, so a failed restore leaves the row hidden
}
