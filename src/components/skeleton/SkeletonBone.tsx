import { useSkeletonOpacity } from "@/components/skeleton/SkeletonProvider";
import { cn } from "@/utils/cn";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

interface SkeletonBoneProps {
  /** Size, margin and radius, merged over the default 8 radius */
  className?: string;
}

// One grey placeholder bar. Hidden from VoiceOver: the block that holds the
// bones carries the "Loading ..." label.
export default function SkeletonBone(props: SkeletonBoneProps) {
  const { className } = props;
  const opacity = useSkeletonOpacity();
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // cn doesn't know the custom `rounded-pill`, so a caller's radius would
      // not replace the default; skip the default when one is passed
      className={cn(
        "bg-ink-100",
        !className?.includes("rounded-") && "rounded-sm",
        className,
      )}
      style={animatedStyle}
    />
  );
}
