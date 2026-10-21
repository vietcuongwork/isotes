import { formatSwitcherMeta } from "@/features/expense/helpers/tripHomeHelpers";
import {
  getTripCardState,
  TripCardState,
} from "@/features/trips/helpers/tripsHelpers";
import { colors } from "@/themes/color";
import { tabularNums } from "@/themes/typography";
import { TripCardData } from "@/types/TTrips";
import { cn } from "@/utils/cn";
import { formatDisplayAmount } from "@/utils/currency";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface TripSwitcherItemProps {
  data: TripCardData;
  isCurrent: boolean;
  onPress: () => void;
}

type PositionState = Exclude<TripCardState, "empty">;

const POSITION_TEXT_CLASSES = {
  get: "text-get-600",
  owe: "text-owe-600",
  square: "text-shine-700",
} satisfies Record<PositionState, string>;

function getPositionText(state: PositionState, amount: string): string {
  switch (state) {
    case "get":
      return `You get back ${amount}`;
    case "owe":
      return `You owe ${amount}`;
    case "square":
      return "All square";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export default function TripSwitcherItem(props: TripSwitcherItemProps) {
  const { data, isCurrent, onPress } = props;
  const { trip, members, expenseCount, balance } = data;
  const { code, symbol, decimalDigits } = trip.currency;
  const state = getTripCardState({ expenseCount, balance, decimalDigits });
  const meta = formatSwitcherMeta(code, members.length, expenseCount);
  // A trip with nothing logged shows no position, so it doesn't read as settled
  const position =
    state === "empty"
      ? null
      : {
          state,
          text: getPositionText(
            state,
            formatDisplayAmount(Math.abs(balance), symbol, decimalDigits),
          ),
        };

  return (
    // NOTE - no token for the 44pt touch target, falling back to min-h-[44px]
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isCurrent }}
      accessibilityLabel={[trip.name, meta, position?.text]
        .filter(Boolean)
        .join(", ")}
      className={cn(
        "min-h-[44px] flex-row items-center gap-space-3 rounded-md px-space-3 py-space-2",
        isCurrent && "bg-shine-100",
      )}
    >
      {/* Name, meta and position */}
      <View className="flex-1">
        <Text className="text-ink-900 text-body">{trip.name}</Text>
        <Text className="text-ink-500 text-caption">{meta}</Text>
        {position && (
          <Text
            style={tabularNums}
            className={cn(
              "mt-space-1 text-label",
              POSITION_TEXT_CLASSES[position.state],
            )}
          >
            {position.text}
          </Text>
        )}
      </View>
      {isCurrent && <Check size={20} color={colors.shine[700]} />}
    </Pressable>
  );
}
