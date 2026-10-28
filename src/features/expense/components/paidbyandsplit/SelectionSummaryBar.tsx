import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { Pressable, Text, View } from "react-native";

interface SelectionSummaryBarProps {
  context: "split" | "paidBy";
}

export default function SelectionSummaryBar(props: SelectionSummaryBarProps) {
  const { context } = props;

  const members = useExpenseSheetStore((s) => s.members);
  const splitMethod = useExpenseSheetStore((s) => s.splitMethod);
  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);
  const setSelectedMemberIds = useExpenseSheetStore(
    (s) => s.setSelectedMemberIds,
  );
  const selectMembers = useExpenseSheetStore((s) => s.selectMembers);
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const setSplitShares = useExpenseSheetStore((s) => s.setSplitShares);

  const selectedCount = selectedMemberIds.length;
  const selectionActions = [
    {
      label: "Everyone",
      onPress: () => selectMembers(members.map((member) => member.id)),
    },
    { label: "None", onPress: () => setSelectedMemberIds([]) },
  ];

  const { label, actions } = (() => {
    if (context === "paidBy") {
      return { label: `${members.length} people on this trip`, actions: [] };
    }

    if (splitMethod === "amounts") {
      return {
        label: `${selectedCount} of ${members.length} have an amount`,
        actions: selectionActions,
      };
    }

    if (splitMethod === "shares") {
      const totalShares = members.reduce(
        (sum, member) =>
          selectedMemberIds.includes(member.id)
            ? sum + (splitShares[member.id] ?? 0)
            : sum,
        0,
      );

      return {
        label: `${selectedCount} people · ${totalShares} shares`,
        actions: [
          ...selectionActions,
          {
            label: "Reset",
            onPress: () => {
              setSplitShares(
                Object.fromEntries(members.map((member) => [member.id, 1])),
              );
              setSelectedMemberIds(members.map((member) => member.id));
            },
          },
        ],
      };
    }

    // "equally"
    return {
      label: `${selectedCount} of ${members.length} selected`,
      actions: selectionActions,
    };
  })();

  return (
    // NOTE - no token for the 32pt row height, falling back to min-h-[32px] (the board's)
    <View className="min-h-[32px] flex-row items-center justify-between">
      <Text className="text-ink-500 text-micro">{label}</Text>
      {actions.length > 0 && (
        <View className="flex-row gap-space-4">
          {actions.map((action) => (
            // NOTE - no token for the 32pt action height, falling back to h-[32px]
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={action.onPress}
              className="h-[32px] justify-center"
            >
              <Text className="text-ink-900 text-label">{action.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
