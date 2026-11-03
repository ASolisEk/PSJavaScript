/** Detalle de un alumno: respuestas en vivo, calificación por pregunta y bitácora. */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { questionTypeInfo } from '../../core/exam/config';
import { ACTIVITY_LABEL, answeredCount, RoomState, StudentEventKind, StudentRecord, studentPhase } from '../../core/exam/room';
import { runProgram } from '../../core/exam/grading';
import { answerText, correctText, roomReportHtml, STATUS_LABEL } from '../../core/exam/report';
import type { Question, QuestionResult } from '../../core/exam/types';
import { getProfile } from '../../core/profiles';
import { useTeacher } from '../../store/teacher';
import { confirmDialog, saveTextFile } from '../../ui/platform';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { Button, Chip } from '../ui';
import { Card, CodeBlock, formatDuration, formatSince, IconName, NumberStepper, Pill } from '../exam/kit';
import RichText from '../exam/RichText';

export const PHASE_INFO = {
  lobby: { label: 'En espera', icon: 'hourglass-outline' as IconName, color: 'info' as const },
  ready: { label: 'Por comenzar', icon: 'play-circle-outline' as IconName, color: 'accent' as const },
  working: { label: 'Trabajando', icon: 'create-outline' as IconName, color: 'primary' as const },
  submitted: { label: 'Entregado', icon: 'checkmark-done-circle-outline' as IconName, color: 'success' as const },
};

const EVENT_ICON: Record<StudentEventKind, IconName> = {
  join: 'log-in-outline',
  reconnect: 'refresh-outline',
  disconnect: 'cloud-offline-outline',
  start: 'play-outline',
  question: 'navigate-outline',
  blur: 'eye-off-outline',
  focus: 'eye-outline',
  paste: 'clipboard-outline',
  lockdown: 'lock-open-outline',
  run: 'play-circle-outline',
  test: 'flask-outline',
  submit: 'paper-plane-outline',
  leave: 'exit-outline',
  teacher: 'person-outline',
};

export default function StudentDetailModal({ room, studentId, live, onClose }: { room: RoomState; studentId: string; live: boolean; onClose(): void }) {
  const t = useTheme();
  const s = room.students[studentId];
  const [tab, setTab] = useState<'answers' | 'log'>('answers');
  const [filter, setFilter] = useState<AnswerFilter>('all');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);
  if (!s) return null;
  const phase = studentPhase(s, room);
  const pi = PHASE_INFO[phase];
  const total = s.key?.questionIds.length ?? 0;
  const byId = new Map(room.exam.questions.map((q) => [q.id, q]));
  const st = useTeacher.getState();

  return (
    <ModalShell title={s.name} onClose={onClose} wide>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <Pill icon={pi.icon} text={pi.label} color={(t as any)[pi.color]} solid />
          <Pill icon={s.connected ? 'wifi' : 'cloud-offline-outline'} text={s.connected ? 'Conectado' : 'Desconectado'} color={s.connected ? t.success : t.danger} />
          {s.group ? <Pill icon="people-outline" text={s.group} /> : null}
          {total ? <Pill icon="checkmark-done-outline" text={`${answeredCount(s, room)}/${total} respondidas`} color={t.primary} /> : null}
          {s.focusLost ? <Pill icon="eye-off-outline" text={`Salió ${s.focusLost} ${s.focusLost === 1 ? 'vez' : 'veces'} (${formatSince(s.awayMs)})`} color={t.warning} /> : null}
          {s.lockdown ? <Pill icon="lock-open-outline" text={`${s.lockdown} ${s.lockdown === 1 ? 'incidente' : 'incidentes'} del examen bloqueado`} color={t.danger} /> : null}
          {s.pasteBlocked ? <Pill icon="clipboard-outline" text={`${s.pasteBlocked} ${s.pasteBlocked === 1 ? 'intento' : 'intentos'} de pegar`} color={t.danger} /> : null}
          {s.runs ? <Pill icon="play-outline" text={`${s.runs} ${s.runs === 1 ? 'ejecución' : 'ejecuciones'}`} /> : null}
        </View>

        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
            <Info label="Entró" value={new Date(s.joinedAt).toLocaleTimeString()} />
            <Info label="Comenzó" value={s.startedAt ? new Date(s.startedAt).toLocaleTimeString() : '—'} />
            <Info label={s.submittedAt ? 'Tardó' : 'Lleva'} value={s.startedAt ? formatDuration((s.submittedAt ?? now) - s.startedAt) : '—'} />
            {!s.submittedAt && s.deadline ? <Info label="Le queda" value={formatDuration(s.deadline - now)} /> : null}
            {s.result ? <Info label="Calificación" value={`${s.result.grade}/${s.result.scale} (${s.result.percent}%)`} strong /> : null}
            {!s.submittedAt && s.startedAt ? <Info label="Ahora" value={`${ACTIVITY_LABEL[s.activity]} · P${s.current + 1}`} /> : null}
          </View>
          {live ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {s.startedAt && !s.submittedAt && s.deadline ? <Button label="+5 min" icon="time-outline" onPress={() => st.addTime(5, s.id)} /> : null}
              {s.startedAt && !s.submittedAt ? (
                <Button
                  label="Recoger examen"
                  icon="hand-left-outline"
                  onPress={async () => {
                    if (await confirmDialog('¿Recoger el examen?', `Se calificará con lo que ${s.name} lleve respondido.`, 'Recoger')) st.forceSubmit(s.id);
                  }}
                />
              ) : null}
              {s.submittedAt && room.status !== 'closed' ? (
                <Button
                  label={room.exam.durationMin ? 'Reabrir examen (+10 min)' : 'Reabrir examen'}
                  icon="lock-open-outline"
                  onPress={async () => {
                    if (await confirmDialog('¿Reabrir el examen?', `${s.name} podrá seguir respondiendo con sus respuestas actuales y deberá volver a enviarlo. Su calificación actual se descarta.`, 'Reabrir'))
                      st.reopenStudent(s.id, 10);
                  }}
                />
              ) : null}
              <Button
                label="Quitar de la sala"
                icon="person-remove-outline"
                kind="danger"
                onPress={async () => {
                  if (await confirmDialog('¿Quitar al alumno?', 'Se borrará de la lista con sus respuestas.', 'Quitar')) {
                    st.removeStudent(s.id);
                    onClose();
                  }
                }}
              />
            </View>
          ) : null}
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <Chip label="Respuestas" active={tab === 'answers'} onPress={() => setTab('answers')} />
          <Chip label={`Actividad (${s.events.length})`} active={tab === 'log'} onPress={() => setTab('log')} />
          <View style={{ flex: 1 }} />
          {s.key ? (
            <Button
              label="Reporte del alumno"
              icon="document-text-outline"
              size="sm"
              onPress={() => saveTextFile(`reporte-${s.name.replace(/[^\w]+/g, '-').toLowerCase()}.html`, roomReportHtml(room, [s.id]), 'text/html')}
            />
          ) : null}
        </View>
        {tab === 'answers' && s.result ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
            {(
              [
                ['all', 'Todas'],
                ['wrong', `Por revisar (${s.result.questions.filter((x) => x.status === 'wrong' || x.status === 'partial').length})`],
                ['blank', `Sin responder (${s.result.questions.filter((x) => x.status === 'blank').length})`],
              ] as [AnswerFilter, string][]
            ).map(([id, label]) => (
              <Chip key={id} label={label} active={filter === id} onPress={() => setFilter(id)} />
            ))}
          </View>
        ) : null}

        {tab === 'answers' ? (
          !s.key ? (
            <Text style={{ color: t.textMuted }}>Aún no comienza el examen.</Text>
          ) : (
            s.key.questionIds.map((id, i) => {
              const q = byId.get(id);
              if (!q) return null;
              const r = s.result?.questions.find((x) => x.questionId === id);
              if (filter === 'wrong' && !(r && (r.status === 'wrong' || r.status === 'partial'))) return null;
              if (filter === 'blank' && r?.status !== 'blank') return null;
              return <AnswerCard key={id} q={q} index={i} s={s} r={r} current={!s.submittedAt && s.current === i} profileId={room.exam.profileId} />;
            })
          )
        ) : (
          [...s.events].reverse().map((e, i) => (
            <View key={i} style={[styles.event, { borderBottomColor: t.border }]}>
              <Ionicons name={EVENT_ICON[e.kind] ?? 'ellipse-outline'} size={15} color={e.kind === 'blur' || e.kind === 'paste' || e.kind === 'lockdown' ? t.warning : e.kind === 'disconnect' ? t.danger : t.textMuted} />
              <Text style={{ color: t.textMuted, fontFamily: MONO, fontSize: 12, width: 78, marginLeft: 8 }}>{new Date(e.at).toLocaleTimeString()}</Text>
              <Text style={{ color: t.text, fontSize: 13, flex: 1 }}>{e.text}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ModalShell>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700' }}>{label.toUpperCase()}</Text>
      <Text style={{ color: t.text, fontSize: strong ? 17 : 14, fontWeight: strong ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

type AnswerFilter = 'all' | 'wrong' | 'blank';

const statusColor = (t: ReturnType<typeof useTheme>, r?: QuestionResult) =>
  !r ? undefined : r.status === 'correct' ? t.success : r.status === 'partial' ? t.warning : r.status === 'blank' ? t.textMuted : t.danger;

/** Texto en monoespaciado con fondo, para salidas, datos y líneas. */
function Mono({ text, color, empty = '(vacío)' }: { text: string; color?: string; empty?: string }) {
  const t = useTheme();
  return (
    <Text selectable style={[styles.mono, { color: text ? color ?? t.text : t.textMuted, backgroundColor: t.surfaceAlt, fontStyle: text ? 'normal' : 'italic' }]}>
      {text || empty}
    </Text>
  );
}

function Label({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', marginTop: 8, marginBottom: 3 }}>{children.toUpperCase()}</Text>;
}

/** Respuesta del alumno junto a la correcta. */
function Pair({ mine, right, mono, ok }: { mine: string; right: string; mono?: boolean; ok?: boolean }) {
  const t = useTheme();
  return (
    <View style={styles.pair}>
      <View style={styles.pairCol}>
        <Label>Respondió</Label>
        {mono ? <Mono text={mine} empty="(sin responder)" color={ok === false ? t.danger : undefined} /> : <Text selectable style={{ color: mine ? (ok === false ? t.danger : t.text) : t.textMuted, fontStyle: mine ? 'normal' : 'italic', fontSize: 14 }}>{mine || 'Sin responder'}</Text>}
      </View>
      <View style={styles.pairCol}>
        <Label>Respuesta correcta</Label>
        {mono ? <Mono text={right} color={t.success} /> : <Text selectable style={{ color: t.success, fontSize: 14, fontWeight: '700' }}>{right}</Text>}
      </View>
    </View>
  );
}

function AnswerCard({ q, index, s, r, current, profileId }: { q: Question; index: number; s: StudentRecord; r?: QuestionResult; current: boolean; profileId: string }) {
  const t = useTheme();
  const [showRef, setShowRef] = useState(false);
  const info = questionTypeInfo(q.type);
  const a = s.answers[q.id];
  const mine = answerText(q, a, s.key);
  // salida real del programa de «¿Qué imprime?» (si aún no se califica, se calcula aquí)
  const right = useMemo(() => {
    const c = correctText(q, r);
    if (c || q.type !== 'output') return c;
    const run = runProgram(q.code, getProfile(profileId), q.inputs);
    return run.error ? `${run.output}\n${run.error}`.trim() : run.output;
  }, [q, r, profileId]);
  const color = statusColor(t, r) ?? (current ? t.primary : undefined);
  const ok = r ? r.status === 'correct' : undefined;

  let body: React.ReactNode;
  if (q.type === 'single' || q.type === 'multiple') {
    const chosen = new Set(Array.isArray(a) ? a : a ? [String(a)] : []);
    body = (
      <View style={{ marginTop: 6 }}>
        {q.options
          .filter((o) => o.text.trim())
          .map((o) => {
            const picked = chosen.has(o.id);
            const c = o.correct ? t.success : picked ? t.danger : t.border;
            return (
              <View key={o.id} style={[styles.option, { borderColor: c, backgroundColor: o.correct ? t.success + '14' : picked ? t.danger + '12' : 'transparent' }]}>
                <Ionicons name={picked ? (q.type === 'multiple' ? 'checkbox' : 'radio-button-on') : q.type === 'multiple' ? 'square-outline' : 'radio-button-off'} size={17} color={picked ? (o.correct ? t.success : t.danger) : t.textMuted} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <RichText text={o.text} style={{ color: t.text, fontSize: 14 }} />
                </View>
                {o.correct ? <Pill text="Correcta" icon="checkmark" color={t.success} /> : null}
                {picked ? <Pill text="Eligió" icon="hand-left-outline" color={o.correct ? t.success : t.danger} solid /> : null}
              </View>
            );
          })}
        {!chosen.size ? <Text style={{ color: t.textMuted, fontStyle: 'italic', marginTop: 4 }}>Sin responder</Text> : null}
      </View>
    );
  } else if (q.type === 'code') {
    body = (
      <View>
        <Label>Código del alumno</Label>
        {mine.trim() ? <CodeBlock code={mine} /> : <Text style={{ color: t.textMuted, fontStyle: 'italic' }}>Sin responder</Text>}
        {r?.tests?.length ? (
          <>
            <Label>{`Casos de prueba (${r.tests.filter((x) => x.passed).length}/${r.tests.length})`}</Label>
            {r.tests.map((x) => (
              <View key={x.id} style={[styles.test, { borderColor: x.passed ? t.success : t.danger }]}>
                <Text style={{ color: x.passed ? t.success : t.danger, fontWeight: '800', fontSize: 13 }}>
                  {x.passed ? '✓' : '✗'} {x.name}
                  {x.hidden ? <Text style={{ color: t.textMuted, fontWeight: '400' }}> (oculto)</Text> : null}
                </Text>
                <View style={styles.pair}>
                  <View style={styles.testCol}>
                    <Label>{x.call ? 'Llamada' : 'Datos'}</Label>
                    <Mono text={x.call ?? (x.inputs ?? []).join('\n')} empty="(ninguno)" />
                  </View>
                  <View style={styles.testCol}>
                    <Label>Esperado</Label>
                    <Mono text={x.expected ?? ''} color={t.success} />
                  </View>
                  <View style={styles.testCol}>
                    <Label>Obtuvo</Label>
                    <Mono text={x.error ?? x.actual ?? ''} color={x.passed ? t.text : t.danger} />
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : null}
        {r?.rules?.length ? (
          <>
            <Label>Requisitos</Label>
            {r.rules.map((x, i) => (
              <Text key={i} style={{ color: x.passed ? t.success : t.danger, fontSize: 13 }}>
                {x.passed ? '✓' : '✗'} {x.message}
              </Text>
            ))}
          </>
        ) : null}
        <Pressable onPress={() => setShowRef((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <Ionicons name={showRef ? 'chevron-up' : 'chevron-down'} size={15} color={t.accent} />
          <Text style={{ color: t.accent, fontWeight: '800', fontSize: 12, marginLeft: 4 }}>{showRef ? 'Ocultar' : 'Ver'} código inicial y solución de referencia</Text>
        </Pressable>
        {showRef ? (
          <>
            <Label>Código inicial</Label>
            <CodeBlock code={q.starter || '(vacío)'} />
            <Label>Solución de referencia</Label>
            <CodeBlock code={q.solution || '(sin solución)'} />
          </>
        ) : null}
      </View>
    );
  } else if (q.type === 'order') {
    body = <Pair mine={mine} right={right} mono ok={ok} />;
  } else {
    body = <Pair mine={mine} right={right} mono={q.type === 'output'} ok={ok} />;
  }

  return (
    <Card accent={color}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <Text style={{ color: t.text, fontWeight: '800' }}>P{index + 1}</Text>
        <Pill text={info.label} icon={info.icon as IconName} color={t.primary} />
        {q.topic ? <Pill text={q.topic} icon="pricetag-outline" /> : null}
        {current ? <Pill text="La está viendo ahora" icon="eye-outline" color={t.primary} solid /> : null}
        <View style={{ flex: 1 }} />
        {r ? (
          <Text style={{ color, fontWeight: '800' }}>
            {STATUS_LABEL[r.status]} · {r.score}/{r.max}
            {r.manual ? ' (manual)' : ''}
          </Text>
        ) : (
          <Text style={{ color: t.textMuted }}>{q.points} pts</Text>
        )}
      </View>
      <RichText text={q.prompt} style={{ color: t.text, fontSize: 14, lineHeight: 20 }} />
      {q.code?.trim() ? <CodeBlock code={q.code} style={{ marginTop: 6 }} /> : null}
      {q.type === 'output' && q.inputs.length ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>Datos para prompt(): {q.inputs.join(', ')}</Text> : null}
      {body}
      {r && (q.type === 'multiple' || q.type === 'order') && r.status !== 'correct' ? <RichText text={r.feedback} style={{ color: t.textMuted, fontSize: 12, marginTop: 6 }} /> : null}
      {r ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>Ajustar puntos:</Text>
          <NumberStepper value={r.score} onChange={(v) => useTeacher.getState().adjust(s.id, q.id, v)} min={0} max={q.points} step={q.points <= 2 ? 0.5 : 1} width={56} />
          {r.manual ? <Button label="Automática" icon="refresh" onPress={() => useTeacher.getState().adjust(s.id, q.id, null)} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  event: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: BORDER },
  mono: { fontFamily: MONO, fontSize: 13, lineHeight: 19, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 5 },
  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pairCol: { flexGrow: 1, flexBasis: 240 },
  testCol: { flexGrow: 1, flexBasis: 150 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 6 },
  test: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 8, marginBottom: 8 },
});
