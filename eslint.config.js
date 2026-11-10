// https://docs.expo.dev/guides/using-eslint/
const fs = require("node:fs");
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
// import/no-restricted-paths zones: `target` files may not import from `from`.
// Zone options don't merge across blocks either, so every zone lives in IMPORT_ZONES.
const SHARED_FOLDER_ZONES = ["domain", "components", "stores"].map(
  (folder) => ({
    target: `./src/${folder}`,
    from: "./src/features",
    message: `Shared folder importing a feature. Why: src/${folder} is below features, so a feature import makes a cycle (ADR 0018). Fix: move what both need into src/domain (logic) or src/components (UI).`,
  }),
);
// Read from disk so a new feature folder is covered with no edit here
const FEATURES = fs
  .readdirSync("src/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const FEATURE_ZONE_MESSAGE =
  "Feature importing another feature. Why: features stay independent so each folder can change alone (ADR 0018). Fix: move what both need into src/domain (logic) or src/components (UI).";
const featureZone = (feature, from, except) => ({
  target: `./src/features/${feature}`,
  from: from.map((other) => `./src/features/${other}`),
  ...(except && { except }),
  message: FEATURE_ZONE_MESSAGE,
});
const FEATURE_ZONES = FEATURES.flatMap((feature) => {
  const others = FEATURES.filter((other) => other !== feature);
  if (feature !== "expenses") return [featureZone(feature, others)];
  // The one exception: trip home opens the Add expense sheet (ADR 0018)
  return [
    featureZone(
      feature,
      others.filter((other) => other !== "addExpense"),
    ),
    featureZone(
      feature,
      ["addExpense"],
      ["./components/AddExpenseBottomSheet.tsx"],
    ),
  ];
});
const IMPORT_ZONES = [...SHARED_FOLDER_ZONES, ...FEATURE_ZONES];

// Built before the px tokens; a file leaves this list when the migration restyles it
const LEGACY_SPACING_FILES = [
  "src/components/Avatar.tsx",
  "src/features/createTrip/components/CreateTripForm.tsx",
  "src/features/createTrip/screens/CreateTripScreen.tsx",
  "src/features/addExpense/components/ActivityAndDateSection.tsx",
  "src/features/addExpense/components/AddExpenseBottomSheet.tsx",
  "src/features/addExpense/components/RestoredDraftBanner.tsx",
  "src/features/addExpense/components/StartOverDialog.tsx",
  "src/features/addExpense/components/activity/ActivityField.tsx",
  "src/features/addExpense/components/activity/ActivityPicker.tsx",
  "src/components/addPerson/AddPerson.tsx",
  "src/components/addPerson/AddPersonBottomSheet.tsx",
  "src/components/addPerson/ColorField.tsx",
  "src/components/addPerson/ColorItem.tsx",
  "src/features/addExpense/components/amount/AmountField.tsx",
  "src/features/addExpense/date/components/AddDateBottomSheet.tsx",
  "src/features/addExpense/date/components/DateCalendar.tsx",
  "src/features/addExpense/date/components/DateField.tsx",
  "src/features/addExpense/date/components/QuickPickPills.tsx",
  "src/features/addExpense/components/members/MemberListRow.tsx",
  "src/features/addExpense/components/PaidAndSplitSection.tsx",
  "src/features/addExpense/paidBy/components/PaidByBottomSheet.tsx",
  "src/features/addExpense/paidBy/components/PayerRow.tsx",
  "src/features/addExpense/split/components/PeopleSummaryRow.tsx",
  "src/features/addExpense/components/members/SelectionSummaryBar.tsx",
  "src/features/addExpense/split/components/SplitBottomSheet.tsx",
  "src/features/addExpense/split/components/SplitMethodControl.tsx",
  "src/features/addExpense/split/components/SplitSummary.tsx",
  "src/features/expenses/screens/ExpensesScreen.tsx",
];
// Old dark-theme files with raw px and no notes; a file leaves when the migration restyles it
const NO_TOKEN_NOTE_EXEMPT = [
  "src/features/addExpense/components/members/MemberListRow.tsx",
  "src/features/addExpense/paidBy/components/PaidByBottomSheet.tsx",
];

// A deleted file left on a list is dead config, and nothing else reports it
for (const file of [...LEGACY_SPACING_FILES, ...NO_TOKEN_NOTE_EXEMPT]) {
  if (!fs.existsSync(`${__dirname}/${file}`)) {
    throw new Error(
      `eslint.config.js lists ${file}, which doesn't exist. Why: a file leaves these lists when it's restyled or deleted. Fix: remove the entry.`,
    );
  }
}

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
    files: ["src/db/**", "src/types/**", "src/domain/transforms.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [ALIAS] }],
    },
  },
  {
    // Sheets use sheet-keyboard only
    files: [
      "src/features/**/*Sheet*.{ts,tsx}",
      "src/features/addExpense/**/*.tsx",
      "src/features/expenses/components/**/*.tsx",
      "src/components/addPerson/**/*.tsx",
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
  {
    // Folder layering: shared folders never import features, and features never import each other
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": ["error", { zones: IMPORT_ZONES }],
    },
  },
]);
