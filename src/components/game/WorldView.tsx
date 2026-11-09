/**
 * Dibujo de la granja (o la mina): suelos a cuadros, surcos de tierra, agua, plantas que
 * crecen, calabazas gigantes, laberinto, coordenadas de los ejes y los drones.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import type { GameTheme } from '../../core/game/api';
import type { GroundId, World } from '../../core/game/world';
import { RADIUS, useTheme } from '../../ui/theme';
import { EntitySprite, stageOf } from './art';
import Drone from './Drone';

type Pair = [string, string];
/** Colores por tema del juego: [claro, oscuro], cada uno con dos tonos para el cuadriculado. */
const SKIN: Record<
  GameTheme,
  { grassland: [Pair, Pair]; soil: [Pair, Pair]; furrow: Pair; path: Pair; wall: Pair; frame: Pair; frameEdge: Pair; giant: string }
> = {
  farm: {
    grassland: [
      ['#c3ea9e', '#b6e28d'],
      ['#3f5f2c', '#395727'],
    ],
    soil: [
      ['#c49466', '#b88859'],
      ['#6f4d31', '#664629'],
    ],
    furrow: ['rgba(90,55,25,0.22)', 'rgba(0,0,0,0.25)'],
    path: ['#e3d3a4', '#5c513a'],
    wall: ['#3f7a33', '#2c5a24'],
    frame: ['#a8763f', '#5a3f26'],
    frameEdge: ['#7a5229', '#3b2817'],
    giant: '#ff9600',
  },
  mine: {
    // suelo de cueva en tonos tierra: así resaltan los minerales grises
    grassland: [
      ['#ddcbab', '#d3c09f'],
      ['#51473a', '#4a4134'],
    ],
    soil: [
      ['#b59c78', '#ab916c'],
      ['#3b3229', '#352d24'],
    ],
    furrow: ['rgba(40,45,60,0.2)', 'rgba(0,0,0,0.3)'],
    path: ['#ece0c8', '#5e5346'],
    wall: ['#5b4a3a', '#231b14'],
    frame: ['#5f5246', '#2c2520'],
    frameEdge: ['#3f352c', '#1a1511'],
    giant: '#b07cff',
  },
};

/** Ancho de la columna y la fila de coordenadas. */
const AXIS = 18;
/** Grosor del marco del tablero. */
const FRAME = 6;

/** Posición animada de un dron: se desliza a la casilla vecina y salta al dar la vuelta por el borde. */
function useSlide(x: number, y: number, cell: number, n: number, version: number) {
  const [pos] = useState(() => new Animated.ValueXY({ x: x * cell, y: (n - 1 - y) * cell }));
  const last = useRef({ x, y, cell });
  useEffect(() => {
    const target = { x: x * cell, y: (n - 1 - y) * cell };
    const prev = last.current;
    const near = prev.cell === cell && Math.abs(prev.x - x) + Math.abs(prev.y - y) === 1;
    last.current = { x, y, cell };
    if (near) Animated.timing(pos, { toValue: target, duration: 120, useNativeDriver: Platform.OS !== 'web' }).start();
    else pos.setValue(target);
  }, [x, y, cell, n, pos, version]);
  return pos;
}

export default function WorldView({ world, theme, version, maxSize = 520, fill = false }: { world: World; theme: GameTheme; version: number; maxSize?: number; fill?: boolean }) {
  const t = useTheme();
  const [area, setArea] = useState({ w: 0, h: 0 });
  const n = world.size;
  const skin = SKIN[theme];
  const d = t.dark ? 1 : 0;

  // el tablero ocupa el espacio disponible (en `fill`, también el alto) y deja lugar para los ejes
  const avail = Math.max(120, Math.min(maxSize, area.w || maxSize, fill && area.h ? area.h : Infinity));
  const axes = (avail - AXIS - FRAME * 2) / n >= 26;
  const cell = Math.floor((avail - (axes ? AXIS : 0) - FRAME * 2) / n);
  const board = cell * n;
  const small = cell < 30;

  const pos = useSlide(world.x, world.y, cell, n, version);
  const it = world.intruder;

  const rows: React.ReactNode[] = [];
  for (let row = 0; row < n; row++) {
    const y = n - 1 - row;
    const cells: React.ReactNode[] = [];
    for (let x = 0; x < n; x++) {
      const c = world.cells[x][y];
      const e = c.entity;
      const odd = (x + y) % 2;
      const maze = e?.type === 'hedge' || (e?.type === 'treasure' && c.walls !== undefined);
      const bg = maze ? skin.path[d] : skin[c.ground][d][odd];
      const inGroup = e?.type === 'pumpkin' && e.group !== undefined;
      const w = c.walls ?? 0;
      const wall = Math.max(3, Math.round(cell * 0.1));
      const wallColor = skin.wall[d];
      const ripe = !!e && e.progress >= 1;
      const stage = e ? stageOf(e.progress) : 'ripe';
      // al crecer la figura aumenta de tamaño (en pasos, para no redibujar en cada cuadro)
      const scale = stage === 'grow' ? Math.round((0.55 + 0.45 * e!.progress) * 20) / 20 : 1;
      const deco = !maze && cell >= 24 ? <GroundDecor theme={theme} ground={c.ground} x={x} y={y} cell={cell} d={d} /> : null;
      cells.push(
        <View
          key={x}
          style={[
            styles.cell,
            {
              width: cell,
              height: cell,
              backgroundColor: bg,
              borderTopWidth: w & 1 ? wall : 0,
              borderRightWidth: w & 2 ? wall : 0,
              borderBottomWidth: w & 4 ? wall : 0,
              borderLeftWidth: w & 8 ? wall : 0,
              borderColor: wallColor,
            },
          ]}
        >
          {/* surcos de la tierra arada (granja) */}
          {c.ground === 'soil' && theme === 'farm' && !maze && cell >= 20
            ? [0.3, 0.55, 0.8].map((f) => <View key={f} style={[styles.furrow, { top: cell * f, backgroundColor: skin.furrow[d], height: Math.max(2, cell * 0.04) }]} />)
            : null}
          {deco}
          {c.water > 0 ? <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1c8ef6', opacity: 0.06 + c.water * 0.3 }]} /> : null}
          {c.water > 0.05 && !small ? <Ionicons name="water" size={cell * 0.2} color="#1c8ef6" style={[styles.drop, { opacity: 0.45 + c.water * 0.55 }]} /> : null}
          {/* brillo detrás de lo que ya se puede cosechar */}
          {ripe && e!.type !== 'hedge' && e!.type !== 'dead_pumpkin' && !inGroup ? (
            <View style={[styles.halo, { width: cell * 0.78, height: cell * 0.78, borderRadius: cell * 0.39, backgroundColor: e!.type === 'treasure' ? '#ffd84d' : '#ffffff', opacity: e!.type === 'treasure' ? 0.55 : t.dark ? 0.1 : 0.32 }]} />
          ) : null}
          {e && !inGroup && e.type !== 'hedge' ? (
            <View style={{ transform: [{ scale }], opacity: stage === 'grow' ? 0.9 : 1 }}>
              <EntitySprite type={e.type} theme={theme} size={Math.round(cell * 0.88)} stage={stage} n={e.number} />
            </View>
          ) : null}
          {e && e.progress < 1 && cell >= 24 ? (
            <View style={[styles.growTrack, { width: cell - 10, height: Math.max(3, cell * 0.07) }]}>
              <View style={{ width: `${Math.round(e.progress * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: t.primary }} />
            </View>
          ) : null}
          {/* pétalos del girasol y tamaño del cactus */}
          {e?.number !== undefined && (e.type === 'cactus' || e.type === 'sunflower') && !small ? (
            <View style={[styles.badge, { backgroundColor: t.dark ? '#0d171b' : '#ffffff', borderColor: e.type === 'cactus' ? '#2e9e5b' : '#e0a100' }]}>
              <Text style={{ fontSize: Math.max(9, cell * 0.2), fontWeight: '900', color: t.text }} selectable={false}>
                {e.number}
              </Text>
            </View>
          ) : null}
          {e?.weird && !small ? <View style={[styles.weird, { width: cell * 0.16, height: cell * 0.16, borderRadius: cell * 0.08 }]} /> : null}
        </View>,
      );
    }
    rows.push(
      <View key={row} style={{ flexDirection: 'row' }}>
        {cells}
      </View>,
    );
  }

  const tile = (
    <View style={[styles.frame, { padding: FRAME - 2, backgroundColor: skin.frame[d], borderColor: skin.frameEdge[d] }]}>
      <View style={[styles.board, { width: board, height: board }]}>
        {rows}
        {/* calabazas (o geodas) gigantes: una sola figura del tamaño del cuadrado */}
        {[...world.groups.values()].map((g) => (
          <View
            key={`${g.x},${g.y},${g.size}`}
            pointerEvents="none"
            style={[styles.group, { left: g.x * cell + 2, top: (n - g.y - g.size) * cell + 2, width: g.size * cell - 4, height: g.size * cell - 4, borderColor: skin.giant, backgroundColor: skin.giant + '22' }]}
          >
            <EntitySprite type="pumpkin" theme={theme} size={Math.round(g.size * cell * 0.92)} />
          </View>
        ))}
        {it ? <IntruderSprite world={world} cell={cell} n={n} version={version} theme={theme} /> : null}
        <Animated.View pointerEvents="none" style={[styles.drone, { width: cell, height: cell, transform: pos.getTranslateTransform(), opacity: world.hideMain ? 0 : 1 }]}>
          <Drone size={cell} kind="main" theme={theme} facing={world.facing} accent={t.accent} danger={t.danger} success={t.success} />
        </Animated.View>
      </View>
    </View>
  );

  return (
    <View
      onLayout={(e) => setArea({ w: Math.floor(e.nativeEvent.layout.width), h: Math.floor(e.nativeEvent.layout.height) })}
      style={[{ width: '100%', alignItems: 'center', justifyContent: 'center' }, fill ? { flex: 1, minHeight: 0 } : null]}
    >
      {/* hasta medir el espacio no se dibuja (evita un cuadro con el tamaño equivocado) */}
      {!area.w || (fill && !area.h) ? <View style={{ height: fill ? 0 : Math.min(maxSize, 320) }} /> : axes ? (
        <View>
          <View style={{ flexDirection: 'row' }}>
            {/* eje y (de arriba hacia abajo: n-1 … 0) */}
            <View style={{ width: AXIS, paddingTop: FRAME }}>
              {Array.from({ length: n }, (_, row) => {
                const y = n - 1 - row;
                return <AxisLabel key={y} value={y} size={cell} vertical on={y === world.y} />;
              })}
            </View>
            {tile}
          </View>
          <View style={{ flexDirection: 'row', marginLeft: AXIS + FRAME }}>
            {Array.from({ length: n }, (_, x) => (
              <AxisLabel key={x} value={x} size={cell} on={x === world.x} />
            ))}
          </View>
        </View>
      ) : (
        tile
      )}
    </View>
  );
}

/**
 * Detalles del suelo, siempre iguales en cada casilla: matas en la pradera, guijarros en la
 * roca y perforaciones en la roca perforada. Van en las esquinas para no tapar la planta.
 */
const GroundDecor = memo(function GroundDecor({ theme, ground, x, y, cell, d }: { theme: GameTheme; ground: GroundId; x: number; y: number; cell: number; d: number }) {
  const h = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
  const r1 = (h % 997) / 997;
  const r2 = ((h >>> 10) % 997) / 997;
  const a = { left: cell * (0.07 + r1 * 0.14), top: cell * (0.08 + r2 * 0.12) };
  const b = { left: cell * (0.7 + r2 * 0.12), top: cell * (0.7 + r1 * 0.12) };
  if (theme === 'farm' && ground === 'grassland') {
    const c = d ? 'rgba(170,230,130,0.22)' : 'rgba(60,140,30,0.32)';
    return (
      <>
        <View style={[styles.tuft, a, { width: cell * 0.16, height: cell * 0.14 }]}>
          <View style={[styles.blade, { height: cell * 0.1, backgroundColor: c, transform: [{ rotate: '-24deg' }] }]} />
          <View style={[styles.blade, { height: cell * 0.14, backgroundColor: c }]} />
          <View style={[styles.blade, { height: cell * 0.1, backgroundColor: c, transform: [{ rotate: '24deg' }] }]} />
        </View>
        <View style={[styles.fleck, b, { width: cell * 0.08, height: cell * 0.05, backgroundColor: c }]} />
      </>
    );
  }
  if (theme === 'mine' && ground === 'grassland') {
    const c = d ? 'rgba(255,255,255,0.09)' : 'rgba(60,70,85,0.2)';
    return (
      <>
        <View style={[styles.fleck, a, { width: cell * (0.1 + r2 * 0.05), height: cell * 0.07, backgroundColor: c }]} />
        <View style={[styles.fleck, b, { width: cell * 0.07, height: cell * 0.05, backgroundColor: c }]} />
      </>
    );
  }
  if (theme === 'mine' && ground === 'soil') {
    const hole = { width: cell * 0.13, height: cell * 0.13, borderRadius: cell * 0.065, backgroundColor: d ? 'rgba(0,0,0,0.45)' : 'rgba(35,40,55,0.38)', borderColor: d ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)' };
    return (
      <>
        <View style={[styles.hole, a, hole]} />
        <View style={[styles.hole, b, hole]} />
      </>
    );
  }
  return null;
});

function AxisLabel({ value, size, vertical, on }: { value: number; size: number; vertical?: boolean; on: boolean }) {
  const t = useTheme();
  return (
    <View style={vertical ? { height: size, justifyContent: 'center' } : { width: size, height: AXIS, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 10, fontWeight: on ? '900' : '700', color: on ? t.accent : t.textFaint, textAlign: 'center' }} selectable={false}>
        {value}
      </Text>
    </View>
  );
}

/** Dron intruso: rojo mientras está activo, verde cuando lo hackeas y gris cuando se apaga. */
function IntruderSprite({ world, cell, n, version, theme }: { world: World; cell: number; n: number; version: number; theme: GameTheme }) {
  const t = useTheme();
  const it = world.intruder!;
  const pos = useSlide(it.x, it.y, cell, n, version);
  const state = it.hacked ? 'hacked' : it.shutdown ? 'off' : 'active';
  return (
    <Animated.View pointerEvents="none" style={[styles.drone, { width: cell, height: cell, transform: pos.getTranslateTransform() }]}>
      {state === 'active' ? <View style={[styles.alert, { borderColor: t.danger, width: cell - 4, height: cell - 4, borderRadius: cell * 0.2 }]} /> : null}
      <Drone size={cell} kind="intruder" state={state} theme={theme} facing={it.facing} accent={t.accent} danger={t.danger} success={t.success} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: RADIUS.md, borderWidth: 2 },
  board: { borderRadius: 6, overflow: 'hidden', position: 'relative' },
  cell: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  furrow: { position: 'absolute', left: '12%', right: '12%', borderRadius: 2 },
  drop: { position: 'absolute', left: 3, top: 2 },
  halo: { position: 'absolute' },
  tuft: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 1 },
  blade: { width: 2, borderRadius: 1 },
  fleck: { position: 'absolute', borderRadius: 99 },
  hole: { position: 'absolute', borderWidth: 1.5 },
  growTrack: { position: 'absolute', bottom: 4, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.18)', overflow: 'hidden' },
  badge: { position: 'absolute', right: 3, top: 3, minWidth: 16, paddingHorizontal: 3, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  weird: { position: 'absolute', left: 4, bottom: 4, backgroundColor: '#b07cff', borderWidth: 1.5, borderColor: '#fff' },
  group: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 10, borderStyle: 'dashed' },
  drone: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  alert: { position: 'absolute', borderWidth: 2, borderStyle: 'dashed', opacity: 0.7 },
});
