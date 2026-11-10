import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";

jest.mock("@marceloterreiro/flash-calendar", () => ({
  toDateId: () => "2026-01-01",
}));

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
