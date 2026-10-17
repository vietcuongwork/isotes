import TripCard from "@/features/trips/components/TripCard";
import { useTrips } from "@/features/trips/hooks/useTrips";
import { EXPO_ROUTER } from "@/navigation/route";
import { colors } from "@/themes/color";
import { useIsFocused, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripsScreen() {
  const router = useRouter();
  const trips = useTrips();
  // StatusBar props merge in mount order and a pushed screen keeps this one
  // mounted, so dark text is rendered only while Trips is on top.
  const isFocused = useIsFocused();

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={["top"]}>
      {isFocused && <StatusBar style="dark" />}

      {/* Header */}
      <View className="flex-row items-end justify-between px-space-5 pt-space-4">
        <Text accessibilityRole="header" className="text-ink-900 text-display">
          Your <Text className="text-ink-400">trips</Text>
        </Text>
      </View>

      {/* Trip list */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-space-3 px-space-5 pt-space-6"
        showsVerticalScrollIndicator={false}
      >
        {trips?.map((data) => (
          <TripCard
            key={data.trip.id}
            data={data}
            onPress={() => router.push(EXPO_ROUTER.EXPENSE(data.trip.id))}
          />
        ))}
      </ScrollView>

      {/* New trip, floating 40 above the screen's bottom edge as on the board */}
      <View className="absolute bottom-space-10 left-0 right-0 items-center">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(EXPO_ROUTER.CREATE_TRIP)}
          // NOTE - no token for the 56pt pill height, falling back to h-[56px] (board)
          className="h-[56px] flex-row items-center gap-space-3 rounded-pill bg-ink-900 pl-space-4 pr-space-6 shadow-lifted"
        >
          <View className="h-space-8 w-space-8 items-center justify-center rounded-pill bg-card">
            <Plus size={20} strokeWidth={2} color={colors.ink[900]} />
          </View>
          {/* //NOTE - no token for a button label; amount has the same spec (Outfit 500 16/24) */}
          <Text className="text-card text-amount">New trip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
