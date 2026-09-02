import { colors } from "@/themes/color";
import { Menu } from "lucide-react-native";
import { Text, View } from "react-native";

export default function Header() {
  return (
    <View className="border-b-grey-825 flex-row justify-between border px-5 py-3.5">
      <Text className="text-title text-grey-50 font-outfit-semibold">
        Isotes
      </Text>
      <Menu color={colors.grey[200]} />
    </View>
  );
}
