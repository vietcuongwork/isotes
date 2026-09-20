import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import { forwardRef, ReactElement } from "react";
import { Text, View } from "react-native";
import useAddDateBottomSheet from "../../hooks/useAddDateBottomSheet";
import DateCalendar from "./DateCalendar";
import QuickPickPills from "./QuickPickPills";

interface AddDateBottomSheetProps {
  today: string;
  onClose: () => void;
}

const AddDateBottomSheet = forwardRef<
  BottomSheetMethods,
  AddDateBottomSheetProps
>(function AddDateBottomSheet(props, ref): ReactElement {
  const { today, onClose } = props;

  const {
    monthId,
    setMonthId,
    safeBottomStyle,
    pills,
    selectedDate,
    handleSelectDate,
  } = useAddDateBottomSheet({ today });

  return (
    <BottomSheet ref={ref} onClose={onClose}>
      <View style={safeBottomStyle}>
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
      </View>
    </BottomSheet>
  );
});

export default AddDateBottomSheet;
