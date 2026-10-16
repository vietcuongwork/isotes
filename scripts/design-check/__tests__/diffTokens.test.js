/* global describe, it, expect */ // a .js test: no @types/jest to declare them
const { diffTokens } = require("../diffTokens");

// `design` is the parsed DESIGN.md header; `theme` is src/themes/ as exported.
const design = () => ({
  colors: {
    "ink-50": "#F3F1EC",
    card: "#FFFEFB",
    "member-sand": "#D9C48A",
    "member-sand-ink": "#2A2312",
  },
  rounded: { sm: "8px", pill: "9999px" },
  spacing: { "space-4": "16px", "space-16": "64px" },
  typography: {
    title: {
      fontFamily: "Fraunces",
      fontSize: "28px",
      fontWeight: 500,
      lineHeight: "32px",
      letterSpacing: "-0.5px",
    },
    body: {
      fontFamily: "Outfit",
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "24px",
      letterSpacing: "normal",
    },
    micro: {
      fontFamily: "Outfit",
      fontSize: "11px",
      fontWeight: 600,
      lineHeight: "16px",
      letterSpacing: "0.08em",
    },
  },
});

const theme = () => ({
  colors: {
    grey: { 50: "#F5F0E8" }, // old set: not in DESIGN.md, ignored
    ink: { 50: "#f3f1ec" },
    card: "#FFFEFB",
    member: { sand: "#D9C48A" },
    memberInk: { sand: "#2A2312" },
  },
  borderRadius: { card: "20px", sm: "8px", pill: "9999px" },
  spacing: { "space-4": "16px", "space-16": "64px" },
  roles: {
    title: { family: "fraunces-medium", size: 28, line: 32, tracking: -0.5 },
    body: { family: "outfit-regular", size: 16, line: 24 },
    micro: {
      family: "outfit-semibold",
      size: 11,
      line: 16,
      tracking: 0.88,
      uppercase: true,
    },
  },
});

describe("diffTokens", () => {
  it("returns no entries when every DESIGN.md token matches the theme", () => {
    expect(diffTokens(design(), theme())).toEqual([]);
  });

  it("lists a DESIGN.md color the theme doesn't have", () => {
    const t = theme();
    delete t.colors.card;

    expect(diffTokens(design(), t)).toEqual([
      { token: "colors.card", expected: "#fffefb", actual: undefined },
    ]);
  });

  it("lists DESIGN.md tokens left without a value instead of passing them", () => {
    const d = design();
    d.colors.lavender = null; // `lavender:` with nothing after it parses as null
    d.rounded.xl = null;

    expect(diffTokens(d, theme())).toEqual([
      { token: "colors.lavender", expected: null, actual: undefined },
      { token: "rounded.xl", expected: null, actual: undefined },
    ]);
  });

  it("lists a radius whose value differs, with both values", () => {
    const t = theme();
    t.borderRadius.sm = "10px";

    expect(diffTokens(design(), t)).toEqual([
      { token: "rounded.sm", expected: 8, actual: 10 },
    ]);
  });

  it("lists a text-style property that differs", () => {
    const t = theme();
    t.roles.title.size = 30;

    expect(diffTokens(design(), t)).toEqual([
      { token: "typography.title.fontSize", expected: 28, actual: 30 },
    ]);
  });

  it("lists every property of a text style the theme doesn't have", () => {
    const t = theme();
    delete t.roles.body;

    expect(diffTokens(design(), t)).toEqual([
      {
        token: "typography.body.fontFamily",
        expected: "outfit-regular",
        actual: undefined,
      },
      { token: "typography.body.fontSize", expected: 16, actual: undefined },
      { token: "typography.body.lineHeight", expected: 24, actual: undefined },
      {
        token: "typography.body.letterSpacing",
        expected: 0,
        actual: undefined,
      },
    ]);
  });

  it("matches an em letter-spacing to the role's px value to two decimals", () => {
    const d = design();
    d.typography.caption = {
      fontFamily: "Outfit",
      fontSize: "13px",
      fontWeight: 400,
      lineHeight: "20px",
      letterSpacing: "0.07em", // 0.91 px; 0.07 * 13 is 0.9100000000000001 in JS
    };
    const t = theme();
    t.roles.caption = {
      family: "outfit-regular",
      size: 13,
      line: 20,
      tracking: 0.91,
    };

    expect(diffTokens(d, t)).toEqual([]);
  });

  it("reads a missing letter-spacing as 0 and a bare number as px", () => {
    const d = design();
    delete d.typography.body.letterSpacing;
    d.typography.title.letterSpacing = -0.5; // unquoted in YAML → a number

    expect(diffTokens(d, theme())).toEqual([]);
  });

  it("lists a radius the theme doesn't have", () => {
    const t = theme();
    delete t.borderRadius.pill;

    expect(diffTokens(design(), t)).toEqual([
      { token: "rounded.pill", expected: 9999, actual: undefined },
    ]);
  });

  it("lists a spacing token the theme doesn't have and one that differs", () => {
    const t = theme();
    delete t.spacing["space-4"];
    t.spacing["space-16"] = "56px";

    expect(diffTokens(design(), t)).toEqual([
      { token: "spacing.space-4", expected: 16, actual: undefined },
      { token: "spacing.space-16", expected: 64, actual: 56 },
    ]);
  });
});
