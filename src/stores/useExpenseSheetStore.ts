import { CURRENCY_OPTIONS } from "@/domain/currencies";
import { ACTIVITIES } from "@/domain/activities";
import { Currency } from "@/types/TCreateTrip";
import { Activity, Expense, Member, SplitMethod } from "@/types/TExpense";
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
  selectedMemberIds: string[];
  splitMethod: SplitMethod;
  splitAmounts: Record<string, string>;
  splitShares: Record<string, number>;
  currency: Currency;
  tripName: string;
  expenses: Expense[];
  setActivity: (activity: Activity) => void;
  setAmount: (amount: string) => void;
  setDescription: (description: string) => void;
  setDate: (date: string) => void;
  setMembers: (members: Member[]) => void;
  setPaidByMemberId: (memberId: string) => void;
  setSelectedMemberIds: (memberIds: string[]) => void;
  selectMembers: (memberIds: string[]) => void;
  removeMemberFromDraft: (memberId: string, ownerId: string) => void;
  setSplitMethod: (splitMethod: SplitMethod) => void;
  setSplitAmounts: (splitAmounts: Record<string, string>) => void;
  setSplitShares: (splitShares: Record<string, number>) => void;
  setCurrency: (currency: Currency) => void;
  setTripName: (tripName: string) => void;
  setExpenses: (expenses: Expense[]) => void;
  reset: () => void;
  resetDraft: () => void;
}

// "members", "currency", "tripName" and "expenses" are session-scoped — live-synced from the trip by
// useExpensesScreen's effects, not part of the expense being composed. Kept
// separate from the draft fields so resetDraft() (submit, "Start over") can
// clear the draft without wiping data that only a screen unmount/remount
// re-populates. See design_decisions.md "useExpenseSheetStore is reset on
// ExpensesScreen unmount..." (2026-09-23).
export const draftInitialState = {
  activity: ACTIVITIES[0],
  amount: "",
  description: "",
  date: today,
  paidByMemberId: "",
  selectedMemberIds: [] as string[],
  splitMethod: "equally" as SplitMethod,
  splitAmounts: {} as Record<string, string>,
  splitShares: {} as Record<string, number>,
};

const initialState: Omit<
  ExpenseSheetState,
  | "setActivity"
  | "setAmount"
  | "setDescription"
  | "setDate"
  | "setMembers"
  | "setPaidByMemberId"
  | "setSelectedMemberIds"
  | "selectMembers"
  | "removeMemberFromDraft"
  | "setSplitMethod"
  | "setSplitAmounts"
  | "setSplitShares"
  | "setCurrency"
  | "setTripName"
  | "setExpenses"
  | "reset"
  | "resetDraft"
> = {
  ...draftInitialState,
  members: [],
  currency: CURRENCY_OPTIONS[0],
  tripName: "",
  expenses: [],
};

export const useExpenseSheetStore = create<ExpenseSheetState>((set, get) => ({
  ...initialState,
  setActivity: (activity) => set({ activity }),
  setAmount: (amount) => set({ amount }),
  setDescription: (description) => set({ description }),
  setDate: (date) => set({ date }),
  setMembers: (members) => set({ members }),
  setPaidByMemberId: (paidByMemberId) => set({ paidByMemberId }),
  setSelectedMemberIds: (selectedMemberIds) => {
    set({ selectedMemberIds });
  },
  // Newly selected members reset to defaults (amount back to auto, 1 share)
  // so re-selecting never pins someone to a stale amount/share count.
  selectMembers: (memberIds) =>
    set((state) => {
      const added = memberIds.filter(
        (id) => !state.selectedMemberIds.includes(id),
      );
      if (added.length === 0) return {};
      const splitAmounts = { ...state.splitAmounts };
      added.forEach((id) => delete splitAmounts[id]);
      return {
        selectedMemberIds: [...state.selectedMemberIds, ...added],
        splitAmounts,
        splitShares: {
          ...state.splitShares,
          ...Object.fromEntries(added.map((id) => [id, 1])),
        },
      };
    }),
  // Only draft fields change, so resetDraft needs no matching change
  removeMemberFromDraft: (memberId, ownerId) =>
    set((state) => {
      const splitAmounts = { ...state.splitAmounts };
      const splitShares = { ...state.splitShares };
      delete splitAmounts[memberId];
      delete splitShares[memberId];
      return {
        selectedMemberIds: state.selectedMemberIds.filter(
          (id) => id !== memberId,
        ),
        splitAmounts,
        splitShares,
        paidByMemberId:
          state.paidByMemberId === memberId ? ownerId : state.paidByMemberId,
      };
    }),
  setSplitMethod: (splitMethod) => set({ splitMethod }),
  setSplitAmounts: (splitAmounts) => set({ splitAmounts }),
  setSplitShares: (splitShares) => set({ splitShares }),
  setCurrency: (currency) => set({ currency }),
  setTripName: (tripName) => set({ tripName }),
  setExpenses: (expenses) => set({ expenses }),
  reset: () => set(initialState),
  resetDraft: () => set(draftInitialState),
}));
