import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { ReactElement } from "react";
import { View } from "react-native";
import ActivityField from "./activity/ActivityField";
import ActivityPicker from "./activity/ActivityPicker";
import DateField from "./date/DateField";

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

  return (
    <View className="z-20 flex-row gap-2.5 px-5 pt-3.5">
      <ActivityField
        selected={activity}
        open={isActivityPickerOpen}
        onPress={onToggleActivityPicker}
      />
      <DateField onPress={onDateFieldPress} selected={date} />
      {isActivityPickerOpen && (
        // NOTE - top-full = parent's content-box bottom, which is paddingTop
        //  short of the real edge → mt = 14 (parent pt-3.5) + 8 gap.
        //  why: encountered_errors_ii.md (2026-09-10)
        <View className="absolute left-5 right-5 top-full z-20 mt-[22px]">
          <ActivityPicker selected={activity} onSelect={setActivity} />
        </View>
      )}
    </View>
  );
}
