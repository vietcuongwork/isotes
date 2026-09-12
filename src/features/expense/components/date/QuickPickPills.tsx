import { cn } from "@/utils/cn";
import { Pressable, Text, View } from "react-native";

interface QuickPickPillsProps {
  pills: { id: string; label: string }[];
  selectedDate: string;
  onSelect: (dateId: string) => void;
}

export default function QuickPickPills(props: QuickPickPillsProps) {
  const { pills, selectedDate, onSelect } = props;
  return (
    <View className="flex-row gap-2 px-5">
      {pills.map((pill) => {
        const isSelected = pill.id === selectedDate;
        return (
          <Pressable
            key={pill.id}
            onPress={() => onSelect(pill.id)}
            className={cn(
              "rounded-pill border px-3.5 py-2",
              isSelected
                ? "border-orange-700 bg-orange-800 shadow-selected"
                : "border-grey-850 bg-grey-950 shadow-none",
            )}
          >
            <Text
              className={cn(
                "text-row",
                isSelected ? "text-orange-400" : "text-grey-100",
              )}
            >
              {pill.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
