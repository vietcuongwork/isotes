import Avatar from "@/components/Avatar";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { getInitial } from "@/utils/utils";
import { ChevronsUpDown } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

export default function PayerRow(props: { onPress: () => void }): ReactElement {
  const { onPress } = props;

  const members = useExpenseSheetStore((s) => s.members);
  const paidByMemberId = useExpenseSheetStore((s) => s.paidByMemberId);

  const payer =
    members.find((member) => member.id === paidByMemberId) ?? members[0];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-b-grey-825 px-3.5 py-3"
    >
      <View className="flex-row items-center gap-2.5">
        <Avatar
          label={getInitial(payer.name)}
          color={payer.memberColor}
        />
        <Text className="font-outfit-medium text-grey-50 text-body-medium-flat">
          {payer.isOwner ? "You paid" : `${payer.name} paid`}
        </Text>
      </View>

      <ChevronsUpDown size={18} color={colors.grey[500]} />
    </Pressable>
  );
}
