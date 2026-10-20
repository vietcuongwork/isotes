import { formatPeopleLabel } from "@/features/expense/helpers/tripHomeHelpers";
import TripAvatarStack from "@/features/trips/components/TripAvatarStack";
import { Member } from "@/types/TExpense";
import { Text, View } from "react-native";

interface TripPeopleRowProps {
  members: Member[];
}

// Inert until the People screen exists, so no button role and no chevron
export default function TripPeopleRow(props: TripPeopleRowProps) {
  const { members } = props;
  // The owner and a member added in the same second can tie on createdAt,
  // so You is sorted first here; the stable sort keeps the rest in order
  const sorted = [...members].sort(
    (a, b) => Number(b.isOwner) - Number(a.isOwner),
  );
  const label = formatPeopleLabel(members.length);

  return (
    <View
      accessible
      accessibilityLabel={`People: ${label}`}
      className="h-space-12 flex-row items-center gap-space-3 rounded-md bg-ink-100 px-space-3"
    >
      {/* The "+N" disc is one step darker than the row, as on the Trips card */}
      <TripAvatarStack
        members={sorted}
        ringClassName="bg-ink-100"
        overflowClassName="bg-ink-200"
      />
      <Text className="flex-1 text-ink-900 text-body">{label}</Text>
    </View>
  );
}
