import { ACTIVITIES } from "@/domain/activities";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { Expense } from "@/types/TExpense";

jest.mock("@marceloterreiro/flash-calendar", () => ({
  toDateId: () => "2026-01-01",
}));

const lunch: Expense = {
  id: "e1",
  tripId: "t1",
  paidByMemberId: "you",
  amount: 12,
  description: "Lunch",
  activity: ACTIVITIES[0],
  date: "2026-11-09",
  splitMethod: "equally",
  createdAt: 0,
  splits: [],
};

beforeEach(() => {
  useExpenseSheetStore.getState().reset();
});

describe("selectMembers", () => {
  it("gives a newly selected member 1 share and drops their old amount", () => {
    useExpenseSheetStore.getState().setSplitAmounts({ mai: "12" });

    useExpenseSheetStore.getState().selectMembers(["mai"]);

    const state = useExpenseSheetStore.getState();
    expect(state.selectedMemberIds).toEqual(["mai"]);
    expect(state.splitAmounts).toEqual({});
    expect(state.splitShares).toEqual({ mai: 1 });
  });
});

describe("expenses", () => {
  it("survives resetDraft", () => {
    useExpenseSheetStore.getState().setExpenses([lunch]);
    useExpenseSheetStore.getState().resetDraft();
    expect(useExpenseSheetStore.getState().expenses).toEqual([lunch]);
  });

  it("is emptied by reset", () => {
    useExpenseSheetStore.getState().setExpenses([lunch]);
    useExpenseSheetStore.getState().reset();
    expect(useExpenseSheetStore.getState().expenses).toEqual([]);
  });
});
