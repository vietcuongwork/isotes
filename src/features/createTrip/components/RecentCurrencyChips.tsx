import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { Pressable, Text, View } from "react-native";

interface RecentCurrencyChipsProps {
  currencies: Currency[];
  selectedCode: string;
  onSelect: (currency: Currency) => void;
}

interface CurrencyChipProps {
  currency: Currency;
  selected: boolean;
  onPress: () => void;
}

/** DESIGN.md `chip` / `chip-selected`, the code in `label` and the symbol in `caption`. */
function CurrencyChip(props: CurrencyChipProps) {
  const { currency, selected, onPress } = props;
  const inkClass = selected ? "text-shine-700" : "text-ink-900";

  return (
    // NOTE - no token for the 44pt chip height, falling back to h-[44px]
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      // Rows read "{name}, {code}, {symbol}"; a chip drops the symbol so each has its own label
      accessibilityLabel={`${currency.name}, ${currency.code}`}
      onPress={onPress}
      className={cn(
        "h-[44px] flex-row items-center gap-space-2 rounded-md px-space-3",
        selected ? "bg-shine-100" : "bg-ink-100",
      )}
    >
      <Text className={cn("text-label", inkClass)}>{currency.code}</Text>
      <Text className={cn("text-caption", inkClass)}>{currency.symbol}</Text>
    </Pressable>
  );
}

/** "From your trips": nothing when there are no currencies. */
export default function RecentCurrencyChips(props: RecentCurrencyChipsProps) {
  const { currencies, selectedCode, onSelect } = props;

  if (currencies.length === 0) return null;

  return (
    <View>
      <Text
        accessibilityRole="header"
        className="mb-space-2 mt-space-5 text-ink-500 text-micro"
      >
        From your trips
      </Text>
      <View className="flex-row flex-wrap gap-space-2">
        {currencies.map((currency) => (
          <CurrencyChip
            key={currency.code}
            currency={currency}
            selected={currency.code === selectedCode}
            onPress={() => onSelect(currency)}
          />
        ))}
      </View>
    </View>
  );
}
