import { formatTripDateLine } from "@/features/trips/helpers/tripsHelpers";
import { TripCardData } from "@/types/TTrips";
import { formatDisplayAmount } from "@/utils/currency";
import { Pressable, Text, View } from "react-native";

interface TripCardProps {
  data: TripCardData;
  onPress: () => void;
}

export default function TripCard(props: TripCardProps) {
  const { data, onPress } = props;
  const { trip, totalAmount } = data;
  const { code, symbol, decimalDigits } = trip.currency;

  return (
    <Pressable
      onPress={onPress}
      className="gap-space-4 rounded-lg bg-card p-space-4 shadow-card"
    >
      {/* Name and date */}
      <View className="gap-space-1">
        <Text numberOfLines={2} className="text-ink-900 text-heading">
          {trip.name}
        </Text>
        <Text className="text-ink-500 text-caption">
          {formatTripDateLine(trip.createdAt, code, new Date())}
        </Text>
      </View>

      {/* Spent */}
      <View className="border-t border-ink-100 pt-space-3">
        <Text className="text-ink-500 text-micro">Spent</Text>
        <Text className="text-ink-900 text-amount">
          {formatDisplayAmount(totalAmount, symbol, decimalDigits)}
        </Text>
      </View>
    </Pressable>
  );
}
