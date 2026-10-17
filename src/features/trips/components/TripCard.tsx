import TripAvatarStack from "@/features/trips/components/TripAvatarStack";
import {
  formatTripCreatedDate,
  formatTripDateLine,
  getTripCardState,
  TripCardState,
} from "@/features/trips/helpers/tripsHelpers";
import { TripCardData } from "@/types/TTrips";
import { cn } from "@/utils/cn";
import { formatDisplayAmount } from "@/utils/currency";
import { Pressable, Text, TextStyle, View } from "react-native";

// css-interop 0.2.6 has no case for font-variant-numeric, so the tabular-nums
// class compiles to nothing. why: [[Learn_react-native_nativewind-tabular-nums]]
const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };

interface TripCardProps {
  data: TripCardData;
  onPress: () => void;
}

export default function TripCard(props: TripCardProps) {
  const { data, onPress } = props;
  const { trip, members, totalAmount, expenseCount, balance } = data;
  const { code, symbol, decimalDigits } = trip.currency;
  const state = getTripCardState({ expenseCount, balance, decimalDigits });
  const now = new Date();
  const spent = formatDisplayAmount(totalAmount, symbol, decimalDigits);
  // A trip with nothing logged shows no badge, so it doesn't read as settled
  const badge =
    state === "empty"
      ? null
      : {
          state,
          text: getBadgeText(
            state,
            formatDisplayAmount(Math.abs(balance), symbol, decimalDigits),
          ),
        };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        trip.name,
        `created ${formatTripCreatedDate(trip.createdAt, now)}`,
        code,
        formatPeopleCount(members.length),
        `spent ${spent}`,
        badge?.text ?? "no expenses yet",
      ].join(", ")}
      className="gap-space-4 rounded-lg bg-card p-space-4 shadow-card"
    >
      {/* Name, date and people */}
      <View className="flex-row items-start justify-between gap-space-3">
        <View className="flex-1 gap-space-1">
          <Text numberOfLines={2} className="text-ink-900 text-heading">
            {trip.name}
          </Text>
          <Text className="text-ink-500 text-caption">
            {formatTripDateLine(trip.createdAt, code, now)}
          </Text>
        </View>
        <TripAvatarStack members={members} />
      </View>

      {/* Spent and position */}
      <View className="flex-row items-center justify-between border-t border-ink-100 pt-space-3">
        <View>
          <Text className="text-ink-500 text-micro">Spent</Text>
          <Text style={TABULAR_NUMS} className="text-ink-900 text-amount">
            {spent}
          </Text>
        </View>
        {badge && <TripStatusBadge state={badge.state} text={badge.text} />}
      </View>
    </Pressable>
  );
}

type BadgeState = Exclude<TripCardState, "empty">;

const BADGE_CLASSES = {
  get: { box: "bg-get-100", text: "text-get-600" },
  owe: { box: "bg-owe-100", text: "text-owe-600" },
  square: { box: "bg-shine-100", text: "text-shine-700" },
} satisfies Record<BadgeState, { box: string; text: string }>;

function getBadgeText(state: BadgeState, amount: string): string {
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

function formatPeopleCount(count: number): string {
  return `${count} ${count === 1 ? "person" : "people"}`;
}

function TripStatusBadge(props: { state: BadgeState; text: string }) {
  const { state, text } = props;
  const classes = BADGE_CLASSES[state];

  return (
    <View className={cn("rounded-pill px-space-3 py-space-1", classes.box)}>
      <Text style={TABULAR_NUMS} className={cn("text-label", classes.text)}>
        {text}
      </Text>
    </View>
  );
}
