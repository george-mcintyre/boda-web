#!/usr/bin/env bash
#
# Upscale the gift-card front images for print using Real-ESRGAN.
#
# Why this script exists:
#   The originals are too low-resolution for 300 DPI print at A5
#   (148.5 x 210 mm). At their source dimensions they print at ~80-175 DPI,
#   making the photo softness visible on close inspection. Real-ESRGAN is
#   a free / local AI super-resolution model that produces noticeably
#   sharper results than bicubic / Lanczos / Preserve-Details-2.0.
#
# Per-file model + scale chosen for content type:
#   gift-note-cover.jpg            photo (boxes + diamonds)  realesrgan-x4plus      4x
#   couple-inside-transparent.png  cartoon illustration      realesrgan-x4plus-anime 4x
#   couple-inside-portrait.png     cartoon illustration      realesrgan-x4plus-anime 4x
#
# Requires:
#   - realesrgan binary on PATH (or at ~/bin/realesrgan)
#   - models directory at ~/.local/share/realesrgan/models
#   Both are installed by following the README in this directory.
#
# Usage:
#   bash scripts/upscale-gift-card-images.sh
#
# The script preserves the originals as `<name>.original.<ext>` before
# overwriting, so you can rollback by:
#   for f in <name>.original.<ext>; do mv "$f" "${f/.original./.}"; done

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGES_DIR="$REPO_ROOT/public/assets/images/gift-cards"
MODELS_DIR="${REALESRGAN_MODELS:-$HOME/.local/share/realesrgan/models}"
REALESRGAN_BIN="${REALESRGAN_BIN:-$HOME/bin/realesrgan}"

if [[ ! -x "$REALESRGAN_BIN" ]]; then
  echo "Error: realesrgan binary not found at $REALESRGAN_BIN" >&2
  echo "  Set REALESRGAN_BIN env var or install per scripts/print/README.md" >&2
  exit 1
fi
if [[ ! -d "$MODELS_DIR" ]]; then
  echo "Error: realesrgan models dir not found at $MODELS_DIR" >&2
  echo "  Set REALESRGAN_MODELS env var or install per scripts/print/README.md" >&2
  exit 1
fi

upscale() {
  local filename="$1"   # e.g. gift-note-cover.jpg
  local model="$2"      # e.g. realesrgan-x4plus
  local scale="$3"      # e.g. 4

  local src="$IMAGES_DIR/$filename"
  local ext="${filename##*.}"
  local stem="${filename%.*}"
  local backup="$IMAGES_DIR/$stem.original.$ext"
  local tmp_out="$IMAGES_DIR/$stem.upscaled.$ext"

  if [[ ! -f "$src" ]]; then
    echo "[skip] $filename not found at $src"
    return 0
  fi

  # Already backed up? Skip the backup step but still upscale (the user may
  # have rerun the script after deciding to try a different model).
  if [[ ! -f "$backup" ]]; then
    cp "$src" "$backup"
    echo "[backup] $filename -> $stem.original.$ext"
  fi

  echo "[upscale] $filename  model=$model  scale=${scale}x"
  "$REALESRGAN_BIN" \
    -i "$src" \
    -o "$tmp_out" \
    -m "$MODELS_DIR" \
    -n "$model" \
    -s "$scale" \
    -f "$ext"

  mv "$tmp_out" "$src"

  # Report new dimensions for the log
  if command -v sips >/dev/null; then
    local dims
    dims=$(sips -g pixelWidth -g pixelHeight "$src" 2>/dev/null \
      | awk '/pixelWidth/ {w=$2} /pixelHeight/ {h=$2} END {print w"x"h}')
    echo "[done]    $filename  -> $dims"
  else
    echo "[done]    $filename"
  fi
}

cd "$REPO_ROOT"

upscale "gift-note-cover.jpg"            "realesrgan-x4plus"       "4"
upscale "couple-inside-transparent.png"  "realesrgan-x4plus-anime" "4"
upscale "couple-inside-portrait.png"     "realesrgan-x4plus-anime" "4"

echo
echo "All upscale operations complete."
echo "Originals preserved as <name>.original.<ext>"
echo "Run 'node scripts/print/render-artefacts.js <bundle>' to render new PDFs."
