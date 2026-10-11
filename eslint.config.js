// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

// no-restricted-imports options don't merge across blocks: a file matched by
// two blocks gets only the last one, so each block repeats what still applies.
const ALIAS = {
  // drizzle/ and global.css sit at the repo root, outside the @/ alias
  group: ["../../*", "!../../drizzle", "!../../global.css"],
  message:
    "Deep relative import. Why: imports use the @/ alias (code-style rules). Fix: import from @/… for src/ or @/assets/… for assets/.",
};
const SCHEMA = {
  name: "@/db/schema",
  message:
    'Schema type outside the DB layer. Why: schema types stop at the transform boundary (AGENTS.md). Fix: use the UI type from @/types/ (Expense, Member, …); derive enum unions there via XRow["column"].',
};
const KEYBOARD_CONTROLLER = {
  name: "react-native-keyboard-controller",
  message:
    "keyboard-controller in a sheet. Why: sheets use sheet-keyboard's KeyboardHost; keyboard-controller is for screen-level forms (design_decisions 2026-10-05). Fix: KeyboardAwareScrollView / FormTextInput from @/components/sheet-keyboard.",
};
const PLAIN_TEXT_INPUT = {
  name: "react-native",
  importNames: ["TextInput"],
  message:
    "Plain TextInput in a sheet. Why: it misses the pad hand-off and the dark keyboardAppearance ([[Debug_keyboard-flashes-white-on-pad-handoff]]). Fix: NumberPadInput for numbers, FormTextInput for text, from @/components/sheet-keyboard.",
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "example/*", ".expo/*"],
  },
  {
    // App-wide: the @/ alias, and schema types stay in the DB layer
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [SCHEMA], patterns: [ALIAS] },
      ],
    },
  },
  {
    // The DB layer, the UI types derived from it, and the transform functions
    files: [
      "src/db/**",
      "src/types/**",
      "src/features/expense/helpers/expenseHelpers.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", { patterns: [ALIAS] }],
    },
  },
  {
    // Sheets use sheet-keyboard only
    files: [
      "src/features/**/*Sheet*.{ts,tsx}",
      "src/features/expense/components/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [SCHEMA, KEYBOARD_CONTROLLER, PLAIN_TEXT_INPUT],
          patterns: [ALIAS],
        },
      ],
    },
  },
  {
    files: ["src/**/*.tsx"],
    // This file opts out of NativeWind's JSX runtime, so a function style works there
    ignores: ["src/components/sheet-keyboard/keyboard/NumberPadKeyboard.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name='Pressable'] > JSXAttribute[name.name='style'] > JSXExpressionContainer > ArrowFunctionExpression",
          message:
            "Function style on Pressable. Why: NativeWind's css-interop drops it on device (Jest still passes), [[Learn_react-native_nativewind-pressable-function-style]]. Fix: a static style, or /** @jsxImportSource react */ on a file with no className.",
        },
      ],
    },
  },
]);
