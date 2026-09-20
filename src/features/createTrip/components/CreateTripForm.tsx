import { useBottomSheet } from "@/components/bottomsheet/BottomSheetStack";
import TextField from "@/components/formfield/TextField";
import { mergeRefs } from "@/utils/utils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { forwardRef, RefObject, useImperativeHandle, useRef } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormReturn,
  useFormState,
} from "react-hook-form";
import { Keyboard, TextInput, View } from "react-native";
import { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { CreateTripFormData } from "../validation/createTripFormSchema";
import CurrencyField from "./CurrencyField";
import CurrencyPickerBottomSheet, {
  CurrencyPickerBottomSheetProps,
} from "./CurrencyPickerBottomSheet";
import { PickerOption } from "./Picker";

interface CreateTripFormProps {
  form: UseFormReturn<CreateTripFormData>;
  control: Control<CreateTripFormData>;
  currencyPickerRef: RefObject<BottomSheetModal | null>;
  handleCurrencyChange: (option: PickerOption<string>) => void;
  scrollViewRef: RefObject<KeyboardAwareScrollViewRef | null>;
}
export interface CreateTripFormHandle {
  focusFirstErrorField: (errors: FieldErrors<CreateTripFormData>) => void;
}

type FocusableField = Exclude<keyof CreateTripFormData, "currency">;

const SCROLL_TOP_PADDING = 40;

//NOTE - Currency excluded: it's a TouchableOpacity trigger, not a focusable TextInput,
// so there's no ref to call .focus()/measureLayout() on.
const FIELD_ORDER: FocusableField[] = ["tripName", "description"];

const CreateTripForm = forwardRef<CreateTripFormHandle, CreateTripFormProps>(
  (props, ref) => {
    const {
      form,
      control,
      currencyPickerRef,
      handleCurrencyChange,
      scrollViewRef,
    } = props;
    const { submitCount } = useFormState({ control });

    const tripNameRef = useRef<TextInput>(null);
    const descriptionRef = useRef<TextInput>(null);
    const fieldRefs = {
      tripName: tripNameRef,
      description: descriptionRef,
    };
    const { present, dismiss } = useBottomSheet();

    useImperativeHandle(ref, () => ({
      focusFirstErrorField: (errors: FieldErrors<CreateTripFormData>) => {
        const firstErrorField = FIELD_ORDER.find((name) => errors[name]);
        if (!firstErrorField) return;

        const fieldRef = fieldRefs[firstErrorField];
        fieldRef.current?.focus();

        const nativeScrollRef = scrollViewRef.current?.getNativeScrollRef();
        if (!nativeScrollRef) return;

        fieldRef.current?.measureLayout(nativeScrollRef, (_x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(y - SCROLL_TOP_PADDING, 0),
            animated: true,
          });
        });
      },
    }));

    const handleCurrencyFieldPress = (
      sheetProps: CurrencyPickerBottomSheetProps,
    ) => {
      const { selectedCurrency, onCurrencyChange } = sheetProps;
      present(
        <CurrencyPickerBottomSheet
          onClose={dismiss}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={onCurrencyChange}
        ></CurrencyPickerBottomSheet>,
      );
    };

    return (
      <View className="gap-6 px-5 pt-8">
        <Controller
          control={control}
          name="tripName"
          render={({
            field: { value, onChange, onBlur, ref: rhfRef },
            fieldState: { error },
          }) => (
            <TextField
              ref={mergeRefs(tripNameRef, rhfRef)}
              label="Trip name"
              placeholder="Trip to Vegas"
              value={value}
              textInputProps={{
                onChangeText: onChange,
                onBlur: onBlur,
                returnKeyType: "next",
                submitBehavior: "submit",
                onSubmitEditing: () => {
                  console.log("obSubmitEditing");
                  form.setFocus("description");
                },
              }}
              error={error?.message}
              shakeTrigger={submitCount}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur, ref: rhfRef } }) => (
            <TextField
              ref={mergeRefs(descriptionRef, rhfRef)}
              label="Description"
              optionalLabel="optional"
              placeholder="Optional"
              value={value}
              textInputProps={{
                onChangeText: onChange,
                onBlur: onBlur,
                returnKeyType: "next",
                submitBehavior: "submit",
                onSubmitEditing: () => {
                  Keyboard.dismiss();
                  currencyPickerRef.current?.present();
                },
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="currency"
          render={({ field: { value } }) => (
            <>
              <CurrencyField
                value={value}
                onPress={() => {
                  Keyboard.dismiss();
                  handleCurrencyFieldPress({
                    selectedCurrency: value,
                    onCurrencyChange: handleCurrencyChange,
                    onClose: dismiss,
                  });
                }}
              />
            </>
          )}
        />
      </View>
    );
  },
);

export default CreateTripForm;
