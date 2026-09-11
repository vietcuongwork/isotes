import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { ACTIVITIES, Activity } from "../../constants";

interface ActivityPickerProps {
  selected: Activity;
  onSelect: (activity: Activity) => void;
}

export default function ActivityPicker(props: ActivityPickerProps) {
  const { selected, onSelect } = props;

  return (
    <View className="shadow-popover rounded-card border border-grey-800 bg-grey-900 p-2.5">
      <View className="flex-row flex-wrap">
        {ACTIVITIES.map((activity) => {
          const isSelected = activity.id === selected.id;
          const { Icon } = activity;
          return (
            <View key={activity.id} className="w-1/2 p-1">
              <Pressable
                onPress={() => onSelect(activity)}
                className={cn(
                  "flex-row items-center gap-2.5 rounded-row p-3",
                  isSelected
                    ? "shadow-selected border border-orange-700 bg-orange-800"
                    : "bg-grey-950 shadow-none",
                )}
              >
                <Icon
                  size={18}
                  color={isSelected ? colors.orange[400] : colors.grey[200]}
                />
                <Text
                  className={cn(
                    "text-row flex-1",
                    isSelected
                      ? "text-row-medium text-grey-50"
                      : "text-grey-100",
                  )}
                >
                  {activity.label}
                </Text>
                {isSelected && <Check size={16} color={colors.orange[400]} />}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
