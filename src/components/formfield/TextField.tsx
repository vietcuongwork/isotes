import { colors } from "@/themes/color";
import { CircleAlert } from "lucide-react-native";
import { forwardRef, useState } from "react";
import { TextInput, TextInputProps } from "react-native";
import FieldBox from "./FieldBox";
import FieldShell from "./FieldShell";

interface TextFieldProps {
  label: string;
  placeholder: string;
  value?: string;
  error?: string;
  shakeTrigger?: number;
  textInputProps?: TextInputProps;
  className?: string;
}

const TextField = forwardRef<TextInput, TextFieldProps>((props, ref) => {
  const {
    label,
    placeholder,
    value,
    error,
    shakeTrigger,
    textInputProps,
    className,
  } = props;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <FieldShell
      label={label}
      error={error}
      shakeTrigger={shakeTrigger}
      className={className}
    >
      <FieldBox
        active={isFocused}
        error={!!error}
        className="h-14 bg-grey-925 px-4"
      >
        <TextInput
          ref={ref}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.grey[500]}
          className="text-body-tight-flat h-full flex-1 py-4 text-grey-50"
          cursorColor={colors.orange[400]}
          selectionColor={colors.orange[400]}
          {...textInputProps}
          //NOTE - Chain, don't replace: textInputProps.onBlur is RHF's validation
          // trigger. Declared after the spread so local focus state still wins.
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
