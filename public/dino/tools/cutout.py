#!/usr/bin/env python3
"""Turn a generated image with a flat background into a clean transparent cutout.

The image service paints creatures on a near-white plate, so every photoreal
species frame needs its background knocked out before the game can composite
it over a scene. Flood-filling from the border (rather than keying on colour)
is what keeps pale bellies and light rims opaque: only background that is
reachable from the edge is removed.

    python tools/cutout.py in.png out.png
    python tools/cutout.py in.png out.png --thresh 34 --feather 1.2

Interior pockets of background colour are left alone on purpose — a hole
through the animal is worse than a stray speck.
"""

import argparse
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def border_seeds(w, h, step=16):
    pts = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    pts += [(x, 0) for x in range(0, w, step)] + [(x, h - 1) for x in range(0, w, step)]
    pts += [(0, y) for y in range(0, h, step)] + [(w - 1, y) for y in range(0, h, step)]
    return pts


def flood_background(img, thresh):
    """Return a boolean mask of pixels reachable from the edge within thresh of the edge colour."""
    w, h = img.size
    probe = img.convert("RGB").copy()
    for seed in border_seeds(w, h):
        # Skip seeds already swallowed by an earlier fill.
        if probe.getpixel(seed) == (255, 0, 255):
            continue
        ImageDraw.floodfill(probe, seed, (255, 0, 255), thresh=thresh)
    arr = np.asarray(probe)
    return (arr[:, :, 0] == 255) & (arr[:, :, 1] == 0) & (arr[:, :, 2] == 255)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--thresh", type=int, default=42, help="how far a pixel may drift from the edge colour")
    ap.add_argument("--feather", type=float, default=1.0, help="edge softness in pixels")
    ap.add_argument("--erode", type=int, default=1, help="pixels shaved off the rim to kill the halo")
    args = ap.parse_args()

    img = Image.open(args.src).convert("RGB")
    bg = flood_background(img, args.thresh)

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    a = Image.fromarray(alpha, "L")
    if args.erode > 0:
        for _ in range(args.erode):
            a = a.filter(ImageFilter.MinFilter(3))
    if args.feather > 0:
        a = a.filter(ImageFilter.GaussianBlur(args.feather))

    out = img.convert("RGBA")
    out.putalpha(a)
    out.save(args.dst)

    kept = int((np.asarray(a) > 8).sum())
    print(f"{args.dst}  kept {kept / (out.size[0] * out.size[1]):.1%} of the frame")
    if kept < out.size[0] * out.size[1] * 0.02:
        sys.exit("warning: almost everything was removed — the background threshold is too loose")


if __name__ == "__main__":
    main()
