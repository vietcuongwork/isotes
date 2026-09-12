import { formatDateLabel } from "@/utils/date";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { toDateId } from "@marceloterreiro/flash-calendar";
import { useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface useAddDateBottomSheetProps {
  today: string;
  selectedDate: string;
  onSelectDate: (dateId: string) => void;
}

export default function useAddDateBottomSheet(
  props: useAddDateBottomSheetProps,
) {
  const { today, selectedDate, onSelectDate } = props;

  const [monthId, setMonthId] = useState(selectedDate);
  const draftDate = useRef<string>(selectedDate);

  //NOTE - Local handle for this component's own dismiss calls — the forwarded
  // `ref` alone isn't safely readable here (may be a callback, not an object).
  const sheetRef = useRef<BottomSheetModal>(null);

  const { bottom } = useSafeAreaInsets();

  const contentStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);

  const yesterday = toDateId(
    new Date(new Date(today).setDate(new Date(today).getDate() - 1)),
  );
  //NOTE - "Today"/"Yesterday" always offered; a third pill for the current
  // selection only when it's neither of those.
  const pills = [
    { id: today, label: "Today" },
    { id: yesterday, label: "Yesterday" },
  ];
  if (draftDate.current !== today && draftDate.current !== yesterday) {
    pills.push({
      id: draftDate.current,
      label: formatDateLabel(draftDate.current),
    });
  }

  const handleSelectDraft = (dateId: string) => {
    draftDate.current = dateId;
    setMonthId(dateId);
  };

  // Reset happens here, before `present()` is even called — not on an
  // animation callback, which can't be trusted to fire cleanly when a new
  // `present()` interrupts a `dismiss()` still in flight.
  const handlePresent = () => {
    draftDate.current = selectedDate;
    setMonthId(selectedDate);
    sheetRef.current?.present();
  };

  const handleDismiss = () => sheetRef.current?.dismiss();

  const handleDone = () => {
    onSelectDate(draftDate.current);
    sheetRef.current?.dismiss();
  };
  const handleCancel = () => sheetRef.current?.dismiss();

  return {
    monthId,
    setMonthId,
    sheetRef,
    contentStyle,
    pills,
    handleCancel,
    handleDone,
    draftDate,
    handleSelectDraft,
    handlePresent,
    handleDismiss,
  };
}
