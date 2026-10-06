import {
  applyNumberPadKey,
  EditState,
  isAllowed,
  NumberPadKey,
  NumberPadOptions,
  sanitizeNumericText,
} from "../keyboard/numberPadLogic";

const at = (text: string, start = text.length, end = start): EditState => ({
  text,
  selection: { start, end },
});
const typeKeys = (keys: NumberPadKey[], options?: NumberPadOptions) =>
  keys.reduce((s, k) => applyNumberPadKey(s, k, options), at("")).text;

describe("insert", () => {
  it("appends at the caret", () => expect(typeKeys(["4", "2"])).toBe("42"));
  it("inserts mid-text and moves the caret past the insert", () =>
    expect(applyNumberPadKey(at("15", 1), "2")).toEqual(at("125", 2)));
  it("replaces the selection", () =>
    expect(applyNumberPadKey(at("98765", 1, 4), "0")).toEqual(at("905", 2)));
  it("inserts 000 as one block", () => {
    expect(typeKeys(["7", "000"])).toBe("7000");
    expect(applyNumberPadKey(at("12", 1), "000")).toEqual(at("10002", 4));
  });
});

describe("leading zeros", () => {
  it("a digit replaces a lone 0", () => expect(typeKeys(["0", "8"])).toBe("8"));
  it("000 on empty becomes 0", () =>
    expect(applyNumberPadKey(at(""), "000")).toEqual(at("0", 1)));
  it("000 before an integer is a no-op", () => {
    const s = at("5", 0);
    expect(applyNumberPadKey(s, "000")).toBe(s);
  });
  it("keeps the 0 in front of a decimal point", () => {
    expect(typeKeys(["0", ".", "0", "5"])).toBe("0.05");
    expect(typeKeys([".", "000"])).toBe("0.000");
  });
  it("collapses zeros exposed by a delete", () =>
    expect(applyNumberPadKey(at("100", 1), "backspace")).toEqual(at("0", 0)));
  it('0 on "0" is a no-op (same object)', () => {
    const s = at("0");
    expect(applyNumberPadKey(s, "0")).toBe(s);
  });
});

describe("decimal point", () => {
  it('"." on empty gives "0."', () =>
    expect(applyNumberPadKey(at(""), ".")).toEqual(at("0.", 2)));
  it('"." at the start gives a leading 0', () =>
    expect(applyNumberPadKey(at("25", 0), ".")).toEqual(at("0.25", 2)));
  it('a second "." is rejected', () => {
    const s = at("3.1");
    expect(applyNumberPadKey(s, ".")).toBe(s);
  });
  it('"." may replace a selection that contains the existing one', () =>
    expect(applyNumberPadKey(at("3.1", 1, 2), ".")).toEqual(at("3.1", 2)));
  it("maxDecimals rejects keys as a whole", () => {
    expect(typeKeys(["1", ".", "2", "3", "4"], { maxDecimals: 2 })).toBe(
      "1.23",
    );
    const s = at("1.2");
    expect(applyNumberPadKey(s, "000", { maxDecimals: 2 })).toBe(s);
  });
  it("integer digits can still be added when decimals are full", () =>
    expect(applyNumberPadKey(at("1.23", 1), "9", { maxDecimals: 2 })).toEqual(
      at("19.23", 2),
    ));
  it('maxDecimals 0 disables "."', () => {
    const s = at("12");
    expect(applyNumberPadKey(s, ".", { maxDecimals: 0 })).toBe(s);
  });
});

describe("backspace", () => {
  it("deletes before the caret", () =>
    expect(applyNumberPadKey(at("123", 2), "backspace")).toEqual(at("13", 1)));
  it("deletes the selection", () =>
    expect(applyNumberPadKey(at("12345", 1, 4), "backspace")).toEqual(
      at("15", 1),
    ));
  it("is a no-op at the start", () => {
    const s = at("12", 0);
    expect(applyNumberPadKey(s, "backspace")).toBe(s);
  });
  it("can empty the field", () =>
    expect(applyNumberPadKey(at("7"), "backspace")).toEqual(at("", 0)));
});

describe("limits and robustness", () => {
  it("maxLength", () =>
    expect(typeKeys(["1", "2", "3", "4"], { maxLength: 3 })).toBe("123"));
  it("clamps an out-of-range or reversed selection", () => {
    expect(
      applyNumberPadKey({ text: "12", selection: { start: 50, end: 50 } }, "3"),
    ).toEqual(at("123", 3));
    expect(
      applyNumberPadKey({ text: "1234", selection: { start: 3, end: 1 } }, "9"),
    ).toEqual(at("194", 2));
  });
  it("random key sequences always yield a valid number and an in-range caret", () => {
    const keys: NumberPadKey[] = ["0", "1", "7", "000", ".", "backspace"];
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const options = { maxDecimals: 3, maxLength: 10 };
    for (let run = 0; run < 400; run++) {
      let s = at("");
      for (let i = 0; i < 40; i++) {
        const a = Math.floor(rand() * (s.text.length + 1));
        const b = rand() < 0.2 ? Math.floor(rand() * (s.text.length + 1)) : a;
        s = applyNumberPadKey(
          { ...s, selection: { start: a, end: b } },
          keys[Math.floor(rand() * keys.length)],
          options,
        );
        expect(isAllowed(s.text, options)).toBe(true);
        expect(s.text).not.toMatch(/^0\d/);
        expect(s.selection.start).toBeGreaterThanOrEqual(0);
        expect(s.selection.start).toBeLessThanOrEqual(s.text.length);
      }
    }
  });
});

describe("sanitizeNumericText (paste / hardware keyboard)", () => {
  it("keeps a valid number", () =>
    expect(sanitizeNumericText("1234.56")).toBe("1234.56"));
  it('treats "," as thousands separator when "." is present', () =>
    expect(sanitizeNumericText("$1,234.5")).toBe("1234.5"));
  it('treats a lone "," as the decimal separator', () =>
    expect(sanitizeNumericText("12,5")).toBe("12.5"));
  it("drops junk and leading zeros", () =>
    expect(sanitizeNumericText(" 007 abc")).toBe("7"));
  it("applies the same limits as the pad", () => {
    expect(sanitizeNumericText("9.999", { maxDecimals: 2 })).toBe("9.99");
    expect(sanitizeNumericText("123456", { maxLength: 4 })).toBe("1234");
  });
});
