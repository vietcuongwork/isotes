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
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Quick dates"
      className="flex-row gap-space-2"
    >
      {pills.map((pill) => {
        const isSelected = pill.id === selectedDate;
        return (
          <Pressable
            key={pill.id}
            onPress={() => onSelect(pill.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            //NOTE - no token, h-[36px] is the board's chip height
            className={cn(
              "h-[36px] justify-center rounded-md px-space-3",
              isSelected ? "bg-shine-100" : "bg-ink-100",
            )}
          >
            <Text
              className={cn(
                "text-label",
                isSelected ? "text-shine-700" : "text-ink-900",
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
