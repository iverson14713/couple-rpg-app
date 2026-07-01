#!/usr/bin/env python3
"""Crop transparent padding from xiaoi PNGs for LoveQuest pet widget assets."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "ios/LoveQuestWidget/Assets.xcassets"
STATES = ("happy", "sad", "sleepy", "back_angry")
OUT_MARGIN = 10
ALPHA_THRESHOLD = 8


def tight_bbox(im: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = im.split()[-1]
    mask = alpha.point(lambda p: 255 if p > ALPHA_THRESHOLD else 0)
    return mask.getbbox()


def write_imageset(out_dir: Path, filename: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    contents = {
        "images": [
            {"filename": filename, "idiom": "universal", "scale": "1x"},
            {"idiom": "universal", "scale": "2x"},
            {"idiom": "universal", "scale": "3x"},
        ],
        "info": {"author": "xcode", "version": 1},
    }
    (out_dir / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n")


def main() -> None:
    for state in STATES:
        src = ASSETS / f"xiaoi_{state}.imageset/xiaoi_{state}.png"
        im = Image.open(src).convert("RGBA")
        bbox = tight_bbox(im)
        if not bbox:
            raise SystemExit(f"no visible pixels: {src}")

        x0, y0, x1, y1 = bbox
        w, h = im.size
        x0 = max(0, x0 - OUT_MARGIN)
        y0 = max(0, y0 - OUT_MARGIN)
        x1 = min(w, x1 + OUT_MARGIN)
        y1 = min(h, y1 + OUT_MARGIN)
        cropped = im.crop((x0, y0, x1, y1))

        out_name = f"xiaoi_widget_{state}.png"
        out_dir = ASSETS / f"xiaoi_widget_{state}.imageset"
        cropped.save(out_dir / out_name, optimize=True)
        write_imageset(out_dir, out_name)
        print(f"{state}: {im.size} -> {cropped.size}")


if __name__ == "__main__":
    main()
