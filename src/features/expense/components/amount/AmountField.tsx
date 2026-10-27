import { NumberPadInput } from "@/components/sheet-keyboard";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { MAX_INTEGER_DIGITS } from "@/utils/currency";
import { CircleAlert } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

interface AmountFieldProps {
  error: boolean;
  onFocus: () => void;
}

// No lineHeight in the style: iOS draws single-line TextInput text low when it is
// set ([[Learn_react-native_textinput-lineheight-ios]]); `height` carries the 52 instead
const hero = textStyle("hero-amount");
const amountInputStyle = {
  fontFamily: hero.fontFamily,
  fontSize: hero.fontSize,
  letterSpacing: hero.letterSpacing,
  fontVariant: hero.fontVariant,
  height: hero.lineHeight,
  // The input sizes to its text, so the caret can sit right after the last digit
  flexShrink: 1,
};

function Caret() {
  // NOTE - no token for the 2×40 caret, falling back to h-[40px] w-[2px] rounded-[1px] (this field's own size)
  return <View className="h-[40px] w-[2px] rounded-[1px] bg-ink-900" />;
}

function CurrencyChip(props: { code: string; name: string }) {
  const { code, name } = props;

  return (
    <View
      accessible
      accessibilityLabel={`Currency, ${name}, the trip currency`}
      // NOTE - no token for the 40pt chip height, falling back to h-[40px]
      className="h-[40px] flex-row items-center rounded-md bg-ink-100 pl-space-3 pr-space-2"
    >
      {/* NOTE - the board draws the code at 14/20 weight 600, which has no role: snapped to label (weight 500) */}
      <Text className="text-ink-900 text-label">{code}</Text>
    </View>
  );
}

function ErrorText() {
  return (
    <View className="flex-row items-center gap-space-2">
      <CircleAlert size={16} color={colors.owe[600]} />
      {/* NOTE - the board draws the error at 13/20 weight 500, which has no role: snapped to caption (weight 400) */}
      <Text className="text-owe-600 text-caption">
        Enter an amount before saving.
      </Text>
    </View>
  );
}

export default function AmountField(props: AmountFieldProps) {
  const { error, onFocus } = props;

  const amount = useExpenseSheetStore((s) => s.amount);
  const setAmount = useExpenseSheetStore((s) => s.setAmount);
  const currency = useExpenseSheetStore((s) => s.currency);
  const [isFocused, setFocused] = useState(false);

  const { decimalDigits } = currency;
  const placeholder = decimalDigits === 0 ? "0" : "0.00";
  // Empty: the caret leads the placeholder; with digits it follows them
  const showCaretFirst = isFocused && amount === "";
  const showCaretLast = isFocused && amount !== "";

  return (
    <View className="gap-space-1">
      <View className="flex-row items-center">
        <CurrencyChip code={currency.code} name={currency.name} />

        {/* Amount: the native caret is hidden, the Caret view stands in for it */}
        <View className="ml-space-3 flex-1 flex-row items-center">
          {showCaretFirst && <Caret />}
          {/* Number pad from the sheet's KeyboardHost; groups "1,234.5" as you type */}
          <NumberPadInput
            className="text-ink-900"
            style={amountInputStyle}
            placeholder={placeholder}
            placeholderTextColor={colors.ink[300]}
            cursorColor="transparent"
            selectionColor="transparent"
            value={amount}
            onChangeText={setAmount}
            grouping
            maxDecimals={decimalDigits}
            maxIntegerDigits={MAX_INTEGER_DIGITS}
            onFocus={() => {
              setFocused(true);
              onFocus();
            }}
            onBlur={() => setFocused(false)}
          />
          {showCaretLast && <Caret />}
        </View>
      </View>
      {error && <ErrorText />}
    </View>
  );
}
