import Avatar from "@/components/Avatar";
import Raven from "@/components/Raven";
import { TripCardState } from "@/domain/tripBalance";
import { formatExpenseCount } from "@/domain/tripFormat";
import usePersonScreen from "@/features/people/hooks/usePersonScreen";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { getInitial } from "@/utils/utils";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// get, owe and square badge tones; square is the board's shine pair
const BADGE_CLASS: Record<Exclude<TripCardState, "empty">, string> = {
  get: "bg-get-100 text-get-600",
  owe: "bg-owe-100 text-owe-600",
  square: "bg-shine-100 text-shine-700",
};

export default function PersonScreen() {
  const { person, rows, badge, tone } = usePersonScreen();

  if (!person) return null; // the hook's effect goes back to People

  const { name, isOwner, expenseCount } = person;
  const count =
    expenseCount === 0 ? "No expenses yet" : formatExpenseCount(expenseCount);

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

      {/* Top */}
      <View className="items-center gap-space-2 px-space-5 pt-space-4">
        <Avatar
          label={getInitial(name)}
          color={person.memberColor}
          ringClassName="p-0"
          innerViewClassName="h-space-16 w-space-16"
          textClassName="text-initial-xl"
        />
        <Text
          accessibilityRole="header"
          className="text-center text-ink-900 text-title"
        >
          {name}
        </Text>
        <View className="flex-row items-center gap-space-2">
          <Text className="text-ink-500 text-caption">{count}</Text>
          {badge !== null && tone !== "empty" && (
            // NOTE - no token for the badge's 2pt vertical padding, falling back to py-[2px]
            <View
              className={cn(
                "rounded-pill px-space-3 py-[2px]",
                BADGE_CLASS[tone],
              )}
            >
              <Text className={cn("text-label", BADGE_CLASS[tone])}>
                {badge}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-space-5 pb-space-8 pt-space-6"
      >
        {rows.length === 0 ? (
          /* Empty */
          <View className="gap-space-2">
            <Text className="text-ink-900 text-label">
              Not in any expense yet
            </Text>
            <Text className="text-ink-500 text-caption">
              {isOwner
                ? "Expenses you're part of show up here."
                : `Expenses ${name} is part of show up here.`}
            </Text>
            {/* NOTE - no token for the raven's 96pt height and -20 right lean (board) */}
            <View className="-mr-[20px] self-end">
              <Raven pose="peeking" height={96} />
            </View>
          </View>
        ) : (
          <>
            {/* List header */}
            <View className="flex-row justify-between px-space-1 pb-space-2">
              <Text className="text-ink-500 text-micro">Expenses</Text>
              <Text className="text-ink-500 text-micro">
                {isOwner ? "Your share" : "Their share"}
              </Text>
            </View>

            {/* Expenses */}
            <View className="rounded-lg bg-card px-space-4 shadow-card">
              {rows.map((row, index) => (
                <View
                  key={row.id}
                  accessible
                  accessibilityLabel={`${row.title}, ${row.meta}, ${row.share}`}
                  className={cn(
                    "flex-row items-center gap-space-3 py-space-3",
                    index > 0 && "border-t border-ink-100",
                  )}
                >
                  <View className="min-w-0 flex-1">
                    <Text className="text-ink-900 text-body" numberOfLines={1}>
                      {row.title}
                    </Text>
                    <Text className="text-ink-500 text-caption">
                      {row.meta}
                    </Text>
                  </View>
                  <Text className="text-ink-900 text-amount">{row.share}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
