import TripAvatarStack from "@/features/trips/components/TripAvatarStack";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { ChevronRight } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, Text } from "react-native";

interface PeopleSummaryRowProps {
  onPress: () => void;
}
export default function PeopleSummaryRow(
  props: PeopleSummaryRowProps,
): ReactElement {
  const { onPress } = props;
  const members = useExpenseSheetStore((s) => s.members);
  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);

  const displayMembers = members.filter((member) =>
    selectedMemberIds.includes(member.id),
  );

  const label =
    displayMembers.length === 0
      ? "Nobody selected"
      : members.length === 1
        ? "Just you"
        : displayMembers.length === members.length
          ? `${members.length} people`
          : `${displayMembers.length} of ${members.length} people`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Split between ${label}`}
      // NOTE - no token for the 48pt row height, falling back to h-[48px] (the board's row)
      className="h-[48px] flex-row items-center gap-space-3"
    >
      <TripAvatarStack members={displayMembers} ringClassName="bg-ink-50" />
      <Text
        className={cn(
          "flex-1 text-ink-900 text-amount",
          displayMembers.length === 0 && "text-owe-600",
        )}
      >
        {label}
      </Text>
      <ChevronRight size={20} color={colors.ink[500]} />
    </Pressable>
  );
}
