import { Text, TextInput, View } from "react-native";

export default function AmountField() {
  return (
    <View className="bg-grey-965 flex-row items-baseline gap-1 px-5 py-3.5">
      <Text className="text-amount text-grey-400">$</Text>
      <TextInput
        className="text-hero-amount flex-1 text-grey-50"
        style={{ includeFontPadding: false }}
        placeholder="0.00"
      />
    </View>
  );
}
