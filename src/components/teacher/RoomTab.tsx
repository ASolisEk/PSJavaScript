/** Sala en vivo: abrir la sala, compartir el código y seguir a cada alumno. */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/text';
import { hasExamErrors, questionsPerStudent, questionTypeInfo } from '../../core/exam/config';
import { ACTIVITY_LABEL, answeredCount, RoomState, StudentRecord, studentPhase } from '../../core/exam/room';
import { defaultRelayUrl, defaultTransport, transportLabel, transportOptions, TransportSpec } from '../../core/exam/transport';
import type { Activity } from '../../core/exam/types';
import { useTeacher } from '../../store/teacher';
import { buildExamLink } from '../../ui/examLink';
import { confirmDialog, copyText } from '../../ui/platform';
import { BORDER, MONO, RADIUS, SCRIM, useTheme } from '../../ui/theme';
import { Button, Chip, Heading } from '../ui';
import { Banner, BigChoice, Card, Field, formatDuration, formatSince, IconName, Pill, ProgressBar, Stat, TextField, Toggle } from '../exam/kit';
import QrCode from '../exam/QrCode';
import StudentDetailModal, { PHASE_INFO } from './StudentDetailModal';

const ACTIVITY_ICON: Record<Activity, IconName> = {
  reading: 'reader-outline',
  answering: 'pencil-outline',
  coding: 'code-slash-outline',
  running: 'play-circle-outline',
  testing: 'flask-outline',
  reviewing: 'checkmark-done-outline',
  idle: 'cafe-outline',
  away: 'eye-off-outline',
};

export default function RoomTab() {
  const room = useTeacher((s) => s.room);
  const live = useTeacher((s) => s.live);
  if (!room) return <OpenRoom />;
  if (!live && room.status !== 'closed') return <ResumeRoom room={room} />;
  return <LiveRoom room={room} />;
}

// ───────────────────────────── abrir sala ─────────────────────────────

function OpenRoom() {
  const t = useTheme();
  const exams = useTeacher((s) => s.exams);
  const editingId = useTeacher((s) => s.editingId);
  const opening = useTeacher((s) => s.opening);
  const error = useTeacher((s) => s.openError);
  const [examId, setExamId] = useState<string | null>(editingId ?? exams[0]?.id ?? null);
  const [spec, setSpec] = useState<TransportSpec>(() => defaultTransport());
  const options = transportOptions();
  const exam = exams.find((e) => e.id === examId);
  const invalid = exam ? hasExamErrors(exam) : true;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 760 }}>
        <Heading style={{ marginBottom: 4 }}>Aplicar un examen</Heading>
        <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 16 }}>Abre una sala, comparte el código con tus alumnos y sigue su avance en tiempo real.</Text>

        <Card>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 10 }}>1. Elige el examen</Text>
          {exams.length === 0 ? <Text style={{ color: t.textMuted }}>Aún no tienes exámenes. Crea uno en «Mis exámenes».</Text> : null}
          {exams.map((e) => {
            const bad = hasExamErrors(e);
            return (
              <BigChoice
                key={e.id}
                icon="document-text-outline"
                title={e.title}
                description={`${questionsPerStudent(e)} preguntas por alumno · ${e.durationMin ? `${e.durationMin} min` : 'sin límite'}${bad ? ' · tiene errores por corregir' : ''}`}
                selected={e.id === examId}
                color={bad ? t.danger : t.primary}
                onPress={() => setExamId(e.id)}
              />
            );
          })}
        </Card>

        <Card>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 10 }}>2. ¿Cómo se conectarán tus alumnos?</Text>
          {options.map((o) => (
            <BigChoice
              key={o.kind}
              icon={o.icon as IconName}
              title={o.label + (o.kind === 'internet' ? ' (recomendado)' : '')}
              description={o.available ? o.description : 'No disponible en esta plataforma.'}
              selected={spec.kind === o.kind}
              disabled={!o.available}
              onPress={() => setSpec({ kind: o.kind, url: o.kind === 'lan' ? spec.url || defaultRelayUrl() || '' : undefined })}
            />
          ))}
          {spec.kind === 'lan' ? (
            <Field label="Dirección del servidor del aula" hint="En la computadora del maestro ejecuta «npm run sala»: te mostrará la dirección (por ejemplo 192.168.1.10:8787). Tus alumnos deben abrir esa misma dirección en su navegador.">
              <TextField value={spec.url ?? ''} onChangeText={(url) => setSpec({ kind: 'lan', url })} placeholder="192.168.1.10:8787" mono autoCapitalize="none" />
            </Field>
          ) : null}
        </Card>

        {error ? <Banner icon="alert-circle" color={t.danger} text={error} /> : null}
        {exam && invalid ? <Banner icon="alert-circle" color={t.danger} text="Este examen tiene errores. Corrígelos en el editor antes de aplicarlo." action={{ label: 'Editar', onPress: () => useTeacher.getState().edit(exam.id) }} /> : null}
        <Button
          label={opening ? 'Abriendo sala…' : 'Abrir sala'}
          icon="radio-outline"
          kind="primary"
          disabled={!exam || invalid || opening || (spec.kind === 'lan' && !spec.url?.trim())}
          onPress={() => exam && useTeacher.getState().openRoom(exam.id, spec)}
          style={{ height: 50 }}
        />
      </View>
    </ScrollView>
  );
}

function ResumeRoom({ room }: { room: RoomState }) {
  const t = useTheme();
  const opening = useTeacher((s) => s.opening);
  const error = useTeacher((s) => s.openError);
  const n = Object.keys(room.students).length;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 640 }}>
        <Card accent={t.warning}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>Hay una sala sin cerrar</Text>
          <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 12 }}>
            «{room.exam.title}» · código <Text style={{ fontFamily: MONO, fontWeight: '800', color: t.text }}>{room.code}</Text> · {n} alumno(s). Ábrela de nuevo para que los alumnos se reconecten con su avance.
          </Text>
          {error ? <Banner icon="alert-circle" color={t.danger} text={error} /> : null}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button label={opening ? 'Abriendo…' : 'Reabrir sala'} icon="refresh" kind="primary" disabled={opening} onPress={() => useTeacher.getState().reopenRoom()} />
            <Button
              label="Descartar sala"
              icon="trash-outline"
              kind="danger"
              onPress={async () => {
                if (await confirmDialog('¿Descartar la sala?', 'Se perderán el avance y las calificaciones de esta sala.', 'Descartar')) useTeacher.getState().leaveRoom();
              }}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

// ───────────────────────────── sala en vivo ─────────────────────────────

type Filter = 'all' | 'working' | 'submitted' | 'alerts' | 'offline';
type Sort = 'name' | 'progress' | 'grade';

function LiveRoom({ room }: { room: RoomState }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const network = useTeacher((s) => s.network);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('name');
  const [detail, setDetail] = useState<string | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [projector, setProjector] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);

  const students = Object.values(room.students);
  const stats = useMemo(() => {
    const phases = students.map((s) => studentPhase(s, room));
    const graded = students.filter((s) => s.result);
    return {
      connected: students.filter((s) => s.connected).length,
      working: phases.filter((p) => p === 'working').length,
      submitted: phases.filter((p) => p === 'submitted').length,
      offline: students.filter((s) => !s.connected && !s.submittedAt).length,
      alerts: students.filter((s) => s.focusLost || s.pasteBlocked || s.lockdown).length,
      avg: graded.length ? Math.round((graded.reduce((a, s) => a + s.result!.grade, 0) / graded.length) * 10) / 10 : null,
    };
  }, [students, room]);

  // nombres repetidos (alguien entró dos veces o con el nombre de otro)
  const nameCount = new Map<string, number>();
  for (const s of students) {
    const k = s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    nameCount.set(k, (nameCount.get(k) ?? 0) + 1);
  }
  const isDuplicate = (s: StudentRecord) => (nameCount.get(s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()) ?? 0) > 1;

  const shown = students
    .filter((s) => {
      const p = studentPhase(s, room);
      if (filter === 'working') return p === 'working';
      if (filter === 'submitted') return p === 'submitted';
      if (filter === 'alerts') return s.focusLost > 0 || s.pasteBlocked > 0 || !!s.lockdown;
      if (filter === 'offline') return !s.connected && !s.submittedAt;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'progress') return answeredCount(b, room) / Math.max(1, b.key?.questionIds.length ?? 1) - answeredCount(a, room) / Math.max(1, a.key?.questionIds.length ?? 1);
      if (sort === 'grade') return (b.result?.percent ?? -1) - (a.result?.percent ?? -1);
      return a.name.localeCompare(b.name, 'es');
    });

  const link = buildExamLink(room.code, room.transport);
  const localhost = Platform.OS === 'web' && typeof window !== 'undefined' && /^(localhost|127\.)/.test(window.location.hostname);
  const cols = width >= 1300 ? 3 : width >= 860 ? 2 : 1;
  const status = room.status === 'lobby' ? { label: 'En espera: aún no comienza', color: t.info } : room.status === 'running' ? { label: 'Examen en curso', color: t.success } : { label: 'Examen cerrado', color: t.textMuted };

  const close = async () => {
    const pending = students.filter((s) => s.startedAt && !s.submittedAt).length;
    const ok = await confirmDialog('¿Cerrar el examen?', pending ? `${pending} alumno(s) aún no envían: sus exámenes se recogerán y calificarán con lo que lleven.` : 'Nadie más podrá entrar ni enviar respuestas.', 'Cerrar examen');
    if (!ok) return;
    setClosing(true);
    await useTeacher.getState().closeExam();
    setClosing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {!network.online ? <Banner icon="cloud-offline-outline" color={t.warning} text={network.detail ?? 'Sin conexión con la red. Reintentando…'} /> : null}

        <View style={[styles.codeRow, { flexDirection: width >= 760 ? 'row' : 'column' }]}>
          <Card style={{ flex: 1.1, marginRight: width >= 760 ? 12 : 0 }} accent={status.color}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={[styles.liveDot, { backgroundColor: status.color }]} />
              <Text style={{ color: status.color, fontWeight: '800', fontSize: 13 }}>{status.label.toUpperCase()}</Text>
            </View>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }} numberOfLines={2}>
              {room.exam.title}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 10 }}>
              {questionsPerStudent(room.exam)} preguntas · {room.exam.durationMin ? `${room.exam.durationMin} min por alumno` : 'sin límite de tiempo'} · {transportLabel(room.transport)}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700' }}>CÓDIGO DE LA SALA</Text>
            <Pressable onPress={() => copyText(room.code)} accessibilityLabel="Copiar código">
              <Text style={{ color: t.text, fontSize: 44, fontWeight: '900', letterSpacing: 10, fontFamily: MONO }}>{room.code}</Text>
            </Pressable>
            <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 19 }}>
              Los alumnos abren PSJavaScript → <Text style={{ fontWeight: '700', color: t.text }}>Examen</Text> → <Text style={{ fontWeight: '700', color: t.text }}>Soy alumno</Text> y escriben este código.
            </Text>
            {link ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 12 }}>
                {room.transport.kind !== 'device' ? <QrCode value={link} size={112} /> : null}
                <View style={{ flex: 1, minWidth: 180, gap: 8 }}>
                  <Text style={{ color: t.primary, fontSize: 12, fontFamily: MONO }} numberOfLines={2}>
                    {link}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Button label="Copiar enlace" icon="link-outline" onPress={() => copyText(link)} />
                    <Button label="Proyectar" icon="tv-outline" onPress={() => setProjector(true)} />
                  </View>
                </View>
              </View>
            ) : (
              <Button label="Proyectar código" icon="tv-outline" onPress={() => setProjector(true)} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
            )}
            {localhost && room.transport.kind !== 'device' ? <Text style={{ color: t.warning, fontSize: 12, marginTop: 6 }}>Abriste la aplicación como «localhost»: comparte con tus alumnos la dirección IP de tu equipo (la muestra «npm run sala»).</Text> : null}
          </Card>

          <Card style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 10 }}>Controles</Text>
            {room.status === 'lobby' ? (
              <>
                <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 10 }}>
                  {students.length ? `${students.length} alumno(s) en la sala.` : 'Esperando a que entren los alumnos…'} Cuando estén listos, inicia el examen; cada uno lo comienza al presionar «Comenzar».
                </Text>
                <Button label="Iniciar examen" icon="play" kind="primary" onPress={() => useTeacher.getState().startExam()} style={{ height: 48, marginBottom: 8 }} />
              </>
            ) : null}
            {room.status === 'running' ? (
              <View style={{ gap: 8 }}>
                <Button label="Enviar aviso a todos" icon="megaphone-outline" onPress={() => setNoticeOpen(true)} />
                {room.exam.durationMin ? <Button label="Dar 5 minutos más a todos" icon="time-outline" onPress={() => useTeacher.getState().addTime(5)} /> : null}
                <Button label={closing ? 'Recogiendo exámenes…' : 'Cerrar examen'} icon="lock-closed-outline" kind="danger" onPress={close} disabled={closing} />
              </View>
            ) : null}
            {room.status === 'lobby' ? <Button label="Cancelar sala" icon="close-circle-outline" onPress={close} /> : null}
            {room.status !== 'closed' ? (
              <View style={{ marginTop: 8 }}>
                <Toggle
                  icon={room.locked ? 'lock-closed-outline' : 'lock-open-outline'}
                  label="Aceptar alumnos nuevos"
                  description={room.locked ? 'Ingreso cerrado: solo pueden reconectarse quienes ya entraron.' : 'Cualquiera con el código puede entrar. Ciérralo cuando estén todos.'}
                  value={!room.locked}
                  onChange={(open) => useTeacher.getState().setLocked(!open)}
                />
              </View>
            ) : null}
            {room.status === 'closed' ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: t.textMuted, fontSize: 13 }}>El examen terminó. Revisa el concentrado de calificaciones o abre una sala nueva.</Text>
                <Button label="Ver concentrado" icon="bar-chart-outline" kind="primary" onPress={() => useTeacher.setState({ tab: 'results', viewingKey: null })} />
                <Button label="Terminar y abrir otra sala" icon="add-circle-outline" onPress={() => useTeacher.getState().leaveRoom()} />
              </View>
            ) : null}
            {room.status !== 'closed' ? <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 10 }}>Mantén esta ventana abierta: tu equipo es el que recibe y califica los exámenes.</Text> : null}
          </Card>
        </View>

        <View style={styles.stats}>
          <Stat icon="people-outline" label="En la sala" value={`${stats.connected}/${students.length}`} color={t.primary} />
          <Stat icon="create-outline" label="Trabajando" value={stats.working} color={t.accent} />
          <Stat icon="checkmark-done-outline" label="Entregados" value={stats.submitted} color={t.success} />
          <Stat icon="cloud-offline-outline" label="Desconectados" value={stats.offline} color={stats.offline ? t.danger : t.textMuted} />
          <Stat icon="eye-off-outline" label="Con alertas" value={stats.alerts} color={stats.alerts ? t.warning : t.textMuted} />
          <Stat icon="school-outline" label="Promedio (entregados)" value={stats.avg ?? '—'} color={t.info} sub={`escala ${room.exam.scale}`} />
        </View>

        <View style={styles.filters}>
          {(
            [
              ['all', `Todos (${students.length})`],
              ['working', 'Trabajando'],
              ['submitted', 'Entregados'],
              ['alerts', 'Con alertas'],
              ['offline', 'Desconectados'],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <Chip key={id} label={label} active={filter === id} onPress={() => setFilter(id)} />
          ))}
          <View style={{ flex: 1 }} />
          <Text style={{ color: t.textMuted, fontSize: 12, marginRight: 6, marginBottom: 6 }}>Ordenar:</Text>
          {(
            [
              ['name', 'Nombre'],
              ['progress', 'Avance'],
              ['grade', 'Calificación'],
            ] as [Sort, string][]
          ).map(([id, label]) => (
            <Chip key={id} label={label} active={sort === id} onPress={() => setSort(id)} />
          ))}
        </View>

        {!students.length ? (
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
            <ActivityIndicator color={t.primary} />
            <Text style={{ color: t.textMuted, marginTop: 10 }}>Aún no hay alumnos. Comparte el código {room.code}.</Text>
          </Card>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
            {shown.map((s) => (
              <View key={s.id} style={{ width: `${100 / cols}%`, paddingHorizontal: 5 }}>
                <StudentCard s={s} room={room} now={now} duplicate={isDuplicate(s)} onPress={() => setDetail(s.id)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      {detail && room.students[detail] ? <StudentDetailModal room={room} studentId={detail} live onClose={() => setDetail(null)} /> : null}
      {noticeOpen ? <NoticeDialog onClose={() => setNoticeOpen(false)} /> : null}
      {projector ? <ProjectorView room={room} link={link} stats={stats} onClose={() => setProjector(false)} /> : null}
    </View>
  );
}

function StudentCard({ s, room, now, duplicate, onPress }: { s: StudentRecord; room: RoomState; now: number; duplicate: boolean; onPress(): void }) {
  const t = useTheme();
  const phase = studentPhase(s, room);
  const pi = PHASE_INFO[phase];
  const color = (t as any)[pi.color] as string;
  const total = s.key?.questionIds.length ?? questionsPerStudent(room.exam);
  const done = answeredCount(s, room);
  const qid = s.key?.questionIds[s.current];
  const q = qid ? room.exam.questions.find((x) => x.id === qid) : undefined;
  const left = s.deadline && !s.submittedAt ? s.deadline - now : null;
  const away = s.startedAt && !s.submittedAt && (s.activity === 'away' || !s.focused);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.student, { backgroundColor: pressed ? t.surfaceAlt : t.surface, borderColor: away ? t.warning : t.border, borderLeftColor: color }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
          <Text style={{ color, fontWeight: '900' }}>{s.name.trim().charAt(0).toUpperCase() || '?'}</Text>
          <View style={[styles.conn, { backgroundColor: s.connected ? t.success : t.danger, borderColor: t.surface }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
            {s.name}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
            {s.group || 'Sin grupo'} · {s.connected ? 'conectado' : `desconectado hace ${formatSince(now - s.lastSeen)}`}
          </Text>
        </View>
        {s.result ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: s.result.passed ? t.success : t.danger, fontSize: 20, fontWeight: '900' }}>{s.result.grade}</Text>
            <Text style={{ color: t.textMuted, fontSize: 10 }}>/{s.result.scale}</Text>
          </View>
        ) : (
          <Pill icon={pi.icon} text={pi.label} color={color} />
        )}
      </View>

      {s.startedAt ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
            <Text style={{ color: t.textMuted, fontSize: 12, flex: 1 }}>
              {done}/{total} respondidas
            </Text>
            {left !== null ? (
              <Text style={{ color: left < 60_000 ? t.danger : left < 300_000 ? t.warning : t.textMuted, fontSize: 12, fontFamily: MONO }}>
                <Ionicons name="time-outline" size={11} /> {formatDuration(left)}
              </Text>
            ) : s.submittedAt ? (
              <Text style={{ color: t.textMuted, fontSize: 12 }}>en {formatDuration(s.submittedAt - s.startedAt)}</Text>
            ) : null}
          </View>
          <ProgressBar value={done / Math.max(1, total)} color={s.submittedAt ? t.success : t.primary} />
        </>
      ) : null}

      {phase === 'working' ? (
        <View style={[styles.activity, { backgroundColor: away ? t.warning + '18' : t.surfaceAlt }]}>
          <Ionicons name={ACTIVITY_ICON[s.activity]} size={14} color={away ? t.warning : s.activity === 'idle' ? t.textMuted : t.primary} />
          <Text style={{ color: away ? t.warning : t.text, fontSize: 12, marginLeft: 6, flex: 1 }} numberOfLines={1}>
            {ACTIVITY_LABEL[s.activity]}
            {q && !away ? ` · P${s.current + 1} (${questionTypeInfo(q.type).label})` : ''}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 11 }}>{formatSince(now - s.activitySince)}</Text>
        </View>
      ) : null}

      {s.focusLost || s.pasteBlocked || s.lockdown || duplicate ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {duplicate ? <Pill icon="people-outline" color={t.danger} text="Nombre repetido" /> : null}
          {s.focusLost ? <Pill icon="eye-off-outline" color={t.warning} text={`Salió ${s.focusLost}× · ${formatSince(s.awayMs)}`} /> : null}
          {s.pasteBlocked ? <Pill icon="clipboard-outline" color={t.danger} text={`Pegar ${s.pasteBlocked}×`} /> : null}
          {s.lockdown ? <Pill icon="lock-open-outline" color={t.danger} text={`Bloqueo ${s.lockdown}×`} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** Pantalla completa para proyectar en el salón: código grande, QR y avance general. */
function ProjectorView({ room, link, stats, onClose }: { room: RoomState; link: string | null; stats: { connected: number; working: number; submitted: number }; onClose(): void }) {
  const { width, height } = useWindowDimensions();
  const big = Math.min(width, height);
  const total = Object.keys(room.students).length;
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.projector}>
        <Pressable onPress={onClose} style={styles.projectorClose} accessibilityLabel="Cerrar vista para proyectar">
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={{ color: '#dce6ec', fontSize: Math.max(18, big * 0.03), fontWeight: '700', textAlign: 'center' }} numberOfLines={2}>
          {room.exam.title}
        </Text>
        <View style={{ flexDirection: width > height ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: big * 0.06, marginVertical: big * 0.04 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#a3b6bf', fontSize: Math.max(14, big * 0.025), fontWeight: '800', letterSpacing: 2 }}>CÓDIGO DE LA SALA</Text>
            <Text style={{ color: '#fff', fontSize: big * 0.13, fontWeight: '900', letterSpacing: big * 0.02, fontFamily: MONO }}>{room.code}</Text>
            <Text style={{ color: '#dce6ec', fontSize: Math.max(14, big * 0.024), textAlign: 'center', marginTop: 8 }}>
              PSJavaScript → Examen → Soy alumno
            </Text>
          </View>
          {link && room.transport.kind !== 'device' ? (
            <View style={{ alignItems: 'center' }}>
              <QrCode value={link} size={Math.round(big * 0.34)} />
              <Text style={{ color: '#a3b6bf', fontSize: Math.max(12, big * 0.018), marginTop: 8 }}>o escanea con la cámara</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ color: '#fff', fontSize: Math.max(16, big * 0.03), fontWeight: '700' }}>
          {total} en la sala · {stats.working} trabajando · {stats.submitted} entregados
        </Text>
        {room.locked ? <Text style={{ color: '#ffc800', fontSize: Math.max(14, big * 0.022), marginTop: 8 }}>Ingreso cerrado</Text> : null}
      </View>
    </Modal>
  );
}

const NOTICE_PRESETS = ['Quedan 10 minutos.', 'Quedan 5 minutos.', 'Revisen sus respuestas antes de enviar.', 'Recuerden leer bien cada enunciado.'];

function NoticeDialog({ onClose }: { onClose(): void }) {
  const t = useTheme();
  const [text, setText] = useState('');
  const send = (msg: string) => {
    if (!msg.trim()) return;
    useTeacher.getState().notice(msg.trim());
    onClose();
  };
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 17, marginBottom: 10 }}>Aviso para todos los alumnos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
            {NOTICE_PRESETS.map((p) => (
              <Chip key={p} label={p} onPress={() => send(p)} />
            ))}
          </View>
          <TextField value={text} onChangeText={setText} placeholder="O escribe tu propio aviso…" multiline minHeight={60} />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button label="Cancelar" onPress={onClose} />
            <Button label="Enviar" icon="send" kind="primary" onPress={() => send(text)} disabled={!text.trim()} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  codeRow: { alignItems: 'stretch' },
  liveDot: { width: 9, height: 9, borderRadius: 5, marginRight: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 },
  student: { borderWidth: BORDER, borderLeftWidth: 4, borderRadius: RADIUS.md, padding: 12, marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  conn: { position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  activity: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 6, marginTop: 10 },
  overlay: { flex: 1, backgroundColor: SCRIM, alignItems: 'center', justifyContent: 'center', padding: 16 },
  projector: { flex: 1, backgroundColor: '#131f24', alignItems: 'center', justifyContent: 'center', padding: 24 },
  projectorClose: { position: 'absolute', top: 18, right: 18, padding: 8, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.12)' },
  dialog: { width: '100%', maxWidth: 520, borderRadius: RADIUS.lg, borderWidth: BORDER, padding: 18 },
});
