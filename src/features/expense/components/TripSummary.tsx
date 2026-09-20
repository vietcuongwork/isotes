import Avatar from "@/components/Avatar";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { Trip } from "@/types/TCreateTrip";
import { ChevronRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface TripSummaryProps {
  trip: Trip;
}

export default function TripSummary(props: TripSummaryProps) {
  const { trip } = props;
  const members = useExpenseSheetStore((s) => s.members);

  const createdLabel = new Date(trip.createdAt * 1000).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short" },
  );

  return (
    <View>
      {/* Title */}
      <View className="px-5 pt-2.5">
        <Text className="text-grey-50 text-screen-title">{trip.name}</Text>
        <Text className="mt-0.5 text-grey-200 text-meta">
          {trip.currency.code} · created {createdLabel}
        </Text>
      </View>

      {/* People */}
      <TouchableOpacity
        // TODO: wire to a trip-people sheet once it exists
        className="mx-5 mt-3.5 h-11 flex-row items-center gap-2.5 rounded-row bg-grey-950 px-3"
      >
        <Avatar.Stack members={members} maxVisible={3} />
        <Text className="flex-1 text-grey-100 text-seg-idle">
          {members.length} people
        </Text>
        <ChevronRight size={19} color={colors.grey[400]} />
      </TouchableOpacity>

      {/* Balance */}
      <View className="mx-5 mt-5 gap-4 rounded-card border border-grey-800 bg-grey-900 p-5">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-grey-200 text-meta">You&apos;re owed</Text>
            <Text className="mt-1 text-grey-400 text-display">
              $0<Text className="text-grey-600">.00</Text>
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-grey-200 text-meta">Trip total</Text>
            <Text className="mt-1 text-grey-400 text-row">
              $0<Text className="text-grey-600">.00</Text>
            </Text>
          </View>
        </View>

        <View className="h-1.5 rounded-full bg-grey-815" />

        <View className="items-center rounded-btn bg-grey-790 py-4">
          <Text className="text-grey-500 text-body-semibold">Settle up</Text>
        </View>
      </View>
    </View>
  );
}
