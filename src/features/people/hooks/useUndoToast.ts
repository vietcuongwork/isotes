import { Member } from "@/types/TExpense";
import { useEffect, useRef, useState } from "react";

const TOAST_MS = 5000; // the spec's 5 second Undo

export default function useUndoToast() {
  const [removed, setRemoved] = useState<Member | null>(null); // draws the toast
  const removedRef = useRef<Member | null>(null); // a second Undo tap before the next render must see it
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismissToast = () => {
    clearTimeout(timerRef.current);
    removedRef.current = null;
    setRemoved(null);
  };

  const showToast = (member: Member) => {
    clearTimeout(timerRef.current); // a second removal replaces the toast; the first stands
    removedRef.current = member;
    setRemoved(member);
    timerRef.current = setTimeout(dismissToast, TOAST_MS);
  };

  const takeForUndo = () => {
    const member = removedRef.current;
    dismissToast();
    return member;
  };

  useEffect(() => () => clearTimeout(timerRef.current), []); // leaving People ends the toast

  return { removed, showToast, dismissToast, takeForUndo };
}
