import { DeleteMemberResult, deleteMember } from "@/db/members";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { useRemovedPersonStore } from "@/stores/useRemovedPersonStore";

// Every removal, swipe or footer: delete, clean the draft, hand the person to People's toast
export default function useDeletePerson() {
  const removeMemberFromDraft = useExpenseSheetStore(
    (state) => state.removeMemberFromDraft,
  );

  return async (
    memberId: string,
    ownerId: string,
  ): Promise<DeleteMemberResult> => {
    const epoch = useRemovedPersonStore.getState().epoch; // read before the await
    const result = await deleteMember(memberId); // a throw reaches the caller untouched
    if (__DEV__ && result.kind === "not-found") {
      console.warn("[useDeletePerson] member already gone", memberId);
    }
    removeMemberFromDraft(memberId, ownerId); // gone either way, so the draft drops them
    const { epoch: now, setRemoved } = useRemovedPersonStore.getState();
    if (result.kind === "removed" && epoch === now) setRemoved(result.member); // Add person or leaving People meanwhile: no toast
    return result;
  };
}
