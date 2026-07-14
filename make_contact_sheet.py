"""
make_contact_sheet.py — AI Face Style Transformation
=====================================================
Renders all 16 art styles as OpenCV filter approximations onto one
contact-sheet image so you can preview every look without running the
full FLUX.2 pipeline.

Usage:
    python make_contact_sheet.py                   # synthetic demo scene
    python make_contact_sheet.py cam               # grab one webcam frame
    python make_contact_sheet.py path/to/photo.jpg # your own photo

Writes  effects_contact_sheet.png  next to this script.

Requirements: opencv-python, numpy  (already in backend/requirements.txt)
"""

import json
import os
import sys

import cv2
import numpy as np

# ── Paths ────────────────────────────────────────────────────────────────────
HERE        = os.path.dirname(os.path.abspath(__file__))
PROMPTS_JSON = os.path.join(HERE, "backend", "services", "style_prompts.json")
OUT_FILE    = os.path.join(HERE, "effects_contact_sheet.png")

TILE_W, TILE_H = 320, 320   # each style tile
COLS           = 4           # 4 columns → 4 rows for 16 styles
LABEL_H        = 36
PAD            = 6
BG_COLOR       = (18, 18, 24)


# ── Source image helpers ──────────────────────────────────────────────────────

def demo_scene(w: int = 640, h: int = 480) -> np.ndarray:
    """Synthetic gradient + shaded sphere — gives every filter something to work with."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = (xx / w * 0.6 + yy / h * 0.4)[..., None]
    bg = np.array([110, 85, 65]) * (1 - t) + np.array([205, 185, 235]) * t
    img = bg.astype(np.uint8)

    cx, cy, r = w * 0.5, h * 0.55, min(w, h) * 0.33
    inside = ((xx - cx) ** 2 + (yy - cy) ** 2) < r ** 2
    lx, ly = cx - r * 0.45, cy - r * 0.5
    shade = np.clip(1.0 - np.sqrt((xx - lx) ** 2 + (yy - ly) ** 2) / (r * 1.7), 0, 1)
    for c, k in enumerate((0.92, 0.96, 1.0)):
        ch = img[..., c].astype(np.float32)
        ch[inside] = (shade * 255 * k)[inside]
        img[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    return cv2.GaussianBlur(img, (0, 0), 0.6)


def get_source(arg: str | None) -> np.ndarray:
    if arg == "cam":
        cap = cv2.VideoCapture(0)
        frame = None
        for _ in range(10):
            ok, f = cap.read()
            if ok:
                frame = f
        cap.release()
        if frame is not None:
            return cv2.flip(frame, 1)
        print("Webcam unavailable — using demo scene.")
    elif arg:
        img = cv2.imread(arg)
        if img is not None:
            return img
        print(f"Could not read '{arg}' — using demo scene.")
    return demo_scene()


# ── Per-style OpenCV filter approximations ────────────────────────────────────

def _clamp(img: np.ndarray) -> np.ndarray:
    return np.clip(img, 0, 255).astype(np.uint8)


def fx_anime(img: np.ndarray) -> np.ndarray:
    """Cel-shading: bilateral smooth + edge overlay."""
    smooth = cv2.bilateralFilter(img, 9, 75, 75)
    gray   = cv2.cvtColor(smooth, cv2.COLOR_BGR2GRAY)
    edges  = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                   cv2.THRESH_BINARY, 9, 5)
    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    result = cv2.bitwise_and(smooth, edges_bgr)
    # Boost saturation
    hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.6, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def fx_van_gogh(img: np.ndarray) -> np.ndarray:
    """Swirling impasto: stylize filter + warm hue shift."""
    stylized = cv2.stylization(img, sigma_s=60, sigma_r=0.45)
    hsv = cv2.cvtColor(stylized, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 0] = (hsv[..., 0] + 15) % 180   # warm hue shift
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.4, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def fx_neon(img: np.ndarray) -> np.ndarray:
    """Dark background + glowing edge colours."""
    dark = (img.astype(np.float32) * 0.25).astype(np.uint8)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 40, 120)
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=2)
    glow = cv2.GaussianBlur(edges, (0, 0), 3)
    neon = dark.copy()
    neon[..., 0] = np.clip(dark[..., 0] + glow * 0.9, 0, 255)   # cyan
    neon[..., 2] = np.clip(dark[..., 2] + glow * 0.7, 0, 255)   # magenta
    return neon.astype(np.uint8)


def fx_pop_art(img: np.ndarray) -> np.ndarray:
    """Posterise + high-contrast flat colours."""
    posterised = (img // 64 * 64).astype(np.uint8)
    hsv = cv2.cvtColor(posterised, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 2.5, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * 1.3, 0, 255)
    result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    gray   = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
    outline = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
    return cv2.bitwise_and(result, outline)


def fx_graffiti(img: np.ndarray) -> np.ndarray:
    """High-saturation spray-paint look."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 0] = (hsv[..., 0] + 30) % 180
    hsv[..., 1] = np.clip(hsv[..., 1] * 2.2, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * 1.1, 0, 255)
    result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    noise  = np.random.randint(-18, 18, result.shape, dtype=np.int16)
    return _clamp(result.astype(np.int16) + noise)


def fx_watercolor(img: np.ndarray) -> np.ndarray:
    """Soft blurred washes."""
    return cv2.stylization(img, sigma_s=40, sigma_r=0.6)


def fx_pencil_sketch(img: np.ndarray) -> np.ndarray:
    """Graphite sketch — grayscale pencil lines."""
    gray, _ = cv2.pencilSketch(img, sigma_s=60, sigma_r=0.07, shade_factor=0.05)
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)


def fx_cyberpunk(img: np.ndarray) -> np.ndarray:
    """Dark + electric blue/pink tint."""
    dark = (img.astype(np.float32) * 0.4).astype(np.uint8)
    tint = dark.copy().astype(np.float32)
    tint[..., 0] = np.clip(tint[..., 0] * 1.8, 0, 255)   # blue
    tint[..., 2] = np.clip(tint[..., 2] * 1.5, 0, 255)   # red → pink
    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 30, 100)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8))
    glow  = cv2.GaussianBlur(edges, (0, 0), 4).astype(np.float32)
    tint[..., 0] = np.clip(tint[..., 0] + glow * 0.8, 0, 255)
    return tint.astype(np.uint8)


def fx_oil_painting(img: np.ndarray) -> np.ndarray:
    """Rich warm canvas look."""
    result = cv2.stylization(img, sigma_s=80, sigma_r=0.35)
    warm = result.astype(np.float32)
    warm[..., 2] = np.clip(warm[..., 2] * 1.15, 0, 255)   # warm red
    warm[..., 1] = np.clip(warm[..., 1] * 1.05, 0, 255)
    warm[..., 0] = np.clip(warm[..., 0] * 0.85, 0, 255)   # reduce blue
    return warm.astype(np.uint8)


def fx_comic_book(img: np.ndarray) -> np.ndarray:
    """Bold ink outlines + flat colours."""
    smooth = cv2.bilateralFilter(img, 7, 50, 50)
    gray   = cv2.cvtColor(smooth, cv2.COLOR_BGR2GRAY)
    edges  = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                   cv2.THRESH_BINARY, 7, 4)
    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    hsv = cv2.cvtColor(smooth, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 2.0, 0, 255)
    vivid = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    return cv2.bitwise_and(vivid, edges_bgr)


def fx_fantasy(img: np.ndarray) -> np.ndarray:
    """Jewel tones + magical glow."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 0] = (hsv[..., 0] + 120) % 180   # shift to purple/teal
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.8, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * 1.2, 0, 255)
    result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    glow   = cv2.GaussianBlur(result, (0, 0), 8)
    return _clamp(cv2.addWeighted(result, 0.7, glow, 0.3, 0))


def fx_clay_art(img: np.ndarray) -> np.ndarray:
    """Smooth matte pastel clay."""
    smooth = cv2.bilateralFilter(img, 15, 80, 80)
    pastel = smooth.astype(np.float32)
    pastel = pastel * 0.6 + 100   # lift shadows → matte pastel
    hsv = cv2.cvtColor(_clamp(pastel), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 0.7, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def fx_pixel_art(img: np.ndarray) -> np.ndarray:
    """Retro pixel blocks via downscale + upscale."""
    small = cv2.resize(img, (40, 40), interpolation=cv2.INTER_LINEAR)
    small = (small // 32 * 32).astype(np.uint8)   # posterise to ~8 colours
    return cv2.resize(small, (img.shape[1], img.shape[0]),
                      interpolation=cv2.INTER_NEAREST)


def fx_3d_cartoon(img: np.ndarray) -> np.ndarray:
    """Smooth Pixar-style with soft shadows."""
    smooth = cv2.bilateralFilter(img, 11, 90, 90)
    hsv = cv2.cvtColor(smooth, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.3, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * 1.1, 0, 255)
    result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    return cv2.GaussianBlur(result, (3, 3), 0)


def fx_digital_painting(img: np.ndarray) -> np.ndarray:
    """High-detail cinematic concept art."""
    detail = cv2.detailEnhance(img, sigma_s=10, sigma_r=0.15)
    hsv = cv2.cvtColor(detail, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.4, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * 1.1, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def fx_low_poly(img: np.ndarray) -> np.ndarray:
    """Geometric polygon facets via heavy blur + posterise."""
    blurred = cv2.GaussianBlur(img, (0, 0), 12)
    return (blurred // 48 * 48).astype(np.uint8)


# ── Style → filter map (same order as style_prompts.json) ────────────────────

STYLE_FILTERS = {
    "Anime":            fx_anime,
    "Van Gogh":         fx_van_gogh,
    "Neon":             fx_neon,
    "Pop Art":          fx_pop_art,
    "Graffiti":         fx_graffiti,
    "Watercolor":       fx_watercolor,
    "Pencil Sketch":    fx_pencil_sketch,
    "Cyberpunk":        fx_cyberpunk,
    "Oil Painting":     fx_oil_painting,
    "Comic Book":       fx_comic_book,
    "Fantasy":          fx_fantasy,
    "Clay Art":         fx_clay_art,
    "Pixel Art":        fx_pixel_art,
    "3D Cartoon":       fx_3d_cartoon,
    "Digital Painting": fx_digital_painting,
    "Low Poly Art":     fx_low_poly,
}


# ── Label helper ──────────────────────────────────────────────────────────────

def add_label(tile: np.ndarray, text: str, color: tuple) -> np.ndarray:
    cv2.rectangle(tile, (0, 0), (tile.shape[1], LABEL_H), (10, 10, 14), -1)
    cv2.putText(tile, text, (10, LABEL_H - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.62, color, 2, cv2.LINE_AA)
    return tile


# ── Label colours per style ───────────────────────────────────────────────────

LABEL_COLORS = {
    "Anime":            (255, 182, 193),
    "Van Gogh":         (100, 149, 237),
    "Neon":             (255,  50, 220),
    "Pop Art":          (255,  80,  80),
    "Graffiti":         ( 80, 220, 100),
    "Watercolor":       (135, 206, 250),
    "Pencil Sketch":    (200, 200, 200),
    "Cyberpunk":        ( 50, 220, 255),
    "Oil Painting":     (205, 133,  63),
    "Comic Book":       (255, 215,   0),
    "Fantasy":          (186,  85, 211),
    "Clay Art":         (210, 180, 140),
    "Pixel Art":        (124, 252,   0),
    "3D Cartoon":       (255, 165,   0),
    "Digital Painting": (147, 112, 219),
    "Low Poly Art":     ( 64, 224, 208),
}


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    src = get_source(arg)

    # Load style names from the project's style_prompts.json
    if os.path.exists(PROMPTS_JSON):
        with open(PROMPTS_JSON, encoding="utf-8") as f:
            style_names = list(json.load(f).keys())
        print(f"Loaded {len(style_names)} styles from {PROMPTS_JSON}")
    else:
        style_names = list(STYLE_FILTERS.keys())
        print("style_prompts.json not found — using built-in style list.")

    # Build tiles: original + all 16 styles
    src_sq = cv2.resize(src, (TILE_W, TILE_H))
    tiles  = [add_label(src_sq.copy(), "Original", (220, 220, 220))]

    for name in style_names:
        fn = STYLE_FILTERS.get(name)
        if fn is None:
            print(f"  [skip] No filter for '{name}'")
            continue
        try:
            result = fn(cv2.resize(src, (TILE_W, TILE_H)))
            result = cv2.resize(result, (TILE_W, TILE_H))
            color  = LABEL_COLORS.get(name, (255, 255, 255))
            tiles.append(add_label(result, name, color))
            print(f"  ✓ {name}")
        except Exception as exc:
            print(f"  ✗ {name}: {exc}")
            blank = np.full((TILE_H, TILE_W, 3), 40, np.uint8)
            tiles.append(add_label(blank, f"{name} (error)", (100, 100, 100)))

    # Arrange into a COLS-column grid
    rows = []
    for r in range(0, len(tiles), COLS):
        row_tiles = tiles[r:r + COLS]
        # Pad last row if needed
        while len(row_tiles) < COLS:
            row_tiles.append(np.full((TILE_H, TILE_W, 3), *[BG_COLOR], dtype=np.uint8))
        row_img = np.hstack([
            np.hstack([t, np.full((TILE_H, PAD, 3), BG_COLOR, np.uint8)])
            for t in row_tiles
        ])
        rows.append(row_img)
        rows.append(np.full((PAD, row_img.shape[1], 3), BG_COLOR, np.uint8))

    grid = np.vstack(rows)

    cv2.imwrite(OUT_FILE, grid)
    n_styles = len(tiles) - 1
    print(f"\nWrote {OUT_FILE}")
    print(f"Grid: {grid.shape[1]}×{grid.shape[0]}px  |  1 original + {n_styles} styles")


if __name__ == "__main__":
    main()
