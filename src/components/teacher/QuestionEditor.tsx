/** Editor de una pregunta del examen (modo Maestro). */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { codeRule, codeTest, ExamIssue, MATCH_MODES, option, questionTypeInfo } from '../../core/exam/config';
import { expectedFromSolution, gradeQuestion, runProgram } from '../../core/exam/grading';
import type { ChoiceOption, CodeQuestion, Question } from '../../core/exam/types';
import { getProfile } from '../../core/profiles';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import { Button, IconButton } from '../ui';
import { Banner, Card, Field, IconName, NumberStepper, Pill, Segmented, TextField, Toggle } from '../exam/kit';

interface Props {
  q: Question;
  index: number;
  count: number;
  profileId: string;
  issues: ExamIssue[];
  onChange(q: Question): void;
  onMove(delta: number): void;
  onDuplicate(): void;
  onDelete(): void;
}

const lines = (v: string[]) => v.join('\n');
const split = (s: string) => (s === '' ? [] : s.split('\n'));

export default function QuestionEditor({ q, index, count, profileId, issues, onChange, onMove, onDuplicate, onDelete }: Props) {
  const t = useTheme();
  const info = questionTypeInfo(q.type);
  const up = (p: Partial<Question>) => onChange({ ...q, ...p } as Question);

  return (
    <View>
      <View style={styles.top}>
        <View style={[styles.typeIcon, { backgroundColor: t.primary + '1f' }]}>
          <Ionicons name={info.icon as IconName} size={20} color={t.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>
            Pregunta {index + 1} · {info.label}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>{info.description}</Text>
        </View>
        <IconButton icon="arrow-up" label="Subir" tooltip="Mover arriba" onPress={() => onMove(-1)} disabled={index === 0} />
        <IconButton icon="arrow-down" label="Bajar" tooltip="Mover abajo" onPress={() => onMove(1)} disabled={index === count - 1} />
        <IconButton icon="copy-outline" label="Duplicar" tooltip="Duplicar pregunta" onPress={onDuplicate} />
        <IconButton icon="trash-outline" label="Eliminar" tooltip="Eliminar pregunta" color={t.danger} onPress={onDelete} />
      </View>

      {issues.map((i, k) => (
        <Banner key={k} icon={i.severity === 'error' ? 'alert-circle' : 'warning-outline'} color={i.severity === 'error' ? t.danger : t.warning} text={i.message.replace(/^Pregunta \d+: /, '')} />
      ))}

      <Card>
        <Field label="Enunciado" hint="Lo que verá el alumno. Puedes marcar `código` entre comillas invertidas y bloques con ```.">
          <TextField value={q.prompt} onChangeText={(prompt) => up({ prompt })} multiline minHeight={80} placeholder="Escribe la pregunta…" />
        </Field>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Field label="Valor">
            <NumberStepper value={q.points} onChange={(points) => up({ points })} min={0.5} max={100} step={q.points < 2 ? 0.5 : 1} suffix={q.points === 1 ? 'punto' : 'puntos'} />
          </Field>
          <Field label="Tema (opcional)" hint="Para elegir preguntas por tema y ver resultados por tema." style={{ flex: 1, minWidth: 220 }}>
            <TextField value={q.topic ?? ''} onChangeText={(topic) => up({ topic: topic.trim() ? topic : undefined })} placeholder="Ej. Arreglos" />
          </Field>
        </View>
        {q.type !== 'code' && q.type !== 'output' && q.type !== 'order' ? (
          <Field label="Código de apoyo (opcional)" hint="Se muestra debajo del enunciado, con colores.">
            <TextField value={q.code ?? ''} onChangeText={(code) => up({ code: code || undefined })} mono multiline minHeight={70} placeholder="// por ejemplo: let x = 5;" />
          </Field>
        ) : null}
      </Card>

      <TypeEditor q={q} up={up} profileId={profileId} />
    </View>
  );
}

function TypeEditor({ q, up, profileId }: { q: Question; up(p: Partial<Question>): void; profileId: string }) {
  const t = useTheme();
  switch (q.type) {
    case 'single':
    case 'multiple':
      return <OptionsEditor options={q.options} multi={q.type === 'multiple'} onChange={(options) => up({ options })} extra={q.type === 'multiple' ? <Toggle label="Puntos parciales" description="Si acierta algunas, recibe parte de los puntos (los errores restan)." value={q.partialCredit} onChange={(partialCredit) => up({ partialCredit } as any)} /> : null} />;
    case 'truefalse':
      return (
        <Card>
          <Field label="La afirmación es…">
            <Segmented
              options={[
                { id: 'v', label: 'Verdadera', icon: 'checkmark-circle-outline' },
                { id: 'f', label: 'Falsa', icon: 'close-circle-outline' },
              ]}
              value={q.answer ? 'v' : 'f'}
              onChange={(v) => up({ answer: v === 'v' } as any)}
            />
          </Field>
        </Card>
      );
    case 'short':
      return (
        <Card>
          <Field label="Respuestas aceptadas" hint="Se ignoran espacios extra, acentos y el punto final. Agrega variantes válidas.">
            {q.answers.map((a, i) => (
              <View key={i} style={styles.row}>
                <TextField value={a} onChangeText={(v) => up({ answers: q.answers.map((x, j) => (j === i ? v : x)) } as any)} placeholder={`Respuesta ${i + 1}`} style={{ flex: 1 }} autoCapitalize="none" />
                <IconButton icon="close" label="Quitar" onPress={() => up({ answers: q.answers.filter((_, j) => j !== i) } as any)} disabled={q.answers.length === 1} />
              </View>
            ))}
            <Button label="Agregar variante" icon="add" onPress={() => up({ answers: [...q.answers, ''] } as any)} style={{ alignSelf: 'flex-start' }} />
          </Field>
          <Toggle label="Distinguir mayúsculas y acentos" value={q.caseSensitive} onChange={(caseSensitive) => up({ caseSensitive } as any)} />
        </Card>
      );
    case 'numeric':
      return (
        <Card>
          <Field label="Respuesta correcta">
            <NumberText value={q.answer} onChange={(answer) => up({ answer } as any)} />
          </Field>
          <Field label="Tolerancia (±)" hint="0 = debe ser exacta. Útil para decimales (por ejemplo 0.01).">
            <NumberStepper value={q.tolerance} onChange={(tolerance) => up({ tolerance } as any)} min={0} max={1e6} step={0.01} width={90} />
          </Field>
        </Card>
      );
    case 'output':
      return <OutputEditor q={q} up={up} profileId={profileId} />;
    case 'code':
      return <CodeEditorForm q={q} up={up} profileId={profileId} />;
    case 'order':
      return (
        <Card>
          <Field label="Líneas en el orden CORRECTO" hint="Una por renglón; la sangría se conserva. Al alumno se le mostrarán revueltas.">
            <TextField value={lines(q.lines)} onChangeText={(v) => up({ lines: v.split('\n') } as any)} mono multiline minHeight={140} />
          </Field>
          <Toggle label="Puntos parciales" description="Otorga puntos según cuántas líneas quedaron en la secuencia correcta." value={q.partialCredit} onChange={(partialCredit) => up({ partialCredit } as any)} />
          <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 8 }}>{q.lines.filter((l) => l.trim()).length} líneas</Text>
        </Card>
      );
  }
}

/** Campo numérico que permite escribir decimales y negativos sin perder lo tecleado. */
function NumberText({ value, onChange }: { value: number; onChange(n: number): void }) {
  const [text, setText] = useState(String(value));
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    if (Number(text.replace(',', '.')) !== value) setText(String(value));
  }
  return (
    <TextField
      value={text}
      onChangeText={(v) => {
        setText(v);
        const n = Number(v.replace(',', '.'));
        if (v.trim() && Number.isFinite(n)) onChange(n);
      }}
      keyboardType="numeric"
      style={{ maxWidth: 200 }}
    />
  );
}

function OptionsEditor({ options, multi, onChange, extra }: { options: ChoiceOption[]; multi: boolean; onChange(o: ChoiceOption[]): void; extra?: React.ReactNode }) {
  const t = useTheme();
  const set = (i: number, p: Partial<ChoiceOption>) => onChange(options.map((o, j) => (j === i ? { ...o, ...p } : o)));
  return (
    <Card>
      <Field label="Opciones" hint={multi ? 'Marca todas las opciones correctas.' : 'Toca el círculo de la opción correcta.'}>
        {options.map((o, i) => (
          <View key={o.id} style={styles.row}>
            <Pressable
              onPress={() => (multi ? set(i, { correct: !o.correct }) : onChange(options.map((x, j) => ({ ...x, correct: j === i }))))}
              accessibilityLabel={o.correct ? 'Correcta' : 'Marcar como correcta'}
              style={[styles.mark, { borderColor: o.correct ? t.success : t.border, backgroundColor: o.correct ? t.success : 'transparent', borderRadius: multi ? 6 : 14 }]}
            >
              {o.correct ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
            </Pressable>
            <TextField value={o.text} onChangeText={(text) => set(i, { text })} placeholder={`Opción ${String.fromCharCode(65 + i)}`} style={{ flex: 1, borderColor: o.correct ? t.success : t.border }} />
            <IconButton icon="close" label="Quitar opción" onPress={() => onChange(options.filter((_, j) => j !== i))} disabled={options.length <= 2} />
          </View>
        ))}
        <Button label="Agregar opción" icon="add" onPress={() => onChange([...options, option()])} style={{ alignSelf: 'flex-start' }} disabled={options.length >= 10} />
      </Field>
      {extra}
    </Card>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setV(value), ms);
    return () => clearTimeout(h);
  }, [value, ms]);
  return v;
}

function OutputEditor({ q, up, profileId }: { q: Extract<Question, { type: 'output' }>; up(p: Partial<Question>): void; profileId: string }) {
  const t = useTheme();
  const code = useDebounced(q.code ?? '', 400);
  const inputs = useDebounced(q.inputs, 400);
  const preview = useMemo(() => {
    try {
      return runProgram(code, getProfile(profileId), inputs);
    } catch (e: any) {
      return { output: '', error: String(e?.message ?? e), needsInput: false, tooLong: false };
    }
  }, [code, inputs, profileId]);
  return (
    <Card>
      <Field label="Programa que el alumno debe analizar">
        <TextField value={q.code ?? ''} onChangeText={(code) => up({ code } as any)} mono multiline minHeight={140} />
      </Field>
      <Field label="Datos para prompt() (opcional)" hint="Uno por renglón, en el orden en que el programa los pide.">
        <TextField value={lines(q.inputs)} onChangeText={(v) => up({ inputs: split(v) } as any)} mono multiline minHeight={50} />
      </Field>
      <Field label="Cómo comparar la respuesta">
        <Segmented options={MATCH_MODES.map((m) => ({ id: m.id, label: m.label }))} value={q.match} onChange={(match) => up({ match } as any)} />
        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>{MATCH_MODES.find((m) => m.id === q.match)?.description}</Text>
      </Field>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>Respuesta correcta (se calcula ejecutando el programa)</Text>
      <View style={[styles.terminal, { backgroundColor: t.terminal.bg }]}>
        <Text style={{ color: t.terminal.text, fontFamily: MONO, fontSize: 13 }}>{preview.output || '(sin salida)'}</Text>
        {preview.error ? <Text style={{ color: t.terminal.error, fontFamily: MONO, fontSize: 12, marginTop: 4 }}>{preview.error}</Text> : null}
        {preview.needsInput ? <Text style={{ color: t.terminal.warn, fontFamily: MONO, fontSize: 12, marginTop: 4 }}>El programa pide más datos de los que escribiste.</Text> : null}
      </View>
    </Card>
  );
}

const RULE_PRESETS: { kind: 'contains' | 'notContains'; pattern: string; message: string }[] = [
  { kind: 'contains', pattern: 'for', message: 'Usa un ciclo for.' },
  { kind: 'contains', pattern: 'while', message: 'Usa un ciclo while.' },
  { kind: 'contains', pattern: 'if', message: 'Usa una condición if.' },
  { kind: 'contains', pattern: 'function', message: 'Define al menos una función.' },
  { kind: 'notContains', pattern: 'sort', message: 'No uses .sort(): ordénalo tú.' },
  { kind: 'notContains', pattern: 'Math', message: 'No uses Math.' },
];

function CodeEditorForm({ q, up, profileId }: { q: CodeQuestion; up(p: Partial<Question>): void; profileId: string }) {
  const t = useTheme();
  const [check, setCheck] = useState<string | null>(null);
  const [checkOk, setCheckOk] = useState(true);
  const profile = getProfile(profileId);
  const setTest = (i: number, p: Partial<CodeQuestion['tests'][number]>) => up({ tests: q.tests.map((x, j) => (j === i ? { ...x, ...p } : x)) } as any);
  const setRule = (i: number, p: Partial<CodeQuestion['rules'][number]>) => up({ rules: q.rules.map((x, j) => (j === i ? { ...x, ...p } : x)) } as any);

  const fillExpected = () => {
    if (!q.solution.trim()) {
      setCheckOk(false);
      setCheck('Primero escribe la solución de referencia.');
      return;
    }
    const res = expectedFromSolution(q, profile);
    const errors = res.filter((r) => r.error);
    up({ tests: q.tests.map((x) => ({ ...x, expected: res.find((r) => r.id === x.id)?.output ?? x.expected })) } as any);
    setCheckOk(!errors.length);
    setCheck(errors.length ? `Se calcularon las salidas, pero ${errors.length} caso(s) tuvieron problemas: ${errors[0].error}` : `Listo: se calcularon las salidas de ${res.length} caso(s) con tu solución.`);
  };

  const verify = () => {
    const r = gradeQuestion(q, q.solution, profile);
    setCheckOk(r.status === 'correct');
    setCheck(r.status === 'correct' ? `Tu solución obtiene ${r.score}/${r.max}: los casos y requisitos son consistentes.` : `Tu solución obtiene ${r.score}/${r.max}. ${r.feedback}`);
  };

  return (
    <>
      <Card>
        <Field label="Código inicial para el alumno" hint="Puede ser un comentario, una plantilla o un programa con errores para corregir.">
          <TextField value={q.starter} onChangeText={(starter) => up({ starter } as any)} mono multiline minHeight={90} />
        </Field>
        <Field label="Tu solución (privada)" hint="No se envía al alumno. Sirve para calcular las salidas esperadas y verificar los casos.">
          <TextField value={q.solution} onChangeText={(solution) => up({ solution } as any)} mono multiline minHeight={140} placeholder="// escribe aquí la solución correcta" />
        </Field>
        <Field label="Cómo comparar la salida">
          <Segmented options={MATCH_MODES.map((m) => ({ id: m.id, label: m.label }))} value={q.match} onChange={(match) => up({ match } as any)} />
          <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>{MATCH_MODES.find((m) => m.id === q.match)?.description}</Text>
        </Field>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, flex: 1 }}>Casos de prueba</Text>
          <Button label="Calcular salidas con la solución" icon="flash-outline" onPress={fillExpected} />
          <Button label="Verificar solución" icon="shield-checkmark-outline" onPress={verify} />
        </View>
        {check ? <Banner icon={checkOk ? 'checkmark-circle' : 'alert-circle'} color={checkOk ? t.success : t.warning} text={check} onClose={() => setCheck(null)} /> : null}
        {q.tests.map((x, i) => (
          <View key={x.id} style={[styles.test, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
            <View style={styles.row}>
              <TextField value={x.name} onChangeText={(name) => setTest(i, { name })} placeholder={`Caso ${i + 1}`} style={{ flex: 1, backgroundColor: t.surface }} />
              <Pressable onPress={() => setTest(i, { hidden: !x.hidden })} style={[styles.hiddenBtn, { borderColor: x.hidden ? t.accent : t.border, backgroundColor: x.hidden ? t.accent + '18' : t.surface }]}>
                <Ionicons name={x.hidden ? 'eye-off-outline' : 'eye-outline'} size={15} color={x.hidden ? t.accent : t.textMuted} />
                <Text style={{ color: x.hidden ? t.accent : t.textMuted, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>{x.hidden ? 'Oculto' : 'Visible'}</Text>
              </Pressable>
              <IconButton icon="trash-outline" label="Quitar caso" color={t.danger} onPress={() => up({ tests: q.tests.filter((_, j) => j !== i) } as any)} />
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.small(t.textMuted)}>Llamada a evaluar (opcional)</Text>
              <TextField value={x.call ?? ''} onChangeText={(call) => setTest(i, { call: call.trim() ? call : undefined })} mono placeholder='Ej. reverseString("hola") — se compara lo que devuelve, en JSON' style={{ backgroundColor: t.surface }} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={styles.small(t.textMuted)}>Datos (uno por renglón)</Text>
                <TextField value={lines(x.inputs)} onChangeText={(v) => setTest(i, { inputs: split(v) })} mono multiline minHeight={60} style={{ backgroundColor: t.surface }} />
              </View>
              <View style={{ flex: 1.4, minWidth: 200 }}>
                <Text style={styles.small(t.textMuted)}>{x.call ? 'Valor esperado (JSON, p. ej. "aloh" o [1,2])' : 'Salida esperada'}</Text>
                <TextField value={x.expected} onChangeText={(expected) => setTest(i, { expected })} mono multiline minHeight={60} style={{ backgroundColor: t.surface }} />
              </View>
            </View>
          </View>
        ))}
        <Button label="Agregar caso de prueba" icon="add" onPress={() => up({ tests: [...q.tests, codeTest({ name: `Caso ${q.tests.length + 1}` })] } as any)} style={{ alignSelf: 'flex-start' }} />
        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 8, lineHeight: 17 }}>
          Los casos visibles sirven de ejemplo y el alumno puede probarlos. Los ocultos solo se usan al calificar (evitan que el programa «adivine» las respuestas).
        </Text>
      </Card>

      <Card>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 4 }}>Requisitos del código (opcional)</Text>
        <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 10 }}>Cada requisito cuenta como un caso más al calificar. Se ignoran comentarios y textos.</Text>
        {q.rules.map((r, i) => (
          <View key={r.id} style={[styles.row, { flexWrap: 'wrap' }]}>
            <Segmented
              options={[
                { id: 'contains', label: 'Debe usar' },
                { id: 'notContains', label: 'No debe usar' },
              ]}
              value={r.kind}
              onChange={(kind) => setRule(i, { kind })}
            />
            <TextField value={r.pattern} onChangeText={(pattern) => setRule(i, { pattern })} placeholder="for" mono autoCapitalize="none" style={{ width: 120 }} />
            <TextField value={r.message} onChangeText={(message) => setRule(i, { message })} placeholder="Mensaje para el alumno" style={{ flex: 1, minWidth: 160 }} />
            <IconButton icon="trash-outline" label="Quitar requisito" color={t.danger} onPress={() => up({ rules: q.rules.filter((_, j) => j !== i) } as any)} />
          </View>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {RULE_PRESETS.map((p) => (
            <Pressable key={p.kind + p.pattern} onPress={() => up({ rules: [...q.rules, codeRule(p)] } as any)} style={[styles.preset, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
              <Ionicons name="add" size={13} color={t.primary} />
              <Text style={{ color: t.text, fontSize: 12, marginLeft: 3 }}>
                {p.kind === 'contains' ? 'Usar' : 'Sin'} <Text style={{ fontFamily: MONO }}>{p.pattern}</Text>
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => up({ rules: [...q.rules, codeRule()] } as any)} style={[styles.preset, { borderColor: t.primary, backgroundColor: t.surface }]}>
            <Ionicons name="add" size={13} color={t.primary} />
            <Text style={{ color: t.primary, fontSize: 12, marginLeft: 3, fontWeight: '700' }}>Otro requisito</Text>
          </Pressable>
        </View>
      </Card>
      {q.tests.some((x) => x.hidden) ? <Pill icon="eye-off-outline" color={t.accent} text={`${q.tests.filter((x) => x.hidden).length} caso(s) oculto(s)`} /> : null}
    </>
  );
}

const styles = {
  ...StyleSheet.create({
    top: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
    typeIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    mark: { width: 28, height: 28, borderWidth: BORDER, alignItems: 'center', justifyContent: 'center' },
    terminal: { borderRadius: RADIUS.md, padding: 10 },
    test: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10, marginBottom: 10 },
    hiddenBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: 10, height: 40 },
    preset: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.lg, paddingHorizontal: 10, paddingVertical: 5 },
  }),
  small: (color: string) => ({ color, fontSize: 12, marginBottom: 4 }),
};
