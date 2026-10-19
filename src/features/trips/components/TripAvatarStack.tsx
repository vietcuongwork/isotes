import Avatar from "@/components/Avatar";
import { getAvatarStack } from "@/features/trips/helpers/tripsHelpers";
import { Member } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { getInitial } from "@/utils/utils";
import { Text, View } from "react-native";

// NOTE - no token for the 2pt ring, falling back to p-[2px] (Trips board)
const RING = "bg-card p-[2px]";
const DISC = "h-space-8 w-space-8";
// NOTE - no token for a 12/16 semibold initial, falling back to text-initial-md (12, 600)
const INITIAL = "text-initial-md";

interface TripAvatarStackProps {
  members: Member[];
  /** Merged over the default `card` ring, e.g. "bg-ink-100" on an ink-100 row */
  ringClassName?: string;
}

// Later discs overlap earlier ones by 8, as on the board
export default function TripAvatarStack(props: TripAvatarStackProps) {
  const { members, ringClassName } = props;
  const { visible, overflow } = getAvatarStack(members);
  const ring = cn(RING, ringClassName);

  return (
    <View className="flex-row">
      {visible.map((member, index) => (
        <View key={member.id} className={index === 0 ? "" : "-ml-space-2"}>
          <Avatar
            label={getInitial(member.name)}
            color={member.memberColor}
            ringClassName={ring}
            innerViewClassName={DISC}
            textClassName={INITIAL}
          />
        </View>
      ))}

      {overflow > 0 && (
        <View className={cn("-ml-space-2 rounded-pill", ring)}>
          <View
            className={cn(
              "items-center justify-center rounded-pill bg-ink-100",
              DISC,
            )}
          >
            <Text className={cn("text-ink-700", INITIAL)}>+{overflow}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
