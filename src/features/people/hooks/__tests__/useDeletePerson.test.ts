import { deleteMember } from "@/db/members";
import useDeletePerson from "@/features/people/hooks/useDeletePerson";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import {
  initialState,
  useRemovedPersonStore,
} from "@/stores/useRemovedPersonStore";
import { Member } from "@/types/TExpense";
import { renderHook } from "@testing-library/react-native";

jest.mock("@/db/members", () => ({ deleteMember: jest.fn() }));
// The expense sheet store pulls flash-calendar → flash-list ESM, which Jest doesn't transform
jest.mock("@marceloterreiro/flash-calendar", () => ({
  toDateId: () => "2026-01-01",
}));

const hoa: Member = {
  id: "hoa",
  tripId: "t1",
  name: "Hoa",
  isOwner: false,
  memberColor: "sand",
  createdAt: 100,
};

const removeMemberFromDraft = jest.fn();

beforeEach(() => {
  jest.mocked(deleteMember).mockReset();
  removeMemberFromDraft.mockReset();
  useRemovedPersonStore.setState(initialState);
  useExpenseSheetStore.setState({ removeMemberFromDraft });
});

describe("useDeletePerson", () => {
  it("puts the removed member in the store and cleans the draft", async () => {
    jest
      .mocked(deleteMember)
      .mockResolvedValue({ kind: "removed", member: hoa });
    const { result } = await renderHook(() => useDeletePerson());

    const outcome = await result.current("hoa", "owner");

    expect(outcome.kind).toBe("removed");
    expect(useRemovedPersonStore.getState().removed).toEqual(hoa);
    expect(removeMemberFromDraft).toHaveBeenCalledWith("hoa", "owner");
  });

  it("cleans the draft, warns and sets no toast on not-found", async () => {
    jest.mocked(deleteMember).mockResolvedValue({ kind: "not-found" });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = await renderHook(() => useDeletePerson());

    await result.current("hoa", "owner");

    expect(removeMemberFromDraft).toHaveBeenCalledWith("hoa", "owner");
    expect(warn).toHaveBeenCalled();
    expect(useRemovedPersonStore.getState().removed).toBeNull();
    warn.mockRestore();
  });

  it("shows no toast when the user moved on while the delete was pending", async () => {
    let resolveDelete: (r: {
      kind: "removed";
      member: Member;
    }) => void = () => {};
    jest.mocked(deleteMember).mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      }),
    );
    const { result } = await renderHook(() => useDeletePerson());

    const pending = result.current("hoa", "owner");
    useRemovedPersonStore.getState().bumpEpoch(); // Add person opened or People left
    resolveDelete({ kind: "removed", member: hoa });
    await pending;

    expect(useRemovedPersonStore.getState().removed).toBeNull();
  });

  it("still shows a toast when an earlier one ended on its own timer", async () => {
    jest
      .mocked(deleteMember)
      .mockResolvedValue({ kind: "removed", member: hoa });
    const { result } = await renderHook(() => useDeletePerson());
    useRemovedPersonStore.getState().setRemoved({ ...hoa, id: "tom" });
    useRemovedPersonStore.getState().clearRemoved(); // the timer: no bumpEpoch

    await result.current("hoa", "owner");

    expect(useRemovedPersonStore.getState().removed).toEqual(hoa);
  });

  it("rejects on a throw and changes neither the draft nor the store", async () => {
    jest.mocked(deleteMember).mockRejectedValue(new Error("disk"));
    const { result } = await renderHook(() => useDeletePerson());

    await expect(result.current("hoa", "owner")).rejects.toThrow("disk");

    expect(removeMemberFromDraft).not.toHaveBeenCalled();
    expect(useRemovedPersonStore.getState().removed).toBeNull();
  });
});
