import Avatar from "@/components/Avatar";
import { TripCardState } from "@/domain/tripBalance";
import { formatExpenseCount, formatPersonNet } from "@/domain/tripFormat";
import { PersonSummary } from "@/features/people/helpers/peopleHelpers";
import { tabularNums } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { getInitial } from "@/utils/utils";
import { Text, View } from "react-native";

// get, owe and square use the same text tokens as TripSummaryTiles
const TONE_TEXT: Record<Exclude<TripCardState, "empty">, string> = {
  get: "text-get-600",
  owe: "text-owe-600",
  square: "text-ink-500",
};

interface PersonRowProps {
  person: PersonSummary;
  currency: Currency;
}

export default function PersonRow(props: PersonRowProps) {
  const { person, currency } = props;
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

  return (
    <View
      accessible
      accessibilityLabel={label}
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
      <View className="min-w-0 flex-1">
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
    </View>
  );
}
