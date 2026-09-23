// Number can only represent integers exactly up to 2^53-1 (16 digits) —
// beyond that, Number(...) rounds and toLocaleString displays garbage.
const MAX_INTEGER_DIGITS = 15;

// Read-only display formatting, e.g. "$1,234.50" — same en-US grouping as
// formatAmountInput, so editable and read-only amounts always match.
export function formatDisplayAmount(
  amount: number,
  symbol: string,
  decimalDigits: number,
): string {
  const grouped = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
  });
  return `${symbol}${grouped}`;
}

// Live text-input mask, not display formatting — deliberately locale-fixed
// (comma grouping, dot decimal) so it can't collide with the "." the user
// just typed as a decimal point.
//
// Two cases:
// - decimalDigits === 0: auto thousands-separator on the whole number, "."
//   is always ignored (no decimal entry allowed at all).
// - decimalDigits > 0: "." is only accepted after at least one digit (a
//   leading "." is ignored, same as case 1), and at most decimalDigits
//   digits are kept after it.
// See discussion in chat (2026-09-18).
export function formatAmountInput(
  rawInput: string,
  decimalDigits: number,
): string {
  const cleaned = rawInput.replace(/,/g, "").replace(/[^\d.]/g, "");

  const dotIndex = cleaned.indexOf(".");
  // A "." only counts as the decimal point if it comes after at least one
  // digit — a leading "." (or any "." when decimalDigits is 0) is ignored.
  const hasDecimal = decimalDigits > 0 && dotIndex > 0;

  const integerDigits = hasDecimal
    ? cleaned.slice(0, dotIndex).slice(0, MAX_INTEGER_DIGITS)
    : cleaned.replace(/\./g, "").slice(0, MAX_INTEGER_DIGITS);
  const typedDecimalDigits = hasDecimal
    ? cleaned.slice(dotIndex + 1).replace(/\./g, "").slice(0, decimalDigits)
    : "";

  const groupedInteger = integerDigits
    ? Number(integerDigits).toLocaleString("en-US")
    : "";

  return hasDecimal ? `${groupedInteger}.${typedDecimalDigits}` : groupedInteger;
}

// Reverses formatAmountInput's display grouping back to a plain number
// for math — Number() alone chokes on the "," in e.g. "2,444" and returns NaN.
export function parseAmountInput(displayValue: string): number {
  return Number(displayValue.replace(/,/g, "")) || 0;
}

// Rounds an amount to the nearest decimalDigits (half up) — used to compute
// each member's persisted share for "equally"/"shares" splits. See
// design_decisions.md "Equal/shares split rounds to nearest, tolerated via
// an acceptable rounding gap" (2026-09-23).
export function roundToDecimals(amount: number, decimalDigits: number): number {
  const scale = 10 ** decimalDigits;
  return Math.round(amount * scale) / scale;
}

// Worst-case total rounding drift when N independent shares of a total are
// each rounded (not floored) to decimalDigits: each person's own rounding
// can land up to half a minor unit away from their exact share, so the sum
// across all N can miss the total by up to ⌈N/2⌉ minor units. Used to tell
// an unavoidable rounding remainder apart from a real "still needs
// assigning" gap.
export function getAcceptableSplitGap(
  participantCount: number,
  decimalDigits: number,
): number {
  const minorUnit = 1 / 10 ** decimalDigits;
  return Math.ceil(participantCount / 2) * minorUnit;
}

