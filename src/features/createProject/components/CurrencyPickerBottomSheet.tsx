import { Currency } from "@/features/createProject/types/TCreateProject";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateProject } from "../hooks/useCurrencyPicker";
import Picker, { PickerOption } from "./Picker";
interface CurrencyPickerBottomSheetProps {
  selectedCurrency: Currency;
  onCurrencyChange: (option: PickerOption<string>) => void;
}

const CurrencyPickerBottomSheet = forwardRef<
  BottomSheetModal,
  CurrencyPickerBottomSheetProps
>((props, ref) => {
  const { selectedCurrency, onCurrencyChange } = props;

  const { currencyOptions } = useCreateProject();
  const { bottom } = useSafeAreaInsets();
  const renderBackDrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
      />
    ),
    [],
  );

  const safeBottomStyle = { paddingBottom: bottom };

  return (
    <BottomSheetModal
      ref={ref}
      style={styles.sheetStyle}
      backdropComponent={renderBackDrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enableContentPanningGesture={false}
    >
      <BottomSheetView style={safeBottomStyle}>
        <Picker
          intialValue={selectedCurrency.code}
          options={currencyOptions}
          onSelectionChange={onCurrencyChange}
          itemStyle={styles.pickerText}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

CurrencyPickerBottomSheet.displayName = "CurrencyPickerBottomSheet";

export default CurrencyPickerBottomSheet;

const styles = StyleSheet.create({
  pickerText: {
    color: colors.grey[50],
    fontFamily: fontFamily["outfit-medium"],
    fontSize: 16,
  },
  sheetStyle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -20 }, // negative = upward
    shadowRadius: 30, // ~half the CSS blur
    shadowOpacity: 0.45,
  },
  sheetBackground: {
    backgroundColor: colors.grey[900],
    //NOTE - borderRadius.sheet
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: colors.grey[700],
  },
});
