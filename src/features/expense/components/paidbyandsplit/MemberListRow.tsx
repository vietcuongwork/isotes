import Avatar, { AvatarProps } from "@/components/Avatar";
import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { formatAmountInput } from "@/utils/currency";
import { CheckCircle2, Circle, Minus, Plus } from "lucide-react-native";
import { ReactElement, RefObject, useEffect, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

// The shared Split numpad (useSplitNumberPad), as seen by one amount row
type AmountsNumberPad = {
  isActive: boolean;
  onRequest: (memberId: string) => void;
  registerField: (
    memberId: string,
    fieldRef: RefObject<TextInput | null>,
  ) => () => void;
};

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
      memberId: string;
      numberPad: AmountsNumberPad;
      state: {
        amount: string;
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
  onChangeAmount: (amount: string) => void;
  currency: Currency;
  memberId: string;
  numberPad: AmountsNumberPad;
}) {
  const { amount, onChangeAmount, currency, memberId, numberPad } = props;
  const { isActive, onRequest, registerField } = numberPad;
  const inputRef = useRef<TextInput>(null);

  // Lets the shared numpad find this field (tap-target check, blur on close)
  useEffect(
    () => registerField(memberId, inputRef),
    [registerField, memberId],
  );

  const handleFocus = () => {
    console.log(`[T1] ${performance.now().toFixed(1)} field ${memberId} focus`); // TEMP T1
    onRequest(memberId);
  };

  return (
    <View
      className="w-[40%] flex-row items-center justify-end gap-1 rounded-seg-item border border-grey-815 bg-grey-965 px-3 py-2"
      // TEMP T1 — on Fabric, is e.target the same instance as the TextInput ref?
      onTouchEndCapture={(e) =>
        console.log(
          `[T1] ${performance.now().toFixed(1)} field ${memberId} touchEnd`,
          "target===inputRef:", e.target === inputRef.current,
          "nativeEvent.target:", e.nativeEvent.target,
        )
      }
    >
      {/* <Text className="text-grey-400 text-body-tight-flat">
        {currency.symbol}
      </Text> */}
      <TextInput
        ref={inputRef}
        value={formatAmountInput(amount, currency.decimalDigits)}
        onChangeText={(text) =>
          onChangeAmount(formatAmountInput(text, currency.decimalDigits))
        }
        showSoftInputOnFocus={false}
        caretHidden={!isActive}
        onFocus={handleFocus}
        // TEMP T1 — watch for a spurious blur now that the refocus workaround is gone
        onBlur={() =>
          console.log(`[T1] ${performance.now().toFixed(1)} field ${memberId} blur`)
        }
        placeholder={currency.decimalDigits === 0 ? "0" : "0.00"}
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
          onChangeAmount={state.onChangeAmount}
          currency={props.currency}
          memberId={props.memberId}
          numberPad={props.numberPad}
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
