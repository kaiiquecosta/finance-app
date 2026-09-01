#!/usr/bin/env python3
"""Single Apple-style take: woman with Flux on phone, slow Ken Burns zoom."""

from __future__ import annotations

import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/landing/walkthrough/lifestyle/hands-flux.jpg"
OUT_DIR = ROOT / "public/landing/walkthrough/film"
FRAMES = OUT_DIR / "frames-apple"
W, H = 1920, 1080
FPS = 30
DURATION = 14.0


def cover(im: Image.Image, tw: int, th: int) -> Image.Image:
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def ken(im: Image.Image, t: float) -> Image.Image:
    """Slow push-in toward the phone — Apple product film feel."""
    # t in [0, 1]
    ease = 1 - (1 - t) ** 3
    scale = 1.0 + ease * 0.11
    # focus slightly right of center (phone)
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


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source image: {SRC}")

    base = Image.open(SRC).convert("RGB")
    base = cover(base, W, H)

    FRAMES.mkdir(parents=True, exist_ok=True)
    for old in FRAMES.glob("*.jpg"):
        old.unlink()

    total = int(DURATION * FPS)
    for i in range(total):
        t = i / max(1, total - 1)
        frame = ken(base, t)
        frame = vignette(frame, 0.22 + 0.04 * math.sin(t * math.pi))
        frame = ImageEnhance.Contrast(frame).enhance(1.02 + 0.02 * t)
        frame.save(FRAMES / f"frame_{i:05d}.jpg", quality=92, optimize=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    mp4 = OUT_DIR / "flux-filme.mp4"
    webm = OUT_DIR / "flux-filme.webm"

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-framerate",
            str(FPS),
            "-i",
            str(FRAMES / "frame_%05d.jpg"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "18",
            "-preset",
            "slow",
            "-movflags",
            "+faststart",
            str(mp4),
        ],
        check=True,
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-framerate",
            str(FPS),
            "-i",
            str(FRAMES / "frame_%05d.jpg"),
            "-c:v",
            "libvpx-vp9",
            "-b:v",
            "0",
            "-crf",
            "32",
            "-row-mt",
            "1",
            str(webm),
        ],
        check=True,
    )

    manifest = OUT_DIR / "manifest.txt"
    manifest.write_text(f"frames={total}\nfps={FPS}\nduration={DURATION:.2f}\nstyle=apple-single-take\n")

    print(f"Wrote {mp4} ({total} frames, {DURATION}s)")


if __name__ == "__main__":
    main()
