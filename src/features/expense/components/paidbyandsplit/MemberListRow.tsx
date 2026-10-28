import Avatar, { AvatarProps } from "@/components/Avatar";
import { NumberPadInput } from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { formatAmountInput, MAX_INTEGER_DIGITS } from "@/utils/currency";
import { Check, Minus, Plus } from "lucide-react-native";
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

// NOTE - no token for the 24pt disc and the 44pt tap target, falling back to h-[24px] w-[24px] and h-[44px] w-[44px]
function SelectionIndicator(props: { selected: boolean }) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      className="-mr-space-2 h-[44px] w-[44px] items-center justify-center"
    >
      {props.selected ? (
        <View className="h-[24px] w-[24px] items-center justify-center rounded-full bg-ink-900">
          <Check size={16} strokeWidth={2.5} color={colors.card} />
        </View>
      ) : (
        // NOTE - no token for the 1.5pt ring, falling back to border-[1.5px]
        <View className="h-[24px] w-[24px] rounded-full border-[1.5px] border-ink-300" />
      )}
    </View>
  );
}

function AmountsInput(props: {
  name: string;
  amount: string;
  autoAmount: string;
  onChangeAmount: (amount: string) => void;
  currency: Currency;
}) {
  const { name, amount, autoAmount, onChangeAmount, currency } = props;
  const { decimalDigits } = currency;

  return (
    <View className="w-[40%] flex-row items-center justify-end gap-1 rounded-seg-item border border-grey-815 bg-grey-965 px-3 py-2">
      {/* Number pad from the sheet's KeyboardHost; groups "1,234.5" as you type */}
      <NumberPadInput
        accessibilityLabel={`Amount for ${name}`}
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
  name: string;
  shares: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const { name, shares, onIncrement, onDecrement } = props;
  return (
    <View className="flex-row items-center gap-2.5 rounded-[10px] bg-grey-965 px-1.5 py-1">
      <Pressable
        onPress={onDecrement}
        hitSlop={8}
        accessibilityLabel={`Remove a share for ${name}`}
      >
        <Minus size={17} color={colors.grey[200]} />
      </Pressable>
      <Text className="w-3 text-center font-outfit-medium text-base text-grey-50">
        {shares}
      </Text>
      <Pressable
        onPress={onIncrement}
        hitSlop={8}
        accessibilityLabel={`Add a share for ${name}`}
      >
        <Plus size={17} color={colors.orange[400]} />
      </Pressable>
    </View>
  );
}

// In Paid by every row is a raised option; in the split a row left out drops to
// an outline, so the roster reads as in or out at a glance
function getRowClass(props: MemberListRowProps): string {
  if (props.variant === "paidBy" || props.state.selected) {
    return "bg-ink-50";
  }
  return "border border-ink-100";
}

export default function MemberListRow(props: MemberListRowProps): ReactElement {
  const { variant, name, avatar, state } = props;
  const { selected } = state;
  // A Pressable row is one accessibility element, which hides the nested
  // input / steppers from VoiceOver and Maestro; let them be reached
  const hasNestedControls = variant === "amounts" || variant === "shares";

  const rowRole = variant === "paidBy" ? "radio" : "checkbox";
  const rowInSplit = variant === "paidBy" || selected;

  return (
    <Pressable
      onPress={state.onPress}
      accessible={!hasNestedControls}
      accessibilityRole={rowRole}
      accessibilityState={{ checked: selected }}
      // NOTE - no token for the 56pt row height, falling back to min-h-[56px]
      className={cn(
        "min-h-[56px] flex-row items-center justify-between gap-space-3 rounded-md pl-space-1 pr-space-3",
        getRowClass(props),
      )}
    >
      <View className="flex-1 flex-row items-center gap-space-3">
        <SelectionIndicator selected={selected} />
        {/* NOTE - no token for the avatar's 2pt ring and 12/600 initial, falling back to p-[2px] and text-initial-md (TripAvatarStack's) */}
        <Avatar
          label={avatar.label}
          color={avatar.color}
          ringClassName={cn("p-[2px]", rowInSplit ? "bg-ink-50" : "bg-card")}
          innerViewClassName="h-space-8 w-space-8"
          textClassName="text-initial-md"
        />
        <View className="flex-1">
          <Text
            className={cn(
              "text-amount",
              rowInSplit ? "text-ink-900" : "text-ink-500",
            )}
            numberOfLines={1}
          >
            {name}
          </Text>
          {(variant === "shares" || variant === "equally") && (
            <Text className="text-ink-500 text-caption">{state.amount}</Text>
          )}
        </View>
      </View>

      {variant === "amounts" && (
        <AmountsInput
          name={name}
          amount={state.amount}
          autoAmount={state.autoAmount}
          onChangeAmount={state.onChangeAmount}
          currency={props.currency}
        />
      )}

      {variant === "shares" && (
        <SharesStepper
          name={name}
          shares={state.shares}
          onIncrement={state.onIncrement}
          onDecrement={state.onDecrement}
        />
      )}
    </Pressable>
  );
}
