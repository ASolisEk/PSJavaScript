/** Dibujo de la granja (o la mina): suelos, plantas, calabazas gigantes, laberinto y el dron. */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { GameTheme, THEMES } from '../../core/game/api';
import type { Dir, World } from '../../core/game/world';
import { RADIUS, useTheme } from '../../ui/theme';

const GROUND: Record<GameTheme, { grassland: [string, string]; soil: [string, string] }> = {
  // [tema claro, tema oscuro]
  farm: { grassland: ['#bfe89a', '#3c5a2a'], soil: ['#b98a5e', '#6b4a2f'] },
  mine: { grassland: ['#c9ced6', '#4a515c'], soil: ['#8b95a3', '#2f3540'] },
};
const ROTATE: Record<Dir, string> = { North: '-90deg', East: '0deg', South: '90deg', West: '180deg' };

export default function WorldView({ world, theme, version, maxSize = 520 }: { world: World; theme: GameTheme; version: number; maxSize?: number }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const n = world.size;
  const side = Math.max(120, Math.min(maxSize, width || maxSize));
  const cell = Math.floor(side / n);
  const board = cell * n;
  const names = THEMES[theme];
  const ground = GROUND[theme];

  // el dron se desliza a su nueva casilla (salvo cuando da la vuelta por el borde)
  const [pos] = useState(() => new Animated.ValueXY({ x: world.x * cell, y: (n - 1 - world.y) * cell }));
  const last = useRef({ x: world.x, y: world.y, cell });
  useEffect(() => {
    const target = { x: world.x * cell, y: (n - 1 - world.y) * cell };
    const prev = last.current;
    const near = prev.cell === cell && Math.abs(prev.x - world.x) + Math.abs(prev.y - world.y) === 1;
    last.current = { x: world.x, y: world.y, cell };
    if (near) Animated.timing(pos, { toValue: target, duration: 120, useNativeDriver: Platform.OS !== 'web' }).start();
    else pos.setValue(target);
  }, [world.x, world.y, cell, n, pos, version]);

  const rows: React.ReactNode[] = [];
  for (let row = 0; row < n; row++) {
    const y = n - 1 - row;
    const cells: React.ReactNode[] = [];
    for (let x = 0; x < n; x++) {
      const c = world.cells[x][y];
      const e = c.entity;
      const bg = ground[c.ground][t.dark ? 1 : 0];
      const inGroup = e?.type === 'pumpkin' && e.group !== undefined;
      const w = c.walls ?? 0;
      const wallColor = t.dark ? '#0f1a12' : '#2f4a2a';
      const scale = e ? 0.45 + 0.55 * Math.min(1, e.progress) : 1;
      cells.push(
        <View
          key={x}
          style={[
            styles.cell,
            {
              width: cell,
              height: cell,
              backgroundColor: e?.type === 'hedge' ? (theme === 'farm' ? '#5f8f4e' : '#6b5d52') : bg,
              borderTopWidth: w & 1 ? 3 : StyleSheet.hairlineWidth,
              borderRightWidth: w & 2 ? 3 : StyleSheet.hairlineWidth,
              borderBottomWidth: w & 4 ? 3 : StyleSheet.hairlineWidth,
              borderLeftWidth: w & 8 ? 3 : StyleSheet.hairlineWidth,
              borderTopColor: w & 1 ? wallColor : 'rgba(0,0,0,0.08)',
              borderRightColor: w & 2 ? wallColor : 'rgba(0,0,0,0.08)',
              borderBottomColor: w & 4 ? wallColor : 'rgba(0,0,0,0.08)',
              borderLeftColor: w & 8 ? wallColor : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          {c.water > 0 ? <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1c8ef6', opacity: 0.08 + c.water * 0.32 }]} /> : null}
          {e && !inGroup && e.type !== 'hedge' ? (
            <Text style={{ fontSize: cell * 0.6 * scale, lineHeight: cell * 0.8, opacity: e.progress >= 1 ? 1 : 0.75 }} selectable={false}>
              {names.entityEmoji[e.type]}
            </Text>
          ) : null}
          {e && e.progress < 1 && cell >= 28 ? <View style={[styles.grow, { width: (cell - 8) * e.progress, backgroundColor: t.primary }]} /> : null}
        </View>,
      );
    }
    rows.push(
      <View key={row} style={{ flexDirection: 'row' }}>
        {cells}
      </View>,
    );
  }

  return (
    <View onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))} style={{ width: '100%', alignItems: 'center' }}>
      <View style={[styles.board, { width: board, height: board, borderColor: t.border }]}>
        {rows}
        {/* calabazas (o geodas) gigantes: una sola figura del tamaño del cuadrado */}
        {[...world.groups.values()].map((g) => (
          <View key={`${g.x},${g.y},${g.size}`} pointerEvents="none" style={[styles.group, { left: g.x * cell, top: (n - g.y - g.size) * cell, width: g.size * cell, height: g.size * cell }]}>
            <Text style={{ fontSize: g.size * cell * 0.72, lineHeight: g.size * cell * 0.9 }} selectable={false}>
              {names.entityEmoji.pumpkin}
            </Text>
          </View>
        ))}
        {world.intruder ? <IntruderDrone world={world} cell={cell} n={n} /> : null}
        <Animated.View pointerEvents="none" style={[styles.drone, { width: cell, height: cell, transform: pos.getTranslateTransform(), opacity: world.hideMain ? 0 : 1 }]}>
          <View style={[styles.droneBody, { width: cell * 0.62, height: cell * 0.62, borderRadius: cell * 0.2, backgroundColor: t.accent, borderColor: t.surface }]}>
            <Ionicons name="paper-plane" size={cell * 0.32} color="#fff" style={{ transform: [{ rotate: ROTATE[world.facing] }] }} />
          </View>
          {[
            [0.12, 0.12],
            [0.88, 0.12],
            [0.12, 0.88],
            [0.88, 0.88],
          ].map(([px, py], i) => (
            <View key={i} style={[styles.rotor, { left: cell * px - cell * 0.09, top: cell * py - cell * 0.09, width: cell * 0.18, height: cell * 0.18, borderRadius: cell * 0.09, borderColor: t.accent }]} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

/** Dron intruso: rojo mientras está activo; verde con escudo cuando lo hackeas o lo apagas. */
function IntruderDrone({ world, cell, n }: { world: World; cell: number; n: number }) {
  const t = useTheme();
  const it = world.intruder!;
  const safe = it.hacked || it.shutdown;
  const color = safe ? t.success : t.danger;
  return (
    <View pointerEvents="none" style={[styles.drone, { width: cell, height: cell, left: it.x * cell, top: (n - 1 - it.y) * cell }]}>
      <View style={[styles.droneBody, { width: cell * 0.62, height: cell * 0.62, borderRadius: cell * 0.31, backgroundColor: color, borderColor: t.surface }]}>
        <Ionicons name={safe ? 'shield-checkmark' : 'bug'} size={cell * 0.34} color="#fff" />
      </View>
      {[
        [0.12, 0.12],
        [0.88, 0.12],
        [0.12, 0.88],
        [0.88, 0.88],
      ].map(([px, py], i) => (
        <View key={i} style={[styles.rotor, { left: cell * px - cell * 0.09, top: cell * py - cell * 0.09, width: cell * 0.18, height: cell * 0.18, borderRadius: cell * 0.09, borderColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderWidth: 2, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  cell: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  grow: { position: 'absolute', left: 4, bottom: 3, height: 3, borderRadius: 2, opacity: 0.8 },
  group: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  drone: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  droneBody: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  rotor: { position: 'absolute', borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
});
