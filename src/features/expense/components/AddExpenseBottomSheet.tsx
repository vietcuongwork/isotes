import TextField from "@/components/formfield/TextField";
import { colors } from "@/themes/color";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import {
  forwardRef,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACTIVITIES, Activity } from "../constants";
import ActivityField from "./activity/ActivityField";
import ActivityPicker from "./activity/ActivityPicker";
import AmountField from "./amount/AmountField";
import DateField from "./date/DateField";

interface AddExpenseBottomSheetProps {
  selectedDate: string;
  onDateFieldPress: () => void;
}
const AddExpenseBottomSheet = forwardRef<
  BottomSheetModal,
  AddExpenseBottomSheetProps
>(function AddExpenseBottomSheet(props, ref): ReactElement {
  const { selectedDate, onDateFieldPress } = props;

  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity>(
    ACTIVITIES[0],
  );

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

  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={renderBackDrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enableContentPanningGesture={false}
    >
      <BottomSheetView style={contentStyle}>
        {/*NOTE - position:relative → stacking parent for the picker scrim.
             The scrim + the Activity/Date row are direct siblings here; their
             zIndex is what floats the row (and its popover) above the dim. */}
        <View className="relative">
          <View className="flex-row justify-between px-5 pb-4">
            <Text className="text-grey-50 text-label">New expense</Text>
            <X size={24} color={colors.grey[200]} />
          </View>

          <AmountField />

          <View className="px-5 pt-4">
            <TextField label="Description" placeholder="What was it for?" />
          </View>

          {/* Activity Field */}
          <View className="z-20 flex-row gap-2.5 px-5 pt-3.5">
            <ActivityField
              selected={selectedActivity}
              open={activityOpen}
              onPress={() => setActivityOpen((v) => !v)}
            />
            <DateField onPress={onDateFieldPress} selected={selectedDate} />
            {activityOpen && (
              // NOTE - top-full = parent's content-box bottom, which is paddingTop
              //  short of the real edge → mt = 14 (parent pt-3.5) + 8 gap.
              //  why: encountered_errors_ii.md (2026-09-10)
              <View className="absolute left-5 right-5 top-full z-20 mt-[22px]">
                <ActivityPicker
                  selected={selectedActivity}
                  onSelect={(a) => {
                    setSelectedActivity(a);
                  }}
                />
              </View>
            )}
          </View>

          {/* ...Paid by / Split / Save go here — dimmed by the scrim... */}
        </View>
        {activityOpen && (
          <Pressable
            onPress={() => setActivityOpen(false)}
            className="absolute inset-0 z-10"
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
export default AddExpenseBottomSheet;

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.grey[905] },
  handleIndicator: { backgroundColor: colors.grey[700] },
});
