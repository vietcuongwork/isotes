import { cn } from "@/utils/cn";
import { CircleAlert } from "lucide-react-native";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

interface CustomTextInputProps {
  value?: string;
  placeholder: string;
  textInputProps?: TextInputProps;
  errorState?: boolean;
}

interface BaseFormFieldProps extends CustomTextInputProps {
  label: string;
}

interface TextInputVariant extends BaseFormFieldProps {
  isTextInput: true;
}

interface TouchableOpacityVariant extends BaseFormFieldProps {
  isTextInput: false;
  touchableOpacityProps: TouchableOpacityProps;
}

type FormFieldProps = TextInputVariant | TouchableOpacityVariant;

const CustomTextInput = (props: CustomTextInputProps) => {
  const { value, placeholder, textInputProps, errorState = false } = props;
  return (
    <View
      className={cn(
        "flex-row items-center justify-between rounded-xl border bg-[#0e0e0e] px-4",
        errorState ? "border-[#e5484d]" : "border-[#222222]",
      )}
    >
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#666666"
        className="flex-1 py-4 font-outfit-regular text-base leading-5 text-[#f0f0f0]"
        cursorColor="#f5a623"
        selectionColor="#f5a623"
        {...textInputProps}
      ></TextInput>
      {errorState && <CircleAlert color="#e5484d" />}
    </View>
  );
};

export default function FormField(props: FormFieldProps) {
  const { label, placeholder, value, textInputProps } = props;
  return (
    <View className="gap-2">
      <Text className="font-outfit-regular text-base text-[#888888]">
        {label}
      </Text>
      {props.isTextInput ? (
        <CustomTextInput
          value={value}
          placeholder={placeholder}
          textInputProps={textInputProps}
        />
      ) : (
        <TouchableOpacity activeOpacity={0.8} {...props.touchableOpacityProps}>
          <View pointerEvents="none">
            <CustomTextInput
              value={value}
              placeholder={placeholder}
              textInputProps={textInputProps}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
