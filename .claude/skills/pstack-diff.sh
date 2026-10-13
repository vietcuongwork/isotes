#!/usr/bin/env bash
# Diff isotes' copies of pstack files against upstream cursor/plugins at the pinned commit.
# Usage: .claude/skills/pstack-diff.sh [repo-relative-path ...]
#   No arguments: every mapped file that exists locally. Prints "same" or a unified diff per file.
#   PSTACK_ROOT=<dir> checks a copy of the tree instead of this repo.
# Exit: 0 when every file was compared (diffs included), 1 on an unmapped, missing or unfetched file.
set -euo pipefail

PIN=11713c6
BASE="https://raw.githubusercontent.com/cursor/plugins/$PIN/pstack/skills"
# The repo this script lives in (.claude/skills/), not the caller's cwd
ROOT="${PSTACK_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
[[ -d $ROOT ]] || { echo "pstack-diff: no such root: $ROOT" >&2; exit 1; }

# .claude/skills/<name>/<path> ← <name>/<path>
SKILLS="create-verification-skill correct unslop"
# Files outside the naming conventions: local=upstream
EXPLICIT="
.claude/rules/isotes-typescript.md=typescript-best-practices/SKILL.md
documentation/typescript-patterns.md=typescript-best-practices/references/patterns.md
.claude/rules/isotes-writing.md=unslop/SKILL.md
"

upstream_for() {
  local f=$1 pair skill
  for pair in $EXPLICIT; do
    if [[ $f == "${pair%%=*}" ]]; then echo "${pair#*=}"; return; fi
  done
  case $f in
    .claude/principles/*.md) f=${f#.claude/principles/}; echo "principle-${f%.md}/SKILL.md"; return ;;
  esac
  for skill in $SKILLS; do
    if [[ $f == .claude/skills/$skill/* ]]; then echo "${f#.claude/skills/}"; return; fi
  done
  return 1
}

default_files() {
  local pair skill
  [[ -d $ROOT/.claude/principles ]] && (cd "$ROOT" && find .claude/principles -type f -name '*.md')
  for skill in $SKILLS; do
    [[ -d $ROOT/.claude/skills/$skill ]] && (cd "$ROOT" && find ".claude/skills/$skill" -type f ! -name '.*')
  done
  for pair in $EXPLICIT; do
    [[ -f $ROOT/${pair%%=*} ]] && echo "${pair%%=*}"
  done
  return 0
}

if [[ $# -gt 0 ]]; then files=$(printf '%s\n' "$@"); else files=$(default_files | sort); fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
status=0 same=0 differ=0 failed=0

while IFS= read -r f; do
  [[ -z $f ]] && continue
  f=${f#"$ROOT"/}; f=${f#./}
  if ! up=$(upstream_for "$f"); then
    echo "== $f: not a pstack copy"; failed=$((failed + 1)); continue
  fi
  if [[ ! -f $ROOT/$f ]]; then
    echo "== $f: missing locally"; failed=$((failed + 1)); continue
  fi
  if ! curl -fsS --max-time 30 "$BASE/$up" -o "$tmp/upstream"; then
    echo "== $f: fetch failed ($up)"; failed=$((failed + 1)); continue
  fi
  if diff -q "$tmp/upstream" "$ROOT/$f" >/dev/null; then
    echo "== $f: same"; same=$((same + 1))
  else
    echo "== $f ← $up"; differ=$((differ + 1))
    diff -u --label "upstream/$up" --label "$f" "$tmp/upstream" "$ROOT/$f" || true
  fi
done <<< "$files"

# A tree with nothing mapped must not read as a clean pass
echo "-- $((same + differ + failed)) files: $same same, $differ differ, $failed failed"
[[ $failed -eq 0 && $((same + differ)) -gt 0 ]] || status=1
exit $status
