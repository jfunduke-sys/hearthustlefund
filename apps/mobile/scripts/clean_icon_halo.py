#!/usr/bin/env python3
"""
Remove faint light fringe / anti-alias halo around the shield on app icons.
Writes 1024x1024 PNG; updates icon.png and heart-logo.png in assets/.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation

BG = np.array([26, 26, 46], dtype=np.float32)


def composite_rgba(im: Image.Image) -> np.ndarray:
    im = im.convert("RGBA")
    arr = np.array(im, dtype=np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4] / 255.0
    comp = rgb * a + BG * (1.0 - a)
    return np.clip(comp, 0, 255).astype(np.uint8)


def clean_halo(rgb: np.ndarray) -> np.ndarray:
    r = rgb[..., 0].astype(np.float32)
    g = rgb[..., 1].astype(np.float32)
    b = rgb[..., 2].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    lum_bg = float(0.299 * BG[0] + 0.587 * BG[1] + 0.114 * BG[2])
    dist_bg = np.sqrt(np.sum((rgb.astype(np.float32) - BG) ** 2, axis=2))
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)

    bg_core = dist_bg < 16.0
    fg = ~bg_core
    neigh_bg = binary_dilation(bg_core, structure=np.ones((3, 3), dtype=bool), iterations=3)
    edge_fg = fg & neigh_bg

    heartish = (r > 95.0) & (r > b + 25.0) & (g < r - 10.0)
    # True inner shield blues (keep): saturated or deep blue
    inner_blue = (b > 115.0) & (b > r + 5.0) & (sat > 32.0)
    inner_blue |= (b > 95.0) & (b > r + 18.0) & (sat > 28.0)

    # Pass 1: grey / desaturated mist on outer edge
    haloish = (sat < 52.0) & (lum > lum_bg + 6.0) & (lum < 195.0)
    remove1 = edge_fg & haloish & ~heartish & ~inner_blue

    neigh_rm = binary_dilation(remove1, structure=np.ones((3, 3), dtype=bool), iterations=3)
    remove2 = neigh_rm & haloish & ~heartish & ~inner_blue & (dist_bg < 58.0)

    # Pass 2: light grey-blue ring (low sat, moderate lum) near background
    near_bg = binary_dilation(bg_core, structure=np.ones((3, 3), dtype=bool), iterations=6)
    mist = (
        near_bg
        & (dist_bg < 105.0)
        & (sat < 44.0)
        & (lum > 58.0)
        & (lum < 125.0)
        & (b > r - 12.0)
        & ~heartish
        & ~inner_blue
    )

    out = rgb.copy()
    mask = remove1 | remove2 | mist
    out[mask] = BG.astype(np.uint8)

    # Pass 3: residual light pixels hugging the background silhouette
    dist_bg2 = np.sqrt(np.sum((out.astype(np.float32) - BG) ** 2, axis=2))
    bg2 = dist_bg2 < 16.0
    near2 = binary_dilation(bg2, structure=np.ones((3, 3), dtype=bool), iterations=5)
    r2, g2, b2 = out[..., 0].astype(np.float32), out[..., 1].astype(np.float32), out[..., 2].astype(np.float32)
    lum2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2
    sat2 = np.maximum(np.maximum(r2, g2), b2) - np.minimum(np.minimum(r2, g2), b2)
    inner2 = (b2 > 115.0) & (b2 > r2 + 5.0) & (sat2 > 32.0)
    inner2 |= (b2 > 95.0) & (b2 > r2 + 18.0) & (sat2 > 28.0)
    heart2 = (r2 > 95.0) & (r2 > b2 + 25.0) & (g2 < r2 - 10.0)
    mist2 = (
        near2
        & (dist_bg2 < 100.0)
        & (sat2 < 42.0)
        & (lum2 > 72.0)
        & (lum2 < 118.0)
        & ~heart2
        & ~inner2
    )
    out[mist2] = BG.astype(np.uint8)
    return out


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    icon = root / "assets" / "icon.png"
    if len(sys.argv) >= 2:
        icon = Path(sys.argv[1])
    if not icon.exists():
        print(f"Missing: {icon}", file=sys.stderr)
        return 1

    rgb = composite_rgba(Image.open(icon))
    out = clean_halo(rgb)

    out_path = root / "assets" / "icon.png"
    if len(sys.argv) >= 3:
        out_path = Path(sys.argv[2])

    img = Image.fromarray(out.astype(np.uint8))
    img.save(out_path, "PNG", optimize=True)

    hl = root / "assets" / "heart-logo.png"
    img.save(hl, "PNG", optimize=True)

    changed = int(np.sum(np.any(rgb != out, axis=-1)))
    print(f"Wrote {out_path} (+ heart-logo.png); pixels changed from source: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
