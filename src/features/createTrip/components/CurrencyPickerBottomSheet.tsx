import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Picker, { PickerOption } from "./Picker";
import { useCreateTrip } from "../hooks/useCurrencyPicker";
export interface CurrencyPickerBottomSheetProps {
  selectedCurrency: Currency;
  onCurrencyChange: (option: PickerOption<string>) => void;
  onClose: () => void;
}

const CurrencyPickerBottomSheet = forwardRef<
  BottomSheetMethods,
  CurrencyPickerBottomSheetProps
>((props, ref) => {
  const { selectedCurrency, onCurrencyChange, onClose } = props;

  const { currencyOptions } = useCreateTrip();
  const { bottom } = useSafeAreaInsets();

  const safeBottomStyle = { paddingBottom: bottom };

  return (
    <BottomSheet ref={ref} onClose={onClose}>
      <View style={safeBottomStyle}>
        <Picker
          intialValue={selectedCurrency.code}
          options={currencyOptions}
          onSelectionChange={onCurrencyChange}
          itemStyle={styles.pickerText}
        />
      </View>
    </BottomSheet>
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
});
