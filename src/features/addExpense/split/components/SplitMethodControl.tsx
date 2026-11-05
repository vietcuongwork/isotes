import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { SplitMethod } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

const SPLIT_METHODS: { id: SplitMethod; label: string }[] = [
  { id: "equally", label: "Equally" },
  { id: "amounts", label: "Amounts" },
  { id: "shares", label: "Shares" },
];

export default function SplitMethodControl(): ReactElement {
  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const setSplitMethod = useExpenseSheetStore((s) => s.setSplitMethod);

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Split method"
      className="flex-row rounded-md bg-ink-100 p-space-1"
    >
      {SPLIT_METHODS.map((method) => {
        const isSelected = method.id === splitMethod;

        return (
          <Pressable
            key={method.id}
            onPress={() => setSplitMethod(method.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            //NOTE - no token, h-[36px] is the board's segment height
            className={cn(
              "h-[36px] flex-1 items-center justify-center rounded-sm",
              isSelected && "bg-ink-900",
            )}
          >
            {/* NOTE - the board draws the selected label at 14/20 weight 600, which has no role: snapped to label (weight 500) */}
            <Text
              className={cn(
                "text-label",
                isSelected ? "text-card" : "text-ink-700",
              )}
            >
              {method.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
