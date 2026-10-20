// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const noTokenNote = require("./scripts/eslint-rules/no-token-note");

// no-restricted-imports and no-restricted-syntax options don't merge across
// blocks: a file matched by two blocks gets only the last one, so each block
// repeats what still applies.
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
    "keyboard-controller in a sheet. Why: sheets use sheet-keyboard's KeyboardHost; keyboard-controller is for screen-level forms (design_decisions 2026-10-05). Fix: BottomSheetScrollView / BottomSheetTextInput from @/components/sheet-keyboard.",
};
const PLAIN_TEXT_INPUT = {
  name: "react-native",
  importNames: ["TextInput"],
  message:
    "Plain TextInput in a sheet. Why: it misses the pad hand-off and the dark keyboardAppearance ([[Debug_keyboard-flashes-white-on-pad-handoff]]). Fix: NumberPadInput for numbers, BottomSheetTextInput for text, from @/components/sheet-keyboard.",
};

const PRESSABLE_FUNCTION_STYLE = {
  selector:
    "JSXOpeningElement[name.name='Pressable'] > JSXAttribute[name.name='style'] > JSXExpressionContainer > ArrowFunctionExpression",
  message:
    "Function style on Pressable. Why: NativeWind's css-interop drops it on device (Jest still passes), [[Learn_react-native_nativewind-pressable-function-style]]. Fix: a static style, or /** @jsxImportSource react */ on a file with no className.",
};
// p-4, -mt-2, gap-x-3, h-16; not w-1/2 (a percentage) or p-0
const NUMERIC_SPACING_CLASS =
  "(^|\\s|:)-?(p[xytrblse]?|m[xytrblse]?|gap(-[xy])?|space-[xy]|[wh]|min-[wh]|max-[wh]|size|inset(-[xy])?|top|right|bottom|left|translate-[xy])-(0\\.5|[1-9][0-9]*(\\.5)?)(\\s|$)";
const NUMERIC_SPACING = {
  selector: `JSXAttribute[name.name=/[cC]lassName$/] :matches(Literal[value=/${NUMERIC_SPACING_CLASS}/], TemplateElement[value.raw=/${NUMERIC_SPACING_CLASS}/])`,
  message:
    "Numeric spacing class. Why: NativeWind inlines 1rem as 14 px on native, so p-4 renders 14, not DESIGN.md's 16 ([[Debug_ink-shine-spacing-rem]]). Fix: a DESIGN.md token (p-space-4, h-space-16), or an [Npx] value with a no-token note.",
};
const { roles } = require("./src/themes/typography");
// text-body, text-label, …: the roles that set a line height
const LINE_HEIGHT_ROLES = Object.keys(roles)
  .filter((name) => roles[name].line != null)
  .join("|");
const LINE_HEIGHT_CLASS = `(^|\\s|:)text-(${LINE_HEIGHT_ROLES})(\\s|$)`;
const TEXT_INPUT_LINE_HEIGHT = {
  selector: `JSXOpeningElement[name.name=/^(TextInput|BottomSheetTextInput)$/]:not(:has(JSXAttribute[name.name="multiline"])) JSXAttribute[name.name="className"] :matches(Literal[value=/${LINE_HEIGHT_CLASS}/], TemplateElement[value.raw=/${LINE_HEIGHT_CLASS}/])`,
  message:
    "Text role with a line height on a single-line TextInput. Why: iOS draws its text low when lineHeight is set ([[Learn_react-native_textinput-lineheight-ios]]). Fix: a -flat role, or the role's font and size through style.",
};
// Built before the px tokens; a file leaves this list when the migration restyles it
const LEGACY_SPACING_FILES = [
  "src/components/Avatar.tsx",
  "src/components/Button.tsx",
  "src/components/Chip.tsx",
  "src/components/formfield/FieldShell.tsx",
  "src/components/formfield/TextField.tsx",
  "src/components/header/Header.tsx",
  "src/components/header/TabScreenHeader.tsx",
  "src/features/createTrip/components/CreateTripForm.tsx",
  "src/features/createTrip/components/CurrencyField.tsx",
  "src/features/createTrip/screens/CreateTripScreen.tsx",
  "src/features/expense/components/ActivityAndDateSection.tsx",
  "src/features/expense/components/AddExpenseBottomSheet.tsx",
  "src/features/expense/components/RestoredDraftBanner.tsx",
  "src/features/expense/components/StartOverDialog.tsx",
  "src/features/expense/components/TripSummary.tsx",
  "src/features/expense/components/activity/ActivityField.tsx",
  "src/features/expense/components/activity/ActivityPicker.tsx",
  "src/features/expense/components/addperson/AddPerson.tsx",
  "src/features/expense/components/addperson/AddPersonBottomSheet.tsx",
  "src/features/expense/components/addperson/ColorField.tsx",
  "src/features/expense/components/addperson/ColorItem.tsx",
  "src/features/expense/components/amount/AmountField.tsx",
  "src/features/expense/components/date/AddDateBottomSheet.tsx",
  "src/features/expense/components/date/DateCalendar.tsx",
  "src/features/expense/components/date/DateField.tsx",
  "src/features/expense/components/date/QuickPickPills.tsx",
  "src/features/expense/components/expenselist/ExpenseItem.tsx",
  "src/features/expense/components/expenselist/ExpenseList.tsx",
  "src/features/expense/components/expenselist/ExpenseSeparator.tsx",
  "src/features/expense/components/paidbyandsplit/MemberListRow.tsx",
  "src/features/expense/components/paidbyandsplit/PaidAndSplitSection.tsx",
  "src/features/expense/components/paidbyandsplit/PaidByBottomSheet.tsx",
  "src/features/expense/components/paidbyandsplit/PayerRow.tsx",
  "src/features/expense/components/paidbyandsplit/PeopleSummaryRow.tsx",
  "src/features/expense/components/paidbyandsplit/SelectionSummaryBar.tsx",
  "src/features/expense/components/paidbyandsplit/SplitBottomSheet.tsx",
  "src/features/expense/components/paidbyandsplit/SplitMethodControl.tsx",
  "src/features/expense/components/paidbyandsplit/SplitSummary.tsx",
  "src/features/expense/screens/ExpenseScreen.tsx",
];
// Old dark-theme files with raw px and no notes; a file leaves when the migration restyles it
const NO_TOKEN_NOTE_EXEMPT = [
  "src/components/header/TabScreenHeader.tsx",
  "src/features/expense/components/paidbyandsplit/MemberListRow.tsx",
  "src/features/expense/components/paidbyandsplit/PaidByBottomSheet.tsx",
];

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
        PRESSABLE_FUNCTION_STYLE,
        NUMERIC_SPACING,
        TEXT_INPUT_LINE_HEIGHT,
      ],
    },
  },
  {
    // Legacy screens keep Tailwind's numeric scale until they're restyled
    files: LEGACY_SPACING_FILES,
    rules: {
      "no-restricted-syntax": [
        "error",
        PRESSABLE_FUNCTION_STYLE,
        TEXT_INPUT_LINE_HEIGHT,
      ],
    },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { isotes: { rules: { "no-token-note": noTokenNote } } },
    rules: { "isotes/no-token-note": "error" },
  },
  {
    files: NO_TOKEN_NOTE_EXEMPT,
    rules: { "isotes/no-token-note": "off" },
  },
]);
