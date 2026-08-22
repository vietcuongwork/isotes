import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CreateProjectForm from "../components/CreateProjectForm";

export default function CreateProjectScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <View>
        {/* Header */}
        <View className="border border-b-[#f5a623]/25 p-2">
          <Text className="font-fraunces text-xl text-[#f0f0f0]">Isotes</Text>
        </View>
        {/* Content */}
        <View className="gap-10 px-4 py-6">
          <View className="gap-4">
            <Text className="font-fraunces text-4xl text-[#f0f0f0]">
              Create a new split
            </Text>
            <Text className="font-outfit-regular text-base text-[#555555]">
              Don't worry, you can edit details later.
            </Text>
          </View>

          {/* Form */}
          <CreateProjectForm />

          <View className="flex-row gap-2 rounded-xl border border-[#1e1e1e] bg-[#111111] p-4">
            <Text>👥</Text>
            <Text className="max-w-[95%] font-outfit-regular text-base text-[#777777]">
              Add people when you record your first expense — no pre-setup
              needed.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
