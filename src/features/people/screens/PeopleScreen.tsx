import PersonRow from "@/features/people/components/PersonRow";
import usePeopleScreen from "@/features/people/hooks/usePeopleScreen";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PeopleScreen() {
  const { tripName, summaries, currency } = usePeopleScreen();

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={["top"]}>
      {/* Back */}
      <View className="px-space-5 pt-space-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          // NOTE - no token for the 44pt touch target, falling back to h-[44px] w-[44px]
          className="h-[44px] w-[44px] items-center justify-center rounded-pill bg-ink-100"
        >
          <ChevronLeft size={24} strokeWidth={1.75} color={colors.ink[900]} />
        </Pressable>
      </View>

      <ScrollView>
        <View className="gap-space-4 px-space-5 pb-space-8 pt-space-6">
          {/* Title */}
          <Text
            accessibilityRole="header"
            className="text-ink-900 text-display"
          >
            {tripName} <Text className="text-ink-400">people</Text>
          </Text>

          {/* Roster */}
          <View className="rounded-lg bg-card shadow-card">
            <View className="overflow-hidden rounded-lg">
              {summaries.map((person, index) => (
                <View
                  key={person.id}
                  className={cn(index > 0 && "border-t border-ink-100")}
                >
                  <PersonRow person={person} currency={currency} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
