import { Text, View } from "react-native";

interface ExpenseSeparatorProps {
  label: string;
  total: string;
}

export default function ExpenseSeparator({
  label,
  total,
}: ExpenseSeparatorProps) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-grey-200 text-label">{label}</Text>
      <Text className="text-grey-200 text-meta">{total}</Text>
    </View>
  );
}
