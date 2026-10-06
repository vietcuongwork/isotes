// isotes extensions to numberPadLogic (kept apart from numberPadLogic.test.ts,
// which stays diffable against the reference repo)
import {
  applyNumberPadKey,
  EditState,
  groupInteger,
  isAllowed,
  NumberPadKey,
  NumberPadOptions,
  sanitizeNumericText,
  stripGrouping,
  toDisplayCaret,
  toRawCaret,
} from "../keyboard/numberPadLogic";
import { formatAmountInput } from "@/utils/currency";

const at = (text: string, start = text.length, end = start): EditState => ({
  text,
  selection: { start, end },
});
const type = (
  keys: NumberPadKey[],
  options: NumberPadOptions,
  from: EditState = at(""),
) => keys.reduce((s, k) => applyNumberPadKey(s, k, options), from);

describe("maxIntegerDigits", () => {
  const opts = { maxIntegerDigits: 4, maxDecimals: 2 };

  it("caps the digits before the decimal point, not after it", () => {
    expect(isAllowed("1234", opts)).toBe(true);
    expect(isAllowed("12345", opts)).toBe(false);
    expect(isAllowed("1234.56", opts)).toBe(true);
  });

  it("rejects a digit that would push the integer part past the cap", () => {
    const full = at("1234");
    expect(applyNumberPadKey(full, "5", opts)).toBe(full);
  });

  it("rejects 000 whole near the cap instead of inserting part of it", () => {
    const near = at("12");
    expect(applyNumberPadKey(near, "000", opts)).toBe(near);
    expect(applyNumberPadKey(at("1"), "000", opts).text).toBe("1000");
  });

  it("allows a selection replace that keeps the integer part within the cap", () => {
    const selected = at("1234", 1, 3); // "23" selected
    expect(applyNumberPadKey(selected, "9", opts)).toEqual(at("194", 2));
  });

  it("still allows decimals once the integer part is full", () => {
    expect(type([".", "5"], opts, at("1234")).text).toBe("1234.5");
  });

  it("drops pasted digits past the cap", () => {
    expect(sanitizeNumericText("123456.78", opts)).toBe("1234.78");
  });
});

describe("grouping helpers", () => {
  it.each([
    ["", ""],
    ["0", "0"],
    ["123", "123"],
    ["1234", "1,234"],
    ["1234567", "1,234,567"],
    ["1234.5678", "1,234.5678"],
    ["1234.", "1,234."],
    ["0.5", "0.5"],
  ])("groupInteger(%p) = %p and stripGrouping reverses it", (raw, grouped) => {
    expect(groupInteger(raw)).toBe(grouped);
    expect(stripGrouping(grouped)).toBe(raw);
  });

  it("toRawCaret counts the non-comma characters before the caret", () => {
    // "1,234": 0|1|,|2|3|4
    expect([0, 1, 2, 3, 4, 5].map((c) => toRawCaret("1,234", c))).toEqual([
      0, 1, 1, 2, 3, 4,
    ]);
  });

  it("toDisplayCaret puts the caret right after its digit, before a following comma", () => {
    expect([0, 1, 2, 3, 4].map((c) => toDisplayCaret("1234", c))).toEqual([
      0, 1, 3, 4, 5,
    ]);
    expect(toDisplayCaret("1234567.8", 7)).toBe(9); // after "7", before "."
  });

  it("round-trips every caret position", () => {
    const raw = "1234567.89";
    for (let c = 0; c <= raw.length; c++) {
      expect(toRawCaret(groupInteger(raw), toDisplayCaret(raw, c))).toBe(c);
    }
  });
});

describe("grouping option", () => {
  const opts: NumberPadOptions = {
    grouping: true,
    maxDecimals: 2,
    maxIntegerDigits: 15,
  };

  it("groups as you type: 1 2 3 4 . 5 -> 1,234.5", () => {
    const steps: string[] = [];
    let s = at("");
    for (const k of ["1", "2", "3", "4", ".", "5"] as NumberPadKey[]) {
      s = applyNumberPadKey(s, k, opts);
      steps.push(s.text);
    }
    expect(steps).toEqual(["1", "12", "123", "1,234", "1,234.", "1,234.5"]);
    expect(s.selection).toEqual({ start: 7, end: 7 });
  });

  it("keeps the caret on its digit when a comma appears", () => {
    // "123|" + "4" -> "1,234|" (caret 3 -> 5)
    expect(applyNumberPadKey(at("123"), "4", opts)).toEqual(at("1,234", 5));
    // "1|,234" + "5" -> "15|,234"
    expect(applyNumberPadKey(at("1,234", 1), "5", opts)).toEqual(
      at("15,234", 2),
    );
  });

  it("keeps the caret on its digit when a comma disappears", () => {
    // "1,234|" backspace -> "123|"
    expect(applyNumberPadKey(at("1,234"), "backspace", opts)).toEqual(
      at("123", 3),
    );
    // "12,3|45" backspace -> "1,2|45" (raw "12345" caret 3 -> "1245" caret 2)
    expect(applyNumberPadKey(at("12,345", 4), "backspace", opts)).toEqual(
      at("1,245", 3),
    );
  });

  it("delete right after a comma removes the digit before it", () => {
    // "1,|234" -> "|234"
    expect(applyNumberPadKey(at("1,234", 2), "backspace", opts)).toEqual(
      at("234", 0),
    );
  });

  it("replaces a selection that spans a comma", () => {
    // "1[,23]4" selected, type 9 -> raw "1" + "9" + "4" = "194"
    expect(applyNumberPadKey(at("1,234", 1, 4), "9", opts)).toEqual(
      at("194", 2),
    );
  });

  it("returns the same state for a rejected key", () => {
    const s = at("1,234.56");
    expect(applyNumberPadKey(s, "7", opts)).toBe(s); // 3rd decimal
    expect(applyNumberPadKey(s, ".", opts)).toBe(s); // 2nd point
  });

  it("caps the integer part at maxIntegerDigits counted without commas", () => {
    const full = at("999,999,999,999,999");
    expect(applyNumberPadKey(full, "9", opts)).toBe(full);
  });

  it.each([
    ["1,234.56", "1,234.56"],
    ["1234.56", "1,234.56"],
    ["1,234", "1,234"], // not 1.234: with grouping "," is always a separator
    ["$ 12,345.6", "12,345.6"],
    ["007", "7"],
  ])("sanitizes a paste of %p to %p", (pasted, expected) => {
    expect(sanitizeNumericText(pasted, opts)).toBe(expected);
  });

  // The parent stores what formatAmountInput produces; if the two disagree,
  // NumberPadInput reads the parent's echo as a reformat and drops the caret.
  it.each([
    "",
    "0",
    "7",
    "12",
    "123",
    "1234",
    "12345",
    "123456",
    "1234567",
    "0.",
    "0.5",
    "0.05",
    "1234.",
    "1234.5",
    "1234.56",
    "1000000.",
    "999999999999999",
    "999999999999999.99",
  ])("matches formatAmountInput for canonical raw %p", (raw) => {
    expect(groupInteger(raw)).toBe(formatAmountInput(raw, 2));
    expect(sanitizeNumericText(raw, opts)).toBe(formatAmountInput(raw, 2));
  });

  it("matches formatAmountInput for integer-only currencies", () => {
    const yen = { ...opts, maxDecimals: 0 };
    for (const raw of ["", "5", "1234", "1234567"]) {
      expect(sanitizeNumericText(raw, yen)).toBe(formatAmountInput(raw, 0));
    }
  });
});
