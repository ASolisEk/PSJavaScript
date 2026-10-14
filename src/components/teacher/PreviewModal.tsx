/** Vista previa: el maestro presenta su examen como lo vería un alumno y lo califica. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { gradePaper } from '../../core/exam/grading';
import { buildPaper, isAnswered } from '../../core/exam/paper';
import { randomId } from '../../core/exam/random';
import type { Answers, ExamConfig, GradeResult } from '../../core/exam/types';
import { useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { Button } from '../ui';
import { Banner, Card, Pill } from '../exam/kit';
import QuestionView from '../exam/QuestionView';
import RichText from '../exam/RichText';

export default function PreviewModal({ exam, onClose }: { exam: ExamConfig; onClose(): void }) {
  const t = useTheme();
  const [seed, setSeed] = useState(() => randomId('vista'));
  const { paper, key } = useMemo(() => buildPaper(exam, seed), [exam, seed]);
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<GradeResult | null>(null);
  const q = paper.questions[current];

  const reset = () => {
    setSeed(randomId('vista'));
    setAnswers({});
    setCurrent(0);
    setResult(null);
  };

  return (
    <ModalShell title="Vista previa del alumno" onClose={onClose} wide>
      <View style={[styles.bar, { borderBottomColor: t.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }} style={{ flex: 1 }}>
          {paper.questions.map((x, i) => {
            const done = isAnswered(x, answers[x.id]);
            const r = result?.questions.find((y) => y.questionId === x.id);
            const color = r ? (r.status === 'correct' ? t.success : r.status === 'partial' ? t.warning : t.danger) : done ? t.primary : t.border;
            return (
              <Pressable key={x.id} onPress={() => setCurrent(i)} style={[styles.nav, { borderColor: i === current ? t.text : color, backgroundColor: done || r ? color : t.surface, borderWidth: i === current ? 2 : 1 }]}>
                <Text style={{ color: done || r ? '#fff' : t.text, fontWeight: '800', fontSize: 12 }}>{i + 1}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Button label="Otra versión" icon="shuffle-outline" onPress={reset} style={{ marginLeft: 8 }} />
        <Button label="Calificar" icon="checkmark-done-outline" kind="primary" onPress={() => setResult(gradePaper(exam, key, answers))} style={{ marginLeft: 8 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Banner icon="eye-outline" color={t.info} text="Así lo verá un alumno (cada uno recibe una versión mezclada distinta). Nada de esto se guarda." />
        {result ? (
          <Card accent={result.passed ? t.success : t.danger}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Ionicons name="school-outline" size={20} color={t.text} />
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>
                Calificación: {result.grade}/{result.scale}
              </Text>
              <Pill text={`${result.score}/${result.max} pts · ${result.percent}%`} color={t.primary} />
              <Pill text={result.passed ? 'Aprobado' : 'No aprobado'} color={result.passed ? t.success : t.danger} solid />
            </View>
          </Card>
        ) : null}
        {q ? (
          <Card>
            <QuestionView key={q.id} q={q} index={current} total={paper.questions.length} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} settings={paper.settings} />
            {(() => {
              const r = result?.questions.find((y) => y.questionId === q.id);
              if (!r) return null;
              return (
                <View style={[styles.feedback, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
                  <Text style={{ color: t.text, fontWeight: '700' }}>
                    {r.score}/{r.max} puntos
                  </Text>
                  <RichText text={r.feedback} style={{ color: t.text }} />
                  {r.tests?.map((x) => (
                    <Text key={x.id} style={{ color: x.passed ? t.success : t.danger, fontSize: 12, marginTop: 3 }}>
                      {x.passed ? '✓' : '✗'} {x.name}
                      {x.hidden ? ' (oculto)' : ''}
                      {!x.passed && x.error ? ` — ${x.error}` : ''}
                    </Text>
                  ))}
                  {r.rules?.map((x, i) => (
                    <Text key={i} style={{ color: x.passed ? t.success : t.danger, fontSize: 12, marginTop: 3 }}>
                      {x.passed ? '✓' : '✗'} {x.message}
                    </Text>
                  ))}
                </View>
              );
            })()}
          </Card>
        ) : (
          <Text style={{ color: t.textMuted }}>El examen no tiene preguntas.</Text>
        )}
        <View style={{ flexDirection: 'row' }}>
          <Button label="Anterior" icon="chevron-back" onPress={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} />
          <View style={{ flex: 1 }} />
          <Button label="Siguiente" icon="chevron-forward" onPress={() => setCurrent((c) => Math.min(paper.questions.length - 1, c + 1))} disabled={current >= paper.questions.length - 1} />
        </View>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  nav: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  feedback: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, marginTop: 12 },
});
