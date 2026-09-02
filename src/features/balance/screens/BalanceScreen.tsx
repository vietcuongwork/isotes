import ProjectHeader from "@/components/ProjectHeader";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BalanceScreen() {
  const { projectName } = useLocalSearchParams<{ projectName: string }>();

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <View>
        <ProjectHeader title={projectName} />
      </View>
    </SafeAreaView>
  );
}
