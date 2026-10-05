import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
import NumberPadBottomSheet from "@/features/expense/components/amount/NumberPadBottomSheet";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { RefObject, useCallback, useRef } from "react";
import { GestureResponderEvent, TextInput } from "react-native";

interface UseSplitNumberPadOptions {
  scrollFieldIntoView: (
    fieldRef: RefObject<TextInput | null>,
    sheetHeight: number,
  ) => void;
  resetExtraBottomSpace: () => void;
}

// One numpad for every Split → Amounts row. The rows only report focus; this
// hook pushes the sheet once and retargets it (activeSplitMemberId) when
// another row's field is tapped, instead of closing and reopening per row.
export default function useSplitNumberPad({
  scrollFieldIntoView,
  resetExtraBottomSpace,
}: UseSplitNumberPadOptions) {
  const { pushSheet, popSheet } = useBottomSheetStack();
  const activeSplitMemberId = useExpenseSheetStore(
    (s) => s.activeSplitMemberId,
  );
  const setActiveSplitMemberId = useExpenseSheetStore(
    (s) => s.setActiveSplitMemberId,
  );
  const fieldRefs = useRef(new Map<string, RefObject<TextInput | null>>());
  const numpadHeightRef = useRef(0);

  // Returns the unregister function, for a row's effect cleanup. Stable, so
  // the rows' registration effects don't re-run on every Split render
  const registerField = useCallback(
    (memberId: string, fieldRef: RefObject<TextInput | null>) => {
      fieldRefs.current.set(memberId, fieldRef);
      return () => {
        fieldRefs.current.delete(memberId);
      };
    },
    [],
  );

  const findMemberByTarget = (target: unknown): string | undefined => {
    for (const [memberId, fieldRef] of fieldRefs.current) {
      if (fieldRef.current === target) return memberId;
    }
    return undefined;
  };

  // Runs in the stack root's endCapture — before the old field's blur and the
  // new field's focus — so retargeting here stops the old field's onBlur from
  // refocusing itself. why: [[Feat_numpad-scroll-passthrough_implementation]] (A→B log)
  const isTapIgnored = (e: GestureResponderEvent): boolean => {
    const memberId = findMemberByTarget(e.target);
    if (!memberId) return false;
    setActiveSplitMemberId(memberId);
    return true;
  };

  const handleDismissStart = () => {
    const { activeSplitMemberId: closingId } = useExpenseSheetStore.getState();
    // Clear first so the field's onBlur sees "not active" and doesn't refocus
    setActiveSplitMemberId(null);
    if (closingId) fieldRefs.current.get(closingId)?.current?.blur();
    resetExtraBottomSpace();
  };

  const openFor = (memberId: string) => {
    // Read the store directly — a row's onFocus closure may hold a stale value
    const wasOpen =
      useExpenseSheetStore.getState().activeSplitMemberId !== null;
    setActiveSplitMemberId(memberId);
    const fieldRef = fieldRefs.current.get(memberId);

    if (wasOpen) {
      // Already open: retarget only; the sheet height is unchanged
      if (fieldRef) scrollFieldIntoView(fieldRef, numpadHeightRef.current);
      return;
    }

    pushSheet({
      component: (
        <NumberPadBottomSheet
          target="activeSplitMember"
          onClose={popSheet}
          onDismissStart={handleDismissStart}
          onHeightChange={(height) => {
            numpadHeightRef.current = height;
            const current = useExpenseSheetStore.getState().activeSplitMemberId;
            const activeRef = current
              ? fieldRefs.current.get(current)
              : undefined;
            if (activeRef) scrollFieldIntoView(activeRef, height);
          }}
        />
      ),
      passThrough: { isTapIgnored },
    });
  };

  return { activeSplitMemberId, openFor, registerField };
}
