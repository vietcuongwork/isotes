/**
 * Editing rules for the custom number pad. Pure: no React, no React Native,
 * so every rule is unit-tested without a simulator.
 */

export type DigitKey =
  "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type NumberPadKey = DigitKey | "000" | "." | "backspace";

export interface Selection {
  start: number;
  end: number;
}

export interface EditState {
  text: string;
  selection: Selection;
}

export interface NumberPadOptions {
  /** Max digits after the decimal point. `0` makes the field integer-only. Default: unlimited. */
  maxDecimals?: number;
  /** Max characters, decimal point included. Default: unlimited. */
  maxLength?: number;
  /** Max digits before the decimal point. Default: unlimited. */
  maxIntegerDigits?: number;
  /** Text is shown grouped ("1,234.5"): keys and pastes edit the raw number, the result is regrouped. */
  grouping?: boolean;
}

const NUMERIC = /^\d*(\.\d*)?$/;

function orderedSelection(text: string, { start, end }: Selection): Selection {
  const clamp = (n: number) =>
    Number.isFinite(n) ? Math.max(0, Math.min(text.length, n)) : text.length;
  const a = clamp(start);
  const b = clamp(end);
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/**
 * Canonical form, keeping the caret on the same logical character:
 * ".5" -> "0.5", "007" -> "7", "000" -> "0", "00.5" -> "0.5".
 */
function canonicalize(
  text: string,
  caret: number,
): { text: string; caret: number } {
  let out = text;
  let pos = caret;
  if (out.startsWith(".")) {
    out = `0${out}`;
    pos += 1;
  }
  while (out.length > 1 && out[0] === "0" && out[1] !== ".") {
    out = out.slice(1);
    pos = Math.max(0, pos - 1);
  }
  return { text: out, caret: pos };
}

export function isAllowed(
  text: string,
  { maxDecimals, maxLength, maxIntegerDigits }: NumberPadOptions = {},
): boolean {
  if (!NUMERIC.test(text)) return false;
  if (maxLength !== undefined && text.length > maxLength) return false;
  const dot = text.indexOf(".");
  const integerDigits = dot === -1 ? text.length : dot;
  if (maxIntegerDigits !== undefined && integerDigits > maxIntegerDigits)
    return false;
  if (dot === -1) return true;
  if (maxDecimals === 0) return false;
  return maxDecimals === undefined || text.length - dot - 1 <= maxDecimals;
}

/**
 * Applies one key press like a system keyboard would: insert at the caret or
 * replace the selection, delete backwards, then canonicalize.
 *
 * A key that would make the text invalid is rejected as a whole ("000" is
 * never partially inserted). Rejected or no-op keys return the *same* state
 * object, so callers can test `next === prev`.
 */
export function applyNumberPadKey(
  state: EditState,
  key: NumberPadKey,
  options: NumberPadOptions = {},
): EditState {
  if (options.grouping) return applyGroupedKey(state, key, options);
  const { text } = state;
  const { start, end } = orderedSelection(text, state.selection);
  const head = text.slice(0, start);
  const tail = text.slice(end);

  let raw: string;
  let caret: number;
  if (key === "backspace") {
    if (start === end && start === 0) return state;
    raw = start === end ? head.slice(0, -1) + tail : head + tail;
    caret = start === end ? start - 1 : start;
  } else {
    if (key === "." && (head + tail).includes(".")) return state;
    raw = head + key + tail;
    caret = start + key.length;
  }

  const next = canonicalize(raw, caret);
  if (!isAllowed(next.text, options)) return state;
  if (next.text === text && next.caret === start && start === end) return state;
  return { text: next.text, selection: { start: next.caret, end: next.caret } };
}

/**
 * Text that did not come from the pad (paste, dictation, a hardware keyboard)
 * is replayed key by key through `applyNumberPadKey`, so every entry path
 * follows the same rules. Characters that are not digits or a decimal
 * separator are dropped.
 *
 * Separators: when both "," and "." appear, "," is a thousands separator
 * ("1,234.5"). A lone "," is a decimal separator ("12,5").
 */
export function sanitizeNumericText(
  input: string,
  options: NumberPadOptions = {},
): string {
  // Grouped fields: "," is always a thousands separator, never a decimal one
  if (options.grouping) {
    const raw = stripGrouping(input);
    return groupInteger(
      sanitizeNumericText(raw, { ...options, grouping: false }),
    );
  }
  const commaIsDecimal = input.includes(",") && !input.includes(".");
  let state: EditState = { text: "", selection: { start: 0, end: 0 } };
  for (const char of input) {
    let key: NumberPadKey | null = null;
    if (char >= "0" && char <= "9") key = char as DigitKey;
    else if (char === "." || (char === "," && commaIsDecimal)) key = ".";
    if (key) state = applyNumberPadKey(state, key, options);
  }
  return state.text;
}

// ── Grouping (isotes): "1234.5" is shown as "1,234.5" ──────────────────────
// Edits run on the raw text (no commas); these map text and caret between
// the two forms. A raw position is "how many non-comma characters precede it".

const GROUP_SEPARATOR = ",";
const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

/** "1234.5" -> "1,234.5". Only the integer part is grouped. */
export function groupInteger(raw: string): string {
  const dot = raw.indexOf(".");
  const integer = dot === -1 ? raw : raw.slice(0, dot);
  const rest = dot === -1 ? "" : raw.slice(dot);
  return integer.replace(THOUSANDS, GROUP_SEPARATOR) + rest;
}

/** "1,234.5" -> "1234.5". */
export function stripGrouping(display: string): string {
  return display.split(GROUP_SEPARATOR).join("");
}

/** Caret in the grouped text -> caret in the raw text. */
export function toRawCaret(display: string, caret: number): number {
  let raw = 0;
  for (let i = 0; i < Math.min(caret, display.length); i++) {
    if (display[i] !== GROUP_SEPARATOR) raw++;
  }
  return raw;
}

/**
 * Caret in the raw text -> caret in its grouped form, placed right after the
 * rawCaret-th character (before a comma that follows it), so the caret stays
 * next to the digit it was next to.
 */
export function toDisplayCaret(raw: string, rawCaret: number): number {
  const display = groupInteger(raw);
  if (rawCaret <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < display.length; i++) {
    if (display[i] !== GROUP_SEPARATOR) seen++;
    if (seen === rawCaret) return i + 1;
  }
  return display.length;
}

/**
 * applyNumberPadKey for grouped text: the edit runs on the raw number, then
 * the result is regrouped. Backspace right after a comma lands on the digit
 * before it, because both positions map to the same raw caret.
 */
function applyGroupedKey(
  state: EditState,
  key: NumberPadKey,
  options: NumberPadOptions,
): EditState {
  const { text } = state;
  const { start, end } = orderedSelection(text, state.selection);
  const rawState: EditState = {
    text: stripGrouping(text),
    selection: { start: toRawCaret(text, start), end: toRawCaret(text, end) },
  };
  const next = applyNumberPadKey(rawState, key, {
    ...options,
    grouping: false,
  });
  if (next === rawState) return state;
  const display = groupInteger(next.text);
  const caret = toDisplayCaret(next.text, next.selection.start);
  if (display === text && caret === start && start === end) return state;
  return { text: display, selection: { start: caret, end: caret } };
}
