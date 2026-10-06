import {
  BottomSheet,
  FormTextInput,
  KeyboardAwareScrollView,
} from "@/components/sheet-keyboard";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import { SplitMethod } from "@/types/TExpense";
import { getInitial } from "@/utils/utils";
import { Search } from "lucide-react-native";
import { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSplitBottomSheet from "../../hooks/useSplitBottomSheet";
import AddPerson from "../addperson/AddPerson";
import MemberListRow from "./MemberListRow";
import SelectionSummaryBar from "./SelectionSummaryBar";
import SplitMethodControl from "./SplitMethodControl";
import SplitSummary from "./SplitSummary";

export interface SplitBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const TITLE_BY_SPLIT_METHOD: Record<SplitMethod, string> = {
  equally: "Split equally",
  amounts: "Split by amount",
  shares: "Split by shares",
};

export default function SplitBottomSheet(
  props: SplitBottomSheetProps,
): ReactElement {
  const { visible, onClose } = props;

  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={TITLE_BY_SPLIT_METHOD[splitMethod]}
      showCloseButton
      snapPoints={["80%"]}
      safeAreaInsets={safeAreaInsets}
    >
      <SplitContent />
    </BottomSheet>
  );
}

// Its own component so the search resets on every open: the sheet unmounts
// its children while hidden, but SplitBottomSheet itself stays mounted
function SplitContent(): ReactElement {
  const {
    query,
    setQuery,
    filteredMembers,
    typedAmounts,
    effectiveAmounts,
    effectiveEquallyAmounts,
    effectiveShareAmounts,
    handleToggleMember,
    handleChangeAmount,
    handleChangeShares,
    splitMethod,
    currency,
    effectiveShares,
    selectedMemberIds,
  } = useSplitBottomSheet();

  return (
    // One scroll view for the whole sheet (rebuild rule); the search block
    // (child 1) stays pinned while the rows scroll
    <KeyboardAwareScrollView stickyHeaderIndices={[1]}>
      {/* Method + summary */}
      <View className="px-5">
        <View className="pb-3">
          <SplitMethodControl />
        </View>

        <View className="pb-3">
          <SplitSummary variant="sheet" />
        </View>
      </View>

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

        <SelectionSummaryBar context="split" />
      </View>

      {/* Rows — a .map, not a FlatList: one scroll view per sheet, and a
          trip's member list is short */}
      <View className="gap-2 px-5 pb-3">
        {filteredMembers.map((member) => {
          const avatar = {
            label: getInitial(member.name),
            color: member.memberColor,
          };
          const selected = selectedMemberIds.includes(member.id);

          if (splitMethod === "amounts") {
            return (
              <MemberListRow
                key={member.id}
                variant="amounts"
                name={member.name}
                avatar={avatar}
                currency={currency}
                state={{
                  amount: typedAmounts[member.id] ?? "",
                  autoAmount: effectiveAmounts[member.id] ?? "",
                  selected,
                  onChangeAmount: (amount) =>
                    handleChangeAmount(member.id, amount),
                  onPress: () => handleToggleMember(member.id),
                }}
              />
            );
          }

          if (splitMethod === "shares") {
            return (
              <MemberListRow
                key={member.id}
                variant="shares"
                name={member.name}
                avatar={avatar}
                state={{
                  shares: effectiveShares[member.id],
                  amount: effectiveShareAmounts[member.id],
                  selected,
                  onIncrement: () => handleChangeShares(member.id, 1),
                  onDecrement: () => handleChangeShares(member.id, -1),
                  onPress: () => handleToggleMember(member.id),
                }}
              />
            );
          }

          return (
            <MemberListRow
              key={member.id}
              variant="equally"
              name={member.name}
              avatar={avatar}
              state={{
                selected,
                amount: effectiveEquallyAmounts[member.id],
                onPress: () => handleToggleMember(member.id),
              }}
            />
          );
        })}
      </View>

      <View className="px-5">
        <AddPerson />
      </View>
    </KeyboardAwareScrollView>
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
