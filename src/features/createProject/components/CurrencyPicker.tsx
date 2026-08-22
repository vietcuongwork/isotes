import { Currency } from "@/features/createProject/types/TCreateProject";
import { fontFamily } from "@/themes/typography";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import { useCreateProject } from "../hooks/useCurrencyPicker";
import Picker, { PickerOption } from "./Picker";

interface CurrencyPickerProps {
  selectedCurrency: Currency;
  onCurrencyChange: (option: PickerOption<string>) => void;
}

const CurrencyPicker = forwardRef<BottomSheetModal, CurrencyPickerProps>(
  (props, ref) => {
    const { selectedCurrency, onCurrencyChange } = props;

    const { currencyOptions } = useCreateProject();

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

    return (
      <BottomSheetModal
        ref={ref}
        backdropComponent={renderBackDrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enableContentPanningGesture={false}
      >
        <BottomSheetView>
          <Picker
            intialValue={selectedCurrency.code}
            options={currencyOptions}
            onSelectionChange={onCurrencyChange}
            itemStyle={styles.pickerText}
          />
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

CurrencyPicker.displayName = "CurrencyPicker";

export default CurrencyPicker;

const styles = StyleSheet.create({
  pickerText: {
    color: "#f0f0f0",
    fontFamily: fontFamily["outfit-regular"],
    fontSize: 18,
  },
  sheetBackground: {
    backgroundColor: "#141414",
  },
  handleIndicator: {
    backgroundColor: "#333333",
  },
});
