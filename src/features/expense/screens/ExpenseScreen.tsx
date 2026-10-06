import TabScreenHeader from "@/components/header/TabScreenHeader";
import { colors } from "@/themes/color";
import { Plus, ReceiptText } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddExpenseBottomSheet from "../components/AddExpenseBottomSheet";
import ExpenseList from "../components/expenselist/ExpenseList";
import TripSummary from "../components/TripSummary";
import useExpenseScreen from "../hooks/useExpenseScreen";

export default function ExpenseScreen() {
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);
  const {
    transformedTrip: trip,
    transformedExpenses,
    transformedMembers,
  } = useExpenseScreen();

  return (
    <SafeAreaView className="flex-1 bg-grey-975">
      <TabScreenHeader />

      {trip && <TripSummary trip={trip} />}

      {!trip || transformedExpenses.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-[18px] px-10">
          {/* //NOTE - no token, 60px circle falls back to arbitrary size */}
          <View className="h-[60px] w-[60px] items-center justify-center rounded-pill border border-grey-815 bg-grey-925">
            <ReceiptText size={28} color={colors.grey[500]} />
          </View>
          <View className="items-center gap-2">
            <Text className="text-grey-50 text-title">No expenses yet</Text>
            <Text className="text-center text-grey-200 text-row">
              Log the first one and we&apos;ll work out who owes what.
            </Text>
          </View>
        </View>
      ) : (
        <ExpenseList
          expenses={transformedExpenses}
          members={transformedMembers}
          currency={trip.currency}
        />
      )}

      {/* Entry point */}
      <TouchableOpacity
        className="mb-4 items-center self-center rounded-pill bg-grey-50 p-4 shadow-fab"
        onPress={() => setAddExpenseOpen(true)}
      >
        <Plus size={20} color={colors.grey[975]} />
      </TouchableOpacity>
      {/* Modal sheet: renders above everything, wherever it sits in the tree */}
      <AddExpenseBottomSheet
        visible={isAddExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
      />
    </SafeAreaView>
  );
}
