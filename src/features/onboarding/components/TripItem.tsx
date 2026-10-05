import Avatar from "@/components/Avatar";
import { colors } from "@/themes/color";
import { Trip } from "@/types/TCreateTrip";
import { Member } from "@/types/TExpense";
import { TripSummary } from "@/types/TOnboarding";
import { formatDisplayAmount } from "@/utils/currency";
import { ChevronRight } from "lucide-react-native";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

interface TripItemProps {
  trip: Trip;
  summary: TripSummary;
  members: Member[];
  touchableOpacityProps?: TouchableOpacityProps;
}

export default function TripItem(props: TripItemProps) {
  const { trip, summary, members, touchableOpacityProps } = props;
  const { balance, expenseCount, totalAmount } = summary;
  const { symbol, decimalDigits } = trip.currency;

  const balanceColor =
    balance > 0
      ? "text-green-400"
      : balance < 0
        ? "text-red-400"
        : "text-grey-200";
  const balanceLabel =
    balance > 0 ? "you're owed" : balance < 0 ? "you owe" : "all square";
  const balanceSign = balance > 0 ? "+" : balance < 0 ? "-" : "";
  const balanceText = `${balanceSign}${formatDisplayAmount(Math.abs(balance), symbol, decimalDigits)}`;

  return (
    <TouchableOpacity
      className="gap-1 rounded-card bg-grey-900 p-4"
      {...touchableOpacityProps}
    >
      {/* Header */}
      <View className="flex-row justify-between">
        <Text className="text-grey-50 text-title">{trip.name}</Text>
        <Text className={`${balanceColor} text-title`}>{balanceText}</Text>
      </View>

      {/* Summary */}
      <View className="flex-row justify-between">
        <Text className="text-grey-200 text-meta">
          {expenseCount} expenses ·{" "}
          {formatDisplayAmount(totalAmount, symbol, decimalDigits)}
        </Text>
        <Text className="text-grey-200 text-meta">{balanceLabel}</Text>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3">
        <Avatar.Stack members={members} maxVisible={8} />
        <ChevronRight size={18} color={colors.grey[400]} />
      </View>
    </TouchableOpacity>
  );
}
