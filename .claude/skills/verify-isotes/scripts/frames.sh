#!/bin/zsh
# frames.sh <video> [from to]: tiles a recording's frames 4 across, 3 down per sheet, and prints which frame each cell is
# The key is text because this ffmpeg has no drawtext (Homebrew builds it without freetype)
set -euo pipefail
video=${1:A}; from=${2:-0}; to=${3:-1e9}
out=${0:A:h:h:h:h:h}/.sim/frames/${${video:t}:r}; rm -rf "$out"; mkdir -p "$out"
# Simulator recordings only hold a frame per screen change: select by timestamp, not -ss, so sheets and key match
ffmpeg -v error -i "$video" -vf "select='between(t,$from,$to)',scale=300:-1,tile=4x3,setpts=N" -fps_mode passthrough "$out/sheet-%03d.png"
ffprobe -v error -select_streams v -show_entries frame=pts_time -of csv=p=0 "$video" \
  | awk -F, -v from="$from" -v to="$to" '$1 >= from && $1 <= to {
      if (n % 12 == 0) printf "%ssheet-%03d.png", (n ? "\n" : ""), n / 12 + 1
      if (n % 4 == 0) printf "\n  row %d:", (n % 12) / 4 + 1
      printf "  #%d %.3fs", n, $1; n++ } END { print n ? "" : "no frames in that range" }'
echo "sheets in $out"
