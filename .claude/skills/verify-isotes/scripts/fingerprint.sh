#!/usr/bin/env bash
# Prints the hash of isotes' native inputs (Expo's fingerprint: native modules,
# config plugins, app config). It changes only when the app needs a native rebuild.
# Run from the repo root. Usage: fingerprint.sh
set -euo pipefail

# Resolved through expo, so it's the version this SDK ships, not one npx fetches
node -e "
const p = require.resolve('@expo/fingerprint', { paths: [require.resolve('expo/package.json')] });
require(p).createFingerprintAsync('.').then((f) => console.log(f.hash));
"
