import { act, renderHook } from "@testing-library/react-native";
import useUndoToast from "@/features/people/hooks/useUndoToast";
import { Member } from "@/types/TExpense";

const person = (id: string): Member => ({
  id,
  tripId: "t1",
  name: id,
  isOwner: false,
  memberColor: "sand",
  createdAt: 100,
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.restoreAllMocks(); // drop the setTimeout and clearTimeout spies
  jest.useRealTimers();
});

describe("useUndoToast", () => {
  it("shows the person, then clears after 5 seconds", async () => {
    const { result } = await renderHook(() => useUndoToast());
    await act(async () => result.current.showToast(person("hoa")));
    expect(result.current.removed?.id).toBe("hoa");
    await act(async () => jest.advanceTimersByTime(5000));
    expect(result.current.removed).toBeNull();
  });

  it("replaces the toast on a second removal and restarts the 5 seconds", async () => {
    const { result } = await renderHook(() => useUndoToast());
    await act(async () => result.current.showToast(person("hoa")));
    await act(async () => jest.advanceTimersByTime(4000));
    await act(async () => result.current.showToast(person("tom")));
    await act(async () => jest.advanceTimersByTime(4000));
    expect(result.current.removed?.id).toBe("tom");
  });

  it("gives the person to Undo once", async () => {
    const { result } = await renderHook(() => useUndoToast());
    await act(async () => result.current.showToast(person("hoa")));
    let first: Member | null = null;
    let second: Member | null = null;
    await act(async () => {
      first = result.current.takeForUndo();
      second = result.current.takeForUndo(); // same render: the ref, not the state, stops it
    });
    expect(first).toEqual(person("hoa"));
    expect(second).toBeNull();
    expect(result.current.removed).toBeNull();
  });

  it("dismissToast clears it", async () => {
    const { result } = await renderHook(() => useUndoToast());
    await act(async () => result.current.showToast(person("hoa")));
    await act(async () => result.current.dismissToast());
    expect(result.current.removed).toBeNull();
  });

  it("clears its 5 second timer on unmount", async () => {
    const setSpy = jest.spyOn(globalThis, "setTimeout");
    const clearSpy = jest.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = await renderHook(() => useUndoToast());
    await act(async () => result.current.showToast(person("hoa")));
    const toastCall = setSpy.mock.calls.findIndex(([, ms]) => ms === 5000);
    const handle = setSpy.mock.results[toastCall].value;
    clearSpy.mockClear();
    await unmount();
    expect(clearSpy).toHaveBeenCalledWith(handle);
  });
});
