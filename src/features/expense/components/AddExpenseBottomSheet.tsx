import BottomSheet, {
  type BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import Button from "@/components/Button";
import { colors } from "@/themes/color";
import { X } from "lucide-react-native";
import { forwardRef, ReactElement } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import useAddExpenseBottomSheet from "../hooks/useAddExpenseBottomSheet";
import ActivityAndDateSection from "./ActivityAndDateSection";
import AmountField from "./amount/AmountField";
import AddDateBottomSheet from "./date/AddDateBottomSheet";
import DescriptionField from "./description/DescriptionField";
import PaidAndSplitSection from "./paidbyandsplit/PaidAndSplitSection";
import RestoredDraftBanner from "./RestoredDraftBanner";
import StartOverDialog from "./StartOverDialog";

interface AddExpenseBottomSheetProps {
  onClose?: () => void;
}

const AddExpenseBottomSheet = forwardRef<
  BottomSheetMethods,
  AddExpenseBottomSheetProps
>(function AddExpenseBottomSheet(props, ref): ReactElement {
  const { onClose } = props;

  const {
    today,
    isActivityPickerOpen,
    setActivityPickerOpen,
    safeBottomStyle,
    pushSheet,
    popSheet,
    handleSubmit,
    amountError,
    isDraftRestored,
    isStartOverDialogOpen,
    handleStartOver,
    handleCancelStartOver,
    handleConfirmStartOver,
  } = useAddExpenseBottomSheet();

  const handleDateFieldPress = () => {
    Keyboard.dismiss();
    setActivityPickerOpen(false);
    pushSheet({
      component: <AddDateBottomSheet onClose={popSheet} today={today} />,
    });
  };

  return (
    <BottomSheet ref={ref} onClose={onClose} snapPoints={["80%"]}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={safeBottomStyle}
        bottomOffset={50}
      >
        {/*NOTE - position:relative → stacking parent for the picker scrim.
             The scrim + the Activity/Date row are direct siblings here; their
             zIndex is what floats the row (and its popover) above the dim. */}
        <View className="relative">
          <View className="flex-row justify-between px-5 pb-4">
            <Text className="text-grey-50 text-label">New expense</Text>
            <X size={24} color={colors.grey[200]} />
          </View>

          {isDraftRestored && (
            <RestoredDraftBanner onStartOver={handleStartOver} />
          )}

          {/* Amount Field */}
          <AmountField error={amountError} />

          {/* Description Field */}
          <View className="px-5 pt-4">
            <DescriptionField />
          </View>

          <ActivityAndDateSection
            isActivityPickerOpen={isActivityPickerOpen}
            onToggleActivityPicker={() => {
              Keyboard.dismiss();
              setActivityPickerOpen((v) => !v);
            }}
            onDateFieldPress={handleDateFieldPress}
          />

          {/* Paid by Field */}
          <View className="p-5">
            <PaidAndSplitSection />
          </View>

          <View className="px-5">
            <Button buttonText="Save expense" onPress={handleSubmit} />
          </View>
        </View>
        {isActivityPickerOpen && (
          <Pressable
            onPress={() => setActivityPickerOpen(false)}
            className="absolute inset-0 z-10"
          />
        )}
        {isStartOverDialogOpen && (
          <StartOverDialog
            onCancel={handleCancelStartOver}
            onConfirm={handleConfirmStartOver}
          />
        )}
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
});
export default AddExpenseBottomSheet;
