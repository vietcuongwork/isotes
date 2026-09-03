module.exports = {
  colors: {
    // ── grey ── every surface, border and text colour
    grey: {
      // primary text · cream button surface
      50: "#F5F0E8",
      // secondary text
      100: "#C4BCB0",
      // warm variant of 200 for metadata on tinted surfaces
      180: "#A08F79",
      // muted text, icons
      200: "#8E877D",
      250: "#8A837A",
      // the cents half of an amount
      300: "#7D766C",
      // faint text, chevrons
      400: "#6D675F",
      // disabled text, micro labels
      500: "#5C574F",
      // dimmed text on settled cards
      600: "#4F4A44",
      // home indicator, hairlines
      700: "#3F3B36",
      // card border
      800: "#2A2825",
      // form-field border
      815: "#262320",
      // divider — header underline, tab bar top
      825: "#24221F",
      // settled-card border
      850: "#1F1D1A",
      // raised card · bottom sheet
      900: "#1A1917",
      // quiet card
      925: "#171614",
      // input · settled card · tab bar
      950: "#151413",
      // page background
      975: "#100F0E",
      // behind a bottom sheet or dialog
      scrim: "rgba(16,15,14,0.72)",
    },

    // ── orange ── the one interactive colour: links, focus, selected, badges
    orange: {
      // default avatar fill
      200: "#D9C48A",
      // THE accent
      400: "#E3A85C",
      // border on an orange-tinted surface
      700: "#4A3720",
      // orange-tinted surface
      800: "#231A10",
      // text/icon sitting ON orange-400
      900: "#2A1B08",
    },

    // ── green ── money coming to you · success · "all square"
    green: {
      400: "#A8C98A",
      // tinted surface (added for badges — not in the mocks yet)
      900: "#1A2113",
    },

    // ── red ── money you owe · form errors · warnings
    red: {
      400: "#E88A72",
      // tinted surface (added for badges — not in the mocks yet)
      900: "#2A1510",
    },
  },
};
