#!/usr/bin/env python3
"""Deterministic 1080x1080 JPEG creatives; no external APIs or personal data."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
POSTS = json.loads((ROOT / "social/posts.json").read_text(encoding="utf-8"))
TARGET = ROOT / "social/images"
TARGET.mkdir(parents=True, exist_ok=True)
BRAND = Image.open(ROOT / "resource/app/brand.png").convert("RGBA")
PALETTE = {"dark": "#101312", "surface": "#1B211C", "ivory": "#F4F1E8",
           "gold": "#E8CDA5", "muted": "#ADB4AB"}

def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    path = "/usr/share/fonts/truetype/dejavu/" + name
    return ImageFont.truetype(path, size)

for index, post in enumerate(POSTS):
    canvas = Image.new("RGB", (1080, 1080), PALETTE["dark"])
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((54, 52, 1026, 1026), radius=46, fill=PALETTE["surface"],
                           outline="#343C34", width=3)
    draw.rounded_rectangle((98, 104, 982, 117), radius=7, fill=PALETTE["gold"])
    icon = BRAND.resize((116, 116), Image.Resampling.LANCZOS)
    canvas.paste(icon, (104, 164), icon)
    draw.text((244, 172), "SPoT", fill=PALETTE["ivory"], font=font(76, True))
    draw.text((244, 257), "EASY RENTAL SOLUTION", fill=PALETTE["gold"], font=font(24))
    for row, line in enumerate(post["headline"]):
        if len(line) > 24:
            raise ValueError("Headline too long for artwork: " + line)
        draw.text((104, 435 + row * 110), line, fill=PALETTE["ivory"], font=font(72, True))
    draw.rounded_rectangle((104, 758, 976, 890), radius=28, fill="#283029")
    draw.text((132, 791), post["subline"], fill=PALETTE["gold"], font=font(32))
    draw.text((104, 944), "spot.apnasheher.com", fill=PALETTE["muted"], font=font(31))
    draw.text((860, 945), f"{index + 1:02}/07", fill=PALETTE["muted"], font=font(25))
    file = TARGET / (post["slug"] + ".jpg")
    canvas.save(file, format="JPEG", quality=90, subsampling=0, optimize=True)
    print(file.relative_to(ROOT))
