import { Easing } from "react-native";
import { KEYBOARD_EASING, leadIn } from "../keyboard/motion";

describe("leadIn", () => {
  it("no lead is the plain curve", () => {
    const { start, easing } = leadIn(KEYBOARD_EASING, 0);
    expect(start).toBe(0);
    for (const u of [0, 0.25, 0.5, 1])
      expect(easing(u)).toBeCloseTo(KEYBOARD_EASING(u));
  });

  it("starts where the curve is at the lead, and the rest lands exactly on the original curve", () => {
    const lead = 0.12;
    const { start, easing } = leadIn(KEYBOARD_EASING, lead);
    expect(start).toBeCloseTo(KEYBOARD_EASING(lead));
    // overall progress at original time t = lead + u * (1 - lead)
    for (const u of [0, 0.2, 0.5, 0.8, 1]) {
      const overall = start + (1 - start) * easing(u);
      expect(overall).toBeCloseTo(KEYBOARD_EASING(lead + u * (1 - lead)));
    }
    expect(easing(0)).toBeCloseTo(0);
    expect(easing(1)).toBeCloseTo(1);
  });

  it("is monotonic", () => {
    const { easing } = leadIn(Easing.bezier(0.25, 1, 0.25, 1), 0.2);
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const v = easing(Math.min(1, u));
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it("clamps an absurd lead instead of producing NaN", () => {
    const { start, easing } = leadIn(KEYBOARD_EASING, 5);
    expect(Number.isFinite(start)).toBe(true);
    expect(Number.isFinite(easing(0.5))).toBe(true);
  });
});
