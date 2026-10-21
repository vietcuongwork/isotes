import { CURRENCY_OPTIONS } from "@/features/createTrip/constants";
import {
  filterCurrencies,
  getDefaultCurrency,
  getPinnedLetter,
  getRecentCurrencies,
  groupCurrenciesByLetter,
} from "@/features/createTrip/helpers/currencyHelpers";

describe("getDefaultCurrency", () => {
  it("gives US Dollar when there are no trips", () => {
    expect(getDefaultCurrency([], CURRENCY_OPTIONS)).toEqual({
      name: "US Dollar",
      code: "USD",
      symbol: "$",
      decimalDigits: 2,
    });
  });

  it("gives the newest trip's currency", () => {
    // codes arrive newest trip first
    expect(getDefaultCurrency(["VND", "AUD"], CURRENCY_OPTIONS).name).toBe(
      "Vietnamese Dong",
    );
  });

  it("skips a newest trip whose code isn't a known currency", () => {
    expect(getDefaultCurrency(["XYZ", "JPY"], CURRENCY_OPTIONS).name).toBe(
      "Japanese Yen",
    );
  });

  it("gives US Dollar when no trip has a known code", () => {
    expect(getDefaultCurrency(["XYZ", "ABC"], CURRENCY_OPTIONS).code).toBe(
      "USD",
    );
  });
});

describe("groupCurrenciesByLetter", () => {
  it("gives no groups for an empty list", () => {
    expect(groupCurrenciesByLetter([])).toEqual([]);
  });

  it("sorts by name and makes one group per first letter", () => {
    const euro = { name: "Euro", code: "EUR", symbol: "€", decimalDigits: 2 };
    const yen = {
      name: "Japanese Yen",
      code: "JPY",
      symbol: "¥",
      decimalDigits: 0,
    };
    const real = {
      name: "Brazilian Real",
      code: "BRL",
      symbol: "R$",
      decimalDigits: 2,
    };
    const pound = {
      name: "British Pound",
      code: "GBP",
      symbol: "£",
      decimalDigits: 2,
    };

    expect(groupCurrenciesByLetter([yen, pound, euro, real])).toEqual([
      { letter: "B", currencies: [real, pound] },
      { letter: "E", currencies: [euro] },
      { letter: "J", currencies: [yen] },
    ]);
  });

  it("files an accented or lowercase first letter under its plain capital", () => {
    const ecu = { name: "Écu", code: "XEU", symbol: "₠", decimalDigits: 2 };
    const euro = { name: "Euro", code: "EUR", symbol: "€", decimalDigits: 2 };
    const zloty = {
      name: "złoty",
      code: "PLN",
      symbol: "zł",
      decimalDigits: 2,
    };

    expect(groupCurrenciesByLetter([euro, zloty, ecu])).toEqual([
      { letter: "E", currencies: [ecu, euro] },
      { letter: "Z", currencies: [zloty] },
    ]);
  });

  it("gives the app's currencies the letters A to V in order", () => {
    const groups = groupCurrenciesByLetter(CURRENCY_OPTIONS);

    expect(groups.map((group) => group.letter).join("")).toBe(
      "ABCDEHIJMNPRSTUV",
    );
    expect(
      groups
        .find((group) => group.letter === "U")
        ?.currencies.map((c) => c.code),
    ).toEqual(["UAH", "AED", "USD"]);
  });
});

describe("getRecentCurrencies", () => {
  it("gives none when there are no trips", () => {
    expect(getRecentCurrencies([], CURRENCY_OPTIONS, 3)).toEqual([]);
  });

  it("gives each trip currency once, newest trip first", () => {
    // codes arrive newest trip first
    const recent = getRecentCurrencies(
      ["VND", "AUD", "VND", "AUD"],
      CURRENCY_OPTIONS,
      3,
    );

    expect(recent.map((currency) => currency.name)).toEqual([
      "Vietnamese Dong",
      "Australian Dollar",
    ]);
  });

  it("stops at the limit", () => {
    const recent = getRecentCurrencies(
      ["JPY", "EUR", "VND", "AUD"],
      CURRENCY_OPTIONS,
      3,
    );

    expect(recent.map((currency) => currency.code)).toEqual([
      "JPY",
      "EUR",
      "VND",
    ]);
  });

  it("skips a trip whose code isn't a known currency", () => {
    const recent = getRecentCurrencies(
      ["XYZ", "EUR", "ABC", "JPY", "VND"],
      CURRENCY_OPTIONS,
      3,
    );

    expect(recent.map((currency) => currency.code)).toEqual([
      "EUR",
      "JPY",
      "VND",
    ]);
  });

  it("gives fewer than the limit when trips use fewer currencies", () => {
    const recent = getRecentCurrencies(
      ["EUR", "XYZ", "EUR"],
      CURRENCY_OPTIONS,
      3,
    );

    expect(recent.map((currency) => currency.code)).toEqual(["EUR"]);
  });
});

describe("getPinnedLetter", () => {
  // each header's y in the list's content, top to bottom
  const headers = [
    { letter: "A", y: 84 },
    { letter: "B", y: 180 },
    { letter: "C", y: 332 },
  ];

  it("pins nothing while the list's top is above the first header", () => {
    expect(getPinnedLetter(headers, 40)).toBeNull();
  });

  it("pins the last header scrolled to or past the list's top", () => {
    expect(getPinnedLetter(headers, 84)).toBe("A");
    expect(getPinnedLetter(headers, 250)).toBe("B");
    expect(getPinnedLetter(headers, 900)).toBe("C");
  });
});

describe("filterCurrencies", () => {
  it("gives every currency for an empty or blank query", () => {
    expect(filterCurrencies(CURRENCY_OPTIONS, "")).toEqual(CURRENCY_OPTIONS);
    expect(filterCurrencies(CURRENCY_OPTIONS, "   ")).toEqual(CURRENCY_OPTIONS);
  });

  it("matches the code, ignoring case", () => {
    const codes = (query: string) =>
      filterCurrencies(CURRENCY_OPTIONS, query).map((c) => c.code);

    expect(codes("eur")).toEqual(["EUR"]);
    // "US Dollar" doesn't contain "usd", so only the code matches
    expect(codes("usd")).toEqual(["USD"]);
  });

  it("matches the name, ignoring accents and case", () => {
    expect(
      filterCurrencies(CURRENCY_OPTIONS, "zloty").map((c) => c.name),
    ).toEqual(["Polish Złoty"]);
    expect(
      filterCurrencies(CURRENCY_OPTIONS, "ZLOTY").map((c) => c.name),
    ).toEqual(["Polish Złoty"]);
  });

  it("trims spaces around the query", () => {
    expect(
      filterCurrencies(CURRENCY_OPTIONS, "  eur  ").map((c) => c.code),
    ).toEqual(["EUR"]);
  });

  it("matches the symbol", () => {
    const codes = (query: string) =>
      filterCurrencies(CURRENCY_OPTIONS, query).map((c) => c.code);

    expect(codes("¥")).toEqual(["CNY", "JPY"]);
    // every dollar, plus the real's R$
    expect(codes("$")).toEqual([
      "AUD",
      "BRL",
      "CAD",
      "HKD",
      "MXN",
      "NZD",
      "SGD",
      "TWD",
      "USD",
    ]);
  });

  it("matches a symbol typed with its accent", () => {
    expect(filterCurrencies(CURRENCY_OPTIONS, "Kč").map((c) => c.code)).toEqual(
      ["CZK"],
    );
  });

  it("matches kr by symbol, code and name", () => {
    // kroner by symbol, the won by its code KRW, the hryvnia by its name
    expect(filterCurrencies(CURRENCY_OPTIONS, "kr").map((c) => c.code)).toEqual(
      ["DKK", "NOK", "KRW", "SEK", "UAH"],
    );
  });

  it("gives none when nothing matches", () => {
    expect(filterCurrencies(CURRENCY_OPTIONS, "bitcoin")).toEqual([]);
  });
});
