import {
  BottomSheet,
  KeyboardAwareScrollView,
} from "@/components/sheet-keyboard";
import { ReactElement } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAddDateBottomSheet from "../../hooks/useAddDateBottomSheet";
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
      <KeyboardAwareScrollView>
        <View className="items-center px-5 pb-3.5">
          <Text className="tracking-[0.08em] text-grey-200 text-label">
            EXPENSE DATE
          </Text>
        </View>

        <QuickPickPills
          pills={pills}
          selectedDate={selectedDate}
          onSelect={handleSelectDate}
        />

        {/* Month grid */}
        <View className="pt-4.5 px-5">
          <DateCalendar
            calendarMonthId={monthId}
            selectedDateId={selectedDate}
            onSelectDate={handleSelectDate}
            onMonthChange={setMonthId}
          />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}
