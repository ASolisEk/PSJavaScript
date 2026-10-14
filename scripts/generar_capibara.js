#!/usr/bin/env node
/**
 * Genera los sprites de Capi, el capibara (segunda mascota), con el mismo
 * estilo que Michi: contorno café grueso, colores planos, chapitas rosas y
 * ojos grandes con brillo. Se dibuja en SVG y se exporta a PNG con el
 * Chromium de Playwright, con las mismas capas que el gato:
 *
 *   reposo: cuerpo, cola, parpadeo a medias y ojos cerrados
 *   confundido: cuerpo, cola y mirada a la izquierda / derecha
 *   corriendo: cuerpo (con teclado) y cola
 *   asomarse: cabeza que se asoma por el borde (en lugar de la cola del gato)
 *
 * y las pieles de temporada (oscura para Halloween, negra para Día de Muertos).
 *
 *   npx playwright --version   # necesita Playwright con Chromium
 *   node scripts/generar_capibara.js
 *
 * Escribe assets/mascot/capibara/<sprite>.png y assets/mascot/capibara/skins/<piel>/<sprite>.png.
 * Las anclas (ojos, coronilla, teclas…) usadas en el código salen de las
 * mismas constantes de este archivo (ver la tabla al final de la ejecución).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'mascot', 'capibara');

// ───────────────────────────── paletas ─────────────────────────────

const PALETTES = {
  normal: {
    line: '#3b1f10',
    fur: '#c98d5c',
    furDark: '#a8703f',
    furLight: '#e3b98d',
    muzzle: '#b27648',
    tuft: '#8a5430',
    nose: '#4a2716',
    ear: '#e89a8f',
    blush: '#f39a9a',
    iris: '#3a1d0e',
    ring: '#7d4626',
  },
  // Halloween: pelaje morado oscuro y ojos verdes brillantes (como el gato oscuro)
  dark: {
    line: '#120d18',
    fur: '#3d3356',
    furDark: '#2a2239',
    furLight: '#5a4c7c',
    muzzle: '#30284a',
    tuft: '#1e182b',
    nose: '#120d18',
    ear: '#c98aa8',
    blush: '#d77b9c',
    iris: '#3f5a00',
    ring: '#b5e33a',
  },
  // Día de Muertos: capibara negro
  black: {
    line: '#060408',
    fur: '#25202c',
    furDark: '#16131b',
    furLight: '#3a3445',
    muzzle: '#1c1822',
    tuft: '#0c0a0f',
    nose: '#060408',
    ear: '#b97f92',
    blush: '#c96f8a',
    iris: '#3a1d0e',
    ring: '#a0662f',
  },
};

const LW = 5.5; // grosor del contorno

// ───────────────────────────── piezas ─────────────────────────────

/** Extremidad redondeada (cápsula con contorno). */
function limb(P, x1, y1, x2, y2, w, fill = P.fur, toes = true) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // dedos: dos rayitas en la punta, perpendiculares a la extremidad
  const nx = -dy / len;
  const ny = dx / len;
  const ux = dx / len;
  const uy = dy / len;
  const toe = (k) => {
    const bx = x2 + nx * k * w * 0.22 + ux * w * 0.18;
    const by = y2 + ny * k * w * 0.22 + uy * w * 0.18;
    return `<path d="M ${bx} ${by} l ${-ux * w * 0.26} ${-uy * w * 0.26}" stroke="${P.line}" stroke-width="3" stroke-linecap="round"/>`;
  };
  return (
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${P.line}" stroke-width="${w + LW * 2}" stroke-linecap="round"/>` +
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>` +
    (toes ? toe(-1) + toe(1) : '')
  );
}

/**
 * Ojo. kind: open | half | closed | worried | happy. look: desplazamiento de la pupila en x.
 */
function eye(P, id, cx, cy, r, kind, look = 0) {
  if (kind === 'closed') {
    return `<path d="M ${cx - r * 0.95} ${cy - r * 0.05} Q ${cx} ${cy + r * 0.75} ${cx + r * 0.95} ${cy - r * 0.05}" fill="none" stroke="${P.line}" stroke-width="4.5" stroke-linecap="round"/>`;
  }
  if (kind === 'happy') {
    return `<path d="M ${cx - r * 0.95} ${cy + r * 0.35} Q ${cx} ${cy - r * 0.85} ${cx + r * 0.95} ${cy + r * 0.35}" fill="none" stroke="${P.line}" stroke-width="5" stroke-linecap="round"/>`;
  }
  if (kind === 'worried') {
    const R = r * 1.18;
    const px = cx + look;
    return (
      `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#ffffff" stroke="${P.line}" stroke-width="4"/>` +
      `<circle cx="${px}" cy="${cy + 1}" r="${r * 0.46}" fill="${P.iris}"/>` +
      `<circle cx="${px - r * 0.16}" cy="${cy - r * 0.14}" r="${r * 0.15}" fill="#ffffff"/>`
    );
  }
  const open =
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${P.iris}" stroke="${P.line}" stroke-width="3"/>` +
    `<circle cx="${cx + r * 0.1}" cy="${cy + r * 0.2}" r="${r * 0.62}" fill="${P.ring}" opacity="0.55"/>` +
    `<circle cx="${cx + r * 0.08}" cy="${cy + r * 0.12}" r="${r * 0.4}" fill="${P.iris}"/>` +
    `<circle cx="${cx - r * 0.34}" cy="${cy - r * 0.36}" r="${r * 0.34}" fill="#ffffff"/>` +
    `<circle cx="${cx + r * 0.36}" cy="${cy + r * 0.3}" r="${r * 0.15}" fill="#ffffff"/>`;
  if (kind === 'open') return open;
  // a medias: párpado de pelaje sobre la mitad de arriba
  return (
    `<clipPath id="lid${id}"><rect x="${cx - r - 4}" y="${cy - r * 0.05}" width="${r * 2 + 8}" height="${r * 2}"/></clipPath>` +
    `<g clip-path="url(#lid${id})">${open}</g>` +
    `<path d="M ${cx - r * 1.05} ${cy - r * 0.05} Q ${cx} ${cy - r * 0.2} ${cx + r * 1.05} ${cy - r * 0.05}" fill="none" stroke="${P.line}" stroke-width="4.5" stroke-linecap="round"/>`
  );
}

/** Mechón de pelo (rayita curva). */
const tuft = (P, x, y, k = 1, rot = 0) =>
  `<path transform="rotate(${rot} ${x} ${y})" d="M ${x} ${y} q ${7 * k} ${-7 * k} ${14 * k} ${1 * k}" fill="none" stroke="${P.tuft}" stroke-width="3" stroke-linecap="round"/>`;

/**
 * Cabeza en coordenadas propias (centro aprox. 0,0; mira hacia la derecha de
 * tres cuartos). Devuelve también las anclas de la cara.
 */
const HEAD = {
  // cabeza alargada con el hocico hacia adelante (rasgo del capibara)
  outline: 'M -70 -30 C -68 -58 -40 -68 -6 -68 C 30 -68 60 -60 74 -36 C 90 -12 98 14 92 36 C 86 58 60 68 30 68 C -10 68 -50 66 -66 46 C -78 28 -74 -6 -70 -30 Z',
  ears: [
    [-46, -60, 15, 13, -24],
    [22, -64, 13, 12, 14],
  ],
  eyes: [
    [-10, -20, 17],
    [52, -26, 14],
  ],
  nose: [58, 8],
  mouth: [58, 36],
  // la chapita lejana no se dibuja (queda tras el hocico); su ancla sirve a los vestuarios
  cheeks: [
    [-34, 22, 14, 8],
    [76, -14, 7, 6],
  ],
  chin: [36, 66],
  crown: [-6, -68],
  /** Donde la cabeza se une al cuerpo (moños, paliacate, dije). */
  neck: [-16, 70],
};

function head(P, id, { eyes = 'open', look = 0, mouth = 'smile', brows = false, sweat = false } = {}) {
  const H = HEAD;
  let s = '';
  // orejas (detrás de la cabeza)
  for (const [x, y, rx, ry, rot] of H.ears) {
    s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="${P.fur}" stroke="${P.line}" stroke-width="${LW}"/>`;
    s += `<ellipse cx="${x + (x < 0 ? 1 : -1)}" cy="${y + 2}" rx="${rx * 0.5}" ry="${ry * 0.45}" transform="rotate(${rot} ${x} ${y})" fill="${P.ear}"/>`;
  }
  s += `<clipPath id="head${id}"><path d="${H.outline}"/></clipPath>`;
  s += `<path d="${H.outline}" fill="${P.fur}"/>`;
  s += `<g clip-path="url(#head${id})">`;
  // luz arriba, sombra abajo y hocico más oscuro
  s += `<ellipse cx="-16" cy="-56" rx="60" ry="22" fill="${P.furLight}" opacity="0.55"/>`;
  s += `<ellipse cx="0" cy="82" rx="100" ry="24" fill="${P.furDark}" opacity="0.5"/>`;
  s += `<ellipse cx="54" cy="26" rx="48" ry="34" fill="${P.muzzle}" opacity="0.85"/>`;
  s += `</g>`;
  s += `<path d="${H.outline}" fill="none" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round"/>`;
  // mechones en la coronilla
  s += `<path d="M -22 -66 q 4 -14 10 -3 q 4 -12 10 1" fill="none" stroke="${P.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += tuft(P, -58, -22, 0.9, -40) + tuft(P, -44, -46, 0.8, -10);
  // chapitas
  // solo se ve la chapita cercana (la lejana queda detrás del hocico)
  const [cx0, cy0, crx, cry] = H.cheeks[0];
  s += `<ellipse cx="${cx0}" cy="${cy0}" rx="${crx}" ry="${cry}" fill="${P.blush}" opacity="0.75"/>`;
  // ojos
  H.eyes.forEach(([x, y, r], i) => (s += eye(P, `${id}e${i}`, x, y, r, eyes, look)));
  if (brows) {
    s += `<path d="M -30 -48 Q -16 -54 0 -58" fill="none" stroke="${P.line}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M 40 -60 Q 56 -58 68 -48" fill="none" stroke="${P.line}" stroke-width="4" stroke-linecap="round"/>`;
  }
  // nariz grande de capibara
  const [nx, ny] = H.nose;
  s += `<rect x="${nx - 22}" y="${ny - 12}" width="44" height="24" rx="12" fill="${P.nose}" stroke="${P.line}" stroke-width="3"/>`;
  s += `<ellipse cx="${nx - 8}" cy="${ny - 4}" rx="7" ry="3.5" fill="#ffffff" opacity="0.45"/>`;
  s += `<path d="M ${nx - 9} ${ny + 4} q 3 3 6 0 M ${nx + 3} ${ny + 4} q 3 3 6 0" fill="none" stroke="${P.line}" stroke-width="2" stroke-linecap="round"/>`;
  // boca
  const [mx, my] = H.mouth;
  s += `<path d="M ${nx} ${ny + 12} L ${mx} ${my - 4}" stroke="${P.line}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (mouth === 'smile') {
    s += `<path d="M ${mx - 15} ${my - 6} Q ${mx - 7} ${my + 4} ${mx} ${my - 4} Q ${mx + 7} ${my + 4} ${mx + 15} ${my - 6}" fill="none" stroke="${P.line}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (mouth === 'wavy') {
    s += `<path d="M ${mx - 18} ${my + 2} q 4.5 -6 9 0 q 4.5 6 9 0 q 4.5 -6 9 0 q 4.5 6 9 0" fill="none" stroke="${P.line}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (mouth === 'open') {
    s += `<path d="M ${mx - 18} ${my - 5} Q ${mx} ${my + 26} ${mx + 18} ${my - 5} Q ${mx} ${my} ${mx - 18} ${my - 5} Z" fill="#7a2e2e" stroke="${P.line}" stroke-width="3.5" stroke-linejoin="round"/>`;
    s += `<ellipse cx="${mx}" cy="${my + 10}" rx="9" ry="5.5" fill="#f08a8a"/>`;
  }
  if (sweat) {
    s += `<path d="M -52 -40 C -60 -28 -62 -18 -54 -14 C -46 -10 -40 -20 -46 -30 Z" fill="#8fd3ff" stroke="#2a6fa8" stroke-width="2.5"/>`;
  }
  return s;
}

/** Cuerpo de "pan" del capibara (sin cabeza ni patas). */
function body(P, id, d, extra = '') {
  return (
    `<clipPath id="body${id}"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${P.fur}"/>` +
    `<g clip-path="url(#body${id})">` +
    `<ellipse cx="130" cy="276" rx="150" ry="40" fill="${P.furDark}" opacity="0.55"/>` +
    `<ellipse cx="150" cy="246" rx="70" ry="16" fill="${P.furLight}" opacity="0.55"/>` +
    `<ellipse cx="100" cy="132" rx="80" ry="22" fill="${P.furLight}" opacity="0.35"/>` +
    extra +
    `</g>` +
    `<path d="${d}" fill="none" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round"/>`
  );
}

const svg = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;

// ───────────────────────────── poses ─────────────────────────────

/** Reposo: de pie, de tres cuartos mirando a la derecha. */
const IDLE = { w: 309, h: 303, head: [206, 122], rot: -4, tail: [30, 192], pivot: [38, 196], back: [104, 150] };

function idle(P, eyes = 'open') {
  const [hx, hy] = IDLE.head;
  const bodyD = 'M 42 242 C 14 218 18 164 60 146 C 102 128 172 130 208 154 C 242 178 246 226 226 248 C 206 268 74 272 42 242 Z';
  let s = '';
  // patas de atrás (más oscuras)
  s += limb(P, 106, 250, 108, 280, 30, P.furDark);
  s += limb(P, 226, 246, 230, 276, 30, P.furDark);
  s += body(P, 'i', bodyD, tuft(P, 72, 160) + tuft(P, 104, 148) + tuft(P, 54, 188, 0.9, 20) + tuft(P, 140, 150, 0.9));
  // patas de adelante
  s += limb(P, 70, 256, 70, 284, 32);
  s += limb(P, 190, 256, 194, 286, 32);
  s += `<g transform="translate(${hx} ${hy}) rotate(${IDLE.rot})">${head(P, 'i' + eyes, { eyes })}</g>`;
  return svg(IDLE.w, IDLE.h, s);
}

const idleTail = (P) => svg(IDLE.w, IDLE.h, tailTuft(P, ...IDLE.tail));

function tailTuft(P, x, y) {
  // colita mínima de capibara: un mechón redondo
  return `<path d="M ${x + 10} ${y - 12} C ${x - 6} ${y - 16} ${x - 14} ${y + 2} ${x - 4} ${y + 12} C ${x + 4} ${y + 18} ${x + 16} ${y + 10} ${x + 16} ${y}" fill="${P.fur}" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="M ${x - 2} ${y - 2} q 6 -4 10 2" fill="none" stroke="${P.tuft}" stroke-width="2.5" stroke-linecap="round"/>`;
}

/** Confundido: cabeza ladeada, ojos de susto, rascándose la cabeza. */
const CONF = { w: 297, h: 311, head: [194, 128], rot: -9, tail: [24, 204], pivot: [32, 208], back: [98, 160] };

function confused(P, look = 0) {
  const [hx, hy] = CONF.head;
  const bodyD = 'M 38 252 C 10 228 14 174 56 156 C 98 138 168 140 204 164 C 238 188 242 236 222 258 C 202 278 70 282 38 252 Z';
  let s = '';
  s += limb(P, 102, 260, 104, 290, 30, P.furDark);
  s += limb(P, 222, 256, 226, 286, 30, P.furDark);
  s += body(P, 'c', bodyD, tuft(P, 66, 170) + tuft(P, 98, 158) + tuft(P, 50, 198, 0.9, 20) + tuft(P, 134, 160, 0.9));
  s += limb(P, 66, 266, 66, 294, 32);
  s += `<g transform="translate(${hx} ${hy}) rotate(${CONF.rot})">${head(P, 'c' + look, { eyes: 'worried', look, mouth: 'wavy', brows: true, sweat: true })}</g>`;
  // pata levantada rascándose la cabeza
  s += limb(P, 200, 240, 244, 190, 32, P.fur, false);
  s += `<circle cx="248" cy="184" r="20" fill="${P.fur}" stroke="${P.line}" stroke-width="${LW}"/>`;
  s += `<path d="M 237 177 l 6 -7 M 248 173 l 5 -7 M 259 177 l 5 -6" stroke="${P.line}" stroke-width="3" stroke-linecap="round"/>`;
  return svg(CONF.w, CONF.h, s);
}

const confusedTail = (P) => svg(CONF.w, CONF.h, tailTuft(P, ...CONF.tail));

/** Corriendo y tecleando feliz. */
const RUN = { w: 313, h: 305, head: [190, 106], rot: -3, tail: [22, 170], pivot: [30, 174], kb: [212, 264, -13], back: [100, 128] };
const KEY_COLORS = ['#f6d743', '#4fc3f7', '#ef5350', '#66bb6a', '#ab47bc', '#ffa726'];

function keyboard() {
  const [kx, ky, rot] = RUN.kb;
  let s = `<g transform="translate(${kx} ${ky}) rotate(${rot})">`;
  s += `<rect x="-98" y="-24" width="196" height="48" rx="9" fill="#2b2d42" stroke="#1a1020" stroke-width="5"/>`;
  s += `<rect x="-92" y="-19" width="184" height="38" rx="6" fill="#3d405b"/>`;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 10; c++) {
      const x = -86 + c * 17.6;
      const y = -15 + r * 11.4;
      s += `<rect x="${x}" y="${y}" width="14" height="9" rx="2" fill="${KEY_COLORS[(c + r * 3) % KEY_COLORS.length]}" opacity="${r === 1 ? 0.9 : 1}"/>`;
    }
  return s + '</g>';
}

/** Centros de algunas teclas en coordenadas del sprite (destellos al teclear). */
function keyCenters() {
  const [kx, ky, rot] = RUN.kb;
  const a = (rot * Math.PI) / 180;
  const out = [];
  // 20 de las 30 teclas, repartidas por todo el teclado
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 10; c += 1) {
      if ((r * 10 + c) % 3 === 2) continue;
      const x = -86 + c * 17.6 + 7;
      const y = -15 + r * 11.4 + 4.5;
      out.push([Math.round(kx + x * Math.cos(a) - y * Math.sin(a)), Math.round(ky + x * Math.sin(a) + y * Math.cos(a))]);
    }
  return out.slice(0, 20);
}

function running(P) {
  const [hx, hy] = RUN.head;
  const bodyD = 'M 30 206 C 6 184 16 136 60 122 C 104 108 170 116 204 140 C 234 162 236 206 214 226 C 192 246 62 240 30 206 Z';
  let s = '';
  // patas estiradas (galope)
  s += limb(P, 90, 214, 54, 248, 28, P.furDark);
  s += body(P, 'r', bodyD, tuft(P, 70, 136) + tuft(P, 102, 124) + tuft(P, 52, 162, 0.9, 20) + tuft(P, 136, 128, 0.9));
  s += limb(P, 56, 212, 22, 240, 30);
  s += keyboard();
  s += `<g transform="translate(${hx} ${hy}) rotate(${RUN.rot})">${head(P, 'r', { eyes: 'happy', mouth: 'open' })}</g>`;
  // patitas sobre el teclado
  s += limb(P, 240, 214, 254, 236, 30, P.furDark, false);
  s += `<ellipse cx="258" cy="242" rx="18" ry="12" fill="${P.furDark}" stroke="${P.line}" stroke-width="${LW}"/>`;
  s += limb(P, 172, 222, 184, 244, 32, P.fur, false);
  s += `<ellipse cx="188" cy="252" rx="20" ry="13" fill="${P.fur}" stroke="${P.line}" stroke-width="${LW}"/>`;
  s += `<path d="M 180 252 l 2 -6 M 191 254 l 2 -6" stroke="${P.line}" stroke-width="2.5" stroke-linecap="round"/>`;
  return svg(RUN.w, RUN.h, s);
}

const runningTail = (P) => svg(RUN.w, RUN.h, tailTuft(P, ...RUN.tail));

/** Cabeza asomándose por el borde (se ve la mitad izquierda; mira hacia adentro). */
const PEEK = { w: 150, h: 180 };
function peek(P) {
  return svg(PEEK.w, PEEK.h, `<g transform="translate(78 100) rotate(-14) scale(-1 1)">${head(P, 'p', { eyes: 'open' })}</g>`);
}

// ───────────────────────────── anclas para el código ─────────────────────────────

function toSprite([ox, oy], rot, [x, y]) {
  const a = (rot * Math.PI) / 180;
  return [Math.round(ox + x * Math.cos(a) - y * Math.sin(a)), Math.round(oy + x * Math.sin(a) + y * Math.cos(a))];
}

function anchors(pose) {
  const o = pose.head;
  const r = pose.rot;
  const T = (p) => toSprite(o, r, p);
  return {
    crown: T(HEAD.crown),
    rot: r,
    eyes: HEAD.eyes.map(([x, y, rr]) => [...T([x, y]), rr]),
    nose: T(HEAD.nose),
    mouth: T(HEAD.mouth),
    cheeks: HEAD.cheeks.map(([x, y]) => T([x, y])),
    chin: T(HEAD.chin),
    neck: T(HEAD.neck),
    back: pose.back,
  };
}

// ───────────────────────────── exportar ─────────────────────────────

function loadPlaywright() {
  for (const m of ['playwright', 'playwright-core', '/opt/node-tools/node_modules/playwright']) {
    try {
      return require(m);
    } catch {
      /* siguiente */
    }
  }
  console.error('Necesitas Playwright: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

async function main() {
  const { chromium } = loadPlaywright();
  const exe = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const render = async (file, markup, w, h) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  };
  for (const [skin, P] of Object.entries(PALETTES)) {
    const dir = skin === 'normal' ? OUT : path.join(OUT, 'skins', skin);
    const frames = {
      idle_body: [idle(P, 'open'), IDLE],
      idle_blink_half: [idle(P, 'half'), IDLE],
      idle_blink: [idle(P, 'closed'), IDLE],
      idle_tail: [idleTail(P), IDLE],
      confused_body: [confused(P, 0), CONF],
      confused_look_left: [confused(P, -7), CONF],
      confused_look_right: [confused(P, 7), CONF],
      confused_tail: [confusedTail(P), CONF],
      running_body: [running(P), RUN],
      running_tail: [runningTail(P), RUN],
      peek: [peek(P), PEEK],
    };
    for (const [name, [markup, size]] of Object.entries(frames)) await render(path.join(dir, `${name}.png`), markup, size.w, size.h);
    console.log(`✓ ${skin}: ${Object.keys(frames).length} sprites`);
  }
  await browser.close();
  console.log('\nAnclas (para src/components/mascot/sprites.ts):');
  console.log(JSON.stringify({ idle: anchors(IDLE), error: anchors(CONF), running: anchors(RUN), keys: keyCenters() }, null, 1));
}

if (require.main === module) main();
module.exports = { PALETTES, idle, confused, running, peek, anchors, IDLE, CONF, RUN, PEEK };
