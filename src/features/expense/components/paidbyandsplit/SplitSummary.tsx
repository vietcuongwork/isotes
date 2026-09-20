import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { Member } from "@/types/TExpense";
import { formatDisplayAmount, parseAmountInput } from "@/utils/currency";
import { CheckCircle2 } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

interface SplitSummaryProps {
  members: Member[];
}

export default function SplitSummary(props: SplitSummaryProps) {
  const { members } = props;

  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const equallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.equallySelectedMemberIds,
  );
  const splitAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const totalAmount =
    parseAmountInput(useExpenseSheetStore((s) => s.amount)) || 0;
  const currency = useExpenseSheetStore((s) => s.currency);

  const { symbol, decimalDigits } = currency;

  // Mirrors useSplitBottomSheet's effectiveAmounts — same "unedited members
  // default to an equal split of the total" rule, kept in sync manually
  // since this summary renders outside the sheet.
  const effectiveAmounts = useMemo<Record<string, string>>(() => {
    const equalShare = (totalAmount / (members.length || 1)).toFixed(
      decimalDigits,
    );
    return Object.fromEntries(
      members.map((member) => [
        member.id,
        splitAmounts[member.id] ?? equalShare,
      ]),
    );
  }, [members, splitAmounts, totalAmount]);

  const totalShares = members.reduce(
    (sum, member) => sum + (splitShares[member.id] ?? 0),
    0,
  );
  const perShareAmount = totalAmount / (totalShares || 1);

  if (members.length === 1) {
    return (
      <View className="flex-row">
        <Text className="text-grey-200 text-meta">
          Nobody owes anything yet -
        </Text>
        <Text className="text-orange-400 text-label">
          add people to the trip
        </Text>
      </View>
    );
  }

  // Equally variant
  if (splitMethod === "equally") {
    const count = equallySelectedMemberIds.length;
    const perPerson = totalAmount / (count || 1);

    return (
      <Text className="mt-3 text-center text-grey-200 text-meta">
        {formatDisplayAmount(perPerson, symbol, decimalDigits)} each · {count}{" "}
        people
      </Text>
    );
  }

  // Amounts variant
  if (splitMethod === "amounts") {
    const assignedTotal = members.reduce(
      (sum, member) =>
        sum + parseAmountInput(effectiveAmounts[member.id] ?? "0"),
      0,
    );
    const remaining = totalAmount - assignedTotal;
    const remainingCents = Math.round(remaining * 100);

    if (remainingCents === 0) {
      return (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          <CheckCircle2 size={16} color={colors.green[400]} />
          <Text className="font-outfit-medium text-green-400 text-meta">
            Fully assigned
          </Text>
        </View>
      );
    }

    return (
      <View className="mt-3 flex-row items-center justify-center gap-1.5">
        <Text className="font-outfit-medium text-red-400 text-meta">
          {remainingCents > 0
            ? `${formatDisplayAmount(remaining, symbol, decimalDigits)} left to assign`
            : `${formatDisplayAmount(Math.abs(remaining), symbol, decimalDigits)} over`}
        </Text>
      </View>
    );
  }

  // Shares variant
  return (
    <View className="mt-3 flex-row items-center justify-center gap-1.5">
      <CheckCircle2 size={16} color={colors.green[400]} />
      <Text className="font-outfit-medium text-green-400 text-meta">
        {totalShares} shares ·{" "}
        {formatDisplayAmount(perShareAmount, symbol, decimalDigits)} each share
      </Text>
    </View>
  );
}
