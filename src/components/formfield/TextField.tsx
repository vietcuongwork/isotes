import { colors } from "@/themes/color";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { CircleAlert } from "lucide-react-native";
import { forwardRef, useState } from "react";
import { TextInput, TextInputProps } from "react-native";
import FieldBox from "./FieldBox";
import FieldShell from "./FieldShell";

interface TextFieldProps {
  label: string;
  optionalLabel?: string;
  placeholder: string;
  value?: string;
  error?: string;
  shakeTrigger?: number;
  textInputProps?: TextInputProps;
  className?: string;
  // Renders BottomSheetTextInput instead of TextInput. Required inside a
  // BottomSheetModal — plain TextInput isn't tracked by the sheet's
  // internal keyboard-avoidance context, so it won't scroll into view
  // when focused.
  inBottomSheet?: boolean;
}

const TextField = forwardRef<TextInput, TextFieldProps>((props, ref) => {
  const {
    label,
    optionalLabel,
    placeholder,
    value,
    error,
    shakeTrigger,
    textInputProps,
    className,
    inBottomSheet,
  } = props;
  const [isFocused, setIsFocused] = useState(false);
  const Input = (
    inBottomSheet ? BottomSheetTextInput : TextInput
  ) as typeof TextInput;

  return (
    <FieldShell
      label={label}
      {...(optionalLabel && { optionalLabel: optionalLabel })}
      error={error}
      shakeTrigger={shakeTrigger}
      className={className}
    >
      <FieldBox
        active={isFocused}
        error={!!error}
        className="h-14 bg-grey-925 px-4"
      >
        <Input
          ref={ref}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.grey[500]}
          className="h-full flex-1 py-4 text-grey-50 text-body-tight-flat"
          cursorColor={colors.orange[400]}
          selectionColor={colors.orange[400]}
          {...textInputProps}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps?.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps?.onBlur?.(e);
          }}
        />
        {error && <CircleAlert color={colors.red[400]} />}
      </FieldBox>
    </FieldShell>
  );
});

export default TextField;
