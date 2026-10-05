import { evaluateExpression } from "@/utils/calculator";
import { useMemo, useState } from "react";

// Not wired to NumberPad.tsx's current (operator-less) key set — this hook is
// on hold until the calculator/operator row returns, see AGENTS.md discussion
// (2026-09-27). Kept self-contained with its own key types so it still
// compiles standalone in the meantime.
type NumPadDigitKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | ".";
type NumPadOperatorKey = "+" | "-" | "×" | "÷";
type NumPadKey = NumPadDigitKey | NumPadOperatorKey | "=" | "backspace" | "enter";

const OPERATOR_REGEX = /[+\-×÷]/;
const TRAILING_OPERATOR_REGEX = /[+\-×÷]$/;

function isDigitKey(key: NumPadKey): key is NumPadDigitKey {
  return !OPERATOR_REGEX.test(key) && key !== "=" && key !== "backspace" && key !== "enter";
}

function isOperatorKey(key: NumPadKey): key is NumPadOperatorKey {
  return OPERATOR_REGEX.test(key) && key.length === 1;
}

// The number currently being typed, e.g. "12+3" -> "3" — used to block a
// second "." within the same operand.
function getCurrentOperand(expression: string): string {
  const parts = expression.split(OPERATOR_REGEX);
  return parts[parts.length - 1];
}

function appendDigit(expression: string, key: NumPadDigitKey): string {
  if (key === "." && getCurrentOperand(expression).includes(".")) {
    return expression;
  }
  return expression + key;
}

function appendOperator(expression: string, operator: NumPadOperatorKey): string {
  if (expression === "") return expression;
  if (TRAILING_OPERATOR_REGEX.test(expression)) {
    return expression.slice(0, -1) + operator;
  }
  return expression + operator;
}

interface UseNumberPadExpressionResult {
  algoDisplay: string;
  outputDisplay: number | null;
  handleKeyPress: (key: NumPadKey) => void;
}

export function useNumberPadExpression(
  onCommit: (value: number) => void,
): UseNumberPadExpressionResult {
  const [expression, setExpression] = useState("");
  const output = useMemo(() => evaluateExpression(expression), [expression]);

  function handleKeyPress(key: NumPadKey) {
    if (isDigitKey(key)) {
      setExpression((prev) => appendDigit(prev, key));
      return;
    }
    if (isOperatorKey(key)) {
      setExpression((prev) => appendOperator(prev, key));
      return;
    }
    if (key === "backspace") {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }
    if (key === "=") {
      setExpression((prev) => {
        const result = evaluateExpression(prev);
        return result === null ? prev : String(result);
      });
      return;
    }
    if (key === "enter" && output !== null) {
      onCommit(output);
      setExpression("");
    }
  }

  return { algoDisplay: expression, outputDisplay: output, handleKeyPress };
}
