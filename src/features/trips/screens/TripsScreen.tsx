import Raven from "@/components/Raven";
import SkeletonProvider from "@/components/skeleton/SkeletonProvider";
import TripsEmpty from "@/features/trips/components/TripsEmpty";
import TripsNoMatches from "@/features/trips/components/TripsNoMatches";
import TripCardSkeleton from "@/features/trips/components/TripCardSkeleton";
import TripsOngoingRow from "@/features/trips/components/TripsOngoingRow";
import { useTrips } from "@/features/trips/hooks/useTrips";
import { EXPO_ROUTER } from "@/navigation/route";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { StatusBar } from "expo-status-bar";
import { Plus, Search } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import TripsList from "../components/TripList";

// NOTE - no token for body without its line height, falling back to body's
// font and size: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]])
const body = textStyle("body");

// Fade-in of the list when the first read lands: DESIGN.md components.skeleton
const LIST_FADE_MS = 200;

// NOTE - no token for these name-bar widths (board C), falling back to percent strings
const SKELETON_NAME_WIDTHS = ["64%", "52%", "72%", "58%"] as const;

// The row sits outside the labelled view, so VoiceOver still reads "Ongoing"
function TripsLoading() {
  return (
    <SkeletonProvider>
      <TripsOngoingRow count={null} />
      <View
        accessible
        accessibilityLabel="Loading trips"
        className="gap-space-3 px-space-5"
      >
        {SKELETON_NAME_WIDTHS.map((nameWidth) => (
          <TripCardSkeleton key={nameWidth} nameWidth={nameWidth} />
        ))}
      </View>
    </SkeletonProvider>
  );
}

export default function TripsScreen() {
  const {
    router,
    isFocused,
    query,
    setQuery,
    searchRef,
    listedTrips,
    hasNoTrips,
  } = useTrips();

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

      {!hasNoTrips && (
        <>
          {/* Search */}
          <View className="mx-space-5 mt-space-6 h-space-12 flex-row items-center gap-space-2 rounded-md bg-ink-100 px-space-4">
            <Search size={20} color={colors.ink[500]} />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search trips"
              placeholderTextColor={colors.ink[500]}
              accessibilityLabel="Search trips"
              clearButtonMode="while-editing"
              returnKeyType="search"
              // A recycled view can carry the trip name's line height; this sends a paragraph
              // style without one (react-native#59132, [[Investigate_textinput-recycled-placeholder-others]])
              lineBreakModeIOS="tail"
              autoCorrect={false}
              className="h-full flex-1 text-ink-900"
              style={styles.searchTextStyle}
            />
          </View>

          {/* While the first read is pending, placeholders; after it, trips exist, so an empty list means the query matched none */}
          {listedTrips === undefined ? (
            <TripsLoading />
          ) : listedTrips.length === 0 ? (
            <TripsNoMatches query={query} />
          ) : (
            <>
              <TripsOngoingRow count={listedTrips.length} />
              <Animated.View
                className="flex-1"
                entering={FadeIn.duration(LIST_FADE_MS)}
              >
                <TripsList trips={listedTrips} />
              </Animated.View>
            </>
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

const styles = StyleSheet.create({
  searchTextStyle: {
    fontFamily: body.fontFamily,
    fontSize: body.fontSize,
  },
});
