import { ReactElement, useState } from "react";
import { View } from "react-native";
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
    <>
      {/* Panel */}
      <View className="gap-space-2 rounded-lg bg-ink-50 px-space-3 pb-space-3 pt-space-1">
        <PayerRow onPress={() => setPaidByOpen(true)} />
        <SplitMethodControl />
        <PeopleSummaryRow onPress={() => setSplitOpen(true)} />
        <SplitSummary variant="section" />
      </View>

      {/* Modal sheets: outside the panel, so its gap doesn't count them */}
      <PaidByBottomSheet
        visible={isPaidByOpen}
        onClose={() => setPaidByOpen(false)}
      />
      <SplitBottomSheet
        visible={isSplitOpen}
        onClose={() => setSplitOpen(false)}
      />
    </>
  );
}
