import { colors } from "@/themes/color";
import { Ellipsis, Menu, Share } from "lucide-react-native";
import { Text, View } from "react-native";

export default function TabScreenHeader() {
  return (
    <View className="flex-row items-center justify-between px-5 py-3.5">
      <Menu color={colors.grey[200]} />
      <View className="flex-row gap-2">
        <View className="flex-row items-center gap-stack rounded-pill border border-orange-700 bg-orange-800 px-3.5">
          <Share size={16} color={colors.orange[400]} />
          <Text className="text-label text-orange-400">Share</Text>
          <View className="border-l border-l-orange-700 pl-2">
            <Text className="text-label text-orange-300">4 joined</Text>
          </View>
        </View>

        <View className="h-[38px] w-[38px] items-center justify-center rounded-pill border border-grey-800 bg-grey-900">
          <Ellipsis size={16} color={colors.grey[200]} />
        </View>
      </View>
    </View>
  );
}
