import ExpenseDayCard from "@/features/expense/components/ExpenseDayCard";
import ExpenseEmpty from "@/features/expense/components/ExpenseEmpty";
import TripHeader from "@/features/expense/components/TripHeader";
import TripPeopleRow from "@/features/expense/components/TripPeopleRow";
import TripSummaryTiles from "@/features/expense/components/TripSummaryTiles";
import {
  getTripSummary,
  groupExpensesByDay,
} from "@/features/expense/helpers/tripHomeHelpers";
import { useTripDrawerStore } from "@/stores/useTripDrawerStore";
import { colors } from "@/themes/color";
import { useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Menu, Plus } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddExpenseBottomSheet from "../components/AddExpenseBottomSheet";
import useExpenseScreen from "../hooks/useExpenseScreen";

function DaySeparator() {
  return <View className="h-space-5" />;
}

export default function ExpenseScreen() {
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);
  const openDrawer = useTripDrawerStore((state) => state.open);
  const {
    transformedTrip: trip,
    transformedExpenses,
    transformedMembers,
  } = useExpenseScreen();
  // StatusBar props merge in mount order and Trips stays mounted under this
  // screen, so dark text is rendered only while the tab is on top
  const isFocused = useIsFocused();
  const days = groupExpensesByDay(transformedExpenses);
  const viewerMemberId =
    transformedMembers.find((member) => member.isOwner)?.id ?? "";
  const now = new Date();

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-ink-50">
      {isFocused && <StatusBar style="dark" />}

      {/* Menu row, fixed while the list scrolls */}
      <View className="px-space-5">
        {/* //NOTE - no token for the 44pt touch target, falling back to h-[44px] w-[44px] */}
        {/* //NOTE - no token for 10, falling back to -ml-[10px]: (44 target − 24 icon) / 2 lines the icon up with the gutter */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={openDrawer}
          className="-ml-[10px] h-[44px] w-[44px] items-center justify-center"
        >
          <Menu size={24} color={colors.ink[900]} />
        </Pressable>
      </View>

      {/* Waits for the trip, so the empty state can't flash while loading */}
      {trip && (
        <FlatList
          data={days}
          keyExtractor={(day) => day.dateId}
          renderItem={({ item: day }) => (
            <ExpenseDayCard
              day={day}
              members={transformedMembers}
              viewerMemberId={viewerMemberId}
              currency={trip.currency}
              now={now}
            />
          )}
          ListHeaderComponent={
            <View className="gap-space-5 pb-space-5">
              <TripHeader trip={trip} now={now} />
              <TripPeopleRow members={transformedMembers} />
              <TripSummaryTiles
                summary={getTripSummary(
                  transformedExpenses,
                  viewerMemberId,
                  trip.currency.decimalDigits,
                )}
                currency={trip.currency}
              />
            </View>
          }
          ListEmptyComponent={ExpenseEmpty}
          ItemSeparatorComponent={DaySeparator}
          // NOTE - no token for 120 (64 tab bar + 32 bottom offset + 24 space-6), falling back to pb-[120px]
          contentContainerClassName="grow px-space-5 pb-[120px] pt-space-3"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Docked FAB (fab-docked, 64): in the 76 the tab bar leaves on this route, level with it */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        className="absolute bottom-space-8 right-space-5 h-space-16 w-space-16 items-center justify-center rounded-pill bg-ink-900 shadow-lifted"
        onPress={() => setAddExpenseOpen(true)}
      >
        <Plus size={24} color={colors.card} />
      </Pressable>
      {/* Modal sheet: renders above everything, wherever it sits in the tree */}
      <AddExpenseBottomSheet
        visible={isAddExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
      />
    </SafeAreaView>
  );
}
