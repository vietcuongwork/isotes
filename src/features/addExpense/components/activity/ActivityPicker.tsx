import { ACTIVITIES } from "@/domain/activities";
import { colors } from "@/themes/color";
import { Activity } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface ActivityPickerProps {
  selected: Activity;
  onSelect: (activity: Activity) => void;
}

export default function ActivityPicker(props: ActivityPickerProps) {
  const { selected, onSelect } = props;

  return (
    <View className="rounded-lg bg-card p-space-2 shadow-lifted">
      <View className="flex-row flex-wrap">
        {ACTIVITIES.map((activity) => {
          const isSelected = activity.id === selected.id;
          const { Icon } = activity;
          return (
            // NOTE - no token, p-[2px] is half of the board's space-1 gap between rows
            <View key={activity.id} className="w-1/2 p-[2px]">
              <Pressable
                onPress={() => onSelect(activity)}
                role="option"
                accessibilityState={{ selected: isSelected }}
                // NOTE - no token for the 44pt row height, falling back to h-[44px] (the board's tap target)
                className={cn(
                  "h-[44px] flex-row items-center gap-space-2 rounded-md px-space-3",
                  isSelected && "bg-shine-100",
                )}
              >
                <Icon size={20} color={colors.ink[900]} />
                <Text
                  className="flex-1 text-ink-900 text-body"
                  numberOfLines={1}
                >
                  {activity.label}
                </Text>
                {isSelected && <Check size={20} color={colors.shine[700]} />}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
