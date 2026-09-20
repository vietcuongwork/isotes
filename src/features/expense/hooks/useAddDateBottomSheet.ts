import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { formatDateLabel } from "@/utils/date";
import { toDateId } from "@marceloterreiro/flash-calendar";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface useAddDateBottomSheetProps {
  today: string;
}

export default function useAddDateBottomSheet(
  props: useAddDateBottomSheetProps,
) {
  const { today } = props;

  const selectedDate = useExpenseSheetStore((s) => s.date);
  const onSelectDate = useExpenseSheetStore((s) => s.setDate);

  const [monthId, setMonthId] = useState(selectedDate);

  const { bottom } = useSafeAreaInsets();
  const safeBottomStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);

  const yesterday = toDateId(
    new Date(new Date(today).setDate(new Date(today).getDate() - 1)),
  );
  //NOTE - "Today"/"Yesterday" always offered; a third pill for the current
  // selection only when it's neither of those.
  const pills = [
    { id: today, label: "Today" },
    { id: yesterday, label: "Yesterday" },
  ];
  if (selectedDate !== today && selectedDate !== yesterday) {
    pills.push({ id: selectedDate, label: formatDateLabel(selectedDate) });
  }
  const handleSelectDate = (dateId: string) => {
    onSelectDate(dateId);
    setMonthId(dateId);
  };

  return {
    monthId,
    setMonthId,
    safeBottomStyle,
    pills,
    selectedDate,
    handleSelectDate,
  };
}
