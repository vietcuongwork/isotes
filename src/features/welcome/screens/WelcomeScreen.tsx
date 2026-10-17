import Raven from "@/components/Raven";
import { EXPO_ROUTER } from "@/navigation/route";
import { colors } from "@/themes/color";
import { useIsFocused, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();
  // StatusBar props merge in mount order and a pushed screen keeps this one
  // mounted, so dark text is rendered only while Welcome is on top.
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={["top"]}>
      {isFocused && <StatusBar style="dark" />}
      {/* Scrolls only when Dynamic Type outgrows the screen */}
      <ScrollView
        contentContainerClassName="grow px-space-5 pt-space-4"
        // bottom inset inside the content, so the ScrollView (it clips) reaches
        // the screen edge and can't cut the arrow's shadow short on screen.
        // NOTE - no token in a style sum, falling back to 16 (space-4)
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Raven area: takes the height the copy leaves */}
        <View className="flex-1 items-center justify-center">
          {/* //NOTE - no token for an illustration height, falling back to 176 (board) */}
          <Raven pose="relaxed" height={176} />
        </View>

        {/* Copy and actions */}
        <View className="gap-space-4">
          <Text className="text-ink-500 text-micro">
            No account · no paywall · stays on this phone
          </Text>
          <Text className="text-ink-900 text-display">
            Split the trip,{" "}
            <Text className="text-ink-400">not the friendship</Text>
          </Text>
          <Text className="text-ink-700 text-body">
            Add the people, log what you spend, and the raven works out who owes
            whom.
          </Text>

          <View className="flex-row items-center justify-between gap-space-4 pt-space-4">
            {/* //NOTE - no token for the 44pt touch target, falling back to min-h-[44px] */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(EXPO_ROUTER.TRIPS)}
              // shrinks so large Dynamic Type wraps the label, not pushes the arrow off
              className="min-h-[44px] shrink justify-center"
            >
              {/* //NOTE - no token for a text button label; amount has the same spec (Outfit 500 16/24) */}
              <Text className="text-ink-700 text-amount">
                {"I've used it before"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start your first trip"
              onPress={() => router.push(EXPO_ROUTER.CREATE_TRIP)}
              className="h-space-16 w-space-16 items-center justify-center rounded-pill bg-ink-900 shadow-lifted"
            >
              <ChevronRight size={24} strokeWidth={1.75} color={colors.card} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
