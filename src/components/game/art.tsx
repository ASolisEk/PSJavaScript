/**
 * Ilustraciones del juego (SVG con contorno de tinta, como el dron): plantas y minerales con
 * sus etapas de crecimiento, y los iconos de los recursos de cada tema.
 *
 * Todo se dibuja en un lienzo de 100×100 con la misma receta: color base, una zona de sombra
 * (abajo a la derecha), un brillo (arriba a la izquierda), detalles propios (vetas, anillos,
 * facetas) y una sombra en el suelo. Los dibujos que dependen de un número lo muestran: el
 * girasol tiene tantos pétalos como `measure()` (y el cristal tantos rayos), y el cactus
 * (o la gema) crece según su tamaño.
 */
import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { GameTheme } from '../../core/game/api';
import type { EntityId, ItemId } from '../../core/game/world';

const INK = '#22313a';
/** Contorno de tinta común a todas las figuras. */
const O = { stroke: INK, strokeWidth: 2.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
/** Contorno fino para los detalles. */
const o = { stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Etapa visual de una planta: brote, creciendo o lista para cosechar. */
export type Stage = 'sprout' | 'grow' | 'ripe';

export function stageOf(progress: number): Stage {
  return progress >= 1 ? 'ripe' : progress < 0.25 ? 'sprout' : 'grow';
}

// ───────────────────────────── piezas comunes ─────────────────────────────

function Shadow({ rx = 28, cy = 90 }: { rx?: number; cy?: number }) {
  return <Ellipse cx={50} cy={cy} rx={rx} ry={5.5} fill="#000" opacity={0.17} />;
}

/** Grupo de círculos con un solo contorno exterior (copas de árbol, arbustos). */
function Cluster({ parts, fill }: { parts: [number, number, number][]; fill: string[] }) {
  return (
    <G>
      {parts.map(([x, y, r], i) => (
        <Circle key={`o${i}`} cx={x} cy={y} r={r + 2.6} fill={INK} />
      ))}
      {parts.map(([x, y, r], i) => (
        <Circle key={`f${i}`} cx={x} cy={y} r={r} fill={fill[i % fill.length]} />
      ))}
    </G>
  );
}

/** Destello de cuatro puntas. */
function Spark({ x, y, s = 1, color = '#ffffff' }: { x: number; y: number; s?: number; color?: string }) {
  const d = `M${x} ${y - 6 * s} L${x + 1.6 * s} ${y - 1.6 * s} L${x + 6 * s} ${y} L${x + 1.6 * s} ${y + 1.6 * s} L${x} ${y + 6 * s} L${x - 1.6 * s} ${y + 1.6 * s} L${x - 6 * s} ${y} L${x - 1.6 * s} ${y - 1.6 * s} Z`;
  return <Path d={d} fill={color} />;
}

const ring = (n: number, cx: number, cy: number, r1: number, r2: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x1: cx + r1 * Math.sin(a), y1: cy - r1 * Math.cos(a), x2: cx + r2 * Math.sin(a), y2: cy - r2 * Math.cos(a) };
  });

/** Roca de tres caras: frente, cara superior clara y lado en sombra. */
function Rock({ pts, top, side, face, light, dark }: { pts: string; top: string; side: string; face: string; light: string; dark: string }) {
  return (
    <G>
      <Polygon points={pts} fill={face} />
      <Polygon points={top} fill={light} />
      <Polygon points={side} fill={dark} />
      <Polygon points={pts} fill="none" {...O} />
    </G>
  );
}

/** Par de rocas (base de piedra, carbón, hierro y cobre). */
function Rocks({ face, light, dark }: { face: string; light: string; dark: string }) {
  return (
    <G>
      <Rock pts="9,89 13,66 30,52 52,56 60,70 58,89" top="13,66 30,52 52,56 44,66 22,72" side="44,66 52,56 60,70 58,89 46,89" face={face} light={light} dark={dark} />
      <Rock pts="40,89 44,56 62,38 82,48 91,70 87,89" top="44,56 62,38 82,48 70,57 54,63" side="70,57 82,48 91,70 87,89 73,89" face={face} light={light} dark={dark} />
    </G>
  );
}

// ───────────────────────────── granja ─────────────────────────────

function FarmSprout() {
  return (
    <G>
      <Shadow rx={22} cy={91} />
      <Path d="M29 90 C29 80 71 80 71 90 C71 94 29 94 29 90 Z" fill="#8a5a2f" {...O} />
      <Path d="M36 86 C42 83 50 83 57 85" stroke="#b9824b" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M50 85 C50 76 50 68 50 60" stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M50 85 C50 76 50 68 50 60" stroke="#4caf50" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Path d="M50 67 C40 68 29 62 26 50 C39 47 49 55 50 67 Z" fill="#8fe05c" {...o} />
      <Path d="M50 67 C44 61 37 56 30 52" stroke="#4a9a2a" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path d="M50 62 C61 62 71 55 74 44 C61 42 51 50 50 62 Z" fill="#6fcf3f" {...o} />
      <Path d="M50 62 C56 56 63 51 70 47" stroke="#3f8f24" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Grass({ ripe }: { ripe: boolean }) {
  const blades: [string, string][] = [
    ['M20 90 C20 76 14 64 6 56 C22 60 30 76 30 90 Z', '#4fae2a'],
    ['M68 90 C70 78 80 68 94 62 C88 74 82 82 80 90 Z', '#4fae2a'],
    ['M28 90 C28 68 24 50 16 36 C32 48 38 70 38 90 Z', '#8fe05c'],
    ['M58 90 C60 70 68 52 80 40 C76 58 72 74 70 90 Z', '#6fcf3f'],
    ['M38 90 C40 64 40 42 42 20 C52 42 52 66 50 90 Z', '#6fcf3f'],
    ['M48 90 C50 62 54 40 60 26 C64 46 62 68 60 90 Z', '#8fe05c'],
  ];
  const ears: [number, number, number][] = [
    [42, 19, 0],
    [16, 35, -22],
    [61, 25, 14],
  ];
  return (
    <G>
      <Shadow rx={34} cy={91} />
      {blades.map(([d, fill], i) => (
        <Path key={i} d={d} fill={fill} {...o} />
      ))}
      <Path d="M44 84 C45 64 45 46 44 30 M32 84 C31 68 28 54 22 44" stroke="#c4f59a" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.85} />
      {/* espigas doradas: ya se puede cosechar el heno */}
      {ripe
        ? ears.map(([x, y, rot], i) => (
            <G key={i} transform={`rotate(${rot} ${x} ${y})`}>
              <Ellipse cx={x} cy={y} rx={4.6} ry={8} fill="#f6d44d" {...o} />
              <Path d={`M${x - 2.4} ${y - 3} L${x + 2.4} ${y - 1} M${x - 2.4} ${y + 1} L${x + 2.4} ${y + 3}`} stroke="#c99a2e" strokeWidth={1.3} strokeLinecap="round" />
            </G>
          ))
        : null}
    </G>
  );
}

function Bush() {
  return (
    <G>
      <Shadow rx={36} />
      <Path d="M66 38 L79 24" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <Path d="M79 24 C86 21 91 26 89 31 C84 34 79 30 79 24 Z" fill="#8fe05c" {...o} />
      <Cluster
        parts={[
          [27, 67, 17],
          [73, 67, 17],
          [50, 46, 23],
          [36, 56, 15],
          [64, 56, 15],
          [50, 70, 18],
        ]}
        fill={['#379444', '#318a3d', '#4cbb5a', '#45ad52', '#3fa34b', '#3a9a46']}
      />
      {/* sombra en la base y brillos arriba */}
      <Path d="M14 72 C24 86 76 86 86 72 C78 80 22 80 14 72 Z" fill="#205f2b" opacity={0.5} />
      <Circle cx={41} cy={36} r={6.5} fill="#b9f2a6" opacity={0.85} />
      <Circle cx={24} cy={60} r={4} fill="#b9f2a6" opacity={0.7} />
      <Circle cx={61} cy={45} r={3.2} fill="#b9f2a6" opacity={0.7} />
      {[
        [58, 63],
        [34, 73],
        [70, 74],
      ].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={3.8} fill="#ff4b4b" {...o} strokeWidth={1.5} />
          <Circle cx={x - 1.2} cy={y - 1.2} r={1.1} fill="#fff" opacity={0.85} />
        </G>
      ))}
    </G>
  );
}

function Tree() {
  return (
    <G>
      <Shadow rx={32} cy={92} />
      <Path d="M39 92 C43 85 45 75 45 60 L55 60 C55 75 57 85 61 92 Z" fill="#8b5a2b" {...O} />
      <Path d="M51 62 L55 62 C55 75 57 85 60 91 L54 91 C52 82 51 72 51 62 Z" fill="#693f1a" opacity={0.85} />
      <Path d="M47 70 L47 80 M50 66 L50 73" stroke="#55310f" strokeWidth={1.6} strokeLinecap="round" />
      <Cluster
        parts={[
          [28, 51, 16],
          [72, 51, 16],
          [50, 28, 21],
          [36, 35, 14],
          [64, 35, 14],
          [50, 53, 19],
        ]}
        fill={['#2a8539', '#257a34', '#3fb052', '#3aa64c', '#349a45', '#2f8f3f']}
      />
      <Path d="M14 56 C24 70 76 70 86 56 C78 65 22 65 14 56 Z" fill="#1c5f29" opacity={0.5} />
      <Circle cx={42} cy={21} r={6.5} fill="#a9edb4" opacity={0.85} />
      <Circle cx={25} cy={45} r={4} fill="#a9edb4" opacity={0.7} />
      <Circle cx={61} cy={31} r={3.4} fill="#a9edb4" opacity={0.7} />
    </G>
  );
}

function Carrot() {
  return (
    <G>
      <Shadow rx={18} cy={93} />
      <Path d="M49 42 C43 30 38 20 30 12 C42 15 49 27 53 40 Z" fill="#3fa34b" {...o} />
      <Path d="M49 42 C49 28 51 16 54 5 C60 17 57 30 54 42 Z" fill="#6fcf3f" {...o} />
      <Path d="M52 43 C58 31 66 23 76 16 C72 28 63 37 56 45 Z" fill="#4cbb5a" {...o} />
      <Path d="M51 38 C51 28 52 18 54 10 M47 38 C43 30 39 23 34 17 M55 40 C60 33 66 26 72 21" stroke="#c4f59a" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.8} />
      <Path d="M34 44 C34 37 66 37 66 44 C66 60 58 78 50 94 C42 78 34 60 34 44 Z" fill="#ff8a1c" {...O} />
      <Path d="M57 40 C62 40 65 41 65 44 C65 60 57 78 50 92 C56 76 59 58 57 40 Z" fill="#dd6500" opacity={0.75} />
      <Path d="M40 47 C40 57 43 67 47 77" stroke="#ffcb94" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Path d="M37 55 L45 56 M54 64 L61 63 M43 73 L50 74" stroke="#a84a00" strokeWidth={1.9} strokeLinecap="round" />
    </G>
  );
}

function Pumpkin({ dead }: { dead?: boolean }) {
  if (dead) {
    return (
      <G>
        <Shadow rx={36} />
        <Path d="M48 56 C44 48 38 46 31 48" stroke="#5d4a2a" strokeWidth={5} strokeLinecap="round" fill="none" />
        <Ellipse cx={30} cy={72} rx={16} ry={15} fill="#8f7c58" {...o} />
        <Ellipse cx={70} cy={72} rx={16} ry={15} fill="#857250" {...o} />
        <Ellipse cx={50} cy={72} rx={18} ry={17} fill="#a8956f" {...o} />
        <Ellipse cx={50} cy={84} rx={28} ry={4} fill="#5d4a2a" opacity={0.35} />
        {[
          [36, 66, 4],
          [62, 78, 3.2],
          [54, 64, 2.4],
        ].map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill="#6f8f5a" opacity={0.85} />
        ))}
        <Path d="M42 70 L47 76 L43 82 M62 66 L66 71" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    );
  }
  return (
    <G>
      <Shadow rx={38} />
      <Path d="M58 30 C70 24 79 30 75 38 C72 43 66 40 68 35" stroke="#3c9f4a" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Path d="M28 31 C34 18 49 20 52 31 C44 38 35 37 28 31 Z" fill="#58cc02" {...o} />
      <Path d="M31 31 C38 28 45 28 50 31" stroke="#3f9a1c" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Ellipse cx={29} cy={62} rx={16} ry={22} fill="#ee8500" {...o} />
      <Ellipse cx={71} cy={62} rx={16} ry={22} fill="#e07800" {...o} />
      <Ellipse cx={40} cy={62} rx={15} ry={25} fill="#ff9d1a" {...o} />
      <Ellipse cx={60} cy={62} rx={15} ry={25} fill="#f59312" {...o} />
      <Ellipse cx={50} cy={62} rx={13} ry={26} fill="#ffad38" {...o} />
      <Ellipse cx={50} cy={81} rx={28} ry={5} fill="#a85200" opacity={0.35} />
      <Path d="M46 38 C45 30 47 24 53 20 L58 24 C54 28 53 32 54 38 Z" fill="#7a9a2e" {...o} />
      <Ellipse cx={37} cy={50} rx={3.6} ry={8} fill="#fff" opacity={0.38} transform="rotate(-14 37 50)" />
    </G>
  );
}

function Sunflower({ n }: { n: number }) {
  const k = Math.max(5, Math.min(16, n));
  return (
    <G>
      <Shadow rx={30} cy={92} />
      <Path d="M50 76 C36 84 22 82 12 72 C26 65 40 68 50 76 Z" fill="#4cbb5a" {...o} />
      <Path d="M50 76 C64 84 78 82 88 72 C74 65 60 68 50 76 Z" fill="#3c9f4a" {...o} />
      <Path d="M48 76 C38 76 28 75 18 73 M52 76 C62 76 72 75 82 73" stroke="#2c7a37" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Circle cx={50} cy={45} r={26} fill="#3c9f4a" {...o} />
      {Array.from({ length: k }, (_, i) => (
        <Path key={i} d="M50 45 C44 34 45 19 50 8 C55 19 56 34 50 45 Z" fill={i % 2 ? '#ffbf00' : '#ffd62e'} {...o} transform={`rotate(${(i * 360) / k} 50 45)`} />
      ))}
      <Circle cx={50} cy={45} r={15} fill="#8a531f" {...O} />
      <Circle cx={50} cy={45} r={9.5} fill="#6b3d14" />
      {ring(8, 50, 45, 12, 12).map((p, i) => (
        <Circle key={i} cx={p.x1} cy={p.y1} r={1.5} fill="#d39a48" />
      ))}
      <Circle cx={46.5} cy={41.5} r={2.6} fill="#a5672a" opacity={0.9} />
    </G>
  );
}

function Cactus({ n }: { n: number }) {
  const s = Math.max(0, Math.min(9, n));
  const top = 70 - s * 5.5;
  const ay = top + (86 - top) * 0.45;
  const arm = (d: string) => (
    <G>
      <Path d={d} stroke={INK} strokeWidth={13.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke="#2e9e5b" strokeWidth={8.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke="#6ad193" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
    </G>
  );
  const spines: number[] = [];
  for (let y = top + 8; y < 82; y += 11) spines.push(y);
  return (
    <G>
      <Shadow rx={24} cy={91} />
      <Ellipse cx={50} cy={88} rx={17} ry={4.5} fill="#c9a25e" {...o} />
      {s >= 3 ? arm(`M44 ${ay} H31 V${ay - 12}`) : null}
      {s >= 5 ? arm(`M56 ${ay + 8} H69 V${ay - 8}`) : null}
      <Line x1={50} y1={86} x2={50} y2={top} stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <Line x1={50} y1={86} x2={50} y2={top} stroke="#2e9e5b" strokeWidth={20.6} strokeLinecap="round" />
      <Line x1={56} y1={top + 2} x2={56} y2={85} stroke="#1c7741" strokeWidth={6} strokeLinecap="round" opacity={0.65} />
      <Line x1={45} y1={top + 1} x2={45} y2={84} stroke="#6ad193" strokeWidth={2.6} strokeLinecap="round" />
      {spines.map((y, i) => (
        <Path key={i} d={`M${i % 2 ? 47 : 53} ${y} l-3 -2.4 M${i % 2 ? 47 : 53} ${y} l3 -2.4`} stroke="#eaffd0" strokeWidth={1.3} strokeLinecap="round" />
      ))}
      {s >= 8 ? (
        <G>
          <Circle cx={50} cy={top - 5} r={6} fill="#ff6fae" {...o} />
          <Circle cx={50} cy={top - 5} r={2.2} fill="#ffd62e" />
        </G>
      ) : null}
    </G>
  );
}

function Treasure() {
  return (
    <G>
      <Shadow rx={38} />
      <Ellipse cx={15} cy={84} rx={7} ry={3.6} fill="#ffc800" {...o} />
      <Ellipse cx={87} cy={86} rx={6} ry={3.2} fill="#ffc800" {...o} />
      <Rect x={18} y={50} width={64} height={35} rx={4} fill="#9a5b27" {...O} />
      <Path d="M70 51 H80 C81 51 81.5 52 81.5 53 V82 C81.5 83 81 84 80 84 H70 Z" fill="#74401a" opacity={0.6} />
      <Path d="M19 63 H81 M19 74 H81" stroke="#74401a" strokeWidth={1.5} />
      <Path d="M18 52 C18 29 82 29 82 52 Z" fill="#b8733a" {...O} />
      <Path d="M26 46 C29 38 40 34 52 34" stroke="#e3a96e" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Rect x={29} y={36} width={7} height={49} fill="#e0a100" {...o} />
      <Rect x={64} y={36} width={7} height={49} fill="#e0a100" {...o} />
      <Rect x={18} y={49} width={64} height={7} fill="#ffc800" {...o} />
      {[24, 40, 60, 76].map((x) => (
        <Circle key={x} cx={x} cy={52.5} r={1.5} fill="#fff3b0" />
      ))}
      <Rect x={44} y={52} width={12} height={14} rx={3} fill="#ffe27a" {...o} />
      <Circle cx={50} cy={57.5} r={1.9} fill={INK} />
      <Rect x={49.2} y={57.5} width={1.6} height={4.5} fill={INK} />
      <Spark x={82} y={30} s={1.4} color="#fff6b0" />
      <Spark x={20} y={36} s={0.9} color="#fff6b0" />
    </G>
  );
}

// ───────────────────────────── mina ─────────────────────────────

/** Esquirla que asoma de una piedra (el mineral recién «sembrado»). */
function MineSprout({ color }: { color: string }) {
  return (
    <G>
      <Shadow rx={20} cy={91} />
      <Rock pts="30,89 34,75 50,70 64,76 70,89" top="34,75 50,70 64,76 54,80 40,80" side="54,80 64,76 70,89 58,89" face="#9aa3ad" light="#c8d0d8" dark="#7b8590" />
      <Polygon points="44,77 50,50 58,75" fill={color} {...o} />
      <Polygon points="50,50 52,70 46,72" fill="#fff" opacity={0.4} />
      <Spark x={62} y={54} s={0.7} />
    </G>
  );
}

function Stone() {
  return (
    <G>
      <Shadow rx={40} cy={91} />
      <Rocks face="#aeb6bf" light="#dbe1e7" dark="#8b949e" />
      <Ellipse cx={30} cy={87} rx={8} ry={4.6} fill="#c3cad2" {...o} />
      <Path d="M66 62 L72 70 L68 79 M22 74 L28 80" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.55} />
      <Circle cx={56} cy={50} r={2.4} fill="#7fae6a" opacity={0.8} />
      <Circle cx={61} cy={47} r={1.6} fill="#7fae6a" opacity={0.8} />
    </G>
  );
}

function Coal() {
  return (
    <G>
      <Shadow rx={40} cy={91} />
      <Rocks face="#343a42" light="#5d6672" dark="#20242a" />
      <Rock pts="28,90 33,76 46,72 56,78 55,90" top="33,76 46,72 56,78 48,81 38,81" side="48,81 56,78 55,90 47,90" face="#2a2f36" light="#4b535e" dark="#1a1d22" />
      <Path d="M48 58 L60 46 M18 68 L28 60" stroke="#8fa3bb" strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
      <Spark x={67} y={62} s={0.9} />
      <Spark x={27} y={73} s={0.6} />
    </G>
  );
}

/** Cubo de metal visto en perspectiva (para el hierro). */
function Cube({ x, y, s }: { x: number; y: number; s: number }) {
  const h = s * 0.55;
  return (
    <G>
      <Polygon points={`${x},${y - h} ${x + s},${y} ${x},${y + h} ${x - s},${y}`} fill="#f2f6fa" />
      <Polygon points={`${x - s},${y} ${x},${y + h} ${x},${y + h + s} ${x - s},${y + s}`} fill="#c0cedb" />
      <Polygon points={`${x + s},${y} ${x},${y + h} ${x},${y + h + s} ${x + s},${y + s}`} fill="#8fa2b4" />
      <Polygon points={`${x},${y - h} ${x + s},${y} ${x + s},${y + s} ${x},${y + h + s} ${x - s},${y + s} ${x - s},${y}`} fill="none" {...o} />
    </G>
  );
}

function Iron() {
  return (
    <G>
      <Shadow rx={40} cy={91} />
      <Rocks face="#858d97" light="#b5bdc6" dark="#666e78" />
      <Cube x={34} y={66} s={7} />
      <Cube x={66} y={54} s={8} />
      <Cube x={62} y={76} s={5.5} />
      <Circle cx={48} cy={80} r={2.4} fill="#c0703a" />
      <Circle cx={78} cy={72} r={1.9} fill="#c0703a" />
      <Circle cx={22} cy={80} r={1.7} fill="#c0703a" />
    </G>
  );
}

function Copper() {
  return (
    <G>
      <Shadow rx={40} cy={91} />
      <Rocks face="#8f8a84" light="#c1bab0" dark="#6c6761" />
      <Path d="M20 78 L30 70 L38 76 L46 68 M52 74 L62 66 L70 72 L80 64" stroke="#e07b39" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {[
        [32, 68, 6.5],
        [64, 56, 8],
        [60, 80, 5],
      ].map(([x, y, r], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={r} fill="#e07b39" {...o} />
          <Path d={`M${x + r * 0.55} ${y - r * 0.2} A${r * 0.6} ${r * 0.6} 0 0 1 ${x - r * 0.1} ${y + r * 0.6}`} stroke="#a94f1c" strokeWidth={1.6} strokeLinecap="round" fill="none" />
          <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#ffc69b" />
        </G>
      ))}
      <Circle cx={47} cy={62} r={2.4} fill="#4fb39a" />
      <Circle cx={76} cy={76} r={2} fill="#4fb39a" />
    </G>
  );
}

function Geode({ broken }: { broken?: boolean }) {
  if (broken) {
    const half = (flip: number) => (
      <G transform={`translate(${flip * 6} 0) rotate(${flip * 13} 50 60)`}>
        <Path d={flip < 0 ? 'M48 28 C28 30 16 44 16 60 C16 78 30 90 48 90 Z' : 'M52 28 C72 30 84 44 84 60 C84 78 70 90 52 90 Z'} fill="#6e6457" {...O} />
        <Path d={flip < 0 ? 'M48 38 C34 40 26 50 26 60 C26 72 36 80 48 80 Z' : 'M52 38 C66 40 74 50 74 60 C74 72 64 80 52 80 Z'} fill="#d8d0c6" />
        <Path d={flip < 0 ? 'M48 43 C37 45 31 52 31 60 C31 69 39 75 48 75 Z' : 'M52 43 C63 45 69 52 69 60 C69 69 61 75 52 75 Z'} fill="#6f6090" />
        <Path d={flip < 0 ? 'M48 50 C42 51 38 55 38 60 C38 65 42 69 48 69 Z' : 'M52 50 C58 51 62 55 62 60 C62 65 58 69 52 69 Z'} fill="#3f3558" />
      </G>
    );
    return (
      <G>
        <Shadow rx={40} cy={92} />
        {half(-1)}
        {half(1)}
        <Circle cx={50} cy={90} r={2.4} fill="#6e6457" {...o} strokeWidth={1.2} />
        <Circle cx={43} cy={93} r={1.8} fill="#6e6457" />
      </G>
    );
  }
  const star = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 5.5 : 12.5;
    const a = (i / 16) * Math.PI * 2;
    return `${50 + r * Math.sin(a)},${57 - r * Math.cos(a)}`;
  }).join(' ');
  return (
    <G>
      <Shadow rx={36} cy={92} />
      <Path d="M50 23 C68 21 85 37 85 56 C85 77 69 91 50 91 C30 91 15 77 15 56 C15 38 31 25 50 23 Z" fill="#8b7d6b" {...O} />
      <Path d="M62 26 C76 32 85 43 85 56 C85 77 69 91 50 91 C66 84 76 70 76 54 C76 42 70 32 62 26 Z" fill="#6b5f51" opacity={0.6} />
      {[
        [26, 40],
        [22, 62],
        [34, 82],
        [70, 84],
        [48, 28],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.2} fill="#b0a08a" />
      ))}
      <Circle cx={50} cy={57} r={25} fill="#f1e9df" {...o} />
      <Circle cx={50} cy={57} r={21} fill="#cdb0ff" />
      <Circle cx={50} cy={57} r={17} fill="#9a6be0" />
      <Circle cx={50} cy={57} r={12.5} fill="#6a3fc0" />
      <Polygon points={star} fill="#dccaff" />
      <Circle cx={50} cy={57} r={3.4} fill="#f6f0ff" />
      <Spark x={40} y={46} s={0.9} />
      <Spark x={62} y={66} s={0.6} />
    </G>
  );
}

/** Prisma de cristal con una cara clara, otra oscura y la punta brillante. */
function Prism({ x, top, bottom, w, face, light, tip }: { x: number; top: number; bottom: number; w: number; face: string; light: string; tip: string }) {
  const pts = `${x},${top} ${x + w},${top + w * 1.3} ${x + w},${bottom - w} ${x},${bottom} ${x - w},${bottom - w} ${x - w},${top + w * 1.3}`;
  return (
    <G>
      <Polygon points={pts} fill={face} />
      <Polygon points={`${x},${top} ${x},${bottom} ${x - w},${bottom - w} ${x - w},${top + w * 1.3}`} fill={light} />
      <Polygon points={`${x},${top} ${x + w},${top + w * 1.3} ${x},${top + w * 1.9} ${x - w},${top + w * 1.3}`} fill={tip} />
      <Polygon points={pts} fill="none" {...o} />
    </G>
  );
}

function Crystal({ n }: { n: number }) {
  const k = Math.max(5, Math.min(16, n));
  return (
    <G>
      <Shadow rx={34} cy={92} />
      {/* rayos de energía: tantos como los pétalos del girasol */}
      {ring(k, 50, 50, 41, 48).map((r, i) => (
        <Line key={i} {...r} stroke="#ffd84d" strokeWidth={3.6} strokeLinecap="round" />
      ))}
      <Path d="M12 90 C18 78 82 78 88 90 Z" fill="#8b949e" {...O} />
      <Path d="M20 86 C30 82 46 81 60 82" stroke="#c3cad2" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Prism x={27} top={42} bottom={86} w={8} face="#2aa9d8" light="#7fdcf7" tip="#c8f3ff" />
      <Prism x={73} top={46} bottom={86} w={8} face="#2aa9d8" light="#7fdcf7" tip="#c8f3ff" />
      <Prism x={50} top={13} bottom={88} w={12} face="#38c6f4" light="#a5ecff" tip="#e2faff" />
      <Spark x={44} y={36} s={0.9} />
    </G>
  );
}

function Gem({ n }: { n: number }) {
  const s = 0.5 + Math.max(0, Math.min(9, n)) * 0.055;
  return (
    <G>
      <Shadow rx={16 + s * 16} cy={91} />
      <G transform={`translate(50 60) scale(${s}) translate(-50 -60)`}>
        <Polygon points="20,44 34,26 66,26 80,44" fill="#7af5d3" />
        <Polygon points="38,26 62,26 56,36 44,36" fill="#d4fff3" />
        <Polygon points="20,44 80,44 50,90" fill="#1fbf93" />
        <Polygon points="20,44 40,44 50,90" fill="#17a37d" />
        <Polygon points="40,44 60,44 50,90" fill="#4ce0b6" />
        <Path d="M34 26 L44 36 L32 44 M66 26 L56 36 L68 44 M44 36 L50 44 L56 36 M20 44 H80" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" fill="none" opacity={0.55} />
        <Polygon points="20,44 34,26 66,26 80,44 50,90" fill="none" {...O} />
        <Polygon points="27,41 35,30 40,30 33,41" fill="#fff" opacity={0.6} />
      </G>
      <Spark x={50 + 30 * s} y={60 - 30 * s} s={0.5 + s * 0.6} />
    </G>
  );
}

// ───────────────────────────── entidades ─────────────────────────────

/** Color del mineral (para la esquirla de la mina). */
const MINE_COLOR: Partial<Record<EntityId, string>> = {
  grass: '#c8d0d8',
  bush: '#3a4049',
  tree: '#dfe8f1',
  carrot: '#e07b39',
  pumpkin: '#9a6be0',
  sunflower: '#38c6f4',
  cactus: '#1fbf93',
};

function entityArt(type: EntityId, theme: GameTheme, stage: Stage, n: number | undefined) {
  const growing = type !== 'treasure' && type !== 'dead_pumpkin' && type !== 'hedge';
  if (growing && stage === 'sprout') return theme === 'mine' ? <MineSprout color={MINE_COLOR[type] ?? '#c8d0d8'} /> : <FarmSprout />;
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
      <Ellipse cx={50} cy={84} rx={38} ry={5} fill="#000" opacity={0.15} />
      <Path d="M30 30 L25 18 M52 29 L54 16 M70 30 L77 20" stroke="#e0b23c" strokeWidth={3.4} strokeLinecap="round" />
      <Rect x={11} y={28} width={78} height={50} rx={13} fill="#f2c14e" {...O} />
      <Rect x={14} y={31} width={72} height={11} rx={7} fill="#fbe08a" opacity={0.9} />
      <Path d="M72 32 H80 C84 32 86 36 86 40 V66 C86 71 84 75 80 75 H72 Z" fill="#cf9c26" opacity={0.55} />
      <Path d="M20 48 H34 M44 48 H56 M66 48 H80 M20 58 H30 M42 58 H58 M68 58 H80 M22 68 H36 M46 68 H56 M64 68 H78" stroke="#c0902a" strokeWidth={2.2} strokeLinecap="round" />
      <Rect x={32} y={28} width={6.5} height={50} fill="#c0562a" {...o} />
      <Rect x={61.5} y={28} width={6.5} height={50} fill="#c0562a" {...o} />
    </G>
  );
}

function Logs() {
  const log = (x: number, y: number, w: number) => (
    <G>
      <Rect x={x} y={y} width={w} height={22} rx={11} fill="#9a5b27" {...O} />
      <Path d={`M${x + 8} ${y + 4} H${x + w - 18}`} stroke="#c58a52" strokeWidth={2.6} strokeLinecap="round" />
      <Path d={`M${x + 12} ${y + 12} H${x + 26} M${x + 32} ${y + 15} H${x + w - 22}`} stroke="#6e3d16" strokeWidth={1.8} strokeLinecap="round" />
      <Ellipse cx={x + w - 3} cy={y + 11} rx={9} ry={11} fill="#ecc089" {...O} />
      <Ellipse cx={x + w - 3} cy={y + 11} rx={5.4} ry={6.8} fill="none" stroke="#b8793d" strokeWidth={1.8} />
      <Ellipse cx={x + w - 3} cy={y + 11} rx={2} ry={2.6} fill="#b8793d" />
    </G>
  );
  return (
    <G>
      <Ellipse cx={50} cy={86} rx={40} ry={5} fill="#000" opacity={0.15} />
      {log(8, 60, 56)}
      {log(36, 60, 52)}
      {log(22, 36, 56)}
    </G>
  );
}

function Bolt() {
  return (
    <G>
      <Circle cx={50} cy={50} r={36} fill="#fff3b0" opacity={0.55} />
      <Polygon points="58,5 19,56 45,56 36,95 81,40 54,40 66,5" fill="#ffc800" {...O} />
      <Polygon points="57,12 28,51 40,51" fill="#fff6c9" opacity={0.85} />
      <Polygon points="70,44 81,40 43,86 50,58" fill="#e09a00" opacity={0.6} />
    </G>
  );
}

function Coin() {
  const stack = (y: number) => (
    <G>
      <Path d={`M22 ${y} V${y + 8} C22 ${y + 16} 78 ${y + 16} 78 ${y + 8} V${y} Z`} fill="#d99a00" {...O} />
      <Ellipse cx={50} cy={y} rx={28} ry={9} fill="#ffc800" {...O} />
    </G>
  );
  return (
    <G>
      <Ellipse cx={50} cy={90} rx={34} ry={5} fill="#000" opacity={0.15} />
      {stack(76)}
      {stack(64)}
      {stack(52)}
      <Ellipse cx={50} cy={52} rx={19} ry={5.4} fill="none" stroke="#e0a100" strokeWidth={2} />
      <Circle cx={66} cy={30} r={20} fill="#ffc800" {...O} />
      <Circle cx={66} cy={30} r={13.5} fill="none" stroke="#e0a100" strokeWidth={2.4} />
      <Polygon points="66,21 68.6,27 75,27.6 70,31.8 71.6,38 66,34.6 60.4,38 62,31.8 57,27.6 63.4,27" fill="#fff3b0" />
      <Path d="M52 22 A18 18 0 0 1 62 13" stroke="#fff6c9" strokeWidth={2.6} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Nugget() {
  return (
    <G>
      <Ellipse cx={50} cy={88} rx={38} ry={5} fill="#000" opacity={0.15} />
      <Rock pts="12,82 18,56 38,42 60,48 68,72 56,86 26,86" top="18,56 38,42 60,48 50,58 28,62" side="50,58 60,48 68,72 56,86 46,86" face="#ffc800" light="#fff0a0" dark="#d99a00" />
      <Rock pts="54,86 60,62 74,52 90,62 88,82 72,90" top="60,62 74,52 90,62 80,68 66,70" side="80,68 90,62 88,82 72,90" face="#f5b800" light="#ffe88a" dark="#c98a00" />
      <Spark x={74} y={38} s={1.2} color="#fff6b0" />
      <Spark x={26} y={44} s={0.7} color="#fff6b0" />
    </G>
  );
}

function Drop({ fill, dark, snow }: { fill: string; dark: string; snow?: boolean }) {
  return (
    <G>
      <Ellipse cx={50} cy={93} rx={24} ry={4} fill="#000" opacity={0.14} />
      <Path d="M50 6 C50 6 19 45 19 63 C19 80 33 92 50 92 C67 92 81 80 81 63 C81 45 50 6 50 6 Z" fill={fill} {...O} />
      <Path d="M62 26 C72 40 81 54 81 63 C81 80 67 92 50 92 C64 86 72 74 72 60 C72 50 68 38 62 26 Z" fill={dark} opacity={0.7} />
      {snow ? (
        <Path d="M46 50 V82 M32 58 L60 74 M32 74 L60 58 M42 53 L46 57 L50 53 M42 79 L46 75 L50 79" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : (
        <G>
          <Path d="M33 66 C33 57 37 50 42 44" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" fill="none" opacity={0.8} />
          <Circle cx={36} cy={75} r={2.6} fill="#fff" opacity={0.8} />
        </G>
      )}
    </G>
  );
}

function Sack() {
  return (
    <G>
      <Ellipse cx={50} cy={90} rx={36} ry={5} fill="#000" opacity={0.15} />
      <Path d="M32 28 C36 18 44 12 50 21 C56 12 64 18 68 28 Z" fill="#b48a52" {...O} />
      <Path d="M30 30 C23 46 15 63 17 77 C19 90 81 90 83 77 C85 63 77 46 70 30 Z" fill="#cfa96c" {...O} />
      <Path d="M66 34 C74 48 81 64 80 76 C79 84 70 87 58 88 C68 82 72 72 72 62 C72 52 70 42 66 34 Z" fill="#a47c44" opacity={0.6} />
      <Path d="M28 52 C27 60 26 68 27 74" stroke="#ecd2a0" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Rect x={29} y={26} width={42} height={7.5} rx={3.5} fill="#8b5a2b" {...o} />
      <Circle cx={50} cy={62} r={14} fill="#f6ecd4" {...o} />
      <Path d="M50 71 C50 62 52 56 60 53 C60 62 57 68 50 71 Z" fill="#58cc02" {...o} strokeWidth={1.5} />
      <Path d="M50 71 C47 65 43 62 39 62 C40 68 44 71 50 71 Z" fill="#8fe05c" {...o} strokeWidth={1.5} />
    </G>
  );
}

function Flask({ liquid, dark, round }: { liquid: string; dark: string; round?: boolean }) {
  if (round) {
    return (
      <G>
        <Ellipse cx={50} cy={92} rx={26} ry={4} fill="#000" opacity={0.14} />
        <Path d="M40 12 C46 8 48 2 44 0 M58 10 C62 6 60 2 64 0" stroke="#c9a7ff" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.8} />
        <Rect x={41} y={12} width={18} height={26} rx={3} fill="#eaf5fb" {...O} />
        <Rect x={38} y={9} width={24} height={7} rx={3.5} fill="#cfe3ee" {...o} />
        <Circle cx={50} cy={62} r={28} fill="#eaf5fb" {...O} />
        <Path d="M23.4 58 C28 54 34 60 40 57 C46 54 52 60 58 57 C64 54 70 59 76.6 58 A27 27 0 0 1 23.4 58 Z" fill={liquid} />
        <Path d="M66 64 A22 22 0 0 1 44 86 A27 27 0 0 0 76 62 Z" fill={dark} opacity={0.6} />
        <Circle cx={50} cy={62} r={28} fill="none" {...O} />
        <Circle cx={42} cy={74} r={4} fill="#fff" opacity={0.65} />
        <Circle cx={56} cy={68} r={2.6} fill="#fff" opacity={0.65} />
        <Circle cx={48} cy={50} r={2.4} fill={liquid} />
        <Path d="M30 52 A22 22 0 0 1 40 40" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" fill="none" opacity={0.85} />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={50} cy={93} rx={32} ry={4} fill="#000" opacity={0.14} />
      <Path d="M40 12 H60 V36 L83 82 C85 88 81 92 75 92 H25 C19 92 15 88 17 82 L40 36 Z" fill="#eaf5fb" {...O} />
      <Path d="M30 60 C36 56 42 63 50 60 C58 57 64 63 70 60 L81 83 C82 87 79 90 75 90 H25 C21 90 18 87 19 83 Z" fill={liquid} />
      <Path d="M70 60 L81 83 C82 87 79 90 75 90 H58 C68 86 72 76 70 60 Z" fill={dark} opacity={0.6} />
      <Path d="M40 12 H60 V36 L83 82 C85 88 81 92 75 92 H25 C19 92 15 88 17 82 L40 36 Z" fill="none" {...O} />
      <Rect x={37} y={7} width={26} height={7} rx={3.5} fill="#cfe3ee" {...o} />
      <Circle cx={42} cy={76} r={4} fill="#fff" opacity={0.65} />
      <Circle cx={56} cy={70} r={2.6} fill="#fff" opacity={0.65} />
      <Circle cx={50} cy={48} r={2.6} fill={liquid} />
      <Path d="M27 80 L37 60" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" opacity={0.85} />
    </G>
  );
}

function Gravel() {
  const stones: [number, number, number, string, string][] = [
    [26, 76, 13, '#a3abb5', '#7f8893'],
    [76, 78, 11, '#8f97a2', '#6f7782'],
    [52, 74, 16, '#c3cad2', '#98a1ab'],
    [38, 54, 12, '#b9c0c9', '#8f97a2'],
    [64, 52, 10, '#a3abb5', '#7f8893'],
    [50, 36, 8, '#cdd3da', '#a3abb5'],
  ];
  return (
    <G>
      <Ellipse cx={50} cy={90} rx={40} ry={5} fill="#000" opacity={0.15} />
      {stones.map(([x, y, r, c, d], i) => (
        <G key={i}>
          <Ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill={c} {...o} strokeWidth={2.2} />
          <Path d={`M${x + r * 0.75} ${y - r * 0.2} A${r} ${r * 0.82} 0 0 1 ${x - r * 0.2} ${y + r * 0.8} A${r * 0.8} ${r * 0.6} 0 0 0 ${x + r * 0.75} ${y - r * 0.2} Z`} fill={d} opacity={0.75} />
          <Ellipse cx={x - r * 0.3} cy={y - r * 0.32} rx={r * 0.36} ry={r * 0.22} fill="#fff" opacity={0.55} />
        </G>
      ))}
    </G>
  );
}

function Ingot() {
  return (
    <G>
      <Ellipse cx={50} cy={84} rx={42} ry={5} fill="#000" opacity={0.15} />
      <Polygon points="8,76 22,48 78,48 92,76" fill="#c8642a" />
      <Polygon points="22,48 78,48 70,36 30,36" fill="#f6a770" />
      <Polygon points="78,48 92,76 84,64 70,36" fill="#9c4718" />
      <Polygon points="8,76 22,48 30,36 70,36 84,64 92,76" fill="none" {...O} />
      <Path d="M22 48 H78 M78 48 L70 36" stroke={INK} strokeWidth={1.6} opacity={0.6} />
      <Path d="M34 41 H52" stroke="#ffe0c6" strokeWidth={3} strokeLinecap="round" />
      <Path d="M20 68 L26 56" stroke="#e98a54" strokeWidth={3} strokeLinecap="round" />
      <Spark x={76} y={30} s={0.9} />
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
      return mine ? <Drop fill="#5fd4f5" dark="#2ba3c9" snow /> : <Drop fill="#2bb6f8" dark="#0f86c9" />;
    case 'fertilizer':
      return mine ? <Flask liquid="#ff9600" dark="#c96a00" /> : <Sack />;
    case 'weird_substance':
      return <Flask liquid="#a35bff" dark="#6a2fc4" round />;
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
