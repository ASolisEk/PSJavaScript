#!/usr/bin/env node
/**
 * Genera los sprites de Capi, el capibara (segunda mascota), al estilo de una
 * ilustración kawaii: sentado de perfil, una sola silueta naranja con contorno
 * café, hocico café oscuro, ojito con brillo, orejas redondas y patas cafés
 * con deditos. Se dibuja en SVG y se exporta a PNG con el Chromium de
 * Playwright, con las mismas capas que el gato:
 *
 *   reposo: cuerpo, oreja (capa "cola", se mueve), parpadeo a medias y ojos cerrados
 *   confundido: cuerpo, oreja y mirada a la izquierda / derecha
 *   corriendo: cuerpo (tecleando) y oreja
 *   asomarse: cabeza que se asoma por el borde (en lugar de la cola del gato)
 *
 * y las pieles de temporada (oscura para Halloween, negra para Día de Muertos).
 *
 *   node scripts/generar_capibara.js   # necesita Playwright con Chromium (CHROMIUM_PATH opcional)
 *
 * Escribe assets/mascot/capibara/<sprite>.png y assets/mascot/capibara/skins/<piel>/<sprite>.png.
 * El dibujo se traza mirando a la izquierda en coordenadas de referencia
 * (lienzo de 1500 px) y se refleja y escala al sprite, que mira a la derecha
 * como el gato. Las anclas para los vestuarios y las teclas se imprimen al final.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'mascot', 'capibara');

// ───────────────────────────── paletas ─────────────────────────────

const PALETTES = {
  normal: { line: '#3b2412', fur: '#e0904c', dark: '#8e4b2c', eye: '#3b2412', tongue: '#e8737a' },
  // Halloween: pelaje morado y ojos verdes brillantes (como el gato oscuro)
  dark: { line: '#140f1c', fur: '#5a4a7e', dark: '#2f2645', eye: '#9ed12a', tongue: '#c75b84' },
  // Día de Muertos: capibara negro con ojos ámbar
  // (un poco aclarado para que se distinga sobre el tema oscuro)
  black: { line: '#060408', fur: '#4a4156', dark: '#2a2332', eye: '#d39a3c', tongue: '#b9576f' },
};

// referencia → sprite: se refleja (mira a la derecha) y se escala
const K = 0.38;
const X1 = 1450; // borde derecho de la referencia (la cadera)
const Y0 = 60; // borde de arriba de la referencia (las orejas)
const LW = 13; // grosor del contorno en la referencia (≈ 5 px en el sprite)

const g = (ox, oy, inner, mirror = true) =>
  mirror
    ? `<g transform="translate(${ox + X1 * K} ${oy - Y0 * K}) scale(${-K} ${K})">${inner}</g>`
    : `<g transform="translate(${ox - 760 * K} ${oy - Y0 * K}) scale(${K})">${inner}</g>`;
const toSprite = (ox, oy) => ([x, y]) => [Math.round(ox + (X1 - x) * K), Math.round(oy + (y - Y0) * K)];

const stroke = (P, w = LW) => `fill="none" stroke="${P.line}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

// ───────────────────────────── piezas (coordenadas de referencia) ─────────────────────────────

/** Silueta de cabeza y cuerpo sentado, mirando a la izquierda. */
const SILHOUETTE =
  'M 770 300 C 768 244 790 194 840 164 C 900 128 980 112 1044 114 C 1114 116 1164 136 1196 172 ' +
  'C 1236 214 1268 262 1300 312 C 1356 386 1444 466 1446 592 C 1448 700 1384 772 1290 778 ' +
  'L 1000 780 C 970 780 940 776 932 760 C 926 744 932 720 944 700 C 954 650 926 570 936 500 ' +
  'C 938 474 936 454 928 442 C 870 458 808 448 788 414 C 772 388 770 344 770 300 Z';

/** Hocico café (se recorta con la silueta). */
const MUZZLE = 'M 846 136 C 930 186 962 278 950 350 C 942 400 926 432 906 452 L 700 470 L 700 100 Z';

const EYE = [1054, 246];
const EAR_NEAR = [1158, 122];
const EAR_FAR = [1070, 88];

function ear(P, [x, y], r = 44) {
  return (
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.fur}" stroke="${P.line}" stroke-width="${LW}"/>` +
    `<path d="M ${x - 18} ${y + 14} C ${x - 20} ${y - 10} ${x - 6} ${y - 24} ${x + 16} ${y - 24}" ${stroke(P, LW * 0.8)}/>`
  );
}

/**
 * Pata: la punta café de la pierna con deditos al frente (a la izquierda). El
 * borde de arriba no lleva contorno: se funde con la pierna como en la ilustración.
 */
function foot(P, x0, x1, y0, y1) {
  // contorno: frente redondeado, tres deditos abajo al frente y la planta hasta el talón
  const edge =
    `M ${x0 + 34} ${y0} C ${x0 + 8} ${y0 + 2} ${x0 - 4} ${y1 - 34} ${x0 + 2} ${y1 - 18} ` +
    `a 17 17 0 0 0 24 18 a 17 17 0 0 0 32 6 a 17 17 0 0 0 32 1 L ${x1 - 14} ${y1 + 2} Q ${x1} ${y1 + 2} ${x1} ${y1 - 12}`;
  // la orilla de arriba es una curva sin contorno que se funde con la pierna
  const top = ` L ${x1} ${y0 + 8} C ${x1 - 30} ${y0 - 6} ${x0 + 60} ${y0 - 6} ${x0 + 34} ${y0} Z`;
  return (
    `<path d="${edge}${top}" fill="${P.dark}"/>` +
    `<path d="${edge}" fill="none" stroke="${P.line}" stroke-width="${LW}" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

/**
 * Ojo. kind: open | half | closed | happy | worried. look: desplazamiento de
 * la pupila (en la referencia, + hacia atrás).
 */
function eye(P, id, kind, look = 0) {
  const [cx, cy] = EYE;
  const rx = 20;
  const ry = 27;
  const shine = `<circle cx="${cx - 6}" cy="${cy - 10}" r="7.5" fill="#ffffff"/>`;
  const open = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${P.eye}" stroke="${P.line}" stroke-width="5"/>` + shine;
  if (kind === 'open') return open;
  if (kind === 'half') {
    return (
      `<clipPath id="lid${id}"><rect x="${cx - 40}" y="${cy - 2}" width="80" height="60"/></clipPath>` +
      `<g clip-path="url(#lid${id})">${open}</g>` +
      `<path d="M ${cx - 24} ${cy - 2} Q ${cx} ${cy - 8} ${cx + 24} ${cy - 2}" ${stroke(P, 10)}/>`
    );
  }
  if (kind === 'closed') return `<path d="M ${cx - 22} ${cy + 2} Q ${cx} ${cy + 22} ${cx + 22} ${cy + 2}" ${stroke(P, 10)}/>`;
  if (kind === 'happy') return `<path d="M ${cx - 24} ${cy + 10} Q ${cx} ${cy - 22} ${cx + 24} ${cy + 10}" ${stroke(P, 10)}/>`;
  // worried: ojo grande con blanco, pupila que mira y ceja levantada
  const px = cx + look;
  return (
    `<circle cx="${cx}" cy="${cy}" r="33" fill="#ffffff" stroke="${P.line}" stroke-width="${LW * 0.8}"/>` +
    `<circle cx="${px}" cy="${cy + 3}" r="15" fill="${P.line}"/>` +
    `<circle cx="${px}" cy="${cy + 3}" r="9" fill="${P.eye}"/>` +
    `<circle cx="${px - 5}" cy="${cy - 3}" r="5" fill="#ffffff"/>` +
    `<path d="M ${cx - 34} ${cy - 50} Q ${cx - 4} ${cy - 66} ${cx + 30} ${cy - 54}" ${stroke(P, 10)}/>`
  );
}

/** Nariz y boca. mouth: smile | wavy | open */
function face(P, mouth) {
  let s = `<path d="M 798 276 C 810 254 842 252 858 274" ${stroke(P, 10)}/>`;
  if (mouth === 'smile') {
    s += `<path d="M 818 296 L 818 350 C 832 372 862 378 885 366" ${stroke(P, 10)}/>`;
  } else if (mouth === 'wavy') {
    s += `<path d="M 818 296 L 818 340" ${stroke(P, 10)}/>`;
    s += `<path d="M 812 362 q 12 -12 24 0 q 12 12 24 0 q 12 -12 24 0" ${stroke(P, 10)}/>`;
  } else {
    s += `<path d="M 818 296 L 818 334" ${stroke(P, 10)}/>`;
    s += `<path d="M 808 340 C 812 398 878 404 894 352 C 866 362 836 356 808 340 Z" fill="#6b1f24" stroke="${P.line}" stroke-width="10" stroke-linejoin="round"/>`;
    s += `<ellipse cx="848" cy="378" rx="22" ry="11" fill="${P.tongue}"/>`;
    // los dientes de enfrente de roedor
    s += `<path d="M 812 343 L 838 352 L 836 368 Q 822 368 812 358 Z" fill="#ffffff" stroke="${P.line}" stroke-width="5" stroke-linejoin="round"/>`;
  }
  return s;
}

/** Líneas de adentro: quijada, muslo y patas delanteras. */
function inner(P, { frontLegs = true } = {}) {
  let s = `<path d="M 928 442 C 962 452 1012 446 1044 418" ${stroke(P)}/>`;
  s += `<path d="M 1276 536 C 1214 556 1180 640 1192 698 C 1200 734 1240 742 1300 736" ${stroke(P)}/>`;
  if (frontLegs) {
    s += `<path d="M 1040 610 C 1034 656 1030 700 1024 732" ${stroke(P)}/>`;
    s += `<path d="M 1156 604 C 1148 652 1134 700 1120 732" ${stroke(P)}/>`;
  }
  return s;
}

/**
 * Antebrazo doblado: el codo redondo abajo y la mano café arriba (o al frente),
 * como cuando se apoya la cara en la mano.
 */
function forearm(P, [ex, ey], [hx, hy], w) {
  const len = Math.hypot(hx - ex, hy - ey);
  const nx = ((hy - ey) / len) * (w / 2);
  const ny = (-(hx - ex) / len) * (w / 2);
  const d = `M ${hx + nx} ${hy + ny} L ${ex + nx} ${ey + ny} A ${w / 2} ${w / 2} 0 0 0 ${ex - nx} ${ey - ny} L ${hx - nx} ${hy - ny} Z`;
  return (
    `<path d="${d}" fill="${P.fur}" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round"/>` +
    `<ellipse cx="${hx}" cy="${hy}" rx="${w * 0.55}" ry="${w * 0.42}" transform="rotate(${(Math.atan2(hy - ey, hx - ex) * 180) / Math.PI + 90} ${hx} ${hy})" fill="${P.dark}" stroke="${P.line}" stroke-width="${LW}"/>`
  );
}

/** Pata que baja del cuerpo: se rellena y solo se marcan sus dos orillas. */
function legEdges(P, [bx, by], [tx, ty], w) {
  const len = Math.hypot(tx - bx, ty - by);
  const nx = ((ty - by) / len) * (w / 2);
  const ny = (-(tx - bx) / len) * (w / 2);
  return (
    `<path d="M ${bx + nx} ${by + ny} L ${tx + nx} ${ty + ny} L ${tx - nx} ${ty - ny} L ${bx - nx} ${by - ny} Z" fill="${P.fur}"/>` +
    `<path d="M ${bx + nx} ${by + ny} L ${tx + nx} ${ty + ny} M ${bx - nx} ${by - ny} L ${tx - nx} ${ty - ny}" ${stroke(P)}/>`
  );
}

/** Capibara completo (sin la oreja cercana, que va en su propia capa). */
function capybara(P, id, { eyes = 'open', look = 0, mouth = 'smile', frontLegs = true, sweat = false } = {}) {
  let s = ear(P, EAR_FAR, 40);
  s += `<clipPath id="sil${id}"><path d="${SILHOUETTE}"/></clipPath>`;
  s += `<path d="${SILHOUETTE}" fill="${P.fur}"/>`;
  s += `<g clip-path="url(#sil${id})"><path d="${MUZZLE}" fill="${P.dark}"/></g>`;
  s += `<path d="${SILHOUETTE}" fill="none" stroke="${P.line}" stroke-width="${LW}" stroke-linejoin="round"/>`;
  s += inner(P, { frontLegs });
  // patas: trasera, delantera lejana y delantera cercana
  s += foot(P, 1150, 1310, 726, 782);
  if (frontLegs) {
    s += foot(P, 924, 1010, 694, 766);
    s += foot(P, 1000, 1124, 722, 784);
  }
  s += eye(P, id, eyes, look);
  s += face(P, mouth);
  if (sweat) {
    s += `<path d="M 1150 205 C 1134 232 1130 254 1148 262 C 1166 270 1178 248 1166 226 Z" fill="#8fd3ff" stroke="#2a6fa8" stroke-width="6"/>`;
  }
  return s;
}

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// ───────────────────────────── poses ─────────────────────────────

/** Reposo: sentado de perfil, mirando a la derecha. */
const IDLE = { w: 300, h: 300, o: [20, 12] };
const idle = (P, eyes = 'open') => svg(IDLE.w, IDLE.h, g(...IDLE.o, capybara(P, 'i' + eyes, { eyes })));
/** La oreja cercana se mueve como la cola del gato. */
const earLayer = (pose) => (P) => svg(pose.w, pose.h, g(...pose.o, ear(P, EAR_NEAR)));

/** Confundido: ojos de susto y la patita en el hocico, pensando. */
const CONF = { w: 300, h: 300, o: [20, 12] };
function confused(P, look = 0) {
  let s = capybara(P, 'c' + look, { eyes: 'worried', look, mouth: 'wavy', frontLegs: false, sweat: true });
  // la pata delantera lejana sigue en el suelo; la cercana sube al hocico
  s += foot(P, 924, 1010, 694, 766);
  s += forearm(P, [1036, 648], [966, 478], 84);
  return svg(CONF.w, CONF.h, g(...CONF.o, s));
}

/** Corriendo: sentado y tecleando feliz con las dos patas. */
const RUN = { w: 330, h: 300, o: [16, 12], kb: [228, 264, -6] };
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
  // 20 de las 30 teclas, repartidas por todo el teclado
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 10; c++) {
      if ((r * 10 + c) % 3 === 2) continue;
      const x = -79 + c * 16 + 6.5;
      const y = -14 + r * 10.2 + 4;
      out.push([Math.round(kx + x * Math.cos(a) - y * Math.sin(a)), Math.round(ky + x * Math.sin(a) + y * Math.cos(a))]);
    }
  return out.slice(0, 20);
}

function running(P) {
  // cuerpo, la mano lejana sobre el teclado y la cercana encima
  let s = g(...RUN.o, capybara(P, 'r', { eyes: 'happy', mouth: 'open', frontLegs: false }) + foot(P, 1040, 1150, 724, 782));
  s += keyboard();
  s += g(...RUN.o, `<ellipse cx="872" cy="680" rx="44" ry="30" transform="rotate(-8 872 680)" fill="${P.dark}" stroke="${P.line}" stroke-width="${LW}"/>`);
  // la pata cercana baja del pecho al teclado, dibujada con sus dos orillas como las patas de la ilustración
  s += g(...RUN.o, legEdges(P, [1010, 560], [972, 676], 78) + `<ellipse cx="968" cy="690" rx="46" ry="30" transform="rotate(-8 968 690)" fill="${P.dark}" stroke="${P.line}" stroke-width="${LW}"/>`);
  return svg(RUN.w, RUN.h, s);
}

/** Cabeza asomándose por el borde (mira hacia adentro, con el hocico por delante). */
const PEEK = { w: 180, h: 165 };
const peek = (P) => svg(PEEK.w, PEEK.h, g(4, 4, ear(P, EAR_NEAR) + capybara(P, 'p'), false));

// ───────────────────────────── anclas para el código ─────────────────────────────

function anchors(pose) {
  const T = toSprite(...pose.o);
  return {
    // un poco detrás de la frente: ahí se apoya el sombrero
    crown: T([1010, 114]),
    rot: 6,
    // de perfil se ve un solo ojo
    eyes: [[...T(EYE), 11]],
    nose: T([828, 270]),
    // bigote, barba y boca cosida: un poco detrás de la boca (de perfil el hocico es angosto)
    mouth: T([900, 340]),
    cheeks: [T([978, 350])],
    chin: T([870, 430]),
    neck: T([990, 452]),
    back: T([1262, 330]),
    pivot: T([EAR_NEAR[0], EAR_NEAR[1] + 30]),
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
      idle_tail: [earLayer(IDLE)(P), IDLE],
      confused_body: [confused(P, 0), CONF],
      confused_look_left: [confused(P, -12), CONF],
      confused_look_right: [confused(P, 12), CONF],
      confused_tail: [earLayer(CONF)(P), CONF],
      running_body: [running(P), RUN],
      running_tail: [earLayer(RUN)(P), RUN],
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
module.exports = { PALETTES, idle, confused, running, peek, earLayer, anchors, keyCenters, IDLE, CONF, RUN, PEEK };
