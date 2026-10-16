// pnpm design:check [--design <path>]
// Reads the YAML header of DESIGN.md and src/themes/, prints every token that is
// missing or different, and exits 1 if there is any. DESIGN.md is gitignored,
// so this runs as a script rather than a Jest test.
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const { diffTokens } = require("./diffTokens");
const { colors } = require("../../src/themes/color");
const { borderRadius, spacing } = require("../../src/themes/spacing");
const { roles } = require("../../src/themes/typography");

/** Default: DESIGN.md in the working directory (pnpm runs scripts from the repo root). */
function designPath(argv) {
  const i = argv.indexOf("--design");
  return path.resolve(i === -1 ? "DESIGN.md" : argv[i + 1]);
}

/** The block between the first two `---` lines. */
function readHeader(file) {
  const match = fs.readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`${file} has no YAML header`);
  return YAML.parse(match[1]);
}

const file = designPath(process.argv);
const entries = diffTokens(readHeader(file), {
  colors,
  borderRadius,
  spacing,
  roles,
});

for (const { token, expected, actual } of entries) {
  const got = actual === undefined ? "missing" : JSON.stringify(actual);
  console.log(`${token}: expected ${JSON.stringify(expected)}, got ${got}`);
}
console.log(
  entries.length === 0
    ? `design:check: src/themes matches ${path.basename(file)}`
    : `design:check: ${entries.length} token(s) differ from ${path.basename(file)}`,
);
process.exit(entries.length === 0 ? 0 : 1);
