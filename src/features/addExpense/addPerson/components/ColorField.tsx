import { colors } from "@/themes/color";
import { MemberColor } from "@/types/TExpense";
import { capitalize } from "@/utils/utils";
import { Text, View } from "react-native";
import ColorItem from "./ColorItem";

const MEMBER_COLORS = Object.keys(colors.member) as MemberColor[];

// Explicit rows, not flex-wrap: six `w-1/6` items sum to 362.00003 in a 362 container
// and the sixth wraps
const SWATCHES_PER_ROW = 6;
const COLOR_ROWS = Array.from(
  { length: Math.ceil(MEMBER_COLORS.length / SWATCHES_PER_ROW) },
  (_, i) =>
    MEMBER_COLORS.slice(i * SWATCHES_PER_ROW, (i + 1) * SWATCHES_PER_ROW),
);

interface ColorFieldProps {
  selectedColor: MemberColor;
  onSelectColor: (color: MemberColor) => void;
}

export default function ColorField(props: ColorFieldProps) {
  const { selectedColor, onSelectColor } = props;

  return (
    <View className="gap-space-1">
      {/* Label row: the section name, and the selected color's name opposite.
          NOTE - no token for the 20pt minimum height, falling back to min-h-[20px] (the caption's line height) */}
      <View className="min-h-[20px] flex-row items-center justify-between">
        <Text className="text-ink-500 text-micro">Color</Text>
        <Text className="text-ink-500 text-caption">
          {capitalize(selectedColor)}
        </Text>
      </View>

      {/* Grid: 12 swatches, 6 per row */}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Color"
        className="gap-space-1"
      >
        {COLOR_ROWS.map((row) => (
          <View key={row[0]} className="flex-row">
            {row.map((color) => (
              <ColorItem
                key={color}
                color={color}
                selected={color === selectedColor}
                onPress={() => onSelectColor(color)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
