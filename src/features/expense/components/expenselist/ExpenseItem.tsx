import { colors } from "@/themes/color";
import { BedDouble } from "lucide-react-native";
import { Text, View } from "react-native";

export default function ExpenseItem() {
  return (
    <View className="flex-row items-center justify-between rounded-btn bg-grey-925 p-3.5">
      {/* Left cluster */}
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-pill bg-orange-850 ">
          <BedDouble size={16} color={colors.orange[400]} />
        </View>
        <View>
          <Text className="text-grey-50 text-body">Hotel Alba · 3 nights</Text>
          <Text className="text-grey-200 text-meta">You paid</Text>
        </View>
      </View>

      <View>
        <Text className="text-grey-50 text-body">$420.00</Text>
        <Text className="text-green-400 text-label">you lent 315</Text>
      </View>
    </View>
  );
}
