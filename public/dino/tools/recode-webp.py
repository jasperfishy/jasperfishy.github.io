#!/usr/bin/env python3
"""Recode a directory of PNG photographs to WebP at identical pixel size.

    python tools/recode-webp.py assets/prehistoric --quality 82

The PNGs in this collection are photographic dinosaur cutouts with alpha, and
they average 1.8 MB each: 56 MB for the species folder alone. WebP carries the
same pixels and the same alpha at roughly a sixth of the bytes, which is what
makes it possible to put several of them in motion at once instead of one.

Nothing is deleted and nothing is resized — the .webp lands beside the .png, so
a page that still names the PNG keeps working, and the swap can be checked file
by file before anything is removed.
"""
from __future__ import annotations

import argparse
import os
import sys

from PIL import Image, ImageChops, ImageStat


def convert(src: str, dst: str, quality: int) -> tuple[int, int, int, int]:
    with Image.open(src) as im:
        im = im.convert("RGBA")
        px, py = im.size
        before = os.path.getsize(src)
        # A lossy WebP is judged against the PNG it replaced, so keep the alpha
        # channel intact rather than letting the encoder matte it against black.
        im.save(dst, "WEBP", quality=quality, method=6)
        after = os.path.getsize(dst)
        with Image.open(dst) as back:
            back = back.convert("RGBA")
            same_size = back.size == (px, py)
            # Raw RGBA is the wrong thing to measure: where alpha is 0 the RGB is
            # never drawn, so a codec that scrambles invisible pixels scores a
            # total mismatch. Judge it composited over grey, as a canvas draws it.
            grey = (128, 128, 128, 255)
            ca = Image.new("RGBA", im.size, grey); ca.alpha_composite(im)
            cb = Image.new("RGBA", back.size, grey); cb.alpha_composite(back)
            diff = ImageChops.difference(ca.convert("RGB"), cb.convert("RGB")).convert("L")
            mean = ImageStat.Stat(diff).mean[0]
            alpha = ImageChops.difference(im.split()[3], back.split()[3]).getextrema()[1]
        if not same_size:
            raise SystemExit(f"{dst}: size changed to {back.size}")
        return before, after, px * py, (mean, alpha)
    return 0, 0, 0, (0, 0)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", help="directory of PNGs to recode")
    ap.add_argument("--quality", type=int, default=82)
    ap.add_argument("--overwrite", action="store_true", help="re-encode existing .webp files")
    args = ap.parse_args()

    names = sorted(f for f in os.listdir(args.folder) if f.lower().endswith(".png"))
    if not names:
        print(f"no PNGs in {args.folder}")
        return 1

    total_in = total_out = total_px = 0
    worst_mean = 0.0
    worst_alpha = 0
    done = skipped = 0
    for name in names:
        src = os.path.join(args.folder, name)
        dst = os.path.join(args.folder, name[:-4] + ".webp")
        if os.path.exists(dst) and not args.overwrite:
            skipped += 1
            continue
        before, after, px, (mean, alpha) = convert(src, dst, args.quality)
        total_in += before
        total_out += after
        total_px += px
        worst_mean = max(worst_mean, mean)
        worst_alpha = max(worst_alpha, alpha)
        done += 1
        print(
            f"{name[:-4]:<22} {before / 1024:7.0f} KB -> {after / 1024:6.0f} KB"
            f"  ({after / before:5.1%})  mean visible delta {mean:5.2f}"
        )

    print(
        f"\n{done} converted, {skipped} already present — "
        f"{total_in / 1048576:.1f} MB -> {total_out / 1048576:.1f} MB, "
        f"{total_px / 1e6:.0f} megapixels kept"
    )
    print(
        f"worst mean visible delta {worst_mean:.2f}/255 ({100 * worst_mean / 255:.2f}% of scale), "
        f"worst alpha delta {worst_alpha}/255"
    )
    if worst_alpha > 8:
        print("WARNING: an alpha edge moved more than 8/255 — look at these files before shipping.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
