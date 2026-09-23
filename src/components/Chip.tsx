import { Pressable, Text } from "react-native";

interface ChipProps {
  label: string;
  onPress: () => void;
}

export default function Chip(props: ChipProps) {
  const { label, onPress } = props;

  return (
    <Pressable onPress={onPress} className="rounded-badge bg-grey-850 px-2.5 py-1">
      <Text className="text-grey-100 text-label">{label}</Text>
    </Pressable>
  );
}
