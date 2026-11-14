/** Piezas del juego del dron: estrellas, selector de velocidad, iconos de mejoras y logros. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { GameTheme, THEMES } from '../../core/game/api';
import { ACHIEVEMENTS, unlockedAchievements } from '../../core/game/achievements';
import { EntityId, ItemId, SPECIES, UnlockId } from '../../core/game/world';
import type { GameSpeed } from '../../store/game';
import { BORDER, RADIUS, useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { IconName, tint, Tooltip } from '../ui';
import { EntitySprite, ItemIcon, Stage } from './art';

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

// ───────────────────────────── almanaque ─────────────────────────────

const ALMANAC_ENTITIES: EntityId[] = ['grass', 'bush', 'tree', 'carrot', 'pumpkin', 'dead_pumpkin', 'sunflower', 'cactus', 'treasure'];
const ALMANAC_ITEMS: ItemId[] = ['hay', 'wood', 'carrot', 'pumpkin', 'power', 'cactus', 'gold', 'water', 'fertilizer', 'weird_substance'];
const STAGES: { id: Stage; label: string }[] = [
  { id: 'sprout', label: 'Brote' },
  { id: 'grow', label: 'Creciendo' },
  { id: 'ripe', label: 'Madura' },
];

/** Dato curioso o regla especial de cada planta o mineral. */
const ENTITY_NOTE: Record<GameTheme, Partial<Record<EntityId, string>>> = {
  farm: {
    grass: 'Vuelve a salir solo en la pradera después de cosechar.',
    tree: 'Da cinco veces más madera que un arbusto. Crece más lento por cada árbol vecino: plántalos alternados, como tablero de ajedrez.',
    pumpkin: 'Una de cada cinco se pudre al madurar. Las maduras que forman un cuadrado se unen en una gigante que da mucho más.',
    dead_pumpkin: 'No da nada: planta encima para reemplazarla.',
    sunflower: 'Cada uno tiene de 7 a 15 pétalos; cuéntalos con measure(). Con 10 o más maduros, cosechar el de más pétalos da 8 veces más.',
    cactus: 'Cada uno mide de 0 a 9; mídelo con measure(). Ordénalos con swap(): al cosechar una región ordenada de n cactus obtienes n × n.',
    treasure: 'Está dentro de los laberintos: llega hasta él y coséchalo.',
  },
  mine: {
    grass: 'Vuelve a salir sola en la roca después de extraerla.',
    tree: 'Da 5 de carbón en lugar de 1. Se forma más lento por cada veta de hierro vecina: colócalas alternadas, como tablero de ajedrez.',
    pumpkin: 'Una de cada cinco se rompe al formarse. Las completas que forman un cuadrado se unen en una gigante que da mucho más.',
    dead_pumpkin: 'No da nada: coloca otra encima para reemplazarla.',
    sunflower: 'Cada uno tiene de 7 a 15 rayos; cuéntalos con measure(). Con 10 o más formados, extraer el de más rayos da 8 veces más.',
    cactus: 'Cada una mide de 0 a 9; mídela con measure(). Ordénalas con swap(): al extraer una región ordenada de n gemas obtienes n × n.',
    treasure: 'Está dentro de los túneles: llega hasta él y recógelo.',
  },
};

/** Para qué sirve cada recurso. */
const ITEM_NOTE: Record<GameTheme, Record<ItemId, string>> = {
  farm: {
    hay: 'El recurso básico: paga las primeras mejoras.',
    wood: 'Sale de arbustos y árboles; se usa para plantar zanahorias y en varias mejoras.',
    carrot: 'Paga calabazas, girasoles y las mejoras avanzadas.',
    pumpkin: 'Se consigue mucho más con las calabazas gigantes.',
    power: 'Sale de los girasoles; paga las mejoras más caras.',
    cactus: 'Se obtiene al cosechar regiones de cactus ordenados.',
    gold: 'El premio de los laberintos.',
    water: 'Con useItem() la casilla queda regada y la planta crece más rápido.',
    fertilizer: 'Con useItem() la planta avanza 2 s de golpe; al cosecharla da además sustancia extraña.',
    weird_substance: 'Sale al cosechar plantas fertilizadas. Úsala sobre un arbusto maduro para crear un laberinto.',
  },
  mine: {
    hay: 'El recurso básico: paga las primeras mejoras.',
    wood: 'Sale de las vetas de carbón y de hierro; se usa para extraer cobre y en varias mejoras.',
    carrot: 'Paga geodas, cristales y las mejoras avanzadas.',
    pumpkin: 'Se consigue mucho más con las geodas gigantes.',
    power: 'Sale de los cristales; paga las mejoras más caras.',
    cactus: 'Se obtienen al extraer regiones de gemas ordenadas.',
    gold: 'El premio de los túneles.',
    water: 'Con useItem() la casilla queda refrigerada y el mineral se forma más rápido.',
    fertilizer: 'Con useItem() el mineral avanza 2 s de golpe; al extraerlo da además sustancia extraña.',
    weird_substance: 'Sale al extraer minerales con catalizador. Úsala sobre carbón formado para crear un túnel.',
  },
};

function Chip({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={[styles.chip, { backgroundColor: t.surface, borderColor: t.border }]}>{children}</View>;
}

/** Galería de todas las plantas, minerales y recursos del juego, con sus datos. */
export function AlmanacModal({ theme, onClose }: { theme: GameTheme; onClose(): void }) {
  const t = useTheme();
  const names = THEMES[theme];
  const mine = theme === 'mine';
  const small = { color: t.textMuted, fontSize: 12 } as const;
  const code = { color: t.textMuted, fontSize: 11, fontFamily: 'monospace' } as const;
  return (
    <ModalShell title={mine ? 'Almanaque de la mina' : 'Almanaque de la granja'} onClose={onClose} wide>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>{mine ? 'Minerales' : 'Plantas'}</Text>
        <View style={styles.grid}>
          {ALMANAC_ENTITIES.map((e) => {
            const s = SPECIES[e];
            const grows = s.grow > 0;
            const cost = Object.entries(s.cost ?? {}) as [ItemId, number][];
            return (
              <View key={e} style={[styles.card, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={[styles.plate, { backgroundColor: mine ? '#5b6470' : '#a8dc7a' }]}>
                    <EntitySprite type={e} theme={theme} size={84} n={e === 'sunflower' ? 12 : e === 'cactus' ? 6 : undefined} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>{names.entityLabel[e]}</Text>
                    <Text style={code}>Entities.{names.entityKey[e]}</Text>
                    {grows ? <Text style={small}>{mine ? 'Se forma' : 'Madura'} en unos {s.grow} s</Text> : null}
                    {grows ? <Text style={small}>Suelo: {s.grounds.map((g) => names.groundLabel[g]).join(' o ')}</Text> : null}
                    {s.unlock ? <Text style={small}>Mejora: {names.unlockLabel[s.unlock]}</Text> : null}
                  </View>
                </View>
                {grows ? (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {STAGES.map((st) => (
                      <View key={st.id} style={{ alignItems: 'center', flex: 1 }}>
                        <View style={{ opacity: st.id === 'grow' ? 0.85 : 1, transform: [{ scale: st.id === 'grow' ? 0.8 : 1 }] }}>
                          <EntitySprite type={e} theme={theme} size={40} stage={st.id} n={e === 'sunflower' ? 12 : e === 'cactus' ? 6 : undefined} />
                        </View>
                        <Text style={{ color: t.textMuted, fontSize: 10 }}>{st.label}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {e === 'sunflower' || e === 'cactus' ? (
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end' }}>
                    {(e === 'sunflower' ? [7, 11, 15] : [0, 4, 9]).map((n) => (
                      <View key={n} style={{ alignItems: 'center', flex: 1 }}>
                        <EntitySprite type={e} theme={theme} size={40} n={n} />
                        <Text style={{ color: t.textMuted, fontSize: 10 }}>measure() = {n}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {cost.length ? (
                    <Chip>
                      <Text style={small}>Cuesta</Text>
                      {cost.map(([i, n]) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <ItemIcon item={i} theme={theme} size={16} />
                          <Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>{n}</Text>
                        </View>
                      ))}
                    </Chip>
                  ) : null}
                  {s.item ? (
                    <Chip>
                      <Text style={small}>Da</Text>
                      <ItemIcon item={s.item} theme={theme} size={16} />
                      <Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>
                        {s.amount} de {names.itemLabel[s.item].toLowerCase()}
                      </Text>
                    </Chip>
                  ) : null}
                </View>
                {ENTITY_NOTE[theme][e] ? <Text style={small}>{ENTITY_NOTE[theme][e]}</Text> : null}
              </View>
            );
          })}
        </View>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginTop: 6 }}>Recursos</Text>
        <View style={styles.grid}>
          {ALMANAC_ITEMS.map((i) => (
            <View key={i} style={[styles.card, styles.itemCard, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
              <ItemIcon item={i} theme={theme} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: t.text, fontWeight: '800', fontSize: 14 }}>{names.itemLabel[i]}</Text>
                <Text style={code}>Items.{names.itemKey[i]}</Text>
                <Text style={small}>{ITEM_NOTE[theme][i]}</Text>
              </View>
            </View>
          ))}
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mapCard: { flexGrow: 1, flexBasis: 200, borderWidth: BORDER, borderRadius: RADIUS.md, padding: 12 },
  mapNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  card: { flexGrow: 1, flexBasis: 280, maxWidth: '100%', gap: 10, borderWidth: BORDER, borderRadius: RADIUS.md, padding: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center', flexBasis: 240 },
  plate: { width: 96, height: 96, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: BORDER, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
});

/** Mapa con todos los niveles (o misiones) del modo: avance, concepto y estrellas de cada uno. */
export function LevelMapModal({
  title,
  levels,
  progress,
  currentId,
  accent,
  unit,
  onPick,
  onClose,
}: {
  title: string;
  levels: { id: string; title: string; concept: string; icon: string; sandbox?: boolean }[];
  progress: Record<string, { stars: number } | undefined>;
  currentId: string;
  accent: string;
  unit: string;
  onPick(id: string): void;
  onClose(): void;
}) {
  const t = useTheme();
  const next = levels.find((l) => !l.sandbox && !progress[l.id]?.stars);
  const scored = levels.filter((l) => !l.sandbox);
  const done = scored.filter((l) => progress[l.id]?.stars).length;
  const stars = scored.reduce((a, l) => a + (progress[l.id]?.stars ?? 0), 0);
  return (
    <ModalShell title={title} onClose={onClose} wide>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 14 }}>
            {done} de {scored.length} completados · ★ {stars} de {scored.length * 3}
          </Text>
          <View style={{ flex: 1, minWidth: 160, height: 8, borderRadius: 4, backgroundColor: tint(accent, 0.15), overflow: 'hidden' }}>
            <View style={{ width: `${scored.length ? (done / scored.length) * 100 : 0}%`, height: '100%', backgroundColor: accent }} />
          </View>
        </View>
        <View style={styles.mapGrid}>
          {levels.map((l, i) => {
            const p = progress[l.id];
            const on = l.id === currentId;
            const isNext = next?.id === l.id;
            return (
              <Pressable
                key={l.id}
                onPress={() => {
                  onPick(l.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.mapCard,
                  {
                    borderColor: on ? accent : isNext ? accent : p?.stars ? tint(accent, 0.35) : t.border,
                    borderStyle: isNext && !on ? 'dashed' : 'solid',
                    backgroundColor: on ? tint(accent, 0.12) : pressed ? t.surfaceAlt : t.surface,
                  },
                ]}
                accessibilityLabel={`${unit} ${i + 1}: ${l.title}`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.mapNum, { backgroundColor: p?.stars ? accent : t.surfaceAlt }]}>
                    {p?.stars ? <Ionicons name="checkmark" size={15} color="#fff" /> : <Text style={{ color: t.textMuted, fontWeight: '900', fontSize: 12 }}>{l.sandbox ? '∞' : i + 1}</Text>}
                  </View>
                  <Ionicons name={l.icon as IconName} size={18} color={accent} />
                  <View style={{ flex: 1 }} />
                  {on ? <Text style={{ color: accent, fontSize: 10, fontWeight: '900' }}>AQUÍ ESTÁS</Text> : isNext ? <Text style={{ color: accent, fontSize: 10, fontWeight: '900' }}>SIGUIENTE</Text> : null}
                </View>
                <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, marginTop: 8 }} numberOfLines={2}>
                  {l.title}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                  {l.concept}
                </Text>
                <View style={{ marginTop: 8 }}>{l.sandbox ? <Text style={{ color: t.textMuted, fontSize: 11 }}>Reto libre, sin estrellas</Text> : <Stars n={p?.stars ?? 0} size={13} />}</View>
              </Pressable>
            );
          })}
          {/* huecos invisibles: la última fila conserva el mismo ancho de tarjeta */}
          {[0, 1, 2].map((k) => (
            <View key={`hueco-${k}`} style={[styles.mapCard, { borderWidth: 0, paddingVertical: 0, height: 0 }]} />
          ))}
        </View>
      </ScrollView>
    </ModalShell>
  );
}
