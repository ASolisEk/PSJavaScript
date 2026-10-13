/** Concentrado: calificaciones, tiempos, análisis por pregunta e historial. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { questionTypeInfo } from '../../core/exam/config';
import { plainText } from '../../core/exam/richText';
import type { RoomState } from '../../core/exam/room';
import { summarizeRoom, summaryCsv } from '../../core/exam/summary';
import { roomKey, useResultsRoom, useTeacher } from '../../store/teacher';
import { confirmDialog, saveTextFile } from '../../ui/platform';
import { MONO, useTheme } from '../../ui/theme';
import { Button, Empty } from '../ui';
import { Banner, Card, IconName, Pill, ProgressBar, Stat } from '../exam/kit';
import StudentDetailModal from './StudentDetailModal';

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
  const viewingKey = useTeacher((s) => s.viewingKey);
  const current = useTeacher((s) => s.room);
  const live = useTeacher((s) => s.live);

  return (
    <ScrollView contentContainerStyle={{ padding: 14 }}>
      {room ? <Summary room={room} live={live && !viewingKey} /> : <Empty icon="bar-chart-outline" text="Aquí verás el concentrado de calificaciones cuando apliques un examen." />}

      <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginTop: 18, marginBottom: 8 }}>Exámenes aplicados</Text>
      {current && (viewingKey || current.status !== 'closed') ? (
        <HistoryRow r={current} active={!viewingKey} label={current.status === 'closed' ? 'Sala actual (cerrada)' : 'Sala actual (en curso)'} onPress={() => useTeacher.getState().viewHistory(null)} />
      ) : null}
      {history.length === 0 ? <Text style={{ color: t.textMuted, fontSize: 13 }}>Cuando termines una sala aparecerá aquí.</Text> : null}
      {history.map((h) => (
        <HistoryRow key={roomKey(h)} r={h} active={viewingKey === roomKey(h)} onPress={() => useTeacher.getState().viewHistory(roomKey(h))} onDelete={async () => {
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
  const maxBar = Math.max(1, ...sum.histogram);
  const date = new Date(sum.openedAt);

  return (
    <View>
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>{sum.title}</Text>
          <Text style={{ color: t.textMuted, fontSize: 13 }}>
            {date.toLocaleDateString()} {date.toLocaleTimeString()} · sala {sum.code}
            {sum.closedAt ? ` · cerrada a las ${new Date(sum.closedAt).toLocaleTimeString()}` : ''}
          </Text>
        </View>
        <Button label="Exportar CSV (Excel)" icon="grid-outline" kind="primary" onPress={() => saveTextFile(`resultados-${slug(sum.title)}.csv`, summaryCsv(sum), 'text/csv')} />
        <Button label="Respaldo completo (JSON)" icon="download-outline" onPress={() => saveTextFile(`sala-${sum.code}-${slug(sum.title)}.json`, JSON.stringify(room, null, 2), 'application/json')} />
      </View>
      {room.status !== 'closed' ? <Banner icon="information-circle-outline" color={t.info} text="El examen sigue en curso: estos resultados son provisionales." /> : null}

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
                  <View style={{ width: '70%', height: Math.max(2, (v / maxBar) * 110), backgroundColor: (i + 1) * 10 > sum.passPercent ? t.success : t.danger, borderRadius: 4, opacity: v ? 1 : 0.25 }} />
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
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 10 }}>Análisis por pregunta</Text>
          {sum.questions.map((q) => {
            const diff = q.attempts === 0 ? null : q.avgPercent >= 80 ? { l: 'Fácil', c: t.success } : q.avgPercent >= 50 ? { l: 'Media', c: t.warning } : { l: 'Difícil', c: t.danger };
            return (
              <View key={q.questionId} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Ionicons name={questionTypeInfo(q.type).icon as IconName} size={14} color={t.textMuted} />
                  <Text style={{ color: t.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    <Text style={{ fontWeight: '800' }}>P{q.index + 1}.</Text> {plainText(q.prompt)}
                  </Text>
                  {diff ? <Pill text={diff.l} color={diff.c} /> : null}
                </View>
                <ProgressBar value={q.avgPercent / 100} color={diff?.c} />
                <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>
                  {q.attempts ? `${q.avgPercent}% de aciertos · ${q.correct}/${q.attempts} completas · ${q.attempts - q.answered} sin responder` : 'No le tocó a nadie (banco aleatorio) o nadie ha entregado.'}
                </Text>
              </View>
            );
          })}
        </Card>
      </View>

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
              <Pressable key={r.id} onPress={() => setDetail(r.id)} style={({ pressed }) => [styles.tr, { borderBottomColor: t.border, backgroundColor: pressed ? t.surfaceAlt : 'transparent' }]}>
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
      {detail && room.students[detail] ? <StudentDetailModal room={room} studentId={detail} live={live} onClose={() => setDetail(null)} /> : null}
    </View>
  );
}

const COLS = [190, 90, 64, 64, 80, 84, 60, 96, 56, 130];

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 8 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  histo: { flexDirection: 'row', alignItems: 'flex-end', height: 150 },
  tr: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  th: { fontSize: 11, fontWeight: '800', paddingHorizontal: 6 },
  td: { fontSize: 13, paddingHorizontal: 6 },
  hist: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
});
