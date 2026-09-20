import { Text, View } from "react-native";

export default function ExpenseSeparator() {
  return (
    <View className="flex-row justify-between">
      <Text className="text-grey-200 text-label">Today · Sat 31 Aug</Text>
      <Text className="text-grey-200 text-meta">$528.40</Text>
    </View>
  );
}
