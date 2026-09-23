import Avatar from "@/components/Avatar";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { ChevronRight } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

interface PeopleSummaryRowProps {
  maxVisible: number;
  onPress: () => void;
}
export default function PeopleSummaryRow(
  props: PeopleSummaryRowProps,
): ReactElement {
  const { maxVisible, onPress } = props;
  const members = useExpenseSheetStore((s) => s.members);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-btn bg-grey-950 px-3.5 py-2.5"
    >
      <View className="flex-row items-center gap-2.5">
        <Avatar.Stack members={members} maxVisible={maxVisible} />
        <Text className="text-grey-50 text-body-medium-flat">
          {members.length === 1
            ? `Just you`
            : `Everyone · ${members.length} people`}
        </Text>
      </View>

      <ChevronRight size={18} color={colors.grey[500]} />
    </Pressable>
  );
}
