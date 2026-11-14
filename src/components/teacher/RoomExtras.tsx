/**
 * Piezas de la sala en vivo: preguntas de los alumnos, avisos sonoros, horario
 * automático, lista del grupo (quién falta) y publicación de calificaciones.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../ui/text';
import { missingFromRoster, pendingAsks, RoomState } from '../../core/exam/room';
import { plainText } from '../../core/exam/richText';
import { roomKey, useTeacher } from '../../store/teacher';
import { alertSoundsEnabled, AlertKind, playAlert, setAlertSounds } from '../../ui/alertSound';
import { confirmDialog } from '../../ui/platform';
import { RADIUS, useTheme } from '../../ui/theme';
import { Button } from '../ui';
import { Card, formatSince, TextField, Toggle } from '../exam/kit';

/** Suena cuando llega una pregunta, alguien sale de la ventana o se desconecta. */
export function useRoomAlerts(room: RoomState, enabled: boolean) {
  const seen = useRef<number | null>(null);
  useEffect(() => {
    let latest = 0;
    const kinds = new Set<AlertKind>();
    for (const s of Object.values(room.students)) {
      for (const e of s.events) {
        if (e.at > latest) latest = e.at;
        if (seen.current === null || e.at <= seen.current) continue;
        if (e.kind === 'ask') kinds.add('ask');
        else if (e.kind === 'blur' || e.kind === 'lockdown') kinds.add('away');
        else if (e.kind === 'disconnect' && !s.submittedAt) kinds.add('offline');
      }
    }
    const first = seen.current === null;
    seen.current = Math.max(seen.current ?? 0, latest);
    if (first || !enabled || !kinds.size) return;
    // un solo sonido por cambio, el más importante
    playAlert(kinds.has('ask') ? 'ask' : kinds.has('away') ? 'away' : 'offline');
  }, [room, enabled]);
}

export function AlertSoundToggle({ value, onChange }: { value: boolean; onChange(v: boolean): void }) {
  return (
    <Toggle
      icon={value ? 'notifications-outline' : 'notifications-off-outline'}
      label="Avisos sonoros"
      description="Suena cuando un alumno te hace una pregunta, sale de la ventana o se desconecta."
      value={value}
      onChange={(v) => {
        setAlertSounds(v);
        onChange(v);
        if (v) playAlert('submit');
      }}
    />
  );
}

export const initialAlertSounds = alertSoundsEnabled;

/** Preguntas de los alumnos que esperan respuesta. */
export function AsksPanel({ room, now }: { room: RoomState; now: number }) {
  const t = useTheme();
  const key = roomKey(room);
  const asks = pendingAsks(room);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (!asks.length) return null;
  return (
    <Card accent={t.accent}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="hand-left" size={18} color={t.accent} />
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginLeft: 6 }}>Preguntas de los alumnos ({asks.length})</Text>
      </View>
      {asks.map(({ student, ask }) => {
        const qid = student.key?.questionIds[ask.question];
        const q = qid ? room.exam.questions.find((x) => x.id === qid) : undefined;
        const draft = drafts[ask.id] ?? '';
        const send = (toAll: boolean) => {
          useTeacher.getState().replyAsk(key, student.id, ask.id, draft, toAll);
          setDrafts((d) => ({ ...d, [ask.id]: '' }));
        };
        return (
          <View key={ask.id} style={{ borderRadius: RADIUS.md, backgroundColor: t.surfaceAlt, padding: 10, marginBottom: 8 }}>
            <Text style={{ color: t.text, fontSize: 13 }}>
              <Text style={{ fontWeight: '800' }}>{student.name}</Text>
              <Text style={{ color: t.textMuted }}> · pregunta {ask.question + 1}{q?.topic ? ` (${q.topic})` : ''} · hace {formatSince(now - ask.at)}</Text>
            </Text>
            <Text style={{ color: t.text, fontSize: 14, marginVertical: 4 }}>{ask.text}</Text>
            {q ? (
              <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={2}>
                Enunciado: {plainText(q.prompt)}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              <TextField value={draft} onChangeText={(v) => setDrafts((d) => ({ ...d, [ask.id]: v }))} placeholder="Tu respuesta…" style={{ flex: 1, minWidth: 200 }} maxLength={1000} />
              <Button label="Responder" icon="send" size="sm" kind="primary" disabled={!draft.trim()} onPress={() => send(false)} />
              <Button label="A todos" icon="megaphone-outline" size="sm" disabled={!draft.trim()} onPress={() => send(true)} />
              <Button label="Descartar" icon="close" size="sm" onPress={() => useTeacher.getState().dismissAsk(key, student.id, ask.id)} />
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (ms: number | null | undefined) => (ms ? `${pad(new Date(ms).getHours())}:${pad(new Date(ms).getMinutes())}` : '');

/** «14:30» → hora de hoy (o de mañana si ya pasó por más de una hora). */
function parseTime(text: string, now: number): number | null | 'bad' {
  const v = text.trim();
  if (!v) return null;
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(v);
  if (!m || +m[1] > 23 || +m[2] > 59) return 'bad';
  const d = new Date(now);
  d.setHours(+m[1], +m[2], 0, 0);
  if (d.getTime() < now - 3600_000) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Inicio y cierre automáticos. */
export function ScheduleCard({ room, now }: { room: RoomState; now: number }) {
  const t = useTheme();
  const key = roomKey(room);
  const [start, setStart] = useState(hhmm(room.schedule?.startAt));
  const [end, setEnd] = useState(hhmm(room.schedule?.closeAt));
  const [error, setError] = useState<string | null>(null);
  if (room.status === 'closed') return null;
  const sch = room.schedule;
  const apply = () => {
    const s = room.status === 'lobby' ? parseTime(start, now) : (sch?.startAt ?? null);
    const c = parseTime(end, now);
    if (s === 'bad' || c === 'bad') return setError('Escribe la hora como 14:30.');
    if (s && c && c <= s) return setError('El cierre debe ser después del inicio.');
    setError(null);
    useTeacher.getState().setSchedule(key, s, c);
  };
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>Horario automático</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {room.status === 'lobby' ? <TextField value={start} onChangeText={setStart} placeholder="Inicio 14:30" style={{ width: 120 }} /> : null}
        <TextField value={end} onChangeText={setEnd} placeholder="Cierre 15:30" style={{ width: 120 }} />
        <Button label="Programar" icon="alarm-outline" size="sm" onPress={apply} />
        {sch?.startAt || sch?.closeAt ? (
          <Button
            label="Quitar"
            size="sm"
            onPress={() => {
              setStart('');
              setEnd('');
              useTeacher.getState().setSchedule(key, null, null);
            }}
          />
        ) : null}
      </View>
      {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
        {sch?.startAt && room.status === 'lobby' ? `Inicia solo a las ${hhmm(sch.startAt)}. ` : ''}
        {sch?.closeAt ? `Se cierra y recoge solo a las ${hhmm(sch.closeAt)}. ` : ''}
        {!sch?.startAt && !sch?.closeAt ? 'Opcional: el examen inicia o se cierra solo a esa hora (deja esta ventana abierta).' : ''}
      </Text>
    </View>
  );
}

/** Quién de la lista del grupo aún no entra. */
export function RosterCard({ room }: { room: RoomState }) {
  const t = useTheme();
  const roster = room.exam.roster ?? [];
  if (!roster.length || room.status === 'closed') return null;
  const missing = missingFromRoster(room);
  return (
    <Card accent={missing.length ? t.warning : t.success}>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 4 }}>
        Lista del grupo: {roster.length - missing.length} de {roster.length} en la sala
      </Text>
      {missing.length ? (
        <Text style={{ color: t.textMuted, fontSize: 13 }}>
          Faltan: <Text style={{ color: t.text }}>{missing.join(', ')}</Text>
        </Text>
      ) : (
        <Text style={{ color: t.success, fontSize: 13 }}>¡Están todos!</Text>
      )}
    </Card>
  );
}

/** Calificaciones retenidas: botón para publicarlas. */
export function PublishCard({ room }: { room: RoomState }) {
  const t = useTheme();
  if (!room.exam.holdResults || room.published) {
    return room.exam.holdResults && room.published ? <Text style={{ color: t.success, fontSize: 12, marginTop: 8 }}>✓ Calificaciones publicadas.</Text> : null;
  }
  const submitted = Object.values(room.students).filter((s) => s.submittedAt);
  const pending = submitted.reduce((a, s) => a + (s.result?.questions.filter((q) => q.status === 'pending').length ?? 0), 0);
  return (
    <View style={{ marginTop: 10, gap: 6 }}>
      <Text style={{ color: t.textMuted, fontSize: 12 }}>
        Calificaciones retenidas: los alumnos solo ven «entregado».{pending ? ` Faltan ${pending} respuesta(s) abiertas por calificar.` : ''}
      </Text>
      <Button
        label="Publicar calificaciones"
        icon="paper-plane-outline"
        kind="primary"
        disabled={!submitted.length}
        onPress={async () => {
          const ok = await confirmDialog('¿Publicar calificaciones?', `${submitted.length} alumno(s) verán su resultado${pending ? `. Aún hay ${pending} respuesta(s) abiertas sin calificar (cuentan 0)` : ''}. Los que entreguen después lo verán al momento.`, 'Publicar');
          if (ok) useTeacher.getState().publishResults(roomKey(room));
        }}
      />
    </View>
  );
}
