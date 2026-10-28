import {
  getAmountsRemainder,
  getRoundingRemainder,
} from "@/features/expense/helpers/expenseHelpers";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { Member, SplitSelection } from "@/types/TExpense";
import {
  floorToDecimals,
  formatDisplayAmount,
  parseAmountInput,
} from "@/utils/currency";
import { cn } from "@/utils/cn";
import { CheckCircle2, CircleAlert } from "lucide-react-native";
import { ReactNode, useMemo } from "react";
import { Text, View } from "react-native";

type SummaryVariant = "section" | "sheet";
type ResultTone = "ok" | "error" | "muted";

interface SplitSummaryProps {
  variant: SummaryVariant;
}

// One result line for every split method, in the light design
function ResultLine(props: { tone: ResultTone; children: ReactNode }) {
  const { tone, children } = props;

  const iconColor = tone === "ok" ? colors.get[600] : colors.owe[600];
  return (
    <View className="flex-row items-center justify-center gap-space-2">
      {tone === "ok" && <CheckCircle2 size={16} color={iconColor} />}
      {tone === "error" && <CircleAlert size={16} color={iconColor} />}
      <Text
        className={cn(
          "text-center text-caption",
          tone === "ok" && "text-get-600",
          tone === "error" && "text-owe-600",
          tone === "muted" && "text-ink-500",
        )}
      >
        {children}
      </Text>
    </View>
  );
}

function NobodySelected() {
  return <ResultLine tone="error">Nobody selected</ResultLine>;
}

// The panel has no split to show until there is an amount
function EnterAmount() {
  return <ResultLine tone="muted">Enter an amount to see the split</ResultLine>;
}

function TotalAmountRow(props: {
  amount: string;
  symbol: string;
  decimalDigits: number;
}) {
  const { amount, symbol, decimalDigits } = props;
  const placeholder = decimalDigits === 0 ? "0" : "0.00";
  return (
    <View className="flex-row items-baseline justify-center gap-space-2">
      <Text className="text-ink-900 text-title">{`${symbol} ${amount ? amount : placeholder}`}</Text>
      <Text className="text-ink-500 text-caption">to split</Text>
    </View>
  );
}

function EquallySummary(props: {
  variant: SummaryVariant;
  members: Member[];
  selection: SplitSelection;
  paidByMemberId: string;
  parsedAmountInput: number;
  symbol: string;
  decimalDigits: number;
}) {
  const {
    variant,
    members,
    selection,
    paidByMemberId,
    parsedAmountInput,
    symbol,
    decimalDigits,
  } = props;
  const count = selection.selectedMemberIds.length;

  if (count === 0) {
    return <NobodySelected />;
  }

  if (variant === "section" && parsedAmountInput === 0) {
    return <EnterAmount />;
  }

  const { baseAmount, absorberId, remainder } = getRoundingRemainder(
    members,
    "equally",
    parsedAmountInput,
    decimalDigits,
    selection,
    paidByMemberId,
  );

  return (
    <ResultLine tone="ok">
      {formatDisplayAmount(baseAmount, symbol, decimalDigits)} each ·{" "}
      {remainder > 0
        ? `${members.find((member) => member.id === absorberId)?.name} covers the extra ${formatDisplayAmount(remainder, symbol, decimalDigits)}`
        : `${count} people`}
    </ResultLine>
  );
}

// A leftover is only an error once there's no auto member left to absorb
// it; an overage (remainder < 0) is always an error. See design_decisions.md
// "Amounts split validates against an exact sum".
function AmountsSummary(props: {
  variant: SummaryVariant;
  totalAmount: string;
  members: Member[];
  splitAmounts: Record<string, string>;
  selectedMemberIds: string[];
  parsedAmountInput: number;
  symbol: string;
  decimalDigits: number;
}) {
  const {
    variant,
    totalAmount,
    members,
    splitAmounts,
    selectedMemberIds,
    parsedAmountInput,
    symbol,
    decimalDigits,
  } = props;

  const { remainder, autoMembers } = getAmountsRemainder(
    members,
    splitAmounts,
    selectedMemberIds,
    parsedAmountInput,
    decimalDigits,
  );

  if (selectedMemberIds.length === 0) {
    return <NobodySelected />;
  }

  if (variant === "section" && parsedAmountInput === 0) {
    return <EnterAmount />;
  }

  if (remainder < 0) {
    return (
      <ResultLine tone="error">
        {`${formatDisplayAmount(Math.abs(remainder), symbol, decimalDigits)} too much assigned`}
      </ResultLine>
    );
  }

  // A positive remainder is only a real error once there's no auto member
  // left to silently absorb it — with auto members still present, the same
  // remainder resolves into their share the moment getEffectiveSplitAmounts
  // recomputes, so it's not "left to assign" yet.
  if (remainder > 0 && autoMembers.length === 0) {
    return (
      <ResultLine tone="error">
        {`${formatDisplayAmount(remainder, symbol, decimalDigits)} left to assign`}
      </ResultLine>
    );
  }

  return (
    <ResultLine tone="ok">
      {`All ${formatDisplayAmount(parseAmountInput(totalAmount), symbol, decimalDigits)} assigned`}
    </ResultLine>
  );
}

function SharesSummary(props: {
  variant: SummaryVariant;
  members: Member[];
  selection: SplitSelection;
  paidByMemberId: string;
  parsedAmountInput: number;
  symbol: string;
  decimalDigits: number;
}) {
  const {
    variant,
    members,
    selection,
    paidByMemberId,
    parsedAmountInput,
    symbol,
    decimalDigits,
  } = props;
  const totalShares = members.reduce(
    (sum, member) =>
      selection.selectedMemberIds.includes(member.id)
        ? sum + (selection.splitShares[member.id] ?? 0)
        : sum,
    0,
  );

  if (totalShares === 0) {
    return <NobodySelected />;
  }

  if (variant === "section" && parsedAmountInput === 0) {
    return <EnterAmount />;
  }

  const perShareAmount = floorToDecimals(
    parsedAmountInput / totalShares,
    decimalDigits,
  );
  const { absorberId, remainder } = getRoundingRemainder(
    members,
    "shares",
    parsedAmountInput,
    decimalDigits,
    selection,
    paidByMemberId,
  );

  return (
    <ResultLine tone="ok">
      {formatDisplayAmount(perShareAmount, symbol, decimalDigits)} per share ·{" "}
      {remainder > 0
        ? `${members.find((member) => member.id === absorberId)?.name} covers the extra ${formatDisplayAmount(remainder, symbol, decimalDigits)}`
        : `${totalShares} shares`}
    </ResultLine>
  );
}

function SoloSummary() {
  return (
    <ResultLine tone="muted">
      Nobody owes anything yet. Add people to split it.
    </ResultLine>
  );
}

export default function SplitSummary(props: SplitSummaryProps) {
  const { variant } = props;

  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);
  const splitAmounts = useExpenseSheetStore((s) => s.splitAmounts);
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const paidByMemberId = useExpenseSheetStore((s) => s.paidByMemberId);
  const totalAmount = useExpenseSheetStore((s) => s.amount);
  const currency = useExpenseSheetStore((s) => s.currency);
  const members = useExpenseSheetStore((s) => s.members);

  const { symbol, decimalDigits } = currency;

  const parsedAmountInput = useMemo(
    () => parseAmountInput(totalAmount),
    [totalAmount],
  );
  const selection: SplitSelection = {
    selectedMemberIds,
    splitAmounts,
    splitShares,
  };

  if (members.length === 1) {
    return <SoloSummary />;
  }

  return (
    <View className={variant === "sheet" ? "gap-space-1" : undefined}>
      {variant === "sheet" && (
        <TotalAmountRow
          amount={totalAmount}
          symbol={symbol}
          decimalDigits={decimalDigits}
        />
      )}

      {splitMethod === "equally" && (
        <EquallySummary
          variant={variant}
          members={members}
          selection={selection}
          paidByMemberId={paidByMemberId}
          parsedAmountInput={parsedAmountInput}
          symbol={symbol}
          decimalDigits={decimalDigits}
        />
      )}

      {splitMethod === "amounts" && (
        <AmountsSummary
          variant={variant}
          totalAmount={totalAmount}
          members={members}
          splitAmounts={splitAmounts}
          selectedMemberIds={selectedMemberIds}
          parsedAmountInput={parsedAmountInput}
          symbol={symbol}
          decimalDigits={decimalDigits}
        />
      )}

      {splitMethod === "shares" && (
        <SharesSummary
          variant={variant}
          members={members}
          selection={selection}
          paidByMemberId={paidByMemberId}
          parsedAmountInput={parsedAmountInput}
          symbol={symbol}
          decimalDigits={decimalDigits}
        />
      )}
    </View>
  );
}
