import { Text, TouchableOpacity, View } from "react-native";

interface ButtonProps {
  onPress: () => void;
  buttonText: string;
}
export default function Button(props: ButtonProps) {
  const { onPress, buttonText } = props;
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        className="items-center rounded-xl bg-[#f5a623] p-4"
        activeOpacity={0.2}
      >
        <Text className="font-outfit-bold text-lg tracking-wider text-[#0a0a0a]">
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
