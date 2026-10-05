import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { Delete } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

export type NumPadKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "backspace";

interface NumberPadProps {
  onKeyPress: (key: NumPadKey) => void;
}

// null = the bottom-left cell, blank on a native decimal pad too (no comma
// entry needed here — "." lives there instead, see GRID below).
const GRID: NumPadKey[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
];

interface NumPadButtonProps {
  onPress: () => void;
  children: React.ReactNode;
}

function NumPadButton(props: NumPadButtonProps) {
  const { onPress, children } = props;

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="flex-1 items-center justify-center rounded-xl bg-grey-850 py-5"
    >
      {children}
    </TouchableOpacity>
  );
}

export default function NumberPad(props: NumberPadProps) {
  const { onKeyPress } = props;

  return (
    <View className="gap-1.5 bg-grey-975 p-3">
      {GRID.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-1.5">
          {row.map((key) => (
            <NumPadButton key={key} onPress={() => onKeyPress(key)}>
              {key === "backspace" ? (
                <Delete size={22} color={colors.grey[50]} />
              ) : (
                <Text
                  className={cn(
                    "text-grey-50 text-display",
                    key === "." && "text-grey-400",
                  )}
                >
                  {key}
                </Text>
              )}
            </NumPadButton>
          ))}
        </View>
      ))}
    </View>
  );
}
