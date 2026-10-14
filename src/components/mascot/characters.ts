/**
 * Personajes de la mascota: Michi (gato) y Capi (capibara). Comparten capas,
 * animaciones y vestuarios; cada uno trae sus sprites, las anclas de su cara
 * para colocar los accesorios y su forma de hablar.
 */
import type { Skin } from '../../core/holidays';
import { CAPI_SKINS, SKINS, SpriteSet } from './sprites';

export type CharacterId = 'gato' | 'capibara';
export type Pose = 'idle' | 'error' | 'running';
export type Pt = [number, number];

/** Puntos de la cara y el cuerpo en píxeles del sprite de cada pose. */
export interface Anchors {
  /** Coronilla (centro de la base de un sombrero). */
  crown: Pt;
  /** Inclinación de la cabeza en grados. */
  rot: number;
  eyes: [number, number, number][];
  nose: Pt;
  mouth: Pt;
  cheeks: Pt[];
  chin: Pt;
  neck: Pt;
  /** Base de las alas, en la espalda. */
  back: Pt;
}

export interface Character {
  id: CharacterId;
  /** Nombre propio («Michi»). */
  name: string;
  /** Qué animal es, para los menús («el gato»). */
  species: string;
  skins: Record<Skin, SpriteSet>;
  anchors: Record<Pose, Anchors>;
  /** Exclamación al ver un error. */
  exclaim: string;
  /** Lo que dice mientras lo acaricias. */
  petting: string;
  /** Estado accesible mientras lo acaricias. */
  pettingLabel: string;
  /** Al encontrarlo cuando se esconde. */
  found: string;
  /** Qué asoma cuando se esconde («mi cola»). */
  peekPart: string;
}

const GATO: Character = {
  id: 'gato',
  name: 'Michi',
  species: 'el gato',
  skins: SKINS,
  exclaim: '¡Miau!',
  petting: 'Prrr… prrr… 💕',
  pettingLabel: 'ronroneando',
  found: '¡Me encontraste! 😸',
  peekPart: 'mi cola',
  anchors: {
    idle: {
      crown: [180, 44],
      rot: -7,
      eyes: [
        [164, 111, 24],
        [245, 104, 22],
      ],
      nose: [212, 128],
      mouth: [212, 140],
      cheeks: [
        [160, 152],
        [258, 139],
      ],
      chin: [206, 176],
      neck: [200, 186],
      back: [126, 184],
    },
    error: {
      crown: [160, 46],
      rot: -7,
      eyes: [
        [147, 120, 23],
        [229, 104, 21],
      ],
      nose: [194, 129],
      mouth: [191, 150],
      cheeks: [
        [139, 152],
        [240, 136],
      ],
      chin: [180, 178],
      neck: [178, 190],
      back: [112, 190],
    },
    running: {
      crown: [174, 36],
      rot: -2,
      eyes: [
        [154, 118, 21],
        [236, 111, 21],
      ],
      nose: [203, 124],
      mouth: [201, 141],
      cheeks: [
        [151, 131],
        [247, 128],
      ],
      chin: [197, 164],
      neck: [196, 172],
      back: [114, 160],
    },
  },
};

/** Anclas calculadas por scripts/generar_capibara.js (cabeza alargada, hocico a la derecha). */
const CAPIBARA: Character = {
  id: 'capibara',
  name: 'Capi',
  species: 'el capibara',
  skins: CAPI_SKINS,
  exclaim: '¡Uy, uy!',
  petting: 'Mmm… qué rico, qué tranquilidad 💕',
  pettingLabel: 'relajada con las caricias',
  found: '¡Me encontraste! 🥰',
  peekPart: 'mi cabecita',
  anchors: {
    idle: {
      crown: [195, 55],
      rot: -4,
      eyes: [
        [195, 103, 17],
        [256, 92, 14],
      ],
      nose: [264, 126],
      mouth: [266, 154],
      cheeks: [
        [174, 146],
        [281, 103],
      ],
      chin: [247, 185],
      neck: [195, 193],
      back: [104, 150],
    },
    error: {
      crown: [177, 62],
      rot: -9,
      eyes: [
        [181, 110, 17],
        [241, 94, 14],
      ],
      nose: [253, 127],
      mouth: [257, 154],
      cheeks: [
        [164, 155],
        [267, 102],
      ],
      chin: [240, 188],
      neck: [189, 200],
      back: [98, 160],
    },
    running: {
      crown: [180, 38],
      rot: -3,
      eyes: [
        [179, 87, 17],
        [241, 77, 14],
      ],
      nose: [248, 111],
      mouth: [250, 139],
      cheeks: [
        [157, 130],
        [265, 88],
      ],
      chin: [229, 170],
      neck: [178, 177],
      back: [100, 128],
    },
  },
};

export const CHARACTERS: Record<CharacterId, Character> = { gato: GATO, capibara: CAPIBARA };
export const CHARACTER_LIST: Character[] = [GATO, CAPIBARA];

export function getCharacter(id: string | undefined): Character {
  return CHARACTERS[(id as CharacterId) ?? 'gato'] ?? GATO;
}
