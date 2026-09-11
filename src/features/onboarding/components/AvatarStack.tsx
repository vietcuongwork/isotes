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
  { index: 0, label: "J", bg: "bg-orange-400" },
  { index: 1, label: "M", bg: "bg-green-400" },
  { index: 2, label: "T", bg: "bg-red-400" },
  { index: 3, label: "S", bg: "bg-orange-200" },
];

const AVATAR_STAGGER = 100;
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
    // ring wrapper (static)
    <View
      className={`rounded-full bg-grey-900 p-0.5 ${index === 0 ? "" : "-ml-2"}`}
    >
      <Animated.View
        style={animatedStyle}
        className={`h-7 w-7 items-center justify-center overflow-hidden rounded-pill ${bg}`}
      >
        <Text className="text-initial-loose text-center text-grey-900">
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

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
      {avatars.map((a, i) => (
        <AnimatedAvatar key={`${i}-${a.label}`} {...a} />
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
