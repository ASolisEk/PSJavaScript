/**
 * Sprites de las mascotas. Los del gato se extrajeron de assets/mascot.jpg con
 * scripts/generar_mascota.py; los del capibara se dibujan con
 * scripts/generar_capibara.js. Las coordenadas están en píxeles del sprite
 * (antes de escalar). Las decoraciones se ubican respecto a la esquina
 * superior izquierda del cuerpo de su estado.
 */
import type { ImageSourcePropType } from 'react-native';
import type { Skin } from '../../core/holidays';

export interface Decoration {
  src: ImageSourcePropType;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Caja común: todos los estados se apoyan en la misma línea de suelo. */
export const BOX = 330;

export const IDLE = {
  w: 309,
  h: 303,
  pivot: [72, 184] as [number, number],
  body: require('../../../assets/mascot/idle_body.png'),
  tail: require('../../../assets/mascot/idle_tail.png'),
  blinkHalf: require('../../../assets/mascot/idle_blink_half.png'),
  blink: require('../../../assets/mascot/idle_blink.png'),
};

export const ERROR = {
  w: 297,
  h: 311,
  pivot: [63, 192] as [number, number],
  body: require('../../../assets/mascot/confused_body.png'),
  tail: require('../../../assets/mascot/confused_tail.png'),
  lookLeft: require('../../../assets/mascot/confused_look_left.png'),
  lookRight: require('../../../assets/mascot/confused_look_right.png'),
  questions: [
    { src: require('../../../assets/mascot/q1.png'), x: 104, y: -40, w: 44, h: 73 },
    { src: require('../../../assets/mascot/q2.png'), x: 132, y: -40, w: 48, h: 68 },
    { src: require('../../../assets/mascot/q3.png'), x: 167, y: -35, w: 43, h: 61 },
  ] as Decoration[],
  drop: { src: require('../../../assets/mascot/drop_left.png'), x: 39, y: 55, w: 41, h: 48 } as Decoration,
  sweat: { src: require('../../../assets/mascot/sweat_right.png'), x: 245, y: 19, w: 38, h: 48 } as Decoration,
  fly: { src: require('../../../assets/mascot/fly.png'), x: 276, y: 43, w: 78, h: 81 } as Decoration,
};

export const RUNNING = {
  w: 313,
  h: 305,
  pivot: [66, 124] as [number, number],
  body: require('../../../assets/mascot/running_body.png'),
  tail: require('../../../assets/mascot/running_tail.png'),
  /** Centros de teclas del teclado (para los destellos al "teclear"). */
  keys: [
    [136, 252], [153, 248], [150, 259], [164, 268], [176, 262], [179, 275], [198, 268], [204, 224], [260, 217], [278, 222],
    [288, 231], [185, 250], [200, 244], [215, 239], [230, 234], [245, 229], [170, 256], [193, 258], [208, 252], [223, 247],
  ] as [number, number][],
};

/** Posición del sprite dentro de la caja común (centrado y apoyado abajo). */
export function origin(s: { w: number; h: number }) {
  return { left: (BOX - s.w) / 2, top: BOX - s.h - 4 };
}

// ───────────────────────────── pieles de temporada ─────────────────────────────

const DARK = {
  idle: {
    body: require('../../../assets/mascot/skins/dark/idle_body.png'),
    tail: require('../../../assets/mascot/skins/dark/idle_tail.png'),
    blinkHalf: require('../../../assets/mascot/skins/dark/idle_blink_half.png'),
    blink: require('../../../assets/mascot/skins/dark/idle_blink.png'),
  },
  error: {
    body: require('../../../assets/mascot/skins/dark/confused_body.png'),
    tail: require('../../../assets/mascot/skins/dark/confused_tail.png'),
    lookLeft: require('../../../assets/mascot/skins/dark/confused_look_left.png'),
    lookRight: require('../../../assets/mascot/skins/dark/confused_look_right.png'),
  },
  running: {
    body: require('../../../assets/mascot/skins/dark/running_body.png'),
    tail: require('../../../assets/mascot/skins/dark/running_tail.png'),
  },
};

const BLACK = {
  idle: {
    body: require('../../../assets/mascot/skins/black/idle_body.png'),
    tail: require('../../../assets/mascot/skins/black/idle_tail.png'),
    blinkHalf: require('../../../assets/mascot/skins/black/idle_blink_half.png'),
    blink: require('../../../assets/mascot/skins/black/idle_blink.png'),
  },
  error: {
    body: require('../../../assets/mascot/skins/black/confused_body.png'),
    tail: require('../../../assets/mascot/skins/black/confused_tail.png'),
    lookLeft: require('../../../assets/mascot/skins/black/confused_look_left.png'),
    lookRight: require('../../../assets/mascot/skins/black/confused_look_right.png'),
  },
  running: {
    body: require('../../../assets/mascot/skins/black/running_body.png'),
    tail: require('../../../assets/mascot/skins/black/running_tail.png'),
  },
};

/**
 * Lo que se asoma por el borde cuando la mascota se esconde o se minimiza:
 * la imagen y la ventana visible (en píxeles del sprite).
 */
export interface Peek {
  src: ImageSourcePropType;
  w: number;
  h: number;
  /** Tamaño de la ventana visible y desplazamiento de la imagen dentro de ella. */
  view: [number, number];
  offset: [number, number];
}

export interface SpriteSet {
  IDLE: typeof IDLE;
  ERROR: typeof ERROR;
  RUNNING: typeof RUNNING;
  PEEK: Peek;
}

/** El gato asoma la cola. */
const tailPeek = (tail: ImageSourcePropType): Peek => ({ src: tail, w: IDLE.w, h: IDLE.h, view: [88, 170], offset: [0, -40] });

const withSkin = (p: typeof DARK): SpriteSet => ({
  IDLE: { ...IDLE, ...p.idle },
  ERROR: { ...ERROR, ...p.error },
  RUNNING: { ...RUNNING, ...p.running },
  PEEK: tailPeek(p.idle.tail),
});

/** Sprites de cada piel (objetos estables: se crean una sola vez). */
export const SKINS: Record<Skin, SpriteSet> = {
  normal: { IDLE, ERROR, RUNNING, PEEK: tailPeek(IDLE.tail) },
  dark: withSkin(DARK),
  black: withSkin(BLACK),
};

// ───────────────────────────── Capi, el capibara ─────────────────────────────
// Generado con scripts/generar_capibara.js (mismas capas y poses que el gato).

const CAPI_IDLE: typeof IDLE = {
  w: 309,
  h: 303,
  pivot: [38, 196],
  body: require('../../../assets/mascot/capibara/idle_body.png'),
  tail: require('../../../assets/mascot/capibara/idle_tail.png'),
  blinkHalf: require('../../../assets/mascot/capibara/idle_blink_half.png'),
  blink: require('../../../assets/mascot/capibara/idle_blink.png'),
};

const CAPI_ERROR: typeof ERROR = {
  w: 297,
  h: 311,
  pivot: [32, 208],
  body: require('../../../assets/mascot/capibara/confused_body.png'),
  tail: require('../../../assets/mascot/capibara/confused_tail.png'),
  lookLeft: require('../../../assets/mascot/capibara/confused_look_left.png'),
  lookRight: require('../../../assets/mascot/capibara/confused_look_right.png'),
  // mismas decoraciones que el gato, alrededor de la cabeza del capibara
  questions: ERROR.questions.map((q, i) => ({ ...q, x: 126 + i * 32, y: -26 + (i === 2 ? 4 : 0) })),
  drop: { ...ERROR.drop, x: 108, y: 84 },
  sweat: { ...ERROR.sweat, x: 268, y: 40 },
  fly: { ...ERROR.fly, x: 280, y: 60 },
};

const CAPI_RUNNING: typeof RUNNING = {
  w: 313,
  h: 305,
  pivot: [30, 174],
  body: require('../../../assets/mascot/capibara/running_body.png'),
  tail: require('../../../assets/mascot/capibara/running_tail.png'),
  keys: [
    [133, 272], [150, 268], [184, 260], [201, 256], [236, 248], [253, 244], [287, 236], [135, 283], [170, 275], [187, 271],
    [221, 263], [238, 259], [272, 251], [290, 247], [155, 290], [172, 286], [206, 278], [224, 274], [258, 266], [275, 262],
  ],
};

/** El capibara asoma la cabeza (mirando hacia adentro de la pantalla). */
const headPeek = (src: ImageSourcePropType): Peek => ({ src, w: 150, h: 180, view: [86, 150], offset: [0, -14] });

const CAPI_DARK = {
  idle: {
    body: require('../../../assets/mascot/capibara/skins/dark/idle_body.png'),
    tail: require('../../../assets/mascot/capibara/skins/dark/idle_tail.png'),
    blinkHalf: require('../../../assets/mascot/capibara/skins/dark/idle_blink_half.png'),
    blink: require('../../../assets/mascot/capibara/skins/dark/idle_blink.png'),
  },
  error: {
    body: require('../../../assets/mascot/capibara/skins/dark/confused_body.png'),
    tail: require('../../../assets/mascot/capibara/skins/dark/confused_tail.png'),
    lookLeft: require('../../../assets/mascot/capibara/skins/dark/confused_look_left.png'),
    lookRight: require('../../../assets/mascot/capibara/skins/dark/confused_look_right.png'),
  },
  running: {
    body: require('../../../assets/mascot/capibara/skins/dark/running_body.png'),
    tail: require('../../../assets/mascot/capibara/skins/dark/running_tail.png'),
  },
  peek: require('../../../assets/mascot/capibara/skins/dark/peek.png'),
};

const CAPI_BLACK = {
  idle: {
    body: require('../../../assets/mascot/capibara/skins/black/idle_body.png'),
    tail: require('../../../assets/mascot/capibara/skins/black/idle_tail.png'),
    blinkHalf: require('../../../assets/mascot/capibara/skins/black/idle_blink_half.png'),
    blink: require('../../../assets/mascot/capibara/skins/black/idle_blink.png'),
  },
  error: {
    body: require('../../../assets/mascot/capibara/skins/black/confused_body.png'),
    tail: require('../../../assets/mascot/capibara/skins/black/confused_tail.png'),
    lookLeft: require('../../../assets/mascot/capibara/skins/black/confused_look_left.png'),
    lookRight: require('../../../assets/mascot/capibara/skins/black/confused_look_right.png'),
  },
  running: {
    body: require('../../../assets/mascot/capibara/skins/black/running_body.png'),
    tail: require('../../../assets/mascot/capibara/skins/black/running_tail.png'),
  },
  peek: require('../../../assets/mascot/capibara/skins/black/peek.png'),
};

const capiSkin = (p: typeof CAPI_DARK): SpriteSet => ({
  IDLE: { ...CAPI_IDLE, ...p.idle },
  ERROR: { ...CAPI_ERROR, ...p.error },
  RUNNING: { ...CAPI_RUNNING, ...p.running },
  PEEK: headPeek(p.peek),
});

export const CAPI_SKINS: Record<Skin, SpriteSet> = {
  normal: { IDLE: CAPI_IDLE, ERROR: CAPI_ERROR, RUNNING: CAPI_RUNNING, PEEK: headPeek(require('../../../assets/mascot/capibara/peek.png')) },
  dark: capiSkin(CAPI_DARK),
  black: capiSkin(CAPI_BLACK),
};
