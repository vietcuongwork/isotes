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
import { CheckCircle2, CircleAlert } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

interface SplitSummaryProps {
  variant: "section" | "sheet";
}

function NobodySelected() {
  return (
    <View className="flex-row items-center justify-center gap-1.5">
      <CircleAlert size={12} color={colors.red[400]} />
      <Text className="text-red-400 text-meta">Nobody selected</Text>
    </View>
  );
}

function TotalAmountRow(props: {
  amount: string;
  symbol: string;
  decimalDigits: number;
}) {
  const { amount, symbol, decimalDigits } = props;
  const placeholder = decimalDigits === 0 ? "0" : "0.00";
  return (
    <View className="flex-row items-baseline justify-center gap-2">
      <Text className="text-grey-50 text-amount-regular">{`${symbol} ${amount ? amount : placeholder}`}</Text>
      <Text className="text-grey-200 text-meta">to split</Text>
    </View>
  );
}

function EquallySummary(props: {
  members: Member[];
  selection: SplitSelection;
  paidByMemberId: string;
  parsedAmountInput: number;
  symbol: string;
  decimalDigits: number;
}) {
  const {
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

  const { baseAmount, absorberId, remainder } = getRoundingRemainder(
    members,
    "equally",
    parsedAmountInput,
    decimalDigits,
    selection,
    paidByMemberId,
  );

  return (
    <View className="flex-row justify-center gap-1.5">
      <CheckCircle2 size={16} color={colors.green[400]} />
      <Text className="text-center text-green-400 text-meta">
        {formatDisplayAmount(baseAmount, symbol, decimalDigits)} each ·{" "}
        {remainder > 0 ? (
          <Text>
            {members.find((member) => member.id === absorberId)?.name} cover the
            extra {formatDisplayAmount(remainder, symbol, decimalDigits)}
          </Text>
        ) : (
          <Text>{count} people</Text>
        )}
      </Text>
    </View>
  );
}

// A leftover is only an error once there's no auto member left to absorb
// it; an overage (remainder < 0) is always an error. See design_decisions.md
// "Amounts split validates against an exact sum".
function AmountsSummary(props: {
  totalAmount: string;
  members: Member[];
  splitAmounts: Record<string, string>;
  selectedMemberIds: string[];
  parsedAmountInput: number;
  symbol: string;
  decimalDigits: number;
}) {
  const {
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

  if (remainder < 0) {
    return (
      <View className="flex-row items-center justify-center gap-1.5">
        <CircleAlert size={12} color={colors.red[400]} />
        <Text className="text-red-400 text-meta">
          {`${formatDisplayAmount(Math.abs(remainder), symbol, decimalDigits)} too much assigned`}
        </Text>
      </View>
    );
  }

  // A positive remainder is only a real error once there's no auto member
  // left to silently absorb it — with auto members still present, the same
  // remainder resolves into their share the moment getEffectiveSplitAmounts
  // recomputes, so it's not "left to assign" yet.
  if (remainder > 0 && autoMembers.length === 0) {
    return (
      <View className="flex-row items-center justify-center gap-1.5">
        <CircleAlert size={12} color={colors.red[400]} />
        <Text className="text-red-400 text-meta">
          {`${formatDisplayAmount(remainder, symbol, decimalDigits)} left to assign`}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center gap-1.5">
      <CheckCircle2 size={16} color={colors.green[400]} />
      <Text className="font-outfit-medium text-green-400 text-meta">
        {`All ${formatDisplayAmount(parseAmountInput(totalAmount), symbol, decimalDigits)} assigned`}
      </Text>
    </View>
  );
}

function SharesSummary(props: {
  members: Member[];
  selection: SplitSelection;
  paidByMemberId: string;
  parsedAmountInput: number;
  symbol: string;
  decimalDigits: number;
}) {
  const {
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
    <View className="flex-row items-center justify-center gap-1.5">
      <CheckCircle2 size={16} color={colors.green[400]} />
      <Text className="font-outfit-medium text-green-400 text-meta">
        {formatDisplayAmount(perShareAmount, symbol, decimalDigits)} per share ·{" "}
        {remainder > 0 ? (
          <Text>
            {members.find((member) => member.id === absorberId)?.name} cover the
            extra {formatDisplayAmount(remainder, symbol, decimalDigits)}
          </Text>
        ) : (
          <Text>{totalShares} shares</Text>
        )}
      </Text>
    </View>
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
    return (
      <View className="flex-row justify-center">
        <Text className="text-grey-200 text-meta">
          Nobody owes anything yet -{" "}
        </Text>
        <Text className="text-orange-400 text-label">
          add people to the trip
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-1">
      {variant === "sheet" && (
        <TotalAmountRow
          amount={totalAmount}
          symbol={symbol}
          decimalDigits={decimalDigits}
        />
      )}

      {splitMethod === "equally" && (
        <EquallySummary
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
