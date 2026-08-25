import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { PickerOption } from "../components/Picker";
import { CURRENCY_OPTIONS } from "../constants";
import {
  CreateProjectFormData,
  createProjectFormSchema,
} from "../validation/createProjectFormSchema";

export function useCreateProjectForm() {
  const currencyPickerRef = useRef<BottomSheetModal>(null);

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

  return {
    currencyPickerRef,
    handleCurrencyChange,
    form,
  };
}
