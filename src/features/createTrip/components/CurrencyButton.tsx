import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { ChevronsUpDown } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import CurrencyTile from "./CurrencyTile";

interface CurrencyButtonProps {
  value: Currency;
  onPress: () => void;
}

/** The trip's currency as one card button; opens the currency sheet. */
export default function CurrencyButton(props: CurrencyButtonProps) {
  const { value, onPress } = props;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Currency, ${value.name}, ${value.code}`}
      onPress={onPress}
      className="flex-row items-center gap-space-3 rounded-lg bg-card p-space-4 shadow-card"
    >
      <CurrencyTile code={value.code} selected />
      <View className="flex-1">
        <Text className="text-ink-900 text-body">{value.name}</Text>
        <Text className="text-ink-500 text-caption">{value.symbol}</Text>
      </View>
      <ChevronsUpDown size={20} strokeWidth={1.75} color={colors.ink[500]} />
    </Pressable>
  );
}
