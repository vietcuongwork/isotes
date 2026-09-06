import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import { CircleAlert } from "lucide-react-native";
import { forwardRef, useEffect, useRef, useState } from "react";
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

    const [isFocused, setIsFocused] = useState<boolean>(false);

    const translateX = useSharedValue(0);

    //NOTE - Read via ref (not the `error` dep) so a submit re-fires the shake,
    // but revalidation-on-change while typing (RHF's reValidateMode) doesn't.
    const errorRef = useRef<string>(error);
    errorRef.current = error;

    useEffect(() => {
      if (!errorRef.current) return;
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }, [shakeTrigger]);

    const shakeStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    return (
      <Animated.View style={shakeStyle}>
        <View
          //NOTE - h-14 is load-bearing: it pins the border box so it can't track the
          //TextInput's ~1-2px placeholder/value height flip. See
          //documentation/log/encountered_errors_ii.md
          className={cn(
            "bg-grey-925 rounded-row h-14 flex-row items-center justify-between border px-4",
            error
              ? "border-red-400"
              : isFocused
                ? "border-orange-400"
                : "border-grey-815",
          )}
        >
          <TextInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={colors.grey[500]}
            className="text-grey-50 text-body-tight-flat h-full flex-1 py-4"
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
          ></TextInput>
          {error && <CircleAlert color={colors.red[400]} />}
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
      <Text className="text-label text-grey-200">
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
        <Text className="text-meta px-2 text-red-400">
          {error}
        </Text>
      )}
    </View>
  );
});

export default FormField;
