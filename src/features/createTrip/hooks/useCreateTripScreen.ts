import { insertTrip } from "@/db/trips";
import { EXPO_ROUTER } from "@/navigation/route";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { CreateTripFormHandle } from "../components/CreateTripForm";
import { PickerOption } from "../components/Picker";
import { CURRENCY_OPTIONS } from "../constants";
import {
  CreateTripFormData,
  createTripFormSchema,
} from "../validation/createTripFormSchema";

export function useCreateTripScreen() {
  const currencyPickerRef = useRef<BottomSheetModal>(null);
  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);
  const formRef = useRef<CreateTripFormHandle>(null);

  const router = useRouter();

  const defaultFormValues = useMemo(() => {
    return {
      tripName: "",
      description: "",
      currency: CURRENCY_OPTIONS[0],
    };
  }, []);

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

  const onBack = () => {
    router.back();
  };

  return {
    currencyPickerRef,
    handleCurrencyChange,
    form,
    onFormSubmit,
    scrollViewRef,
    formRef,
    onInvalid,
    onBack,
  };
}
