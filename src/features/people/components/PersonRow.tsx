import Avatar from "@/components/Avatar";
import { TripCardState } from "@/domain/tripBalance";
import { formatExpenseCount, formatPersonNet } from "@/domain/tripFormat";
import { PersonSummary } from "@/features/people/helpers/peopleHelpers";
import { tabularNums } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { getInitial } from "@/utils/utils";
import { UserMinus } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { colors } from "@/themes/color";

interface PersonRowProps {
  person: PersonSummary;
  currency: Currency;
  isOpen: boolean;
  canRemove: boolean;
  onOpenChange: (open: boolean) => void;
  /** A tap on the row; the screen uses it to close an open row */
  onPress: () => void;
  onRemove: () => void;
}

// get, owe and square use the same text tokens as TripSummaryTiles
const TONE_TEXT: Record<Exclude<TripCardState, "empty">, string> = {
  get: "text-get-600",
  owe: "text-owe-600",
  square: "text-ink-500",
};

const PANEL_WIDTH = 88; // the People board's Remove panel
const FLICK = 500; // points per second, a chosen value: a flick opens or closes past the halfway rule

export default function PersonRow(props: PersonRowProps) {
  const {
    person,
    currency,
    isOpen,
    canRemove,
    onOpenChange,
    onPress,
    onRemove,
  } = props;

  const offset = useSharedValue(PANEL_WIDTH); // 88 hidden, 0 fully in
  const start = useSharedValue(PANEL_WIDTH);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  const { tone, amount, word } = formatPersonNet({
    net: person.net,
    expenseCount: person.expenseCount,
    decimalDigits: currency.decimalDigits,
    symbol: currency.symbol,
    isOwner: person.isOwner,
  });
  const count =
    person.expenseCount === 0
      ? "No expenses yet"
      : formatExpenseCount(person.expenseCount);
  const label = [
    person.name,
    count,
    tone === "empty" ? "" : `${amount} ${word}`,
  ]
    .filter(Boolean)
    .join(", ");

  const pan = Gesture.Pan()
    .enabled(canRemove)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      start.set(offset.get());
    })
    .onUpdate((event) => {
      // stops a long swipe at the panel
      offset.set(
        Math.min(PANEL_WIDTH, Math.max(0, start.get() + event.translationX)),
      );
    })
    .onEnd((event) => {
      const open =
        event.velocityX < -FLICK ||
        (event.velocityX <= FLICK && offset.get() < PANEL_WIDTH / 2);
      offset.set(withTiming(open ? 0 : PANEL_WIDTH));
      scheduleOnRN(onOpenChange, open);
    });

  useEffect(() => {
    offset.set(withTiming(isOpen ? 0 : PANEL_WIDTH));
  }, [isOpen, offset]);

  return (
    <View className="overflow-hidden">
      <GestureDetector gesture={pan}>
        <Pressable
          onPress={onPress}
          accessible
          accessibilityLabel={label}
          accessibilityActions={
            canRemove ? [{ name: "remove", label: "Remove" }] : undefined
          }
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "remove") onRemove();
          }}
          className="flex-row items-center gap-space-3 px-space-4 py-space-3"
        >
          {/* p-0 drops Avatar's 2px ring, so the disc is the board's 40 */}
          <Avatar
            label={getInitial(person.name)}
            color={person.memberColor}
            ringClassName="p-0"
            innerViewClassName="h-space-10 w-space-10"
            textClassName="text-initial-lg"
          />
          {/* //NOTE - no token for the 88pt Remove panel, falling back to mr-[88px] */}
          <View className={cn("min-w-0 flex-1", isOpen && "mr-[88px]")}>
            <Text className="text-ink-900 text-body" numberOfLines={1}>
              {person.name}
            </Text>
            <Text className="text-ink-500 text-caption">{count}</Text>
          </View>
          {tone !== "empty" && (
            <View className="items-end">
              <Text
                className={cn("text-amount", TONE_TEXT[tone])}
                style={tabularNums}
              >
                {amount}
              </Text>
              <Text className="text-ink-500 text-caption">{word}</Text>
            </View>
          )}
        </Pressable>
      </GestureDetector>

      {/* Remove: slides in over the row's right end; the row doesn't move */}
      <Animated.View
        style={panelStyle}
        // NOTE - no token for the 88pt panel width, falling back to w-[88px]
        className="absolute bottom-0 right-0 top-0 w-[88px]"
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
      >
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${person.name}`}
          className="flex-1 items-center justify-center gap-space-1 bg-owe-100"
        >
          <UserMinus size={20} strokeWidth={1.75} color={colors.owe[600]} />
          <Text className="text-owe-600 text-label">Remove</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
