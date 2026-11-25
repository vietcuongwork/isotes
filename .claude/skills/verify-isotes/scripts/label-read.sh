#!/usr/bin/env bash
# Placeholder labels of the app's single-line text fields, read with lldb (stale kern or line height on a recycled view).
# Usage: label-read.sh ["<placeholder regex>"]  → one line per label:
#   text | NSRect frame | NSSize size | kern | LineHeight min/max | LineBreakMode
# Attach only on a settled screen: a hung attach has twice left the simulator unresponsive until a shutdown and fresh boot.
set -euo pipefail
. "$(dirname "$0")/sim-env.sh"
re=${1:-.}
# Match on this simulator's path: a bare `pgrep -f isotes.app/isotes` also finds `log stream` and isotes on other simulators.
pid=$(pgrep -f "Devices/$SIM/.*/isotes.app/isotes$" | head -1 || true)
[ -n "$pid" ] || { echo "label-read: isotes isn't running on $SIM" >&2; exit 1; }

tree=$(lldb -p "$pid" --batch -o 'expr -l objc -O -- [[[[UIApplication sharedApplication] windows] firstObject] recursiveDescription]' -o detach 2>/dev/null || true)
labels=$(sed -nE "s/.*UITextFieldLabel: (0x[0-9a-f]+);.* text = '([^']*)'.*/\1	\2/p" <<<"$tree" | awk -F'\t' -v re="$re" '$2 ~ re')
[ -n "$labels" ] || { echo "label-read: no placeholder label matches '$re' on this screen" >&2; exit 1; }

# One plain expr per value: a single stringWithFormat: of all of them hung the app (2026-11-23).
# _defaultAttributes is private UIKit, the only place the label's stored kern shows.
args=()
while IFS=$'\t' read -r addr text; do
  args+=(-o "expr -l objc -O -- @\"LR|$text\""
    -o "expr -l objc -O -- [(id)$addr valueForKey:@\"frame\"]"
    -o "expr -l objc -O -- [(id)$addr valueForKey:@\"intrinsicContentSize\"]"
    -o "expr -l objc -O -- [[(id)$addr _defaultAttributes] objectForKey:@\"NSKern\"]"
    -o "expr -l objc -O -- [[(id)$addr _defaultAttributes] objectForKey:@\"NSParagraphStyle\"]")
done <<<"$labels"

# lldb echoes each command as "(lldb) expr …"; the echo says which value the following lines hold.
lldb -p "$pid" --batch "${args[@]}" -o detach 2>&1 | awk '
  function emit() { print t " | " fr " | " sz " | kern " (k == "" ? "nil" : k) " | " lh " | " lb; t = fr = sz = k = lh = lb = "" }
  /^\(lldb\) expr/ {
    if ($0 ~ /LR\|/) { if (t != "") emit(); f = "text" }
    else if ($0 ~ /"frame"/) f = "frame"
    else if ($0 ~ /intrinsicContentSize/) f = "size"
    else if ($0 ~ /NSKern/) f = "kern"
    else if ($0 ~ /NSParagraphStyle/) f = "ps"
    next
  }
  /^\(lldb\)/ { f = ""; next }
  f == "text" && /^LR\|/ { t = substr($0, 4); next }
  f == "frame" && /^NSRect/ { fr = $0; next }
  f == "size" && /^NSSize/ { sz = $0; next }
  f == "kern" && NF && k == "" { k = $0; next }
  f == "ps" {
    if (match($0, /LineHeight [0-9.\/]+/)) lh = substr($0, RSTART, RLENGTH)
    if (match($0, /LineBreakMode [A-Za-z]+/)) lb = substr($0, RSTART, RLENGTH)
  }
  END { if (t != "") emit() }'
