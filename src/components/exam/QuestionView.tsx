/** Muestra una pregunta del examen y el control para responderla. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { questionTypeInfo } from '../../core/exam/config';
import type { AnswerValue, PaperQuestion, PaperSettings } from '../../core/exam/types';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import CodeAnswer from './CodeAnswer';
import { CodeBlock, IconName, Pill, TextField } from './kit';
import RichText from './RichText';

interface Props {
  q: PaperQuestion;
  index: number;
  total: number;
  value: AnswerValue | undefined;
  onChange(v: AnswerValue): void;
  settings: PaperSettings;
  flagged?: boolean;
  onToggleFlag?(): void;
  onRun?(detail: string): void;
  onTest?(detail: string): void;
  onBusy?(kind: 'running' | 'testing' | null): void;
  /** Tamaño de letra base (14 = normal). */
  fontSize?: number;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function QuestionView({ q, index, total, value, onChange, settings, flagged, onToggleFlag, onRun, onTest, onBusy, fontSize = 14 }: Props) {
  const t = useTheme();
  const k = fontSize / 14;
  const info = questionTypeInfo(q.type);
  return (
    <View>
      <View style={styles.head}>
        <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: '700' }}>
          Pregunta {index + 1} de {total}
        </Text>
        <Pill text={`${q.points} ${q.points === 1 ? 'punto' : 'puntos'}`} color={t.accent} icon="star-outline" />
        <Pill text={info.label} color={t.primary} icon={info.icon as IconName} />
        {q.topic ? <Pill text={q.topic} icon="pricetag-outline" /> : null}
        <View style={{ flex: 1 }} />
        {onToggleFlag ? (
          <Pressable onPress={onToggleFlag} style={[styles.flag, { borderColor: flagged ? t.warning : t.border, backgroundColor: flagged ? t.warning + '20' : 'transparent' }]} accessibilityLabel="Marcar para revisar">
            <Ionicons name={flagged ? 'flag' : 'flag-outline'} size={14} color={flagged ? t.warning : t.textMuted} />
            <Text style={{ color: flagged ? t.warning : t.textMuted, fontSize: 12, marginLeft: 4, fontWeight: '600' }}>{flagged ? 'Marcada' : 'Revisar después'}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ marginBottom: 8 }}>
        <RichText text={q.prompt} style={{ color: t.text, fontSize: Math.round(17 * k), lineHeight: Math.round(25 * k), fontWeight: '600' }} />
      </View>

      {q.code && q.type !== 'code' ? <CodeBlock code={q.code} /> : null}

      <AnswerInput q={q} value={value} onChange={onChange} settings={settings} onRun={onRun} onTest={onTest} onBusy={onBusy} fontSize={fontSize} />
    </View>
  );
}

function AnswerInput({ q, value, onChange, settings, onRun, onTest, onBusy, fontSize = 14 }: Omit<Props, 'index' | 'total'>) {
  const t = useTheme();
  const k = fontSize / 14;
  switch (q.type) {
    case 'single':
    case 'multiple': {
      const multi = q.type === 'multiple';
      const sel = new Set(multi ? (Array.isArray(value) ? value : []) : typeof value === 'string' ? [value] : []);
      return (
        <View>
          {multi ? <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 8 }}>Marca todas las respuestas correctas.</Text> : null}
          {(q.options ?? []).map((o, i) => {
            const on = sel.has(o.id);
            return (
              <Pressable
                key={o.id}
                onPress={() => {
                  if (!multi) return onChange(o.id);
                  const next = new Set(sel);
                  if (on) next.delete(o.id);
                  else next.add(o.id);
                  onChange([...next]);
                }}
                accessibilityRole={multi ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: on }}
                style={({ pressed }) => [styles.option, { borderColor: on ? t.accent : t.border, backgroundColor: on ? t.accentSoft : pressed ? t.surfaceAlt : t.surface }]}
              >
                <View style={[styles.letter, { backgroundColor: on ? t.accent : t.surfaceAlt, borderRadius: multi ? RADIUS.sm : 14 }]}>
                  {on ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={{ color: t.textMuted, fontWeight: '800', fontSize: 13 }}>{LETTERS[i]}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <RichText text={o.text} style={{ color: t.text, fontSize: Math.round(15 * k), lineHeight: Math.round(21 * k) }} />
                </View>
              </Pressable>
            );
          })}
        </View>
      );
    }
    case 'truefalse':
      return (
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {[
            { v: true, label: 'Verdadero', icon: 'checkmark-circle-outline' as IconName, color: t.success },
            { v: false, label: 'Falso', icon: 'close-circle-outline' as IconName, color: t.danger },
          ].map((o) => {
            const on = value === o.v;
            return (
              <Pressable
                key={o.label}
                onPress={() => onChange(o.v)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.tf, { borderColor: on ? o.color : t.border, backgroundColor: on ? o.color + '18' : t.surface }]}
              >
                <Ionicons name={o.icon} size={28} color={on ? o.color : t.textMuted} />
                <Text style={{ color: on ? o.color : t.text, fontWeight: '800', fontSize: 16, marginTop: 4 }}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );
    case 'short':
      return <TextField value={typeof value === 'string' ? value : ''} onChangeText={onChange} placeholder="Escribe tu respuesta" autoCapitalize="none" />;
    case 'numeric':
      return <TextField value={typeof value === 'string' ? value : ''} onChangeText={(v) => onChange(v.replace(/[^0-9.,\-eE]/g, ''))} placeholder="Escribe un número" keyboardType="numeric" style={{ maxWidth: 260 }} />;
    case 'output':
      return (
        <View>
          {q.inputs?.length ? (
            <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 6 }}>
              Datos que se ingresan con prompt(): <Text style={{ fontFamily: MONO, color: t.text }}>{q.inputs.join(', ')}</Text>
            </Text>
          ) : null}
          <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 6 }}>Escribe lo que se muestra en la consola (una línea por cada console.log).</Text>
          <TextField value={typeof value === 'string' ? value : ''} onChangeText={onChange} mono multiline minHeight={110} placeholder="Salida del programa…" />
        </View>
      );
    case 'code':
      return <CodeAnswer key={q.id} q={q} value={typeof value === 'string' ? value : q.starter ?? ''} onChange={onChange} settings={settings} onRun={onRun} onTest={onTest} onBusy={onBusy} fontSize={fontSize} />;
    case 'order':
      return <OrderAnswer q={q} value={value} onChange={onChange} fontSize={fontSize} />;
  }
  return null;
}

function OrderAnswer({ q, value, onChange, fontSize }: { q: PaperQuestion; value: AnswerValue | undefined; onChange(v: AnswerValue): void; fontSize: number }) {
  const t = useTheme();
  const lines = q.lines ?? [];
  const byId = new Map(lines.map((l) => [l.id, l]));
  const order = Array.isArray(value) && value.length === lines.length && value.every((id) => byId.has(id)) ? value : lines.map((l) => l.id);
  const [picked, setPicked] = React.useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <View>
      <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 8 }}>Usa las flechas (o toca una línea y luego el lugar al que va) para ordenar el programa.</Text>
      {order.map((id, i) => {
        const l = byId.get(id)!;
        const isPicked = picked === i;
        return (
          <View key={id} style={[styles.orderRow, { borderColor: isPicked ? t.accent : t.border, backgroundColor: isPicked ? t.accentSoft : t.surface }]}>
            <Text style={{ color: t.textMuted, width: 22, fontFamily: MONO, fontSize: 12 }}>{i + 1}</Text>
            <Pressable
              style={{ flex: 1, paddingVertical: 6 }}
              onPress={() => {
                if (picked === null) setPicked(i);
                else {
                  move(picked, i);
                  setPicked(null);
                }
              }}
            >
              <Text style={{ color: t.text, fontFamily: MONO, fontSize }}>{l.text.replace(/^\s+/, (m) => ' '.repeat(m.length))}</Text>
            </Pressable>
            <Pressable onPress={() => move(i, i - 1)} disabled={i === 0} hitSlop={6} style={styles.arrow} accessibilityLabel="Subir línea">
              <Ionicons name="arrow-up" size={18} color={i === 0 ? t.border : t.text} />
            </Pressable>
            <Pressable onPress={() => move(i, i + 1)} disabled={i === order.length - 1} hitSlop={6} style={styles.arrow} accessibilityLabel="Bajar línea">
              <Ionicons name="arrow-down" size={18} color={i === order.length - 1 ? t.border : t.text} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  flag: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.lg, paddingHorizontal: 10, paddingVertical: 4 },
  option: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, padding: 12, marginBottom: 8 },
  letter: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tf: { flex: 1, minWidth: 140, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: RADIUS.md, paddingVertical: 18 },
  orderRow: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: 10, marginBottom: 6 },
  arrow: { padding: 6, marginLeft: 2 },
});
