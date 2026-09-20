// src/themes/color.js
// Plain colour names, Tailwind-style scales. Low number = light, high = dark.
// Usage: bg-grey-975  text-grey-200  border-grey-825  text-orange-400
//
// Every "grey" here is a WARM grey (hue ~36°, R > G > B) — there is no true
// grey and no pure white anywhere in the app. That's what makes it read warm.
//
// Collapsed on purpose, so don't go looking for them: #918A80 and #8A837A were
// 2% apart → both are grey-200. #262320 → grey-815. The three bottom-sheet
// scrims in the mocks (10,9,8/.55 · 8,7,6/.6 · 8,7,6/.62) → one scrimSheet.
//
// PRESSED STATES need no tokens: pressed = one step lighter.
//   card grey-900 → grey-850 · quiet card grey-925 → grey-900
//   cream button grey-50 → grey-100 · orange-tinted grey-800 → orange-700
module.exports = {
  colors: {
    // ── grey ── every surface, border and text colour
    grey: {
      50: "#F5F0E8", // primary text · cream button surface
      100: "#C4BCB0", // secondary text
      200: "#8E877D", // muted text, icons
      300: "#7D766C", // the cents half of an amount
      400: "#6D675F", // faint text, chevrons, the "$" on a big amount
      500: "#5C574F", // disabled text, micro labels
      600: "#4F4A44", // dimmed text on settled cards, far wheel-picker rows
      700: "#3F3B36", // home indicator, hairlines
      750: "#3A3630", // dashed border — "Add person" affordance
      790: "#2A2721", // disabled button fill · unselected segment fill
      800: "#2A2825", // card border, sheet top border
      810: "#211F1C", // faint hairline inside a section · row surface ON a sheet (905) — 900 is too close to read as raised there
      815: "#262320", // form-field border
      825: "#24221F", // divider — header underline, tab bar top
      850: "#1F1D1A", // settled-card border
      900: "#1A1917", // raised card
      905: "#191816", // bottom-sheet surface (warmer than a card — keep separate)
      925: "#171614", // quiet card
      950: "#151413", // input · settled card
      955: "#151412", // tab bar
      960: "#141312", // quietest row — a row sitting inside a quiet card
      965: "#131211", // field / input inside a bottom sheet · stepper − disc (the + is honey-tinted; both carry the grey-815 field border so the pair is symmetric)
      975: "#100F0E", // page background
      scrim: "rgba(16,15,14,0.72)", // behind a dialog
      scrimSheet: "rgba(10,9,8,0.58)", // behind a bottom sheet — lighter, warmer
      fade: "rgba(16,15,14,0)", // transparent end of a fade over the PAGE (= grey-975 @ 0)
      fadeSheet: "rgba(25,24,22,0)", // transparent end of a fade INSIDE a sheet (= grey-900 @ 0)
    },

    // ── orange ── the one interactive colour: links, focus, selected, badges
    orange: {
      200: "#D9C48A", // neutral avatar fill
      300: "#A08F79", // dimmed accent metadata ("4 joined" beside an accent label)
      400: "#E3A85C", // THE accent
      700: "#4A3720", // border on an orange-tinted surface
      800: "#231A10", // orange-tinted surface (badge, how-it-works bullet)
      850: "#241F1A", // tinted circle behind an accent icon (expense-row bubble)
      900: "#2A1B08", // text/icon sitting ON orange-400
      925: "#2A2312", // text/icon sitting ON orange-200
    },

    // ── member ── the 12 avatar colours a person can be given.
    // Categorical, not a scale: pick by name, never by number. Four of them ARE
    // existing tokens under a second name (sand/olive/honey/coral) — aliases on
    // purpose, so a person's colour is chosen from one list. The last five leave
    // the warm family deliberately: twelve warm fills are not twelve
    // distinguishable avatars. Pair every fill with its OWN memberInk.
    // This set also covers the Insights categorical-chart gap.
    member: {
      sand: "#D9C48A", // = orange-200
      olive: "#A8C98A", // = green-400
      citron: "#C6CC7E",
      amber: "#E9C46A",
      honey: "#E3A85C", // = orange-400
      terracotta: "#DC9367",
      coral: "#E88A72", // = red-400
      rose: "#E2A0B4",
      lilac: "#C3A8D6",
      periwinkle: "#A6ADDD",
      sky: "#9DBFD9",
      teal: "#7FC3BE",
    },
    memberInk: {
      sand: "#2A2312", // orange-925
      olive: "#141F0C", // green-950
      citron: "#1F2209",
      amber: "#2C2207",
      honey: "#2A1B08", // orange-900 — THE accent, see README
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
  },
};
