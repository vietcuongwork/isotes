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

describe("removeMemberFromDraft", () => {
  beforeEach(() => {
    const store = useExpenseSheetStore.getState();
    store.setPaidByMemberId("mai");
    store.setSelectedMemberIds(["you", "mai"]);
    store.setSplitShares({ you: 1, mai: 2 });
    store.setSplitAmounts({ you: "5", mai: "7" });
  });

  it("takes the person out of the split and gives the payer to the owner", () => {
    useExpenseSheetStore.getState().removeMemberFromDraft("mai", "you");

    const state = useExpenseSheetStore.getState();
    expect(state.selectedMemberIds).toEqual(["you"]);
    expect(state.splitShares).toEqual({ you: 1 });
    expect(state.splitAmounts).toEqual({ you: "5" });
    expect(state.paidByMemberId).toBe("you");
  });

  it("leaves the draft alone for someone not in it", () => {
    const before = useExpenseSheetStore.getState();

    useExpenseSheetStore.getState().removeMemberFromDraft("linh", "you");

    const after = useExpenseSheetStore.getState();
    expect(after.selectedMemberIds).toEqual(before.selectedMemberIds);
    expect(after.paidByMemberId).toBe("mai");
  });

  it("keeps an empty payer empty after resetDraft", () => {
    useExpenseSheetStore.getState().resetDraft();

    useExpenseSheetStore.getState().removeMemberFromDraft("mai", "you");

    expect(useExpenseSheetStore.getState().paidByMemberId).toBe("");
  });
});
