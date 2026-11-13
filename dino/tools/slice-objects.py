#!/usr/bin/env python3
"""Slice a generated 4x4 contact sheet into individual transparent objects.

The image service delivers whole sheets — sixteen specimens on one white sweep —
because that is one generation instead of sixteen. Each cell is knocked out on
its own so a bright specimen cannot be eaten by a neighbour's background, then
cropped to its alpha box and written as a square WebP ready for `fx/du-objects.js`.

    python tools/slice-objects.py sheet.png fern,leaf,sprout,... --out assets/objects
    python tools/slice-objects.py sheet.png ... --px 320 --thresh 26 --proof /tmp/proof.png

--proof writes the finished alpha over a mid-grey checkerboard. That is the only
way to see whether the quartz crystal survived its own knockout: a transparent
PNG on a white terminal looks perfect right up until it is not.
"""

import argparse
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

GRID = 4


def border_flood(rgb, thresh):
    """Background pixels reachable from the edge of this cell, as a boolean mask."""
    h, w = rgb.shape[:2]
    seed_colour = np.median(np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]), axis=0)
    dist = np.abs(rgb.astype(np.int16) - seed_colour.astype(np.int16)).max(axis=2) <= thresh
    seen = np.zeros((h, w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if dist[y, x] and not seen[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if dist[y, x] and not seen[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and dist[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                dq.append((ny, nx))
    return seen


def knockout(cell_rgb, thresh, feather, erode, pockets=False):
    bg = border_flood(cell_rgb, thresh)
    if pockets:
        bg |= cell_rgb.min(axis=2) >= 244
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    a = Image.fromarray(alpha, "L")
    for _ in range(erode):
        a = a.filter(ImageFilter.MinFilter(3))
    if feather > 0:
        a = a.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(a)


def tight_square(rgb, alpha, px, pad=0.06):
    ys, xs = np.where(alpha > 8)
    if len(ys) == 0:
        return None
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    img = Image.fromarray(np.dstack([rgb[y0:y1 + 1], alpha[y0:y1 + 1]]), "RGBA")
    side = max(img.size)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    off = ((side - img.size[0]) // 2, (side - img.size[1]) // 2)
    out.paste(img, off, img)
    framed = int(px * (1 - pad))
    canvas = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    scaled = out.resize((framed, framed), Image.LANCZOS)
    canvas.paste(scaled, ((px - framed) // 2, (px - framed) // 2), scaled)
    return canvas


def proof_sheet(items, px):
    n = len(items)
    cols = 4
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGB", (cols * px, rows * px), (128, 128, 128))
    d = ImageDraw.Draw(sheet)
    sq = px // 8
    for r in range(rows):
        for c in range(cols):
            for rr in range(0, px, sq):
                for cc in range(0, px, sq):
                    if (rr // sq + cc // sq) % 2:
                        d.rectangle([c * px + cc, r * px + rr, c * px + cc + sq, r * px + rr + sq], fill=(170, 170, 170))
    for i, im in enumerate(items):
        if im is None:
            continue
        sheet.paste(im, ((i % cols) * px, (i // cols) * px), im)
    return sheet


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("slugs", help="comma separated, reading left-to-right then top-to-bottom")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "assets", "objects"))
    ap.add_argument("--px", type=int, default=256)
    ap.add_argument("--thresh", type=int, default=26)
    ap.add_argument("--feather", type=float, default=1.0)
    ap.add_argument("--erode", type=int, default=1)
    ap.add_argument("--quality", type=int, default=82)
    ap.add_argument("--proof", default=None)
    ap.add_argument("--pockets", default="", help="slugs whose enclosed white gaps should also clear")
    args = ap.parse_args()

    slugs = [s.strip() for s in args.slugs.split(",") if s.strip()]
    pocketed = {s.strip() for s in args.pockets.split(",") if s.strip()}
    src = Image.open(args.src).convert("RGB")
    w, h = src.size
    cw, ch = w // GRID, h // GRID
    if len(slugs) > GRID * GRID:
        sys.exit(f"{len(slugs)} slugs do not fit a {GRID}x{GRID} sheet")

    arr = np.asarray(src)
    os.makedirs(args.out, exist_ok=True)
    done, thin = [], []
    for i, slug in enumerate(slugs):
        cy, cx = (i // GRID) * ch, (i % GRID) * cw
        cell = arr[cy:cy + ch, cx:cx + cw]
        alpha = knockout(cell, args.thresh, args.feather, args.erode, slug in pocketed)
        kept = (alpha > 8).mean()
        img = tight_square(cell, alpha, args.px)
        done.append(img)
        if img is None or kept < 0.015:
            thin.append(slug)
            print(f"  {slug:<14} kept {kept:5.1%}  *** SUSPICIOUS — check the proof sheet")
            continue
        img.save(os.path.join(args.out, slug + ".webp"), "WEBP", quality=args.quality, method=6)
        print(f"  {slug:<14} kept {kept:5.1%}  {os.path.getsize(os.path.join(args.out, slug + '.webp')) / 1024:6.1f} KB")

    if args.proof:
        proof_sheet(done, args.px).save(args.proof)
        print("proof -> " + args.proof)
    print(f"wrote {len(slugs) - len(thin)} of {len(slugs)} objects to {args.out}")
    if thin:
        sys.exit("empty or nearly-empty cells: " + ", ".join(thin))


if __name__ == "__main__":
    main()
