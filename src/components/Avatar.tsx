import { colors } from "@/themes/color";
import { Member, MemberColor } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { getInitial } from "@/utils/utils";
import { Text, View } from "react-native";

export interface AvatarProps {
  label: string;
  color: MemberColor;
  innerViewClassName?: string;
  textClassName?: string;
}

interface AvatarStackProps {
  members: Member[];
  maxVisible: number;
}

function Avatar(props: AvatarProps) {
  const { label, color, innerViewClassName, textClassName } = props;

  return (
    <View className="rounded-full bg-grey-900 p-0.5">
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

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Avatar {
  export function Stack(props: AvatarStackProps) {
    const { members, maxVisible = members.length } = props;

    const visibleMembers = members.slice(0, maxVisible);
    const overflow = members.length - visibleMembers.length;

    return (
      <View className="flex-row">
        {visibleMembers.map((member, index) => (
          <View
            key={`${member.name}-${index}`}
            className={index === 0 ? "" : "-ml-2"}
            style={{ zIndex: visibleMembers.length - index }}
          >
            <Avatar
              label={getInitial(member.name)}
              color={member.memberColor}
            />
          </View>
        ))}

        {overflow > 0 && (
          <View className="-ml-2">
            <View className="rounded-full bg-grey-900 p-0.5">
              <View className="h-7 w-7 items-center justify-center rounded-pill bg-grey-800">
                <Text className="text-center text-grey-200 text-initial-loose">
                  +{overflow}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
}

export default Avatar;
