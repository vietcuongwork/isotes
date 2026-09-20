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
    <View className="flex-row gap-0.5 rounded-seg bg-grey-975 p-1">
      {SPLIT_METHODS.map((method) => {
        const isSelected = method.id === splitMethod;

        return (
          <Pressable
            key={method.id}
            onPress={() => setSplitMethod(method.id)}
            className={`flex-1 rounded-seg-item py-2 ${
              isSelected ? "bg-orange-400" : ""
            }`}
          >
            <Text
              className={cn(
                "text-center",
                isSelected
                  ? "text-orange-900 text-seg"
                  : "text-grey-200 text-seg-idle",
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
