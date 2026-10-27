import TripCard from "@/features/trips/components/TripCard";
import { EXPO_ROUTER } from "@/navigation/route";
import { TripCardData } from "@/types/TTrips";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

interface TripsListProps {
  trips: TripCardData[];
}

// The "ONGOING" row stays pinned while only the cards scroll
export default function TripsList(props: TripsListProps) {
  const router = useRouter();
  const { trips } = props;

  return (
    <>
      <View className="flex-row justify-between px-space-5 pb-space-3 pt-space-6">
        <Text className="text-ink-500 text-micro">Ongoing</Text>
        <Text className="text-ink-500 text-micro">
          {trips.length} {trips.length === 1 ? "trip" : "trips"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        // NOTE - no token for 120 (56 pill + 40 bottom offset + 24 space-6), falling back to pb-[120px]
        contentContainerClassName="gap-space-3 px-space-5 pb-[120px]"
        showsVerticalScrollIndicator={false}
      >
        {trips.map((data) => (
          <TripCard
            key={data.trip.id}
            data={data}
            onPress={() => router.push(EXPO_ROUTER.EXPENSE(data.trip.id))}
          />
        ))}
      </ScrollView>
    </>
  );
}
