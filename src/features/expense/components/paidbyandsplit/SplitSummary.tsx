import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import {
  formatDisplayAmount,
  getAcceptableSplitGap,
  parseAmountInput,
  roundToDecimals,
} from "@/utils/currency";
import { CheckCircle2, CircleAlert } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

export default function SplitSummary() {
  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const equallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.equallySelectedMemberIds,
  );
  const splitAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const totalAmount =
    parseAmountInput(useExpenseSheetStore((s) => s.amount)) || 0;
  const currency = useExpenseSheetStore((s) => s.currency);
  const members = useExpenseSheetStore((s) => s.members);


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
  const perShareAmount = roundToDecimals(
    totalAmount / (totalShares || 1),
    decimalDigits,
  );

  if (members.length === 1) {
    return (
      <View className="flex-row justify-center">
        <Text className="text-grey-200 text-meta">
          Nobody owes anything yet -{" "}
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
    const perPerson = roundToDecimals(
      totalAmount / (count || 1),
      decimalDigits,
    );

    if (equallySelectedMemberIds.length === 0) {
      return (
        <View className="flex-row items-center justify-center gap-1.5">
          <CircleAlert size={12} color={colors.red[400]} />
          <Text className="text-red-400 text-meta">Nobody selected</Text>
        </View>
      );
    }

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
    const acceptableGap = getAcceptableSplitGap(members.length, decimalDigits);

    if (Math.abs(remaining) <= acceptableGap) {
      return (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          <CheckCircle2 size={16} color={colors.green[400]} />
          <Text className="font-outfit-medium text-green-400 text-meta">
            Fully assigned
            {remaining !== 0 &&
              ` · ${formatDisplayAmount(Math.abs(remaining), symbol, decimalDigits)} rounding`}
          </Text>
        </View>
      );
    }

    return (
      <View className="mt-3 flex-row items-center justify-center gap-1.5">
        <Text className="font-outfit-medium text-red-400 text-meta">
          {remaining > 0
            ? `${formatDisplayAmount(remaining, symbol, decimalDigits)} left to assign`
            : `${formatDisplayAmount(Math.abs(remaining), symbol, decimalDigits)} over`}
        </Text>
      </View>
    );
  }

  // Shares variant
  if (totalShares === 0) {
    return (
      <View className="flex-row items-center justify-center gap-1.5">
        <CircleAlert size={12} color={colors.red[400]} />
        <Text className="text-red-400 text-meta">No shares assigned</Text>
      </View>
    );
  }

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
