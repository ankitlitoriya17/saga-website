#!/usr/bin/env python3
"""Render one date/slot-specific SPoT JPEG using the prepared Node content."""
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "social/.prepared.json").read_text(encoding="utf-8"))
FILE = DATA["filename"]
if not re.fullmatch(r"\d{4}-\d{2}-\d{2}-(morning|evening)\.jpg", FILE):
    raise ValueError("Invalid generated creative path")

TARGET = ROOT / "social/images"
TARGET.mkdir(parents=True, exist_ok=True)
BRAND = Image.open(ROOT / "resource/app/brand.png").convert("RGBA")
PALETTE = {
    "dark": "#101312", "surface": "#1B211C",
    "ivory": "#F4F1E8", "gold": "#E8CDA5", "muted": "#ADB4AB"
}

def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/" + name, size)

def fit_text(draw, line, max_size, width, bold=False):
    for size in range(max_size, 17, -1):
        f = font(size, bold)
        bounds = draw.textbbox((0, 0), line, font=f)
        if bounds[2] - bounds[0] <= width:
            return f
    raise ValueError("Artwork text is too long: " + line)

canvas = Image.new("RGB", (1080, 1080), PALETTE["dark"])
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((54, 52, 1026, 1026), radius=46,
                       fill=PALETTE["surface"], outline="#343C34", width=3)
draw.rounded_rectangle((98, 104, 982, 117), radius=7, fill=PALETTE["gold"])
icon = BRAND.resize((116, 116), Image.Resampling.LANCZOS)
canvas.paste(icon, (104, 164), icon)
draw.text((244, 172), "SPoT", fill=PALETTE["ivory"], font=font(76, True))
draw.text((244, 257), "EASY RENTAL SOLUTION", fill=PALETTE["gold"], font=font(24))

for row, line in enumerate(DATA["headline"]):
    draw.text((104, 416 + row * 107), line, fill=PALETTE["ivory"],
              font=fit_text(draw, line, 72, 868, True))

draw.rounded_rectangle((104, 741, 976, 884), radius=28, fill="#283029")
draw.text((132, 775), DATA["subline"], fill=PALETTE["gold"],
          font=fit_text(draw, DATA["subline"], 36, 815))
draw.text((104, 939), "spot.apnasheher.com", fill=PALETTE["muted"], font=font(31))

# Identity changes for every slot: distinct creative even when a topic recurs.
label = "AM" if DATA["slot"] == "morning" else "PM"
identifier = f"{label}  {DATA['index'] + 1:04d}"
draw.text((760, 942), identifier, fill=PALETTE["gold"],
          font=fit_text(draw, identifier, 28, 250, True))
destination = TARGET / FILE
canvas.save(destination, format="JPEG", quality=90, subsampling=0, optimize=True)
print("Prepared " + str(destination.relative_to(ROOT)))
