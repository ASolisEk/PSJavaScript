import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExam, sampleExam } from '../src/core/exam/config';
import { gradePaper } from '../src/core/exam/grading';
import { buildPaper } from '../src/core/exam/paper';
import { answerRows, answersCsv, answerText, correctText, roomReportHtml } from '../src/core/exam/report';
import { createRoom, RoomState, StudentRecord } from '../src/core/exam/room';
import type { Answers, ExamConfig, Question } from '../src/core/exam/types';

/** Las 9 preguntas del ejemplo: una de cada tipo. */
const exam = (): ExamConfig => {
  const e = sampleExam();
  return createExam({ ...e, topicPicks: {}, questions: e.questions.slice(0, 9) });
};

function student(room: RoomState, name: string, answers: (q: Question, key: ReturnType<typeof buildPaper>['key']) => Answers[string] | undefined, submit = true): StudentRecord {
  const { key } = buildPaper(room.exam, `semilla-${name}`);
  const all: Answers = {};
  for (const q of room.exam.questions) {
    const a = answers(q, key);
    if (a !== undefined) all[q.id] = a;
  }
  const s = {
    id: `id-${name}`,
    token: '',
    name,
    group: '3A',
    peer: null,
    connected: false,
    lastSeen: 0,
    joinedAt: 1_000,
    startedAt: 2_000,
    deadline: null,
    submittedAt: submit ? 62_000 : null,
    submitReason: submit ? 'manual' : null,
    key,
    answers: all,
    current: 0,
    activity: 'reading',
    activitySince: 0,
    focused: true,
    focusLost: 1,
    awayMs: 4_000,
    pasteBlocked: 0,
    runs: 3,
    tests: 2,
    events: [{ at: 2_000, kind: 'start', text: 'Comenzó el examen' }],
    result: submit ? gradePaper(room.exam, key, all) : null,
    overrides: {},
  } satisfies StudentRecord;
  room.students[s.id] = s;
  return s;
}

/** Respuesta correcta de cada tipo (para un alumno perfecto). */
function perfect(q: Question, key: ReturnType<typeof buildPaper>['key']): Answers[string] {
  switch (q.type) {
    case 'single':
      return q.options.find((o) => o.correct)!.id;
    case 'multiple':
      return q.options.filter((o) => o.correct).map((o) => o.id);
    case 'truefalse':
      return q.answer;
    case 'short':
      return q.answers[0];
    case 'numeric':
      return String(q.answer);
    case 'output':
      return 'x';
    case 'code':
      return q.solution;
    case 'order':
      return key.lineIds[q.id];
  }
}

test('reporte: cruza cada pregunta con la respuesta del alumno y la correcta', () => {
  const room = createRoom('ABC234', exam(), { kind: 'memory' } as RoomState['transport']);
  const ana = student(room, 'Ana', perfect);
  student(room, 'Beto', () => undefined);
  const rows = answerRows(room);
  assert.equal(rows.length, 18);
  // ordenados por alumno y en el orden en que vio las preguntas
  assert.deepEqual(rows.slice(0, 9).map((r) => r.position), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(rows[0].name, 'Ana');
  assert.equal(rows[9].name, 'Beto');
  assert.ok(rows.slice(9).every((r) => r.status === 'Sin responder' && r.answer === ''));

  const single = room.exam.questions.find((q) => q.type === 'single')!;
  const row = rows.find((r) => r.name === 'Ana' && r.question.id === single.id)!;
  assert.equal(row.status, 'Correcta');
  assert.equal(row.answer, row.correct);

  // ordenar: se reconstruyen las líneas en el orden del alumno
  const order = room.exam.questions.find((q) => q.type === 'order')!;
  assert.equal(answerText(order, ana.answers[order.id], ana.key), correctText(order));

  // «¿Qué imprime?»: la respuesta correcta es la salida real del programa
  const output = room.exam.questions.find((q) => q.type === 'output')!;
  const outRow = rows.find((r) => r.name === 'Ana' && r.question.id === output.id)!;
  assert.equal(outRow.status, 'Incorrecta');
  assert.ok(outRow.correct.length > 0 && outRow.correct !== 'x');

  // programación: muestra los casos aprobados
  const code = rows.find((r) => r.name === 'Ana' && r.question.type === 'code')!;
  assert.equal(code.status, 'Correcta');
  assert.ok(code.result!.tests!.every((x) => x.passed));
});

test('reporte: CSV de respuestas y HTML imprimible', () => {
  const room = createRoom('ABC234', exam(), { kind: 'memory' } as RoomState['transport']);
  student(room, 'Ana', perfect);
  student(room, 'Beto <script>', () => undefined, false);
  const csv = answersCsv(room);
  const lines = csv.slice(1).split('\r\n');
  assert.ok(lines[0].startsWith('Alumno,Grupo,Núm.,Tema,Tipo,Pregunta,Respuesta del alumno,Respuesta correcta,Puntos'));
  // encabezado + 9 preguntas de Ana + 9 de Beto (las celdas con saltos de línea van entre comillas)
  assert.equal((csv.match(/^(Ana|"?Beto)/gm) ?? []).length, 18);
  assert.ok(csv.includes('Sin responder'));

  const html = roomReportHtml(room);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('Respuesta correcta'));
  assert.ok(html.includes('Solución de referencia'));
  // los textos del alumno se escapan
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('Beto &lt;script&gt;'));
  // reporte de un solo alumno
  const one = roomReportHtml(room, ['id-Ana']);
  assert.ok(one.includes('Ana') && !one.includes('Beto'));
});
