import { CURRENCY_OPTIONS } from "@/features/createTrip/constants";
import { ACTIVITIES } from "@/features/expense/constants";
import { Currency } from "@/types/TCreateTrip";
import { Activity, Member, SplitMethod } from "@/types/TExpense";
import { toDateId } from "@marceloterreiro/flash-calendar";
import { create } from "zustand";

const today = toDateId(new Date());

interface ExpenseSheetState {
  activity: Activity;
  amount: string;
  description: string;
  date: string;
  members: Member[];
  paidByMemberId: string;
  equallySelectedMemberIds: string[];
  splitMethod: SplitMethod;
  splitAmounts: Record<string, string>;
  splitShares: Record<string, number>;
  currency: Currency;
  setActivity: (activity: Activity) => void;
  setAmount: (amount: string) => void;
  setDescription: (description: string) => void;
  setDate: (date: string) => void;
  setMembers: (members: Member[]) => void;
  setPaidByMemberId: (memberId: string) => void;
  setEquallySelectedMemberIds: (memberIds: string[]) => void;
  setSplitMethod: (splitMethod: SplitMethod) => void;
  setSplitAmounts: (splitAmounts: Record<string, string>) => void;
  setSplitShares: (splitShares: Record<string, number>) => void;
  setCurrency: (currency: Currency) => void;
  reset: () => void;
}

const initialState: Omit<
  ExpenseSheetState,
  | "setActivity"
  | "setAmount"
  | "setDescription"
  | "setDate"
  | "setMembers"
  | "setPaidByMemberId"
  | "setEquallySelectedMemberIds"
  | "setSplitMethod"
  | "setSplitAmounts"
  | "setSplitShares"
  | "setCurrency"
  | "reset"
> = {
  activity: ACTIVITIES[0],
  amount: "",
  description: "",
  date: today,
  members: [],
  paidByMemberId: "",
  equallySelectedMemberIds: [],
  splitMethod: "equally",
  splitAmounts: {},
  splitShares: {},
  currency: CURRENCY_OPTIONS[0],
};

export const useExpenseSheetStore = create<ExpenseSheetState>((set) => ({
  ...initialState,
  setActivity: (activity) => set({ activity }),
  setAmount: (amount) => set({ amount }),
  setDescription: (description) => set({ description }),
  setDate: (date) => set({ date }),
  setMembers: (members) => set({ members }),
  setPaidByMemberId: (paidByMemberId) => set({ paidByMemberId }),
  setEquallySelectedMemberIds: (equallySelectedMemberIds) =>
    set({ equallySelectedMemberIds }),
  setSplitMethod: (splitMethod) => set({ splitMethod }),
  setSplitAmounts: (splitAmounts) => set({ splitAmounts }),
  setSplitShares: (splitShares) => set({ splitShares }),
  setCurrency: (currency) => set({ currency }),
  reset: () => set(initialState),
}));
