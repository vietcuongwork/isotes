import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CreateProjectForm from "../components/CreateProjectForm";

export default function CreateProjectScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <View>
        {/* Header */}
        <View className="p-2 border border-b-[#f5a623]/25">
          <Text className="font-fraunces text-xl text-[#f0f0f0]">Isotes</Text>
        </View>
        {/* Content */}
        <View className="px-4 py-6 gap-6">
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
        </View>
      </View>
    </SafeAreaView>
  );
}
