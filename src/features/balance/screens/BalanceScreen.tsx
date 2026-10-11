import TabScreenHeader from "@/components/header/TabScreenHeader";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BalanceScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <View>
        <TabScreenHeader />
      </View>
    </SafeAreaView>
  );
}
