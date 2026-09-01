#!/usr/bin/env python3
"""Single Apple-style take: woman with Flux on phone, slow Ken Burns + UI scroll."""

from __future__ import annotations

import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BG_SRC = ROOT / "public/landing/walkthrough/lifestyle/hands-flux.jpg"
UI_SRC = ROOT / "public/landing/walkthrough/mobile/overview.jpg"
OUT_DIR = ROOT / "public/landing/walkthrough/film"
FRAMES = OUT_DIR / "frames-apple"
MP4 = OUT_DIR / "flux-apple-take.mp4"
WEBM = OUT_DIR / "flux-apple-take.webm"

W, H = 1920, 1080
FPS = 30
DURATION = 14.0
# phone screen on hands-flux.jpg (1536×1024), mapped after cover crop
PHONE_BOX_SRC = (508, 88, 950, 882)


def cover(im: Image.Image, tw: int, th: int) -> tuple[Image.Image, float, int, int]:
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th)), scale, left, top


def map_box(box: tuple[int, int, int, int], scale: float, left: int, top: int) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = box
    return (
        int(x0 * scale - left),
        int(y0 * scale - top),
        int(x1 * scale - left),
        int(y1 * scale - top),
    )


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    w, h = size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)
    return mask


def composite_ui(bg: Image.Image, ui: Image.Image, box: tuple[int, int, int, int], scroll: float) -> Image.Image:
    """Paste scrolling Flux UI into the phone screen."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    if bw <= 0 or bh <= 0:
        return bg

    tall = int(bh * 1.22)
    ui_scaled = ui.resize((bw, tall), Image.Resampling.LANCZOS)
    max_scroll = max(0, tall - bh)
    sy = int(max_scroll * scroll)
    patch = ui_scaled.crop((0, sy, bw, sy + bh))

    radius = max(28, bw // 14)
    mask = rounded_mask((bw, bh), radius)
    island_h = max(10, bh // 28)
    island_w = max(40, bw // 3)
    island = Image.new("L", (bw, bh), 255)
    ImageDraw.Draw(island).rounded_rectangle(
        ((bw - island_w) // 2, bh // 42, (bw + island_w) // 2, bh // 42 + island_h),
        radius=island_h // 2,
        fill=0,
    )
    mask = Image.composite(Image.new("L", (bw, bh), 0), mask, island)

    out = bg.copy()
    out.paste(patch, (x0, y0), mask)
    return out


def ken(im: Image.Image, t: float) -> Image.Image:
    ease = 1 - (1 - t) ** 3
    scale = 1.0 + ease * 0.13
    fx, fy = 0.58, 0.48
    sw, sh = im.size
    cw, ch = int(sw / scale), int(sh / scale)
    cx = int(fx * sw - cw / 2)
    cy = int(fy * sh - ch / 2)
    cx = max(0, min(sw - cw, cx))
    cy = max(0, min(sh - ch, cy))
    cropped = im.crop((cx, cy, cx + cw, cy + ch))
    return cropped.resize((sw, sh), Image.Resampling.LANCZOS)


def vignette(im: Image.Image, strength: float = 0.28) -> Image.Image:
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((-w * 0.15, -h * 0.2, w * 1.15, h * 1.25), fill=int(255 * (1 - strength)))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=min(w, h) // 5))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(im, dark, mask)


def encode(frames: Path, out: Path, codec_args: list[str]) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-framerate", str(FPS), "-i", str(frames / "frame_%05d.jpg"), *codec_args, str(out)],
        check=True,
    )


def main() -> None:
    if not BG_SRC.exists() or not UI_SRC.exists():
        raise SystemExit("Missing source assets (hands-flux.jpg / mobile/overview.jpg)")

    bg_raw = Image.open(BG_SRC).convert("RGB")
    ui = Image.open(UI_SRC).convert("RGB")
    bg_base, scale, left, top = cover(bg_raw, W, H)
    phone_box = map_box(PHONE_BOX_SRC, scale, left, top)

    FRAMES.mkdir(parents=True, exist_ok=True)
    for old in FRAMES.glob("*.jpg"):
        old.unlink()

    total = int(DURATION * FPS)
    for i in range(total):
        t = i / max(1, total - 1)
        scroll = 0.08 + 0.55 * (1 - math.cos(t * math.pi)) / 2
        frame = composite_ui(bg_base, ui, phone_box, scroll)
        frame = ken(frame, t)
        frame = vignette(frame, 0.22 + 0.04 * math.sin(t * math.pi))
        frame = ImageEnhance.Contrast(frame).enhance(1.02 + 0.02 * t)
        frame.save(FRAMES / f"frame_{i:05d}.jpg", quality=92, optimize=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    encode(
        FRAMES,
        MP4,
        ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow", "-movflags", "+faststart"],
    )
    encode(
        FRAMES,
        WEBM,
        ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-row-mt", "1"],
    )

    manifest = OUT_DIR / "manifest.txt"
    manifest.write_text(
        f"file=flux-apple-take\nframes={total}\nfps={FPS}\nduration={DURATION:.2f}\nstyle=apple-single-take\n"
    )
    print(f"Wrote {MP4} ({total} frames, {DURATION}s)")


if __name__ == "__main__":
    main()
