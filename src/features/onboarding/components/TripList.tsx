import { getAllTrips } from "@/db/trips";
import { transformTripRow } from "@/features/expense/helpers/expenseHelpers";
import { EXPO_ROUTER } from "@/navigation/route";
import { colors } from "@/themes/color";
import { Trip } from "@/types/TCreateTrip";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import AvatarStack from "./AvatarStack";

interface TripItemProps {
  trip: Trip;
  touchableOpacityProps?: TouchableOpacityProps;
}

const TripItem = (props: TripItemProps) => {
  const { trip, touchableOpacityProps } = props;

  const createdAt = new Date(trip.createdAt * 1000).toLocaleDateString();

  return (
    <TouchableOpacity
      className="gap-1 rounded-card bg-grey-900 p-4"
      {...touchableOpacityProps}
    >
      {/* Header */}
      <View className="flex-row justify-between">
        <Text className="text-grey-50 text-title">{trip.name}</Text>
        {/* //TODO - Mock data */}
        <Text className="text-green-400 text-title">+$274.68</Text>
      </View>

      {/* Summary */}
      <View className="flex-row justify-between">
        {/* //TODO - Mock data */}
        <Text className="text-grey-200 text-meta">5 expenses · $630.90</Text>
        {/* //TODO - Mock data */}
        <Text className="text-grey-200 text-meta">you're owed</Text>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3">
        <AvatarStack />
        <ChevronRight size={18} color={colors.grey[400]} />
      </View>
    </TouchableOpacity>
  );
};

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isGettingTrips, setIsGettingTrips] = useState<boolean>(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setIsGettingTrips(true);
      getAllTrips()
        .then((rows) => setTrips(rows.map(transformTripRow)))
        .finally(() => setIsGettingTrips(false));
    }, []),
  );

  return (
    <View className="gap-3 border-b border-grey-825 pb-8 pt-7">
      {/* Item */}
      {trips.map((trip) => (
        <TripItem
          key={trip.id}
          trip={trip}
          touchableOpacityProps={{
            onPress: () => {
              router.push(EXPO_ROUTER.EXPENSE(trip.id));
            },
          }}
        />
      ))}
    </View>
  );
}
