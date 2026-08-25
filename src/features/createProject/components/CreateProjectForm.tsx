import { Controller } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { useCreateProjectForm } from "../hooks/useCreateProjectForm";
import CurrencyPicker from "./CurrencyPicker";
import FormField from "./FormField";

export default function CreateProjectForm() {
  const { currencyPickerRef, handleCurrencyChange, form } =
    useCreateProjectForm();
  const { control } = form;

  return (
    <View className="gap-10">
      <Controller
        control={control}
        name="projectName"
        render={({
          field: { value, onChange, onBlur },
          fieldState: { error },
        }) => (
          <FormField
            label="Project name"
            placeholder="Trip to Vegas"
            isTextInput={true}
            value={value}
            textInputProps={{
              onChangeText: onChange,
              onBlur: onBlur,
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormField
            label="Description"
            placeholder="Optional"
            isTextInput={true}
            value={value}
            textInputProps={{
              onChangeText: onChange,
              onBlur: onBlur,
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="currency"
        render={({ field: { value, onChange, onBlur } }) => (
          <>
            <FormField
              label="Default currency"
              placeholder="Optional"
              value={value.code}
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
              selectedCurrency={value}
              onCurrencyChange={handleCurrencyChange}
            />
          </>
        )}
      />
    </View>
  );
}
