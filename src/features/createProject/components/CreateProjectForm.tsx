import { Keyboard, View } from "react-native";
import { useCreateProjectForm } from "../hooks/useCreateProjectForm";
import CurrencyPicker from "./CurrencyPicker";
import FormField from "./FormField";

export default function CreateProjectForm() {
  const { currencyPickerRef, selectedCurrency, handleCurrencyChange } =
    useCreateProjectForm();

  console.log(selectedCurrency);

  return (
    <View className="gap-10">
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
        value={selectedCurrency.code}
        textInputProps={{
          editable: false,
          style: { pointerEvents: "none" },
        }}
        isTextInput={false}
        touchableOpacityProps={{
          onPress: () => {
            Keyboard.dismiss();
            currencyPickerRef.current?.present();
          },
        }}
      />

      <CurrencyPicker
        ref={currencyPickerRef}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={handleCurrencyChange}
      />
    </View>
  );
}
