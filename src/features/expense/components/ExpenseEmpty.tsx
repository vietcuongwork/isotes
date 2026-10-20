import Raven from "@/components/Raven";
import { Text, View } from "react-native";

// Centred in the space below the header: text on the left, the peeking raven
// leaning in from the right edge, as on the board
export default function ExpenseEmpty() {
  return (
    <View className="flex-1 justify-center">
      <View className="flex-row items-end gap-space-3">
        <View className="flex-1 gap-space-2">
          <Text className="text-ink-900 text-title">No expenses yet</Text>
          <Text className="text-ink-700 text-body">
            Log the first one and we&apos;ll work out who owes what.
          </Text>
        </View>
        {/* NOTE - no token for the board's 23pt bleed past the gutter, falling back to -mr-[23px] */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="-mr-[23px]"
        >
          <Raven pose="peeking" height={96} />
        </View>
      </View>
    </View>
  );
}
