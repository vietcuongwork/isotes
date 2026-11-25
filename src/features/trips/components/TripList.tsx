import TripCard from "@/features/trips/components/TripCard";
import { EXPO_ROUTER } from "@/navigation/route";
import { TripCardData } from "@/types/TTrips";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

interface TripsListProps {
  trips: TripCardData[];
}

export default function TripsList(props: TripsListProps) {
  const router = useRouter();
  const { trips } = props;

  return (
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
  );
}
