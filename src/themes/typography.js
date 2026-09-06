// Typography roles — single source for the Tailwind plugin (text-* utilities)
// and direct RN styles (import { textStyle }).
// Docs: https://v3.tailwindcss.com/docs/plugins#adding-utilities

const fontFamily = {
  fraunces: "fraunces-bold", // NOTE - unused
  "outfit-light": "outfit-light",
  "outfit-regular": "outfit-regular",
  "outfit-medium": "outfit-medium",
  "outfit-semibold": "outfit-semibold",
  "outfit-bold": "outfit-bold",
};

// { family, size, line?, tracking?, uppercase? } — omit `line` for a flat line
// box (RN has no relative line-height, so "leading-none" roles just drop it).
const roles = {
  // ── headlines
  hero: { family: "outfit-light", size: 44, line: 48, tracking: -1.3 },
  display: { family: "outfit-light", size: 34, line: 37, tracking: -0.95 },
  "screen-title": {
    family: "outfit-regular",
    size: 34,
    line: 40,
    tracking: -0.95,
  },
  // ── amounts
  "hero-amount": { family: "outfit-light", size: 40, tracking: -1 },
  amount: { family: "outfit-light", size: 21, line: 26, tracking: -0.42 },
  "amount-regular": {
    family: "outfit-regular",
    size: 21,
    line: 26,
    tracking: -0.42,
  },
  // ── titles & body
  title: { family: "outfit-regular", size: 19, line: 24, tracking: -0.19 },
  "title-medium": {
    family: "outfit-medium",
    size: 19,
    line: 24,
    tracking: -0.19,
  },
  "title-semibold": {
    family: "outfit-semibold",
    size: 19,
    line: 24,
    tracking: -0.19,
  },
  "body-lg": { family: "outfit-regular", size: 16, line: 20 },
  "body-lg-medium": { family: "outfit-medium", size: 16, line: 20 },
  button: { family: "outfit-semibold", size: 16, line: 20 },
  body: { family: "outfit-regular", size: 15, line: 22 },
  "body-tight": { family: "outfit-regular", size: 15, line: 20 },
  "body-tight-flat": { family: "outfit-regular", size: 15 },
  "body-medium": { family: "outfit-medium", size: 15, line: 20 },
  "body-medium-flat": { family: "outfit-medium", size: 15 },
  "body-semibold": { family: "outfit-semibold", size: 15, line: 20 },
  // ── rows & controls
  row: { family: "outfit-regular", size: 14, line: 20 },
  "row-medium": { family: "outfit-medium", size: 14, line: 20 },
  seg: { family: "outfit-semibold", size: 13, line: 16 },
  "seg-idle": { family: "outfit-regular", size: 13, line: 16 },
  caption: { family: "outfit-regular", size: 13, line: 18 },
  // ── small
  label: { family: "outfit-medium", size: 12, line: 16 },
  meta: { family: "outfit-regular", size: 12, line: 16 },
  "meta-tight": { family: "outfit-regular", size: 11, line: 16 },
  micro: {
    family: "outfit-medium",
    size: 11,
    line: 14,
    tracking: 1.1,
    uppercase: true,
  },
  // ── avatar initials — one per avatar diameter (see layout.avatar)
  initial: { family: "outfit-semibold", size: 11 },
  "initial-md": { family: "outfit-semibold", size: 12 },
  "initial-lg": { family: "outfit-semibold", size: 14 },
  "initial-xl": { family: "outfit-semibold", size: 24 },
  "initial-loose": { family: "outfit-semibold", size: 11, line: 20 },
  // ── mock chrome only, not app UI
  clock: { family: "outfit-semibold", size: 17, tracking: -0.2 },
};

/** CSS block for the Tailwind plugin (px strings). */
function roleToCss(r) {
  const css = { fontFamily: r.family, fontSize: `${r.size}px` };
  if (r.line != null) css.lineHeight = `${r.line}px`;
  if (r.tracking != null) css.letterSpacing = `${r.tracking}px`;
  if (r.uppercase) css.textTransform = "uppercase";
  return css;
}

/** RN style object: style={textStyle("body")} (numbers, not px strings). */
function textStyle(name) {
  const r = roles[name];
  if (!r) throw new Error(`Unknown text role: ${name}`);
  const s = { fontFamily: r.family, fontSize: r.size };
  if (r.line != null) s.lineHeight = r.line;
  if (r.tracking != null) s.letterSpacing = r.tracking;
  if (r.uppercase) s.textTransform = "uppercase";
  return s;
}

const textUtilities = Object.fromEntries(
  Object.entries(roles).map(([name, r]) => [`.text-${name}`, roleToCss(r)]),
);

module.exports = { fontFamily, roles, textStyle, textUtilities };
