import Chip from "@/components/Chip";
import { colors } from "@/themes/color";
import { History } from "lucide-react-native";
import { Text, View } from "react-native";

interface RestoredDraftBannerProps {
  onStartOver: () => void;
}

export default function RestoredDraftBanner(props: RestoredDraftBannerProps) {
  const { onStartOver } = props;

  return (
    <View className="px-5 pb-3.5">
      <View className="flex-row items-center gap-2 rounded-row border border-grey-825 bg-grey-960 px-3 py-2.5">
        <History size={18} color={colors.grey[200]} />
        <Text className="flex-1 text-grey-300 text-meta">
          Picked up where you left off
        </Text>
        <Chip label="Start over" onPress={onStartOver} />
      </View>
    </View>
  );
}
