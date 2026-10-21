#!/usr/bin/env bash
# Measures pixels in a screenshot or recording, for checks a tree read can't make.
#   pixels.sh columns <png> <x> <y> <w> <h>   ink column runs in a region (tabular figures, alignment)
#   pixels.sh luma <mp4> <x> <y> <w> <h>      a region's mean luma each time it changes (fades, slides)
# x y w h are points on the working simulator; output is pixels at the file's scale.
set -euo pipefail

SCALE=${PIXELS_SCALE:-3} # tree points to pixels: 3 on Pro and Plus iPhones, 2 on an SE
DELTA=40                 # ink = luma more than this away from the region's top-left pixel, so light-on-dark works too

usage() { sed -n '3,5p' "$0" >&2; exit 2; }
[ $# -eq 6 ] || usage
mode=$1 file=$2
shift 2
[ -f "$file" ] || { echo "pixels.sh: no file $file" >&2; exit 1; }

s=$SCALE
crop="crop=$(($3 * s)):$(($4 * s)):$(($1 * s)):$(($2 * s))"

case $mode in
  columns)
    # No PIL here: ffmpeg writes the crop as raw gray bytes, and Python finds the runs.
    ffmpeg -loglevel error -i "$file" -vf "$crop,format=gray" -frames:v 1 -f rawvideo - |
      python3 -I -c '
import sys
w, h, delta = map(int, sys.argv[1:])
d = sys.stdin.buffer.read()
ink = [x for x in range(w) if any(abs(d[y * w + x] - d[0]) > delta for y in range(h))]
runs, start = [], None
for i, x in enumerate(ink):
    start = x if start is None else start
    if i + 1 == len(ink) or ink[i + 1] != x + 1:
        runs.append(f"{start}-{x}")
        start = None
print(" ".join(runs) or "no ink")
' "$(($3 * s))" "$(($4 * s))" "$DELTA"
    ;;
  luma)
    out=$(mktemp)
    trap 'rm -f "$out"' EXIT
    # Simulator recordings repeat timestamps, which floods stderr with dts warnings; they're harmless.
    ffmpeg -loglevel error -i "$file" -vf "$crop,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$out" -f null - 2>/dev/null
    paste - - <"$out" | sed -E 's/.*pts_time:([0-9.]+).*YAVG=([0-9.]+).*/\1 \2/' |
      awk '{ v = int($2); if (v != last) print $1 "s", v; last = v }'
    ;;
  *) usage ;;
esac
