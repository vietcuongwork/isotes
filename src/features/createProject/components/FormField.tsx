import { cn } from "@/utils/cn";
import { CircleAlert } from "lucide-react-native";
import { forwardRef, useEffect } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface CustomTextInputProps {
  value?: string;
  placeholder: string;
  textInputProps?: TextInputProps;
  error?: string;
  shakeTrigger?: number;
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

const CustomTextInput = forwardRef<TextInput, CustomTextInputProps>(
  (props, ref) => {
    const { value, placeholder, textInputProps, error, shakeTrigger } = props;
    const translateX = useSharedValue(0);

    useEffect(() => {
      if (!error) return;
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }, [error, shakeTrigger]);

    const shakeStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    return (
      <Animated.View style={shakeStyle}>
        <View
          className={cn(
            "flex-row items-center justify-between rounded-xl border bg-[#0e0e0e] px-4",
            error ? "border-[#e5484d]" : "border-[#222222]",
          )}
        >
          <TextInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            placeholderTextColor="#666666"
            className="flex-1 py-4 font-outfit-regular text-base leading-5 text-[#f0f0f0]"
            cursorColor="#f5a623"
            selectionColor="#f5a623"
            {...textInputProps}
          ></TextInput>
          {error && <CircleAlert color="#e5484d" />}
        </View>
      </Animated.View>
    );
  },
);

const FormField = forwardRef<TextInput, FormFieldProps>((props, ref) => {
  const { label, placeholder, value, textInputProps, error, shakeTrigger } =
    props;
  return (
    <View className="gap-2">
      <Text className="font-outfit-regular text-base text-[#888888]">
        {label}
      </Text>
      {props.isTextInput ? (
        <CustomTextInput
          ref={ref}
          value={value}
          placeholder={placeholder}
          textInputProps={textInputProps}
          error={error}
          shakeTrigger={shakeTrigger}
        />
      ) : (
        <TouchableOpacity activeOpacity={0.8} {...props.touchableOpacityProps}>
          <View pointerEvents="none">
            <CustomTextInput
              ref={ref}
              value={value}
              placeholder={placeholder}
              textInputProps={textInputProps}
              error={error}
              shakeTrigger={shakeTrigger}
            />
          </View>
        </TouchableOpacity>
      )}
      {error && (
        <Text className="px-2 font-outfit-regular text-sm text-[#e5484d]">
          {error}
        </Text>
      )}
    </View>
  );
});

export default FormField;
