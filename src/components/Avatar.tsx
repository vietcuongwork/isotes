import { colors } from "@/themes/color";
import { MemberColor } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { Text, View } from "react-native";

export interface AvatarProps {
  label: string;
  color: MemberColor;
  ringClassName?: string;
  innerViewClassName?: string;
  textClassName?: string;
}

function Avatar(props: AvatarProps) {
  const { label, color, ringClassName, innerViewClassName, textClassName } =
    props;

  return (
    <View className={cn("rounded-full bg-grey-900 p-0.5", ringClassName)}>
      <View
        className={cn(
          "h-7 w-7 items-center justify-center overflow-hidden rounded-pill",
          innerViewClassName,
        )}
        style={{ backgroundColor: colors.member[color] }}
      >
        <Text
          className={cn("text-center text-initial-loose", textClassName)}
          style={{ color: colors.memberInk[color] }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export default Avatar;
