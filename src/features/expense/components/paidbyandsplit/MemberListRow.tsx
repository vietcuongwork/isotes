import Avatar, { AvatarProps } from "@/components/Avatar";
import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { cn } from "@/utils/cn";
import { formatAmountInput, parseAmountInput } from "@/utils/currency";
import { CheckCircle2, Circle, Minus, Plus } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type MemberListRowProps =
  | {
      variant: "equally";
      name: string;
      avatar: AvatarProps;
      state: { checked: boolean; onPress: () => void };
    }
  | {
      variant: "amounts";
      name: string;
      avatar: AvatarProps;
      currency: Currency;
      state: { amount: string; onChangeAmount: (amount: string) => void };
    }
  | {
      variant: "shares";
      name: string;
      avatar: AvatarProps;
      state: {
        shares: number;
        onIncrement: () => void;
        onDecrement: () => void;
      };
    }
  | {
      variant: "paidBy";
      name: string;
      avatar: AvatarProps;
      state: { isSelected: boolean; onPress: () => void };
    };

export default function MemberListRow(props: MemberListRowProps): ReactElement {
  const { variant, name, avatar } = props;

  const isUnselected =
    variant === "equally"
      ? !props.state.checked
      : variant === "amounts"
        ? parseAmountInput(props.state.amount) === 0
        : variant === "shares"
          ? props.state.shares === 0
          : false;

  return (
    <Pressable
      onPress={
        variant === "equally" || variant === "paidBy"
          ? props.state.onPress
          : undefined
      }
      className={cn(
        "flex-row items-center justify-between rounded-btn px-3.5 py-2.5",
        variant === "paidBy"
          ? props.state.isSelected
            ? "bg-orange-800"
            : "bg-grey-810"
          : isUnselected
            ? "bg-grey-950"
            : "bg-grey-810",
      )}
    >
      <View className="flex-row items-center gap-3">
        <Avatar label={avatar.label} color={avatar.color} />
        <Text className="text-grey-50 text-row">{name}</Text>
      </View>

      {/* Equally variant */}
      {variant === "equally" && (
        <>
          {props.state.checked ? (
            <CheckCircle2 size={20} color={colors.orange[400]} />
          ) : (
            <Circle size={20} color={colors.grey[700]} />
          )}
        </>
      )}

      {/* Amounts variant */}
      {variant === "amounts" && (
        <View className="w-[40%] flex-row items-center justify-end gap-1 rounded-seg-item border border-grey-815 bg-grey-965 px-3 py-2">
          <Text className="text-grey-400 text-body-tight-flat">
            {props.currency.symbol}
          </Text>
          <TextInput
            value={props.state.amount}
            onChangeText={(text) =>
              props.state.onChangeAmount(
                formatAmountInput(text, props.currency.decimalDigits),
              )
            }
            keyboardType="decimal-pad"
            placeholder={props.currency.decimalDigits === 0 ? "0" : "0.00"}
            placeholderTextColor={colors.grey[400]}
            cursorColor={colors.orange[400]}
            selectionColor={colors.orange[400]}
            textAlign="right"
            className="flex-1 text-grey-50 text-body-tight-flat"
          />
        </View>
      )}

      {/* Shares variant */}
      {variant === "shares" && (
        <View className="flex-row items-center gap-2.5 rounded-[10px] bg-grey-965 px-1.5 py-1">
          <Pressable onPress={props.state.onDecrement} hitSlop={8}>
            <Minus size={17} color={colors.grey[200]} />
          </Pressable>
          <Text className="w-3 text-center font-outfit-medium text-base text-grey-50">
            {props.state.shares}
          </Text>
          <Pressable onPress={props.state.onIncrement} hitSlop={8}>
            <Plus size={17} color={colors.orange[400]} />
          </Pressable>
        </View>
      )}

      {/* PaidBy variant */}
      {variant === "paidBy" && (
        <>
          {props.state.isSelected ? (
            <CheckCircle2 size={20} color={colors.orange[400]} />
          ) : (
            <Circle size={20} color={colors.grey[700]} />
          )}
        </>
      )}
    </Pressable>
  );
}
