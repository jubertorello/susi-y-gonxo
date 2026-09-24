#!/usr/bin/env python3
"""
Dibuja la tarjeta que sale al pegar el enlace en WhatsApp, Instagram o X.

    python3 scripts/tarjeta-compartir.py

Son 1200 × 630, la medida que piden todas las redes. Se guarda en
`public/compartir.jpg` y la enlaza `wedding.seo.image`.

Va en JPG a propósito, no en WebP como el resto de las imágenes: los robots que
leen la vista previa —WhatsApp el primero— no siempre entienden WebP y se
quedan sin enseñar nada.

PARA OTRA BODA: se cambian los textos y los colores de aquí abajo, se vuelve a
lanzar y ya está. Las láminas del olivo y el papel salen de `public/`, así que
si cambian ahí, cambian aquí.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# --- lo que cambia de una boda a otra ---------------------------------------
NOMBRES   = 'Susi & Gonxo'
ANTETITULO = '¡NOS CASAMOS!'
PIE       = '27 DE MARZO DE 2027 · FINCA DE SAN JUAN, VILLABÁÑEZ'
TINTA     = (57, 64, 47)      # --color-ink
SUAVE     = (107, 115, 97)    # --color-primary
PAPEL     = RAIZ / 'public/papel.webp'
# (lámina, lado, ancho, y, girada) — dos arriba y dos abajo, enmarcando
RAMAS = [
    ('public/olivo/guirnalda.webp', 'izq', 430, -30, False),
    ('public/olivo/guirnalda.webp', 'der', 430, -30, False),
    ('public/olivo/racimo.webp',    'izq', 250, 470, True),
    ('public/olivo/hojas.webp',     'der', 230, 470, True),
]

W, H = 1200, 630
SERIF        = '/System/Library/Fonts/Supplemental/Georgia Italic.ttf'
SERIF_RECTO  = '/System/Library/Fonts/Supplemental/Georgia.ttf'


def centrado(d, y, texto, fuente, color, espaciado=0):
    """Escribe centrado. Con espaciado, letra a letra: Pillow no lo trae."""
    if not espaciado:
        an = d.textlength(texto, font=fuente)
        d.text(((W - an) / 2, y), texto, font=fuente, fill=color)
        return
    an = sum(d.textlength(c, font=fuente) + espaciado for c in texto) - espaciado
    x = (W - an) / 2
    for c in texto:
        d.text((x, y), c, font=fuente, fill=color)
        x += d.textlength(c, font=fuente) + espaciado


def main():
    # el mismo papel de la invitación, recortado a la proporción de la tarjeta
    papel = Image.open(PAPEL).convert('RGB')
    escala = max(W / papel.width, H / papel.height)
    papel = papel.resize((round(papel.width * escala), round(papel.height * escala)), Image.LANCZOS)
    izq = (papel.width - W) // 2
    arr = (papel.height - H) // 2
    lienzo = papel.crop((izq, arr, izq + W, arr + H)).convert('RGBA')

    # una rama en cada esquina de arriba, asomando desde fuera como en la portada
    for ruta, lado, ancho, y, girada in RAMAS:
        rama = Image.open(RAIZ / ruta).convert('RGBA')
        rama = rama.resize((ancho, round(rama.height * ancho / rama.width)), Image.LANCZOS)
        if girada:
            rama = rama.transpose(Image.FLIP_TOP_BOTTOM)
        if lado == 'der':
            rama = rama.transpose(Image.FLIP_LEFT_RIGHT)
        x = -70 if lado == 'izq' else W - ancho + 70
        lienzo.alpha_composite(rama, (x, y))

    d = ImageDraw.Draw(lienzo)
    centrado(d, 232, ANTETITULO, ImageFont.truetype(SERIF_RECTO, 26), SUAVE, espaciado=7)
    centrado(d, 282, NOMBRES,    ImageFont.truetype(SERIF, 92),       TINTA)
    d.line([(W / 2 - 60, 422), (W / 2 + 60, 422)], fill=SUAVE + (120,), width=1)
    centrado(d, 460, PIE, ImageFont.truetype(SERIF_RECTO, 22), SUAVE, espaciado=3)

    salida = RAIZ / 'public/compartir.jpg'
    lienzo.convert('RGB').save(salida, 'JPEG', quality=88, optimize=True, progressive=True)
    kb = salida.stat().st_size // 1024
    print(f'{salida.relative_to(RAIZ)} · {lienzo.size[0]}×{lienzo.size[1]} · {kb} kB')


if __name__ == '__main__':
    main()
