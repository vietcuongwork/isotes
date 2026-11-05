import { ReactElement, useState } from "react";
import { View } from "react-native";
import PaidByBottomSheet from "@/features/addExpense/paidBy/components/PaidByBottomSheet";
import PayerRow from "@/features/addExpense/paidBy/components/PayerRow";
import PeopleSummaryRow from "@/features/addExpense/split/components/PeopleSummaryRow";
import SplitBottomSheet from "@/features/addExpense/split/components/SplitBottomSheet";
import SplitMethodControl from "@/features/addExpense/split/components/SplitMethodControl";
import SplitSummary from "@/features/addExpense/split/components/SplitSummary";

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
