import Button from "@/components/Button";
import Header from "@/components/header/Header";
import { EXPO_ROUTER } from "@/navigation/route";
import { colors } from "@/themes/color";
import { useRouter } from "expo-router";
import { Link2 } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TripList from "../components/TripList";
import { HOW_IT_WORKS_STEPS } from "../constants";

interface StepListItemProps {
  index: number;
  label: string;
}
const StepListItem = (props: StepListItemProps) => {
  const { label, index } = props;
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-9 w-9 items-center justify-center rounded-pill border border-orange-700 bg-orange-800">
        <Text className="text-orange-400 text-label">{index}</Text>
      </View>
      <Text className="text-grey-200 text-body">{label}</Text>
    </View>
  );
};
export default function OnboardingScreen() {
  const router = useRouter();

  const handleNavigation = () => {
    router.push(EXPO_ROUTER.CREATE_TRIP);
  };

  return (
    <SafeAreaView className="flex-1 bg-grey-975">
      <ScrollView>
        {/* Header */}
        <Header />
        {/* Content */}
        <View>
          <View className="gap-4 px-5 pt-8">
            {/* Hero block */}
            <View className="self-start rounded-pill border border-orange-700 bg-orange-800 px-4 py-1.5">
              <Text className="text-orange-400 text-micro">
                NO ACCOUNT NEEDED
              </Text>
            </View>

            <View className="pt-2">
              <Text className="text-grey-50 text-hero">Split</Text>
              <Text className="text-orange-400 text-hero">Travel</Text>
              <Text className="text-orange-400 text-hero">expenses</Text>
              <Text className="text-grey-50 text-hero">in Minutes.</Text>
            </View>

            <View className="max-w-[80%]">
              <Text className="text-grey-200 text-body">
                Start a trip, add expenses as they happen, and we'll work out
                who owes what.
              </Text>
            </View>
          </View>

          {/* Button block */}
          <View className="gap-4 px-5 pt-8">
            <Button
              onPress={handleNavigation}
              buttonText="Start your first trip"
            />

            <View className="flex-row items-center gap-2 self-center">
              <Link2 size={18} color={colors.orange[400]} />
              <Text className="text-orange-400 text-body">
                or join one with a link
              </Text>
            </View>
          </View>

          <View className="px-5">
            <TripList />
          </View>

          {/* How it works block */}
          <View className="gap-5 px-5 py-11">
            <Text className="text-grey-500 text-micro">HOW IT WORKS</Text>

            {HOW_IT_WORKS_STEPS.map((label, i) => (
              <StepListItem key={label} index={i + 1} label={label} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
