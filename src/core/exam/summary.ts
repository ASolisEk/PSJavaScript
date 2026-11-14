/** Concentrado de resultados de una sala: estadísticas, análisis por pregunta y CSV. */
import { answeredCount, normalizeName, RoomState, StudentRecord } from './room';
import { questionsPerStudent } from './config';
import type { QuestionType } from './types';

export interface SummaryRow {
  id: string;
  name: string;
  group: string;
  submitted: boolean;
  submitReason: StudentRecord['submitReason'];
  grade: number | null;
  score: number | null;
  max: number | null;
  percent: number | null;
  passed: boolean | null;
  /** Minutos que tardó (desde que comenzó hasta que entregó). */
  minutes: number | null;
  answered: number;
  questions: number;
  focusLost: number;
  awaySeconds: number;
  pasteBlocked: number;
  runs: number;
  /** Puntos por pregunta (por id de pregunta; null si no le tocó). */
  perQuestion: Record<string, number | null>;
}

export interface QuestionStat {
  questionId: string;
  index: number;
  type: QuestionType;
  prompt: string;
  points: number;
  /** Alumnos a los que les tocó la pregunta. */
  attempts: number;
  answered: number;
  correct: number;
  /** Promedio de aciertos (0–100). */
  avgPercent: number;
  topic?: string;
  /**
   * Índice de discriminación (−1 a 1): aciertos del 27 % con mejor calificación menos los del
   * 27 % con peor. Bajo (< 0.2) o negativo indica una pregunta confusa o con la clave mal.
   * null si hay muy pocos alumnos para calcularlo.
   */
  discrimination: number | null;
  voided?: boolean;
}

export interface GroupStat {
  group: string;
  students: number;
  submitted: number;
  average: number | null;
  passRate: number | null;
}

export interface TopicStat {
  topic: string;
  /** Preguntas de este tema calificadas (sumando a todos los alumnos). */
  attempts: number;
  correct: number;
  /** Promedio de aciertos (0–100). */
  avgPercent: number;
}

export interface RoomSummary {
  title: string;
  code: string;
  openedAt: number;
  startedAt: number | null;
  closedAt: number | null;
  scale: number;
  passPercent: number;
  students: number;
  submitted: number;
  average: number | null;
  median: number | null;
  best: number | null;
  worst: number | null;
  passRate: number | null;
  avgMinutes: number | null;
  /** Cantidad de alumnos por rango de calificación (10 rangos). */
  histogram: number[];
  questions: QuestionStat[];
  /** Análisis por tema (si las preguntas tienen tema). */
  topics: TopicStat[];
  /** Comparación por grupo (si los alumnos escribieron grupos distintos). */
  groups: GroupStat[];
  rows: SummaryRow[];
}

/** Interpretación del índice de discriminación. */
export function discriminationLabel(d: number | null): { label: string; tone: 'success' | 'warning' | 'danger' | 'textMuted' } {
  if (d === null) return { label: 'sin datos suficientes', tone: 'textMuted' };
  if (d < 0) return { label: 'negativa: revisa la clave', tone: 'danger' };
  if (d < 0.2) return { label: 'baja: pregunta confusa o muy fácil/difícil', tone: 'warning' };
  if (d < 0.3) return { label: 'aceptable', tone: 'textMuted' };
  return { label: 'buena', tone: 'success' };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function summarizeRoom(room: RoomState): RoomSummary {
  const exam = room.exam;
  const students = Object.values(room.students).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const rows: SummaryRow[] = students.map((s) => {
    const r = s.result;
    const perQuestion: Record<string, number | null> = {};
    for (const q of exam.questions) perQuestion[q.id] = null;
    for (const q of r?.questions ?? []) perQuestion[q.questionId] = q.score;
    return {
      id: s.id,
      name: s.name,
      group: s.group,
      submitted: !!s.submittedAt,
      submitReason: s.submitReason,
      grade: r ? r.grade : null,
      score: r ? r.score : null,
      max: r ? r.max : null,
      percent: r ? r.percent : null,
      passed: r ? r.passed : null,
      minutes: s.startedAt && s.submittedAt ? round1((s.submittedAt - s.startedAt) / 60_000) : null,
      answered: answeredCount(s, room),
      questions: s.key?.questionIds.length ?? 0,
      focusLost: s.focusLost,
      awaySeconds: Math.round(s.awayMs / 1000),
      pasteBlocked: s.pasteBlocked,
      runs: s.runs,
      perQuestion,
    };
  });
  const graded = rows.filter((r) => r.grade !== null);
  const grades = graded.map((r) => r.grade!);
  const times = rows.filter((r) => r.minutes !== null).map((r) => r.minutes!);
  const histogram = new Array(10).fill(0);
  for (const r of graded) histogram[Math.min(9, Math.floor((r.percent ?? 0) / 10))]++;

  // grupos alto y bajo (27 %) para el índice de discriminación
  const ranked = students.filter((s) => s.result && s.submittedAt).sort((a, b) => b.result!.percent - a.result!.percent);
  const cut = ranked.length >= 4 ? Math.max(1, Math.round(ranked.length * 0.27)) : 0;
  const upper = ranked.slice(0, cut);
  const lower = cut ? ranked.slice(-cut) : [];
  const fractionIn = (group: StudentRecord[], qid: string): number | null => {
    const xs = group.map((s) => s.result!.questions.find((x) => x.questionId === qid)).filter((x) => x && x.max > 0);
    return xs.length ? xs.reduce((a, x) => a + Math.max(0, x!.score) / x!.max, 0) / xs.length : null;
  };

  const all: QuestionStat[] = exam.questions.map((q, index) => {
    let attempts = 0;
    let answered = 0;
    let correct = 0;
    let sum = 0;
    for (const s of students) {
      const qr = s.result?.questions.find((x) => x.questionId === q.id);
      if (!qr) continue;
      attempts++;
      if (qr.status !== 'blank') answered++;
      if (qr.status === 'correct') correct++;
      sum += qr.max > 0 ? qr.score / qr.max : 0;
    }
    const hi = cut ? fractionIn(upper, q.id) : null;
    const lo = cut ? fractionIn(lower, q.id) : null;
    const discrimination = hi !== null && lo !== null ? Math.round((hi - lo) * 100) / 100 : null;
    return {
      questionId: q.id,
      index,
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      attempts,
      answered,
      correct,
      avgPercent: attempts ? round1((sum / attempts) * 100) : 0,
      discrimination: q.voided ? null : discrimination,
      ...(q.topic ? { topic: q.topic } : {}),
      ...(q.voided ? { voided: true } : {}),
    };
  });
  // con un banco de preguntas solo se analizan las que le tocaron a alguien
  const subset = questionsPerStudent(exam) < exam.questions.length && graded.length > 0;
  const questions = subset ? all.filter((q) => q.attempts > 0) : all;

  const byTopic = new Map<string, { attempts: number; correct: number; sum: number }>();
  for (const q of all) {
    if (!q.topic || !q.attempts) continue;
    const t = byTopic.get(q.topic) ?? { attempts: 0, correct: 0, sum: 0 };
    t.attempts += q.attempts;
    t.correct += q.correct;
    t.sum += (q.avgPercent / 100) * q.attempts;
    byTopic.set(q.topic, t);
  }
  const topics: TopicStat[] = [...byTopic].map(([topic, t]) => ({ topic, attempts: t.attempts, correct: t.correct, avgPercent: round1((t.sum / t.attempts) * 100) }));

  const byGroup = new Map<string, SummaryRow[]>();
  for (const r of rows) {
    const g = r.group.trim() || 'Sin grupo';
    byGroup.set(g, [...(byGroup.get(g) ?? []), r]);
  }
  const groups: GroupStat[] =
    byGroup.size > 1
      ? [...byGroup]
          .map(([group, rs]) => {
            const gs = rs.filter((r) => r.grade !== null);
            return {
              group,
              students: rs.length,
              submitted: rs.filter((r) => r.submitted).length,
              average: gs.length ? round1(gs.reduce((a, r) => a + r.grade!, 0) / gs.length) : null,
              passRate: gs.length ? round1((gs.filter((r) => r.passed).length / gs.length) * 100) : null,
            };
          })
          .sort((a, b) => a.group.localeCompare(b.group, 'es'))
      : [];

  return {
    title: exam.title,
    code: room.code,
    openedAt: room.openedAt,
    startedAt: room.startedAt,
    closedAt: room.closedAt,
    scale: exam.scale,
    passPercent: exam.passPercent,
    students: rows.length,
    submitted: rows.filter((r) => r.submitted).length,
    average: grades.length ? round1(grades.reduce((a, b) => a + b, 0) / grades.length) : null,
    median: grades.length ? round1(median(grades)!) : null,
    best: grades.length ? Math.max(...grades) : null,
    worst: grades.length ? Math.min(...grades) : null,
    passRate: graded.length ? round1((graded.filter((r) => r.passed).length / graded.length) * 100) : null,
    avgMinutes: times.length ? round1(times.reduce((a, b) => a + b, 0) / times.length) : null,
    histogram,
    questions,
    topics,
    groups,
    rows,
  };
}

/** Una aplicación del mismo examen (para comparar salas o grupos). */
export interface RoomComparison {
  code: string;
  openedAt: number;
  students: number;
  submitted: number;
  average: number | null;
  median: number | null;
  passRate: number | null;
  avgMinutes: number | null;
}

/** Compara las aplicaciones de un mismo examen (por id de examen), de la más reciente a la más antigua. */
export function compareRooms(rooms: RoomState[], examId: string): RoomComparison[] {
  return rooms
    .filter((r) => r.exam.id === examId)
    .sort((a, b) => b.openedAt - a.openedAt)
    .map((r) => {
      const s = summarizeRoom(r);
      return { code: r.code, openedAt: r.openedAt, students: s.students, submitted: s.submitted, average: s.average, median: s.median, passRate: s.passRate, avgMinutes: s.avgMinutes };
    });
}

export interface HistoryEntry {
  title: string;
  code: string;
  openedAt: number;
  grade: number | null;
  scale: number;
  percent: number | null;
  passed: boolean | null;
  submitted: boolean;
}

/** Exámenes en los que aparece un alumno (por nombre), del más reciente al más antiguo. */
export function studentHistory(rooms: RoomState[], name: string): HistoryEntry[] {
  const key = normalizeName(name);
  const out: HistoryEntry[] = [];
  for (const r of rooms) {
    for (const s of Object.values(r.students)) {
      if (normalizeName(s.name) !== key) continue;
      out.push({ title: r.exam.title, code: r.code, openedAt: r.openedAt, grade: s.result?.grade ?? null, scale: r.exam.scale, percent: s.result?.percent ?? null, passed: s.result?.passed ?? null, submitted: !!s.submittedAt });
    }
  }
  return out.sort((a, b) => b.openedAt - a.openedAt);
}

const REASON: Record<string, string> = { manual: 'El alumno', timeout: 'Tiempo agotado', closed: 'Cierre del examen', teacher: 'El maestro' };

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV con una fila por alumno (se abre en Excel / Hojas de cálculo). */
export function summaryCsv(sum: RoomSummary): string {
  const qHeaders = sum.questions.map((q) => `P${q.index + 1} (${q.points} pts)`);
  const header = ['Nombre', 'Grupo', `Calificación (/${sum.scale})`, 'Puntos', 'Máximo', 'Porcentaje', 'Aprobado', 'Minutos', 'Respondidas', 'Preguntas', 'Salidas de la ventana', 'Segundos fuera', 'Pegados bloqueados', 'Ejecuciones', 'Entregado por', ...qHeaders];
  const lines = [header.map(csvCell).join(',')];
  for (const r of sum.rows) {
    lines.push(
      [
        r.name,
        r.group,
        r.grade,
        r.score,
        r.max,
        r.percent,
        r.passed === null ? '' : r.passed ? 'Sí' : 'No',
        r.minutes,
        r.answered,
        r.questions,
        r.focusLost,
        r.awaySeconds,
        r.pasteBlocked,
        r.runs,
        r.submitted ? REASON[r.submitReason ?? 'manual'] : 'Sin entregar',
        ...sum.questions.map((q) => r.perQuestion[q.questionId]),
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return '﻿' + lines.join('\r\n');
}
