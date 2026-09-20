import Avatar from "@/components/Avatar";
import { MemberColor } from "@/types/TExpense";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type AvatarData = {
  index: number;
  label: string;
  color: MemberColor;
};

const avatars: AvatarData[] = [
  { index: 0, label: "J", color: "honey" },
  { index: 1, label: "M", color: "olive" },
  { index: 2, label: "T", color: "coral" },
  { index: 3, label: "S", color: "sand" },
];

const AVATAR_STAGGER = 120;
const ANIMATION_DURATION = 400;
const CAPTION_DELAY =
  (avatars.length - 1) * AVATAR_STAGGER + ANIMATION_DURATION + 100;

const AnimatedStackAvatar = ({ index, label, color }: AvatarData) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    const delay = index * AVATAR_STAGGER;

    scale.value = withDelay(
      delay,
      withTiming(1, { duration: ANIMATION_DURATION }),
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: ANIMATION_DURATION }),
    );
  }, []);

  return (
    <Animated.View style={animatedStyle} className={index === 0 ? "" : "-ml-2"}>
      <Avatar label={label} color={color} />
    </Animated.View>
  );
};

export default function AvatarStack() {
  // const captionOpacity = useSharedValue(0);
  // const captionTranslate = useSharedValue(4);

  // useEffect(() => {
  //   captionOpacity.value = withDelay(
  //     CAPTION_DELAY,
  //     withTiming(1, { duration: ANIMATION_DURATION }),
  //   );
  //   captionTranslate.value = withDelay(
  //     CAPTION_DELAY,
  //     withTiming(0, { duration: ANIMATION_DURATION }),
  //   );
  // }, []);

  // const captionStyle = useAnimatedStyle(() => ({
  //   opacity: captionOpacity.value,
  //   transform: [{ translateY: captionTranslate.value }],
  // }));

  return (
    <View className="flex-row items-center bg-grey-900">
      {avatars.map((avatar) => (
        <AnimatedStackAvatar key={avatar.label} {...avatar} />
      ))}
      {/* <Animated.Text
        style={captionStyle}
        className="ml-4 font-outfit-regular text-base text-[#555555]"
      >
        Thousands of groups use SplitLite
      </Animated.Text> */}
    </View>
  );
}
