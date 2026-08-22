import Button from "@/components/Button";
import { EXPO_ROUTER } from "@/navigation/route";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AvatarStack from "../components/AvatarStack";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleNavigation = () => {
    router.push(EXPO_ROUTER.CREATE_PROJECT);
  };
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <View>
        {/* Header */}
        <View className="border border-b-[#f5a623]/25 p-2">
          <Text className="font-fraunces text-xl text-[#f0f0f0]">Isotes</Text>
        </View>
        {/* Content */}
        <View className="gap-6 px-4 py-6">
          <View className="self-start rounded-3xl border border-[#f5a623] bg-[#f5a623]/10 px-2 py-1">
            <Text className="font-outfit-semibold text-sm tracking-widest text-[#f5a623]">
              NO ACCOUNT NEEDED
            </Text>
          </View>

          <View className="gap-2">
            <Text className="font-fraunces text-6xl text-[#f0f0f0]">Split</Text>
            <Text className="font-fraunces text-6xl text-[#f5a623]">
              Travel
            </Text>
            <Text className="font-fraunces text-6xl text-[#f5a623]">
              expenses
            </Text>
            <Text className="font-fraunces text-6xl text-[#f0f0f0]">
              in Minutes.
            </Text>
          </View>

          <View className="max-w-[80%]">
            <Text className="font-outfit-regular text-lg text-[#666666]">
              Tired of splitting bills? Create a project, add expenses, and
              we'll figure out who owes what.
            </Text>
          </View>

          <View className="gap-6">
            <Button
              onPress={handleNavigation}
              buttonText={"Create a project   →"}
            />

            <View>
              <Text className="font-outfit-regular text-lg text-[#555555]">
                Learn more →
              </Text>
            </View>

            <AvatarStack />
          </View>

          <View className="gap-4">
            <Text className="font-outfit-semibold text-sm tracking-widest text-[#444444]">
              HOW IT WORKS
            </Text>

            <View className="flex-row items-center gap-4">
              <View className="h-8 w-8 items-center justify-center rounded-full border border-[#f5a623] bg-[#f5a623]/10 ">
                <Text className="font-outfit-bold text-sm text-[#f5a623]">
                  1
                </Text>
              </View>
              <Text className="font-outfit-regular text-base text-[#888888]">
                Create a project and name it
              </Text>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="h-8 w-8 items-center justify-center rounded-full border border-[#f5a623] bg-[#f5a623]/10 ">
                <Text className="font-outfit-bold text-sm text-[#f5a623]">
                  2
                </Text>
              </View>
              <Text className="font-outfit-regular text-base text-[#888888]">
                Add members and log expenses
              </Text>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="h-8 w-8 items-center justify-center rounded-full border border-[#f5a623] bg-[#f5a623]/10 ">
                <Text className="font-outfit-bold text-sm text-[#f5a623]">
                  3
                </Text>
              </View>
              <Text className="font-outfit-regular text-base text-[#888888]">
                See who owes what, instantly
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
