import Button from "@/components/Button";
import PickerField from "@/components/formfield/PickerField";
import {
  BottomSheet,
  KeyboardAwareScrollView,
} from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { Camera } from "lucide-react-native";
import { ReactElement, useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAddExpenseBottomSheet from "../hooks/useAddExpenseBottomSheet";
import ActivityAndDateSection from "./ActivityAndDateSection";
import AmountField from "./amount/AmountField";
import AddDateBottomSheet from "./date/AddDateBottomSheet";
import DescriptionField from "./description/DescriptionField";
import PaidAndSplitSection from "./paidbyandsplit/PaidAndSplitSection";
import RestoredDraftBanner from "./RestoredDraftBanner";
import StartOverDialog from "./StartOverDialog";

interface AddExpenseBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddExpenseBottomSheet(
  props: AddExpenseBottomSheetProps,
): ReactElement {
  const { visible, onClose } = props;

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="New expense"
      showCloseButton
      snapPoints={["80%"]}
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
      <KeyboardAwareScrollView>
        {/*NOTE - position:relative → stacking parent for the picker scrim.
             The scrim + the Activity/Date row are direct siblings here; their
             zIndex is what floats the row (and its popover) above the dim. */}
        <View className="relative">
          {isDraftRestored && (
            <RestoredDraftBanner onStartOver={handleStartOver} />
          )}

          {/* Amount Field */}
          <AmountField
            error={amountError}
            onFocus={() => setActivityPickerOpen(false)}
          />

          {/* Description Field */}
          <View className="flex-row gap-2.5 px-5 pt-4">
            <DescriptionField />
            <PickerField onPress={() => {}}>
              <Camera size={20} color={colors.grey[200]} />
            </PickerField>
          </View>

          <ActivityAndDateSection
            isActivityPickerOpen={isActivityPickerOpen}
            onToggleActivityPicker={() => setActivityPickerOpen((v) => !v)}
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

      {/* Modal sheet: a sibling of the scroll view, not inside its content */}
      <AddDateBottomSheet
        visible={isDateOpen}
        onClose={() => setDateOpen(false)}
        today={today}
      />
    </>
  );
}
