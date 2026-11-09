/**
 * Editor de niveles del juego del dron: el maestro dibuja el tablero (plantas y suelo),
 * elige el objetivo, escribe la explicación, el código inicial y las pistas. El nivel se
 * guarda en el dispositivo y se comparte como archivo (.json) que otros importan.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { GameTheme, THEMES } from '../../core/game/api';
import { CustomLevelData, GOAL_ITEMS, GOAL_PLANTS, PAINTABLE, resizeCustom } from '../../core/game/custom';
import type { EntityId, GroundId } from '../../core/game/world';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { Button, Field, NumberStepper, Segmented, TextField, Toggle } from '../ui';
import { EntitySprite, ItemIcon } from './art';

type Tool = { kind: 'entity'; entity: EntityId | null } | { kind: 'ground'; ground: GroundId };

const GROUND_COLOR: Record<GameTheme, Record<GroundId, string>> = {
  farm: { grassland: '#bfe89a', soil: '#c49466' },
  mine: { grassland: '#ddcbab', soil: '#b59c78' },
};

export default function LevelEditor({ initial, theme, onSave, onClose }: { initial: CustomLevelData; theme: GameTheme; onSave(d: CustomLevelData): void; onClose(): void }) {
  const t = useTheme();
  const names = THEMES[theme];
  const [d, setD] = useState<CustomLevelData>(initial);
  const [tool, setTool] = useState<Tool>({ kind: 'entity', entity: 'bush' });
  const up = (p: Partial<CustomLevelData>) => setD((x) => ({ ...x, ...p }));
  const cell = Math.max(26, Math.min(44, Math.floor(360 / d.size)));

  const paint = (x: number, y: number) =>
    setD((cur) => {
      if (tool.kind === 'ground') {
        const grounds = cur.grounds.map((col, i) => (i === x ? col.map((g, j) => (j === y ? tool.ground : g)) : col));
        return { ...cur, grounds };
      }
      const entities = cur.entities.map((col, i) => (i === x ? col.map((e, j) => (j === y ? tool.entity : e)) : col));
      return { ...cur, entities };
    });
  const fillAll = () =>
    setD((cur) =>
      tool.kind === 'ground'
        ? { ...cur, grounds: cur.grounds.map((col) => col.map(() => tool.ground)) }
        : { ...cur, entities: cur.entities.map((col) => col.map(() => tool.entity)) },
    );

  const isTool = (x: Tool) => (x.kind === 'entity' ? tool.kind === 'entity' && tool.entity === x.entity : tool.kind === 'ground' && tool.ground === x.ground);
  const valid = d.title.trim().length > 0 && d.goal.amount > 0;

  return (
    <ModalShell title="Editor de niveles" onClose={onClose} wide>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 4 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Field label="Nombre del nivel" style={{ flex: 2, minWidth: 220 }}>
            <TextField value={d.title} onChangeText={(title) => up({ title })} maxLength={60} />
          </Field>
          <Field label="Autor (opcional)" style={{ flex: 1, minWidth: 160 }}>
            <TextField value={d.author ?? ''} onChangeText={(author) => up({ author: author || undefined })} maxLength={80} />
          </Field>
        </View>
        <Field label="Explicación" hint="Qué debe hacer el dron y qué concepto se practica. Admite `código`, **negritas** y bloques ```.">
          <TextField value={d.intro} onChangeText={(intro) => up({ intro })} multiline minHeight={80} />
        </Field>

        <Text style={[styles.section, { color: t.textMuted }]}>TABLERO</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>Tamaño</Text>
          <NumberStepper value={d.size} onChange={(n) => setD((cur) => resizeCustom(cur, n))} min={3} max={10} step={1} width={44} />
          <View style={{ minWidth: 220 }}>
            <Toggle label="Plantas maduras al inicio" value={d.grown} onChange={(grown) => up({ grown })} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {PAINTABLE.map((e) => (
            <Pressable
              key={e ?? 'vacia'}
              onPress={() => setTool({ kind: 'entity', entity: e })}
              accessibilityRole="button"
              accessibilityState={{ selected: isTool({ kind: 'entity', entity: e }) }}
              accessibilityLabel={e ? names.entityLabel[e] : 'Casilla vacía'}
              style={[styles.tool, { borderColor: isTool({ kind: 'entity', entity: e }) ? t.accent : t.border, backgroundColor: isTool({ kind: 'entity', entity: e }) ? t.accentSoft : t.surface }]}
            >
              {e ? <EntitySprite type={e} theme={theme} size={22} /> : <Ionicons name="close-circle-outline" size={20} color={t.textMuted} />}
              <Text style={{ color: t.text, fontSize: 12, marginLeft: 4 }}>{e ? names.entityLabel[e] : 'Vacía'}</Text>
            </Pressable>
          ))}
          {(['grassland', 'soil'] as GroundId[]).map((g) => (
            <Pressable
              key={g}
              onPress={() => setTool({ kind: 'ground', ground: g })}
              accessibilityRole="button"
              accessibilityState={{ selected: isTool({ kind: 'ground', ground: g }) }}
              style={[styles.tool, { borderColor: isTool({ kind: 'ground', ground: g }) ? t.accent : t.border, backgroundColor: isTool({ kind: 'ground', ground: g }) ? t.accentSoft : t.surface }]}
            >
              <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: GROUND_COLOR[theme][g], borderWidth: 1, borderColor: t.border }} />
              <Text style={{ color: t.text, fontSize: 12, marginLeft: 4 }}>Suelo: {names.groundLabel[g]}</Text>
            </Pressable>
          ))}
          <Button label="Llenar todo" icon="color-fill-outline" size="sm" kind="ghost" onPress={fillAll} />
        </View>
        <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 6 }}>Toca una casilla para pintarla con lo elegido. El dron empieza en la esquina inferior izquierda (0, 0).</Text>
        <View style={[styles.board, { borderColor: t.borderStrong, alignSelf: 'flex-start' }]}>
          {Array.from({ length: d.size }, (_, row) => {
            const y = d.size - 1 - row;
            return (
              <View key={row} style={{ flexDirection: 'row' }}>
                {Array.from({ length: d.size }, (_, x) => {
                  const e = d.entities[x]?.[y] ?? null;
                  return (
                    <Pressable
                      key={x}
                      onPress={() => paint(x, y)}
                      accessibilityLabel={`Casilla ${x}, ${y}: ${e ? names.entityLabel[e] : 'vacía'}`}
                      style={{ width: cell, height: cell, backgroundColor: GROUND_COLOR[theme][d.grounds[x]?.[y] ?? 'grassland'], alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.12)' }}
                    >
                      {e ? <EntitySprite type={e} theme={theme} size={Math.round(cell * 0.82)} /> : null}
                      {x === 0 && y === 0 ? <Ionicons name="navigate" size={10} color={t.accent} style={{ position: 'absolute', left: 2, bottom: 1 }} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>

        <Text style={[styles.section, { color: t.textMuted }]}>OBJETIVO</Text>
        <Segmented
          options={[
            { id: 'items', label: 'Juntar recursos', icon: 'cube-outline' },
            { id: 'plant', label: 'Tener plantas', icon: 'leaf-outline' },
          ]}
          value={d.goal.kind}
          onChange={(k) => up({ goal: k === 'items' ? { kind: 'items', item: 'hay', amount: d.goal.amount } : { kind: 'plant', entity: 'bush', amount: d.goal.amount } })}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
          {d.goal.kind === 'items'
            ? GOAL_ITEMS.map((i) => (
                <Pressable key={i} onPress={() => up({ goal: { kind: 'items', item: i, amount: d.goal.amount } })} style={[styles.tool, { borderColor: d.goal.kind === 'items' && d.goal.item === i ? t.accent : t.border }]} accessibilityRole="button">
                  <ItemIcon item={i} theme={theme} size={18} />
                  <Text style={{ color: t.text, fontSize: 12, marginLeft: 4 }}>{names.itemLabel[i]}</Text>
                </Pressable>
              ))
            : GOAL_PLANTS.map((e) => (
                <Pressable key={e} onPress={() => up({ goal: { kind: 'plant', entity: e, amount: d.goal.amount } })} style={[styles.tool, { borderColor: d.goal.kind === 'plant' && d.goal.entity === e ? t.accent : t.border }]} accessibilityRole="button">
                  <EntitySprite type={e} theme={theme} size={20} />
                  <Text style={{ color: t.text, fontSize: 12, marginLeft: 4 }}>{names.entityLabel[e]}</Text>
                </Pressable>
              ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          <Field label="Cantidad">
            <NumberStepper value={d.goal.amount} onChange={(amount) => up({ goal: { ...d.goal, amount } })} min={1} max={10000} step={1} width={64} />
          </Field>
          <Field label="3.ª estrella: segundos de juego (0 = sin límite)">
            <NumberStepper value={d.timeTarget ?? 0} onChange={(n) => up({ timeTarget: n > 0 ? n : undefined })} min={0} max={3600} step={5} width={64} />
          </Field>
          <Field label="2.ª estrella: el código debe usar" style={{ minWidth: 200 }}>
            <TextField value={d.mustUse ?? ''} onChangeText={(v) => up({ mustUse: v.trim() ? v : undefined })} placeholder="Ej. for, while, function" mono autoCapitalize="none" />
          </Field>
        </View>

        <Text style={[styles.section, { color: t.textMuted }]}>PARA EL ALUMNO</Text>
        <Field label="Código inicial">
          <TextField value={d.starter} onChangeText={(starter) => up({ starter })} multiline mono minHeight={100} autoCapitalize="none" autoCorrect={false} style={{ fontFamily: MONO }} />
        </Field>
        <Field label="Pistas (una por línea)">
          <TextField value={d.hints.join('\n')} onChangeText={(v) => up({ hints: v.split('\n') })} multiline minHeight={60} />
        </Field>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button label="Cancelar" onPress={onClose} />
          <Button label="Guardar y jugar" icon="play" kind="primary" disabled={!valid} onPress={() => onSave({ ...d, title: d.title.trim(), hints: d.hints.map((h) => h.trim()).filter(Boolean) })} />
        </View>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginTop: 14, marginBottom: 6 },
  tool: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 5 },
  board: { borderWidth: BORDER, borderRadius: 6, overflow: 'hidden' },
});
