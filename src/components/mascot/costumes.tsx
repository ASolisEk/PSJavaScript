/**
 * Vestuarios de temporada de la mascota (el calendario de fiestas está en
 * core/holidays.ts). Cada vestuario puede cambiar el color del pelaje (ver
 * sprites.ts → SKINS) y añadir accesorios dibujados con SVG que siguen las
 * animaciones del cuerpo, además de partículas ambientales (nieve, pétalos,
 * murciélagos…).
 *
 * Las coordenadas de los accesorios están en píxeles del sprite: cada pose
 * define dónde está la coronilla, los ojos, la boca, el cuello y la espalda.
 */
import React, { createContext, memo, useContext } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { Costume } from '../../core/holidays';
import { MONO } from '../../ui/theme';
import { ND, to, useLoops, useValue, useValues, wait } from './anim';
import { SKINS, SpriteSet } from './sprites';

export { COSTUMES, resolveCostume } from '../../core/holidays';

const CostumeContext = createContext<Costume | null>(null);
/** Orientación de la mascota (-1 izquierda, 1 derecha), para dibujos que no deben verse en espejo. */
const FaceContext = createContext<Animated.Value | null>(null);
export const FaceProvider = FaceContext.Provider;
export const CostumeProvider = CostumeContext.Provider;
export const useCostume = () => useContext(CostumeContext);

/** Sprites con el color de pelaje del vestuario actual. */
export function useSprites(): SpriteSet {
  return SKINS[useContext(CostumeContext)?.skin ?? 'normal'];
}

// ───────────────────────────── anclas por pose ─────────────────────────────

export type Pose = 'idle' | 'error' | 'running';
type Pt = [number, number];

interface Anchors {
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

const POSES: Record<Pose, Anchors> = {
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
};

// ───────────────────────────── piezas ─────────────────────────────

type Box = [number, number, number, number];

/**
 * Un dibujo SVG en coordenadas del sprite relativas a su ancla, con su propia
 * transformación animada (girando alrededor de `pivot`).
 */
function Piece({
  box,
  s,
  pivot,
  transform,
  opacity,
  children,
}: {
  box: Box;
  s: number;
  pivot?: Pt;
  transform?: any[];
  opacity?: any;
  children: React.ReactNode;
}) {
  const [x, y, w, h] = box;
  const [px, py] = pivot ?? [x + w / 2, y + h / 2];
  return (
    <Animated.View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: x * s,
        top: y * s,
        width: w * s,
        height: h * s,
        opacity,
        transformOrigin: `${(px - x) * s}px ${(py - y) * s}px`,
        transform: transform ?? [],
      }}
    >
      <Svg width={w * s} height={h * s} viewBox={`${x} ${y} ${w} ${h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Grupo situado en un punto del sprite y girado como la cabeza. */
function Anchor({ at, rot = 0, s, children }: { at: Pt; rot?: number; s: number; children: React.ReactNode }) {
  return (
    <View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: at[0] * s - 1,
        top: at[1] * s - 1,
        width: 2,
        height: 2,
        transform: [{ rotate: `${rot}deg` }],
      }}
    >
      <View style={{ position: 'absolute', left: 1, top: 1 }}>{children}</View>
    </View>
  );
}

// ── sombreros (origen = coronilla) ──

function WitchHat() {
  return (
    <G>
      <Ellipse cx={0} cy={0} rx={104} ry={21} fill="#2d2142" stroke="#0e0a16" strokeWidth={4} />
      <Path
        d="M -54 -4 L -22 -104 C -30 -128 -52 -142 -80 -146 C -50 -152 -14 -140 2 -112 L 54 -4 Z"
        fill="#2d2142"
        stroke="#0e0a16"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path d="M 30 -10 L -2 -100" stroke="rgba(255,255,255,0.12)" strokeWidth={7} strokeLinecap="round" />
      <Path d="M -50 -12 Q 0 -2 50 -12 L 45 -32 Q 0 -23 -45 -32 Z" fill="#8e44ad" stroke="#0e0a16" strokeWidth={3} />
      <Rect x={-11} y={-31} width={21} height={19} rx={2} fill="none" stroke="#f5c542" strokeWidth={4} />
      {/* una estrellita y una luna en el sombrero */}
      <Path d="M -18 -66 l 3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#f5c542" />
      <Path d="M 18 -50 a 9 9 0 1 0 6 -15 a 7 7 0 1 1 -6 15 z" fill="#f5c542" />
    </G>
  );
}

function SantaBag() {
  return (
    <G>
      <Path
        d="M 76 -10 C 74 -60 42 -104 -4 -108 C -44 -110 -84 -94 -110 -60 C -86 -70 -62 -64 -52 -48 L -76 -10 Z"
        fill="#d7263d"
        stroke="#6e0f1a"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path d="M 44 -16 C 42 -56 22 -88 -8 -98" stroke="rgba(0,0,0,0.16)" strokeWidth={9} strokeLinecap="round" fill="none" />
      <Rect x={-88} y={-28} width={176} height={30} rx={15} fill="#ffffff" stroke="#c9d3df" strokeWidth={3} />
      {[-62, -30, 2, 34, 64].map((x) => (
        <Circle key={x} cx={x} cy={-14} r={5} fill="#eef2f7" />
      ))}
    </G>
  );
}

function Pompom() {
  return (
    <G>
      <Circle cx={-112} cy={-58} r={17} fill="#ffffff" stroke="#c9d3df" strokeWidth={3} />
      <Circle cx={-117} cy={-63} r={5} fill="#eef2f7" />
    </G>
  );
}

function Sombrero({ felt }: { felt: boolean }) {
  const fill = felt ? '#6b4423' : '#e9c46a';
  const line = felt ? '#2b1a0e' : '#7a5320';
  const trim = felt ? '#d9dee3' : '#c1121f';
  return (
    <G>
      <Path
        d="M -142 -6 C -152 -36 -128 -28 -100 -14 C -60 2 60 2 100 -14 C 128 -28 152 -36 142 -6 C 118 24 -118 24 -142 -6 Z"
        fill={fill}
        stroke={line}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path d="M -134 -2 C -110 20 110 20 134 -2" stroke={trim} strokeWidth={4} strokeDasharray="7 6" fill="none" />
      <Path d="M -46 -10 C -52 -60 -38 -100 0 -102 C 38 -100 52 -60 46 -10 C 20 -2 -20 -2 -46 -10 Z" fill={fill} stroke={line} strokeWidth={4} />
      <Path d="M -20 -95 C -8 -80 8 -80 20 -95" stroke={line} strokeWidth={3} fill="none" strokeLinecap="round" />
      {felt ? (
        <G>
          <Path d="M -48 -34 Q 0 -40 48 -34 L 47 -16 Q 0 -22 -47 -16 Z" fill="#c0c6cc" stroke={line} strokeWidth={2.5} />
          {[-30, -10, 10, 30].map((x) => (
            <Circle key={x} cx={x} cy={-26} r={3.4} fill="#8d969e" />
          ))}
        </G>
      ) : null}
    </G>
  );
}

function PartyHat() {
  const colors = ['#ff5fa2', '#ffd23f', '#29c5d8', '#9b6bff'];
  const bands = [0, 1, 2, 3];
  const xl = (t: number) => -32 + 38 * t;
  const xr = (t: number) => 38 - 32 * t;
  return (
    <G transform="translate(14 0) rotate(12)">
      {bands.map((i) => {
        const t0 = i / 4;
        const t1 = (i + 1) / 4;
        const y0 = -94 * t0;
        const y1 = -94 * t1;
        return <Polygon key={i} points={`${xl(t0)},${y0} ${xr(t0)},${y0} ${xr(t1)},${y1} ${xl(t1)},${y1}`} fill={colors[i]} />;
      })}
      <Polygon points="-32,0 38,0 6,-94" fill="none" stroke="#3b2a4a" strokeWidth={3.5} strokeLinejoin="round" />
      {[-20, -6, 8, 22].map((x, i) => (
        <Circle key={x} cx={x} cy={-4} r={4} fill={colors[(i + 2) % 4]} stroke="#3b2a4a" strokeWidth={1.5} />
      ))}
      <Path d="M 6 -96 l -12 -10 M 6 -96 l 2 -16 M 6 -96 l 14 -9" stroke="#ffd23f" strokeWidth={4} strokeLinecap="round" />
      <Circle cx={6} cy={-96} r={7} fill="#ff5fa2" stroke="#3b2a4a" strokeWidth={2} />
    </G>
  );
}

function Crown() {
  return (
    <G>
      <Path
        d="M -46 0 L -52 -46 L -30 -24 L -14 -58 L 2 -26 L 20 -58 L 34 -24 L 54 -46 L 46 0 Z"
        fill="#f7c948"
        stroke="#9c6b12"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Rect x={-47} y={-14} width={94} height={14} fill="#e9b52f" stroke="#9c6b12" strokeWidth={3} />
      <Circle cx={-24} cy={-7} r={4.5} fill="#e63946" />
      <Circle cx={2} cy={-7} r={5} fill="#3a86ff" />
      <Circle cx={27} cy={-7} r={4.5} fill="#2a9d8f" />
      {[
        [-52, -46],
        [-14, -58],
        [20, -58],
        [54, -46],
      ].map(([x, y]) => (
        <Circle key={x} cx={x} cy={y} r={4.5} fill="#fff3b0" stroke="#9c6b12" strokeWidth={2} />
      ))}
    </G>
  );
}

function Beanie() {
  return (
    <G>
      <Path d="M 30 -6 C 60 -16 92 -8 100 0 C 82 7 50 7 30 1 Z" fill="#ef476f" stroke="#12355b" strokeWidth={3} />
      <Path d="M -64 -2 C -62 -66 62 -66 64 -2 Z" fill="#3a86ff" />
      <Path d="M 0 -50 C -26 -48 -38 -24 -40 -2 L -14 -2 C -14 -24 -8 -44 0 -50 Z" fill="#ffd23f" />
      <Path d="M 0 -50 C 26 -48 38 -24 40 -2 L 14 -2 C 14 -24 8 -44 0 -50 Z" fill="#ef476f" />
      <Path d="M -64 -2 C -62 -66 62 -66 64 -2 Z" fill="none" stroke="#12355b" strokeWidth={4} />
      <Rect x={-3} y={-62} width={6} height={14} fill="#4a4a55" />
    </G>
  );
}

function Propeller() {
  return (
    <G>
      <Ellipse cx={-18} cy={-62} rx={19} ry={5} fill="#ef476f" stroke="#12355b" strokeWidth={2} />
      <Ellipse cx={18} cy={-62} rx={19} ry={5} fill="#ffd23f" stroke="#12355b" strokeWidth={2} />
      <Circle cx={0} cy={-62} r={4.5} fill="#2b2d42" />
    </G>
  );
}

function GradCap() {
  return (
    <G>
      <Path d="M -46 -32 L -44 -2 Q 0 8 46 -2 L 48 -32 Z" fill="#1d1d28" stroke="#000" strokeWidth={3} />
      <Polygon points="-84,-40 4,-62 88,-40 0,-18" fill="#2a2a3a" stroke="#000" strokeWidth={3} strokeLinejoin="round" />
      <Line x1={3} y1={-40} x2={66} y2={-36} stroke="#f5c542" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={3} cy={-40} r={4.5} fill="#f5c542" />
    </G>
  );
}

function Tassel() {
  return (
    <G>
      <Line x1={66} y1={-36} x2={66} y2={-12} stroke="#f5c542" strokeWidth={3} />
      <Path d="M 61 -14 L 71 -14 L 73 4 L 59 4 Z" fill="#f5c542" stroke="#b8860b" strokeWidth={1.5} />
    </G>
  );
}

/** Flor sencilla: pétalos alrededor de un centro. */
function Flower({ x, y, r, petals, color, center }: { x: number; y: number; r: number; petals: number; color: string; center: string }) {
  return (
    <G>
      {Array.from({ length: petals }, (_, i) => {
        const a = (i / petals) * Math.PI * 2;
        return (
          <Circle key={i} cx={x + Math.cos(a) * r * 0.75} cy={y + Math.sin(a) * r * 0.75} r={r * 0.55} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
        );
      })}
      <Circle cx={x} cy={y} r={r * 0.5} fill={center} />
    </G>
  );
}

/** Cempasúchil: pétalos en capas naranjas. */
function Marigold({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <G>
      <Flower x={x} y={y} r={r} petals={11} color="#f77f00" center="#fcbf49" />
      <Flower x={x} y={y} r={r * 0.62} petals={8} color="#fcbf49" center="#f77f00" />
    </G>
  );
}

const CROWN_SPOTS: [number, number, number][] = [
  [-66, -6, 13],
  [-40, -16, 14],
  [-12, -21, 15],
  [17, -20, 14],
  [44, -14, 13],
  [68, -4, 12],
];

function FlowerCrown({ kind }: { kind: 'spring' | 'roses' | 'marigold' }) {
  const spring = ['#ff8fab', '#ffd23f', '#9b6bff', '#4cc9f0', '#ff8fab', '#ffd23f'];
  return (
    <G>
      <Path d="M -80 0 Q 0 -34 80 0" stroke="#2d6a4f" strokeWidth={6} fill="none" strokeLinecap="round" />
      {CROWN_SPOTS.slice(0, -1).map(([x, y], i) => (
        <Ellipse
          key={`l${i}`}
          cx={x + 14}
          cy={y - 6}
          rx={9}
          ry={4.5}
          fill="#52b788"
          stroke="#2d6a4f"
          strokeWidth={1.5}
          transform={`rotate(-25 ${x + 14} ${y - 6})`}
        />
      ))}
      {CROWN_SPOTS.map(([x, y, r], i) =>
        kind === 'marigold' ? (
          <Marigold key={i} x={x} y={y} r={r} />
        ) : kind === 'roses' ? (
          <G key={i}>
            <Circle cx={x} cy={y} r={r * 0.85} fill={i % 2 ? '#ff4d6d' : '#c9184a'} stroke="#800f2f" strokeWidth={2} />
            <Path d={`M ${x - 4} ${y} a 4 4 0 1 1 4 4 a 7 7 0 1 1 -7 -7`} stroke="#800f2f" strokeWidth={1.8} fill="none" />
          </G>
        ) : (
          <Flower key={i} x={x} y={y} r={r} petals={5} color={spring[i]} center="#fff3b0" />
        ),
      )}
    </G>
  );
}

// ── cara (origen = boca, girado como la cabeza) ──

function Beard() {
  const puffs: [number, number, number][] = [
    [-44, 2, 15],
    [-32, 18, 19],
    [-13, 30, 21],
    [13, 30, 21],
    [32, 18, 19],
    [44, 2, 15],
    [0, 48, 18],
    [-20, 44, 15],
    [20, 44, 15],
  ];
  return (
    <G>
      {puffs.map(([x, y, r], i) => (
        <Circle key={`o${i}`} cx={x} cy={y} r={r + 3} fill="#c9d3df" />
      ))}
      {puffs.map(([x, y, r], i) => (
        <Circle key={`f${i}`} cx={x} cy={y} r={r} fill="#ffffff" />
      ))}
      <Ellipse cx={-15} cy={1} rx={17} ry={8.5} fill="#ffffff" stroke="#c9d3df" strokeWidth={2.5} transform="rotate(12 -15 1)" />
      <Ellipse cx={15} cy={1} rx={17} ry={8.5} fill="#ffffff" stroke="#c9d3df" strokeWidth={2.5} transform="rotate(-12 15 1)" />
    </G>
  );
}

function Mustache() {
  const half = 'M 0 -2 C -8 -10 -24 -12 -36 -4 C -44 2 -52 2 -58 -6 C -56 8 -40 15 -24 9 C -14 5 -6 3 0 5 Z';
  return (
    <G>
      <Path d={half} fill="#2a1a12" />
      <Path d={half} fill="#2a1a12" transform="scale(-1 1)" />
    </G>
  );
}

// ── cuello (origen = cuello) ──

// Bandera: verde a la izquierda de quien mira. Con la mascota volteada
// (mirror) los colores se dibujan al revés para que se lea bien.
const flag = (mirror: boolean) => (mirror ? ['#ce1126', '#006847'] : ['#006847', '#ce1126']);

function TricolorBand({ mirror }: { mirror: boolean }) {
  const [l, r] = flag(mirror);
  return (
    <G>
      <Path d="M -48 -34 L -16 -37 L -16 -17 L -47 -16 Z" fill={l} />
      <Path d="M -16 -37 L 16 -37 L 16 -17 L -16 -17 Z" fill="#ffffff" />
      <Path d="M 16 -37 L 48 -34 L 47 -16 L 16 -17 Z" fill={r} />
      <Circle cx={0} cy={-27} r={4.5} fill="#8a5a2b" />
    </G>
  );
}

function TricolorBow({ mirror }: { mirror: boolean }) {
  const [l, r] = flag(mirror);
  return (
    <G>
      <Path d="M 0 0 L -26 -14 L -24 14 Z" fill={l} stroke="rgba(0,0,0,0.4)" strokeWidth={2} strokeLinejoin="round" />
      <Path d="M 0 0 L 26 -14 L 24 14 Z" fill={r} stroke="rgba(0,0,0,0.4)" strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={0} cy={0} r={7} fill="#ffffff" stroke="#888" strokeWidth={1.5} />
    </G>
  );
}

function Bandana() {
  return (
    <G>
      <Path d="M -44 -8 Q 0 8 44 -8 L 4 34 Z" fill="#c1121f" stroke="#6a040f" strokeWidth={3} strokeLinejoin="round" />
      {[
        [-20, 2],
        [4, 8],
        [22, 2],
        [2, 22],
        [-8, 12],
        [14, 14],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.2} fill="#ffffff" />
      ))}
    </G>
  );
}

function HeartPendant() {
  return (
    <G>
      <Path d="M -36 -10 Q 0 10 36 -10" stroke="#ff8fab" strokeWidth={3} fill="none" />
      <Path d="M 0 16 C -16 4 -14 -8 -6 -8 C -2 -8 0 -5 0 -3 C 0 -5 2 -8 6 -8 C 14 -8 16 4 0 16 Z" fill="#ff4d6d" stroke="#a4133c" strokeWidth={2} />
    </G>
  );
}

// ── pintura de cara y lentes (coordenadas absolutas del sprite) ──

function CalaveraPaint({ a }: { a: Anchors }) {
  const colors = ['#ff5fa2', '#ffd23f', '#29c5d8', '#9b6bff', '#7bd389'];
  const [e1, e2] = a.eyes;
  const fx = (e1[0] + e2[0]) / 2;
  const fy = Math.min(e1[1], e2[1]) - 34;
  const [nx, ny] = a.nose;
  const [mx, my] = a.mouth;
  return (
    <G>
      {/* pétalos alrededor de los ojos */}
      {a.eyes.map(([cx, cy, r], k) =>
        Array.from({ length: 12 }, (_, i) => {
          const ang = (i / 12) * 360;
          const rad = (ang * Math.PI) / 180;
          const px = cx + Math.cos(rad) * (r + 8);
          const py = cy + Math.sin(rad) * (r + 8);
          return (
            <Ellipse
              key={`${k}-${i}`}
              cx={px}
              cy={py}
              rx={6}
              ry={3.4}
              fill={colors[(i + k) % colors.length]}
              stroke="#1b1b1b"
              strokeWidth={1}
              transform={`rotate(${ang} ${px} ${py})`}
            />
          );
        }),
      )}
      {/* frente: flor de cempasúchil y puntitos */}
      <Marigold x={fx} y={fy} r={13} />
      {[0, 1, 2].map((i) => (
        <Circle key={i} cx={fx + (i - 1) * 2} cy={fy + 20 + i * 8} r={2.6 - i * 0.4} fill="#ffffff" />
      ))}
      {/* nariz de corazón invertido */}
      <Path
        d={`M ${nx} ${ny + 8} C ${nx - 10} ${ny + 1} ${nx - 9} ${ny - 6} ${nx - 4} ${ny - 6} C ${nx - 1} ${ny - 6} ${nx} ${ny - 4} ${nx} ${ny - 2} C ${nx} ${ny - 4} ${nx + 1} ${ny - 6} ${nx + 4} ${ny - 6} C ${nx + 9} ${ny - 6} ${nx + 10} ${ny + 1} ${nx} ${ny + 8} Z`}
        fill="#111"
        stroke="#ffffff"
        strokeWidth={1.6}
      />
      {/* boca cosida */}
      <Line x1={mx - 26} y1={my + 8} x2={mx + 26} y2={my + 8} stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" />
      {[-20, -10, 0, 10, 20].map((dx) => (
        <Line key={dx} x1={mx + dx} y1={my + 3} x2={mx + dx} y2={my + 13} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
      ))}
      {/* espirales en las mejillas */}
      {a.cheeks.map(([cx, cy], i) => (
        <Path
          key={i}
          d={`M ${cx} ${cy} m -2 0 a 2 2 0 1 1 4 0 a 4 4 0 1 1 -8 0 a 6.5 6.5 0 1 1 13 0`}
          stroke={colors[i + 2]}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {/* barbilla */}
      {[-12, 0, 12].map((dx, i) => (
        <Circle key={dx} cx={a.chin[0] + dx} cy={a.chin[1] - 6 + (i === 1 ? 4 : 0)} r={2.6} fill={colors[i]} />
      ))}
    </G>
  );
}

function RoundGlasses({ a }: { a: Anchors }) {
  const [e1, e2] = a.eyes;
  return (
    <G>
      {a.eyes.map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r + 4} fill="rgba(200,230,255,0.15)" stroke="#3a2a20" strokeWidth={4.5} />
      ))}
      <Path
        d={`M ${e1[0] + e1[2] + 4} ${e1[1] - 2} Q ${(e1[0] + e2[0]) / 2} ${Math.min(e1[1], e2[1]) - 14} ${e2[0] - e2[2] - 4} ${e2[1] - 2}`}
        stroke="#3a2a20"
        strokeWidth={4}
        fill="none"
      />
    </G>
  );
}

function PixelShades({ a }: { a: Anchors }) {
  const [e1, e2] = a.eyes;
  const p = 8;
  const cx = (e1[0] + e2[0]) / 2;
  const cy = (e1[1] + e2[1]) / 2;
  // centrados en la línea de los ojos (se giran con ella)
  const top = cy - 3 * p + 2;
  const ang = (Math.atan2(e2[1] - e1[1], e2[0] - e1[0]) * 180) / Math.PI;
  return (
    <G transform={`rotate(${ang} ${cx} ${cy})`}>
      <Rect x={e1[0] - e1[2] - 8} y={top} width={e2[0] + e2[2] + 16 - (e1[0] - e1[2])} height={p} fill="#111" />
      {[e1, e2].map(([x, , r], i) => (
        <G key={i}>
          <Rect x={x - r - 4} y={top + p} width={2 * r + 8} height={p * 3} fill="#111" />
          <Rect x={x - r + p - 4} y={top + p * 4} width={2 * r + 8 - 2 * p} height={p} fill="#111" />
          <Rect x={x - r + 2 * p - 4} y={top + p * 5} width={2 * r + 8 - 4 * p} height={p} fill="#111" />
          <Rect x={x - r + 2} y={top + p} width={p} height={p} fill="#ffffff" />
          <Rect x={x - r + 2 + p} y={top + p * 2} width={p} height={p} fill="#ffffff" />
        </G>
      ))}
    </G>
  );
}

// ───────────────────────────── vestuario sobre el sprite ─────────────────────────────

const PAD = 160;

/** Dibujo estático en coordenadas absolutas del sprite (con margen). */
function Overlay({ s, w, h, children }: { s: number; w: number; h: number; children: React.ReactNode }) {
  return (
    <View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: -PAD * s,
        top: -PAD * s,
        width: (w + 2 * PAD) * s,
        height: (h + 2 * PAD) * s,
      }}
    >
      <Svg width={(w + 2 * PAD) * s} height={(h + 2 * PAD) * s} viewBox={`${-PAD} ${-PAD} ${w + 2 * PAD} ${h + 2 * PAD}`}>
        {children}
      </Svg>
    </View>
  );
}

function OutfitImpl({ pose, part, s, w, h, active }: { pose: Pose; part: 'back' | 'front'; s: number; w: number; h: number; active: boolean }) {
  const costume = useCostume();
  const faceDir = useContext(FaceContext);
  const id = costume?.id;
  const wob = useValue(0);
  const flap = useValue(0);
  const spin = useValue(0);
  const swing = useValue(0);

  useLoops(
    active && !!id,
    () => [
      Animated.sequence([to(wob, 1, 1300), to(wob, -1, 2600), to(wob, 0, 1300)]),
      Animated.sequence([to(flap, 1, 380), to(flap, 0, 520), wait(id === 'san-valentin' ? 700 : 0)]),
      Animated.timing(spin, {
        toValue: 1,
        duration: 280,
        easing: Easing.linear,
        useNativeDriver: ND,
      }),
      Animated.sequence([to(swing, 1, 700), to(swing, -1, 1400), to(swing, 0, 700)]),
    ],
    () => [wob, flap, spin, swing].forEach((v) => v.setValue(0)),
    [id],
  );

  if (!id) return null;
  const a = POSES[pose];
  // muestra la versión normal o la reflejada según hacia dónde mira
  const facing = (mirror: boolean) =>
    faceDir ? faceDir.interpolate({ inputRange: [-1, -0.001, 0.001, 1], outputRange: mirror ? [1, 1, 0, 0] : [0, 0, 1, 1] }) : mirror ? 0 : 1;
  const hatWobble = (deg: number) => [
    {
      rotate: wob.interpolate({
        inputRange: [-1, 1],
        outputRange: [`${-deg}deg`, `${deg}deg`],
      }),
    },
  ];

  if (part === 'back') {
    if (id !== 'san-valentin') return null;
    const wing =
      'M 0 0 C -6 -34 -40 -78 -96 -92 C -90 -80 -94 -70 -88 -64 C -100 -60 -102 -48 -90 -42 C -100 -36 -100 -24 -86 -20 C -92 -12 -86 -2 -70 -2 C -50 6 -22 8 0 0 Z';
    const feathers = 'M -14 -8 C -34 -24 -54 -44 -76 -72 M -24 -4 C -44 -14 -64 -28 -84 -44 M -30 0 C -50 -4 -66 -10 -82 -22';
    return (
      <Anchor at={a.back} s={s}>
        <Piece
          box={[-108, -100, 118, 112]}
          pivot={[0, 0]}
          s={s}
          transform={[
            { translateX: 30 * s },
            { translateY: -10 * s },
            { scale: 1.2 },
            {
              rotate: flap.interpolate({
                inputRange: [0, 1],
                outputRange: ['-4deg', '-24deg'],
              }),
            },
          ]}
        >
          <Path d={wing} fill="#f1f5fb" stroke="#a9bbd8" strokeWidth={3} strokeLinejoin="round" />
        </Piece>
        <Piece
          box={[-108, -100, 118, 112]}
          pivot={[0, 0]}
          s={s}
          transform={[
            { scale: 1.45 },
            {
              rotate: flap.interpolate({
                inputRange: [0, 1],
                outputRange: ['-8deg', '12deg'],
              }),
            },
          ]}
        >
          <Path d={wing} fill="#ffffff" stroke="#a9bbd8" strokeWidth={3} strokeLinejoin="round" />
          <Path d={feathers} stroke="#c5d3ea" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </Piece>
      </Anchor>
    );
  }

  const face =
    id === 'muertos' ? <CalaveraPaint a={a} /> : id === 'dia-del-maestro' ? <RoundGlasses a={a} /> : id === 'programador' ? <PixelShades a={a} /> : null;

  return (
    <>
      {face ? (
        <Overlay s={s} w={w} h={h}>
          {face}
        </Overlay>
      ) : null}
      {id === 'navidad' || id === 'independencia' || id === 'revolucion' ? (
        <Anchor at={a.mouth} rot={a.rot} s={s}>
          <Piece box={[-64, -16, 128, 88]} s={s}>
            {id === 'navidad' ? <Beard /> : <Mustache />}
          </Piece>
        </Anchor>
      ) : null}
      {id === 'independencia' || id === 'revolucion' || id === 'san-valentin' ? (
        <Anchor at={a.neck} rot={a.rot} s={s}>
          {id === 'independencia' ? (
            [false, true].map((m) => (
              <Piece key={String(m)} box={[-50, -20, 100, 58]} s={s} opacity={facing(m)}>
                <TricolorBow mirror={m} />
              </Piece>
            ))
          ) : (
            <Piece box={[-50, -20, 100, 58]} s={s}>
              {id === 'revolucion' ? <Bandana /> : <HeartPendant />}
            </Piece>
          )}
        </Anchor>
      ) : null}
      <Anchor at={a.crown} rot={a.rot} s={s}>
        {id === 'halloween' ? (
          <Piece box={[-110, -160, 220, 186]} pivot={[0, 0]} s={s} transform={hatWobble(3)}>
            <WitchHat />
          </Piece>
        ) : id === 'navidad' ? (
          <>
            <Piece box={[-116, -114, 196, 120]} s={s}>
              <SantaBag />
            </Piece>
            <Piece
              box={[-134, -80, 44, 44]}
              pivot={[-98, -68]}
              s={s}
              transform={[
                {
                  rotate: swing.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-16deg', '16deg'],
                  }),
                },
              ]}
            >
              <Pompom />
            </Piece>
          </>
        ) : id === 'independencia' || id === 'revolucion' ? (
          <>
            <Piece box={[-154, -108, 308, 134]} pivot={[0, 0]} s={s} transform={hatWobble(2)}>
              <Sombrero felt={id === 'revolucion'} />
            </Piece>
            {id === 'independencia'
              ? [false, true].map((m) => (
                  <Piece key={String(m)} box={[-154, -108, 308, 134]} pivot={[0, 0]} s={s} transform={hatWobble(2)} opacity={facing(m)}>
                    <TricolorBand mirror={m} />
                  </Piece>
                ))
              : null}
          </>
        ) : id === 'anio-nuevo' ? (
          <Piece box={[-40, -130, 110, 140]} pivot={[10, 0]} s={s} transform={hatWobble(5)}>
            <PartyHat />
          </Piece>
        ) : id === 'reyes' ? (
          <Piece box={[-60, -66, 120, 70]} pivot={[0, 0]} s={s} transform={hatWobble(2)}>
            <Crown />
          </Piece>
        ) : id === 'dia-del-nino' ? (
          <>
            <Piece box={[-68, -64, 172, 74]} s={s}>
              <Beanie />
            </Piece>
            <Piece
              box={[-40, -70, 80, 16]}
              pivot={[0, -62]}
              s={s}
              transform={[
                {
                  scaleX: spin.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [1, 0.05, -1, 0.05, 1],
                  }),
                },
              ]}
            >
              <Propeller />
            </Piece>
          </>
        ) : id === 'dia-del-maestro' ? (
          <>
            <Piece box={[-88, -66, 180, 76]} s={s}>
              <GradCap />
            </Piece>
            <Piece
              box={[54, -38, 24, 46]}
              pivot={[66, -36]}
              s={s}
              transform={[
                {
                  rotate: swing.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['14deg', '-14deg'],
                  }),
                },
              ]}
            >
              <Tassel />
            </Piece>
          </>
        ) : id === 'san-valentin' ? (
          <Piece
            box={[-60, -60, 120, 40]}
            s={s}
            transform={[
              {
                translateY: wob.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-5 * s, 3 * s],
                }),
              },
            ]}
          >
            <Ellipse cx={0} cy={-40} rx={46} ry={11} fill="none" stroke="rgba(255,216,77,0.35)" strokeWidth={13} />
            <Ellipse cx={0} cy={-40} rx={46} ry={11} fill="none" stroke="#ffd84d" strokeWidth={6} />
          </Piece>
        ) : id === 'primavera' || id === 'dia-de-las-madres' || id === 'muertos' ? (
          <Piece box={[-90, -44, 180, 52]} s={s}>
            <FlowerCrown kind={id === 'primavera' ? 'spring' : id === 'muertos' ? 'marigold' : 'roses'} />
          </Piece>
        ) : null}
      </Anchor>
    </>
  );
}

/** Accesorios del vestuario actual para una pose (detrás o delante del cuerpo). */
export const Outfit = memo(OutfitImpl);

// ───────────────────────────── partículas ambientales ─────────────────────────────

const SPOTS = [0.08, 0.72, 0.36, 0.95];

function AmbientImpl({ size, active, color }: { size: number; active: boolean; color: string }) {
  const costume = useCostume();
  const vals = useValues(SPOTS.length);
  const mode = costume?.ambient.mode ?? 'rise';
  const dur = mode === 'fly' ? 5200 : 4200;
  useLoops(
    active && !!costume,
    () =>
      vals.map((v, i) =>
        Animated.sequence([
          wait(i * (dur / SPOTS.length)),
          Animated.timing(v, {
            toValue: 1,
            duration: dur,
            easing: Easing.linear,
            useNativeDriver: ND,
          }),
          to(v, 0, 0),
        ]),
      ),
    () => vals.forEach((v) => v.setValue(0)),
    [costume?.id],
  );
  if (!costume || !active) return null;
  const fs = Math.max(11, size * 0.15);
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {vals.map((v, i) => {
        const x0 = SPOTS[i] * size - fs / 2;
        const sway = (i % 2 ? 1 : -1) * size * 0.08;
        const motion =
          mode === 'fall'
            ? [
                {
                  translateX: v.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [x0, x0 + sway, x0, x0 - sway, x0],
                  }),
                },
                {
                  translateY: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-size * 0.35, size * 0.9],
                  }),
                },
                {
                  rotate: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', i % 2 ? '200deg' : '-160deg'],
                  }),
                },
              ]
            : mode === 'rise'
              ? [
                  {
                    translateX: v.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [x0, x0 + sway, x0 - sway * 0.5],
                    }),
                  },
                  {
                    translateY: v.interpolate({
                      inputRange: [0, 1],
                      outputRange: [size * 0.75, -size * 0.45],
                    }),
                  },
                  {
                    scale: v.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0.4, 1, 0.8],
                    }),
                  },
                ]
              : [
                  {
                    translateX: v.interpolate({
                      inputRange: [0, 1],
                      outputRange: i % 2 ? [size * 1.15, -size * 0.3] : [-size * 0.3, size * 1.15],
                    }),
                  },
                  {
                    translateY: v.interpolate({
                      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                      outputRange: [0, -10, 4, -12, 2, -6].map((d) => size * (0.05 + (i % 3) * 0.12) + d * (size / 100)),
                    }),
                  },
                  { scaleX: i % 2 ? 1 : -1 },
                ];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              opacity: v.interpolate({
                inputRange: [0, 0.1, 0.85, 1],
                outputRange: [0, 0.9, 0.9, 0],
              }),
              transform: motion,
            }}
          >
            <Text
              style={
                costume.ambient.text
                  ? {
                      fontSize: fs * 0.8,
                      fontWeight: '800',
                      fontFamily: MONO,
                      color,
                    }
                  : { fontSize: fs }
              }
            >
              {costume.ambient.items[i % costume.ambient.items.length]}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

export const Ambient = memo(AmbientImpl);
