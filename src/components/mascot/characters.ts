/**
 * Personajes de la mascota: Michi (gato), Capi (capibara) y Axo (ajolote). Comparten capas,
 * animaciones y vestuarios; cada uno trae sus sprites, las anclas de su cara
 * para colocar los accesorios y su forma de hablar.
 */
import type { Skin } from '../../core/holidays';
import { AXO_SKINS, CAPI_SKINS, SKINS, SpriteSet } from './sprites';

export type CharacterId = 'gato' | 'capibara' | 'ajolote';
export type Pose = 'idle' | 'error' | 'running';
export type Pt = [number, number];

/** Puntos de la cara y el cuerpo en píxeles del sprite de cada pose. */
export interface Anchors {
  /** Coronilla (centro de la base de un sombrero). */
  crown: Pt;
  /** Inclinación de la cabeza en grados. */
  rot: number;
  /** Ojos [x, y, radio]; de perfil puede haber uno solo. */
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
  /** Escala de sombreros y coronas (1 = tamaño hecho para la cabeza del gato). */
  hatScale?: number;
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

/** Reposo y error comparten silueta: sentado de perfil, se ve un solo ojo. */
const CAPI_SITTING: Anchors = {
  crown: [187, 33],
  rot: 6,
  eyes: [[170, 83, 11]],
  nose: [256, 92],
  mouth: [229, 118],
  cheeks: [[199, 122]],
  chin: [240, 153],
  neck: [195, 161],
  back: [91, 115],
};

/**
 * Capi, estilo kawaii: sentado de perfil mirando a la derecha, hocico café y
 * patitas cafés. Anclas calculadas por scripts/generar_capibara.js.
 */
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
  hatScale: 0.85,
  anchors: {
    idle: CAPI_SITTING,
    error: CAPI_SITTING,
    running: {
      crown: [183, 33],
      rot: 6,
      eyes: [[166, 83, 11]],
      nose: [252, 92],
      mouth: [225, 118],
      cheeks: [[195, 122]],
      chin: [236, 153],
      neck: [191, 161],
      back: [87, 115],
    },
  },
};

/** Las tres poses comparten la cabeza (sentado de frente, como en la ilustración). */
const AXO_FACE: Anchors = {
  crown: [158, 48],
  rot: -3,
  eyes: [
    [123, 120, 13],
    [200, 112, 11],
  ],
  nose: [166, 131],
  mouth: [166, 149],
  cheeks: [
    [103, 144],
    [224, 131],
  ],
  chin: [166, 162],
  neck: [151, 182],
  back: [92, 200],
};

/**
 * Axo, estilo kawaii: sentado de frente, cabeza grande y redonda con sus
 * branquias coral, ojitos con brillo y su cola con aleta. Anclas calculadas
 * por scripts/generar_ajolote.js.
 */
const AJOLOTE: Character = {
  id: 'ajolote',
  name: 'Axo',
  species: 'el ajolote',
  skins: AXO_SKINS,
  exclaim: '¡Ups!',
  petting: 'Jiji… me haces cosquillas en las branquias 💕',
  pettingLabel: 'feliz con las caricias',
  found: '¡Me encontraste! 😊',
  peekPart: 'mis branquias',
  anchors: { idle: AXO_FACE, error: AXO_FACE, running: AXO_FACE },
};

export const CHARACTERS: Record<CharacterId, Character> = { gato: GATO, capibara: CAPIBARA, ajolote: AJOLOTE };
export const CHARACTER_LIST: Character[] = [GATO, CAPIBARA, AJOLOTE];

export function getCharacter(id: string | undefined): Character {
  return CHARACTERS[(id as CharacterId) ?? 'gato'] ?? GATO;
}
