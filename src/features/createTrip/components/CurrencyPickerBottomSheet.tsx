import {
  BottomSheet,
  KeyboardAwareScrollView,
} from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { fontFamily } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateTrip } from "../hooks/useCurrencyPicker";
import Picker, { PickerOption } from "./Picker";

export interface CurrencyPickerBottomSheetProps {
  visible: boolean;
  selectedCurrency: Currency;
  onCurrencyChange: (option: PickerOption<string>) => void;
  onClose: () => void;
}

export default function CurrencyPickerBottomSheet(
  props: CurrencyPickerBottomSheetProps,
) {
  const { visible, selectedCurrency, onCurrencyChange, onClose } = props;

  const { currencyOptions } = useCreateTrip();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      safeAreaInsets={safeAreaInsets}
    >
      {/* Dynamic mode measures its content through this scroll view; scrolling
          is off so it never competes with the wheel's own drag */}
      <KeyboardAwareScrollView scrollEnabled={false}>
        <Picker
          intialValue={selectedCurrency.code}
          options={currencyOptions}
          onSelectionChange={onCurrencyChange}
          itemStyle={styles.pickerText}
        />
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pickerText: {
    color: colors.grey[50],
    fontFamily: fontFamily["outfit-medium"],
    fontSize: 16,
  },
});
