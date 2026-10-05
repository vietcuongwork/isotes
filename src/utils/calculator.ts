type Operator = "+" | "-" | "×" | "÷";

type Token = { type: "number"; value: number } | { type: "operator"; value: Operator };

// Splits an expression built by the numpad ("2×2", "10+5-3") into number/operator
// tokens. No parentheses support — the numpad never emits them.
function tokenizeExpression(expression: string): Token[] {
  const matches = expression.match(/(\d+\.?\d*)|[+\-×÷]/g);
  if (!matches) return [];

  return matches.map((token) =>
    /^[+\-×÷]$/.test(token)
      ? { type: "operator", value: token as Operator }
      : { type: "number", value: Number(token) },
  );
}

// Two passes (× ÷ first, then + −) rather than a single left-to-right scan, so
// "2+3×4" evaluates to 14 like a standard calculator, not 20.
function evaluateTokens(tokens: Token[]): number | null {
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  if (!first || first.type !== "number" || !last || last.type !== "number") {
    return null;
  }

  const reduced: Token[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type === "operator" && (token.value === "×" || token.value === "÷")) {
      const left = reduced.pop();
      const right = tokens[i + 1];
      if (!left || left.type !== "number" || !right || right.type !== "number") return null;
      if (token.value === "÷" && right.value === 0) return null;

      const value = token.value === "×" ? left.value * right.value : left.value / right.value;
      reduced.push({ type: "number", value });
      i += 1;
    } else {
      reduced.push(token);
    }
  }

  let total = (reduced[0] as { type: "number"; value: number }).value;
  for (let i = 1; i < reduced.length; i += 2) {
    const operator = reduced[i];
    const operand = reduced[i + 1];
    if (!operator || operator.type !== "operator" || !operand || operand.type !== "number") {
      return null;
    }
    total = operator.value === "+" ? total + operand.value : total - operand.value;
  }

  return total;
}

// Returns null for an incomplete ("2×"), malformed, or divide-by-zero
// expression, so the live output pill can show blank instead of crashing.
export function evaluateExpression(expression: string): number | null {
  const result = evaluateTokens(tokenizeExpression(expression));
  if (result === null) return null;

  // Trims float noise (0.1+0.2 -> 0.30000000000000004) before it reaches display.
  return Math.round(result * 1e10) / 1e10;
}
