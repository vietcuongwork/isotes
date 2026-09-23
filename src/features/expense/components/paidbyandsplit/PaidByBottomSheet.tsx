import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import { getInitial } from "@/utils/utils";
import { Search } from "lucide-react-native";
import { forwardRef, ReactElement } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import usePaidByBottomSheet from "../../hooks/usePaidByBottomSheet";
import AddPerson from "../addperson/AddPerson";
import MemberListRow from "./MemberListRow";

export interface PaidByBottomSheetProps {
  onClose?: () => void;
}

const PaidByBottomSheet = forwardRef<
  BottomSheetMethods,
  PaidByBottomSheetProps
>(function PaidByBottomSheet(props, ref): ReactElement {
  const { onClose } = props;

  const {
    query,
    setQuery,
    filteredMembers,
    flatListContentContainerStyle,
    safeBottomStyle,
    selectedPayerId,
    onSelectPayer,
    members,
  } = usePaidByBottomSheet();

  return (
    <BottomSheet ref={ref} snapPoints={["80%"]} onClose={onClose}>
      <View style={safeBottomStyle}>
        <View className="px-5">
          <View className="items-center pb-3.5">
            <Text className="text-grey-200 text-micro">PAID BY</Text>
          </View>

          {/* Search */}
          <View className="pb-3">
            {/* //NOTE - no token for input chrome, falling back to rounded-row/grey-965/grey-825 */}
            <View className="flex-row items-center gap-2.5 rounded-row border border-grey-825 bg-grey-965 px-3.5 py-2.5">
              <Search size={18} color={colors.grey[200]} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search people"
                placeholderTextColor={colors.grey[400]}
                cursorColor={colors.orange[400]}
                selectionColor={colors.orange[400]}
                style={styles.searchInput}
              />
            </View>
          </View>

          <Text className="pb-2.5 text-grey-200 text-meta">
            {members.length} people on this trip
          </Text>
        </View>

        <FlatList
          className="flex-1"
          data={filteredMembers}
          keyExtractor={(member) => member.id}
          contentContainerStyle={flatListContentContainerStyle}
          renderItem={({ item: member }) => (
            <MemberListRow
              variant="paidBy"
              name={member.name}
              avatar={{
                label: getInitial(member.name),
                color: member.memberColor,
              }}
              state={{
                isSelected: member.id === selectedPayerId,
                onPress: () => onSelectPayer(member.id),
              }}
            />
          )}
        />

        <View className="px-5">
          <AddPerson />
        </View>
      </View>
    </BottomSheet>
  );
});

export default PaidByBottomSheet;

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    fontFamily: fontFamily["outfit-regular"],
    fontSize: 15,
    color: colors.grey[50],
  },
});
