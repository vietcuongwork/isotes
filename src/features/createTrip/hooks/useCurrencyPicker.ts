import { CURRENCY_OPTIONS } from "../constants";

export function useCreateTrip() {
  const currencyOptions = CURRENCY_OPTIONS.map((c) => ({
    label: `${c.name} (${c.code}) - ${c.symbol}`,
    value: c.code,
  }));

  return {
    currencyOptions,
  };
}
