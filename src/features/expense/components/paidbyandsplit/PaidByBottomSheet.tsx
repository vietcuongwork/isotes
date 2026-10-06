import {
  BottomSheet,
  FormTextInput,
  KeyboardAwareScrollView,
} from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import { getInitial } from "@/utils/utils";
import { Search } from "lucide-react-native";
import { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import usePaidByBottomSheet from "../../hooks/usePaidByBottomSheet";
import AddPerson from "../addperson/AddPerson";
import MemberListRow from "./MemberListRow";
import SelectionSummaryBar from "./SelectionSummaryBar";

export interface PaidByBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaidByBottomSheet(
  props: PaidByBottomSheetProps,
): ReactElement {
  const { visible, onClose } = props;

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Paid by"
      showCloseButton
      snapPoints={["80%"]}
      safeAreaInsets={safeAreaInsets}
    >
      <PaidByContent />
    </BottomSheet>
  );
}

// Its own component so the search resets on every open: the sheet unmounts
// its children while hidden, but PaidByBottomSheet itself stays mounted
function PaidByContent(): ReactElement {
  const { query, setQuery, filteredMembers, selectedPayerId, onSelectPayer } =
    usePaidByBottomSheet();

  return (
    <>
      {/* One scroll view for the whole sheet (rebuild rule); the search block
          (child 0) stays pinned while the rows scroll */}
      <KeyboardAwareScrollView stickyHeaderIndices={[0]}>
        {/* Search — opaque so rows don't show through while pinned */}
        <View className="bg-grey-905 px-5">
          <View className="pb-3">
            {/* //NOTE - no token for input chrome, falling back to rounded-row/grey-965/grey-825 */}
            <View className="flex-row items-center gap-2.5 rounded-row border border-grey-825 bg-grey-965 px-3.5 py-2.5">
              <Search size={18} color={colors.grey[200]} />
              <FormTextInput
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

          <SelectionSummaryBar context="paidBy" />
        </View>

        {/* Rows — a .map, not a FlatList: one scroll view per sheet, and a
            trip's member list is short */}
        <View className="gap-[7px] px-5 pb-3">
          {filteredMembers.map((member) => (
            <MemberListRow
              key={member.id}
              variant="paidBy"
              name={member.name}
              avatar={{
                label: getInitial(member.name),
                color: member.memberColor,
              }}
              state={{
                selected: member.id === selectedPayerId,
                onPress: () => onSelectPayer(member.id),
              }}
            />
          ))}
        </View>

        <View className="px-5">
          <AddPerson />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    fontFamily: fontFamily["outfit-regular"],
    fontSize: 15,
    color: colors.grey[50],
  },
});
