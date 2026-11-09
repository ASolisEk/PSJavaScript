/** Resultado del examen o de la práctica: calificación, temas y revisión de cada pregunta. */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../../ui/text';
import { plainText } from '../../../core/exam/richText';
import { CERTIFICATIONS, practiceKey } from '../../../core/exam/certs';
import { practiceTopicFor } from '../../../core/exam/review';
import type { PaperQuestion, StudentResultView, TopicScore } from '../../../core/exam/types';
import { useApp } from '../../../store/app';
import { useStudent } from '../../../store/student';
import { MONO, useTheme } from '../../../ui/theme';
import { Button, Heading } from '../../ui';
import { Card, IconName, IOBlock, Pill, ProgressBar, ScreenHeader, Segmented } from '../kit';
import { exitFullscreen } from '../lockdown';
import RichText from '../RichText';

import { placeLabel, styles } from './shared';

// ───────────────────────────── resultado ─────────────────────────────

export const STATUS: Record<string, { icon: IconName; label: string; color: 'success' | 'warning' | 'danger' | 'textMuted' }> = {
  correct: { icon: 'checkmark-circle', label: 'Correcta', color: 'success' },
  partial: { icon: 'remove-circle', label: 'Parcial', color: 'warning' },
  wrong: { icon: 'close-circle', label: 'Incorrecta', color: 'danger' },
  blank: { icon: 'ellipse-outline', label: 'Sin responder', color: 'textMuted' },
};

export type ResultFilter = 'all' | 'review' | 'correct';

/** Certificación de una práctica individual («fcc/simulacro»; las claves sin prefijo son de freeCodeCamp). */
export function practiceCertification(key: string) {
  const slash = key.indexOf('/');
  return CERTIFICATIONS.find((c) => slash > 0 && c.id === key.slice(0, slash)) ?? CERTIFICATIONS.find((c) => c.id === 'fcc') ?? CERTIFICATIONS[0];
}

/** Vuelve a practicar (la misma práctica u otra, p. ej. un tema débil) con el mismo nombre. */
export function practiceAgain(key: string) {
  const name = useStudent.getState().session?.identity.name ?? '';
  useStudent.getState().leave();
  useStudent.getState().practice(key, name);
}

export function ResultView() {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const r: StudentResultView | null = s.result;
  const [filter, setFilter] = useState<ResultFilter>('all');
  // el examen terminó: se sale del modo bloqueado
  useEffect(() => exitFullscreen(), []);
  const [topic, setTopic] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const listY = useRef(0);
  const exit = () => {
    useStudent.getState().leave();
    useApp.getState().setAppMode('ide');
  };
  const review = r?.visibility === 'review';
  const reason = s.submitReason === 'timeout' ? 'Se terminó el tiempo y tu examen se envió automáticamente.' : s.submitReason === 'closed' ? 'El maestro cerró el examen y tus respuestas se enviaron automáticamente.' : s.submitReason === 'teacher' ? 'El maestro recogió tu examen.' : s.practiceKey ? 'Revisa abajo qué acertaste y la respuesta correcta de cada pregunta.' : 'Tu examen fue entregado.';
  const graded = !!r && r.visibility !== 'none';
  const questions = (r?.questions ?? []).map((qr, i) => ({ qr, i, pq: s.paper?.questions.find((x) => x.id === qr.questionId) }));
  const toReview = questions.filter((x) => x.qr.status !== 'correct').length;
  const shown = questions.filter(({ qr, pq }) => (filter === 'all' || (filter === 'correct' ? qr.status === 'correct' : qr.status !== 'correct')) && (!topic || pq?.topic === topic));
  // temas de la misma certificación que se pueden practicar por separado
  const cert = s.practiceKey ? practiceCertification(s.practiceKey) : null;
  const practiceTopics = cert ? new Set(cert.practiceOptions().topics.map((o) => o.key)) : null;
  const topicKey = (name: string) => (cert ? practiceKey(cert.id, `tema:${name}`) : '');
  const pickTopic = (name: string) => {
    setTopic((cur) => (cur === name ? null : name));
    // lleva al alumno a las preguntas de ese tema
    setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, listY.current - 8), animated: true }), 50);
  };
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader icon="school-outline" title={s.paper?.title ?? s.room?.title ?? 'Examen'} subtitle={`${s.identity.name} · ${placeLabel(s)}`} color={t.success} right={r ? <Button label="Salir" icon="exit-outline" kind="primary" onPress={exit} /> : null} />
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 620 }}>
          {!r ? (
            <Card style={{ alignItems: 'center' }}>
              <ActivityIndicator color={t.primary} />
              <Text style={{ color: t.text, marginTop: 10 }}>Esperando la calificación…</Text>
            </Card>
          ) : (
            <>
              <Card accent={!graded ? t.success : r.passed ? t.success : t.danger} style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name={!graded ? 'checkmark-done-circle' : r.passed ? 'ribbon' : 'school'} size={54} color={!graded || r.passed ? t.success : t.danger} />
                <Heading level="display" style={{ marginTop: 6, textAlign: 'center' }}>{s.practiceKey ? '¡Práctica terminada!' : '¡Examen enviado!'}</Heading>
                <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>{reason}</Text>
                {graded ? (
                  <>
                    <Text style={{ color: r.passed ? t.success : t.danger, fontSize: 52, fontWeight: '900', marginTop: 12 }}>
                      {r.grade}
                      <Text style={{ fontSize: 22, color: t.textMuted }}> / {r.scale}</Text>
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 14 }}>
                      {r.score} de {r.max} puntos · {r.percent}%{s.paper ? ` · mínimo para aprobar ${s.paper.settings.passPercent}%` : ''}
                    </Text>
                    <View style={{ marginTop: 10 }}>
                      <Pill solid icon={r.passed ? 'ribbon-outline' : 'alert-outline'} text={r.passed ? 'Aprobado' : 'No aprobado'} color={r.passed ? t.success : t.danger} />
                    </View>
                  </>
                ) : (
                  <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 10, textAlign: 'center' }}>Tu maestro te dará a conocer la calificación.</Text>
                )}
                {s.practiceKey ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                    <Button label="Practicar de nuevo" icon="refresh" kind="primary" onPress={() => practiceAgain(s.practiceKey!)} />
                  </View>
                ) : null}
              </Card>
              {r.topics?.length ? (
                <TopicsCard
                  topics={r.topics}
                  passPercent={s.paper?.settings.passPercent ?? 60}
                  selected={topic}
                  onPick={questions.length ? pickTopic : undefined}
                  // en una práctica: el mismo tema; en un examen del maestro: el tema parecido de la práctica incluida
                  canPractice={(name) => (cert ? !!practiceTopics?.has(`tema:${name}`) && s.practiceKey !== topicKey(name) && s.practiceKey !== `tema:${name}` : !!practiceTopicFor(name))}
                  onPractice={(name) => practiceAgain(cert ? topicKey(name) : practiceKey('fcc', `tema:${practiceTopicFor(name)}`))}
                />
              ) : null}
              {questions.length ? (
                <View
                  onLayout={(e) => {
                    listY.current = e.nativeEvent.layout.y;
                  }}
                  style={{ marginBottom: 12 }}
                >
                  <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 8 }}>{review ? 'Repaso pregunta por pregunta' : 'Tus preguntas'}</Text>
                  <Segmented<ResultFilter>
                    value={filter}
                    onChange={setFilter}
                    options={[
                      { id: 'all', label: `Todas (${questions.length})` },
                      { id: 'review', label: `Por repasar (${toReview})` },
                      { id: 'correct', label: `Correctas (${questions.length - toReview})` },
                    ]}
                  />
                  {topic ? (
                    <Pressable onPress={() => setTopic(null)} accessibilityRole="button" accessibilityLabel="Quitar filtro de tema" style={[styles.topicFilter, { borderColor: t.primary, backgroundColor: t.primary + '14' }]}>
                      <Ionicons name="pricetag-outline" size={13} color={t.primary} />
                      <Text style={{ color: t.primary, fontSize: 12, fontWeight: '700', marginHorizontal: 5 }}>Tema: {topic}</Text>
                      <Ionicons name="close" size={14} color={t.primary} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              {questions.length && !shown.length ? (
                <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{filter === 'review' ? '¡No hay preguntas por repasar aquí!' : 'No hay preguntas con este filtro.'}</Text>
              ) : null}
              {shown.map(({ qr, i, pq }) => {
                const st = STATUS[qr.status];
                const c = (t as any)[st.color] as string;
                return (
                  <Card key={qr.questionId} accent={c}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <Ionicons name={st.icon} size={20} color={c} />
                      <Text style={{ color: t.text, fontWeight: '800', flex: 1, minWidth: 140 }}>
                        Pregunta {i + 1} · {st.label}
                      </Text>
                      {pq?.topic ? <Pill text={pq.topic} icon="pricetag-outline" /> : null}
                      <Text style={{ color: t.textMuted, fontWeight: '700' }}>
                        {qr.score}/{qr.max}
                      </Text>
                    </View>
                    {pq ? (
                      review ? (
                        <View style={{ marginBottom: 6 }}>
                          {/* en el repaso se muestra también el código de la pregunta */}
                          <RichText text={pq.code ? `${pq.prompt}\n\n\`\`\`js\n${pq.code}\n\`\`\`` : pq.prompt} style={{ color: t.textMuted, fontSize: 13, lineHeight: 19 }} />
                        </View>
                      ) : (
                        <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 4 }} numberOfLines={3}>
                          {plainText(pq.prompt)}
                        </Text>
                      )
                    ) : null}
                    {pq && review && (pq.type === 'single' || pq.type === 'multiple') ? <ChosenAnswer q={pq} value={s.answers[pq.id]} /> : null}
                    <RichText text={qr.feedback} style={{ color: t.text, fontSize: 13 }} />
                    {qr.comment ? (
                      <View style={[styles.teacherComment, { borderLeftColor: t.accent, backgroundColor: t.accentSoft }]}>
                        <Text style={{ color: t.accentDark, fontSize: 11, fontWeight: '800' }}>COMENTARIO DE TU MAESTRO</Text>
                        <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>{qr.comment}</Text>
                      </View>
                    ) : null}
                    {qr.tests?.map((x) => (
                      <View key={x.id} style={{ marginTop: 3 }}>
                        <Text style={{ color: x.passed ? t.success : t.danger, fontSize: 12, fontFamily: x.call ? MONO : undefined }}>
                          {x.passed ? '✓' : '✗'} {x.name}
                          {x.hidden ? ' (oculto)' : ''}
                        </Text>
                        {review && !x.passed && x.expected !== undefined ? (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 14, marginTop: 3 }}>
                            <IOBlock label="Esperado" text={x.expected} color={t.success} />
                            <IOBlock label="Obtenido" text={x.error ?? x.actual ?? ''} color={t.danger} />
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </Card>
                );
              })}
              {s.practiceKey ? <Button label="Practicar de nuevo (otras preguntas)" icon="refresh" onPress={() => practiceAgain(s.practiceKey!)} style={{ height: 46, marginTop: 6 }} /> : null}
              <Button label="Salir del modo examen" icon="exit-outline" kind="primary" onPress={exit} style={{ height: 46, marginTop: 6, marginBottom: 16 }} />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Resultado por tema: dónde reforzar antes de la certificación. Al tocar un tema se ven solo sus preguntas. */
export function TopicsCard({ topics, passPercent, selected, onPick, canPractice, onPractice }: { topics: TopicScore[]; passPercent: number; selected: string | null; onPick?(topic: string): void; canPractice(topic: string): boolean; onPractice(topic: string): void }) {
  const t = useTheme();
  const sorted = [...topics].sort((a, b) => a.score / (a.max || 1) - b.score / (b.max || 1));
  const weak = sorted.filter((x) => (x.max ? (x.score / x.max) * 100 : 0) < passPercent).length;
  return (
    <Card>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>Resultado por tema</Text>
      <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 10 }}>
        {weak ? `Repasa ${weak === 1 ? 'el tema' : `los ${weak} temas`} por debajo de ${passPercent} % (aparecen primero).` : `Superaste ${passPercent} % en todos los temas.`}
        {onPick ? ' Toca un tema para ver sus preguntas.' : ''}
      </Text>
      {sorted.map((x) => {
        const pct = x.max ? Math.round((x.score / x.max) * 100) : 0;
        const c = pct >= passPercent ? t.success : pct >= 50 ? t.warning : t.danger;
        const on = selected === x.topic;
        const practice = pct < passPercent && canPractice(x.topic);
        return (
          <View key={x.topic} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Pressable
              onPress={onPick ? () => onPick(x.topic) : undefined}
              disabled={!onPick}
              accessibilityRole={onPick ? 'button' : undefined}
              accessibilityLabel={onPick ? `Ver preguntas de ${x.topic}` : undefined}
              style={({ pressed }) => [styles.topicRow, { backgroundColor: on ? t.primary + '14' : pressed ? t.surfaceAlt : 'transparent', borderColor: on ? t.primary : 'transparent' }]}
            >
              <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={{ color: t.text, fontSize: 13, flex: 1, fontWeight: on ? '700' : '400' }} numberOfLines={1}>
                  {x.topic}
                </Text>
                <Text style={{ color: c, fontSize: 12, fontWeight: '800' }}>
                  {x.correct}/{x.total} · {pct}%
                </Text>
              </View>
              <ProgressBar value={pct / 100} color={c} />
            </Pressable>
            {practice ? (
              <Pressable onPress={() => onPractice(x.topic)} accessibilityRole="button" accessibilityLabel={`Practicar ${x.topic}`} hitSlop={4} style={({ pressed }) => [styles.practiceBtn, { borderColor: t.accent, backgroundColor: pressed ? t.accent + '30' : t.accent + '12' }]}>
                <Ionicons name="barbell-outline" size={14} color={t.accent} />
                <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Practicar</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

/** Qué opción eligió el alumno (al repasar). */
export function ChosenAnswer({ q, value }: { q: PaperQuestion; value: unknown }) {
  const t = useTheme();
  const ids = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  const chosen = (q.options ?? []).filter((o) => ids.includes(o.id));
  if (!chosen.length) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
      <Text style={{ color: t.textMuted, fontSize: 13 }}>Tu respuesta: </Text>
      <View style={{ flex: 1 }}>
        {chosen.map((o) => (
          <RichText key={o.id} text={o.text} style={{ color: t.text, fontSize: 13 }} />
        ))}
      </View>
    </View>
  );
}
