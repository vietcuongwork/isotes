// Compares the DESIGN.md header with src/themes/ and lists every token that is
// missing from the theme or has a different value. Tokens only in the theme
// (the old dark set) are ignored.

/** color.js shapes → DESIGN.md names: ink.50 → ink-50, memberInk.sand → member-sand-ink */
function flattenColors(colors) {
  const flat = {};
  for (const [group, value] of Object.entries(colors)) {
    if (typeof value === "string") {
      flat[group] = value;
      continue;
    }
    const ink = group.match(/^(.+)Ink$/);
    for (const [shade, hex] of Object.entries(value)) {
      flat[ink ? `${ink[1]}-${shade}-ink` : `${group}-${shade}`] = hex;
    }
  }
  return flat;
}

// Non-strings pass through: an empty YAML value (null) must not equal a token
// missing from the theme (undefined).
const lower = (hex) => (typeof hex === "string" ? hex.toLowerCase() : hex);

function diffColors(designColors, themeColors) {
  const theme = flattenColors(themeColors);
  return Object.entries(designColors)
    .map(([name, hex]) => ({
      token: `colors.${name}`,
      expected: lower(hex),
      actual: lower(theme[name]),
    }))
    .filter((e) => e.expected !== e.actual);
}

/** "8px" → 8; non-strings pass through, as in `lower` */
const px = (value) => (typeof value === "string" ? parseFloat(value) : value);

/** Radii and spacing: px values under the same names on both sides. */
function diffPxTokens(group, designTokens, themeTokens) {
  return Object.entries(designTokens)
    .map(([name, value]) => ({
      token: `${group}.${name}`,
      expected: px(value),
      actual: px(themeTokens[name]),
    }))
    .filter((e) => e.expected !== e.actual);
}

const WEIGHT_NAMES = {
  300: "light",
  400: "regular",
  500: "medium",
  600: "semibold",
  700: "bold",
};

/** "normal" or absent → 0, "-1px" or -1 → -1, "0.08em" → 0.88 at 11 px (RN takes px only) */
function trackingPx(letterSpacing, fontSize) {
  if (letterSpacing == null || letterSpacing === "normal") return 0;
  if (typeof letterSpacing === "number") return letterSpacing;
  const n = parseFloat(letterSpacing);
  const value = letterSpacing.endsWith("em") ? n * fontSize : n;
  return Math.round(value * 100) / 100;
}

/** One DESIGN.md text style → the role shape in typography.js. */
function expectedRole(style) {
  const size = px(style.fontSize);
  return {
    fontFamily: `${style.fontFamily.toLowerCase()}-${WEIGHT_NAMES[style.fontWeight]}`,
    fontSize: size,
    lineHeight: px(style.lineHeight),
    letterSpacing: trackingPx(style.letterSpacing, size),
  };
}

function actualRole(role) {
  if (!role) return {};
  return {
    fontFamily: role.family,
    fontSize: role.size,
    lineHeight: role.line,
    letterSpacing: role.tracking ?? 0,
  };
}

function diffTextStyles(designTypography, roles) {
  return Object.entries(designTypography).flatMap(([name, style]) => {
    const expected = expectedRole(style);
    const actual = actualRole(roles[name]);
    return Object.keys(expected)
      .map((prop) => ({
        token: `typography.${name}.${prop}`,
        expected: expected[prop],
        actual: actual[prop],
      }))
      .filter((e) => e.expected !== e.actual);
  });
}

/** @returns {{ token: string, expected: unknown, actual: unknown }[]} */
function diffTokens(design, theme) {
  return [
    ...diffColors(design.colors, theme.colors),
    ...diffPxTokens("rounded", design.rounded, theme.borderRadius),
    ...diffPxTokens("spacing", design.spacing, theme.spacing),
    ...diffTextStyles(design.typography, theme.roles),
  ];
}

module.exports = { diffTokens };
