# Tailwind CSS (via NativeWind) — Setup

How this project wires Tailwind CSS into React Native/Expo, via NativeWind v4.

---

## 1. Packages

```json
"nativewind": "^4.2.6",
"react-native-css-interop": "0.2.6",
"tailwindcss": "^3.4.19",
"prettier-plugin-tailwindcss": "^0.5.14"
```

NativeWind compiles Tailwind `className` strings into native `StyleSheet` objects at build/runtime — Tailwind itself never touches the DOM here.

---

## 2. `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

`jsxImportSource: "nativewind"` makes JSX compile through NativeWind's runtime so `className` props resolve to styles.

---

## 3. `metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

Points Metro at the Tailwind entry stylesheet (`global.css`) so it can generate the native style output.

---

## 4. `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Imported once, at the app root (`src/app/_layout.tsx`):

```tsx
import "../../global.css";
```

---

## 5. `tailwind.config.js`

```js
const { fontFamily } = require("./src/themes/typography");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily,
    },
  },
  plugins: [],
};
```

- `presets: [require("nativewind/preset")]` — required so Tailwind emits RN-compatible values.
- `content` — glob of files scanned for `className` usage.
- `theme.extend.fontFamily` — pulled from `src/themes/typography.js`, the single source of truth for font tokens (see note below).

---

## 6. TypeScript support

`nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />
```

Included in `tsconfig.json`'s `include` array so `className` is a recognized prop on RN components.

---

## 7. Usage

```tsx
<View className="gap-2">
  <Text className="font-outfit-regular text-base text-[#888888]">Hi</Text>
</View>
```

**Caveat:** `className` only works on components NativeWind wraps (View, Text, TextInput, etc. out of the box, or anything registered via `cssInterop`). Native third-party components — e.g. `@react-native-picker/picker`'s `Picker` — do **not** support `className`; style them with plain `style`/`itemStyle` props instead.

---

## 8. Custom font tokens (`src/themes/typography.js`)

Font tokens flow through three files, all keyed by the same string (e.g. `"outfit-regular"`):

1. **`assets/fonts/index.ts`** — loads the actual `.ttf` files and assigns each one a runtime font family name:

   ```ts
   export const fonts: Record<string, FontSource> = {
     "fraunces-bold": FrauncesBold,
     "outfit-regular": OutfitRegular,
     "outfit-semibold": OutfitSemiBold,
     "outfit-bold": OutfitBold,
   };
   ```

   Registered once at app root via `useFonts(fonts)` in `src/app/_layout.tsx`, and declared for native builds in `app.json`'s `expo-font` plugin (`plugins: [["expo-font", { fonts: [...] }]]`), which points at the same `.ttf` files under `assets/fonts/`.

2. **`src/themes/typography.js`** — re-exposes those same key strings as Tailwind's `fontFamily` theme tokens (see §5), so they're usable as `className="font-outfit-regular"`.

3. **Native `StyleSheet` code** — since `typography.js` stores plain strings (not arrays, see note below), the same value works directly as `fontFamily: fontFamily["outfit-regular"]` for components that can't take `className` (e.g. `Picker`'s `itemStyle`).

To add a new font: drop the `.ttf` in `assets/fonts/`, add it to `assets/fonts/index.ts` and `app.json`'s `expo-font` plugin, then add the matching key to `src/themes/typography.js`. Keep the key string identical across all three — that's what keeps `className`, Tailwind, and native styles pointing at the same font without a mapping/adapter layer.

---

## Note: `theme.fontFamily` string vs. array

In Tailwind's `theme.fontFamily`, each entry can be either a single string or an array of strings (used as a CSS fallback stack, e.g. `["Outfit-Regular", "system-ui", "sans-serif"]`, which compiles to `font-family: Outfit-Regular, system-ui, sans-serif;`). Since RN's `fontFamily` style prop only ever takes one string (no fallback-stack concept), this project keeps `src/themes/typography.js` values as plain strings — that way the same value is directly usable in both `className` (Tailwind) and native `StyleSheet` code, no unwrapping needed.

---

## 9. Prettier config (`prettier.config.cts`) and Tailwind class sorting

Prettier config file extension decides the module system, independent of file content:

- `.mts` — always ESM (`export default config;`), regardless of `package.json`.
- `.cts` — always CommonJS (`module.exports = config;`), regardless of `package.json`.
- `.ts` — in theory follows the nearest `package.json`'s `"type"` field (defaulting to CommonJS when absent, as in this repo). In practice, Prettier's config loader treated a bare `prettier.config.ts` as ESM anyway, so `module.exports` failed with `module is not defined in ES module scope`. Use the explicit `.cts` extension to force CommonJS unambiguously instead of relying on `.ts`.

The import line matters too: `import { type Config } from "prettier"` is **not** fully erased by Node's native TS type-stripping inside a `.cts` file — it survives as a literal `import` statement, which CommonJS can't parse (`Cannot use import statement outside a module`). Use `import type { Config } from "prettier"` instead — a whole-statement type-only import, which Node's stripping removes entirely:

```ts
// prettier.config.cts
import type { Config } from "prettier";

const config: Config = {
  plugins: ["prettier-plugin-tailwindcss"],
};

module.exports = config;
```

TypeScript config files require Node.js ≥ 22.6.0; Node < 24.3.0 additionally needs `--experimental-strip-types` to run Prettier. This repo's Node (v26.4.0) and VS Code's bundled extension-host Node (v24.18.1) are both past that cutoff, so no flag is needed either in the terminal or in the editor.

Editor setup, beyond the config file itself:

- `.vscode/settings.json` needs `"editor.formatOnSave": true` and `"editor.defaultFormatter": "esbenp.prettier-vscode"` — neither is on by default.
- The Prettier extension caches the resolved config file path per file; renaming `prettier.config.ts` → `.cts` requires **Developer: Reload Window** (Cmd+Shift+P) before the editor picks up the new file instead of silently falling back to an empty config.
- `prettier.config.cts` itself needs `module`/`require` types: `pnpm add -D @types/node` (no `"types"` field is set in `tsconfig.json`, so it's picked up automatically). Additionally, `tsconfig.json`'s `include` only lists `**/*.ts`/`**/*.tsx` by default — add `**/*.cts` (and `**/*.mts`) so `prettier.config.cts` is part of the TS program at all; otherwise VS Code treats it as a loose inferred file and ignores installed `@types` regardless.

Tailwind class sort order is Tailwind's internal CSS-generation order (layout → flexbox/grid → borders → backgrounds → spacing → typography → …), not an intuitive/alphabetical order — e.g. `p-4` legitimately sorts after `bg-[...]`. Verify against the actual installed plugin (`node -e` calling `prettier.resolveConfig` + `prettier.format`) rather than guessing, if a "wrong" order looks suspicious.

**References**

- https://prettier.io/docs/configuration#typescript-configuration-files
- https://tailwindcss.com/blog/automatic-class-sorting-with-prettier

---

## 10. v2.0 — Typography roles as a Tailwind plugin

*Supersedes the `font-outfit-* text-<size>` class pairing shown in §7. The font-family token flow in §8 is unchanged — this sits on top of it.*

### What changed

Text styling moved from two classes per element (`font-outfit-medium text-label`) to one **role** class (`text-label`) that carries family + size + line-height + tracking together. Roles are defined as data in `src/themes/typography.js` and registered as real utilities by a plugin in `tailwind.config.js`:

```js
// tailwind.config.js
const plugin = require("tailwindcss/plugin");
const { fontFamily, textUtilities } = require("./src/themes/typography");

plugins: [plugin(({ addUtilities }) => addUtilities(textUtilities))],
```

`src/themes/typography.js` now exports:

- `fontFamily` — Tailwind `fontFamily` tokens (§5, §8) and native `style={{ fontFamily }}` lookups (unchanged)
- `roles` — `{ family, size, line?, tracking?, uppercase? }` per role, the single source
- `textUtilities` — `{ ".text-<role>": { …CSS… } }`, fed to `addUtilities`
- `textStyle(name)` — the same role as a React Native style object (numbers, not `px` strings) for code that can't take `className` (Reanimated, `StyleSheet.create`, `Picker` itemStyle)

### Why a plugin, not `theme.extend.fontSize`

The claim "`fontSize` config can't bake in the family" was half right. Tailwind v3's `fontSize` tuple — `[size, { lineHeight, letterSpacing, fontWeight }]` — supports `fontWeight` but **not** `fontFamily`. And because the Outfit weights are loaded as separate named faces (`outfit-light`, `outfit-medium`, …), not a variable font, `fontWeight: 300` wouldn't switch faces — it would just set an ignored CSS property. A plugin has no such limit: `addUtilities` takes a full CSS declaration block, `fontFamily` included.

An intermediate attempt used `@layer utilities { .text-hero { @apply … } }` in `global.css`. It compiles, but Tailwind CSS IntelliSense doesn't enumerate hand-written `@layer` classes — no autocomplete, no hover, no typo warnings. Plugin-added utilities **are** enumerated, so the plugin route keeps editor support while keeping tokens in JS.

Reference: <https://v3.tailwindcss.com/docs/plugins>

### Why still Tailwind v3 / NativeWind v4

The CSS-first model (`@theme`, `@utility`, no `tailwind.config.js`) is **Tailwind v4**, which needs **NativeWind v5** — currently preview/alpha. Expo SDK 57 is built and tested against NativeWind v4. Adopting v5 now means a preview dependency plus Metro/Babel config to debug ourselves, for a project not blocked on any v4 limitation. The `roles` + plugin setup converts cleanly to `@theme` + `@utility` when v5 stabilises.

Keeping tokens in JS also stays friendlier to native `StyleSheet` code: in v4 the tokens become CSS variables, and React Native has no runtime CSSOM to read them back (`vars()` in v5 is more friction than `import { fontFamily }`).

### IntelliSense: set the CSS language mode

Tailwind CSS IntelliSense adds completions but **doesn't replace** VS Code's built-in CSS validator, which flags `@tailwind` and `@apply` as "Unknown at-rule" (`@layer` is standard CSS, so it isn't flagged). Fix by handing validation to the extension:

```jsonc
// .vscode/settings.json
{
  "files.associations": { "*.css": "tailwindcss" }
}
```

Or the narrower `"css.lint.unknownAtRules": "ignore"`. Editor-only — neither affects the build.


---
