import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../ui/text';
import { useApp } from '../../store/app';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import { usePanelBottomPad } from '../../ui/layout';
import { Chip, Empty, IconButton, SectionTitle, Switch } from '../ui';

export default function VariablesPanel() {
  const t = useTheme();
  // que la mascota no tape lo último en pantallas angostas
  const bottomPad = usePanelBottomPad();
  const run = useApp((s) => s.run);
  const watches = useApp((s) => s.watches);
  const setWatches = useApp((s) => s.setWatches);
  const showFunctions = useApp((s) => s.settings.showFunctions);
  const update = useApp((s) => s.updateSettings);
  // marco elegido en la pila; vuelve al actual en cada paso nuevo
  const [frameSel, setFrameSel] = useState({ step: -1, idx: 0 });
  const [newWatch, setNewWatch] = useState('');

  const frames = run?.frames ?? [];
  const frameIdx = frameSel.step === run?.stepCount ? frameSel.idx : 0;
  const setFrameIdx = (idx: number) => setFrameSel({ step: run?.stepCount ?? -1, idx });
  const frame = frames[Math.min(frameIdx, frames.length - 1)];
  const changed = useMemo(() => new Set(run?.changed ?? []), [run?.changed]);

  const scopes = useMemo(
    () => (frame?.scopes ?? []).map((sc) => ({ ...sc, vars: sc.vars.filter((v) => showFunctions || (v.kind !== 'function' && v.kind !== 'class')) })),
    [frame, showFunctions],
  );

  const addWatch = () => {
    const w = newWatch.trim();
    if (w && !watches.includes(w)) setWatches([...watches, w]);
    setNewWatch('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.surface }} contentContainerStyle={{ padding: 12, paddingBottom: bottomPad }} keyboardShouldPersistTaps="handled">
      <SectionTitle style={{ marginTop: 0 }}>Expresiones vigiladas</SectionTitle>
      <View style={[styles.watchAdd, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
        <TextInput
          value={newWatch}
          onChangeText={setNewWatch}
          onSubmitEditing={addWatch}
          placeholder="Ej: suma / n, arreglo[i]"
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, color: t.text, fontFamily: MONO, fontSize: 13, paddingHorizontal: 8, height: 34 }}
        />
        <IconButton icon="add" label="Agregar expresión" onPress={addWatch} size={18} />
      </View>
      {watches.map((w) => {
        const val = run?.watches.find((x) => x.expr === w);
        return (
          <View key={w} style={[styles.row, { borderBottomColor: t.border }]}>
            <Text style={[styles.name, { color: t.syntax.ident }]} numberOfLines={1}>
              {w}
            </Text>
            <Text style={[styles.value, { color: val && !val.ok ? t.textMuted : t.text }]} selectable numberOfLines={4}>
              {val ? val.value : '—'}
            </Text>
            <IconButton icon="close" label="Quitar" size={16} onPress={() => setWatches(watches.filter((x) => x !== w))} />
          </View>
        );
      })}

      {frames.length > 1 ? (
        <>
          <SectionTitle>Pila de llamadas</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {frames.map((f, i) => (
              <Chip key={i} label={`${f.name} · L${f.line}`} active={i === frameIdx} onPress={() => setFrameIdx(i)} />
            ))}
          </View>
        </>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle>Variables {frame && frames.length > 1 ? `· ${frame.name}` : ''}</SectionTitle>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: t.textMuted, fontSize: 12, marginRight: 6 }}>Funciones</Text>
          <Switch value={showFunctions} onValueChange={(v) => update({ showFunctions: v })} />
        </View>
      </View>
      {!run || !frames.length ? (
        <Empty icon="cube-outline" text={'Ejecuta paso a paso (⏭) o agrega un punto de interrupción para inspeccionar las variables.'} />
      ) : (
        scopes.map((sc, i) => (
          <View key={`${sc.title}${i}`} style={[styles.scope, { borderColor: t.border }]}>
            <View style={[styles.scopeHead, { backgroundColor: t.surfaceAlt }]}>
              <Ionicons name={sc.title === 'Global' ? 'globe-outline' : sc.title.startsWith('Función') ? 'code-slash-outline' : 'albums-outline'} size={13} color={t.textMuted} />
              <Text style={{ color: t.textMuted, fontWeight: '700', fontSize: 12, marginLeft: 6 }}>{sc.title}</Text>
            </View>
            {sc.vars.length === 0 ? <Text style={{ color: t.textMuted, fontSize: 12, padding: 8 }}>(sin variables)</Text> : null}
            {sc.vars.map((v) => {
              const isChanged = frameIdx === 0 && changed.has(`${sc.title}/${v.name}`);
              return (
                <View key={v.name} style={[styles.row, { borderBottomColor: t.border, backgroundColor: isChanged ? t.execLine : undefined }]}>
                  <View style={{ width: '34%' }}>
                    <Text style={[styles.varName, { color: t.syntax.ident }]} numberOfLines={1}>
                      {v.name}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 10 }}>
                      {v.kind === 'param' ? 'parámetro' : v.kind} · {v.type}
                    </Text>
                  </View>
                  <Text style={[styles.value, { color: v.value === '‹sin inicializar›' ? t.textMuted : t.text }]} selectable numberOfLines={6}>
                    {v.value}
                  </Text>
                </View>
              );
            })}
          </View>
        ))
      )}
      {run?.status === 'paused' || run?.status === 'input' ? (
        <Pressable style={{ marginTop: 8 }}>
          <Text style={{ color: t.textMuted, fontSize: 11 }}>Los valores corresponden al momento ANTES de ejecutar la línea resaltada.</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  watchAdd: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: BORDER },
  name: { fontFamily: MONO, fontSize: 13, fontWeight: '700', width: '34%' },
  // sin ancho propio: ocupa la columna de su contenedor (en web «width: undefined» no quita el 34 %)
  varName: { fontFamily: MONO, fontSize: 13, fontWeight: '700' },
  value: { fontFamily: MONO, fontSize: 13, flex: 1 },
  scope: { borderWidth: BORDER, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 10 },
  scopeHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5 },
});
