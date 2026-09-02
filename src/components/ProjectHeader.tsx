import { Menu, Settings } from "lucide-react-native";
import { Text, View } from "react-native";

interface ProjectHeaderProps {
  title: string;
}
export default function ProjectHeader(props: ProjectHeaderProps) {
  const { title } = props;
  return (
    <View className="flex-row justify-between border border-b-[#f5a623]/25 px-2 py-4">
      <Menu color="#DBB47F" />
      <Text className="font-fraunces text-xl text-[#f0f0f0]">{title}</Text>
      <Settings color="#DBB47F" />
    </View>
  );
}
