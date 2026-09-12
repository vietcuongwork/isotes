import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { toDateId } from "@marceloterreiro/flash-calendar";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import type { AddDateBottomSheetHandle } from "../components/date/AddDateBottomSheet";

export default function useExpenseScreen() {
  const today = toDateId(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const addExpenseSheetRef = useRef<BottomSheetModal>(null);
  const addDateSheetRef = useRef<AddDateBottomSheetHandle>(null);

  const { projectName } = useLocalSearchParams<{ projectName: string }>();

  return {
    today,
    selectedDate,
    setSelectedDate,
    addExpenseSheetRef,
    addDateSheetRef,
  };
}
