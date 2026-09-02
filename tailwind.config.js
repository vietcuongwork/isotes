const { fontFamily, fontSize } = require("./src/themes/typography");
const { padding, gap, space, borderRadius } = require("./src/themes/spacing");
const { colors } = require("./src/themes/color");
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily,
      fontSize,
      padding,
      gap,
      space,
      borderRadius,
      colors,
    },
  },
  plugins: [],
};
