import { act, renderHook } from "@testing-library/react-native";
import { insertExpenseWithSplits } from "@/db/expenses";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import type { Member } from "@/types/TExpense";
import useAddExpenseBottomSheet from "../useAddExpenseBottomSheet";

// The seam: the database write, replaced by a promise the test settles
jest.mock("@/db/expenses", () => ({ insertExpenseWithSplits: jest.fn() }));
// The hook and store pull flash-calendar → flash-list ESM, which Jest doesn't transform
jest.mock("@marceloterreiro/flash-calendar", () => ({
  toDateId: () => "2026-01-01",
}));

const you: Member = {
  id: "m1",
  tripId: "t1",
  name: "You",
  isOwner: true,
  memberColor: "sand",
  createdAt: 0,
};

beforeEach(() => {
  jest.mocked(insertExpenseWithSplits).mockReset();
  useExpenseSheetStore.getState().reset();
  useExpenseSheetStore.setState({
    members: [you],
    paidByMemberId: you.id,
    selectedMemberIds: [you.id],
    amount: "7.25",
  });
});

it("saves once when Save is pressed again while the first save is pending", async () => {
  let finishInsert!: () => void;
  jest.mocked(insertExpenseWithSplits).mockReturnValue(
    new Promise<string>((resolve) => {
      finishInsert = () => resolve("e1");
    }),
  );
  const onClose = jest.fn();
  const { result } = await renderHook(() =>
    useAddExpenseBottomSheet({ onClose }),
  );

  await act(async () => {
    // Both presses use the same render, as two taps inside one frame do
    const first = result.current.handleSubmit();
    const second = result.current.handleSubmit();
    finishInsert();
    await Promise.all([first, second]);
  });

  expect(insertExpenseWithSplits).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});
