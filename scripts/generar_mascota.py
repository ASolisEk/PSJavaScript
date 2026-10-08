#!/usr/bin/env python3
"""
Genera los sprites animables de la mascota a partir de assets/mascot.jpg.

  python3 -m venv .venv && .venv/bin/pip install pillow numpy scipy
  .venv/bin/python scripts/generar_mascota.py

Pasos: quita el fondo blanco (relleno desde el borde, para conservar el blanco
de los ojos), recorta cada gato y sus decoraciones (???, gotas, mosca), separa
la cola para rotarla y crea cuadros de parpadeo y de mirada nerviosa.
"""
import json, os, tempfile
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'mascot.jpg')
OUT = os.path.join(ROOT, 'assets', 'mascot')
TMP = tempfile.mkdtemp(prefix='mascota-')
D = TMP
os.makedirs(OUT, exist_ok=True)


def outline(a, width=3):
    """Contorno blanco suave para que las decoraciones se vean en fondos oscuros."""
    alpha = a[..., 3] > 40
    pad = width + 2
    big = np.zeros((a.shape[0] + 2 * pad, a.shape[1] + 2 * pad, 4))
    big[pad:-pad, pad:-pad] = a
    halo = ndimage.binary_dilation(np.pad(alpha, pad), iterations=width)
    soft = ndimage.gaussian_filter(halo.astype(float), 0.8) * 235
    out = np.zeros_like(big)
    out[..., :3] = 255
    out[..., 3] = soft
    fa = big[..., 3:4] / 255
    out[..., :3] = big[..., :3] * fa + out[..., :3] * (1 - fa)
    out[..., 3] = np.maximum(out[..., 3], big[..., 3])
    return out

# ── 1. recorte de sprites ──

im = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
H, W, _ = im.shape
mn = im.min(axis=2); mx = im.max(axis=2)
whiteish = (mn > 228) & (mx - mn < 25)
lab, n = ndimage.label(whiteish)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:,0], lab[:,-1]]))) - {0}
bg = np.isin(lab, list(border))
fg = ~bg
# quitar ruido de compresión
fg = ndimage.binary_opening(fg, iterations=1)
flab, fn = ndimage.label(fg, structure=np.ones((3,3)))

def alpha_for(mask):
    """Alfa suave en el borde: des-mezcla del blanco en 2 px alrededor."""
    a = mask.astype(float)
    ring = ndimage.binary_dilation(mask, iterations=2) & ~ndimage.binary_erosion(mask, iterations=1)
    est = np.clip((255 - mn) / (255 - 45), 0, 1)
    a = np.where(ring, np.maximum(est, a * 0) , a)
    a = np.where(ring & mask, np.maximum(est, 0.0), a)
    a = np.where(mask & ~ring, 1.0, a)
    return np.clip(a, 0, 1)

def export(name, comp_ids, box, pad=6):
    x0, y0, x1, y1 = box
    mask = np.isin(flab, comp_ids)
    a = alpha_for(mask)
    a[:, :max(0, x0-pad)] = 0; a[:, x1+pad:] = 0; a[:max(0,y0-pad)] = 0; a[y1+pad:] = 0
    # des-mezcla del color de borde contra blanco
    rgb = im.copy()
    safe = np.maximum(a, 1e-3)[..., None]
    rgb = np.where(a[..., None] < 0.999, (rgb - (1 - a[..., None]) * 255) / safe, rgb)
    rgb = np.clip(rgb, 0, 255)
    out = np.dstack([rgb, a * 255]).astype(np.uint8)
    crop = out[max(0,y0-pad):y1+pad, max(0,x0-pad):x1+pad]
    Image.fromarray(crop, 'RGBA').save(f'{D}/{name}.png')
    print(name, crop.shape, 'offset', max(0,x0-pad), max(0,y0-pad))

def comps_in(box):
    x0, y0, x1, y1 = box
    ids = np.unique(flab[y0:y1, x0:x1]); ids = ids[ids > 0]
    res=[]
    for i in ids:
        ys, xs = np.where(flab == i)
        if xs.min() >= x0 - 2 and xs.max() <= x1 + 2 and ys.min() >= y0 - 2 and ys.max() <= y1 + 2:
            res.append(i)
    return res

def biggest(box):
    x0, y0, x1, y1 = box
    ids, cnt = np.unique(flab[y0:y1, x0:x1], return_counts=True)
    m = [(c, i) for c, i in zip(cnt, ids) if i > 0]
    return max(m)[1]

cats = {'idle': (28,346,325,637), 'confused': (334,338,619,637), 'running': (696,356,997,649)}
for k, b in cats.items():
    export(f'cat_{k}', [biggest(b)], b)
export('q1', comps_in((440,300,468,357)), (440,300,468,357), 3)
export('q2', comps_in((468,300,500,352)), (468,300,500,352), 3)
export('q3', comps_in((503,305,530,350)), (503,305,530,350), 3)
export('drop_left', comps_in((370,390,405,432)), (370,390,405,432), 3)
export('sweat_right', comps_in((576,354,608,396)), (576,354,608,396), 3)
export('fly', comps_in((612,383,674,448)), (612,383,674,448), 3)

# ── 2. capas y cuadros de animación ──
LINE=(58,36,30)

def load(n): return np.asarray(Image.open(f'{D}/{n}.png').convert('RGBA')).astype(float)
def save(a, n):
    Image.fromarray(np.clip(a,0,255).astype(np.uint8),'RGBA').save(f'{OUT}/{n}.png', optimize=True)

def poly_mask(shape, pts):
    m = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m) > 0

def split_tail(a, pts, pivot, overlap=4):
    region = poly_mask(a.shape, pts)
    # el solape (para ocultar la unión) solo cerca de la base de la cola
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    near = (xx - pivot[0])**2 + (yy - pivot[1])**2 < 22**2
    keep = region | (ndimage.binary_dilation(region, iterations=overlap) & near)
    tail = a.copy(); tail[~keep] = 0
    body = a.copy(); body[region] = 0
    return body, tail

def dark_components(a, box, maxval=(135, 95, 80)):
    x0,y0,x1,y1 = box
    r,g,b,al = a[...,0],a[...,1],a[...,2],a[...,3]
    m = (r<maxval[0])&(g<maxval[1])&(b<maxval[2])&(al>200)
    sub = np.zeros_like(m); sub[y0:y1,x0:x1] = m[y0:y1,x0:x1]
    lab,n = ndimage.label(sub)
    res=[]
    for i,sl in enumerate(ndimage.find_objects(lab)):
        ys,xs=sl; res.append(((lab[sl]==i+1).sum(), xs.start, ys.start, xs.stop, ys.stop))
    res.sort(reverse=True); return res

def fur_color(a, cx, cy, rx, ry):
    yy,xx = np.mgrid[0:a.shape[0],0:a.shape[1]]
    d = ((xx-cx)/rx)**2 + ((yy-cy)/ry)**2
    ring = (d>1.4)&(d<2.6)&(a[...,3]>250)&(a[...,0]>200)&(a[...,1]>130)
    return np.median(a[ring][:, :3], axis=0)

def draw_lid(a, cx, cy, rx, ry, frac):
    """frac: 0.5 = medio cerrado, 1 = cerrado. Pinta párpado con color de pelaje y línea."""
    S=4
    H,W=a.shape[:2]
    fur = fur_color(a, cx, cy, rx, ry)
    x0,y0,x1,y1 = int(cx-rx-6), int(cy-ry-6), int(cx+rx+7), int(cy+ry+7)
    patch = Image.new('RGBA', ((x1-x0)*S,(y1-y0)*S), (0,0,0,0))
    d = ImageDraw.Draw(patch)
    ex0,ey0,ex1,ey1 = (cx-rx-1.5-x0)*S,(cy-ry-1.5-y0)*S,(cx+rx+1.5-x0)*S,(cy+ry+1.5-y0)*S
    fc = tuple(int(c) for c in fur)+(255,)
    w = int(4.2*S)
    if frac >= 1:
        d.ellipse([ex0,ey0,ex1,ey1], fill=fc)
        # ojo cerrado: curva hacia abajo
        d.arc([ex0+rx*0.15*S, (cy-ry*0.55-y0)*S, ex1-rx*0.15*S, (cy+ry*0.55-y0)*S], 20, 160, fill=LINE+(255,), width=w)
    else:
        # párpado superior hasta la mitad
        lid = Image.new('L', patch.size, 0); ld = ImageDraw.Draw(lid)
        ld.ellipse([ex0,ey0,ex1,ey1], fill=255)
        cut = (cy - ry*(1-2*frac) - y0)*S
        ld.rectangle([0, cut, patch.size[0], patch.size[1]], fill=0)
        patch.paste(Image.new('RGBA', patch.size, fc), (0,0), lid)
        d.line([ex0+rx*0.05*S, cut, ex1-rx*0.05*S, cut], fill=LINE+(255,), width=w)
        # pestaña: borde redondeado del párpado
        d.arc([ex0, ey0, ex1, ey1], 180, 360, fill=LINE+(255,), width=int(3.5*S))
    patch = patch.resize((x1-x0, y1-y0), Image.LANCZOS)
    pa = np.asarray(patch).astype(float)
    al = pa[...,3:4]/255
    region = a[y0:y1, x0:x1]
    region[...,:3] = region[...,:3]*(1-al) + pa[...,:3]*al
    region[...,3] = np.maximum(region[...,3], pa[...,3])
    return a

meta = {}

# ── reposo ──
idle = load('cat_idle')
eyes = dark_components(idle, (110, 60, 300, 160))[:2]
eyes = sorted(eyes, key=lambda e: e[1])
print('idle eyes', eyes)
body, tail = split_tail(idle, [(0,40),(84,40),(84,150),(78,168),(70,192),(0,205)], (72,184))
save(body,'idle_body'); save(tail,'idle_tail')
for name, frac in [('idle_blink_half',0.5),('idle_blink',1.0)]:
    b = body.copy()
    for (_,x0,y0,x1,y1) in eyes:
        cx,cy,rx,ry = (x0+x1)/2,(y0+y1)/2,(x1-x0)/2,(y1-y0)/2
        b = draw_lid(b, cx, cy, rx, ry, frac)
    save(b, name)
meta['idle'] = {'w': idle.shape[1], 'h': idle.shape[0], 'pivot': [72, 184]}

# ── confundido ──
conf = load('cat_confused')
body, tail = split_tail(conf, [(0,60),(70,60),(70,150),(70,170),(64,208),(0,215)], (63,192))
save(body,'confused_body'); save(tail,'confused_tail')
# pupilas (componentes oscuros dentro de la esclerótica, medidos en la imagen)
pupils = [(0,156,110,170,125),(0,233,97,247,111)]
print('pupils', pupils)
for name, dx in [('confused_look_left',-11),('confused_look_right',7)]:
    b = body.copy()
    patches = []
    for (_,x0,y0,x1,y1) in pupils:
        x0-=2;y0-=2;x1+=2;y1+=2
        patches.append((x0,y0,b[y0:y1,x0:x1].copy()))
        b[y0:y1,x0:x1,:3] = 252; b[y0:y1,x0:x1,3] = 255
    for (x0,y0,p) in patches:
        b[y0:y0+p.shape[0], x0+dx:x0+dx+p.shape[1]] = p
    save(b, name)
meta['confused'] = {'w': conf.shape[1], 'h': conf.shape[0], 'pivot': [63, 192]}

# ── ejecutando ──
run = load('cat_running')
body, tail = split_tail(run, [(0,0),(76,0),(76,92),(74,116),(56,132),(0,132)], (66,124))
save(body,'running_body'); save(tail,'running_tail')
rects = [[136,252],[153,248],[150,259],[164,268],[176,262],[179,275],[198,268],[204,224],[260,217],[278,222],[288,231],
         [185,250],[200,244],[215,239],[230,234],[245,229],[170,256],[193,258],[208,252],[223,247],[238,242],[253,210]]
meta['running'] = {'w': run.shape[1], 'h': run.shape[0], 'pivot': [66, 124], 'keys': rects}

for n in ['q1','q2','q3','drop_left','sweat_right','fly']:
    a = load(n)
    if n.startswith('q') or n == 'fly':
        a = outline(a)
    save(a, n)
    meta[n] = {'w': a.shape[1], 'h': a.shape[0]}
json.dump(meta, open(f'{TMP}/meta.json','w'), indent=1)
print('Sprites guardados en', OUT)
