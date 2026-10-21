import { Currency } from "@/types/TCreateTrip";

// The default when no trip has a known currency. A literal rather than a find
// in CURRENCY_OPTIONS, so the return type stays Currency with no undefined
const US_DOLLAR: Currency = {
  name: "US Dollar",
  code: "USD",
  symbol: "$",
  decimalDigits: 2,
};

export function getDefaultCurrency(
  codes: string[],
  options: Currency[],
): Currency {
  for (const code of codes) {
    const currency = options.find((option) => option.code === code);
    if (currency) return currency;
  }
  return US_DOLLAR;
}
