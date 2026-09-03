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
import { CreateProjectFormData } from "../validation/createProjectFormSchema";
import CurrencyField from "./CurrencyField";
import CurrencyPicker from "./CurrencyPicker";
import FormField from "./FormField";
import { PickerOption } from "./Picker";

interface CreateProjectFormProps {
  form: UseFormReturn<CreateProjectFormData>;
  control: Control<CreateProjectFormData>;
  currencyPickerRef: RefObject<BottomSheetModal | null>;
  handleCurrencyChange: (option: PickerOption<string>) => void;
  scrollViewRef: RefObject<KeyboardAwareScrollViewRef | null>;
}
export interface CreateProjectFormHandle {
  focusFirstErrorField: (errors: FieldErrors<CreateProjectFormData>) => void;
}

type FocusableField = Exclude<keyof CreateProjectFormData, "currency">;

const SCROLL_TOP_PADDING = 40;

//NOTE - Currency excluded: it's a TouchableOpacity trigger, not a focusable TextInput,
// so there's no ref to call .focus()/measureLayout() on.
const FIELD_ORDER: FocusableField[] = ["projectName", "description"];

const CreateProjectForm = forwardRef<
  CreateProjectFormHandle,
  CreateProjectFormProps
>((props, ref) => {
  const {
    form,
    control,
    currencyPickerRef,
    handleCurrencyChange,
    scrollViewRef,
  } = props;
  const { submitCount } = useFormState({ control });

  const projectNameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const fieldRefs = {
    projectName: projectNameRef,
    description: descriptionRef,
  };

  useImperativeHandle(ref, () => ({
    focusFirstErrorField: (errors: FieldErrors<CreateProjectFormData>) => {
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

  return (
    <View className="gap-6 px-5 pt-8">
      <Controller
        control={control}
        name="projectName"
        render={({
          field: { value, onChange, onBlur, ref: rhfRef },
          fieldState: { error },
        }) => (
          <FormField
            ref={mergeRefs(projectNameRef, rhfRef)}
            label="Project name"
            placeholder="Trip to Vegas"
            isTextInput={true}
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
          <FormField
            ref={mergeRefs(descriptionRef, rhfRef)}
            label="Description"
            placeholder="Optional"
            isTextInput={true}
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
});

export default CreateProjectForm;
