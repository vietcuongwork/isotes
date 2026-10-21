import { Currency } from "@/types/TCreateTrip";

export interface CurrencyLetterGroup {
  letter: string;
  currencies: Currency[];
}

// The default when no trip has a known currency. A literal rather than a find
// in CURRENCY_OPTIONS, so the return type stays Currency with no undefined
const US_DOLLAR: Currency = {
  name: "US Dollar",
  code: "USD",
  symbol: "$",
  decimalDigits: 2,
};

// NFD splits "É" into "E" plus a combining accent (U+0300 to U+036F), which is dropped.
// "ł" has no NFD split (a stroke, not an accent), so it's mapped by hand
function stripAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L");
}

// Query and fields compare in the same form, so "Kč" and "kc" both find CZK
function toSearchText(text: string): string {
  return stripAccents(text).toLowerCase();
}

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

export function groupCurrenciesByLetter(
  options: Currency[],
): CurrencyLetterGroup[] {
  const sorted = [...options].sort((a, b) => a.name.localeCompare(b.name));
  const groups: CurrencyLetterGroup[] = [];
  for (const currency of sorted) {
    const letter = stripAccents(currency.name[0]).toUpperCase();
    const last = groups.at(-1);
    if (last?.letter === letter) last.currencies.push(currency);
    else groups.push({ letter, currencies: [currency] });
  }
  return groups;
}

export function getRecentCurrencies(
  codes: string[],
  options: Currency[],
  limit: number,
): Currency[] {
  const recent: Currency[] = [];
  for (const code of new Set(codes)) {
    const currency = options.find((option) => option.code === code);
    if (currency) recent.push(currency);
    if (recent.length === limit) break;
  }
  return recent;
}

export function filterCurrencies(
  options: Currency[],
  query: string,
): Currency[] {
  const needle = toSearchText(query.trim());
  return options.filter((option) =>
    [option.name, option.code, option.symbol].some((field) =>
      toSearchText(field).includes(needle),
    ),
  );
}

export function getPinnedLetter(
  headers: { letter: string; y: number }[],
  scrollY: number,
): string | null {
  let pinned: string | null = null;
  for (const header of headers) {
    if (header.y > scrollY) break;
    pinned = header.letter;
  }
  return pinned;
}
