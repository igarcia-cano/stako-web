"""
Genera og-image.png (1200x630) para Open Graph / Twitter Cards.
Diseno: fondo negro de la marca + logo Stako + nombre + tagline.
"""
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
    print("Pillow OK")
except ImportError:
    print("FAIL: Pillow no instalado. pip install pillow")
    sys.exit(1)

W, H = 1200, 630
BG = (10, 11, 13)            # #0a0b0d
GREEN = (93, 208, 141)       # #5DD08D
GOLD = (215, 188, 115)       # tono dorado de la marca
TEXT_PRIMARY = (245, 246, 250)
TEXT_MUTED = (155, 165, 178)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# --- Logo (icono cuadrado redondeado a la izquierda) ---
LOGO_SIZE = 220
LOGO_X = 100
LOGO_Y = (H - LOGO_SIZE) // 2

# Cuadro de fondo del logo (mas claro que el bg para destacar)
d.rounded_rectangle(
    [LOGO_X, LOGO_Y, LOGO_X + LOGO_SIZE, LOGO_Y + LOGO_SIZE],
    radius=42,
    fill=(20, 23, 28),
    outline=(35, 40, 50),
    width=2,
)

# Path del logo (linea quebrada subiendo)
# Coords del SVG original 0..32 escaladas a LOGO_SIZE
def s(v, base=LOGO_X, scale=LOGO_SIZE / 32.0):
    return base + v * scale

path_pts = [
    (s(8.5), s(21.5, base=LOGO_Y)),
    (s(14),  s(13,   base=LOGO_Y)),
    (s(18.5), s(18,  base=LOGO_Y)),
    (s(23.5), s(10,  base=LOGO_Y)),
]
d.line(path_pts, fill=GREEN, width=14, joint="curve")

# Punto al final
cx = s(23.5)
cy = s(10, base=LOGO_Y)
r = 16
d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN)

# --- Texto a la derecha del logo ---
TEXT_X = LOGO_X + LOGO_SIZE + 70

def load_font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\seguisb.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                continue
    return ImageFont.load_default()

font_brand = load_font(120, bold=True)
font_tag = load_font(36, bold=False)
font_url = load_font(28, bold=True)

# "STAKO"
d.text((TEXT_X, 195), "STAKO", font=font_brand, fill=TEXT_PRIMARY)

# Tagline
d.text((TEXT_X, 340), "Inversion automatizada,", font=font_tag, fill=TEXT_MUTED)
d.text((TEXT_X, 388), "decisiones humanas.", font=font_tag, fill=TEXT_MUTED)

# URL (abajo, en verde)
d.text((TEXT_X, 470), "stakocapital.com", font=font_url, fill=GREEN)

# --- Linea decorativa abajo (acento) ---
d.rectangle([0, H - 8, W, H], fill=GREEN)

out_path = r"C:\Proyectos\stako-web\og-image.png"
img.save(out_path, "PNG", optimize=True)
print(f"Generado: {out_path}")
print(f"Tamano: {os.path.getsize(out_path)} bytes")
