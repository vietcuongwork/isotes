import { cn } from "@/utils/cn";
import { Text, View } from "react-native";

interface CurrencyTileProps {
  code: string;
  selected?: boolean;
}

/** DESIGN.md `currency-tile` / `currency-tile-selected`. Hidden from VoiceOver: its button or row carries the label. */
export default function CurrencyTile(props: CurrencyTileProps) {
  const { code, selected = false } = props;

  return (
    // NOTE - no token for the 48×40 tile, falling back to w-[48px] h-[40px] (currency-tile's own size)
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn(
        "h-[40px] w-[48px] items-center justify-center rounded-sm",
        selected ? "bg-shine-100" : "bg-ink-100",
      )}
    >
      <Text
        className={cn(
          "text-label",
          selected ? "text-shine-700" : "text-ink-900",
        )}
      >
        {code}
      </Text>
    </View>
  );
}
