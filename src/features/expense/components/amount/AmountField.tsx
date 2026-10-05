import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { formatAmountInput } from "@/utils/currency";
import { mergeRefs } from "@/utils/utils";
import { ChevronsUpDown, CircleAlert } from "lucide-react-native";
import { forwardRef, RefObject, useEffect, useRef } from "react"; // TEMP T22 useEffect
import { Text, TextInput, View } from "react-native";

interface AmountFieldProps {
  error: boolean;
  onFocus: () => void;
  // True while the numpad sheet is meant to be open — see onBlur below.
  isNumberPadOpen: boolean;
  onSetCarretState: (state: boolean) => void;
  caretHidden: boolean;
  isIntentionalDismiss: RefObject<boolean>;
}

// TEMP T23 — native tag of the input RN's JS side thinks is focused (560 amount, 576 description)
const jsFocusedTag = () =>
  // any: __nativeTag is an internal field of Fabric host instances, absent from the public type
  (TextInput.State.currentlyFocusedInput() as any)?.__nativeTag ?? "-";

const ErrorText = () => {
  return (
    <View className="flex-row items-center gap-2">
      <CircleAlert size={16} color={colors.red[400]} />
      <Text className="text-red-400 text-meta">
        Enter an amount before saving
      </Text>
    </View>
  );
};
const AmountField = forwardRef<TextInput, AmountFieldProps>(
  function AmountField(props: AmountFieldProps, ref) {
    const {
      error,
      onFocus,
      isNumberPadOpen,
      onSetCarretState,
      caretHidden,
      isIntentionalDismiss,
    } = props;

    const amount = useExpenseSheetStore((s) => s.amount);
    const setAmount = useExpenseSheetStore((s) => s.setAmount);
    const currency = useExpenseSheetStore((s) => s.currency);

    const decimalDigits = currency?.decimalDigits;
    const placeholder = decimalDigits === 0 ? "0" : "0.00";

    const inputRef = useRef<TextInput>(null);

    // TEMP T22 — caretHidden as rendered, and whether the native input is focused
    useEffect(() => {
      console.log(
        `[T22] ${performance.now().toFixed(1)} caretHidden render:`, caretHidden,
        "focused:", inputRef.current?.isFocused(),
      );
    }, [caretHidden]);

    return (
      <View
        className={cn(
          "gap-1 bg-grey-965 px-5 py-3.5",
          error && "border-y border-red-400",
        )}
      >
        <View className="flex-row items-center gap-3">
          <View
            className={cn(
              "flex-row items-center gap-1 rounded-badge border border-grey-800 bg-grey-900 px-2.5 py-2",
              error && "border-red-400",
            )}
          >
            <Text className="text-grey-50 text-body-medium">
              {currency?.symbol}
            </Text>
            <ChevronsUpDown size={16} color={colors.grey[200]} />
          </View>

          <TextInput
            ref={mergeRefs(ref, inputRef)}
            className={cn(
              "flex-1 text-grey-50 text-hero-amount",
              error && "text-red-400",
            )}
            placeholder={placeholder}
            placeholderTextColor={colors.grey[400]}
            cursorColor={colors.orange[400]}
            selectionColor={colors.orange[400]}
            showSoftInputOnFocus={false}
            caretHidden={caretHidden}
            onPress={() =>
              console.log(`[T23] ${performance.now().toFixed(1)} amount press jsFocused:`, jsFocusedTag()) // TEMP T23
            }
            onFocus={() => {
              // Hide caret across the transient blur/refocus (onBlur below) so
              // the flicker is invisible.
              // why: encountered_errors_iv.md (2026-09-28)
              console.log(
                `[T22] ${performance.now().toFixed(1)} amount focus`,
                "intentional:", isIntentionalDismiss.current,
                "padOpen:", isNumberPadOpen,
                "caretHidden:", caretHidden,
                "jsFocused:", jsFocusedTag(), // TEMP T23
              ); // TEMP T22
              onFocus();
            }}
            onBlur={() => {
              // Sibling sheet mount can spuriously blur this field (Fabric
              // mount quirk); refocus unless this is a real dismiss.
              // why: encountered_errors_iv.md (2026-09-28)
              console.log(
                `[T22] ${performance.now().toFixed(1)} amount blur`,
                "intentional:", isIntentionalDismiss.current,
                "padOpen:", isNumberPadOpen,
                "caretHidden:", caretHidden,
                "jsFocused:", jsFocusedTag(), // TEMP T23
              ); // TEMP T22
              console.log("onblur run");
              if (isIntentionalDismiss.current) return;
              if (isNumberPadOpen) {
                onSetCarretState(false);
                inputRef.current?.focus();
                // TEMP T22 — did the refocus actually take?
                requestAnimationFrame(() =>
                  console.log(
                    `[T22] ${performance.now().toFixed(1)} after refocus focused:`,
                    inputRef.current?.isFocused(),
                  ),
                );
              } else {
                onSetCarretState(true);
              }
            }}
            value={amount}
            onChangeText={(text) =>
              setAmount(formatAmountInput(text, decimalDigits))
            }
          />
        </View>
        {error && <ErrorText />}
      </View>
    );
  },
);

export default AmountField;
