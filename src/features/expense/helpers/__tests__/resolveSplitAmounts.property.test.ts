import * as fc from "fast-check";

import { resolveSplitAmounts } from "@/features/expense/helpers/expenseHelpers";
import { Member } from "@/types/TExpense";

// expenseHelpers imports the draft store only for its dirty check; the real
// store pulls flash-calendar → flash-list ESM, which Jest doesn't transform
jest.mock("@/stores/useExpenseSheetStore", () => ({ draftInitialState: {} }));

const toMember = (i: number): Member => ({
  id: `m${i}`,
  tripId: "t1",
  name: `Member ${i}`,
  isOwner: i === 0,
  memberColor: "sand",
  createdAt: 0,
});

// A valid equally/shares draft: ≥1 selected member, payer among them, ≥1 share each.
// "amounts" takes string inputs checked by validateExpenseSheet — a separate test.
const draft = fc
  .record({
    memberCount: fc.integer({ min: 1, max: 8 }),
    decimalDigits: fc.constantFrom(0, 2),
    totalMinor: fc.integer({ min: 1, max: 1_000_000_000 }),
    splitMethod: fc.constantFrom("equally" as const, "shares" as const),
  })
  .chain((base) =>
    fc.record({
      base: fc.constant(base),
      selected: fc.subarray([...Array(base.memberCount).keys()], {
        minLength: 1,
      }),
      shares: fc.array(fc.integer({ min: 1, max: 10 }), {
        minLength: base.memberCount,
        maxLength: base.memberCount,
      }),
    }),
  )
  .chain((d) =>
    fc.record({
      d: fc.constant(d),
      payerIndex: fc.constantFrom(...d.selected),
    }),
  );

describe("resolveSplitAmounts", () => {
  it("rows sum exactly to the total, in whole minor units", () => {
    fc.assert(
      fc.property(draft, ({ d, payerIndex }) => {
        const { memberCount, decimalDigits, totalMinor, splitMethod } = d.base;
        const scale = 10 ** decimalDigits;
        const members = [...Array(memberCount).keys()].map(toMember);
        const rows = resolveSplitAmounts(
          members,
          splitMethod,
          totalMinor / scale,
          decimalDigits,
          {
            selectedMemberIds: d.selected.map((i) => `m${i}`),
            splitAmounts: {},
            splitShares: Object.fromEntries(
              d.shares.map((s, i) => [`m${i}`, s]),
            ),
          },
          `m${payerIndex}`,
        );

        // Compare in minor units: float sums of 2-decimal amounts aren't exact
        const minors = rows.map((r) => r.individualAmount * scale);
        expect(minors.every((m) => Math.abs(m - Math.round(m)) < 1e-6)).toBe(
          true,
        );
        expect(minors.reduce((s, m) => s + Math.round(m), 0)).toBe(totalMinor);
      }),
    );
  });
});
