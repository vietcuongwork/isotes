import { MemberColor } from "@/types/TExpense";
import { create } from "zustand";

interface AddPersonState {
  name: string;
  selectedColor: MemberColor | null; // null: not picked yet
  setName: (name: string) => void;
  setSelectedColor: (color: MemberColor) => void;
  reset: () => void;
}

const initialState: Pick<AddPersonState, "name" | "selectedColor"> = {
  name: "",
  selectedColor: null,
};

export const useAddPersonStore = create<AddPersonState>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
  reset: () => set(initialState),
}));
