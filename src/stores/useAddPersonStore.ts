import { colors } from "@/themes/color";
import { MemberColor } from "@/types/TExpense";
import { create } from "zustand";

const MEMBER_COLORS = Object.keys(colors.member) as MemberColor[];

interface AddPersonState {
  name: string;
  selectedColor: MemberColor;
  setName: (name: string) => void;
  setSelectedColor: (color: MemberColor) => void;
  reset: () => void;
}

const initialState: Pick<AddPersonState, "name" | "selectedColor"> = {
  name: "",
  selectedColor: MEMBER_COLORS[0],
};

export const useAddPersonStore = create<AddPersonState>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
  reset: () => set(initialState),
}));
