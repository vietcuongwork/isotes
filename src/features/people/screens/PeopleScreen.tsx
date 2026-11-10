import AddPerson from "@/components/addPerson/AddPerson";
import { canRemovePerson } from "@/features/people/helpers/peopleHelpers";
import PersonRow from "@/features/people/components/PersonRow";
import usePeopleScreen from "@/features/people/hooks/usePeopleScreen";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { router } from "expo-router";
import { ChevronLeft, ChevronsLeft } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PeopleScreen() {
  const {
    tripName,
    summaries,
    currency,
    openRowId,
    handleOpenChange,
    closeOpenRow,
    showSwipeHint,
    handleRemove,
  } = usePeopleScreen();

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

      <ScrollView onScrollBeginDrag={closeOpenRow}>
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
                  <PersonRow
                    person={person}
                    currency={currency}
                    isOpen={openRowId === person.id}
                    canRemove={canRemovePerson(person)}
                    onOpenChange={(open) => handleOpenChange(person.id, open)}
                    onPress={closeOpenRow}
                    onRemove={() => handleRemove(person.id)}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Add person */}
          {/* //NOTE - no token for the 52pt row height, falling back to min-h-[52px] */}
          <AddPerson
            rowClassName="min-h-[52px] rounded-lg px-space-4"
            onPress={closeOpenRow}
          />

          {/* Swipe hint */}
          {showSwipeHint && (
            <View className="flex-row items-center gap-space-2 px-space-1">
              <ChevronsLeft
                size={20}
                strokeWidth={1.75}
                color={colors.ink[500]}
              />
              <Text className="flex-1 text-ink-500 text-caption">
                Swipe left on someone with no expenses to remove them
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
