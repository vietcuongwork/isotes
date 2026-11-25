import { Member } from "@/types/TExpense";
import { create } from "zustand";

// The Undo toast's person, set by a removal on People or Person, shown on People.
// People's unmount clears it (ADR 0004), so it never outlives the screen that shows it.
interface RemovedPersonState {
  removed: Member | null;
  epoch: number; // goes up when the user moves on: a removal in flight then shows no toast
  setRemoved: (member: Member) => void;
  clearRemoved: () => void;
  bumpEpoch: () => void;
}

export const initialState: Pick<RemovedPersonState, "removed" | "epoch"> = {
  removed: null,
  epoch: 0,
};

export const useRemovedPersonStore = create<RemovedPersonState>((set) => ({
  ...initialState,
  setRemoved: (removed) => set({ removed }),
  clearRemoved: () => set({ removed: null }),
  bumpEpoch: () => set((state) => ({ epoch: state.epoch + 1 })),
}));
