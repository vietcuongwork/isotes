import { colors } from "@/themes/color";
import { MemberColor } from "@/types/TExpense";
import { capitalize } from "@/utils/utils";
import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";

interface ColorItemProps {
  color: MemberColor;
  selected?: boolean;
  onPress: () => void;
}

export default function ColorItem({
  color,
  selected = false,
  onPress,
}: ColorItemProps) {
  return (
    // NOTE - no token for the 52pt swatch row, falling back to h-[52px] (one component's own size)
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={capitalize(color)}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className="h-[52px] flex-1 items-center justify-center"
    >
      {/* NOTE - no token for the 40pt disc, falling back to h-[40px] w-[40px] (one component's own size). The same size selected or not: the gap and ring are drawn outside it with negative insets, so selecting moves nothing */}
      <View
        className="h-[40px] w-[40px] items-center justify-center rounded-pill"
        style={{ backgroundColor: colors.member[color] }}
      >
        {selected && (
          <>
            {/* NOTE - no token for the 2pt gap, falling back to -inset-[2px] with a card border (2 + 2 = 4pt outside the disc) */}
            <View
              pointerEvents="none"
              className="absolute -inset-[2px] rounded-pill border-2 border-card"
            />
            {/* NOTE - no token for the 2pt ring, falling back to -inset-[4px] and border-2 on ink-900 (2pt gap + 2pt ring) */}
            <View
              pointerEvents="none"
              className="absolute -inset-[4px] rounded-pill border-2 border-ink-900"
            />
            {/* NOTE - no token for the check's 2.25 stroke, DESIGN.md icons are 1.75; the board's value keeps it readable on every fill */}
            <Check
              size={20}
              strokeWidth={2.25}
              color={colors.memberInk[color]}
            />
          </>
        )}
      </View>
    </Pressable>
  );
}
