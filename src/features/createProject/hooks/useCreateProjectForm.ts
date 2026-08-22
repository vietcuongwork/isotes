import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { PickerOption } from "../components/Picker";
import { CURRENCY_OPTIONS } from "../constants";
import { Currency } from "../types/TCreateProject";

export function useCreateProjectForm() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CURRENCY_OPTIONS[0],
  );
  const currencyPickerRef = useRef<BottomSheetModal>(null);

  const handleCurrencyChange = (option: PickerOption<string>) => {
    console.log(option.value);
    const currency = CURRENCY_OPTIONS.find((c) => c.code === option.value);
    console.log(currency);
    if (!currency) return;
    setSelectedCurrency(currency);
  };

  return {
    currencyPickerRef,
    selectedCurrency,
    setSelectedCurrency,
    handleCurrencyChange,
  };
}
