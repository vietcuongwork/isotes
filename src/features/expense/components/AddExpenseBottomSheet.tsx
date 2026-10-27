import PrimaryButton from "@/components/PrimaryButton";
import {
  BottomSheet,
  BottomSheetScrollView,
} from "@/components/sheet-keyboard";
import { ReactElement, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAddExpenseBottomSheet from "../hooks/useAddExpenseBottomSheet";
import ActivityAndDateSection from "./ActivityAndDateSection";
import AmountField from "./amount/AmountField";
import AddDateBottomSheet from "./date/AddDateBottomSheet";
import DescriptionField from "./description/DescriptionField";
import PaidAndSplitSection from "./paidbyandsplit/PaidAndSplitSection";
import RestoredDraftBanner from "./RestoredDraftBanner";
import StartOverDialog from "./StartOverDialog";

// The board's sheet top; BottomSheet clamps the height under the safe area
const SHEET_TOP = 56;

interface AddExpenseBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddExpenseBottomSheet(
  props: AddExpenseBottomSheetProps,
): ReactElement {
  const { visible, onClose } = props;

  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="New"
      titleAccent="expense"
      titleSize="title"
      appearance="light"
      showCloseButton
      snapPoints={[windowHeight - SHEET_TOP]}
      safeAreaInsets={safeAreaInsets}
    >
      <AddExpenseContent onClose={onClose} />
    </BottomSheet>
  );
}

// Its own component so per-open state (the restored-draft banner, captured at
// mount; the activity picker) starts fresh on every open: the sheet unmounts
// its children while hidden, but AddExpenseBottomSheet itself stays mounted
function AddExpenseContent(props: { onClose: () => void }): ReactElement {
  const {
    today,
    isActivityPickerOpen,
    setActivityPickerOpen,
    handleSubmit,
    amountError,
    isDraftRestored,
    isStartOverDialogOpen,
    handleStartOver,
    handleCancelStartOver,
    handleConfirmStartOver,
  } = useAddExpenseBottomSheet({ onClose: props.onClose });

  const [isDateOpen, setDateOpen] = useState(false);

  // No Keyboard.dismiss() before opening anything: a tap outside a text input
  // already closes either keyboard, and opening a sheet blurs the field (B10)
  const handleDateFieldPress = () => {
    setActivityPickerOpen(false);
    setDateOpen(true);
  };

  return (
    <>
      <BottomSheetScrollView>
        {/*NOTE - position:relative → stacking parent for the picker scrim.
             The scrim + the Activity/Date row are direct siblings here; their
             zIndex is what floats the row (and its popover) above the dim. */}
        <View className="relative">
          {isDraftRestored && (
            <RestoredDraftBanner onStartOver={handleStartOver} />
          )}

          {/* Amount and description */}
          <View className="gap-space-4 px-space-5 pt-space-4">
            <AmountField
              error={amountError}
              onFocus={() => setActivityPickerOpen(false)}
            />
            <DescriptionField />
          </View>

          <ActivityAndDateSection
            isActivityPickerOpen={isActivityPickerOpen}
            onToggleActivityPicker={() => setActivityPickerOpen((v) => !v)}
            onDateFieldPress={handleDateFieldPress}
          />

          {/* Paid by Field */}
          <View className="px-space-5 pt-space-4">
            <PaidAndSplitSection />
          </View>

          <View className="px-space-5 pb-space-5 pt-space-4">
            <PrimaryButton label="Save expense" onPress={handleSubmit} />
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
      </BottomSheetScrollView>

      {/* Modal sheet: a sibling of the scroll view, not inside its content */}
      <AddDateBottomSheet
        visible={isDateOpen}
        onClose={() => setDateOpen(false)}
        today={today}
      />
    </>
  );
}
