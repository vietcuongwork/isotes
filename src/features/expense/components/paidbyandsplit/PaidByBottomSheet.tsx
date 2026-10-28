import {
  BottomSheet,
  BottomSheetScrollView,
} from "@/components/sheet-keyboard";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { formatDisplayAmount, parseAmountInput } from "@/utils/currency";
import { getInitial } from "@/utils/utils";
import { ReactElement } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import usePaidByBottomSheet from "@/features/expense/hooks/usePaidByBottomSheet";
import AddPerson from "../addperson/AddPerson";
import MemberListRow from "./MemberListRow";
import MemberNoMatches from "./MemberNoMatches";
import MemberSearchField from "./MemberSearchField";
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
      titleSize="title"
      appearance="light"
      showCloseButton
      closeVariant="done"
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
  const {
    query,
    setQuery,
    filteredMembers,
    members,
    selectedPayerId,
    onSelectPayer,
  } = usePaidByBottomSheet();

  const amount = useExpenseSheetStore((s) => s.amount);
  const { symbol, decimalDigits } = useExpenseSheetStore((s) => s.currency);

  return (
    <BottomSheetScrollView>
      <View className="gap-space-4 px-space-5 pb-space-5">
        {/* Amount */}
        <View className="flex-row items-baseline gap-space-2">
          <Text className="text-ink-900 text-title">
            {formatDisplayAmount(
              parseAmountInput(amount),
              symbol,
              decimalDigits,
            )}
          </Text>
          <Text className="text-ink-500 text-caption">paid</Text>
        </View>

        <MemberSearchField query={query} onChangeQuery={setQuery} />

        {/* Roster: count, rows (or no matches) and the Add person row, 8 apart */}
        <View className="gap-space-2">
          <SelectionSummaryBar context="paidBy" />

          {/* Rows: a .map, not a FlatList, since one scroll view serves the whole
              sheet and a trip's member list is short */}
          {filteredMembers.length === 0 ? (
            <MemberNoMatches query={query} memberCount={members.length} />
          ) : (
            filteredMembers.map((member) => (
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
            ))
          )}

          <AddPerson query={query} />
        </View>
      </View>
    </BottomSheetScrollView>
  );
}
