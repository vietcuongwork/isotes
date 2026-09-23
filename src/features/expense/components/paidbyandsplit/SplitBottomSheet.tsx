import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import { SplitMethod } from "@/types/TExpense";
import { getInitial } from "@/utils/utils";
import { Search } from "lucide-react-native";
import { forwardRef, ReactElement } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import useSplitBottomSheet from "../../hooks/useSplitBottomSheet";
import AddPerson from "../addperson/AddPerson";
import MemberListRow from "./MemberListRow";
import SplitSummary from "./SplitSummary";

export interface SplitBottomSheetProps {
  onAddPerson: () => void;
  onClose?: () => void;
}

const HEADER_TITLE_BY_SPLIT_METHOD: Record<SplitMethod, string> = {
  equally: "SPLIT EQUALLY",
  amounts: "SPLIT BY AMOUNT",
  shares: "SPLIT BY SHARES",
};

const SplitBottomSheet = forwardRef<BottomSheetMethods, SplitBottomSheetProps>(
  function SplitBottomSheet(props, ref): ReactElement {
    const { onAddPerson, onClose } = props;

    const {
      query,
      setQuery,
      filteredMembers,
      flatListContentContainerStyle,
      effectiveAmounts,
      effectiveShareAmounts,
      handleToggleEquallyMember,
      handleChangeAmount,
      handleChangeShares,
      safeBottomStyle,
      splitMethod,
      currency,
      selectedShares,
      equallySelectedMemberIds,
      members,
    } = useSplitBottomSheet();

    return (
      <BottomSheet ref={ref} snapPoints={["80%"]} onClose={onClose}>
        <View style={safeBottomStyle}>
          <View className="px-5">
            <View className="items-center pb-3.5">
              <Text className="text-grey-200 text-micro">
                {HEADER_TITLE_BY_SPLIT_METHOD[splitMethod]}
              </Text>
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
            renderScrollComponent={(props) => (
              <KeyboardAwareScrollView
                {...props}
                bottomOffset={50}
                keyboardShouldPersistTaps="handled"
              />
            )}
            renderItem={({ item: member }) => {
              if (splitMethod === "amounts") {
                return (
                  <MemberListRow
                    variant="amounts"
                    name={member.name}
                    avatar={{
                      label: getInitial(member.name),
                      color: member.memberColor,
                    }}
                    currency={currency}
                    state={{
                      amount: effectiveAmounts[member.id],
                      onChangeAmount: (amount) =>
                        handleChangeAmount(member.id, amount),
                    }}
                  />
                );
              }

              if (splitMethod === "shares") {
                return (
                  <MemberListRow
                    variant="shares"
                    name={member.name}
                    avatar={{
                      label: getInitial(member.name),
                      color: member.memberColor,
                    }}
                    state={{
                      shares: selectedShares[member.id] ?? 0,
                      amount: effectiveShareAmounts[member.id],
                      onIncrement: () => handleChangeShares(member.id, 1),
                      onDecrement: () => handleChangeShares(member.id, -1),
                    }}
                  />
                );
              }

              const isSelected = equallySelectedMemberIds.includes(member.id);

              return (
                <MemberListRow
                  variant="equally"
                  name={member.name}
                  avatar={{
                    label: getInitial(member.name),
                    color: member.memberColor,
                  }}
                  state={{
                    checked: isSelected,
                    onPress: () => {
                      console.log("members", members);
                      handleToggleEquallyMember(member.id);
                    },
                  }}
                />
              );
            }}
          />

          <View className="px-5">
            <AddPerson />
          </View>

          <View className="mt-8 border-t border-grey-825 px-5">
            <SplitSummary />
          </View>
        </View>
      </BottomSheet>
    );
  },
);

export default SplitBottomSheet;

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    fontFamily: fontFamily["outfit-regular"],
    fontSize: 15,
    color: colors.grey[50],
  },
});
