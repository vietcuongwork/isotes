import { useRef, useState } from "react";
import { BottomSheetMethods } from "./BottomSheet";

interface useDraftBottomSheetProps<T> {
  initialValue: T;
  onCommit: (value: T) => void;
}

export default function useDraftBottomSheet<T>(
  props: useDraftBottomSheetProps<T>,
) {
  const { initialValue, onCommit } = props;

  const [draft, setDraft] = useState<T>(initialValue);
  const sheetRef = useRef<BottomSheetMethods>(null);

  const handleSelectDraft = (value: T) => setDraft(value);
  const handleCancel = () => sheetRef.current?.close();
  const handleDone = () => {
    onCommit(draft);
    sheetRef.current?.close();
  };

  return { draft, sheetRef, handleSelectDraft, handleCancel, handleDone };
}
