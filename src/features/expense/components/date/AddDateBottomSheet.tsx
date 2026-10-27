import {
  BottomSheet,
  BottomSheetScrollView,
} from "@/components/sheet-keyboard";
import { ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAddDateBottomSheet from "@/features/expense/hooks/useAddDateBottomSheet";
import DateCalendar from "./DateCalendar";
import QuickPickPills from "./QuickPickPills";

interface AddDateBottomSheetProps {
  visible: boolean;
  today: string;
  onClose: () => void;
}

export default function AddDateBottomSheet(
  props: AddDateBottomSheetProps,
): ReactElement {
  const { visible, today, onClose } = props;

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Date"
      titleSize="title"
      appearance="light"
      showCloseButton
      closeVariant="done"
      safeAreaInsets={safeAreaInsets}
    >
      <AddDateContent today={today} />
    </BottomSheet>
  );
}

// Its own component so the shown month resets to the selected date on every
// open: the sheet unmounts its children while hidden
function AddDateContent(props: { today: string }): ReactElement {
  const { monthId, setMonthId, pills, selectedDate, handleSelectDate } =
    useAddDateBottomSheet({ today: props.today });

  return (
    <>
      {/* Dynamic mode sizes the sheet from this scroll view's content */}
      <BottomSheetScrollView>
        <View className="gap-space-4 px-space-5 pb-space-5">
          <QuickPickPills
            pills={pills}
            selectedDate={selectedDate}
            onSelect={handleSelectDate}
          />

          {/* Month grid */}
          <DateCalendar
            calendarMonthId={monthId}
            selectedDateId={selectedDate}
            onSelectDate={handleSelectDate}
            onMonthChange={setMonthId}
          />
        </View>
      </BottomSheetScrollView>
    </>
  );
}
