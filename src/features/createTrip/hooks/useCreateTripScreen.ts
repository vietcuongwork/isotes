import { getTripCurrencyCodes, insertTrip } from "@/db/trips";
import { EXPO_ROUTER } from "@/navigation/route";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { CreateTripFormHandle } from "../components/CreateTripForm";
import { PickerOption } from "../components/Picker";
import { CURRENCY_OPTIONS } from "../constants";
import { getDefaultCurrency } from "../helpers/currencyHelpers";
import {
  CreateTripFormData,
  createTripFormSchema,
} from "../validation/createTripFormSchema";

// codes is null until the one-shot read resolves; the screen mounts the form
// only then, so useForm's default currency is right on its first render
export function useCreateTripScreen() {
  const [codes, setCodes] = useState<string[] | null>(null);

  const router = useRouter();

  const onBack = () => {
    router.back();
  };

  useEffect(() => {
    getTripCurrencyCodes().then(setCodes);
  }, []);

  return { codes, onBack };
}

export function useCreateTripForm(codes: string[]) {
  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);
  const formRef = useRef<CreateTripFormHandle>(null);

  const router = useRouter();

  const defaultFormValues = useMemo(() => {
    return {
      tripName: "",
      description: "",
      currency: getDefaultCurrency(codes, CURRENCY_OPTIONS),
    };
  }, [codes]);

  const form = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripFormSchema),
    defaultValues: defaultFormValues,
  });

  const handleCurrencyChange = (option: PickerOption<string>) => {
    const currency = CURRENCY_OPTIONS.find((c) => c.code === option.value);
    if (!currency) return;
    form.setValue("currency", currency, { shouldValidate: true });
  };

  const onFormSubmit = async (data: CreateTripFormData) => {
    const tripId = await insertTrip({
      name: data.tripName,
      description: data.description,
      currencyCode: data.currency.code,
    });
    router.push(EXPO_ROUTER.EXPENSE(tripId));
  };

  const onInvalid = (errors: FieldErrors<CreateTripFormData>) => {
    formRef.current?.focusFirstErrorField(errors);
  };

  return {
    handleCurrencyChange,
    form,
    onFormSubmit,
    scrollViewRef,
    formRef,
    onInvalid,
  };
}
