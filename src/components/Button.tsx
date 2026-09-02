import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

interface ButtonProps {
  onPress: () => void;
  buttonText: string;
  touchableOpacityProps?: TouchableOpacityProps;
}
export default function Button(props: ButtonProps) {
  const { onPress, buttonText, touchableOpacityProps } = props;
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        className="rounded-btn bg-grey-50 items-center py-4"
        {...touchableOpacityProps}
      >
        <Text className="font-outfit-bold text-lg tracking-wider text-[#0a0a0a]">
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
