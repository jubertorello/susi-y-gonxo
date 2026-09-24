#!/usr/bin/env python3
"""
Dibuja la tarjeta que sale al pegar el enlace en WhatsApp, Instagram o X.

    python3 scripts/tarjeta-compartir.py

Es la misma portada que se ve al abrir la invitación —el sobre sobre el papel,
con las ramas de olivo asomando por los costados— recortada a 1200 × 630, que
es la medida que piden todas las redes.

Se guarda en `public/compartir.jpg` y la enlaza `wedding.seo.image`. Va en JPG
a propósito, no en WebP como el resto de las imágenes: los robots que leen la
vista previa —WhatsApp el primero— no siempre entienden WebP y se quedan sin
enseñar nada.

PARA OTRA BODA: se cambian los textos y colores de aquí abajo y se relanza. Las
láminas salen de `public/`, así que si cambian ahí, cambian aquí.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# --- lo que cambia de una boda a otra ---------------------------------------
TITULO   = 'Tienes una carta'          # wedding.envelope.preTitle
SUBTITULO = 'DE SUSI Y GONXO'          # wedding.envelope.preSubtitle, en versalita
TINTA    = (57, 64, 47)                # --color-ink
SUAVE    = (107, 115, 97)              # --color-primary
PAPEL    = 'public/papel.webp'
SOBRE    = 'public/sobre/frente.webp'

# Las mismas cuatro de la portada: el tallo nace del costado y las hojas miran
# hacia dentro. (lámina, lado, ancho, y, del revés)
RAMAS = [
    ('public/olivo/guirnalda.webp', 'izq', 400, -40, False),
    ('public/olivo/guirnalda.webp', 'der', 380, -20, False),
    ('public/olivo/racimo.webp',    'izq', 240, 460, True),
    ('public/olivo/hojas.webp',     'der', 220, 470, True),
]

W, H = 1200, 630
SOBRE_ANCHO = 390
SERIF       = '/System/Library/Fonts/Supplemental/Georgia Italic.ttf'
SERIF_RECTO = '/System/Library/Fonts/Supplemental/Georgia.ttf'


def centrado(d, y, texto, fuente, color, espaciado=0):
    """Escribe centrado. Con espaciado, letra a letra: Pillow no lo trae."""
    if not espaciado:
        d.text(((W - d.textlength(texto, font=fuente)) / 2, y), texto, font=fuente, fill=color)
        return
    an = sum(d.textlength(c, font=fuente) + espaciado for c in texto) - espaciado
    x = (W - an) / 2
    for c in texto:
        d.text((x, y), c, font=fuente, fill=color)
        x += d.textlength(c, font=fuente) + espaciado


def encajar(ruta, ancho):
    im = Image.open(RAIZ / ruta).convert('RGBA')
    return im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)


def main():
    # el mismo papel de la invitación, recortado a la proporción de la tarjeta
    papel = Image.open(RAIZ / PAPEL).convert('RGB')
    escala = max(W / papel.width, H / papel.height)
    papel = papel.resize((round(papel.width * escala), round(papel.height * escala)), Image.LANCZOS)
    izq, arr = (papel.width - W) // 2, (papel.height - H) // 2
    lienzo = papel.crop((izq, arr, izq + W, arr + H)).convert('RGBA')

    for ruta, lado, ancho, y, del_reves in RAMAS:
        rama = encajar(ruta, ancho)
        if del_reves:
            rama = rama.transpose(Image.FLIP_TOP_BOTTOM)
        if lado == 'der':
            rama = rama.transpose(Image.FLIP_LEFT_RIGHT)
        lienzo.alpha_composite(rama, (-60 if lado == 'izq' else W - ancho + 60, y))

    # el sobre, con la sombra suave que lleva en pantalla
    sobre = encajar(SOBRE, SOBRE_ANCHO)
    sx, sy = (W - SOBRE_ANCHO) // 2, 96
    sombra = Image.new('RGBA', lienzo.size, (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rectangle([sx + 10, sy + 18, sx + SOBRE_ANCHO + 6, sy + sobre.height + 14],
                                     fill=(30, 30, 18, 46))
    from PIL import ImageFilter
    lienzo.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(22)))
    lienzo.alpha_composite(sobre, (sx, sy))

    d = ImageDraw.Draw(lienzo)
    centrado(d, sy + sobre.height + 40, TITULO, ImageFont.truetype(SERIF, 62), TINTA)
    centrado(d, sy + sobre.height + 128, SUBTITULO, ImageFont.truetype(SERIF_RECTO, 24), SUAVE, espaciado=6)

    salida = RAIZ / 'public/compartir.jpg'
    lienzo.convert('RGB').save(salida, 'JPEG', quality=88, optimize=True, progressive=True)
    print(f'{salida.relative_to(RAIZ)} · {W}×{H} · {salida.stat().st_size // 1024} kB')


if __name__ == '__main__':
    main()
