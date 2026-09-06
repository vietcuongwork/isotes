import { Text, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

export default function AmountField() {
  return (
    <View className="flex-row items-center gap-1 px-5 py-3.5">
      <Text className="font-outfit-light "></Text>
      <TextInput />
    </View>
  );
}
