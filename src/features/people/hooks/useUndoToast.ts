import { Member } from "@/types/TExpense";
import { useEffect, useRef, useState } from "react";

const TOAST_MS = 5000; // the spec's 5 second Undo

export default function useUndoToast() {
  const [removed, setRemoved] = useState<Member | null>(null); // draws the toast
  const removedRef = useRef<Member | null>(null); // a second Undo tap before the next render must see it
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const epochRef = useRef(0); // goes up when the user moves on: Add person opens or People closes

  const hideToast = () => {
    clearTimeout(timerRef.current);
    removedRef.current = null;
    setRemoved(null);
  };

  // the user moved on, so a removal still in flight shows no toast afterwards
  const dismissToast = () => {
    epochRef.current += 1;
    hideToast();
  };

  const showToast = (member: Member) => {
    clearTimeout(timerRef.current); // a second removal replaces the toast; the first stands
    removedRef.current = member;
    setRemoved(member);
    timerRef.current = setTimeout(hideToast, TOAST_MS); // the 5 s end isn't the user moving on
  };

  // call before the delete's await; the returned show does nothing if dismissToast ran meanwhile
  const reserveToast = () => {
    const epoch = epochRef.current;
    return (member: Member) => {
      if (epoch === epochRef.current) showToast(member);
    };
  };

  const takeForUndo = () => {
    const member = removedRef.current;
    hideToast(); // Undo ends this toast only; another removal in flight still shows its own
    return member;
  };

  useEffect(
    () => () => {
      epochRef.current += 1; // leaving People: a removal in flight shows no toast
      clearTimeout(timerRef.current);
    },
    [],
  );

  return { removed, showToast, reserveToast, dismissToast, takeForUndo };
}
