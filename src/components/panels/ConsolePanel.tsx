import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../ui/text';
import Svg, { Rect, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import type { InputValue, OutputLine, RunnerSnapshot } from '../../core/runner';
import { useApp } from '../../store/app';
import { copyText } from '../../ui/platform';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import { useLayout } from '../../ui/layout';
import { Button, Empty, IconButton, SectionTitle } from '../ui';

function Line({ l }: { l: OutputLine }) {
  const { terminal: c, warning } = useTheme();
  const color = l.kind === 'error' ? c.error : l.kind === 'warn' ? c.warn : l.kind === 'system' ? c.muted : l.kind === 'info' ? c.prompt : c.text;

  if (l.kind === 'input') {
    return (
      <Text style={[styles.line, { color: c.input }]} selectable>
        {l.prompt ? `${l.prompt} ` : ''}
        <Text style={{ fontWeight: '700' }}>{l.text}</Text>
      </Text>
    );
  }
  if (l.kind === 'alert') {
    return (
      <View style={[styles.alert, { borderColor: warning }]}>
        <Ionicons name="notifications-outline" size={14} color={warning} />
        <Text style={[styles.line, { color: warning, marginLeft: 6, flex: 1 }]} selectable>
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
  const t = useTheme();
  const green = t.terminal.input;
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
        <Ionicons name="help-circle-outline" size={16} color={green} style={{ marginRight: 6 }} />
        <Text style={[styles.line, { color: green, fontWeight: '700' }]}>
          {req.prompt ? `${req.prompt} ` : '¿Confirmar? '}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 6 }}>
          <Pressable
            onPress={() => provide(true)}
            style={({ pressed }) => [styles.inlineBtn, { backgroundColor: pressed ? t.primaryDark : t.primary }]}
          >
            <Text style={[styles.inlineBtnText, { color: '#fff' }]}>Aceptar (Enter)</Text>
          </Pressable>
          <Pressable
            onPress={() => provide(false)}
            style={({ pressed }) => [styles.inlineBtn, { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.12)' }]}
          >
            <Text style={[styles.inlineBtnText, { color: t.terminal.text }]}>Cancelar (Esc)</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inlinePromptRow}>
      <Text style={[styles.line, { color: green, fontWeight: '700' }]}>
        {req.prompt ? `${req.prompt} › ` : '› '}
      </Text>
      {/* si el texto de la pregunta es largo, el campo baja a la siguiente línea en lugar de salirse */}
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 180, minWidth: 0, flexDirection: 'row', alignItems: 'center' }}>
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
          placeholderTextColor={t.terminal.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          blurOnSubmit={false}
          style={[styles.inlineInput, { color: green, fontFamily: MONO, fontSize: 14 }]}
        />
        <Pressable
          onPress={submit}
          style={({ pressed }) => [styles.inlineSendBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityLabel="Enviar dato"
        >
          <Ionicons name="return-down-forward" size={16} color={green} />
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

  const { wide, split } = useLayout();
  // la mascota flota sobre la consola en pantalla ancha y con el celular acostado (más chica);
  // con el celular en vertical se para encima de las pestañas y no la tapa
  const bottomPad = !mascot ? 12 : wide ? 170 : split === 'row' ? 56 : 12;
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
      <View style={[styles.terminalContainer, { backgroundColor: t.terminal.bg }]}>
        {shapes.length > 0 ? (
          <View style={{ height: 200, backgroundColor: '#ffffff', borderBottomWidth: BORDER, borderColor: t.border }}>
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
            contentContainerStyle={{ padding: 12, paddingBottom: bottomPad }}
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
  // en pantallas angostas la consola ya pregunta en su propia línea: no se repite abajo
  const inConsole = useApp((s) => s.sidePanel === 'console');
  const { wide } = useLayout();
  if (!req || status !== 'input' || (inConsole && !wide)) return null;
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
      <Text style={{ color: t.text, fontWeight: '700', marginBottom: 6 }} numberOfLines={3}>
        <Ionicons name="keypad-outline" size={14} color={t.primaryDark} /> {req.prompt || (req.mode === 'confirm' ? '¿Confirmar?' : 'El programa espera un dato:')}
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
            style={[styles.inputField, { flex: 1, minWidth: 0, color: t.text, borderColor: t.primary, backgroundColor: t.surface, fontFamily: MONO, height: 42 }]}
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
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 4, height: 40, borderBottomWidth: BORDER },
  terminalContainer: { flex: 1 },
  line: { fontFamily: MONO, fontSize: 14, lineHeight: 22 },
  italic: { fontStyle: 'italic' },
  bold: { fontWeight: '700' },
  alert: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, paddingLeft: 6, marginVertical: 4 },
  inputs: { padding: 10, borderBottomWidth: BORDER },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  inputField: { flex: 1, borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: 8, height: 32, fontSize: 13 },
  inputBar: { padding: 10, borderTopWidth: 2 },
  inlinePromptRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginVertical: 4, paddingVertical: 2 },
  inlineInput: { flex: 1, minWidth: 0, height: 32, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 0, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: RADIUS.md },
  inlineSendBtn: { marginLeft: 6, padding: 6, borderRadius: RADIUS.md, backgroundColor: 'rgba(137, 226, 25, 0.16)' },
  inlineBtn: { paddingHorizontal: 12, height: 32, justifyContent: 'center', borderRadius: RADIUS.md },
  inlineBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
});
