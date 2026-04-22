#!/usr/bin/env python3
"""
Build app icon from apps/web/public/heart-hustle-logo.png:
crop shield+heart (left emblem), drop wordmark, center on square #1A1A2E, export 1024.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

BG = np.array([26, 26, 46], dtype=np.uint8)
WHITE = np.array([255, 255, 255], dtype=np.float32)


def main() -> int:
    root = Path(__file__).resolve().parents[3]  # HeartHustleFund (…/apps/mobile/scripts/file.py)
    src = root / "apps" / "web" / "public" / "heart-hustle-logo.png"
    if not src.exists():
        print(f"Missing source: {src}", file=sys.stderr)
        return 1

    im = np.array(Image.open(src).convert("RGBA"))
    h, w = im.shape[:2]
    rgb = im[..., :3].astype(np.float32)
    a = im[..., 3:4].astype(np.float32) / 255.0

    # Foreground = not near-white (separates art from page background)
    d_white = np.linalg.norm(rgb - WHITE, axis=2)
    ink = d_white > 22.0

    # White gutter between emblem and text: long run of low-ink columns after left blob
    col = ink.sum(axis=0)
    run = 0
    cut_x = w
    seen = False
    for i in range(w):
        if col[i] > 80:
            seen = True
        if seen and col[i] < 12:
            run += 1
        else:
            if run >= 20:
                cut_x = i - run + run // 2
                break
            run = 0

    ink_left = ink[:, : cut_x + 5]
    ys, xs = np.where(ink_left)
    if len(ys) == 0:
        print("Could not find emblem", file=sys.stderr)
        return 1

    pad = 12
    x1 = max(0, int(xs.min()) - pad)
    x2 = min(cut_x + 5, int(xs.max()) + pad + 1)
    y1 = max(0, int(ys.min()) - pad)
    y2 = min(h, int(ys.max()) + pad + 1)

    crop = im[y1:y2, x1:x2].copy()
    ch, cw = crop.shape[:2]

    # Square canvas, centered
    side = max(ch, cw)
    out = np.zeros((side, side, 4), dtype=np.uint8)
    out[..., 0] = BG[0]
    out[..., 1] = BG[1]
    out[..., 2] = BG[2]
    out[..., 3] = 255

    oy = (side - ch) // 2
    ox = (side - cw) // 2
    out[oy : oy + ch, ox : ox + cw] = crop

    # Knock out near-white pixels to solid brand background (clean edges)
    rgb2 = out[..., :3].astype(np.float32)
    d2 = np.linalg.norm(rgb2 - WHITE, axis=2)
    near_white = d2 < 35.0
    out[near_white, 0] = BG[0]
    out[near_white, 1] = BG[1]
    out[near_white, 2] = BG[2]
    out[near_white, 3] = 255

    pil = Image.fromarray(out).convert("RGB")
    pil = pil.resize((1024, 1024), Image.Resampling.LANCZOS)

    mobile_assets = root / "apps" / "mobile" / "assets"
    mobile_assets.mkdir(parents=True, exist_ok=True)
    for name in ("icon.png", "heart-logo.png"):
        pil.save(mobile_assets / name, "PNG", optimize=True)

    print(f"Wrote {mobile_assets/'icon.png'} (+ heart-logo.png) from {src.name}")
    print(f"  crop box x[{x1}:{x2}] y[{y1}:{y2}] gutter≈x{cut_x}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
