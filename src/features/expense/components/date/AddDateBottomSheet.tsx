import { colors } from "@/themes/color";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Calendar, toDateId } from "@marceloterreiro/flash-calendar";
import {
  forwardRef,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const today = toDateId(new Date());

const AddDateBottomSheet = forwardRef<BottomSheetModal>(
  function AddDateBottomSheet(_props, ref): ReactElement {
    const [selectedDate, setSelectedDate] = useState(today);

    const { bottom } = useSafeAreaInsets();

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

    const contentStyle = useMemo(
      () => ({ paddingBottom: bottom + 300 }),
      [bottom],
    );

    const renderCalendar = () => {
      return (
        <View>
          <Text>Selected date: {selectedDate}</Text>
          <Calendar
            calendarActiveDateRanges={[
              {
                startId: selectedDate,
                endId: selectedDate,
              },
            ]}
            calendarMonthId={today}
            onCalendarDayPress={setSelectedDate}
          />
        </View>
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        style={styles.sheetStyle}
        backdropComponent={renderBackDrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enableContentPanningGesture={false}
        stackBehavior="push"
      >
        <BottomSheetView style={contentStyle}>
          {renderCalendar()}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
export default AddDateBottomSheet;

const styles = StyleSheet.create({
  sheetStyle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -20 }, // negative = upward
    shadowRadius: 30, // ~half the CSS blur
    shadowOpacity: 0.45,
  },
  sheetBackground: { backgroundColor: colors.grey[905] },
  handleIndicator: { backgroundColor: colors.grey[700] },
});
