import { findMemberByName } from "@/domain/addPersonHelpers";
import { useAddPersonStore } from "@/stores/useAddPersonStore";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { sanitizeNameInput } from "@/utils/utils";
import { UserPlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import AddPersonBottomSheet from "./AddPersonBottomSheet";

interface AddPersonProps {
  /** The roster search; a non-blank query turns the label into Add “{query}” */
  query?: string;
  /** Merged last onto the row, for a screen that draws it at another size */
  rowClassName?: string;
  /** Runs before the sheet opens, e.g. to close a swiped row */
  onPress?: () => void;
}

export default function AddPerson(props: AddPersonProps) {
  const { query = "", rowClassName, onPress } = props;
  const [isOpen, setOpen] = useState(false);

  const setName = useAddPersonStore((s) => s.setName);
  const members = useExpenseSheetStore((s) => s.members);

  const prefill = sanitizeNameInput(query.trim());
  // An exact match offers the plain row: prefilling a duplicate would open the sheet already blocked
  const isExactMatch = findMemberByName(members, prefill) !== undefined;
  const name = isExactMatch ? "" : query.trim();

  // A one-off write, not a derived value: deriving the name from the query would make typing snap back
  const handlePress = () => {
    onPress?.();
    if (name) setName(prefill);
    setOpen(true);
  };

  return (
    <>
      <View className="gap-space-2">
        {/* //NOTE - no token for the 56pt row height and the 1.5pt dashed border, falling back to min-h-[56px] and border-[1.5px] */}
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          className={cn(
            "min-h-[56px] flex-row items-center gap-space-3 rounded-md border-[1.5px] border-dashed border-ink-200 px-space-3",
            rowClassName,
          )}
        >
          <UserPlus size={20} strokeWidth={1.75} color={colors.ink[900]} />
          <Text className="flex-1 text-ink-900 text-amount" numberOfLines={1}>
            {name ? `Add “${name}”` : "Add person"}
          </Text>
        </Pressable>
        {name !== "" && (
          <Text className="text-ink-500 text-caption">
            Added people join the trip, not just this expense.
          </Text>
        )}
      </View>
      {/* A sibling, not a child: touches inside a Modal still bubble through its
          React parents, so inside the Pressable they would re-press the button */}
      <AddPersonBottomSheet visible={isOpen} onClose={() => setOpen(false)} />
    </>
  );
}
