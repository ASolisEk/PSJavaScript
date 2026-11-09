/** Piezas del juego del dron: estrellas, selector de velocidad, iconos de mejoras y logros. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import type { GameTheme } from '../../core/game/api';
import { ACHIEVEMENTS, unlockedAchievements } from '../../core/game/achievements';
import type { EntityId, ItemId, UnlockId } from '../../core/game/world';
import type { GameSpeed } from '../../store/game';
import { BORDER, RADIUS, useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { IconName, tint, Tooltip } from '../ui';
import { EntitySprite, ItemIcon } from './art';

export const SPEEDS: { id: GameSpeed; label: string; icon: IconName }[] = [
  { id: 'slow', label: 'Lento', icon: 'walk-outline' },
  { id: 'normal', label: 'Normal', icon: 'bicycle-outline' },
  { id: 'fast', label: 'Rápido', icon: 'car-sport-outline' },
  { id: 'instant', label: 'Instante', icon: 'flash-outline' },
];

export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  const t = useTheme();
  return (
    <Text style={{ color: t.warning, fontSize: size, letterSpacing: 1, lineHeight: size * 1.25 }} accessibilityLabel={`${n} de 3 estrellas`}>
      {'★'.repeat(n)}
      <Text style={{ color: t.border }}>{'★'.repeat(3 - n)}</Text>
    </Text>
  );
}

/** Selector de velocidad: iconos (con la etiqueta de la activa) o un solo botón que rota. */
export function SpeedPicker({ value, onChange, cycle }: { value: GameSpeed; onChange(s: GameSpeed): void; cycle?: boolean }) {
  const t = useTheme();
  if (cycle) {
    const i = SPEEDS.findIndex((s) => s.id === value);
    const s = SPEEDS[i];
    return (
      <Pressable
        onPress={() => onChange(SPEEDS[(i + 1) % SPEEDS.length].id)}
        accessibilityRole="button"
        accessibilityLabel={`Velocidad: ${s.label}. Toca para cambiar`}
        style={({ pressed }) => [styles.speedCycle, { borderColor: t.border, backgroundColor: pressed ? t.surfaceAlt : t.surface }]}
      >
        <Ionicons name={s.icon} size={16} color={t.accentDark} />
        <Text style={{ color: t.accentDark, fontWeight: '800', fontSize: 12, marginLeft: 5 }}>{s.label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={[styles.speed, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
      {SPEEDS.map((s) => {
        const on = s.id === value;
        return (
          <Tooltip key={s.id} text={`Velocidad: ${s.label}`}>
            <Pressable
              onPress={() => onChange(s.id)}
              accessibilityRole="button"
              accessibilityLabel={`Velocidad: ${s.label}`}
              accessibilityState={{ selected: on }}
              style={[styles.speedOpt, { backgroundColor: on ? t.surface : 'transparent', borderColor: on ? t.accent : 'transparent' }]}
            >
              <Ionicons name={s.icon} size={15} color={on ? t.accentDark : t.textMuted} />
              {on ? <Text style={{ color: t.accentDark, fontWeight: '800', fontSize: 12, marginLeft: 4 }}>{s.label}</Text> : null}
            </Pressable>
          </Tooltip>
        );
      })}
    </View>
  );
}

/** Dibujo de cada mejora de la granja libre. */
export function UnlockIcon({ id, theme, color }: { id: UnlockId; theme: GameTheme; color: string }) {
  const entity: Partial<Record<UnlockId, EntityId>> = { trees: 'tree', carrots: 'carrot', pumpkins: 'pumpkin', sunflowers: 'sunflower', cactus: 'cactus', mazes: 'treasure', polyculture: 'bush' };
  const item: Partial<Record<UnlockId, ItemId>> = { watering: 'water', fertilizer: 'fertilizer' };
  if (entity[id]) return <EntitySprite type={entity[id]!} theme={theme} size={26} />;
  if (item[id]) return <ItemIcon item={item[id]!} theme={theme} size={22} />;
  return <Ionicons name={id === 'expand' ? 'expand-outline' : 'speedometer-outline'} size={20} color={color} />;
}

/** Logros conseguidos y por conseguir. */
export function TrophiesModal({ progress, onClose }: { progress: Record<string, { stars: number } | undefined>; onClose(): void }) {
  const t = useTheme();
  const got = new Set(unlockedAchievements(progress));
  return (
    <ModalShell title={`Logros (${got.size} de ${ACHIEVEMENTS.length})`} onClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {ACHIEVEMENTS.map((a) => {
          const on = got.has(a.id);
          return (
            <View key={a.id} style={[styles.trophy, { borderColor: on ? tint(t.warning, 0.6) : t.border, backgroundColor: on ? tint(t.warning, 0.1) : t.surfaceAlt, opacity: on ? 1 : 0.7 }]}>
              <View style={[styles.trophyIcon, { backgroundColor: on ? t.warning : t.border }]}>
                <Ionicons name={(on ? a.icon : 'lock-closed') as IconName} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '800', fontSize: 14 }}>{a.title}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>{a.description}</Text>
              </View>
              {on ? <Ionicons name="checkmark-circle" size={20} color={t.success} /> : null}
            </View>
          );
        })}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  speed: { flexDirection: 'row', borderRadius: RADIUS.md, borderWidth: BORDER, padding: 3 },
  speedOpt: { flexDirection: 'row', alignItems: 'center', height: 30, paddingHorizontal: 8, borderRadius: 9, borderWidth: BORDER },
  speedCycle: { flexDirection: 'row', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: BORDER },
  trophy: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10 },
  trophyIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
