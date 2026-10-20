import { formatTripDateLine } from "@/features/trips/helpers/tripsHelpers";
import { Trip } from "@/types/TCreateTrip";
import { Text, View } from "react-native";

interface TripHeaderProps {
  trip: Trip;
  now: Date;
}

export default function TripHeader(props: TripHeaderProps) {
  const { trip, now } = props;

  return (
    <View className="gap-space-1">
      <Text className="text-ink-900 text-title">{trip.name}</Text>
      {trip.description !== "" && (
        <Text numberOfLines={2} className="text-ink-700 text-body">
          {trip.description}
        </Text>
      )}
      <Text className="text-ink-500 text-caption">
        {formatTripDateLine(trip.createdAt, trip.currency.code, now)}
      </Text>
    </View>
  );
}
