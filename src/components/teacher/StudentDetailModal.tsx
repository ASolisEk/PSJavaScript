/** Detalle de un alumno: respuestas en vivo, calificación por pregunta y bitácora. */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { questionTypeInfo } from '../../core/exam/config';
import { ACTIVITY_LABEL, answeredCount, RoomState, StudentEventKind, StudentRecord, studentPhase } from '../../core/exam/room';
import type { AnswerValue, Question, QuestionResult } from '../../core/exam/types';
import { useTeacher } from '../../store/teacher';
import { confirmDialog } from '../../ui/platform';
import { MONO, useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { Button, Chip } from '../ui';
import { Card, CodeBlock, formatDuration, formatSince, IconName, NumberStepper, Pill } from '../exam/kit';

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
  run: 'play-circle-outline',
  test: 'flask-outline',
  submit: 'paper-plane-outline',
  leave: 'exit-outline',
  teacher: 'person-outline',
};

function readable(q: Question, a: AnswerValue | undefined, s: StudentRecord): React.ReactNode {
  if (a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)) return null;
  switch (q.type) {
    case 'single':
      return q.options.find((o) => o.id === a)?.text ?? String(a);
    case 'multiple':
      return (Array.isArray(a) ? a : [a]).map((id) => q.options.find((o) => o.id === id)?.text ?? id).join(' · ');
    case 'truefalse':
      return a === true ? 'Verdadero' : 'Falso';
    case 'code':
      return <CodeBlock code={String(a)} maxHeight={260} />;
    case 'order': {
      const ids = s.key?.lineIds[q.id] ?? [];
      const text = (Array.isArray(a) ? a : []).map((id) => q.lines[ids.indexOf(id)] ?? '?').join('\n');
      return <CodeBlock code={text} maxHeight={220} />;
    }
    default:
      return String(a);
  }
}

function correctAnswer(q: Question): string | null {
  switch (q.type) {
    case 'single':
    case 'multiple':
      return q.options.filter((o) => o.correct).map((o) => o.text).join(' · ');
    case 'truefalse':
      return q.answer ? 'Verdadero' : 'Falso';
    case 'short':
      return q.answers.filter((x) => x.trim()).join(' / ');
    case 'numeric':
      return `${q.answer}${q.tolerance ? ` ± ${q.tolerance}` : ''}`;
    default:
      return null;
  }
}

export default function StudentDetailModal({ room, studentId, live, onClose }: { room: RoomState; studentId: string; live: boolean; onClose(): void }) {
  const t = useTheme();
  const s = room.students[studentId];
  const [tab, setTab] = useState<'answers' | 'log'>('answers');
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

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Chip label="Respuestas" active={tab === 'answers'} onPress={() => setTab('answers')} />
          <Chip label={`Actividad (${s.events.length})`} active={tab === 'log'} onPress={() => setTab('log')} />
        </View>

        {tab === 'answers' ? (
          !s.key ? (
            <Text style={{ color: t.textMuted }}>Aún no comienza el examen.</Text>
          ) : (
            s.key.questionIds.map((id, i) => {
              const q = byId.get(id);
              if (!q) return null;
              const r = s.result?.questions.find((x) => x.questionId === id);
              return <AnswerCard key={id} q={q} index={i} s={s} r={r} current={!s.submittedAt && s.current === i} />;
            })
          )
        ) : (
          [...s.events].reverse().map((e, i) => (
            <View key={i} style={[styles.event, { borderBottomColor: t.border }]}>
              <Ionicons name={EVENT_ICON[e.kind] ?? 'ellipse-outline'} size={15} color={e.kind === 'blur' || e.kind === 'paste' ? t.warning : e.kind === 'disconnect' ? t.danger : t.textMuted} />
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

function AnswerCard({ q, index, s, r, current }: { q: Question; index: number; s: StudentRecord; r?: QuestionResult; current: boolean }) {
  const t = useTheme();
  const info = questionTypeInfo(q.type);
  const answer = readable(q, s.answers[q.id], s);
  const right = correctAnswer(q);
  const color = r ? (r.status === 'correct' ? t.success : r.status === 'partial' ? t.warning : r.status === 'blank' ? t.textMuted : t.danger) : current ? t.primary : undefined;
  return (
    <Card accent={color}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <Text style={{ color: t.text, fontWeight: '800' }}>P{index + 1}</Text>
        <Pill text={info.label} icon={info.icon as IconName} color={t.primary} />
        {current ? <Pill text="La está viendo ahora" icon="eye-outline" color={t.primary} solid /> : null}
        <View style={{ flex: 1 }} />
        {r ? (
          <Text style={{ color, fontWeight: '800' }}>
            {r.score}/{r.max}
            {r.manual ? ' (manual)' : ''}
          </Text>
        ) : (
          <Text style={{ color: t.textMuted }}>{q.points} pts</Text>
        )}
      </View>
      <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 6 }} numberOfLines={3}>
        {q.prompt}
      </Text>
      {answer === null ? (
        <Text style={{ color: t.textMuted, fontStyle: 'italic' }}>Sin responder</Text>
      ) : typeof answer === 'string' ? (
        <Text style={{ color: t.text, fontFamily: q.type === 'output' ? MONO : undefined }} selectable>
          {answer}
        </Text>
      ) : (
        answer
      )}
      {right && r && r.status !== 'correct' ? <Text style={{ color: t.success, fontSize: 12, marginTop: 4 }}>Correcta: {right}</Text> : null}
      {r ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: t.text, fontSize: 13 }}>{r.feedback}</Text>
          {r.tests?.map((x) => (
            <Text key={x.id} style={{ color: x.passed ? t.success : t.danger, fontSize: 12, marginTop: 2 }}>
              {x.passed ? '✓' : '✗'} {x.name}
              {x.hidden ? ' (oculto)' : ''}
              {!x.passed && x.error ? ` — ${x.error}` : !x.passed && x.actual !== undefined ? ` — obtuvo: ${x.actual.split('\n').join(' ⏎ ') || '(vacío)'}` : ''}
            </Text>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <Text style={{ color: t.textMuted, fontSize: 12 }}>Ajustar puntos:</Text>
            <NumberStepper value={r.score} onChange={(v) => useTeacher.getState().adjust(s.id, q.id, v)} min={0} max={q.points} step={q.points <= 2 ? 0.5 : 1} width={56} />
            {r.manual ? <Button label="Automática" icon="refresh" onPress={() => useTeacher.getState().adjust(s.id, q.id, null)} /> : null}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  event: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
});
