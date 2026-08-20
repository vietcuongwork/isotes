import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { View } from "react-native";
import { CURRENCY_OPTIONS, CurrencyOption } from "../constants";
import CurrencyPicker from "./CurrencyPicker";
import FormField from "./FormField";

export default function CreateProjectForm() {
  const currencyPickerRef = useRef<BottomSheetModal>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(
    CURRENCY_OPTIONS[0],
  );

  return (
    <View className="gap-8">
      <FormField
        label="Project name"
        placeholder="Trip to Vegas"
        isTextInput={true}
      />
      <FormField
        label="Description"
        placeholder="Optional"
        isTextInput={true}
      />
      <FormField
        label="Default currency"
        placeholder="Optional"
        value={selectedCurrency.value}
        textInputProps={{
          editable: false,
          style: { pointerEvents: "none" },
        }}
        isTextInput={false}
        touchableOpacityProps={{
          onPress: () => {
            currencyPickerRef.current?.present();
          },
        }}
      />

      <CurrencyPicker
        ref={currencyPickerRef}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />
    </View>
  );
}
