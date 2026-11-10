import { getTripCardState, TripCardState } from "@/domain/tripBalance";
import { formatDisplayAmount } from "@/utils/currency";

// createdAt is in Unix seconds; the year shows only when it isn't now's year
export function formatTripCreatedDate(createdAt: number, now: Date): string {
  const created = new Date(createdAt * 1000);
  const isThisYear = created.getFullYear() === now.getFullYear();
  return created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: isThisYear ? undefined : "numeric",
  });
}

export function formatTripDateLine(
  createdAt: number,
  currencyCode: string,
  now: Date,
): string {
  return `Created ${formatTripCreatedDate(createdAt, now)} · ${currencyCode}`;
}

export function formatExpenseCount(count: number): string {
  return `${count} ${count === 1 ? "expense" : "expenses"}`;
}

export function formatPersonNet(input: {
  net: number;
  expenseCount: number;
  decimalDigits: number;
  symbol: string;
  isOwner: boolean;
}): { tone: TripCardState; amount: string; word: string } {
  const { net, expenseCount, decimalDigits, symbol, isOwner } = input;
  const tone = getTripCardState({ expenseCount, balance: net, decimalDigits });
  if (tone === "empty") return { tone, amount: "", word: "" };

  const money = formatDisplayAmount(
    tone === "square" ? 0 : Math.abs(net),
    symbol,
    decimalDigits,
  );
  if (tone === "square") return { tone, amount: money, word: "all square" };
  if (tone === "get") {
    return {
      tone,
      amount: "+" + money,
      word: isOwner ? "you get back" : "gets back",
    };
  }
  return { tone, amount: "−" + money, word: isOwner ? "you owe" : "owes" };
}
