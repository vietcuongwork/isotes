import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useRef } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { CreateProjectFormHandle } from "../components/CreateProjectForm";
import { PickerOption } from "../components/Picker";
import { CURRENCY_OPTIONS } from "../constants";
import {
  CreateProjectFormData,
  createProjectFormSchema,
} from "../validation/createProjectFormSchema";

export function useCreateProjectScreen() {
  const currencyPickerRef = useRef<BottomSheetModal>(null);
  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);
  const formRef = useRef<CreateProjectFormHandle>(null);

  const defaultFormValues = useMemo(() => {
    return {
      projectName: "",
      description: "",
      currency: CURRENCY_OPTIONS[0],
    };
  }, []);

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: defaultFormValues,
  });

  const handleCurrencyChange = (option: PickerOption<string>) => {
    const currency = CURRENCY_OPTIONS.find((c) => c.code === option.value);
    if (!currency) return;
    form.setValue("currency", currency, { shouldValidate: true });
  };

  const onFormSubmit = (data: CreateProjectFormData) => {
    //TODO -
    console.log(data);
  };

  const onInvalid = (errors: FieldErrors<CreateProjectFormData>) => {
    formRef.current?.focusFirstErrorField(errors);
  };

  return {
    currencyPickerRef,
    handleCurrencyChange,
    form,
    onFormSubmit,
    scrollViewRef,
    formRef,
    onInvalid,
  };
}
