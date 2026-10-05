import BottomSheet, {
  type BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import Button from "@/components/Button";
import PickerField from "@/components/formfield/PickerField";
import { colors } from "@/themes/color";
import { Camera, X } from "lucide-react-native";
import { forwardRef, ReactElement, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import useAddExpenseBottomSheet from "../hooks/useAddExpenseBottomSheet";
import useScrollFieldAboveSheet from "../hooks/useScrollFieldAboveSheet";
import ActivityAndDateSection from "./ActivityAndDateSection";
import AmountField from "./amount/AmountField";
import NumberPadBottomSheet from "./amount/NumberPadBottomSheet";
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
    isNumberPadOpen,
    setNumberPadOpen,
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

  const [caretHidden, setCaretHidden] = useState<boolean>(true);
  const isIntentionalDismiss = useRef<boolean>(false);
  // The numpad currently serving the field — a closing one's late callbacks
  // must not touch the field's state. why: [[Investigate_numpad-reopen-while-closing]]
  const activeNumpadIdRef = useRef<string | null>(null);
  const amountFieldRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    handleScroll,
    scrollFieldIntoView,
    extraBottomSpace,
    resetExtraBottomSpace,
  } = useScrollFieldAboveSheet((y) =>
    scrollViewRef.current?.scrollTo({ y, animated: true }),
  );

  const handleDateFieldPress = () => {
    Keyboard.dismiss();
    setActivityPickerOpen(false);
    pushSheet({
      component: <AddDateBottomSheet onClose={popSheet} today={today} />,
    });
  };

  const handleAmountFieldPress = () => {
    // No Keyboard.dismiss() here — this fires from the TextInput's own
    // onFocus, so the field is already focused; dismissing would blur it
    // right back off and drop the caret it just gained.
    setActivityPickerOpen(false);
    console.log(
      `[T22] ${performance.now().toFixed(1)} amountPress padOpen:`,
      isNumberPadOpen,
    ); // TEMP T22
    if (isNumberPadOpen) return;

    setNumberPadOpen(true);
    // Covered sheets stay touchable now, so the spurious blur that used to
    // reveal the caret (AmountField onBlur) no longer fires — show it here
    setCaretHidden(false);
    // The previous numpad may still be closing with this set — don't inherit it
    isIntentionalDismiss.current = false;
    const { id: numpadId } = pushSheet({
      // NumberPadBottomSheet's own onClose is overwritten internally by
      // StackedSheetWrapper; onDismiss below is the real hook.
      // why: encountered_errors_iv.md (2026-09-28)
      component: (
        <NumberPadBottomSheet
          target="expenseAmount"
          onClose={popSheet}
          onDismissStart={() => {
            console.log(`[T22] ${performance.now().toFixed(1)} numpad ${numpadId} dismissStart`); // TEMP T22
            isIntentionalDismiss.current = true;
            setNumberPadOpen(false);
            amountFieldRef.current?.blur();
            // Start scrolling back alongside the sheet's close, not after it settles
            resetExtraBottomSpace();
          }}
          onHeightChange={(height) =>
            scrollFieldIntoView(amountFieldRef, height)
          }
        />
      ),
      // Tapping the amount field itself (e.g. to move the caret) keeps the numpad open
      passThrough: {
        isTapIgnored: (e) => e.target === amountFieldRef.current,
      },
      onDismiss: () => {
        console.log(`[T22] ${performance.now().toFixed(1)} numpad ${numpadId} onDismiss`); // TEMP T22
        // A reopen during the close already replaced this numpad
        if (activeNumpadIdRef.current !== numpadId) {
          console.log(`[T22] ${performance.now().toFixed(1)} numpad ${numpadId} onDismiss skipped (active: ${activeNumpadIdRef.current})`); // TEMP T22
          return;
        }
        activeNumpadIdRef.current = null;
        isIntentionalDismiss.current = false;
        setCaretHidden(true);
      },
    });
    activeNumpadIdRef.current = numpadId;
    console.log(`[T22] ${performance.now().toFixed(1)} numpad ${numpadId} pushed`); // TEMP T22
  };

  return (
    <BottomSheet ref={ref} onClose={onClose} snapPoints={["80%"]}>
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: safeBottomStyle.paddingBottom + extraBottomSpace,
        }}
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
          <AmountField
            ref={amountFieldRef}  
            error={amountError}
            onFocus={handleAmountFieldPress}
            isNumberPadOpen={isNumberPadOpen}
            caretHidden={caretHidden}
            onSetCarretState={setCaretHidden}
            isIntentionalDismiss={isIntentionalDismiss}
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
      </ScrollView>
    </BottomSheet>
  );
});
export default AddExpenseBottomSheet;
