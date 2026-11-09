/**
 * Ilustraciones del juego (SVG plano con contorno de tinta, como el dron): plantas y
 * minerales con sus etapas de crecimiento, y los iconos de los recursos de cada tema.
 *
 * Todo se dibuja en un lienzo de 100×100. Los dibujos que dependen de un número lo
 * muestran: el girasol tiene tantos pétalos como `measure()` (y el cristal tantos rayos),
 * y el cactus (o la gema) crece según su tamaño.
 */
import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { GameTheme } from '../../core/game/api';
import type { EntityId, ItemId } from '../../core/game/world';

const INK = '#1d2b33';
const SW = 3;

/** Etapa visual de una planta: brote, creciendo o lista para cosechar. */
export type Stage = 'sprout' | 'grow' | 'ripe';

export function stageOf(progress: number): Stage {
  return progress >= 1 ? 'ripe' : progress < 0.25 ? 'sprout' : 'grow';
}

// ───────────────────────────── piezas comunes ─────────────────────────────

function Shadow({ rx = 28, cy = 89 }: { rx?: number; cy?: number }) {
  return <Ellipse cx={50} cy={cy} rx={rx} ry={5} fill="#000" opacity={0.16} />;
}

/** Grupo de círculos con un solo contorno exterior (copas de árbol, arbustos). */
function Cluster({ parts, fill }: { parts: [number, number, number][]; fill: string[] }) {
  return (
    <G>
      {parts.map(([x, y, r], i) => (
        <Circle key={`o${i}`} cx={x} cy={y} r={r + SW} fill={INK} />
      ))}
      {parts.map(([x, y, r], i) => (
        <Circle key={`f${i}`} cx={x} cy={y} r={r} fill={fill[i % fill.length]} />
      ))}
    </G>
  );
}

function Spark({ x, y, s = 1, color = '#ffffff' }: { x: number; y: number; s?: number; color?: string }) {
  const d = `M${x} ${y - 6 * s} L${x + 1.6 * s} ${y - 1.6 * s} L${x + 6 * s} ${y} L${x + 1.6 * s} ${y + 1.6 * s} L${x} ${y + 6 * s} L${x - 1.6 * s} ${y + 1.6 * s} L${x - 6 * s} ${y} L${x - 1.6 * s} ${y - 1.6 * s} Z`;
  return <Path d={d} fill={color} />;
}

const rays = (n: number, cx: number, cy: number, r1: number, r2: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x1: cx + r1 * Math.sin(a), y1: cy - r1 * Math.cos(a), x2: cx + r2 * Math.sin(a), y2: cy - r2 * Math.cos(a) };
  });

// ───────────────────────────── granja ─────────────────────────────

function FarmSprout() {
  return (
    <G>
      <Ellipse cx={50} cy={88} rx={18} ry={5} fill="#7a4f2a" opacity={0.45} />
      <Path d="M50 88 C50 78 50 70 50 62" stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M50 88 C50 78 50 70 50 62" stroke="#4caf50" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <Path d="M50 68 C40 68 30 62 27 51 C39 49 48 57 50 68 Z" fill="#86dd52" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M50 63 C60 63 70 57 73 46 C61 44 52 52 50 63 Z" fill="#6fcf3f" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </G>
  );
}

function Grass({ ripe }: { ripe: boolean }) {
  const blades = [
    'M24 88 C24 72 18 60 10 52 C26 58 34 72 34 88 Z',
    'M34 88 C34 66 32 48 26 32 C40 46 44 66 44 88 Z',
    'M44 88 C46 62 48 40 52 20 C60 42 60 64 56 88 Z',
    'M56 88 C58 68 64 50 74 38 C72 56 68 72 66 88 Z',
    'M64 88 C66 76 74 66 88 60 C82 72 78 80 76 88 Z',
  ];
  return (
    <G>
      <Shadow rx={30} />
      {blades.map((d, i) => (
        <Path key={i} d={d} fill={i % 2 ? '#5bbf2a' : '#86dd52'} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      ))}
      {/* espigas doradas: ya se puede cosechar el heno */}
      {ripe
        ? [
            [52, 22],
            [27, 34],
            [73, 40],
          ].map(([x, y], i) => <Ellipse key={i} cx={x} cy={y} rx={4} ry={6} fill="#f2d14e" stroke={INK} strokeWidth={2} />)
        : null}
    </G>
  );
}

function Bush() {
  return (
    <G>
      <Shadow rx={32} />
      <Path d="M68 40 L80 26" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <Path d="M80 26 C86 24 90 28 88 32 C84 34 80 30 80 26 Z" fill="#6fcf3f" stroke={INK} strokeWidth={2} />
      <Cluster
        parts={[
          [30, 64, 18],
          [70, 64, 18],
          [50, 48, 24],
          [50, 68, 19],
        ]}
        fill={['#3c9f4a', '#3c9f4a', '#4cbb5a', '#45ad52']}
      />
      <Circle cx={42} cy={40} r={6} fill="#9be59f" opacity={0.85} />
      <Circle cx={25} cy={59} r={4} fill="#9be59f" opacity={0.7} />
      <Circle cx={64} cy={58} r={3.5} fill="#9be59f" opacity={0.7} />
    </G>
  );
}

function Tree() {
  return (
    <G>
      <Shadow rx={30} cy={90} />
      <Path d="M43 90 L46 60 L54 60 L57 90 Z" fill="#8b5a2b" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M50 76 L58 68" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Cluster
        parts={[
          [30, 50, 16],
          [70, 50, 16],
          [50, 30, 21],
          [50, 54, 18],
          [35, 34, 13],
          [65, 34, 13],
        ]}
        fill={['#2f8f3f', '#2f8f3f', '#3aa64c', '#349a45', '#3aa64c', '#3aa64c']}
      />
      <Circle cx={42} cy={24} r={6} fill="#7fd28b" opacity={0.85} />
      <Circle cx={26} cy={46} r={4} fill="#7fd28b" opacity={0.7} />
      <Circle cx={62} cy={44} r={3.5} fill="#7fd28b" opacity={0.7} />
    </G>
  );
}

function Carrot() {
  return (
    <G>
      <Shadow rx={20} cy={91} />
      <Path d="M49 42 C43 30 38 20 31 13 C42 16 49 27 53 40 Z" fill="#4caf50" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M49 42 C49 28 51 16 54 6 C60 18 57 30 54 42 Z" fill="#6fcf3f" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M52 43 C58 31 66 23 75 17 C71 29 63 37 56 45 Z" fill="#4caf50" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M35 44 C35 38 65 38 65 44 C65 60 57 78 50 92 C43 78 35 60 35 44 Z" fill="#ff8a1c" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M40 54 L47 54 M53 64 L60 64 M44 74 L50 74" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
      <Path d="M41 46 C41 44 46 43 48 44" stroke="#ffd0a0" strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Pumpkin({ dead }: { dead?: boolean }) {
  const body = dead ? '#9b8a6a' : '#ff9600';
  const rib = dead ? '#6f6048' : '#d96f00';
  const cy = dead ? 66 : 60;
  const ry = dead ? 20 : 26;
  return (
    <G>
      <Shadow rx={34} />
      {dead ? (
        <Path d="M47 48 C44 42 40 40 34 41" stroke="#5d4a2a" strokeWidth={5} strokeLinecap="round" fill="none" />
      ) : (
        <G>
          <Path d="M47 37 C46 29 48 22 54 18 L58 22 C54 26 53 30 54 37 Z" fill="#6b8e23" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M56 30 C64 21 76 23 81 29 C73 36 62 36 56 30 Z" fill="#58cc02" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </G>
      )}
      <Ellipse cx={50} cy={cy} rx={35} ry={ry} fill={body} stroke={INK} strokeWidth={SW} />
      <Ellipse cx={50} cy={cy} rx={20} ry={ry} fill="none" stroke={rib} strokeWidth={2.5} />
      <Ellipse cx={50} cy={cy} rx={7} ry={ry} fill="none" stroke={rib} strokeWidth={2.5} />
      {dead ? (
        <Path d="M30 58 L36 64 L32 70 M64 60 L70 66 L66 72" stroke={INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : (
        <Ellipse cx={34} cy={50} rx={6} ry={4} fill="#fff" opacity={0.4} />
      )}
    </G>
  );
}

function Sunflower({ n }: { n: number }) {
  const k = Math.max(5, Math.min(16, n));
  return (
    <G>
      <Shadow rx={30} cy={91} />
      <Path d="M50 74 C36 82 22 80 13 70 C26 63 40 66 50 74 Z" fill="#4cbb5a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M50 74 C64 82 78 80 87 70 C74 63 60 66 50 74 Z" fill="#3c9f4a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {Array.from({ length: k }, (_, i) => (
        <Ellipse key={i} cx={50} cy={21} rx={k > 12 ? 5.5 : 6.5} ry={15} fill={i % 2 ? '#ffc800' : '#ffd84d'} stroke={INK} strokeWidth={2} transform={`rotate(${(i * 360) / k} 50 45)`} />
      ))}
      <Circle cx={50} cy={45} r={15} fill="#7a4a1e" stroke={INK} strokeWidth={SW} />
      {[
        [45, 41],
        [55, 41],
        [50, 48],
        [44, 49],
        [56, 49],
        [50, 38],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2} fill="#4a2a10" />
      ))}
    </G>
  );
}

function Cactus({ n }: { n: number }) {
  const s = Math.max(0, Math.min(9, n));
  const top = 70 - s * 5.5;
  const ay = top + (86 - top) * 0.45;
  return (
    <G>
      <Shadow rx={22} />
      {s >= 3 ? (
        <G>
          <Path d={`M44 ${ay} H32 V${ay - 12}`} stroke={INK} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={`M44 ${ay} H32 V${ay - 12}`} stroke="#2e9e5b" strokeWidth={7.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      ) : null}
      {s >= 5 ? (
        <G>
          <Path d={`M56 ${ay + 8} H68 V${ay - 8}`} stroke={INK} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={`M56 ${ay + 8} H68 V${ay - 8}`} stroke="#2e9e5b" strokeWidth={7.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      ) : null}
      <Line x1={50} y1={86} x2={50} y2={top} stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <Line x1={50} y1={86} x2={50} y2={top} stroke="#2e9e5b" strokeWidth={20} strokeLinecap="round" />
      <Line x1={45} y1={top + 2} x2={45} y2={84} stroke="#57c784" strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={55} y1={top + 4} x2={55} y2={84} stroke="#1f7d45" strokeWidth={2.5} strokeLinecap="round" />
      {s >= 8 ? <Circle cx={50} cy={top - 4} r={5.5} fill="#ff6fae" stroke={INK} strokeWidth={2} /> : null}
    </G>
  );
}

function Treasure() {
  return (
    <G>
      <Shadow rx={34} />
      <Rect x={20} y={48} width={60} height={36} rx={5} fill="#a0612b" stroke={INK} strokeWidth={SW} />
      <Path d="M20 52 C20 32 80 32 80 52 Z" fill="#b8733a" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={20} y={50} width={60} height={7} fill="#ffc800" stroke={INK} strokeWidth={2} />
      <Rect x={45} y={37} width={10} height={47} fill="#ffc800" stroke={INK} strokeWidth={2} />
      <Rect x={44} y={58} width={12} height={11} rx={2.5} fill="#ffe27a" stroke={INK} strokeWidth={2} />
      <Spark x={80} y={30} s={1.3} color="#fff6b0" />
      <Spark x={22} y={36} s={0.9} color="#fff6b0" />
    </G>
  );
}

// ───────────────────────────── mina ─────────────────────────────

/** Esquirla que asoma de una piedra (el mineral recién «sembrado»). */
function MineSprout({ color }: { color: string }) {
  return (
    <G>
      <Shadow rx={18} />
      <Polygon points="32,88 36,74 50,70 63,76 68,88" fill="#9aa3ad" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Polygon points="45,76 50,52 57,74" fill={color} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Polygon points="50,52 52,68 47,70" fill="#fff" opacity={0.35} />
    </G>
  );
}

function Rocks({ a, b, light }: { a: string; b: string; light: string }) {
  return (
    <G>
      <Polygon points="12,87 17,63 34,51 55,58 59,87" fill={a} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="40,87 45,51 64,37 83,49 88,87" fill={b} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="47,53 64,40 70,48 52,60" fill={light} opacity={0.75} />
      <Polygon points="19,64 34,54 38,60 24,68" fill={light} opacity={0.6} />
    </G>
  );
}

function Stone() {
  return (
    <G>
      <Shadow rx={36} />
      <Rocks a="#a3abb5" b="#bdc4cc" light="#e3e7eb" />
      <Path d="M66 62 L72 70 L68 78" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.5} />
    </G>
  );
}

function Coal() {
  return (
    <G>
      <Shadow rx={34} />
      <Polygon points="14,86 19,64 34,55 48,62 50,86" fill="#2f343b" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="40,86 45,52 61,40 79,51 85,86" fill="#3a4049" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="30,88 35,74 47,70 57,77 55,89" fill="#262a30" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="48,54 61,43 66,50 52,60" fill="#5d6673" />
      <Polygon points="21,65 33,57 36,62 25,68" fill="#5d6673" />
      <Spark x={66} y={60} s={0.8} />
      <Spark x={28} y={75} s={0.6} />
    </G>
  );
}

function Iron() {
  return (
    <G>
      <Shadow rx={36} />
      <Rocks a="#7d8590" b="#8f97a2" light="#b3bac3" />
      <Polygon points="28,70 36,61 45,69 37,77" fill="#dfe8f1" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <Polygon points="58,58 68,49 76,59 65,66" fill="#c3d1de" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <Polygon points="56,78 64,72 70,80 61,85" fill="#dfe8f1" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <Circle cx={48} cy={80} r={2.5} fill="#c0703a" />
      <Circle cx={74} cy={72} r={2} fill="#c0703a" />
    </G>
  );
}

function Copper() {
  return (
    <G>
      <Shadow rx={36} />
      <Rocks a="#868b92" b="#9aa0a7" light="#c3c8cd" />
      {[
        [33, 70, 7],
        [63, 58, 8],
        [60, 79, 5.5],
      ].map(([x, y, r], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={r} fill="#e07b39" stroke={INK} strokeWidth={2.2} />
          <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#ffb27a" />
        </G>
      ))}
      <Circle cx={46} cy={64} r={2.5} fill="#4fb39a" />
      <Circle cx={74} cy={70} r={2} fill="#4fb39a" />
    </G>
  );
}

function Geode({ broken }: { broken?: boolean }) {
  if (broken) {
    return (
      <G>
        <Shadow rx={36} />
        <Path d="M46 30 A30 30 0 0 0 46 88 Z" fill="#6e6457" stroke={INK} strokeWidth={SW} strokeLinejoin="round" transform="rotate(-12 46 59)" />
        <Path d="M54 30 A30 30 0 0 1 54 88 Z" fill="#6e6457" stroke={INK} strokeWidth={SW} strokeLinejoin="round" transform="rotate(12 54 59)" />
        <Path d="M42 40 A18 18 0 0 0 42 76 Z" fill="#4a4060" transform="rotate(-12 46 59)" />
        <Path d="M58 40 A18 18 0 0 1 58 76 Z" fill="#4a4060" transform="rotate(12 54 59)" />
      </G>
    );
  }
  const star = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 9 : 21;
    const a = (i / 16) * Math.PI * 2;
    return `${50 + r * Math.sin(a)},${57 - r * Math.cos(a)}`;
  }).join(' ');
  return (
    <G>
      <Shadow rx={34} />
      <Circle cx={50} cy={57} r={32} fill="#8b7d6b" stroke={INK} strokeWidth={SW} />
      {[
        [26, 46],
        [74, 50],
        [30, 74],
        [70, 76],
        [50, 28],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.2} fill="#a99a84" />
      ))}
      <Circle cx={50} cy={57} r={23} fill="#7b4dc9" stroke={INK} strokeWidth={2} />
      <Polygon points={star} fill="#b48cff" />
      <Circle cx={50} cy={57} r={6} fill="#ecdfff" />
      <Spark x={40} y={47} s={0.9} />
    </G>
  );
}

function Crystal({ n }: { n: number }) {
  const k = Math.max(5, Math.min(16, n));
  return (
    <G>
      <Shadow rx={30} />
      {/* rayos de energía: tantos como los pétalos del girasol */}
      {rays(k, 50, 50, 40, 47).map((r, i) => (
        <Line key={i} {...r} stroke="#ffd84d" strokeWidth={3.5} strokeLinecap="round" />
      ))}
      <Polygon points="29,42 36,50 36,76 29,83 22,76 22,50" fill="#2aa9d8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Polygon points="71,46 78,54 78,77 71,83 64,77 64,54" fill="#2aa9d8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Polygon points="50,16 61,30 61,72 50,84 39,72 39,30" fill="#38c6f4" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="50,16 50,84 39,72 39,30" fill="#9be7ff" />
      <Polygon points="50,16 61,30 61,72 50,84 39,72 39,30" fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Spark x={45} y={34} s={0.8} />
    </G>
  );
}

function Gem({ n }: { n: number }) {
  const s = 0.5 + Math.max(0, Math.min(9, n)) * 0.055;
  return (
    <G>
      <Shadow rx={18 + s * 14} />
      <G transform={`translate(50 58) scale(${s}) translate(-50 -58)`}>
        <Polygon points="20,44 35,26 65,26 80,44" fill="#5ff0c8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <Polygon points="20,44 80,44 50,88" fill="#1fbf93" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M35 26 L42 44 L50 26 L58 44 L65 26 M42 44 L50 88 L58 44" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" fill="none" opacity={0.55} />
        <Polygon points="36,30 44,30 40,40" fill="#fff" opacity={0.55} />
      </G>
    </G>
  );
}

// ───────────────────────────── entidades ─────────────────────────────

/** Color del mineral (para la esquirla de la mina). */
const MINE_COLOR: Partial<Record<EntityId, string>> = {
  grass: '#bdc4cc',
  bush: '#3a4049',
  tree: '#dfe8f1',
  carrot: '#e07b39',
  pumpkin: '#7b4dc9',
  sunflower: '#38c6f4',
  cactus: '#1fbf93',
};

function entityArt(type: EntityId, theme: GameTheme, stage: Stage, n: number | undefined) {
  const growing = type !== 'treasure' && type !== 'dead_pumpkin' && type !== 'hedge';
  if (growing && stage === 'sprout') return theme === 'mine' ? <MineSprout color={MINE_COLOR[type] ?? '#bdc4cc'} /> : <FarmSprout />;
  if (theme === 'mine') {
    switch (type) {
      case 'grass':
        return <Stone />;
      case 'bush':
        return <Coal />;
      case 'tree':
        return <Iron />;
      case 'carrot':
        return <Copper />;
      case 'pumpkin':
        return <Geode />;
      case 'dead_pumpkin':
        return <Geode broken />;
      case 'sunflower':
        return <Crystal n={n ?? 10} />;
      case 'cactus':
        return <Gem n={n ?? 5} />;
      case 'treasure':
        return <Treasure />;
      default:
        return null;
    }
  }
  switch (type) {
    case 'grass':
      return <Grass ripe={stage === 'ripe'} />;
    case 'bush':
      return <Bush />;
    case 'tree':
      return <Tree />;
    case 'carrot':
      return <Carrot />;
    case 'pumpkin':
      return <Pumpkin />;
    case 'dead_pumpkin':
      return <Pumpkin dead />;
    case 'sunflower':
      return <Sunflower n={n ?? 10} />;
    case 'cactus':
      return <Cactus n={n ?? 5} />;
    case 'treasure':
      return <Treasure />;
    default:
      return null;
  }
}

/** Planta o mineral de una casilla. `n`: pétalos (girasol/cristal) o tamaño (cactus/gema). */
export const EntitySprite = memo(function EntitySprite({ type, theme, size, stage = 'ripe', n }: { type: EntityId; theme: GameTheme; size: number; stage?: Stage; n?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {entityArt(type, theme, stage, n)}
    </Svg>
  );
});

// ───────────────────────────── recursos ─────────────────────────────

function HayBale() {
  return (
    <G>
      <Rect x={14} y={30} width={72} height={46} rx={12} fill="#f2c14e" stroke={INK} strokeWidth={SW} />
      <Path d="M22 42 H44 M56 42 H78 M22 54 H40 M60 54 H78 M22 66 H44 M56 66 H78" stroke="#c99a2e" strokeWidth={2.5} strokeLinecap="round" />
      <Rect x={33} y={30} width={6} height={46} fill="#b5532d" stroke={INK} strokeWidth={1.8} />
      <Rect x={61} y={30} width={6} height={46} fill="#b5532d" stroke={INK} strokeWidth={1.8} />
    </G>
  );
}

function Logs() {
  const log = (y: number, x: number) => (
    <G>
      <Rect x={x} y={y} width={58} height={22} rx={11} fill="#a0612b" stroke={INK} strokeWidth={SW} />
      <Ellipse cx={x + 58} cy={y + 11} rx={9} ry={11} fill="#e3b27a" stroke={INK} strokeWidth={SW} />
      <Ellipse cx={x + 58} cy={y + 11} rx={4.5} ry={5.5} fill="none" stroke="#a0612b" strokeWidth={2} />
    </G>
  );
  return (
    <G>
      {log(52, 12)}
      {log(28, 22)}
    </G>
  );
}

function Bolt() {
  return (
    <G>
      <Polygon points="58,6 20,56 46,56 36,94 80,40 54,40 66,6" fill="#ffc800" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="58,12 30,50 40,50" fill="#fff" opacity={0.45} />
    </G>
  );
}

function Coin() {
  return (
    <G>
      <Ellipse cx={50} cy={68} rx={30} ry={11} fill="#d99a00" stroke={INK} strokeWidth={SW} />
      <Circle cx={50} cy={46} r={30} fill="#ffc800" stroke={INK} strokeWidth={SW} />
      <Circle cx={50} cy={46} r={20} fill="none" stroke="#e0a100" strokeWidth={3} />
      <Polygon points="50,33 54,43 64,44 56,51 59,61 50,55 41,61 44,51 36,44 46,43" fill="#ffe27a" />
    </G>
  );
}

function Nugget() {
  return (
    <G>
      <Polygon points="16,74 22,52 40,42 58,48 66,72 50,82 28,82" fill="#ffc800" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="52,78 58,58 72,50 86,62 84,80 68,86" fill="#f2b400" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="26,54 40,46 46,52 30,60" fill="#fff3b0" />
      <Spark x={72} y={40} s={1.1} color="#fff6b0" />
    </G>
  );
}

function Drop({ fill, snow }: { fill: string; snow?: boolean }) {
  return (
    <G>
      <Path d="M50 8 C50 8 20 46 20 63 C20 80 33 92 50 92 C67 92 80 80 80 63 C80 46 50 8 50 8 Z" fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {snow ? (
        <Path d="M50 50 V80 M37 57 L63 73 M37 73 L63 57" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
      ) : (
        <Path d="M34 64 C34 56 38 50 42 46" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
      )}
    </G>
  );
}

function Sack() {
  return (
    <G>
      <Path d="M30 30 C24 46 16 62 18 76 C20 88 80 88 82 76 C84 62 76 46 70 30 Z" fill="#c8a165" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M32 30 C36 20 44 14 50 22 C56 14 64 20 68 30 Z" fill="#b48a52" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={30} y={27} width={40} height={7} rx={3} fill="#8b5a2b" stroke={INK} strokeWidth={2} />
      <Path d="M50 74 C50 62 52 54 62 50 C62 62 58 70 50 74 Z" fill="#58cc02" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M50 74 C46 66 40 62 34 62 C36 70 42 74 50 74 Z" fill="#86dd52" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
    </G>
  );
}

function Flask({ liquid, round }: { liquid: string; round?: boolean }) {
  return round ? (
    <G>
      <Rect x={42} y={8} width={16} height={30} rx={3} fill="#e8f4fb" stroke={INK} strokeWidth={SW} />
      <Circle cx={50} cy={62} r={28} fill="#e8f4fb" stroke={INK} strokeWidth={SW} />
      <Path d="M23 64 A27 27 0 0 0 77 64 Z" fill={liquid} />
      <Circle cx={50} cy={62} r={28} fill="none" stroke={INK} strokeWidth={SW} />
      <Circle cx={42} cy={74} r={4} fill="#fff" opacity={0.6} />
      <Circle cx={58} cy={70} r={2.5} fill="#fff" opacity={0.6} />
      <Circle cx={50} cy={50} r={2.5} fill={liquid} />
    </G>
  ) : (
    <G>
      <Path d="M40 8 H60 V36 L82 82 C84 88 80 92 74 92 H26 C20 92 16 88 18 82 L40 36 Z" fill="#e8f4fb" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M30 62 H70 L80 84 C81 88 78 90 74 90 H26 C22 90 19 88 20 84 Z" fill={liquid} />
      <Path d="M40 8 H60 V36 L82 82 C84 88 80 92 74 92 H26 C20 92 16 88 18 82 L40 36 Z" fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Circle cx={44} cy={76} r={4} fill="#fff" opacity={0.6} />
      <Circle cx={58} cy={70} r={2.5} fill="#fff" opacity={0.6} />
    </G>
  );
}

function Gravel() {
  const stones: [number, number, number, string][] = [
    [30, 72, 12, '#a3abb5'],
    [56, 74, 14, '#bdc4cc'],
    [76, 76, 10, '#8f97a2'],
    [42, 54, 11, '#bdc4cc'],
    [64, 52, 9, '#a3abb5'],
  ];
  return (
    <G>
      {stones.map(([x, y, r, c], i) => (
        <G key={i}>
          <Ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill={c} stroke={INK} strokeWidth={2.6} />
          <Ellipse cx={x - r * 0.3} cy={y - r * 0.3} rx={r * 0.35} ry={r * 0.25} fill="#fff" opacity={0.45} />
        </G>
      ))}
    </G>
  );
}

function Ingot() {
  return (
    <G>
      <Polygon points="12,74 26,46 74,46 88,74" fill="#c8642a" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Polygon points="26,46 74,46 66,58 34,58" fill="#f0955a" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M30 50 H48" stroke="#ffd0a8" strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function itemArt(item: ItemId, theme: GameTheme) {
  const mine = theme === 'mine';
  switch (item) {
    case 'hay':
      return mine ? <Gravel /> : <HayBale />;
    case 'wood':
      return mine ? <Coal /> : <Logs />;
    case 'carrot':
      return mine ? <Ingot /> : <Carrot />;
    case 'pumpkin':
      return mine ? <Geode /> : <Pumpkin />;
    case 'power':
      return <Bolt />;
    case 'cactus':
      return mine ? <Gem n={8} /> : <Cactus n={6} />;
    case 'gold':
      return mine ? <Nugget /> : <Coin />;
    case 'water':
      return mine ? <Drop fill="#5fd4f5" snow /> : <Drop fill="#1cb0f6" />;
    case 'fertilizer':
      return mine ? <Flask liquid="#ff9600" /> : <Sack />;
    case 'weird_substance':
      return <Flask liquid="#a35bff" round />;
    default:
      return null;
  }
}

/** Icono de un recurso del inventario. */
export const ItemIcon = memo(function ItemIcon({ item, theme, size = 18 }: { item: ItemId; theme: GameTheme; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {itemArt(item, theme)}
    </Svg>
  );
});
