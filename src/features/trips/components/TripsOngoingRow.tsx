import { Text, View } from "react-native";

interface TripsOngoingRowProps {
  count: number;
}

// Pinned above the list: only the cards scroll
export default function TripsOngoingRow(props: TripsOngoingRowProps) {
  const { count } = props;

  return (
    <View className="flex-row justify-between px-space-5 pb-space-3 pt-space-6">
      <Text className="text-ink-500 text-micro">Ongoing</Text>
      <Text className="text-ink-500 text-micro">
        {count} {count === 1 ? "trip" : "trips"}
      </Text>
    </View>
  );
}
