import Avatar, { AvatarProps } from "@/components/Avatar";
import { NumberPadInput } from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { formatAmountInput, MAX_INTEGER_DIGITS } from "@/utils/currency";
import { CheckCircle2, Circle, Minus, Plus } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

type MemberListRowProps =
  | {
      variant: "equally";
      name: string;
      avatar: AvatarProps;
      state: { selected: boolean; amount: string; onPress: () => void };
    }
  | {
      variant: "amounts";
      name: string;
      avatar: AvatarProps;
      currency: Currency;
      state: {
        // What the member typed ("" = auto-split); autoAmount is the figure
        // the split gives them, shown as the placeholder
        amount: string;
        autoAmount: string;
        selected: boolean;
        onChangeAmount: (amount: string) => void;
        onPress: () => void;
      };
    }
  | {
      variant: "shares";
      name: string;
      avatar: AvatarProps;
      state: {
        shares: number;
        amount: string;
        selected: boolean;
        onIncrement: () => void;
        onDecrement: () => void;
        onPress: () => void;
      };
    }
  | {
      variant: "paidBy";
      name: string;
      avatar: AvatarProps;
      state: { selected: boolean; onPress: () => void };
    };

function SelectionIndicator(props: { selected: boolean }) {
  return props.selected ? (
    <CheckCircle2 size={20} color={colors.orange[400]} />
  ) : (
    <Circle size={20} color={colors.grey[700]} />
  );
}

function AmountsInput(props: {
  amount: string;
  autoAmount: string;
  onChangeAmount: (amount: string) => void;
  currency: Currency;
}) {
  const { amount, autoAmount, onChangeAmount, currency } = props;
  const { decimalDigits } = currency;

  return (
    <View className="w-[40%] flex-row items-center justify-end gap-1 rounded-seg-item border border-grey-815 bg-grey-965 px-3 py-2">
      {/* Number pad from the sheet's KeyboardHost; groups "1,234.5" as you type */}
      <NumberPadInput
        value={amount}
        onChangeText={onChangeAmount}
        grouping
        maxDecimals={decimalDigits}
        maxIntegerDigits={MAX_INTEGER_DIGITS}
        placeholder={
          autoAmount
            ? formatAmountInput(autoAmount, decimalDigits)
            : decimalDigits === 0
              ? "0"
              : "0.00"
        }
        placeholderTextColor={colors.grey[400]}
        cursorColor={colors.orange[400]}
        selectionColor={colors.orange[400]}
        textAlign="right"
        className="flex-1 text-grey-50 text-body-tight-flat"
      />
    </View>
  );
}

function SharesStepper(props: {
  shares: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const { shares, onIncrement, onDecrement } = props;
  return (
    <View className="flex-row items-center gap-2.5 rounded-[10px] bg-grey-965 px-1.5 py-1">
      <Pressable onPress={onDecrement} hitSlop={8}>
        <Minus size={17} color={colors.grey[200]} />
      </Pressable>
      <Text className="w-3 text-center font-outfit-medium text-base text-grey-50">
        {shares}
      </Text>
      <Pressable onPress={onIncrement} hitSlop={8}>
        <Plus size={17} color={colors.orange[400]} />
      </Pressable>
    </View>
  );
}

// paidBy is a single-select "who's the payer" row, so a selected row is
// called out in orange rather than the plain checklist grey the other three
// variants use.
function getRowBackgroundClass(props: MemberListRowProps): string {
  if (props.variant === "paidBy") {
    return props.state.selected ? "bg-orange-800" : "bg-grey-810";
  }
  return props.state.selected ? "bg-grey-810" : "bg-grey-950";
}

export default function MemberListRow(props: MemberListRowProps): ReactElement {
  const { variant, name, avatar, state } = props;
  const { selected } = state;

  return (
    <Pressable
      onPress={state.onPress}
      className={cn(
        "flex-row items-center justify-between rounded-btn px-3.5 py-2.5",
        getRowBackgroundClass(props),
      )}
    >
      <View className="flex-row items-center gap-3">
        {variant !== "paidBy" && <SelectionIndicator selected={selected} />}
        <Avatar label={avatar.label} color={avatar.color} />
        <View>
          <Text className="text-grey-50 text-row">{name}</Text>
          {(variant === "shares" || variant === "equally") && (
            <Text className="text-grey-400 text-micro">{state.amount}</Text>
          )}
        </View>
      </View>

      {variant === "amounts" && (
        <AmountsInput
          amount={state.amount}
          autoAmount={state.autoAmount}
          onChangeAmount={state.onChangeAmount}
          currency={props.currency}
        />
      )}

      {variant === "shares" && (
        <SharesStepper
          shares={state.shares}
          onIncrement={state.onIncrement}
          onDecrement={state.onDecrement}
        />
      )}

      {variant === "paidBy" && <SelectionIndicator selected={selected} />}
    </Pressable>
  );
}
