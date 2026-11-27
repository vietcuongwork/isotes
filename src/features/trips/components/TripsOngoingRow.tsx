import SkeletonBone from "@/components/skeleton/SkeletonBone";
import { Text, View } from "react-native";

interface TripsOngoingRowProps {
  /** null while the first read is pending: a bone replaces the count */
  count: number | null;
}

// Pinned above the list: only the cards scroll
export default function TripsOngoingRow(props: TripsOngoingRowProps) {
  const { count } = props;

  return (
    <View className="flex-row justify-between px-space-5 pb-space-3 pt-space-6">
      <Text className="text-ink-500 text-micro">Ongoing</Text>
      {count === null ? (
        // NOTE - no token for the 48 x 10 count bar; its 3 margins fill the micro text's 16 line (10 + 3 + 3), falling back to arbitrary values
        <SkeletonBone className="my-[3px] h-[10px] w-[48px]" />
      ) : (
        <Text className="text-ink-500 text-micro">
          {count} {count === 1 ? "trip" : "trips"}
        </Text>
      )}
    </View>
  );
}
