import Raven from "@/components/Raven";
import { Text, View } from "react-native";

// Centred between the header (24 below it) and the pill, as on the Trips: no trips board
export default function TripsEmpty() {
  return (
    // NOTE - no token for 136 (56 pill + 40 bottom offset + 40 space-10), falling back to pb-[136px]
    <View className="flex-1 items-center justify-center gap-space-4 px-space-5 pb-[136px] pt-space-6">
      {/* 134 tall fills the board's 200 × 140 box at the pose's 433/291 aspect */}
      <Raven pose="sleeping" height={134} />
      <Text accessibilityRole="header" className="text-ink-900 text-title">
        No trips yet
      </Text>
      {/* //NOTE - no token for the board's 280pt text width, falling back to max-w-[280px] */}
      <Text className="max-w-[280px] text-center text-ink-700 text-body">
        Start a trip, add who&apos;s coming, and log what you spend as you go.
      </Text>
    </View>
  );
}
