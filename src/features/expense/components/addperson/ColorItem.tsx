import { colors } from "@/themes/color";
import { MemberColor } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";

interface ColorItemProps {
  color: MemberColor;
  selected?: boolean;
  onPress: () => void;
}

export default function ColorItem({
  color,
  selected,
  onPress,
}: ColorItemProps) {
  return (
    <Pressable onPress={onPress}>
      <View className={cn("rounded-pill p-0.5", selected && "bg-grey-50")}>
        <View
          className={cn(
            "h-10 w-10 items-center justify-center rounded-pill",
            selected && "border-2 border-grey-900",
          )}
          style={{ backgroundColor: colors.member[color] }}
        >
          {selected && <Check size={16} color={colors.memberInk[color]} />}
        </View>
      </View>
    </Pressable>
  );
}
