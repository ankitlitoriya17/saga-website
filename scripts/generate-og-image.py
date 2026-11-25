"""Generate resource/app/social-preview.png (1200x630) for link previews.
Run: python scripts/generate-og-image.py  (needs Pillow). Uses only repo assets."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
BG, IVORY, MUTED = (16, 19, 18), (244, 239, 228), (176, 172, 160)

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)
semibold = lambda s: ImageFont.truetype(str(ROOT / 'resource/fonts/outfit-semibold.ttf'), s)
regular = lambda s: ImageFont.truetype(str(ROOT / 'resource/fonts/outfit-regular.ttf'), s)

logo = Image.open(ROOT / 'resource/app/brand.png').convert('RGBA').resize((96, 96), Image.LANCZOS)
logo_mask = Image.new('L', logo.size, 0)
ImageDraw.Draw(logo_mask).rounded_rectangle((0, 0, 95, 95), radius=22, fill=255)
img.paste(logo, (72, 72), logo_mask)
d.text((184, 88), 'SPoT', font=semibold(56), fill=IVORY)

d.text((72, 232), 'Rent. Buy. Sell.', font=semibold(64), fill=IVORY)
d.text((72, 308), 'One SPoT.', font=semibold(64), fill=(232, 205, 165))
d.text((72, 400), 'Homes, rooms, PGs, shops, plots and land.', font=regular(28), fill=MUTED)
d.text((72, 440), 'Tenants and rent records too, in Hindi.', font=regular(28), fill=MUTED)
d.text((72, 520), 'Available on Google Play', font=semibold(30), fill=IVORY)

shot = Image.open(ROOT / 'resource/app/screens/discover.png').convert('RGBA')
sw = 340
shot = shot.resize((sw, sw * shot.height // shot.width), Image.LANCZOS)
card = Image.new('RGBA', (sw, H - 90), (0, 0, 0, 0))
card.paste(shot, (0, 0))
mask = Image.new('L', card.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw, card.height + 60), radius=36, fill=255)
img.paste(card, (W - sw - 88, 90), mask)

out = ROOT / 'resource/app/social-preview.png'
img.save(out, optimize=True)
print('Wrote', out, out.stat().st_size, 'bytes')
