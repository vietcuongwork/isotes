import Avatar, { AvatarProps } from "@/components/Avatar";
import { NumberPadInput } from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
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
      state: {
        selected: boolean;
        amount: string;
        // "+$0.01" on the remainder's absorber, else absent
        extra?: string;
        onPress: () => void;
      };
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
        // Typed amounts pass the total: every field turns red
        overAssigned: boolean;
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
        extra?: string;
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

// font and size only: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]]); the field's height carries it
const amountText = textStyle("amount");
const amountInputStyle = {
  fontFamily: amountText.fontFamily,
  fontSize: amountText.fontSize,
  fontVariant: amountText.fontVariant,
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
  selected: boolean;
  overAssigned: boolean;
  onChangeAmount: (amount: string) => void;
  currency: Currency;
}) {
  const {
    name,
    amount,
    autoAmount,
    selected,
    overAssigned,
    onChangeAmount,
    currency,
  } = props;
  const { decimalDigits } = currency;

  return (
    // NOTE - no token for the 112x40 field and the 1.5pt border, falling back to h-[40px] w-[112px] and border-[1.5px] (this field's own size)
    <View
      className={cn(
        "h-[40px] w-[112px] justify-center rounded-sm border-[1.5px] px-space-3",
        selected ? "bg-card" : "bg-transparent",
        overAssigned
          ? "border-owe-600"
          : selected
            ? "border-transparent"
            : "border-ink-200",
      )}
    >
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
        placeholderTextColor={colors.ink[500]}
        cursorColor={colors.ink[900]}
        selectionColor={colors.ink[900]}
        textAlign="right"
        className="h-full text-ink-900"
        style={amountInputStyle}
      />
    </View>
  );
}

function SharesStepper(props: {
  name: string;
  shares: number;
  selected: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const { name, shares, selected, onIncrement, onDecrement } = props;
  // NOTE - no token for the 44pt target and the 32pt disc, falling back to h-[44px] w-[44px] and h-[32px] w-[32px]
  const buttonClass = "h-[44px] w-[44px] items-center justify-center";
  const discClass = cn(
    "h-[32px] w-[32px] items-center justify-center rounded-full",
    selected ? "bg-ink-100" : "bg-ink-50",
  );

  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={onDecrement}
        accessibilityRole="button"
        accessibilityLabel={`One share less for ${name}`}
        className={buttonClass}
      >
        <View className={discClass}>
          <Minus
            size={16}
            color={shares === 0 ? colors.ink[300] : colors.ink[900]}
          />
        </View>
      </Pressable>
      {/* NOTE - the board draws the count at weight 600, which has no role: amount with font-outfit-semibold */}
      {/* NOTE - no token for the 20pt count width, falling back to min-w-[20px] */}
      <Text className="min-w-[20px] text-center font-outfit-semibold text-ink-900 text-amount">
        {shares}
      </Text>
      <Pressable
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel={`One share more for ${name}`}
        className={buttonClass}
      >
        <View className={discClass}>
          <Plus size={16} color={colors.ink[900]} />
        </View>
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
            <Text className="text-ink-500 text-caption">
              {state.amount}
              {state.extra && (
                // NOTE - the board draws the extra at weight 600, which has no role: caption with font-outfit-semibold
                <Text className="font-outfit-semibold text-shine-700">
                  {` ${state.extra}`}
                </Text>
              )}
            </Text>
          )}
        </View>
      </View>

      {variant === "amounts" && (
        <AmountsInput
          name={name}
          amount={state.amount}
          autoAmount={state.autoAmount}
          selected={selected}
          overAssigned={state.overAssigned}
          onChangeAmount={state.onChangeAmount}
          currency={props.currency}
        />
      )}

      {variant === "shares" && (
        <SharesStepper
          name={name}
          shares={state.shares}
          selected={selected}
          onIncrement={state.onIncrement}
          onDecrement={state.onDecrement}
        />
      )}
    </Pressable>
  );
}
