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
        className="items-center rounded-btn bg-grey-50 py-4"
        {...touchableOpacityProps}
      >
        <Text className="text-button text-grey-975">{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}
