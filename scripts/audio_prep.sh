#!/usr/bin/env bash
# r14C: turn the Suno source files into the site's sound assets (assets/audio/).
# Usage: bash scripts/audio_prep.sh [source dir]   (default /workspace/deliverables/ailiu-audio, read only)
# Needs ffmpeg with aac + libopus. Every output comes in two encodings: AAC .m4a (Safari / iOS) and Opus .webm
# (browsers without AAC); app.js picks one with canPlayType.
#
# Effects: loudness-normalised on the whole source clip first (two-pass loudnorm, linear, -16 LUFS), then the
# leading silence is cut, the clip is trimmed short, and the tail fades out.
# Music: a bar-aligned section (92 bpm, 2.6 s bars) cut so it loops seamlessly: the clip is [s+X, e+X] with its
# last X seconds cross-faded into [s, s+X] (acrossfade), so the file's end runs straight into its start.
set -euo pipefail
SRC="${1:-/workspace/deliverables/ailiu-audio}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/audio"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"
calc() { awk "BEGIN { printf \"%.4f\", $1 }"; }

# two-pass loudnorm → $TMP/<name>.wav
norm() { # name target_LUFS
  local f="$SRC/$1.mp3" j
  j=$(ffmpeg -hide_banner -nostats -i "$f" -af "loudnorm=I=$2:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  local mi mtp mlra mth off
  mi=$(sed -n 's/.*"input_i" : "\(.*\)".*/\1/p' <<<"$j"); mtp=$(sed -n 's/.*"input_tp" : "\(.*\)".*/\1/p' <<<"$j")
  mlra=$(sed -n 's/.*"input_lra" : "\(.*\)".*/\1/p' <<<"$j"); mth=$(sed -n 's/.*"input_thresh" : "\(.*\)".*/\1/p' <<<"$j")
  off=$(sed -n 's/.*"target_offset" : "\(.*\)".*/\1/p' <<<"$j")
  ffmpeg -v error -y -i "$f" -af "loudnorm=I=$2:TP=-1.5:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true,aresample=48000" "$TMP/$1.wav"
}
enc() { # in.wav out-basename aac_kbps opus_kbps
  ffmpeg -v error -y -i "$1" -c:a aac -b:a "$3k" -movflags +faststart "$OUT/$2.m4a"
  ffmpeg -v error -y -i "$1" -c:a libopus -b:a "$4k" "$OUT/$2.webm"
}
sfx() { # name keep_seconds fade_seconds start_threshold_dB
  norm "$1" -16
  ffmpeg -v error -y -i "$TMP/$1.wav" -af "silenceremove=start_periods=1:start_threshold=$4dB:start_silence=0.005,atrim=0:$2,afade=t=in:d=0.004,afade=t=out:st=$(calc "$2 - $3"):d=$3,asetpts=N/SR/TB" "$TMP/$1-cut.wav"
  enc "$TMP/$1-cut.wav" "$1" 96 64
}
loop() { # name out start length crossfade
  norm "$1" -18
  local s="$2" L="$3" X="$4"
  # the same file opened twice (one split input stalls acrossfade: the head is needed after the whole body)
  ffmpeg -v error -y -i "$TMP/$1.wav" -i "$TMP/$1.wav" -filter_complex \
    "[0:a]atrim=start=$(calc "$s + $X"):end=$(calc "$s + $L + $X"),asetpts=N/SR/TB[a];[1:a]atrim=start=$s:end=$(calc "$s + $X"),asetpts=N/SR/TB[b];[a][b]acrossfade=d=$X:c1=qsin:c2=qsin[o]" \
    -map "[o]" "$TMP/$5.wav"
  enc "$TMP/$5.wav" "$5" 96 64
}

sfx click 0.22 0.06 -40      # one tick from the start of click.mp3 (the source repeats it)
sfx expand 0.5 0.18 -24     # starts on the body of the swell (the first 0.3 s is a quiet rise)
sfx collapse 0.5 0.18 -40
sfx whoosh 1.0 0.4 -45
loop bg-1 14.5 70.2 3 bg-loop        # main: bg-1 14.5–84.7 s, 27 bars
loop bg-2 43.0 62.4 3 bg-loop-alt    # spare (not loaded): bg-2 43.0–105.4 s, 24 bars
ls -l "$OUT"
