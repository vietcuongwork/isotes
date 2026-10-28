import { Member } from "@/types/TExpense";
import { foldForSearch } from "@/utils/text";

// A blank query folds to "", which every name contains, so it keeps everyone
export function filterMembers(members: Member[], query: string): Member[] {
  const folded = foldForSearch(query);
  return members.filter((member) =>
    foldForSearch(member.name).includes(folded),
  );
}
