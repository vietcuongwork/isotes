import { colors } from "@/themes/color";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  ReactElement,
  useCallback,
  useImperativeHandle,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import useAddDateBottomSheet from "../../hooks/useAddDateBottomSheet";
import DateCalendar from "./DateCalendar";
import QuickPickPills from "./QuickPickPills";

interface AddDateBottomSheetProps {
  today: string;
  selectedDate: string;
  onSelectDate: (dateId: string) => void;
}

export interface AddDateBottomSheetHandle {
  present: () => void;
  dismiss: () => void;
}

const AddDateBottomSheet = forwardRef<
  AddDateBottomSheetHandle,
  AddDateBottomSheetProps
>(function AddDateBottomSheet(props, ref): ReactElement {
  const { today, selectedDate, onSelectDate } = props;

  const {
    monthId,
    setMonthId,
    sheetRef,
    contentStyle,
    pills,
    handleCancel,
    handleDone,
    draftDate,
    handleSelectDraft,
    handlePresent,
    handleDismiss,
  } = useAddDateBottomSheet({ today, selectedDate, onSelectDate });

  useImperativeHandle(ref, () => ({
    present: handlePresent,
    dismiss: handleDismiss,
  }));

  const renderBackDrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      backdropComponent={renderBackDrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enableContentPanningGesture={false}
      stackBehavior="push"
    >
      <BottomSheetView style={contentStyle}>
        {/* Cancel / EXPENSE DATE / Done */}
        <View className="flex-row items-center justify-between px-5 pb-3.5">
          <Pressable onPress={handleCancel}>
            <Text className="text-grey-100 text-row">Cancel</Text>
          </Pressable>
          <Text className="tracking-[0.08em] text-grey-200 text-label">
            EXPENSE DATE
          </Text>
          <Pressable onPress={handleDone}>
            <Text className="text-orange-400 text-row-medium">Done</Text>
          </Pressable>
        </View>

        <QuickPickPills
          pills={pills}
          selectedDate={draftDate.current}
          onSelect={handleSelectDraft}
        />

        {/* Month grid */}
        <View className="pt-4.5 px-5">
          <DateCalendar
            calendarMonthId={monthId}
            selectedDateId={draftDate.current}
            onSelectDate={handleSelectDraft}
            onMonthChange={setMonthId}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default AddDateBottomSheet;

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.grey[905] },
  handleIndicator: { backgroundColor: colors.grey[700] },
});
