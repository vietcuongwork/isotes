import { CURRENCY_OPTIONS } from "@/features/createTrip/constants";
import { getDefaultCurrency } from "@/features/createTrip/helpers/currencyHelpers";

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
