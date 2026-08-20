import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

type AvatarData = {
  index: number;
  label: string;
  bg: string;
};

const avatars: AvatarData[] = [
  { index: 0, label: "J", bg: "bg-blue-500" },
  { index: 1, label: "M", bg: "bg-orange-400" },
  { index: 2, label: "T", bg: "bg-purple-400" },
  { index: 3, label: "S", bg: "bg-pink-500" },
];

const AVATAR_STAGGER = 130;
const ANIMATION_DURATION = 400;
const CAPTION_DELAY =
  (avatars.length - 1) * AVATAR_STAGGER + ANIMATION_DURATION + 100;

function AnimatedAvatar(props: AvatarData) {
  const { index, label, bg } = props;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withDelay(
      index * AVATAR_STAGGER,
      withTiming(1, { duration: ANIMATION_DURATION }),
    );
    opacity.value = withDelay(
      index * AVATAR_STAGGER,
      withTiming(1, { duration: ANIMATION_DURATION }),
    );
  }, []);

  return (
    <Animated.View
      style={animatedStyle}
      className={`w-10 h-10 rounded-full items-center justify-center border-2 border-[#0a0a0a] ${bg} ${
        index === 0 ? "" : "-ml-2"
      }`}
    >
      <Text className="font-outfit-bold text-xs text-[#0a0a0a]">{label}</Text>
    </Animated.View>
  );
}

export default function AvatarStack() {
  const captionOpacity = useSharedValue(0);
  const captionTranslate = useSharedValue(4);

  useEffect(() => {
    captionOpacity.value = withDelay(
      CAPTION_DELAY,
      withTiming(1, { duration: ANIMATION_DURATION }),
    );
    captionTranslate.value = withDelay(
      CAPTION_DELAY,
      withTiming(0, { duration: ANIMATION_DURATION }),
    );
  }, []);

  const captionStyle = useAnimatedStyle(() => ({
    opacity: captionOpacity.value,
    transform: [{ translateY: captionTranslate.value }],
  }));

  return (
    <View className="flex-row items-center bg-[#0a0a0a]">
      {avatars.map((a, i) => (
        <AnimatedAvatar key={`${i}-${a.label}`} {...a} />
      ))}
      <Animated.Text
        style={captionStyle}
        className="font-outfit-regular text-base text-[#555555] ml-4"
      >
        Thousands of groups use SplitLite
      </Animated.Text>
    </View>
  );
}
