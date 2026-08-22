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

## 9. Prettier config (`prettier.config.ts`) and Tailwind class sorting

Prettier config file extension decides the module system, independent of file content:

- `.mts` — always ESM (`export default config;`), regardless of `package.json`.
- `.cts` — always CommonJS (`module.exports = config;`), regardless of `package.json`.
- `.ts` — ambiguous; follows the nearest `package.json`'s `"type"` field. This repo's `package.json` has no `"type"` field, which defaults to CommonJS — so `prettier.config.ts` must use `module.exports`, not `export default`.

TypeScript config files require Node.js ≥ 22.6.0; Node < 24.3.0 additionally needs `--experimental-strip-types` to run Prettier. This repo's Node (v26.4.0) is past that cutoff, so no flag is needed.

To get Tailwind class sorting (auto-sorts `className` strings into Tailwind's canonical order on format), register `prettier-plugin-tailwindcss` in `prettier.config.ts`:

```ts
import { type Config } from "prettier";

const config: Config = {
  plugins: ["prettier-plugin-tailwindcss"],
};

module.exports = config;
```

---

https://prettier.io/docs/configuration#typescript-configuration-files
https://tailwindcss.com/blog/automatic-class-sorting-with-prettier
