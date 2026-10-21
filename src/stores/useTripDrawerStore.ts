import { create } from "zustand";

interface TripDrawerState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useTripDrawerStore = create<TripDrawerState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
