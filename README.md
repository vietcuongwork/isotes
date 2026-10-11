# isotes

Local-first trip expense splitter for iOS: create a trip, add the people and their expenses, split each expense, and see who owes whom. All data stays on the device (expo-sqlite + drizzle); there is no backend.

Built with Expo SDK 57, React Native 0.86, expo-router, NativeWind, Zustand, and react-hook-form + zod.

## Setup

Needs Node, pnpm and Xcode (an iOS simulator or a device).

```bash
pnpm install
```

## Run

```bash
pnpm ios
```

Builds the native app (`expo run:ios`) and starts Metro. `ios/` and `android/` are generated and git-ignored. After the first build, start only Metro:

```bash
pnpm start
```

Rebuild with `pnpm ios` after adding or upgrading a package with native code, or after changing the plugins in `app.json`. If the native project gets stale, regenerate it:

```bash
npx expo prebuild --clean
```

Android (`pnpm android`) builds but isn't tuned yet.

## Verify

```bash
pnpm check
```

Runs `tsc --noEmit`, lint (no errors, at most the known warnings) and Jest.

## Database

The schema is `src/db/schema.ts`. After changing it, generate a migration; migrations run on app launch.

```bash
npx drizzle-kit generate
```

## Layout

Routes in `src/app/`, feature folders in `src/features/`, shared UI in `src/components/`, data access in `src/db/`.
