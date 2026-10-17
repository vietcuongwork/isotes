import Raven from "@/components/Raven";
import TripCard from "@/features/trips/components/TripCard";
import TripsEmpty from "@/features/trips/components/TripsEmpty";
import TripsNoMatches from "@/features/trips/components/TripsNoMatches";
import { matchesTripSearch } from "@/features/trips/helpers/tripsHelpers";
import { useTrips } from "@/features/trips/hooks/useTrips";
import { EXPO_ROUTER } from "@/navigation/route";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { TripCardData } from "@/types/TTrips";
import { useIsFocused, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Plus, Search } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// NOTE - no token for body without its line height, falling back to body's
// font and size: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]])
const body = textStyle("body");
const searchTextStyle = {
  fontFamily: body.fontFamily,
  fontSize: body.fontSize,
};

export default function TripsScreen() {
  const router = useRouter();
  const trips = useTrips();
  // StatusBar props merge in mount order and a pushed screen keeps this one
  // mounted, so dark text is rendered only while Trips is on top.
  const isFocused = useIsFocused();
  // Kept in this screen, which stays mounted under a pushed trip, so the
  // query survives the trip and back
  const [query, setQuery] = useState("");
  const listedTrips = trips?.filter((data) =>
    matchesTripSearch(data.trip.name, query),
  );
  // Still null while loading, so the empty state can't flash
  const hasNoTrips = trips?.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={["top"]}>
      {isFocused && <StatusBar style="dark" />}

      {/* Header */}
      {/* //NOTE - no token for 112 (96 board header + 16 pt-space-4), falling back to min-h-[112px] */}
      {/* Keeps the header's height without the raven; Yoga counts padding inside minHeight */}
      <View className="min-h-[112px] flex-row items-end justify-between px-space-5 pt-space-4">
        <Text accessibilityRole="header" className="text-ink-900 text-display">
          Your <Text className="text-ink-400">trips</Text>
        </Text>
        {/* One raven per screen: the empty state brings the sleeping one */}
        {!hasNoTrips && (
          // NOTE - no token for the board's 23pt bleed past the gutter, falling back to -mr-[23px]
          <View className="-mr-[23px]">
            <Raven pose="peeking" height={96} />
          </View>
        )}
      </View>

      {hasNoTrips && <TripsEmpty />}

      {listedTrips && !hasNoTrips && (
        <>
          {/* Search */}
          <View className="mx-space-5 mt-space-6 h-space-12 flex-row items-center gap-space-2 rounded-md bg-ink-100 px-space-4">
            <Search size={20} color={colors.ink[500]} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search trips"
              placeholderTextColor={colors.ink[500]}
              accessibilityLabel="Search trips"
              clearButtonMode="while-editing"
              returnKeyType="search"
              autoCorrect={false}
              className="h-full flex-1 text-ink-900"
              style={searchTextStyle}
            />
          </View>

          {/* Trips exist here, so an empty list means the query matched none */}
          {listedTrips.length === 0 ? (
            <TripsNoMatches query={query} />
          ) : (
            <TripsList trips={listedTrips} />
          )}
        </>
      )}

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

interface TripsListProps {
  trips: TripCardData[];
}

// The "ONGOING" row stays pinned while only the cards scroll
function TripsList(props: TripsListProps) {
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
