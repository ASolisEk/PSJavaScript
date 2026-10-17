#!/usr/bin/env node
/**
 * Genera los sprites de Axo, el ajolote (tercera mascota), al estilo de una
 * ilustración kawaii: sentado de frente, cabeza grande y redonda, tres
 * branquias coral por lado, ojitos negros con brillo, cejitas, chapitas,
 * sonrisa, patitas con deditos y la cola con su aleta. Se dibuja en SVG y se
 * exporta a PNG con el Chromium de Playwright, con las mismas capas que el gato:
 *
 *   reposo: cuerpo, cola (se mueve), parpadeo a medias y ojos cerrados
 *   confundido: cuerpo, cola y mirada a la izquierda / derecha
 *   corriendo: cuerpo (tecleando) y cola
 *   asomarse: cabeza con branquias que se asoma por el borde
 *
 * y las pieles de temporada (oscura para Halloween, negra para Día de Muertos).
 *
 *   node scripts/generar_ajolote.js   # necesita Playwright con Chromium (CHROMIUM_PATH opcional)
 *
 * Escribe assets/mascot/ajolote/<sprite>.png y assets/mascot/ajolote/skins/<piel>/<sprite>.png.
 * El dibujo se traza en coordenadas de la ilustración de referencia (lienzo de
 * ~1500 px) y se escala al sprite. Las anclas para los vestuarios y las teclas
 * se imprimen al final.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'mascot', 'ajolote');

// ───────────────────────────── paletas ─────────────────────────────

const PALETTES = {
  normal: { line: '#231a1a', skin: '#f3b39b', gill: '#f07a68', stripe: '#c4473c', blush: '#f2867a', eye: '#141010', tongue: '#e8737a' },
  // Halloween: piel morada y branquias verdes que brillan
  dark: { line: '#140f1c', skin: '#6a5a92', gill: '#9ed12a', stripe: '#567a10', blush: '#c77aa8', eye: '#9ed12a', tongue: '#c75b84' },
  // Día de Muertos: piel oscura con branquias de cempasúchil
  black: { line: '#060408', skin: '#4a4156', gill: '#f39c1e', stripe: '#b5650a', blush: '#c96f8a', eye: '#d39a3c', tongue: '#b9576f' },
};

// referencia → sprite
const K = 0.19;
const X0 = 30; // borde izquierdo de la referencia (punta de las branquias)
const Y0 = 85; // borde de arriba de la referencia (punta de la branquia de arriba)
const LW = 24; // grosor del contorno en la referencia (≈ 4.5 px en el sprite)

const g = (ox, oy, inner, mirror = false) =>
  mirror
    ? `<g transform="translate(${ox + 1560 * K} ${oy - Y0 * K}) scale(${-K} ${K})">${inner}</g>`
    : `<g transform="translate(${ox - X0 * K} ${oy - Y0 * K}) scale(${K})">${inner}</g>`;
const toSprite = (ox, oy) => ([x, y]) => [Math.round(ox + (x - X0) * K), Math.round(oy + (y - Y0) * K)];

const stroke = (P, w = LW) => `fill="none" stroke="${P.line}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

// ───────────────────────────── piezas (coordenadas de referencia) ─────────────────────────────

/** Cabeza y cuerpo sentado en una sola silueta (los pies y la cola van aparte). */
const SILHOUETTE =
  'M 820 185 C 1000 180 1180 300 1238 460 C 1270 560 1240 680 1160 760 C 1110 805 1088 840 1088 905 ' +
  'C 1088 1010 1124 1112 1172 1210 C 1206 1282 1214 1340 1196 1372 L 452 1372 ' +
  'C 420 1300 412 1150 440 1020 C 458 942 470 884 470 830 C 400 762 376 650 386 540 C 402 380 562 190 820 185 Z';

/** Branquias: [base (escondida tras la cabeza), punta, ancho]. */
const GILLS = [
  [[520, 430], [190, 200], 118],
  [[480, 545], [45, 460], 118],
  [[480, 690], [90, 755], 112],
  [[1070, 350], [1285, 100], 112],
  [[1160, 480], [1500, 320], 118],
  [[1210, 620], [1520, 625], 112],
];

/** Una branquia: hoja ancha coral con la orilla en picos y rayitas más oscuras, como en el bordado. */
function gill(P, [bx, by], [tx, ty], w) {
  const len = Math.hypot(tx - bx, ty - by);
  const ux = (tx - bx) / len;
  const uy = (ty - by) / len;
  const nx = -uy;
  const ny = ux;
  const at = (t, off) => [bx + (tx - bx) * t + nx * off, by + (ty - by) * t + ny * off];
  // ancho a lo largo: angosta en la base, ancha en medio, redonda en la punta
  const half = (t) => (w / 2) * (0.6 + 0.5 * Math.sin(Math.PI * Math.min(t, 0.92) * 0.95));
  // dientes como de pluma: cada pico apunta hacia la punta de la branquia
  const n = 4;
  const end = 0.88;
  let d = `M ${at(0, half(0))}`;
  for (let i = 1; i <= n; i++) {
    const t0 = ((i - 1) / n) * end;
    const t1 = (i / n) * end;
    const tp = t0 + (t1 - t0) * 0.8;
    d += ` L ${at(tp, half(tp) * 1.2)} L ${at(t1, half(t1) * 0.92)}`;
  }
  const tip = [tx + ux * 14, ty + uy * 14];
  d += ` Q ${tip} ${at(end, -half(end) * 0.92)}`;
  for (let i = n - 1; i >= 0; i--) {
    const t0 = ((i + 1) / n) * end;
    const t1 = (i / n) * end;
    const tp = t1 + (t0 - t1) * 0.8;
    d += ` L ${at(tp, -half(tp) * 1.2)} L ${at(t1, -half(t1) * 0.92)}`;
  }
  d += ' Z';
  const line = (off, a, b) => `M ${at(a, off)} L ${at(b, off)}`;
  return (
    `<path d="${d}" fill="${P.gill}" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round"/>` +
    `<path d="${line(0, 0.3, 0.82)} ${line(w * 0.2, 0.42, 0.74)} ${line(-w * 0.2, 0.42, 0.74)}" fill="none" stroke="${P.stripe}" stroke-width="13" stroke-linecap="round"/>`
  );
}

/** Cola con su aleta (capa aparte: se mece). */
function tail(P) {
  const d = 'M 540 1040 C 400 1000 220 965 52 950 C 62 1062 162 1222 332 1312 C 404 1350 474 1362 536 1344 Z';
  return (
    `<clipPath id="tail"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${P.skin}"/>` +
    // la aleta coral corre por la orilla de arriba
    `<g clip-path="url(#tail)"><path d="M 40 920 C 220 940 400 980 560 1020 L 560 1100 C 400 1064 230 1030 40 1022 Z" fill="${P.gill}"/></g>` +
    `<path d="M 80 1014 C 236 1026 384 1056 520 1092" ${stroke(P, 14)}/>` +
    `<path d="M 140 1072 C 210 1160 290 1236 400 1282" ${stroke(P, 18)}/>` +
    `<path d="${d}" fill="none" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round"/>`
  );
}

/** Pata con deditos redondos abajo. x0..x1, de y0 (arriba) a y1 (punta de los dedos). */
function foot(P, x0, x1, y0, y1, toes = 4) {
  const w = (x1 - x0) / toes;
  let d = `M ${x0} ${y0} L ${x0} ${y1 - w * 0.55}`;
  for (let i = 0; i < toes; i++) d += ` a ${w / 2} ${w * 0.6} 0 0 0 ${w} 0`;
  d += ` L ${x1} ${y0}`;
  return `<path d="${d} Z" fill="${P.skin}"/><path d="${d}" ${stroke(P)}/>`;
}

const EYES = [
  [636, 578, 68],
  [1040, 540, 60],
];

/** Ojo. kind: open | half | closed | happy | worried. */
function eye(P, id, [cx, cy, r], kind, look = 0) {
  const shine = `<circle cx="${cx + r * 0.3}" cy="${cy - r * 0.25}" r="${r * 0.22}" fill="#ffffff"/>`;
  const open = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${P.eye}" stroke="${P.line}" stroke-width="10"/>` + shine;
  if (kind === 'open') return open;
  if (kind === 'half') {
    return (
      `<clipPath id="lid${id}"><rect x="${cx - r - 20}" y="${cy - 4}" width="${2 * r + 40}" height="${r + 30}"/></clipPath>` +
      `<g clip-path="url(#lid${id})">${open}</g>` +
      `<path d="M ${cx - r - 6} ${cy - 4} Q ${cx} ${cy - 14} ${cx + r + 6} ${cy - 4}" ${stroke(P, 20)}/>`
    );
  }
  if (kind === 'closed') return `<path d="M ${cx - r} ${cy} Q ${cx} ${cy + r * 0.8} ${cx + r} ${cy}" ${stroke(P, 20)}/>`;
  if (kind === 'happy') return `<path d="M ${cx - r} ${cy + r * 0.35} Q ${cx} ${cy - r * 0.9} ${cx + r} ${cy + r * 0.35}" ${stroke(P, 20)}/>`;
  // worried: ojo grande con blanco y pupila que mira
  const R = r * 1.35;
  const px = cx + look;
  return (
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#ffffff" stroke="${P.line}" stroke-width="18"/>` +
    `<circle cx="${px}" cy="${cy + 6}" r="${r * 0.62}" fill="${P.eye === '#141010' ? P.eye : P.line}"/>` +
    (P.eye === '#141010' ? '' : `<circle cx="${px}" cy="${cy + 6}" r="${r * 0.38}" fill="${P.eye}"/>`) +
    `<circle cx="${px + r * 0.2}" cy="${cy - r * 0.15}" r="${r * 0.2}" fill="#ffffff"/>`
  );
}

/** Cara: cejas, ojos, chapitas y boca. mouth: smile | wavy | open */
function face(P, id, { eyes = 'open', look = 0, mouth = 'smile', worried = false } = {}) {
  let s = '';
  // chapitas
  s += `<ellipse cx="530" cy="705" rx="70" ry="50" fill="${P.blush}" opacity="0.85"/>`;
  s += `<ellipse cx="1165" cy="640" rx="52" ry="46" fill="${P.blush}" opacity="0.85"/>`;
  // cejitas (preocupadas: inclinadas hacia arriba al centro)
  s += worried
    ? `<path d="M 548 452 Q 600 410 662 412" ${stroke(P, 20)}/><path d="M 1000 380 Q 1050 372 1094 410" ${stroke(P, 20)}/>`
    : `<path d="M 540 442 Q 580 410 622 414" ${stroke(P, 20)}/><path d="M 1006 384 Q 1052 382 1084 412" ${stroke(P, 20)}/>`;
  EYES.forEach((e, i) => (s += eye(P, `${id}${i}`, e, eyes, look)));
  if (mouth === 'smile') s += `<path d="M 742 690 Q 862 790 982 668" ${stroke(P, 22)}/>`;
  else if (mouth === 'wavy') s += `<path d="M 760 712 q 28 -24 56 0 q 28 24 56 0 q 28 -24 56 0 q 28 24 56 0" ${stroke(P, 20)}/>`;
  else {
    s += `<path d="M 752 680 Q 862 830 974 660 Q 862 700 752 680 Z" fill="#6b1f24" stroke="${P.line}" stroke-width="18" stroke-linejoin="round"/>`;
    s += `<ellipse cx="866" cy="742" rx="46" ry="22" fill="${P.tongue}"/>`;
  }
  return s;
}

/** Ajolote completo sin la cola (que va en su propia capa). */
function axolotl(P, id, opts = {}, { feet = true } = {}) {
  let s = GILLS.map((gl) => gill(P, ...gl)).join('');
  s += `<path d="${SILHOUETTE}" fill="${P.skin}" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round"/>`;
  // línea de la barbilla (separa la cabeza del cuerpo)
  s += `<path d="M 470 830 C 520 872 580 896 632 900" ${stroke(P)}/>`;
  if (feet) {
    // patas: líneas de las piernas y los pies con deditos
    s += `<path d="M 492 1132 C 486 1200 490 1260 500 1310" ${stroke(P)}/>`;
    s += `<path d="M 640 1196 C 636 1260 640 1320 650 1372" ${stroke(P)}/>`;
    s += `<path d="M 840 1186 C 836 1250 840 1316 850 1372" ${stroke(P)}/>`;
    s += `<path d="M 1000 1176 C 1010 1240 1030 1290 1050 1320" ${stroke(P)}/>`;
    s += foot(P, 446, 600, 1330, 1430, 3);
    s += foot(P, 650, 850, 1372, 1462, 4);
    s += foot(P, 980, 1176, 1318, 1412, 4);
  }
  s += face(P, id, opts);
  return s;
}

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// ───────────────────────────── poses ─────────────────────────────

const IDLE = { w: 300, h: 300, o: [8, 26] };
const idle = (P, eyes = 'open') => svg(IDLE.w, IDLE.h, g(...IDLE.o, axolotl(P, 'i' + eyes, { eyes })));
const tailLayer = (pose) => (P) => svg(pose.w, pose.h, g(...pose.o, tail(P)));

/** Confundido: ojos de susto, cejas preocupadas, boca ondulada y una gota de sudor. */
const CONF = { w: 300, h: 300, o: [8, 26] };
function confused(P, look = 0) {
  let s = axolotl(P, 'c' + look, { eyes: 'worried', look, mouth: 'wavy', worried: true });
  s += `<path d="M 1180 300 C 1160 340 1154 372 1180 384 C 1206 396 1222 362 1200 330 Z" fill="#8fd3ff" stroke="#2a6fa8" stroke-width="10"/>`;
  return svg(CONF.w, CONF.h, g(...CONF.o, s));
}

/** Corriendo: tecleando feliz con las dos manitas. */
const RUN = { w: 300, h: 300, o: [8, 26], kb: [152, 268, -4] };
const KEY_COLORS = ['#f6d743', '#4fc3f7', '#ef5350', '#66bb6a', '#ab47bc', '#ffa726'];

function keyboard() {
  const [kx, ky, rot] = RUN.kb;
  let s = `<g transform="translate(${kx} ${ky}) rotate(${rot})">`;
  s += `<rect x="-90" y="-22" width="180" height="44" rx="9" fill="#2b2d42" stroke="#1a1020" stroke-width="5"/>`;
  s += `<rect x="-84" y="-17" width="168" height="34" rx="6" fill="#3d405b"/>`;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 10; c++) {
      const x = -79 + c * 16;
      const y = -14 + r * 10.2;
      s += `<rect x="${x}" y="${y}" width="13" height="8" rx="2" fill="${KEY_COLORS[(c + r * 3) % KEY_COLORS.length]}" opacity="${r === 1 ? 0.9 : 1}"/>`;
    }
  return s + '</g>';
}

/** Centros de algunas teclas en coordenadas del sprite (destellos al teclear). */
function keyCenters() {
  const [kx, ky, rot] = RUN.kb;
  const a = (rot * Math.PI) / 180;
  const out = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 10; c++) {
      if ((r * 10 + c) % 3 === 2) continue;
      const x = -79 + c * 16 + 6.5;
      const y = -14 + r * 10.2 + 4;
      out.push([Math.round(kx + x * Math.cos(a) - y * Math.sin(a)), Math.round(ky + x * Math.sin(a) + y * Math.cos(a))]);
    }
  return out.slice(0, 20);
}

/** Manita sobre el teclado (en coordenadas de referencia). */
const hand = (P, cx, cy) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="78" ry="54" fill="${P.skin}" stroke="${P.line}" stroke-width="${LW}"/>` +
  `<path d="M ${cx - 30} ${cy + 10} l 0 30 M ${cx + 4} ${cy + 14} l 0 30 M ${cx + 36} ${cy + 8} l 0 28" ${stroke(P, 12)}/>`;

function running(P) {
  let s = g(...RUN.o, axolotl(P, 'r', { eyes: 'happy', mouth: 'open' }, { feet: true }));
  s += keyboard();
  s += g(...RUN.o, hand(P, 640, 1180) + hand(P, 1000, 1160));
  return svg(RUN.w, RUN.h, s);
}

/** Cabeza con branquias asomándose por el borde (mira hacia adentro). */
const PEEK = { w: 220, h: 200 };
const peek = (P) => svg(PEEK.w, PEEK.h, g(-18, 6, axolotl(P, 'p', { eyes: 'open' }, { feet: false }), true));

// ───────────────────────────── anclas para el código ─────────────────────────────

function anchors(pose) {
  const T = toSprite(...pose.o);
  return {
    crown: T([822, 200]),
    rot: -3,
    eyes: EYES.map(([x, y, r]) => [...T([x, y]), Math.round(r * K)]),
    nose: T([862, 640]),
    mouth: T([862, 730]),
    cheeks: [T([530, 705]), T([1165, 640])],
    chin: T([862, 800]),
    neck: T([780, 905]),
    back: T([470, 1000]),
    // la cola se mece desde su base
    pivot: T([520, 1200]),
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
      idle_tail: [tailLayer(IDLE)(P), IDLE],
      confused_body: [confused(P, 0), CONF],
      confused_look_left: [confused(P, -16), CONF],
      confused_look_right: [confused(P, 16), CONF],
      confused_tail: [tailLayer(CONF)(P), CONF],
      running_body: [running(P), RUN],
      running_tail: [tailLayer(RUN)(P), RUN],
      peek: [peek(P), PEEK],
    };
    for (const [name, [markup, size]] of Object.entries(frames)) await render(path.join(dir, `${name}.png`), markup, size.w, size.h);
    console.log(`✓ ${skin}: ${Object.keys(frames).length} sprites`);
  }
  await browser.close();
  console.log('\nAnclas (para src/components/mascot/characters.ts y sprites.ts):');
  console.log(JSON.stringify({ idle: anchors(IDLE), error: anchors(CONF), running: anchors(RUN), keys: keyCenters() }));
}

if (require.main === module) main();
module.exports = { PALETTES, idle, confused, running, peek, tailLayer, anchors, keyCenters, IDLE, CONF, RUN, PEEK };
