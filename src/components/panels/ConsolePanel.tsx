import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
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

const globalInputHistory: string[] = [];

export function addInputHistory(val: string) {
  const trimmed = val.trim();
  if (!trimmed) return;
  const idx = globalInputHistory.indexOf(trimmed);
  if (idx !== -1) globalInputHistory.splice(idx, 1);
  globalInputHistory.push(trimmed);
  if (globalInputHistory.length > 50) globalInputHistory.shift();
}

export function getInputHistory() {
  return globalInputHistory;
}

/** Componente de entrada interactiva inline dentro de la propia consola. */
function InlineTerminalPrompt({ req }: { req: NonNullable<RunnerSnapshot['inputRequest']> }) {
  const provide = useApp((s) => s.provideInput);
  const stop = useApp((s) => s.stop);
  const [value, setValue] = useState(req.defaultValue ?? '');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<TextInput>(null);

  const submit = () => {
    addInputHistory(value);
    provide(value);
    setValue('');
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS !== 'web') return;
    const key = e.nativeEvent?.key;
    if (key === 'ArrowUp') {
      const h = getInputHistory();
      if (!h.length) return;
      const next = historyIdx === -1 ? h.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(next);
      setValue(h[next]);
    } else if (key === 'ArrowDown') {
      const h = getInputHistory();
      if (historyIdx === -1) return;
      const next = historyIdx + 1;
      if (next >= h.length) {
        setHistoryIdx(-1);
        setValue('');
      } else {
        setHistoryIdx(next);
        setValue(h[next]);
      }
    } else if (key === 'Escape') {
      stop();
    }
  };

  if (req.mode === 'confirm') {
    return (
      <View style={styles.inlinePromptRow}>
        <Ionicons name="help-circle-outline" size={16} color="#50fa7b" style={{ marginRight: 6 }} />
        <Text style={[styles.line, { color: '#50fa7b', fontWeight: '700' }]}>
          {req.prompt ? `${req.prompt} ` : '¿Confirmar? '}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 6 }}>
          <Pressable
            onPress={() => provide(true)}
            style={({ pressed }) => [styles.inlineBtn, { backgroundColor: '#50fa7b', opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={{ color: '#1e1e1e', fontWeight: '700', fontSize: 13, fontFamily: MONO }}>Aceptar (Enter)</Text>
          </Pressable>
          <Pressable
            onPress={() => provide(false)}
            style={({ pressed }) => [styles.inlineBtn, { backgroundColor: '#44475a', opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={{ color: '#f8f8f2', fontWeight: '600', fontSize: 13, fontFamily: MONO }}>Cancelar (Esc)</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inlinePromptRow}>
      <Text style={[styles.line, { color: '#50fa7b', fontWeight: '700' }]}>
        {req.prompt ? `${req.prompt} › ` : '› '}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          ref={inputRef}
          autoFocus
          value={value}
          onChangeText={(v) => {
            setValue(v);
            setHistoryIdx(-1);
          }}
          onSubmitEditing={submit}
          onKeyPress={handleKeyPress}
          placeholder="Escribe y presiona Enter (↑ historial)..."
          placeholderTextColor="#6272a4"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          blurOnSubmit={false}
          style={[styles.inlineInput, { color: '#50fa7b', fontFamily: MONO, fontSize: 14 }]}
        />
        <Pressable
          onPress={submit}
          style={({ pressed }) => [styles.inlineSendBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityLabel="Enviar dato"
        >
          <Ionicons name="return-down-forward" size={16} color="#50fa7b" />
        </Pressable>
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

  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const status = run?.status;
  const isInput = status === 'input';
  const req = run?.inputRequest ?? null;
  const inputs = run?.inputs ?? [];

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

  const nonCanvasOutput = output.filter((l) => l.kind !== 'canvas');

  // Auto-scroll al final cuando se solicita entrada
  React.useEffect(() => {
    if (isInput) {
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [isInput]);

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={[styles.toolbar, { borderBottomColor: t.border }]}>
        <Text style={{ color: t.textMuted, fontSize: 12, flex: 1 }}>
          {run ? `${nonCanvasOutput.filter((l) => l.kind !== 'system').length} líneas · ${inputs.length} entradas` : 'Consola'}
        </Text>
        <IconButton icon="list-outline" label="Entradas" onPress={() => setShowInputs((v) => !v)} active={showInputs} size={18} />
        <IconButton
          icon="copy-outline"
          label="Copiar salida"
          onPress={() => copyText(output.map((l) => (l.kind === 'input' ? `${l.prompt ?? ''} ${l.text}` : l.text)).join('\n'))}
          size={18}
        />
        <IconButton icon="trash-outline" label="Limpiar consola" onPress={clearConsole} size={18} />
      </View>
      {showInputs ? <InputsEditor key={`${run?.status}-${inputs.length}`} initial={inputs} /> : null}
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
        {nonCanvasOutput.length === 0 && !isInput ? (
          <Empty icon="terminal-outline" text={'La salida del programa aparecerá aquí.\nPresiona ▶ Ejecutar o ⏭ Paso a paso.'} />
        ) : (
          <ScrollView
            ref={scroll}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: mascot ? 170 : 12 }}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          >
            {nonCanvasOutput.map((l) => (
              <Line key={l.id} l={l} />
            ))}
            {!wide && isInput && req ? <InlineTerminalPrompt key={`input-${inputs.length}`} req={req} /> : null}
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
  const [historyIdx, setHistoryIdx] = useState(-1);

  const submit = () => {
    addInputHistory(value);
    provide(value);
    setValue('');
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS !== 'web') return;
    const key = e.nativeEvent?.key;
    if (key === 'ArrowUp') {
      const h = getInputHistory();
      if (!h.length) return;
      const next = historyIdx === -1 ? h.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(next);
      setValue(h[next]);
    } else if (key === 'ArrowDown') {
      const h = getInputHistory();
      if (historyIdx === -1) return;
      const next = historyIdx + 1;
      if (next >= h.length) {
        setHistoryIdx(-1);
        setValue('');
      } else {
        setHistoryIdx(next);
        setValue(h[next]);
      }
    }
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
            onChangeText={(v) => {
              setValue(v);
              setHistoryIdx(-1);
            }}
            onSubmitEditing={submit}
            onKeyPress={handleKeyPress}
            placeholder="Escribe y presiona Enter (↑ historial)"
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
  line: {
    fontFamily: MONO,
    fontSize: 14,
    lineHeight: 22,
    ...Platform.select({
      web: { textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)' },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
      },
    }),
  },
  italic: { fontStyle: 'italic' },
  bold: { fontWeight: '700' },
  alert: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, paddingLeft: 6, marginVertical: 4 },
  inputs: { padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  inputField: { flex: 1, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, height: 32, fontSize: 13 },
  inputBar: { padding: 10, borderTopWidth: 2 },
  inlinePromptRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginVertical: 4, paddingVertical: 2 },
  inlineInput: { flex: 1, minWidth: 160, height: 32, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 0, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 4 },
  inlineSendBtn: { marginLeft: 6, padding: 4, borderRadius: 4, backgroundColor: 'rgba(80, 250, 123, 0.15)' },
  inlineBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
});
