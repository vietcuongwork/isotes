import { colors } from "@/themes/color";
import { History } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface RestoredDraftBannerProps {
  onStartOver: () => void;
}

export default function RestoredDraftBanner(props: RestoredDraftBannerProps) {
  const { onStartOver } = props;

  return (
    <View className="px-space-5 pt-space-3">
      {/* NOTE - no token for the 48pt minimum height, falling back to min-h-[48px] (the board's banner) */}
      <View
        role="status"
        className="min-h-[48px] flex-row items-center gap-space-2 rounded-md bg-ink-50 pl-space-3 pr-space-1"
      >
        <History size={20} color={colors.ink[700]} />
        {/* NOTE - the board draws the text at 14/20 weight 400, which has no role: snapped to label (weight 500) */}
        <Text className="flex-1 text-ink-700 text-label">
          Picked up where you left off
        </Text>
        {/* NOTE - no token for the 44pt tap target, falling back to h-[44px] (the board's) */}
        <Pressable
          onPress={onStartOver}
          accessibilityRole="button"
          accessibilityLabel="Start over"
          className="h-[44px] justify-center"
        >
          {/* NOTE - no token for the 32pt chip height, falling back to h-[32px] (the board's chip) */}
          <View className="h-[32px] justify-center rounded-sm bg-ink-100 px-space-3">
            <Text className="text-ink-900 text-label">Start over</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
