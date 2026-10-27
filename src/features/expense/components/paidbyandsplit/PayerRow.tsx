import Avatar from "@/components/Avatar";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { getInitial } from "@/utils/utils";
import { ChevronsUpDown } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, Text } from "react-native";

interface PayerRowProps {
  onPress: () => void;
}
export default function PayerRow(props: PayerRowProps): ReactElement {
  const { onPress } = props;

  const members = useExpenseSheetStore((s) => s.members);
  const paidByMemberId = useExpenseSheetStore((s) => s.paidByMemberId);

  const payer =
    members.find((member) => member.id === paidByMemberId) ?? members[0];
  const label = payer.isOwner ? "You paid" : `${payer.name} paid`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // NOTE - no token for the 48pt row height, falling back to h-[48px] (the board's row)
      className="h-[48px] flex-row items-center gap-space-3"
    >
      {/* NOTE - no token for the avatar's 2pt ring and 12/600 initial, falling back to p-[2px] and text-initial-md (TripAvatarStack's) */}
      <Avatar
        label={getInitial(payer.name)}
        color={payer.memberColor}
        ringClassName="bg-ink-50 p-[2px]"
        innerViewClassName="h-space-8 w-space-8"
        textClassName="text-initial-md"
      />
      <Text className="flex-1 text-ink-900 text-amount">{label}</Text>
      <ChevronsUpDown size={20} color={colors.ink[500]} />
    </Pressable>
  );
}
