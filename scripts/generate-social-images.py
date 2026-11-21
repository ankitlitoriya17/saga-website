#!/usr/bin/env python3
"""Render one date/slot-specific SPoT JPEG using the prepared Node content.

Campaign (feature-ad) posts use a dedicated layout with a mini To-Let poster whose QR opens the
campaign page, and also get a 1080x1920 YouTube Short rendered with ffmpeg.
"""
import json
import os
import re
import shutil
import subprocess
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


def identifier_label():
    label = "AM" if DATA["slot"] == "morning" else "PM"
    return f"{label}  {DATA['index'] + 1:04d}"


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


def render_rotation():
    canvas = Image.new("RGB", (1080, 1080), PALETTE["dark"])
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((54, 52, 1026, 1026), radius=46,
                           fill=PALETTE["surface"], outline="#343C34", width=3)
    draw.rounded_rectangle((98, 104, 982, 117), radius=7, fill=PALETTE["gold"])
    brand_row(canvas, draw, 104, 164)
    for row, line in enumerate(DATA["headline"]):
        draw.text((104, 416 + row * 107), line, fill=PALETTE["ivory"],
                  font=fit_text(draw, line, 72, 868, True))
    draw.rounded_rectangle((104, 741, 976, 884), radius=28, fill="#283029")
    draw.text((132, 775), DATA["subline"], fill=PALETTE["gold"],
              font=fit_text(draw, DATA["subline"], 36, 815))
    draw.text((104, 939), "spot.apnasheher.com", fill=PALETTE["muted"], font=font(31))
    # Identity changes for every slot: distinct creative even when a topic recurs.
    identifier = identifier_label()
    draw.text((760, 942), identifier, fill=PALETTE["gold"],
              font=fit_text(draw, identifier, 28, 250, True))
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
    poster = poster_mock(300)
    canvas.paste(poster, (668, 300))
    draw.text((104, 939), "spot.apnasheher.com/qr-poster", fill=PALETTE["muted"], font=font(31))
    identifier = identifier_label()
    draw.text((780, 942), identifier, fill=PALETTE["gold"], font=fit_text(draw, identifier, 28, 220, True))
    return canvas


def render_short_frames():
    """Three 1080x1920 frames: the promise, the poster, the call to action."""
    frames = []
    for step in range(3):
        canvas = Image.new("RGB", (1080, 1920), PALETTE["dark"])
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle((54, 60, 1026, 1860), radius=56, fill=PALETTE["surface"], outline="#343C34", width=3)
        brand_row(canvas, draw, 110, 140)
        if step == 0:
            draw.rounded_rectangle((110, 560, 300, 620), radius=30, fill=PALETTE["gold"])
            centered(draw, "NEW", 205, 568, font(36, True), PALETTE["dark"])
            headline_font = shared_fit(draw, DATA["headline"], 84, 860)
            for row, line in enumerate(DATA["headline"]):
                draw.text((110, 700 + row * 120), line, fill=PALETTE["ivory"], font=headline_font)
            draw.text((110, 1020), DATA["subline"], fill=PALETTE["gold"], font=fit_text(draw, DATA["subline"], 46, 860))
        elif step == 1:
            poster = poster_mock(640)
            canvas.paste(poster, ((1080 - poster.width) // 2, 400))
            centered(draw, "Scan → listing opens on SPoT", 540, 1380, fit_text(draw, "Scan → listing opens on SPoT", 52, 860, True), PALETTE["ivory"])
        else:
            lines = ["SPoT app → Property", "→ Generate QR poster"]
            for row, line in enumerate(lines):
                draw.text((110, 640 + row * 110), line, fill=PALETTE["ivory"], font=fit_text(draw, line, 76, 860, True))
            draw.text((110, 920), "Printed board: ₹999, cash on delivery", fill=PALETTE["gold"],
                      font=fit_text(draw, "Printed board: ₹999, cash on delivery", 44, 860))
            draw.text((110, 1040), "Update SPoT on Google Play", fill=PALETTE["muted"], font=font(40))
        draw.text((110, 1740), "spot.apnasheher.com/qr-poster", fill=PALETTE["muted"], font=font(38))
        frames.append(canvas)
    return frames


def render_short(video_name):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}-(morning|evening)\.mp4", video_name):
        raise ValueError("Invalid video path")
    work = ROOT / "social/.video"
    work.mkdir(parents=True, exist_ok=True)
    paths = []
    for index, frame in enumerate(render_short_frames()):
        path = work / f"frame-{index}.png"
        frame.save(path)
        paths.append(path)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        if os.environ.get("CI"):
            raise RuntimeError("ffmpeg is required to render the YouTube Short")
        print("ffmpeg not found: Short frames written, video skipped (local preview)")
        return
    output = work / video_name
    command = [ffmpeg, "-y", "-loglevel", "error"]
    for path in paths:
        command += ["-loop", "1", "-t", "4", "-i", str(path)]
    command += ["-f", "lavfi", "-t", "11", "-i", "anullsrc=r=44100:cl=stereo",
                "-filter_complex",
                "[0][1]xfade=transition=fade:duration=0.5:offset=3.5[a];"
                "[a][2]xfade=transition=fade:duration=0.5:offset=7,format=yuv420p[v]",
                "-map", "[v]", "-map", "3", "-c:v", "libx264", "-r", "30", "-c:a", "aac",
                "-shortest", "-movflags", "+faststart", str(output)]
    subprocess.run(command, check=True)
    print("Prepared " + str(output.relative_to(ROOT)))


canvas = render_campaign_square() if DATA.get("campaign") else render_rotation()
destination = TARGET / FILE
canvas.save(destination, format="JPEG", quality=90, subsampling=0, optimize=True)
print("Prepared " + str(destination.relative_to(ROOT)))
if DATA.get("video"):
    render_short(DATA["video"])
