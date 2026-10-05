import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import { SplitMethod } from "@/types/TExpense";
import { getInitial } from "@/utils/utils";
import { Search } from "lucide-react-native";
import { forwardRef, ReactElement, useRef } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import useScrollFieldAboveSheet from "../../hooks/useScrollFieldAboveSheet";
import useSplitBottomSheet from "../../hooks/useSplitBottomSheet";
import useSplitNumberPad from "../../hooks/useSplitNumberPad";
import AddPerson from "../addperson/AddPerson";
import MemberListRow from "./MemberListRow";
import SelectionSummaryBar from "./SelectionSummaryBar";
import SplitMethodControl from "./SplitMethodControl";
import SplitSummary from "./SplitSummary";

export interface SplitBottomSheetProps {
  onClose?: () => void;
}

const HEADER_TITLE_BY_SPLIT_METHOD: Record<SplitMethod, string> = {
  equally: "SPLIT EQUALLY",
  amounts: "SPLIT BY AMOUNT",
  shares: "SPLIT BY SHARES",
};

const SplitBottomSheet = forwardRef<BottomSheetMethods, SplitBottomSheetProps>(
  function SplitBottomSheet(props, ref): ReactElement {
    const { onClose } = props;

    const {
      query,
      setQuery,
      filteredMembers,
      flatListContentContainerStyle,
      effectiveAmounts,
      effectiveEquallyAmounts,
      effectiveShareAmounts,
      handleToggleMember,
      handleChangeAmount,
      handleChangeShares,
      safeBottomStyle,
      splitMethod,
      currency,
      effectiveShares,
      selectedMemberIds,
      members,
    } = useSplitBottomSheet();

    // FlatList's renderScrollComponent clones its returned element with its
    // OWN ref (_captureScrollRef in VirtualizedList.js), silently replacing
    // any ref set here — so scrolling has to go through FlatList's own
    // scrollToOffset, not a ref on the inner KeyboardAwareScrollView.
    // why: chat discussion (2026-09-28).
    const flatListRef = useRef<FlatList>(null);
    const {
      handleScroll,
      scrollFieldIntoView,
      extraBottomSpace,
      resetExtraBottomSpace,
    } = useScrollFieldAboveSheet(
      (y) => flatListRef.current?.scrollToOffset({ offset: y, animated: true }),
      (callback) =>
        // cast: the native scroll ref is a host component at runtime, but its TS union omits measureInWindow
        (
          flatListRef.current?.getNativeScrollRef() as View | null
        )?.measureInWindow((_x, y, _w, h) => callback(y + h)),
    );
    const { activeSplitMemberId, openFor, registerField } = useSplitNumberPad({
      scrollFieldIntoView,
      resetExtraBottomSpace,
    });

    return (
      <BottomSheet ref={ref} snapPoints={["80%"]} onClose={onClose}>
        <View style={safeBottomStyle}>
          <View className="px-5">
            <View className="items-center pb-3.5">
              <Text className="text-grey-200 text-micro">
                {HEADER_TITLE_BY_SPLIT_METHOD[splitMethod]}
              </Text>
            </View>

            <View className="pb-3">
              <SplitMethodControl />
            </View>

            <View className="pb-3">
              <SplitSummary variant="sheet" />
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

            <SelectionSummaryBar context="split" />
          </View>

          <FlatList
            ref={flatListRef}
            className="flex-1"
            data={filteredMembers}
            keyExtractor={(member) => member.id}
            contentContainerStyle={{
              ...flatListContentContainerStyle,
              paddingBottom:
                (flatListContentContainerStyle.paddingBottom ?? 0) +
                extraBottomSpace,
            }}
            onScroll={handleScroll}
            // TEMP T1 — when does native scroll take over the touch?
            onScrollBeginDrag={() =>
              console.log(`[T1] ${performance.now().toFixed(1)} list scrollBeginDrag`)
            }
            onMomentumScrollBegin={() =>
              console.log(`[T1] ${performance.now().toFixed(1)} list momentumBegin`)
            }
            onMomentumScrollEnd={() =>
              console.log(`[T1] ${performance.now().toFixed(1)} list momentumEnd`)
            }
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
                    memberId={member.id}
                    numberPad={{
                      isActive: activeSplitMemberId === member.id,
                      onRequest: openFor,
                      registerField,
                    }}
                    state={{
                      amount: effectiveAmounts[member.id],
                      selected: selectedMemberIds.includes(member.id),
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
                    variant="shares"
                    name={member.name}
                    avatar={{
                      label: getInitial(member.name),
                      color: member.memberColor,
                    }}
                    state={{
                      shares: effectiveShares[member.id],
                      amount: effectiveShareAmounts[member.id],
                      selected: selectedMemberIds.includes(member.id),
                      onIncrement: () => handleChangeShares(member.id, 1),
                      onDecrement: () => handleChangeShares(member.id, -1),
                      onPress: () => handleToggleMember(member.id),
                    }}
                  />
                );
              }

              return (
                <MemberListRow
                  variant="equally"
                  name={member.name}
                  avatar={{
                    label: getInitial(member.name),
                    color: member.memberColor,
                  }}
                  state={{
                    selected: selectedMemberIds.includes(member.id),
                    amount: effectiveEquallyAmounts[member.id],
                    onPress: () => {
                      handleToggleMember(member.id);
                    },
                  }}
                />
              );
            }}
          />

          <View className="px-5">
            <AddPerson />
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
