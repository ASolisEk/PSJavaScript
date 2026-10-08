/**
 * Sprites de la mascota, extraídos de assets/mascot.jpg con
 * scripts/generar_mascota.py. Las coordenadas están en píxeles del sprite
 * (antes de escalar). Las decoraciones se ubican respecto a la esquina
 * superior izquierda del cuerpo de su estado.
 */
import type { ImageSourcePropType } from 'react-native';

export interface Decoration {
  src: ImageSourcePropType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StateSprites {
  w: number;
  h: number;
  /** Base de la cola (centro de rotación). */
  pivot: [number, number];
  body: ImageSourcePropType;
  tail: ImageSourcePropType;
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
