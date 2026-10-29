import { colors } from "@/themes/color";
import { UserSearch } from "lucide-react-native";
import { ReactElement } from "react";
import { Text, View } from "react-native";

interface MemberNoMatchesProps {
  query: string;
  memberCount: number;
}

export default function MemberNoMatches(
  props: MemberNoMatchesProps,
): ReactElement {
  const { query, memberCount } = props;

  return (
    <View className="gap-space-2 pb-space-2 pt-space-4">
      {/* //NOTE - no token for the 48pt disc, falling back to h-[48px] w-[48px] */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="mb-space-1 h-[48px] w-[48px] items-center justify-center rounded-full bg-ink-100"
      >
        <UserSearch size={24} strokeWidth={1.75} color={colors.ink[500]} />
      </View>
      <Text accessibilityRole="header" className="text-ink-900 text-heading">
        Nobody on this trip is called “{query.trim()}”
      </Text>
      <Text className="text-ink-700 text-body">
        {memberCount === 1
          ? "Clear the search to see everyone."
          : `Clear the search to see all ${memberCount} people.`}
      </Text>
    </View>
  );
}
