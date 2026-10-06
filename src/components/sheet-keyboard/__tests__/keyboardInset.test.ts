import {
  coveredBySystemKeyboard,
  planTransition,
} from "../keyboard/keyboardInset";

const PAD = 256;
const SYS = 335;

describe("coveredBySystemKeyboard", () => {
  it("measures from the bottom of the screen", () =>
    expect(coveredBySystemKeyboard(874, 539)).toBe(335));
  it("is 0 when the keyboard is off screen", () =>
    expect(coveredBySystemKeyboard(874, 900)).toBe(0));
  it("subtracts a host that does not reach the screen bottom", () =>
    expect(coveredBySystemKeyboard(874, 539, 34)).toBe(301));
});

describe("planTransition", () => {
  it("none -> pad: the pad slides in like a keyboard", () => {
    expect(planTransition("none", "pad", PAD, 0)).toEqual({
      system: 0,
      padFloor: { to: PAD, mode: "animate" },
      padShown: { to: 1, mode: "animate" },
      settledInset: PAD,
    });
  });

  it("system -> pad: the pad slides in (KeyboardHost first lets the system keyboard leave)", () => {
    const plan = planTransition("system", "pad", PAD, SYS);
    expect(plan.padFloor).toEqual({ to: PAD, mode: "animate" });
    expect(plan.padShown).toEqual({ to: 1, mode: "animate" });
    expect(plan.system).toBe(0);
    expect(plan.settledInset).toBe(PAD);
  });

  it("system -> pad ignores the frame iOS reports for the empty inputView", () => {
    expect(planTransition("system", "pad", PAD, 17).system).toBe(0);
  });

  it("pad -> system: the pad stays until the taller system keyboard covers it", () => {
    const plan = planTransition("pad", "system", PAD, SYS);
    expect(plan.system).toBe(SYS);
    expect(plan.padFloor).toEqual({ to: 0, mode: "after" });
    expect(plan.padShown).toEqual({ to: 0, mode: "after" });
    expect(plan.settledInset).toBe(SYS);
  });

  it("pad -> system with a shorter system keyboard: the pad slides out (nothing would cover it)", () => {
    const plan = planTransition("pad", "system", PAD, 0); // e.g. hardware keyboard: no software keyboard
    expect(plan.padFloor).toEqual({ to: 0, mode: "animate" });
    expect(plan.padShown).toEqual({ to: 0, mode: "animate" });
    expect(plan.settledInset).toBe(0);
  });

  it("pad -> none (Done): the pad slides out", () => {
    expect(planTransition("pad", "none", PAD, SYS)).toEqual({
      system: 0,
      padFloor: { to: 0, mode: "animate" },
      padShown: { to: 0, mode: "animate" },
      settledInset: 0,
    });
  });

  it("pad -> pad: nothing moves", () => {
    const plan = planTransition("pad", "pad", PAD, SYS);
    expect(plan.padFloor.mode).toBe("keep");
    expect(plan.padShown.mode).toBe("keep");
    expect(plan.settledInset).toBe(PAD);
  });

  it("system -> system follows the reported height; the pad is untouched", () => {
    const plan = planTransition("system", "system", PAD, 291);
    expect(plan.system).toBe(291);
    expect(plan.padFloor).toEqual({ to: 0, mode: "keep" });
    expect(plan.padShown).toEqual({ to: 0, mode: "keep" });
  });

  it("never leaves the sheet below what covers the screen: settled inset = max(system, pad floor)", () => {
    const owners = ["pad", "system", "none"] as const;
    for (const a of owners)
      for (const b of owners) {
        const p = planTransition(a, b, PAD, SYS);
        expect(p.settledInset).toBe(Math.max(p.system, p.padFloor.to));
        expect(p.settledInset).toBe(
          b === "pad" ? PAD : b === "system" ? SYS : 0,
        );
      }
  });
});
