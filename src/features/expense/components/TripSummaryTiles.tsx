import {
  formatExpenseCount,
  TripSummary,
} from "@/features/expense/helpers/tripHomeHelpers";
import { TripCardState } from "@/features/trips/helpers/tripsHelpers";
import { tabularNums } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { formatDisplayAmount } from "@/utils/currency";
import { Text, View } from "react-native";

interface TripSummaryTilesProps {
  summary: TripSummary;
  currency: Currency;
}

interface AmountTileProps {
  label: string;
  value: string;
  tileClassName: string;
  labelClassName: string;
  valueClassName: string;
}

// get, owe and square are flat tints; empty is a plain card, so it doesn't read as settled
const POSITION_CLASSES = {
  get: { tile: "bg-get-100", text: "text-get-600" },
  owe: { tile: "bg-owe-100", text: "text-owe-600" },
  square: { tile: "bg-shine-100", text: "text-shine-700" },
  empty: { tile: "bg-card shadow-card", text: "text-ink-500" },
} satisfies Record<TripCardState, { tile: string; text: string }>;

function getPositionLabel(state: TripCardState): string {
  switch (state) {
    case "get":
      return "You get back";
    case "owe":
      return "You owe";
    case "square":
      return "All square";
    case "empty":
      return "Your balance";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

// The word carries the sign for owe, so only get shows one
function getPositionValue(
  state: TripCardState,
  balance: number,
  currency: Currency,
): string {
  const amount = formatDisplayAmount(
    Math.abs(balance),
    currency.symbol,
    currency.decimalDigits,
  );
  return state === "get" ? `+${amount}` : amount;
}

function AmountTile(props: AmountTileProps) {
  const { label, value, tileClassName, labelClassName, valueClassName } = props;

  return (
    <View
      accessible
      accessibilityLabel={`${label} ${value}`}
      className={cn("flex-1 gap-space-1 rounded-lg p-space-4", tileClassName)}
    >
      <Text className={cn("text-micro", labelClassName)}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={tabularNums}
        className={cn("text-amount-lg", valueClassName)}
      >
        {value}
      </Text>
    </View>
  );
}

export default function TripSummaryTiles(props: TripSummaryTilesProps) {
  const { summary, currency } = props;
  const { total, count, share, balance, state } = summary;
  const isEmpty = state === "empty";
  const totalText = formatDisplayAmount(
    total,
    currency.symbol,
    currency.decimalDigits,
  );
  const countText = formatExpenseCount(count);
  const shareText = formatDisplayAmount(
    share,
    currency.symbol,
    currency.decimalDigits,
  );
  const position = POSITION_CLASSES[state];

  return (
    <View className="gap-space-2">
      {/* Trip total, across both columns */}
      <View
        accessible
        accessibilityLabel={`Trip total ${totalText}, ${countText}`}
        className="flex-row items-end justify-between gap-space-3 rounded-lg bg-ink-900 px-space-5 py-space-4"
      >
        <View className="min-w-0 flex-1 gap-space-1">
          <Text className="text-ink-300 text-micro">Trip total</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={tabularNums}
            className={cn(
              "text-hero-amount",
              isEmpty ? "text-ink-400" : "text-card",
            )}
          >
            {totalText}
          </Text>
        </View>
        <Text className="pb-space-1 text-ink-200 text-caption">
          {countText}
        </Text>
      </View>

      {/* Your share and your position */}
      <View className="flex-row gap-space-2">
        <AmountTile
          label="Your share"
          value={shareText}
          tileClassName="bg-card shadow-card"
          labelClassName="text-ink-500"
          valueClassName={isEmpty ? "text-ink-500" : "text-ink-900"}
        />
        <AmountTile
          label={getPositionLabel(state)}
          value={getPositionValue(state, balance, currency)}
          tileClassName={position.tile}
          labelClassName={position.text}
          valueClassName={position.text}
        />
      </View>
    </View>
  );
}
