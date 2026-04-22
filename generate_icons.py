#!/usr/bin/env python3
"""
Generate PWA icons from AppThumbnail.png using Pillow.
"""

import sys
import os

try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image

SRC = "/home/ubuntu/workspace/app/src/frontend/public/assets/AppThumbnail.png"
OUT_DIR = "/home/ubuntu/workspace/app/src/frontend/public/assets"

# Open source image
img = Image.open(SRC).convert("RGBA")
print(f"Source image: {img.size[0]}x{img.size[1]} mode={img.mode}")

# --- Icon 1: icon-192x192.png ---
icon_192 = img.resize((192, 192), Image.LANCZOS)
out_192 = os.path.join(OUT_DIR, "icon-192x192.png")
icon_192.save(out_192, "PNG", optimize=True)
size_192 = os.path.getsize(out_192)
print(f"icon-192x192.png: {size_192} bytes")
assert size_192 > 1024, "icon-192x192.png is too small"

# --- Icon 2: icon-512x512.png ---
icon_512 = img.resize((512, 512), Image.LANCZOS)
out_512 = os.path.join(OUT_DIR, "icon-512x512.png")
icon_512.save(out_512, "PNG", optimize=True)
size_512 = os.path.getsize(out_512)
print(f"icon-512x512.png: {size_512} bytes")
assert size_512 > 1024, "icon-512x512.png is too small"

# --- Icon 3: icon-512x512-maskable.png ---
from collections import Counter

def get_bg_color(image, sample_size=10):
    w, h = image.size
    pixels = []
    for x in range(sample_size):
        for y in range(sample_size):
            pixels.append(image.getpixel((x, y)))
    for x in range(w - sample_size, w):
        for y in range(h - sample_size, h):
            pixels.append(image.getpixel((x, y)))
    for x in range(w - sample_size, w):
        for y in range(sample_size):
            pixels.append(image.getpixel((x, y)))
    for x in range(sample_size):
        for y in range(h - sample_size, h):
            pixels.append(image.getpixel((x, y)))
    opaque = [(r, g, b) for r, g, b, a in pixels if a > 128]
    if opaque:
        counter = Counter(opaque)
        return counter.most_common(1)[0][0]
    return (0, 98, 170)

bg_rgb = get_bg_color(img)
print(f"Detected background color: rgb{bg_rgb}")

canvas = Image.new("RGBA", (512, 512), (*bg_rgb, 255))
tug_size = int(512 * 0.60)
tug = img.resize((tug_size, tug_size), Image.LANCZOS)
offset_x = (512 - tug_size) // 2
offset_y = (512 - tug_size) // 2
canvas.paste(tug, (offset_x, offset_y), tug)

out_maskable = os.path.join(OUT_DIR, "icon-512x512-maskable.png")
canvas.save(out_maskable, "PNG", optimize=True)
size_maskable = os.path.getsize(out_maskable)
print(f"icon-512x512-maskable.png: {size_maskable} bytes")
assert size_maskable > 1024, "icon-512x512-maskable.png is too small"

print("\nAll icons generated successfully!")
print(f"  icon-192x192.png         : {size_192:,} bytes")
print(f"  icon-512x512.png         : {size_512:,} bytes")
print(f"  icon-512x512-maskable.png: {size_maskable:,} bytes")
