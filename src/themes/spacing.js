module.exports = {
  // Ink & Shine spacing (DESIGN.md Layout), in px: NativeWind makes 1rem 14px on
  // device, so Tailwind's p-4 is 14 here. why: [[Debug_ink-shine-spacing-rem]]
  spacing: {
    "space-1": "4px",
    "space-2": "8px",
    "space-3": "12px",
    "space-4": "16px",
    "space-5": "20px",
    "space-6": "24px",
    "space-8": "32px",
    "space-10": "40px",
    "space-12": "48px",
    "space-16": "64px",
  },
  padding: {
    screen: "20px",
    card: "18px",
    sheet: "18px",
    field: "15px",
    "field-x": "16px",
    row: "13px",
    "row-x": "14px",
    btn: "17px",
  },
  gap: {
    tight: "4px",
    item: "9px",
    row: "10px",
    block: "15px",
    cta: "14px", // ← form footer: helper text ↔ submit button
    section: "26px",
    stack: "7px",
  },
  space: {
    stack: "7px",
  },
  borderRadius: {
    card: "20px",
    sheet: "26px",
    btn: "16px",
    row: "14px",
    seg: "12px",
    chip: "9px",
    "seg-item": "10px",
    badge: "8px", // currency-symbol badge, small square avatars
    pill: "9999px",
    // Ink & Shine (DESIGN.md Shapes). Overrides Tailwind's built-in sm/md/lg/xl;
    // nothing in src used those before.
    sm: "8px",
    md: "12px",
    lg: "20px",
    xl: "28px",
  },
  boxShadow: {
    selected: "0 2px 12px rgba(227,168,92,0.12)", // selected Activity tile/chip — warm lift
    fab: "0 8px 20px rgba(0,0,0,0.35)", // + Expense FAB, record-payment CTA
    popover: "0 18px 44px rgba(0,0,0,0.55)", // anchored Activity dropdown
    // Ink & Shine (DESIGN.md Elevation)
    card: "0 1px 2px rgba(27,25,24,0.04), 0 8px 24px rgba(27,25,24,0.06)", // every card and tile
    lifted: "0 12px 32px rgba(27,25,24,0.14)", // FAB, floating tab bar, sheets, popovers
  },
};
