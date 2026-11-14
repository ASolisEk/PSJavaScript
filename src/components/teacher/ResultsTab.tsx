/** Concentrado: calificaciones, tiempos, análisis por pregunta e historial. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { questionTypeInfo, validateExam } from '../../core/exam/config';
import { plainText } from '../../core/exam/richText';
import type { RoomState } from '../../core/exam/room';
import { answersCsv, answersTxt, backupFileName, correctText, gradesCsv, roomReportHtml } from '../../core/exam/report';
import { compareRooms, discriminationLabel, RoomSummary, summarizeRoom, summaryCsv } from '../../core/exam/summary';
import type { Question } from '../../core/exam/types';
import QuestionEditor from './QuestionEditor';
import { PublishCard } from './RoomExtras';
import { roomKey, useResultsRoom, useTeacher } from '../../store/teacher';
import { confirmDialog, pickTextFile, saveTextFile } from '../../ui/platform';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import { Button, Empty, Heading } from '../ui';
import { Banner, Card, CodeBlock, IconName, Pill, ProgressBar, Stat } from '../exam/kit';
import RichText from '../exam/RichText';
import StudentDetailModal from './StudentDetailModal';
import ModalShell from '../modals/ModalShell';
import { similarCode, SimilarPair } from '../../core/exam/similarity';

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'examen';

export default function ResultsTab() {
  const t = useTheme();
  const room = useResultsRoom();
  const history = useTeacher((s) => s.history);
  const rooms = useTeacher((s) => s.rooms);
  const liveKeys = useTeacher((s) => s.liveKeys);
  const shownKey = room ? roomKey(room) : null;
  const [importError, setImportError] = useState<string | null>(null);
  // salas actuales primero (una misma clave puede estar archivada y seguir en la lista un instante)
  const currentKeys = new Set(rooms.map(roomKey));
  const archived = history.filter((h) => !currentKeys.has(roomKey(h)));

  return (
    <ScrollView contentContainerStyle={{ padding: 14 }}>
      {room ? <Summary key={shownKey!} room={room} live={liveKeys.includes(shownKey!)} /> : <Empty icon="bar-chart-outline" text="Aquí verás el concentrado de calificaciones cuando apliques un examen." />}

      {rooms.length ? (
        <>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginTop: 18, marginBottom: 8 }}>Salas actuales</Text>
          {rooms.map((r) => (
            <HistoryRow
              key={roomKey(r)}
              r={r}
              active={shownKey === roomKey(r)}
              label={r.status === 'closed' ? 'Cerrada (sin archivar)' : liveKeys.includes(roomKey(r)) ? (r.status === 'running' ? 'En curso' : 'En espera') : 'Sin reabrir'}
              onPress={() => useTeacher.getState().viewHistory(roomKey(r))}
            />
          ))}
        </>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 18, marginBottom: 8 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', flex: 1 }}>Exámenes aplicados</Text>
        <Button
          label="Importar respaldo"
          icon="cloud-upload-outline"
          size="sm"
          onPress={async () => {
            setImportError(null);
            try {
              const f = await pickTextFile('.json');
              if (f) useTeacher.getState().importHistory(f.text);
            } catch (e: any) {
              setImportError(e?.message ?? String(e));
            }
          }}
        />
      </View>
      {importError ? <Banner icon="alert-circle" color={t.danger} text={importError} onClose={() => setImportError(null)} /> : null}
      {archived.length === 0 ? <Text style={{ color: t.textMuted, fontSize: 13 }}>Cuando cierres y archives una sala aparecerá aquí.</Text> : null}
      {archived.length + rooms.filter((r) => r.status === 'closed').length >= 2 ? <Trends rooms={[...rooms.filter((r) => r.status === 'closed'), ...archived]} /> : null}
      {archived.map((h) => (
        <HistoryRow key={roomKey(h)} r={h} active={shownKey === roomKey(h)} onPress={() => useTeacher.getState().viewHistory(roomKey(h))} onDelete={async () => {
          if (await confirmDialog('¿Borrar del historial?', `Se borrarán los resultados de «${h.exam.title}» (${new Date(h.openedAt).toLocaleDateString()}).`, 'Borrar')) useTeacher.getState().deleteHistory(roomKey(h));
        }} />
      ))}
    </ScrollView>
  );
}

function HistoryRow({ r, active, label, onPress, onDelete }: { r: RoomState; active: boolean; label?: string; onPress(): void; onDelete?(): void }) {
  const t = useTheme();
  const n = Object.keys(r.students).length;
  const graded = Object.values(r.students).filter((s) => s.result);
  const avg = graded.length ? Math.round((graded.reduce((a, s) => a + s.result!.grade, 0) / graded.length) * 10) / 10 : null;
  return (
    <Pressable onPress={onPress} style={[styles.hist, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary + '10' : t.surface }]}>
      <Ionicons name="document-text-outline" size={18} color={active ? t.primary : t.textMuted} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: t.text, fontWeight: '700' }} numberOfLines={1}>
          {r.exam.title}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 12 }}>
          {label ? `${label} · ` : ''}
          {new Date(r.openedAt).toLocaleString()} · sala {r.code} · {n} alumno(s){avg !== null ? ` · promedio ${avg}` : ''}
        </Text>
      </View>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel="Borrar del historial">
          <Ionicons name="trash-outline" size={17} color={t.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function fmt(n: number | null, suffix = '') {
  return n === null ? '—' : `${n}${suffix}`;
}

function Summary({ room, live }: { room: RoomState; live: boolean }) {
  const t = useTheme();
  const sum = useMemo(() => summarizeRoom(room), [room]);
  const [detail, setDetail] = useState<string | null>(null);
  const [fixing, setFixing] = useState<Question | null>(null);
  /** Cola de calificación: solo alumnos con respuestas abiertas, mostrando esas preguntas. */
  const [queue, setQueue] = useState(false);
  const pendingIds = sum.rows.filter((r) => room.students[r.id]?.result?.questions.some((q) => q.status === 'pending')).map((r) => r.id);
  const essayIds = sum.rows.filter((r) => room.students[r.id]?.result?.questions.some((q) => q.type === 'essay')).map((r) => r.id);
  const pendingCount = pendingIds.reduce((a, id) => a + room.students[id].result!.questions.filter((q) => q.status === 'pending').length, 0);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const maxBar = Math.max(1, ...sum.histogram);
  const date = new Date(sum.openedAt);

  return (
    <View>
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Heading>{sum.title}</Heading>
          <Text style={{ color: t.textMuted, fontSize: 13 }}>
            {date.toLocaleDateString()} {date.toLocaleTimeString()} · sala {sum.code}
            {sum.closedAt ? ` · cerrada a las ${new Date(sum.closedAt).toLocaleTimeString()}` : ''}
          </Text>
        </View>
        {sum.rows.some((r) => r.submitted) ? (
          <Button
            label="Revisar y calificar"
            icon="create-outline"
            kind="primary"
            onPress={() => {
              setQueue(false);
              setDetail((sum.rows.find((r) => r.submitted) ?? sum.rows[0]).id);
            }}
          />
        ) : null}
        {pendingCount ? (
          <Button
            label={`Calificar abiertas (${pendingCount})`}
            icon="time-outline"
            kind="primary"
            onPress={() => {
              setQueue(true);
              setDetail(pendingIds[0]);
            }}
          />
        ) : null}
      </View>
      <Card>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 4 }}>Exportar</Text>
        <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 10, lineHeight: 17 }}>
          «Preguntas y respuestas» es un archivo de texto (.txt) que se abre en cualquier computadora: por cada alumno trae cada pregunta que le tocó con su enunciado, lo que respondió, la respuesta correcta y sus puntos. El concentrado y las respuestas en CSV se abren en Excel u Hojas de cálculo; el reporte detallado se abre en el navegador y se puede imprimir o guardar como PDF.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button label="Preguntas y respuestas (TXT)" icon="document-outline" kind="primary" onPress={() => saveTextFile(`preguntas-y-respuestas-${slug(sum.title)}-${sum.code}.txt`, answersTxt(room), 'text/plain')} />
          <Button label="Concentrado (CSV)" icon="grid-outline" onPress={() => saveTextFile(`concentrado-${slug(sum.title)}.csv`, summaryCsv(sum), 'text/csv')} />
          <Button label="Respuestas (CSV)" icon="list-outline" onPress={() => saveTextFile(`respuestas-${slug(sum.title)}.csv`, answersCsv(room), 'text/csv')} />
          <Button label="Calificaciones para Moodle/Classroom (CSV)" icon="school-outline" onPress={() => saveTextFile(`calificaciones-${slug(sum.title)}-${sum.code}.csv`, gradesCsv(room), 'text/csv')} />
          <Button label="Reporte detallado (HTML)" icon="document-text-outline" onPress={() => saveTextFile(`reporte-${slug(sum.title)}.html`, roomReportHtml(room), 'text/html')} />
          <Button label="Respaldo (JSON)" icon="download-outline" onPress={() => saveTextFile(backupFileName(room), JSON.stringify(room), 'application/json')} />
        </View>
      </Card>
      {room.status !== 'closed' ? <Banner icon="information-circle-outline" color={t.info} text="El examen sigue en curso: estos resultados son provisionales." /> : null}
      {room.exam.holdResults ? (
        <Card accent={room.published ? t.success : t.warning}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>{room.published ? '✓ Calificaciones publicadas' : 'Calificaciones retenidas'}</Text>
          {room.published ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>Los alumnos ya ven su resultado; si ajustas puntos, lo reciben actualizado.</Text> : <PublishCard room={room} />}
        </Card>
      ) : null}

      <View style={styles.stats}>
        <Stat icon="people-outline" label="Alumnos" value={sum.students} sub={`${sum.submitted} entregaron`} />
        <Stat icon="school-outline" label="Promedio" value={fmt(sum.average)} sub={`mediana ${fmt(sum.median)}`} color={t.info} />
        <Stat icon="trending-up-outline" label="Más alta" value={fmt(sum.best)} color={t.success} />
        <Stat icon="trending-down-outline" label="Más baja" value={fmt(sum.worst)} color={t.danger} />
        <Stat icon="ribbon-outline" label="Aprobados" value={fmt(sum.passRate, '%')} sub={`mínimo ${sum.passPercent}%`} color={t.success} />
        <Stat icon="time-outline" label="Tiempo promedio" value={fmt(sum.avgMinutes, ' min')} color={t.accent} />
      </View>

      <View style={styles.cols}>
        <View style={{ flex: 1, minWidth: 280 }}>
          <Card>
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 10 }}>Distribución de calificaciones</Text>
            <View style={styles.histo}>
              {sum.histogram.map((v, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: t.textMuted, fontSize: 10, marginBottom: 2 }}>{v || ''}</Text>
                  <View style={{ width: '70%', height: Math.max(2, (v / maxBar) * 110), backgroundColor: (i + 1) * 10 > sum.passPercent ? t.success : t.danger, borderRadius: RADIUS.md, opacity: v ? 1 : 0.25 }} />
                  <Text style={{ color: t.textMuted, fontSize: 9, marginTop: 4 }} numberOfLines={1}>
                    {Math.round((i * sum.scale) / 10)}–{Math.round(((i + 1) * sum.scale) / 10)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' }}>Calificación (sobre {sum.scale})</Text>
          </Card>
          {sum.topics.length ? (
            <Card>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 4 }}>Análisis por tema</Text>
              <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 10 }}>Aciertos del grupo en cada tema; los más bajos aparecen primero.</Text>
              {[...sum.topics]
                .sort((a, b) => a.avgPercent - b.avgPercent)
                .map((x) => {
                  const c = x.avgPercent >= sum.passPercent ? t.success : x.avgPercent >= 50 ? t.warning : t.danger;
                  return (
                    <View key={x.topic} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                        <Text style={{ color: t.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                          {x.topic}
                        </Text>
                        <Text style={{ color: c, fontSize: 12, fontWeight: '800' }}>
                          {x.avgPercent}% · {x.correct}/{x.attempts}
                        </Text>
                      </View>
                      <ProgressBar value={x.avgPercent / 100} color={c} />
                    </View>
                  );
                })}
            </Card>
          ) : null}
        </View>

        <Card style={{ flex: 1.3, minWidth: 300 }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 2 }}>Análisis por pregunta</Text>
          <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 10 }}>Toca una pregunta para verla completa con su respuesta correcta.</Text>
          {sum.questions.map((q) => {
            const diff = q.attempts === 0 || q.voided ? null : q.avgPercent >= 80 ? { l: 'Fácil', c: t.success } : q.avgPercent >= 50 ? { l: 'Media', c: t.warning } : { l: 'Difícil', c: t.danger };
            const full = open.has(q.questionId) ? room.exam.questions.find((x) => x.id === q.questionId) : undefined;
            return (
              <View key={q.questionId} style={{ marginBottom: 10 }}>
                <Pressable onPress={() => toggle(q.questionId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Ionicons name={questionTypeInfo(q.type).icon as IconName} size={14} color={t.textMuted} />
                  <Text style={{ color: t.text, fontSize: 13, flex: 1 }} numberOfLines={full ? undefined : 2}>
                    <Text style={{ fontWeight: '800' }}>P{q.index + 1}.</Text> {full ? '' : plainText(q.prompt)}
                  </Text>
                  {diff ? <Pill text={diff.l} color={diff.c} /> : null}
                  <Ionicons name={full ? 'chevron-up' : 'chevron-down'} size={14} color={t.textMuted} />
                </Pressable>
                {full ? (
                  <View style={[styles.full, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <Button label="Corregir y recalificar" icon="build-outline" size="sm" onPress={() => setFixing(full)} />
                      <Button
                        label={full.voided ? 'Restaurar pregunta' : 'Anular pregunta'}
                        icon={full.voided ? 'refresh-outline' : 'ban-outline'}
                        size="sm"
                        kind={full.voided ? 'default' : 'danger'}
                        onPress={async () => {
                          const ok = await confirmDialog(
                            full.voided ? '¿Restaurar la pregunta?' : '¿Anular la pregunta?',
                            full.voided ? 'Volverá a contar para la calificación de todos.' : 'No contará para nadie: se quita del total de puntos de cada alumno al que le tocó y se recalculan las calificaciones.',
                            full.voided ? 'Restaurar' : 'Anular',
                          );
                          if (ok) useTeacher.getState().updateRoomQuestion(roomKey(room), { ...full, voided: full.voided ? undefined : true });
                        }}
                      />
                    </View>
                    <RichText text={full.prompt} style={{ color: t.text, fontSize: 13, lineHeight: 19 }} />
                    {full.code?.trim() ? <CodeBlock code={full.code} style={{ marginTop: 6 }} /> : null}
                    {full.topic ? <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 6 }}>Tema: {full.topic}</Text> : null}
                    <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', marginTop: 8 }}>{full.type === 'code' ? 'SOLUCIÓN DE REFERENCIA' : 'RESPUESTA CORRECTA'}</Text>
                    {full.type === 'code' || full.type === 'order' || full.type === 'output' ? (
                      <CodeBlock code={correctText(full, firstResult(room, full.id)) || '(se calcula al calificar)'} style={{ marginTop: 4 }} />
                    ) : (
                      <Text style={{ color: t.success, fontWeight: '700', marginTop: 2 }}>{correctText(full)}</Text>
                    )}
                  </View>
                ) : null}
                <ProgressBar value={q.avgPercent / 100} color={diff?.c} />
                <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>
                  {q.voided ? 'ANULADA · ' : ''}
                  {q.attempts ? `${q.avgPercent}% de aciertos · ${q.correct}/${q.attempts} completas · ${q.attempts - q.answered} sin responder` : 'No le tocó a nadie (banco aleatorio) o nadie ha entregado.'}
                </Text>
                {q.discrimination !== null ? (
                  <Text style={{ color: (t as any)[discriminationLabel(q.discrimination).tone], fontSize: 11 }}>
                    Discriminación {q.discrimination.toFixed(2)}: {discriminationLabel(q.discrimination).label}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </Card>
      </View>

      <CompareCard room={room} sum={sum} />

      <SimilarCard room={room} />

      <Card>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 10 }}>Calificaciones por alumno</Text>
        <ScrollView horizontal>
          <View>
            <View style={[styles.tr, { borderBottomColor: t.border }]}>
              {['Alumno', 'Grupo', 'Calif.', '%', 'Puntos', 'Tiempo', 'Resp.', 'Salidas', 'Pegar', 'Estado'].map((h, i) => (
                <Text key={h} style={[styles.th, { color: t.textMuted, width: COLS[i] }]}>
                  {h}
                </Text>
              ))}
            </View>
            {sum.rows.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => {
                  setQueue(false);
                  setDetail(r.id);
                }}
                style={({ pressed }) => [styles.tr, { borderBottomColor: t.border, backgroundColor: pressed ? t.surfaceAlt : 'transparent' }]}>
                <Text style={[styles.td, { color: t.text, width: COLS[0], fontWeight: '700' }]} numberOfLines={1}>
                  {r.name}
                </Text>
                <Text style={[styles.td, { color: t.textMuted, width: COLS[1] }]} numberOfLines={1}>
                  {r.group || '—'}
                </Text>
                <Text style={[styles.td, { color: r.passed === null ? t.textMuted : r.passed ? t.success : t.danger, width: COLS[2], fontWeight: '900' }]}>{fmt(r.grade)}</Text>
                <Text style={[styles.td, { color: t.text, width: COLS[3] }]}>{fmt(r.percent, '%')}</Text>
                <Text style={[styles.td, { color: t.text, width: COLS[4] }]}>{r.score === null ? '—' : `${r.score}/${r.max}`}</Text>
                <Text style={[styles.td, { color: t.text, width: COLS[5], fontFamily: MONO }]}>{fmt(r.minutes, ' min')}</Text>
                <Text style={[styles.td, { color: t.text, width: COLS[6] }]}>
                  {r.answered}/{r.questions || '—'}
                </Text>
                <Text style={[styles.td, { color: r.focusLost ? t.warning : t.textMuted, width: COLS[7] }]}>{r.focusLost ? `${r.focusLost}× (${r.awaySeconds}s)` : '0'}</Text>
                <Text style={[styles.td, { color: r.pasteBlocked ? t.danger : t.textMuted, width: COLS[8] }]}>{r.pasteBlocked}</Text>
                <View style={{ width: COLS[9], paddingHorizontal: 6 }}>
                  <Pill
                    text={!r.submitted ? 'Sin entregar' : r.submitReason === 'timeout' ? 'Tiempo agotado' : r.submitReason === 'closed' ? 'Al cerrar' : r.submitReason === 'teacher' ? 'Recogido' : 'Entregó'}
                    color={!r.submitted ? t.danger : r.submitReason === 'manual' ? t.success : t.warning}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 8 }}>Toca un alumno para ver sus respuestas y ajustar puntos a mano.</Text>
      </Card>
      {detail && room.students[detail] ? (
        <StudentDetailModal
          key={queue ? 'cola' : 'todos'}
          room={room}
          studentId={detail}
          live={live}
          onClose={() => setDetail(null)}
          order={queue ? essayIds : sum.rows.map((r) => r.id)}
          onNavigate={setDetail}
          initialFilter={queue ? 'pending' : undefined}
        />
      ) : null}
      {fixing ? <FixQuestionModal room={room} question={fixing} onClose={() => setFixing(null)} /> : null}
    </View>
  );
}

/** Corrige una pregunta ya aplicada (clave, casos, valor…) y la vuelve a calificar a todos. */
function FixQuestionModal({ room, question, onClose }: { room: RoomState; question: Question; onClose(): void }) {
  const t = useTheme();
  const [draft, setDraft] = useState(question);
  const index = room.exam.questions.findIndex((x) => x.id === question.id);
  const issues = validateExam({ ...room.exam, questions: [draft] }).filter((x) => x.questionId === draft.id);
  const affected = Object.values(room.students).filter((s) => s.submittedAt && s.key?.questionIds.includes(question.id)).length;
  return (
    <ModalShell title={`Corregir la pregunta ${index + 1}`} onClose={onClose} wide>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Banner
          icon="information-circle-outline"
          color={t.info}
          text={`Al guardar se vuelve a calificar esta pregunta a ${affected} alumno(s) que ya entregaron (y a quienes entreguen después). Los puntos que asignaste a mano se conservan. El examen guardado en «Mis exámenes» no cambia.`}
        />
        <QuestionEditor q={draft} index={index} count={1} profileId={room.exam.profileId} issues={issues} onChange={setDraft} onMove={() => {}} onDuplicate={() => {}} onDelete={() => {}} fixed />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button label="Cancelar" onPress={onClose} />
          <Button
            label="Guardar y recalificar"
            icon="checkmark"
            kind="primary"
            disabled={issues.some((x) => x.severity === 'error')}
            onPress={() => {
              useTeacher.getState().updateRoomQuestion(roomKey(room), draft);
              onClose();
            }}
          />
        </View>
      </ScrollView>
    </ModalShell>
  );
}

/** Comparación por grupo (en esta sala) y con otras aplicaciones del mismo examen. */
function CompareCard({ room, sum }: { room: RoomState; sum: RoomSummary }) {
  const t = useTheme();
  const rooms = useTeacher((s) => s.rooms);
  const history = useTeacher((s) => s.history);
  const others = useMemo(() => {
    const seen = new Set<string>();
    const all = [...rooms, ...history].filter((r) => {
      const k = roomKey(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return compareRooms(all, room.exam.id);
  }, [rooms, history, room.exam.id]);
  if (sum.groups.length < 2 && others.length < 2) return null;
  const cell = (w: number, bold = false) => ({ width: w, color: t.text, fontSize: 12, fontWeight: bold ? ('800' as const) : ('400' as const), paddingVertical: 4 });
  return (
    <Card>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 8 }}>Comparar</Text>
      {sum.groups.length >= 2 ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 4 }}>POR GRUPO EN ESTA SALA</Text>
          <ScrollView horizontal>
            <View>
              <View style={{ flexDirection: 'row' }}>
                {['Grupo', 'Alumnos', 'Entregaron', 'Promedio', 'Aprobados'].map((h, i) => (
                  <Text key={h} style={[cell([160, 80, 90, 80, 90][i], true), { color: t.textMuted }]}>{h}</Text>
                ))}
              </View>
              {sum.groups.map((g) => (
                <View key={g.group} style={{ flexDirection: 'row', borderTopWidth: BORDER, borderTopColor: t.border }}>
                  <Text style={cell(160, true)} numberOfLines={1}>{g.group}</Text>
                  <Text style={cell(80)}>{g.students}</Text>
                  <Text style={cell(90)}>{g.submitted}</Text>
                  <Text style={cell(80)}>{fmt(g.average)}</Text>
                  <Text style={cell(90)}>{fmt(g.passRate, '%')}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}
      {others.length >= 2 ? (
        <View>
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 4 }}>APLICACIONES DE ESTE EXAMEN ({others.length})</Text>
          <ScrollView horizontal>
            <View>
              <View style={{ flexDirection: 'row' }}>
                {['Fecha', 'Sala', 'Alumnos', 'Promedio', 'Mediana', 'Aprobados', 'Tiempo'].map((h, i) => (
                  <Text key={h} style={[cell([150, 80, 70, 80, 80, 90, 80][i], true), { color: t.textMuted }]}>{h}</Text>
                ))}
              </View>
              {others.map((o) => {
                const current = o.code === room.code && o.openedAt === room.openedAt;
                return (
                  <Pressable key={`${o.code}@${o.openedAt}`} onPress={() => useTeacher.getState().viewHistory(`${o.code}@${o.openedAt}`)} style={{ flexDirection: 'row', borderTopWidth: BORDER, borderTopColor: t.border, backgroundColor: current ? t.primary + '14' : 'transparent' }}>
                    <Text style={cell(150, current)}>{new Date(o.openedAt).toLocaleDateString()}</Text>
                    <Text style={cell(80)}>{o.code}</Text>
                    <Text style={cell(70)}>{o.submitted}/{o.students}</Text>
                    <Text style={cell(80)}>{fmt(o.average)}</Text>
                    <Text style={cell(80)}>{fmt(o.median)}</Text>
                    <Text style={cell(90)}>{fmt(o.passRate, '%')}</Text>
                    <Text style={cell(80)}>{fmt(o.avgMinutes, ' min')}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 4 }}>Toca una fila para abrir esa sala.</Text>
        </View>
      ) : null}
    </Card>
  );
}

const COLS = [190, 90, 64, 64, 80, 84, 60, 96, 56, 130];

/**
 * Comparación entre exámenes aplicados: promedio y aprobados de cada uno (en orden de fecha)
 * y cómo va el grupo en cada tema que se repite.
 */
function Trends({ rooms }: { rooms: RoomState[] }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const sums: RoomSummary[] = useMemo(() => (open ? [...rooms].sort((a, b) => a.openedAt - b.openedAt).slice(-12).map((r) => summarizeRoom(r)) : []), [rooms, open]);
  const topics = useMemo(() => {
    const map = new Map<string, { at: number; pct: number }[]>();
    for (const s of sums) for (const x of s.topics) map.set(x.topic, [...(map.get(x.topic) ?? []), { at: s.openedAt, pct: x.avgPercent }]);
    return [...map].filter(([, v]) => v.length >= 2).map(([topic, v]) => ({ topic, v, delta: Math.round(v[v.length - 1].pct - v[0].pct) }));
  }, [sums]);
  return (
    <Card>
      <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Ionicons name="trending-up-outline" size={17} color={t.accent} />
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginLeft: 6, flex: 1 }}>Comparar exámenes ({rooms.length})</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
      </Pressable>
      {open ? (
        <View style={{ marginTop: 10 }}>
          {sums.map((s) => {
            const pct = s.average === null ? 0 : (s.average / s.scale) * 100;
            return (
              <View key={`${s.code}${s.openedAt}`} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                  <Text style={{ color: t.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    <Text style={{ color: t.textMuted }}>{new Date(s.openedAt).toLocaleDateString()} · </Text>
                    {s.title}
                  </Text>
                  <Text style={{ color: t.text, fontSize: 12, fontWeight: '800' }}>
                    {s.average ?? '—'}/{s.scale} · {s.passRate === null ? '—' : `${s.passRate} % aprobó`}
                  </Text>
                </View>
                <ProgressBar value={pct / 100} color={pct >= s.passPercent ? t.success : t.warning} />
              </View>
            );
          })}
          {topics.length ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 6 }}>TEMAS QUE SE REPITEN (aciertos del grupo en cada examen)</Text>
              {topics.map((x) => (
                <View key={x.topic} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                  <Text style={{ color: t.text, fontSize: 13, width: 160 }} numberOfLines={1}>
                    {x.topic}
                  </Text>
                  {x.v.map((p, i) => (
                    <Pill key={i} text={`${p.pct}%`} color={p.pct >= 70 ? t.success : p.pct >= 50 ? t.warning : t.danger} />
                  ))}
                  <Text style={{ color: x.delta > 0 ? t.success : x.delta < 0 ? t.danger : t.textMuted, fontSize: 12, fontWeight: '800' }}>
                    {x.delta > 0 ? `▲ +${x.delta}` : x.delta < 0 ? `▼ ${x.delta}` : '='}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** Respuestas de programación muy parecidas entre alumnos (para revisar posibles copias). */
function SimilarCard({ room }: { room: RoomState }) {
  const t = useTheme();
  const pairs = useMemo(() => similarCode(room), [room]);
  const [shown, setShown] = useState<SimilarPair | null>(null);
  if (!room.exam.questions.some((q) => q.type === 'code')) return null;
  return (
    <Card accent={pairs.length ? t.warning : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name="git-compare-outline" size={17} color={pairs.length ? t.warning : t.textMuted} />
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginLeft: 6, flex: 1 }}>Código parecido entre alumnos</Text>
        {pairs.length ? <Pill text={`${pairs.length} pareja${pairs.length === 1 ? '' : 's'}`} color={t.warning} /> : null}
      </View>
      <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 8, lineHeight: 17 }}>
        Compara las respuestas de programación sin contar el código inicial. Es una alerta para revisar, no una prueba: en ejercicios cortos dos soluciones correctas pueden parecerse.
      </Text>
      {pairs.length ? (
        pairs.slice(0, 30).map((p, i) => (
          <Pressable key={i} onPress={() => setShown(p)} style={({ pressed }) => [styles.simRow, { borderColor: t.border, backgroundColor: pressed ? t.surfaceAlt : t.surface }]} accessibilityRole="button">
            <Text style={{ color: t.text, fontWeight: '800', width: 40 }}>P{p.index}</Text>
            <Text style={{ color: t.text, flex: 1 }} numberOfLines={1}>
              {p.a} <Text style={{ color: t.textMuted }}>y</Text> {p.b}
            </Text>
            <Pill text={p.kind === 'copy' ? `${p.percent} % igual` : `misma estructura (${p.structure} %)`} color={p.kind === 'copy' ? t.danger : t.warning} />
            <Ionicons name="chevron-forward" size={15} color={t.textMuted} />
          </Pressable>
        ))
      ) : (
        <Text style={{ color: t.success, fontSize: 13 }}>✓ No se encontraron respuestas sospechosamente parecidas.</Text>
      )}
      {shown ? <CompareModal room={room} pair={shown} onClose={() => setShown(null)} /> : null}
    </Card>
  );
}

function CompareModal({ room, pair, onClose }: { room: RoomState; pair: SimilarPair; onClose(): void }) {
  const t = useTheme();
  const q = room.exam.questions.find((x) => x.id === pair.questionId);
  const codeOf = (id: string) => String(room.students[id]?.answers[pair.questionId] ?? '');
  return (
    <ModalShell title={`P${pair.index}: ${pair.a} y ${pair.b}`} onClose={onClose} wide>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {q ? <RichText text={q.prompt} style={{ color: t.textMuted, fontSize: 13, marginBottom: 10 }} /> : null}
        <Text style={{ color: t.text, fontSize: 13, marginBottom: 10 }}>
          {pair.percent} % del texto en común · {pair.structure} % de la estructura en común (sin contar nombres ni valores)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            [pair.a, pair.aId],
            [pair.b, pair.bId],
          ].map(([name, id]) => (
            <View key={id} style={{ flex: 1, minWidth: 280 }}>
              <Text style={{ color: t.text, fontWeight: '800', marginBottom: 4 }}>{name}</Text>
              <CodeBlock code={codeOf(id)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </ModalShell>
  );
}

/** Primer resultado calificado de una pregunta (trae la salida real de «¿Qué imprime?»). */
function firstResult(room: RoomState, id: string) {
  for (const s of Object.values(room.students)) {
    const r = s.result?.questions.find((x) => x.questionId === id);
    if (r) return r;
  }
  return undefined;
}

const styles = StyleSheet.create({
  simRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 },
  head: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 8 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  histo: { flexDirection: 'row', alignItems: 'flex-end', height: 150 },
  tr: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: BORDER, paddingVertical: 8 },
  th: { fontSize: 11, fontWeight: '800', paddingHorizontal: 6 },
  td: { fontSize: 13, paddingHorizontal: 6 },
  full: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10, marginTop: 4, marginBottom: 4 },
  hist: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, padding: 12, marginBottom: 8 },
});
