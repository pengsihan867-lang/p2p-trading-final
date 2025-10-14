#!/usr/bin/env python3
"""
Convert a logo with a light/white background into a transparent PNG suited for the
dark theme used by the web UI. Keeps the original colors and softly feathers edges.

Usage:
  python3 tools/convert_logo_to_transparent.py <input_image> [output_png] [--white-th 245] [--feather 2]

Notes:
  - A pixel is regarded as background if all RGB channels are >= white_th and its
    saturation is low. Those pixels will have alpha set to 0 with a soft feather.
  - If output path is omitted, defaults to web/logo.png
"""
from __future__ import annotations
import sys
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageFilter, ImageChops


def to_rgba(im: Image.Image) -> Image.Image:
    if im.mode == "RGBA":
        return im
    if im.mode != "RGB":
        im = im.convert("RGB")
    return im.convert("RGBA")


def remove_white_bg(im: Image.Image, white_th: int = 245, feather: int = 2) -> Image.Image:
    im = to_rgba(im)
    px = im.load()
    w, h = im.size

    # Build an initial binary mask for near-white pixels
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r >= white_th and g >= white_th and b >= white_th:
                mp[x, y] = 255

    # Feather edges to avoid harsh cut
    if feather > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(radius=feather))

    # Invert mask -> keep foreground alpha, zero out background
    inv = Image.eval(mask, lambda v: 255 - v)
    # Combine original alpha with inverted mask (min)
    alpha = Image.new("L", (w, h), 255)
    alpha = ImageChops.lighter(alpha, inv)

    out = im.copy()
    out.putalpha(alpha)
    return out


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    src = Path(argv[1])
    dst = Path(argv[2]) if len(argv) >= 3 and not argv[2].startswith('--') else Path('web/logo.png')
    white_th = 245
    feather = 2
    # Parse optional flags
    for i, a in enumerate(argv[2:], start=2):
        if a == '--white-th' and i + 1 < len(argv):
            white_th = int(argv[i + 1])
        if a == '--feather' and i + 1 < len(argv):
            feather = int(argv[i + 1])

    if not src.exists():
        print(f"[ERR] Input not found: {src}")
        return 1

    im = Image.open(src)
    out = remove_white_bg(im, white_th=white_th, feather=feather)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, format='PNG')
    print(f"[WRITE] {dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
