import TabScreenHeader from "@/components/TabScreenHeader";
import { colors } from "@/themes/color";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { Plus } from "lucide-react-native";
import { useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddExpenseBottomSheet from "../components/AddExpenseBottomSheet";
import AddDateBottomSheet from "../components/date/AddDateBottomSheet";

export default function ExpenseScreen() {
  const addExpenseSheetRef = useRef<BottomSheetModal>(null);
  const addDateSheetRef = useRef<BottomSheetModal>(null);

  const { projectName } = useLocalSearchParams<{ projectName: string }>();

  return (
    <SafeAreaView className="flex-1 bg-grey-975">
      <View>
        {/* Header */}
        <TabScreenHeader />

        {/* //TODO - refine later */}
        <TouchableOpacity
          className="items-center self-center rounded-pill bg-grey-50 p-4"
          onPress={() => addExpenseSheetRef.current?.present()}
        >
          <Plus size={20} color={colors.grey[975]} />
        </TouchableOpacity>

        <AddExpenseBottomSheet
          onDatePress={() => addDateSheetRef.current?.present()}
          ref={addExpenseSheetRef}
        />
        <AddDateBottomSheet ref={addDateSheetRef} />
      </View>
    </SafeAreaView>
  );
}
