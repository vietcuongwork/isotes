import { Text, View } from "react-native";

interface TripsNoMatchesProps {
  query: string;
}

export default function TripsNoMatches(props: TripsNoMatchesProps) {
  return (
    <View className="gap-space-2 px-space-5 pt-space-6">
      <Text accessibilityRole="header" className="text-ink-900 text-heading">
        No trips match “{props.query.trim()}”
      </Text>
      <Text className="text-ink-700 text-body">
        Search looks at trip names. Check the spelling, or clear it to see every
        trip.
      </Text>
    </View>
  );
}
