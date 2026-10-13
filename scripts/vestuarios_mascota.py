#!/usr/bin/env python3
"""
Genera las "pieles" de color de la mascota para los vestuarios de temporada
(Halloween = gato oscuro con ojos brillantes, Día de Muertos = gato negro).

  python3 -m venv .venv && .venv/bin/pip install pillow numpy
  .venv/bin/python scripts/vestuarios_mascota.py

Lee los sprites ya recortados de assets/mascot/ (ver generar_mascota.py) y
escribe assets/mascot/skins/<piel>/<sprite>.png con el pelaje recoloreado. Se
conservan el blanco de los ojos, las orejas y mejillas rosas y el teclado.
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'mascot')
OUT = os.path.join(SRC, 'skins')

SPRITES = [
    'idle_body', 'idle_tail', 'idle_blink_half', 'idle_blink',
    'confused_body', 'confused_tail', 'confused_look_left', 'confused_look_right',
    'running_body', 'running_tail',
]

# Degradado del pelaje según la luminancia original (rayas → pelo → panza clara).
SKINS = {
    'dark': {
        'fur': [(0.22, '#1b1626'), (0.45, '#2a2239'), (0.63, '#3d3356'), (0.76, '#584b78'), (0.93, '#a79bc6')],
        'line': '#120d18',
        # ojos de gato de Halloween: iris verde-amarillo brillante
        'iris': [(0.15, '#3f5a00'), (0.35, '#9cc81a'), (0.6, '#e9ff7a')],
    },
    'black': {
        'fur': [(0.22, '#0c0a0f'), (0.45, '#16131b'), (0.63, '#221e29'), (0.76, '#322d3b'), (0.93, '#7a7486')],
        'line': '#060408',
        'iris': None,
    },
}

# Ojos (centro y radio) en coordenadas de cada sprite: ahí el café es iris, no pelaje.
EYES = {
    'idle': [(172, 120, 26), (243, 106, 25)],
    'confused': [(149, 118, 22), (229, 104, 21)],
    'running': [],
}


def hex_rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=float) / 255


def ramp(stops, t):
    """Interpola un degradado [(posición, color)] para cada valor de t."""
    xs = np.array([p for p, _ in stops])
    cs = np.array([hex_rgb(c) for _, c in stops])
    return np.stack([np.interp(t, xs, cs[:, k]) for k in range(3)], axis=-1)


def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    rm = nz & (mx == r)
    gm = nz & (mx == g) & ~rm
    bm = nz & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    h = h * 60
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def recolor(name, skin):
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGBA')
    a = np.asarray(im).astype(float) / 255
    rgb = a[..., :3]
    h, s, v = rgb_to_hsv(rgb)
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]

    pose = name.split('_')[0]
    in_eye = np.zeros(lum.shape, bool)
    for cx, cy, r in EYES[pose]:
        in_eye |= (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r

    warm = (h >= 12) & (h <= 52) & (s >= 0.12)
    pink = ((h < 17) | (h > 335)) & (s > 0.18) & (s < 0.8) & (v > 0.6)
    line = (v < 0.3) & ~(s < 0.15)
    # las teclas amarillas del teclado (sprite "ejecutando") no son pelaje
    keyboard = (pose == 'running') & (yy > 200) & (h > 40) & (s > 0.45)
    iris = in_eye & warm & (v < 0.66) & ~line
    fur = warm & ~pink & ~line & ~iris & ~keyboard

    out = rgb.copy()
    out[fur] = ramp(skin['fur'], lum[fur])
    if skin['iris'] is not None:
        out[iris] = ramp(skin['iris'], lum[iris])
    else:
        out[iris] = ramp(skin['fur'], lum[iris])
    # contorno: café oscuro → casi negro, mezclando según qué tan oscuro era
    k = np.clip((0.3 - v[line]) / 0.3, 0, 1)[..., None]
    out[line] = rgb[line] * (1 - k) + hex_rgb(skin['line']) * k

    res = np.concatenate([out, a[..., 3:4]], axis=-1)
    return Image.fromarray((res * 255).round().astype(np.uint8))


def main():
    for skin_name, skin in SKINS.items():
        d = os.path.join(OUT, skin_name)
        os.makedirs(d, exist_ok=True)
        for name in SPRITES:
            recolor(name, skin).save(os.path.join(d, name + '.png'), optimize=True)
        print('ok', skin_name)


if __name__ == '__main__':
    main()
