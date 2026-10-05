import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
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

  const handlePayerRowPress = (props: PaidByBottomSheetProps) => {
    const { onClose } = props;
    pushSheet({
      component: <PaidByBottomSheet onClose={onClose} />,
    });
  };

  const handlePeopleSummaryRowPress = (props: SplitBottomSheetProps) => {
    const { onClose } = props;
    pushSheet({
      component: <SplitBottomSheet onClose={onClose} />,
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
              onClose: popSheet,
            });
          }}
        />

        <View className="p-3 pb-3.5">
          <SplitMethodControl />

          <View className="mt-3">
            <PeopleSummaryRow
              onPress={() => {
                Keyboard.dismiss();
                handlePeopleSummaryRowPress({
                  onClose: popSheet,
                });
              }}
            />
          </View>

          <SplitSummary variant="section" />
        </View>
      </View>
    </View>
  );
}
