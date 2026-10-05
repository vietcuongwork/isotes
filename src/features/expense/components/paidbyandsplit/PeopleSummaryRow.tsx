import Avatar from "@/components/Avatar";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { ChevronRight } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

const DEFAULT_MAX_VISIBLE = 3;
interface PeopleSummaryRowProps {
  maxVisible?: number;
  onPress: () => void;
}
export default function PeopleSummaryRow(
  props: PeopleSummaryRowProps,
): ReactElement {
  const { maxVisible, onPress } = props;
  const members = useExpenseSheetStore((s) => s.members);
  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);

  const displayMembers = members.filter((member) =>
    selectedMemberIds.includes(member.id),
  );

  const label =
    displayMembers.length === members.length
      ? `${members.length} people`
      : displayMembers.length === 0
        ? "Nobody selected"
        : `${displayMembers.length} of ${members.length} people`;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-btn bg-grey-950 px-3.5 py-2.5"
    >
      <View className="flex-row items-center gap-2.5">
        <Avatar.Stack
          members={displayMembers}
          maxVisible={maxVisible ?? DEFAULT_MAX_VISIBLE}
        />
        <Text
          className={cn(
            "text-grey-50 text-body-medium-flat",
            displayMembers.length === 0 && "text-red-400",
          )}
        >
          {label}
        </Text>
      </View>

      <ChevronRight size={18} color={colors.grey[500]} />
    </Pressable>
  );
}
