import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { Activity } from "@/types/TExpense";
import { ReactElement } from "react";
import { View } from "react-native";
import ActivityField from "./activity/ActivityField";
import ActivityPicker from "./activity/ActivityPicker";
import DateField from "@/features/addExpense/date/components/DateField";

interface ActivityAndDateSectionProps {
  isActivityPickerOpen: boolean;
  onToggleActivityPicker: () => void;
  onDateFieldPress: () => void;
}

export default function ActivityAndDateSection(
  props: ActivityAndDateSectionProps,
): ReactElement {
  const { isActivityPickerOpen, onToggleActivityPicker, onDateFieldPress } =
    props;

  const activity = useExpenseSheetStore((s) => s.activity);
  const setActivity = useExpenseSheetStore((s) => s.setActivity);
  const date = useExpenseSheetStore((s) => s.date);

  // A pick closes the popover. It is open here, so the toggle closes it.
  const handleSelect = (picked: Activity) => {
    setActivity(picked);
    onToggleActivityPicker();
  };

  return (
    // Outer view pads; the row has none, so the popover's top-full is the row's real bottom
    <View className="px-space-5 pt-space-4">
      <View className="flex-row gap-space-2">
        <ActivityField
          selected={activity}
          open={isActivityPickerOpen}
          onPress={onToggleActivityPicker}
        />
        <DateField onPress={onDateFieldPress} selected={date} />
        {isActivityPickerOpen && (
          <View className="absolute left-0 right-0 top-full z-20 mt-space-2">
            <ActivityPicker selected={activity} onSelect={handleSelect} />
          </View>
        )}
      </View>
    </View>
  );
}
