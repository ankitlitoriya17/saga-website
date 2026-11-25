#!/usr/bin/env python3
"""Render one date/slot-specific SPoT JPEG using the prepared Node content.

Campaign (feature-ad) posts use a dedicated layout with a mini To-Let poster whose QR opens the
campaign page, or, when the campaign names a `screen`, a real app screen in a phone frame.
"""
import json
import os
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
    "ivory": "#F4F1E8", "gold": "#E8CDA5", "muted": "#ADB4AB",
    "poster": "#795831", "ink": "#222626",
}
FONT_DIR = os.environ.get("SPOT_FONT_DIR", "/usr/share/fonts/truetype/dejavu/")


def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def fit_text(draw, line, max_size, width, bold=False, min_size=18):
    for size in range(max_size, min_size - 1, -1):
        f = font(size, bold)
        bounds = draw.textbbox((0, 0), line, font=f)
        if bounds[2] - bounds[0] <= width:
            return f
    raise ValueError("Artwork text is too long: " + line)


def shared_fit(draw, lines, max_size, width):
    """One font size for every line, so a two-line headline reads as one block."""
    return min((fit_text(draw, line, max_size, width, True) for line in lines), key=lambda f: f.size)


def centered(draw, text, center_x, y, f, fill):
    bounds = draw.textbbox((0, 0), text, font=f)
    draw.text((center_x - (bounds[2] - bounds[0]) / 2, y), text, fill=fill, font=f)


# Bottom-right call to action (replaces the old internal AM/PM serial number).
STORE_LABEL = "On Google Play"


def store_label(draw):
    f = font(28, True)
    draw.text((976 - draw.textlength(STORE_LABEL, font=f), 942), STORE_LABEL, fill=PALETTE["gold"], font=f)


def brand_row(canvas, draw, x, y, scale=1.0):
    icon = BRAND.resize((int(116 * scale), int(116 * scale)), Image.Resampling.LANCZOS)
    canvas.paste(icon, (x, y), icon)
    draw.text((x + int(140 * scale), y + int(8 * scale)), "SPoT", fill=PALETTE["ivory"], font=font(int(76 * scale), True))
    draw.text((x + int(140 * scale), y + int(93 * scale)), "EASY RENTAL SOLUTION", fill=PALETTE["gold"],
              font=font(int(24 * scale)))


def poster_mock(width):
    """A miniature To-Let poster. Its QR is real and opens the campaign landing page."""
    height = int(width * 297 / 210)
    poster = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(poster)
    pad = int(width * 0.06)
    band = int(height * 0.13)
    draw.rounded_rectangle((pad, pad, width - pad, pad + band), radius=int(width * 0.03), fill=PALETTE["poster"])
    centered(draw, "TO-LET", width / 2, pad + band * 0.12, fit_text(draw, "TO-LET", int(band * 0.72), width - 4 * pad, True, min_size=8), "white")
    line = "PROPERTY AVAILABLE FOR RENT"
    centered(draw, line, width / 2, pad + band + pad * 0.5, fit_text(draw, line, int(width * 0.06), width - 2 * pad, True, min_size=8), PALETTE["ink"])
    qr = Image.open(ROOT / "social/assets/qr-poster-page.png").convert("RGB")
    frame = int(width * 0.03)
    qr_size = int(width * 0.62) // qr.width * qr.width
    qr = qr.resize((qr_size, qr_size), Image.Resampling.NEAREST)
    qr_top = pad + band + int(pad * 2.2)
    left = (width - qr_size) // 2
    draw.rounded_rectangle((left - frame, qr_top - frame, left + qr_size + frame, qr_top + qr_size + frame),
                           radius=frame, fill=PALETTE["poster"])
    poster.paste(qr, (left, qr_top))
    cta = "SCAN TO VIEW PHOTOS & DETAILS"
    centered(draw, cta, width / 2, qr_top + qr_size + frame * 2.5, fit_text(draw, cta, int(width * 0.055), width - 2 * pad, True, min_size=8), PALETTE["ink"])
    centered(draw, "spot.apnasheher.com", width / 2, height - pad * 2.2, font(max(14, int(width * 0.045)), True), PALETTE["ink"])
    return poster


# Each theme has its own colours and real app screen, so the profile grid does not look like
# one post repeated. Screens are the website's demo screenshots (fictional data only).
THEMES = {
    "get-started":       {"bg": "#0F3B3A", "panel": "#185150", "text": "#F4F1E8", "accent": "#F2C46D", "muted": "#A9C6C2", "screen": "discover"},
    "list-property":     {"bg": "#F6EFE3", "panel": "#EADFCB", "text": "#1E2A24", "accent": "#A8571A", "muted": "#6B6457", "screen": "details"},
    "rent-reminders":    {"bg": "#1E2350", "panel": "#2B3170", "text": "#F4F1E8", "accent": "#FFB86B", "muted": "#B3B7DA", "screen": "dashboard"},
    "payment-tracking":  {"bg": "#13241B", "panel": "#1E3828", "text": "#F4F1E8", "accent": "#7BD389", "muted": "#A7BFAE", "screen": "rent"},
    "tenant-management": {"bg": "#E7F0F7", "panel": "#D3E3F0", "text": "#13253A", "accent": "#235FA3", "muted": "#566A80", "screen": "tenants"},
    "rent-receipts":     {"bg": "#2B1630", "panel": "#41224A", "text": "#F7EEF5", "accent": "#F0A6CA", "muted": "#C7AFC5", "screen": "rent"},
    "landlord-tips":     {"bg": "#1B211C", "panel": "#283029", "text": "#F4F1E8", "accent": "#E8CDA5", "muted": "#ADB4AB", "screen": "dashboard"},
}
LAYOUTS = ("phone-side", "big-tip", "phone-centre")


def rounded(image, radius):
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width - 1, image.height - 1), radius=radius, fill=255)
    out = image.convert("RGBA")
    out.putalpha(mask)
    return out


def phone(screen, width, visible_height):
    """A simple phone frame showing the top of a real app screen; it bleeds off the bottom."""
    shot = Image.open(ROOT / "resource/app/screens" / (screen + ".png")).convert("RGB")
    bezel = max(8, width // 28)
    inner = width - 2 * bezel
    shot = shot.resize((inner, int(shot.height * inner / shot.width)), Image.Resampling.LANCZOS)
    height = min(visible_height + 60, shot.height + bezel)  # never show an empty frame
    body = Image.new("RGB", (width, height), "#0B0D0C")
    body.paste(shot.crop((0, 0, inner, height - bezel)), (bezel, bezel))
    return rounded(body, width // 7)


def brand_small(canvas, draw, x, y, theme):
    icon = BRAND.resize((76, 76), Image.Resampling.LANCZOS)
    canvas.paste(icon, (x, y), icon)
    draw.text((x + 94, y + 4), "SPoT", fill=theme["text"], font=font(44, True))
    draw.text((x + 96, y + 54), "EASY RENTAL SOLUTION", fill=theme["accent"], font=font(18))


def label(draw, text, x, y, theme, anchor_right=False):
    f = font(28, True)
    if anchor_right:
        x -= draw.textlength(text, font=f)
    draw.text((x, y), text, fill=theme["accent"], font=f)


def render_rotation():
    theme = THEMES.get(DATA["slug"], THEMES["landlord-tips"])
    layout = LAYOUTS[(DATA["index"] // 7) % len(LAYOUTS)]
    canvas = Image.new("RGB", (1080, 1080), theme["bg"])
    draw = ImageDraw.Draw(canvas)
    headline, tip = DATA["headline"], DATA["subline"]

    if layout == "phone-side":
        draw.ellipse((640, 200, 1240, 800), fill=theme["panel"])
        shot = phone(theme["screen"], 390, 1080 - 360)
        canvas.paste(shot, (660, 360), shot)
        brand_small(canvas, draw, 72, 72, theme)
        f = shared_fit(draw, headline, 64, 560)
        for row, line in enumerate(headline):
            draw.text((72, 300 + row * int(f.size * 1.3)), line, fill=theme["text"], font=f)
        draw.rounded_rectangle((72, 560, 632, 720), radius=28, fill=theme["panel"])
        draw.text((104, 586), "TIP", fill=theme["accent"], font=font(24, True))
        draw.text((104, 630), tip, fill=theme["text"], font=fit_text(draw, tip, 38, 500, True))
        draw.text((72, 920), "spot.apnasheher.com", fill=theme["muted"], font=font(30))
        label(draw, STORE_LABEL, 72, 966, theme)
    elif layout == "big-tip":
        draw.ellipse((700, -220, 1300, 380), fill=theme["panel"])
        draw.ellipse((-260, 820, 260, 1340), fill=theme["panel"])
        brand_small(canvas, draw, 72, 72, theme)
        draw.rounded_rectangle((72, 330, 236, 380), radius=25, fill=theme["accent"])
        centered(draw, "TIP", 154, 336, font(30, True), theme["bg"])
        tip_font = fit_text(draw, tip, 92, 936, True)
        draw.text((72, 420), tip, fill=theme["accent"], font=tip_font)
        draw.rounded_rectangle((72, 590, 200, 598), radius=4, fill=theme["accent"])
        f = shared_fit(draw, headline, 76, 936)
        for row, line in enumerate(headline):
            draw.text((72, 650 + row * int(f.size * 1.3)), line, fill=theme["text"], font=f)
        draw.text((72, 960), "spot.apnasheher.com", fill=theme["muted"], font=font(30))
        label(draw, STORE_LABEL, 1008, 960, theme, anchor_right=True)
    else:  # phone-centre
        draw.ellipse((190, 470, 890, 1170), fill=theme["panel"])
        brand_small(canvas, draw, 72, 64, theme)
        label(draw, STORE_LABEL, 1008, 92, theme, anchor_right=True)
        f = shared_fit(draw, headline, 64, 936)
        for row, line in enumerate(headline):
            centered(draw, line, 540, 205 + row * int(f.size * 1.3), f, theme["text"])
        tip_font = fit_text(draw, tip, 36, 860)
        centered(draw, tip, 540, 205 + 2 * int(f.size * 1.3) + 22, tip_font, theme["accent"])
        shot = phone(theme["screen"], 360, 1080 - 480)
        canvas.paste(shot, (360, 500), shot)
    return canvas


def render_campaign_square():
    canvas = Image.new("RGB", (1080, 1080), PALETTE["dark"])
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((54, 52, 1026, 1026), radius=46, fill=PALETTE["surface"], outline="#343C34", width=3)
    draw.rounded_rectangle((98, 104, 982, 117), radius=7, fill=PALETTE["gold"])
    brand_row(canvas, draw, 104, 164)
    draw.rounded_rectangle((104, 330, 270, 378), radius=24, fill=PALETTE["gold"])
    centered(draw, "NEW", 187, 336, font(30, True), PALETTE["dark"])
    headline_font = shared_fit(draw, DATA["headline"], 60, 520)
    for row, line in enumerate(DATA["headline"]):
        draw.text((104, 420 + row * 86), line, fill=PALETTE["ivory"], font=headline_font)
    draw.rounded_rectangle((104, 640, 624, 760), radius=28, fill="#283029")
    draw.text((128, 682), DATA["subline"], fill=PALETTE["gold"], font=fit_text(draw, DATA["subline"], 32, 470))
    if DATA.get("screen"):
        if not re.fullmatch(r"[a-z-]{2,30}", DATA["screen"]):
            raise ValueError("Invalid campaign screen")
        shot = phone(DATA["screen"], 330, 590)  # ends above the store label
        canvas.paste(shot, (662, 250), shot)
    else:
        canvas.paste(poster_mock(300), (668, 300))
    page = re.sub(r"^https://", "", DATA["link"]).rstrip("/")
    draw.text((104, 939), page, fill=PALETTE["muted"], font=fit_text(draw, page, 31, 520))
    store_label(draw)
    return canvas


canvas = render_campaign_square() if DATA.get("campaign") else render_rotation()
destination = TARGET / FILE
canvas.save(destination, format="JPEG", quality=90, subsampling=0, optimize=True)
print("Prepared " + str(destination.relative_to(ROOT)))
