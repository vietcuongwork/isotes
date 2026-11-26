import SkeletonBone from "@/components/skeleton/SkeletonBone";
import { cn } from "@/utils/cn";
import { View } from "react-native";

interface TripCardSkeletonProps {
  /** Width of the name bar as a percent string, e.g. "64%" */
  nameWidth: `${number}%`;
}

// NOTE - no token for the bar sizes below (board C, C-Pulse): 16 and 12 tall
// text bars with the margins that stand in for their line heights, falling
// back to arbitrary values
const NAME_BAR = "h-[16px] my-[6px]";
const CAPTION_BAR = "h-[12px] my-space-1 w-2/5";
// NOTE - no token for the foot bars (40 x 10, 88 x 14, 136 x 28), falling back to arbitrary values
const LABEL_BAR = "h-[10px] w-[40px] my-[3px]";
const AMOUNT_BAR = "h-[14px] w-[88px] my-[5px]";
const BADGE_BAR = "h-[28px] w-[136px] rounded-pill";
const DISC_BAR = "h-space-8 w-space-8 rounded-pill";
// NOTE - no token for the 2pt ring, falling back to p-[2px] (as in TripAvatarStack)
const DISC_RING = "rounded-full bg-card p-[2px]";

// Three discs overlapping by 8, as TripAvatarStack draws them
function AvatarStackSkeleton() {
  return (
    <View className="flex-row">
      {[0, 1, 2].map((index) => (
        <View key={index} className={cn(DISC_RING, index > 0 && "-ml-space-2")}>
          <SkeletonBone className={DISC_BAR} />
        </View>
      ))}
    </View>
  );
}

// TripCard's shape drawn in bones; not pressable and hidden from VoiceOver
// along with its bones (the loading block carries the label)
export default function TripCardSkeleton(props: TripCardSkeletonProps) {
  const { nameWidth } = props;

  return (
    <View className="gap-space-4 rounded-lg bg-card p-space-4 shadow-card">
      {/* Name, date and people */}
      <View className="flex-row items-start justify-between gap-space-3">
        <View className="flex-1 gap-space-1">
          <View style={{ width: nameWidth }}>
            <SkeletonBone className={NAME_BAR} />
          </View>
          <SkeletonBone className={CAPTION_BAR} />
        </View>
        <AvatarStackSkeleton />
      </View>

      {/* Spent and position */}
      <View className="flex-row items-center justify-between border-t border-ink-100 pt-space-3">
        <View>
          <SkeletonBone className={LABEL_BAR} />
          <SkeletonBone className={AMOUNT_BAR} />
        </View>
        <SkeletonBone className={BADGE_BAR} />
      </View>
    </View>
  );
}
