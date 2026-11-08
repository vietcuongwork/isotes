// src/themes/color.js
// Plain colour names, Tailwind-style scales. Low number = light, high = dark.
// Usage: bg-ink-50 text-ink-900
module.exports = {
  colors: {
    // ── member ── the 12 avatar colours a person can be given.
    // Categorical, not a scale: pick by name, never by number. Olive and
    // coral repeat the green and red values on purpose, so a person's colour is
    // chosen from one list. The last five leave
    // the warm family deliberately: twelve warm fills are not twelve
    // distinguishable avatars. Pair every fill with its OWN memberInk.
    // This set also covers the Insights categorical-chart gap.
    member: {
      sand: "#D9C48A",
      olive: "#A8C98A", // = green-400
      citron: "#C6CC7E",
      amber: "#E9C46A",
      honey: "#E3A85C",
      terracotta: "#DC9367",
      coral: "#E88A72", // = red-400
      rose: "#E2A0B4",
      lilac: "#C3A8D6",
      periwinkle: "#A6ADDD",
      sky: "#9DBFD9",
      teal: "#7FC3BE",
    },
    memberInk: {
      sand: "#2A2312",
      olive: "#141F0C", // green-950
      citron: "#1F2209",
      amber: "#2C2207",
      honey: "#2A1B08", // THE accent, see README
      terracotta: "#2B1708",
      coral: "#2A120A", // red-950
      rose: "#2C1219",
      lilac: "#221331",
      periwinkle: "#141833",
      sky: "#0E1E2B",
      teal: "#0B221F",
    },

    // ── green ── money coming to you · success · "all square"
    green: {
      400: "#A8C98A",
      900: "#1A2113", // tinted surface (added for badges — not in the mocks yet)
      950: "#141F0C", // text/icon sitting ON green-400 (avatar initial)
    },

    // ── red ── money you owe · form errors · warnings
    red: {
      400: "#E88A72",
      900: "#2A1510", // tinted surface (added for badges — not in the mocks yet)
      950: "#2A120A", // text/icon sitting ON red-400 (avatar initial)
    },

    // ── Ink & Shine ── the light look, values from DESIGN.md.
    ink: {
      50: "#F3F1EC", // page background (paper)
      100: "#E9E6E0",
      200: "#D9D5CE",
      300: "#B9B4AC",
      400: "#8C877F",
      500: "#6E6962",
      700: "#3D3A36",
      900: "#1B1918", // primary text, primary button
      950: "#0F0E0D",
    },
    card: "#FFFEFB",
    shine: {
      100: "#FBF0D2",
      400: "#E8B33E",
      700: "#85600F",
    },
    get: {
      100: "#E3F0E6",
      600: "#2E7A4C",
    },
    owe: {
      100: "#F8E3DD",
      600: "#B83A26",
    },
    // behind the drawer and bottom sheets (DESIGN.md Neutral)
    scrim: "#0F0E0D52", // #0F0E0D at 32%: 0x52 = 82, 82 / 255 = 0.32
    // illustration only, never UI
    lavender: "#B79BE0",
    flame: "#5B9BD5",
    ember: "#E07A5F",
    // number pad only: iOS 26 system greys, not Themis tokens (DESIGN.md components.number-pad)
    numberPad: {
      bg: "#E2E4E8",
      key: "#FFFFFF",
      keyPressed: "#D1D4DA",
      fnKey: "#CDD0D6",
      fnKeyPressed: "#B9BDC5",
      text: "#000000",
    },
  },
};
