/** Respuesta de programación: editor, ejecución con datos y casos de ejemplo. */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { analyze, Diagnostic } from '../../core/analyzer';
import { runTests } from '../../core/exam/grading';
import type { PaperQuestion, PaperSettings, TestResult } from '../../core/exam/types';
import { getProfile } from '../../core/profiles';
import { Runner, RunnerSnapshot } from '../../core/runner';
import { MONO, useTheme } from '../../ui/theme';
import CodeEditor from '../CodeEditor';
import { Button } from '../ui';
import { Pill } from './kit';

const MATCH_LABEL: Record<string, string> = {
  exact: 'la salida debe ser idéntica',
  flexible: 'no importan mayúsculas ni espacios extra',
  numbers: 'solo se comparan los números',
  contains: 'la salida debe incluir el texto esperado',
};

interface Props {
  q: PaperQuestion;
  value: string;
  onChange(code: string): void;
  settings: PaperSettings;
  readOnly?: boolean;
  onRun?(detail: string): void;
  onTest?(detail: string): void;
  onBusy?(kind: 'running' | 'testing' | null): void;
  fontSize?: number;
}

export default function CodeAnswer({ q, value, onChange, settings, readOnly, onRun, onTest, onBusy, fontSize = 14 }: Props) {
  const t = useTheme();
  const profile = useMemo(() => getProfile(settings.profileId), [settings.profileId]);
  const [diags, setDiags] = useState<Diagnostic[]>([]);
  const [run, setRun] = useState<RunnerSnapshot | null>(null);
  const [tests, setTests] = useState<TestResult[] | null>(null);
  const [input, setInput] = useState('');
  const runner = useRef<Runner | null>(null);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (!settings.showDiagnostics) return;
    const h = setTimeout(() => {
      try {
        setDiags(analyze(value, profile));
      } catch {
        setDiags([]);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [value, profile, settings.showDiagnostics]);

  useEffect(() => () => runner.current?.dispose(), []);

  const running = run?.status === 'running' || run?.status === 'input' || run?.status === 'paused';

  const execute = () => {
    runner.current?.dispose();
    setTests(null);
    const r = new Runner({
      code: value,
      profile,
      speed: 0,
      trackDesktop: false,
      onUpdate: (snap) => {
        setRun(snap);
        const busy = snap.status === 'running' || snap.status === 'input' || snap.status === 'paused';
        onBusy?.(busy ? 'running' : null);
      },
    });
    runner.current = r;
    onRun?.(`pregunta ${q.id}`);
    r.start('run');
  };

  const stop = () => runner.current?.stop();

  // Ctrl+Enter (o ⌘+Enter) ejecuta el programa
  const executeRef = useRef(execute);
  useEffect(() => {
    executeRef.current = execute;
  });
  const canRun = settings.allowRun && !readOnly;
  useEffect(() => {
    if (Platform.OS !== 'web' || !canRun || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        // en captura: antes de que el editor o un botón enfocado usen la tecla Enter
        e.preventDefault();
        e.stopPropagation();
        executeRef.current();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [canRun]);

  const test = () => {
    runner.current?.stop();
    setRun(null);
    onBusy?.('testing');
    // deja que se pinte el estado antes de ejecutar (puede tardar)
    setTimeout(() => {
      const res = runTests(value, q.tests ?? [], q.match ?? 'flexible', profile);
      setTests(res);
      onBusy?.(null);
      onTest?.(`${res.filter((x) => x.passed).length}/${res.length} casos de ejemplo correctos`);
    }, 30);
  };

  const output = (run?.output ?? []).filter((l) => l.kind !== 'canvas');
  const req = run?.status === 'input' ? run.inputRequest : null;

  return (
    <View>
      {q.rules?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {q.rules.map((r, i) => (
            <Pill key={i} icon={r.kind === 'contains' ? 'checkmark-done-outline' : 'ban-outline'} color={r.kind === 'contains' ? t.primary : t.warning} text={r.message || (r.kind === 'contains' ? `Debe usar «${r.pattern}»` : `No debe usar «${r.pattern}»`)} />
          ))}
        </View>
      ) : null}

      {q.tests?.length ? (
        <View style={[styles.examples, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>
            <Ionicons name="flask-outline" size={13} /> Ejemplos{q.hiddenTests ? ` (además se usarán ${q.hiddenTests} casos ocultos al calificar)` : ''}
          </Text>
          {q.tests.map((x, i) => (
            <View key={x.id} style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
              <Text style={{ color: t.textMuted, fontSize: 12, width: '100%' }}>{x.name || `Ejemplo ${i + 1}`}</Text>
              <Text style={{ color: t.text, fontSize: 12, fontFamily: MONO, marginRight: 14 }}>Datos: {x.inputs.length ? x.inputs.join(', ') : '(ninguno)'}</Text>
              <Text style={{ color: t.text, fontSize: 12, fontFamily: MONO }}>Salida: {x.expected.split('\n').join(' ⏎ ') || '(vacía)'}</Text>
            </View>
          ))}
          <Text style={{ color: t.textMuted, fontSize: 11 }}>Comparación: {MATCH_LABEL[q.match ?? 'flexible']}.</Text>
        </View>
      ) : null}

      <View style={[styles.editor, { borderColor: t.border }]}>
        <CodeEditor
          code={value}
          onChange={readOnly ? () => {} : onChange}
          breakpoints={[]}
          onToggleBreakpoint={() => {}}
          execLine={null}
          errorLine={run?.status === 'error' ? run.error?.line ?? null : null}
          diagnostics={settings.showDiagnostics ? diags : []}
          fontSize={fontSize}
          showSymbolBar={Platform.OS !== 'web'}
          assist={settings.allowAssist}
          blockPaste={settings.blockPaste}
          listenRequests={false}
        />
      </View>

      {!readOnly ? (
        <View style={styles.actions}>
          {settings.allowRun ? (
            running ? (
              <Button label="Detener" icon="stop" kind="danger" onPress={stop} />
            ) : (
              <Button label={Platform.OS === 'web' ? 'Ejecutar (Ctrl+Enter)' : 'Ejecutar'} icon="play" kind="primary" onPress={execute} />
            )
          ) : null}
          {settings.allowRun && q.tests?.length ? <Button label="Probar con los ejemplos" icon="flask-outline" onPress={test} disabled={running} /> : null}
          {q.starter !== undefined && value !== q.starter ? <Button label="Código inicial" icon="refresh" onPress={() => onChange(q.starter ?? '')} disabled={running} /> : null}
        </View>
      ) : null}

      {tests ? (
        <View style={[styles.console, { borderColor: t.border, backgroundColor: t.surface }]}>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: 6 }}>
            Resultado con los ejemplos: {tests.filter((x) => x.passed).length} de {tests.length} correctos
          </Text>
          {tests.map((x) => (
            <View key={x.id} style={[styles.testRow, { borderColor: x.passed ? t.success + '66' : t.danger + '66', backgroundColor: (x.passed ? t.success : t.danger) + '10' }]}>
              <Ionicons name={x.passed ? 'checkmark-circle' : 'close-circle'} size={18} color={x.passed ? t.success : t.danger} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: t.text, fontWeight: '600', fontSize: 13 }}>{x.name}</Text>
                {!x.passed ? (
                  <>
                    <Text style={{ color: t.textMuted, fontSize: 12, fontFamily: MONO }}>Esperado: {x.expected?.split('\n').join(' ⏎ ') || '(vacío)'}</Text>
                    <Text style={{ color: t.textMuted, fontSize: 12, fontFamily: MONO }}>Obtenido: {x.actual?.split('\n').join(' ⏎ ') || '(vacío)'}</Text>
                    {x.error ? <Text style={{ color: t.danger, fontSize: 12 }}>{x.error}</Text> : null}
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {run ? (
        <View style={[styles.terminal]}>
          <ScrollView ref={scroll} style={{ maxHeight: 220 }} contentContainerStyle={{ padding: 10 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
            {output.map((l) => (
              <Text
                key={l.id}
                selectable
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  lineHeight: 19,
                  color: l.kind === 'error' ? '#ff6b6b' : l.kind === 'system' ? '#6272a4' : l.kind === 'input' ? '#50fa7b' : l.kind === 'warn' ? '#f1fa8c' : '#f8f8f2',
                  fontStyle: l.kind === 'system' ? 'italic' : 'normal',
                }}
              >
                {l.kind === 'input' ? `${l.prompt ?? ''} › ${l.text}` : l.text || ' '}
              </Text>
            ))}
            {run.notice ? <Text style={{ color: '#ffb86c', fontFamily: MONO, fontSize: 12 }}>{run.notice}</Text> : null}
          </ScrollView>
          {req ? (
            <View style={styles.inputRow}>
              <Text style={{ color: '#8be9fd', fontFamily: MONO, fontSize: 12, marginRight: 8 }} numberOfLines={2}>
                {req.prompt || 'Dato:'}
              </Text>
              {req.mode === 'confirm' ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Button label="Aceptar" kind="primary" onPress={() => runner.current?.provideInput(true)} />
                  <Button label="Cancelar" onPress={() => runner.current?.provideInput(false)} />
                </View>
              ) : (
                <>
                  <TextInput
                    autoFocus
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={() => {
                      runner.current?.provideInput(input);
                      setInput('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.termInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                    placeholder="Escribe y presiona Enter"
                    placeholderTextColor="#6272a4"
                  />
                  <Pressable
                    onPress={() => {
                      runner.current?.provideInput(input);
                      setInput('');
                    }}
                    style={styles.sendBtn}
                    accessibilityLabel="Enviar dato"
                  >
                    <Ionicons name="return-down-back" size={16} color="#fff" />
                  </Pressable>
                </>
              )}
            </View>
          ) : null}
          {run.status === 'paused' ? (
            <View style={[styles.inputRow, { justifyContent: 'flex-end' }]}>
              <Button label="Continuar" icon="play" onPress={() => runner.current?.resume('run')} style={{ marginRight: 6 }} />
              <Button label="Detener" icon="stop" kind="danger" onPress={stop} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  examples: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, marginBottom: 10 },
  editor: { height: 300, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: 'hidden' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  console: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, marginTop: 10 },
  testRow: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 6 },
  terminal: { backgroundColor: '#1e1e1e', borderRadius: 8, marginTop: 10, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#333' },
  termInput: { flex: 1, color: '#f8f8f2', fontFamily: MONO, fontSize: 13, backgroundColor: '#2a2a2a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  sendBtn: { marginLeft: 6, backgroundColor: '#2f6fed', borderRadius: 6, padding: 7 },
});
