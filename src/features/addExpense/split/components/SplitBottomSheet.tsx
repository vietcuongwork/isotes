import {
  BottomSheet,
  BottomSheetScrollView,
} from "@/components/sheet-keyboard";
import { getInitial } from "@/utils/utils";
import { ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSplitBottomSheet from "@/features/addExpense/split/hooks/useSplitBottomSheet";
import AddPerson from "@/components/addPerson/AddPerson";
import MemberListRow from "@/features/addExpense/components/members/MemberListRow";
import MemberNoMatches from "@/features/addExpense/components/members/MemberNoMatches";
import MemberSearchField from "@/features/addExpense/components/members/MemberSearchField";
import SelectionSummaryBar from "@/features/addExpense/components/members/SelectionSummaryBar";
import SplitMethodControl from "./SplitMethodControl";
import SplitSummary from "./SplitSummary";

export interface SplitBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function SplitBottomSheet(
  props: SplitBottomSheetProps,
): ReactElement {
  const { visible, onClose } = props;

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Split"
      titleSize="title"
      showCloseButton
      closeVariant="done"
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
    equallyExtras,
    effectiveShareAmounts,
    shareExtras,
    isOverAssigned,
    handleToggleMember,
    handleChangeAmount,
    handleChangeShares,
    splitMethod,
    currency,
    effectiveShares,
    selectedMemberIds,
    members,
  } = useSplitBottomSheet();

  return (
    <BottomSheetScrollView>
      <View className="gap-space-4 px-space-5 pb-space-5">
        <SplitMethodControl />

        {/* Amount to split and the result line */}
        <SplitSummary variant="sheet" />

        <MemberSearchField query={query} onChangeQuery={setQuery} />

        {/* Roster: count, rows (or no matches) and the Add person row, 8 apart.
            Rows are a .map, not a FlatList: one scroll view serves the whole
            sheet and a trip's member list is short */}
        <View className="gap-space-2">
          <SelectionSummaryBar context="split" />

          {filteredMembers.length === 0 ? (
            <MemberNoMatches query={query} memberCount={members.length} />
          ) : (
            filteredMembers.map((member) => {
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
                      overAssigned: isOverAssigned,
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
                      extra: shareExtras[member.id],
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
                    extra: equallyExtras[member.id],
                    onPress: () => handleToggleMember(member.id),
                  }}
                />
              );
            })
          )}

          <AddPerson query={query} />
        </View>
      </View>
    </BottomSheetScrollView>
  );
}
