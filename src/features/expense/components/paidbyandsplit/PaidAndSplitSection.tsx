import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { ReactElement } from "react";
import { Keyboard, Text, View } from "react-native";
import PaidByBottomSheet, { PaidByBottomSheetProps } from "./PaidByBottomSheet";
import PayerRow from "./PayerRow";
import PeopleSummaryRow from "./PeopleSummaryRow";
import SplitBottomSheet, { SplitBottomSheetProps } from "./SplitBottomSheet";
import SplitMethodControl from "./SplitMethodControl";
import SplitSummary from "./SplitSummary";

export default function PaidAndSplitSection(): ReactElement {
  const { pushSheet, popSheet } = useBottomSheetStack();
  const members = useExpenseSheetStore((s) => s.members);

  const handlePayerRowPress = (props: PaidByBottomSheetProps) => {
    const { members, onAddPerson, onClose } = props;
    pushSheet({
      component: (
        <PaidByBottomSheet
          members={members}
          // TODO: wire to the add-person flow once it exists
          onAddPerson={onAddPerson}
          onClose={onClose}
        />
      ),
    });
  };

  const handlePeopleSummaryRowPress = (props: SplitBottomSheetProps) => {
    const {
      members,

      onAddPerson,
      onClose,
    } = props;
    pushSheet({
      component: (
        <SplitBottomSheet
          members={members}
          // TODO: wire to the add-person flow once it exists
          onAddPerson={onAddPerson}
          onClose={onClose}
        />
      ),
    });
  };

  return (
    <View>
      <Text className="mb-2 text-grey-200 text-label">Paid & Split</Text>

      <View className="rounded-card border border-grey-825 bg-grey-960">
        <PayerRow
          onPress={() => {
            Keyboard.dismiss();
            handlePayerRowPress({
              members,
              onAddPerson: () => {},
              onClose: popSheet,
            });
          }}
        />

        <View className="p-3 pb-3.5">
          <SplitMethodControl />

          <View className="mt-3">
            <PeopleSummaryRow
              members={members}
              maxVisible={3}
              onPress={() => {
                Keyboard.dismiss();
                handlePeopleSummaryRowPress({
                  members,
                  onAddPerson: () => {},
                  onClose: popSheet,
                });
              }}
            />
          </View>

          <SplitSummary members={members} />
        </View>
      </View>
    </View>
  );
}
