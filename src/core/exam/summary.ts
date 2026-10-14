/** Concentrado de resultados de una sala: estadísticas, análisis por pregunta y CSV. */
import { answeredCount, RoomState, StudentRecord } from './room';
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
  rows: SummaryRow[];
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
    return { questionId: q.id, index, type: q.type, prompt: q.prompt, points: q.points, attempts, answered, correct, avgPercent: attempts ? round1((sum / attempts) * 100) : 0, ...(q.topic ? { topic: q.topic } : {}) };
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
    rows,
  };
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
