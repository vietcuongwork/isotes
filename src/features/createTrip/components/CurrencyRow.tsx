import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import CurrencyTile from "./CurrencyTile";

interface CurrencyRowProps {
  currency: Currency;
  selected: boolean;
  onPress: () => void;
}

/** One currency in the sheet's list; a long name wraps and the row grows past 56. */
export default function CurrencyRow(props: CurrencyRowProps) {
  const { currency, selected, onPress } = props;

  return (
    // NOTE - no token for the 56pt row minimum, falling back to min-h-[56px]
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${currency.name}, ${currency.code}, ${currency.symbol}`}
      onPress={onPress}
      className="min-h-[56px] flex-row items-center gap-space-3 border-b border-ink-100 py-space-2"
    >
      <CurrencyTile code={currency.code} selected={selected} />
      <View className="flex-1">
        <Text className="text-ink-900 text-body">{currency.name}</Text>
        <Text className="text-ink-500 text-caption">{currency.symbol}</Text>
      </View>
      {selected && <Check size={20} color={colors.shine[700]} />}
    </Pressable>
  );
}
