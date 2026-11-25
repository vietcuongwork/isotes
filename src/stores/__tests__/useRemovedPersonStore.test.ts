import { Member } from "@/types/TExpense";
import { initialState, useRemovedPersonStore } from "../useRemovedPersonStore";

const hoa: Member = {
  id: "m-hoa",
  tripId: "t1",
  name: "Hoa",
  isOwner: false,
  memberColor: "sky",
  createdAt: 100,
};

describe("useRemovedPersonStore", () => {
  beforeEach(() => {
    useRemovedPersonStore.setState(initialState);
  });

  it("starts with no removed person and epoch 0", () => {
    const { removed, epoch } = useRemovedPersonStore.getState();
    expect(removed).toBeNull();
    expect(epoch).toBe(0);
  });

  it("setRemoved stores the member and clearRemoved empties it", () => {
    useRemovedPersonStore.getState().setRemoved(hoa);
    expect(useRemovedPersonStore.getState().removed).toEqual(hoa);

    useRemovedPersonStore.getState().clearRemoved();
    expect(useRemovedPersonStore.getState().removed).toBeNull();
  });

  it("bumpEpoch adds 1 and leaves removed as it was", () => {
    useRemovedPersonStore.getState().setRemoved(hoa);
    useRemovedPersonStore.getState().bumpEpoch();

    const { removed, epoch } = useRemovedPersonStore.getState();
    expect(epoch).toBe(1);
    expect(removed).toEqual(hoa);
  });
});
