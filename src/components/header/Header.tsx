import { colors } from "@/themes/color";
import { Menu } from "lucide-react-native";
import { Text, View } from "react-native";

export default function Header() {
  return (
    <View className="flex-row justify-between border border-b-grey-825 px-5 py-3.5">
      <Text className="text-title-semibold text-grey-50">Isotes</Text>
      <Menu color={colors.grey[200]} />
    </View>
  );
}
