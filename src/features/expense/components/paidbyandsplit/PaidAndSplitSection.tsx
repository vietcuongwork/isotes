import { ReactElement, useState } from "react";
import { Text, View } from "react-native";
import PaidByBottomSheet from "./PaidByBottomSheet";
import PayerRow from "./PayerRow";
import PeopleSummaryRow from "./PeopleSummaryRow";
import SplitBottomSheet from "./SplitBottomSheet";
import SplitMethodControl from "./SplitMethodControl";
import SplitSummary from "./SplitSummary";

export default function PaidAndSplitSection(): ReactElement {
  const [isPaidByOpen, setPaidByOpen] = useState(false);
  const [isSplitOpen, setSplitOpen] = useState(false);

  return (
    <View>
      <Text className="mb-2 text-grey-200 text-label">Paid & Split</Text>

      <View className="rounded-card border border-grey-825 bg-grey-960">
        <PayerRow
          onPress={() => {
            setPaidByOpen(true);
          }}
        />
        {/* Modal sheet: renders above everything, wherever it sits in the tree */}
        <PaidByBottomSheet
          visible={isPaidByOpen}
          onClose={() => setPaidByOpen(false)}
        />

        <View className="p-3 pb-3.5">
          <SplitMethodControl />

          <View className="mt-3">
            <PeopleSummaryRow
              onPress={() => {
                setSplitOpen(true);
              }}
            />
            <SplitBottomSheet
              visible={isSplitOpen}
              onClose={() => setSplitOpen(false)}
            />
          </View>

          <SplitSummary variant="section" />
        </View>
      </View>
    </View>
  );
}
