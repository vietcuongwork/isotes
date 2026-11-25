import { useRemovedPersonStore } from "@/stores/useRemovedPersonStore";
import { useEffect } from "react";

const TOAST_MS = 5000; // the spec's 5 second Undo

export default function useUndoToast() {
  const removed = useRemovedPersonStore((s) => s.removed); // draws the toast
  const clearRemoved = useRemovedPersonStore((s) => s.clearRemoved);
  const bumpEpoch = useRemovedPersonStore((s) => s.bumpEpoch);

  // Whoever set it, People or Person's footer: 5 seconds from now. A new person restarts it
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(clearRemoved, TOAST_MS); // the 5 s end isn't the user moving on
    return () => clearTimeout(timer);
  }, [removed, clearRemoved]);

  // The user moved on (Add person opened): a removal still in flight shows no toast afterwards
  const dismissToast = () => {
    bumpEpoch();
    clearRemoved();
  };

  const takeForUndo = () => {
    const member = useRemovedPersonStore.getState().removed; // a second tap before the next render reads null
    clearRemoved();
    return member;
  };

  // Leaving People: no toast left behind, none from a removal in flight (ADR 0004)
  useEffect(
    () => () => {
      bumpEpoch();
      clearRemoved();
    },
    [bumpEpoch, clearRemoved],
  );

  return { removed, dismissToast, takeForUndo };
}
