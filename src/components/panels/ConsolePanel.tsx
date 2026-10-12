import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Rect, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import type { InputValue, OutputLine, RunnerSnapshot } from '../../core/runner';
import { useApp } from '../../store/app';
import { copyText } from '../../ui/platform';
import { MONO, useTheme } from '../../ui/theme';
import { Button, Empty, IconButton, SectionTitle } from '../ui';

function Line({ l }: { l: OutputLine }) {
  const color =
    l.kind === 'error' ? '#ff5555' : l.kind === 'warn' ? '#f1fa8c' : l.kind === 'system' ? '#6272a4' : l.kind === 'info' ? '#8be9fd' : '#f8f8f2';
  
  if (l.kind === 'input') {
    return (
      <Text style={[styles.line, { color: '#50fa7b' }]} selectable>
        {l.prompt ? `${l.prompt} ` : ''}
        <Text style={{ fontWeight: '700' }}>{l.text}</Text>
      </Text>
    );
  }
  if (l.kind === 'alert') {
    return (
      <View style={[styles.alert, { borderColor: '#ffb86c' }]}>
        <Ionicons name="notifications-outline" size={14} color="#ffb86c" />
        <Text style={[styles.line, { color: '#ffb86c', marginLeft: 6, flex: 1 }]} selectable>
          {l.text}
        </Text>
      </View>
    );
  }
  return (
    <Text style={[styles.line, { color }, l.kind === 'system' ? styles.italic : null, l.kind === 'error' ? styles.bold : null]} selectable>
      {l.text || ' '}
    </Text>
  );
}

/** Datos ingresados en la última ejecución, editables para volver a ejecutar. */
function InputsEditor({ initial }: { initial: InputValue[] }) {
  const t = useTheme();
  const rerun = useApp((s) => s.rerunWithInputs);
  const [edited, setEdited] = useState<InputValue[]>(initial);
  return (
    <View style={[styles.inputs, { borderBottomColor: t.border, backgroundColor: t.surfaceAlt }]}>
      <SectionTitle style={{ marginTop: 0 }}>Datos ingresados (edítalos y vuelve a ejecutar)</SectionTitle>
      {edited.length === 0 ? <Text style={{ color: t.textMuted, fontSize: 12 }}>Aún no hay datos ingresados.</Text> : null}
      {edited.map((v, i) => (
        <View key={i} style={styles.inputRow}>
          <Text style={{ color: t.textMuted, width: 26, fontFamily: MONO, fontSize: 12 }}>{i + 1}.</Text>
          <TextInput
            value={typeof v === 'boolean' ? String(v) : v ?? ''}
            onChangeText={(x) => setEdited((arr) => arr.map((y, j) => (j === i ? (typeof y === 'boolean' ? x === 'true' : x) : y)))}
            style={[styles.inputField, { color: t.text, borderColor: t.border, backgroundColor: t.surface, fontFamily: MONO }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ))}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <Button label="Re-ejecutar con estos datos" icon="refresh" kind="primary" onPress={() => rerun(edited)} disabled={!edited.length} />
      </View>
    </View>
  );
}

export default function ConsolePanel() {
  const t = useTheme();
  const run = useApp((s) => s.run);
  const clearConsole = useApp((s) => s.clearConsole);
  // deja espacio para que la mascota no tape las últimas líneas
  const mascot = useApp((s) => s.settings.mascot);
  const scroll = useRef<ScrollView>(null);
  const [showInputs, setShowInputs] = useState(false);

  const output = run?.output ?? [];
  const canvasCmds = output.filter((l) => l.kind === 'canvas');
  let shapes: any[] = [];
  for (const cmd of canvasCmds) {
    try {
      const op = JSON.parse(cmd.text);
      if (op.type === 'clear') shapes = [];
      else shapes.push(op);
    } catch {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={[styles.toolbar, { borderBottomColor: t.border }]}>
        <Text style={{ color: t.textMuted, fontSize: 12, flex: 1 }}>
          {run ? `${output.filter((l) => l.kind !== 'system').length} líneas · ${run.inputs.length} entradas` : 'Consola'}
        </Text>
        <IconButton icon="list-outline" label="Entradas" onPress={() => setShowInputs((v) => !v)} active={showInputs} size={18} />
        <IconButton icon="copy-outline" label="Copiar salida" onPress={() => copyText(output.map((l) => (l.kind === 'input' ? `${l.prompt ?? ''} ${l.text}` : l.text)).join('\n'))} size={18} />
        <IconButton icon="trash-outline" label="Limpiar consola" onPress={clearConsole} size={18} />
      </View>
      {showInputs ? <InputsEditor key={`${run?.status}-${run?.inputs.length ?? 0}`} initial={run?.inputs ?? []} /> : null}
      <View style={[styles.terminalContainer, { backgroundColor: '#1e1e1e' }]}>
        {shapes.length > 0 ? (
          <View style={{ height: 200, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#333' }}>
             <Svg width="100%" height="100%">
               {shapes.map((s, i) => {
                 if (s.type === 'rect') return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={s.color} />;
                 if (s.type === 'circle') return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.color} />;
                 if (s.type === 'line') return <SvgLine key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={s.width || 1} />;
                 if (s.type === 'text') return <SvgText key={i} x={s.x} y={s.y} fill={s.color} fontSize={s.size}>{s.msg}</SvgText>;
                 return null;
               })}
             </Svg>
          </View>
        ) : null}
        {output.filter(l => l.kind !== 'canvas').length === 0 ? (
          <Empty icon="terminal-outline" text={'La salida del programa aparecerá aquí.\nPresiona ▶ Ejecutar o ⏭ Paso a paso.'} />
        ) : (
          <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: mascot ? 170 : 12 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
            {output.filter(l => l.kind !== 'canvas').map((l) => (
              <Line key={l.id} l={l} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/** Barra para responder prompt()/confirm(); visible en cualquier panel. */
export function InputBar() {
  const req = useApp((s) => s.run?.inputRequest ?? null);
  const status = useApp((s) => s.run?.status);
  const count = useApp((s) => s.run?.inputs.length ?? 0);
  if (!req || status !== 'input') return null;
  return <InputBarInner key={count} req={req} />;
}

function InputBarInner({ req }: { req: NonNullable<RunnerSnapshot['inputRequest']> }) {
  const t = useTheme();
  const provide = useApp((s) => s.provideInput);
  const stop = useApp((s) => s.stop);
  const [value, setValue] = useState(req.defaultValue ?? '');
  const submit = () => {
    provide(value);
    setValue('');
  };
  return (
    <View style={[styles.inputBar, { backgroundColor: t.surfaceAlt, borderTopColor: t.primary }]}>
      <Text style={{ color: t.text, fontWeight: '600', marginBottom: 6 }} numberOfLines={3}>
        <Ionicons name="keypad-outline" size={14} color={t.primary} /> {req.prompt || (req.mode === 'confirm' ? '¿Confirmar?' : 'El programa espera un dato:')}
      </Text>
      {req.mode === 'confirm' ? (
        <View style={{ flexDirection: 'row' }}>
          <Button label="Aceptar" kind="primary" icon="checkmark" onPress={() => provide(true)} style={{ marginRight: 8 }} />
          <Button label="Cancelar" icon="close" onPress={() => provide(false)} style={{ marginRight: 8 }} />
          <IconButton icon="stop" color={t.danger} label="Detener programa" onPress={stop} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            autoFocus
            value={value}
            onChangeText={setValue}
            onSubmitEditing={submit}
            placeholder="Escribe y presiona Enter"
            placeholderTextColor={t.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            blurOnSubmit={false}
            style={[styles.inputField, { flex: 1, color: t.text, borderColor: t.primary, backgroundColor: t.surface, fontFamily: MONO, height: 40 }]}
          />
          <Button label="Enviar" kind="primary" icon="return-down-forward" onPress={submit} style={{ marginLeft: 8 }} />
          <IconButton icon="close-circle-outline" label="Enviar null" onPress={() => provide(null)} />
          <IconButton icon="stop" color={t.danger} label="Detener programa" onPress={stop} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 4, height: 40, borderBottomWidth: StyleSheet.hairlineWidth },
  terminalContainer: { flex: 1, backgroundColor: '#1e1e1e' },
  line: { fontFamily: MONO, fontSize: 14, lineHeight: 22, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  italic: { fontStyle: 'italic' },
  bold: { fontWeight: '700' },
  alert: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, paddingLeft: 6, marginVertical: 4 },
  inputs: { padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  inputField: { flex: 1, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, height: 32, fontSize: 13 },
  inputBar: { padding: 10, borderTopWidth: 2 },
});
