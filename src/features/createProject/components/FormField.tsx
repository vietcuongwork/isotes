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
  const { value, placeholder, textInputProps } = props;
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor="#666666"
      className="p-4 rounded-xl bg-[#0e0e0e] border border-[#222222]
                        font-outfit-regular leading-5 text-base text-[#f0f0f0]"
      cursorColor="#f5a623"
      selectionColor="#f5a623"
      {...textInputProps}
    ></TextInput>
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
          {...textInputProps}
        />
      ) : (
        <TouchableOpacity activeOpacity={0.8} {...props.touchableOpacityProps}>
          <View pointerEvents="none">
            <CustomTextInput
              value={value}
              placeholder={placeholder}
              {...textInputProps}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
