import { test } from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'node:util';
import vm from 'node:vm';
import { CERTIFICATIONS, getCertification, practiceExam, practiceKey } from '../src/core/exam/certs';
import { practiceOptions as fccPracticeOptions } from '../src/core/exam/certs/fccJavascript';
import {
  WEBDEV_EXERCISE_TOPIC,
  WEBDEV_PASS_PERCENT,
  WEBDEV_SIMULACRO,
  webdevJavascriptBank,
  webdevJavascriptPractica,
  webdevJavascriptSimulacro,
  webdevJavascriptTopicPractice,
  webdevJavascriptTopics,
  webdevPracticeOptions,
} from '../src/core/exam/certs/webdevJavascript';
import { WEBDEV_JAVASCRIPT_EXERCISES, WEBDEV_JAVASCRIPT_LESSONS, WebdevItem } from '../src/core/exam/certs/webdevJavascriptBank';
import { ExamClient } from '../src/core/exam/client';
import { parseExam, questionsPerStudent, serializeExam, validateExam } from '../src/core/exam/config';
import { gradeQuestion, runProgram } from '../src/core/exam/grading';
import { ExamHost } from '../src/core/exam/host';
import { buildPaper } from '../src/core/exam/paper';
import type { HostMsg } from '../src/core/exam/protocol';
import { createRoom } from '../src/core/exam/room';
import { MemoryClient, MemoryHost, MemoryNetwork } from '../src/core/exam/transport/memory';
import type { CodeQuestion, MultipleQuestion, OutputQuestion, SingleQuestion } from '../src/core/exam/types';
import { getProfile } from '../src/core/profiles';

const flexible = getProfile('flexible');
const items = WEBDEV_JAVASCRIPT_LESSONS.flatMap((l) => l.items.map((item, i) => ({ lesson: l.topic, n: i + 1, item })));
const where = (x: { lesson: string; n: number }) => `${x.lesson} #${x.n}`;

/** Ejecuta en Node: salida de consola, valor de la última expresión y error (si hubo). */
function node(code: string): { output: string; value: unknown; error: string | null } {
  const lines: string[] = [];
  const log = (...args: unknown[]) => lines.push(format(...args));
  try {
    const value = vm.runInNewContext(code, { console: { log, info: log, warn: log, error: log } });
    return { output: lines.join('\n'), value, error: null };
  } catch (e: any) {
    return { output: lines.join('\n'), value: undefined, error: e?.name ?? String(e) };
  }
}

/** Cómo se escribe un valor en las opciones: cadenas entre comillas, BigInt con n y arreglos con corchetes. */
function show(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'bigint') return `${v}n`;
  if (Array.isArray(v)) return `[${v.map(show).join(', ')}]`;
  return String(v);
}

const code = (s: string) => s.match(/^`([^`]+)`$/)?.[1];

test('banco de web.dev: las 26 lecciones del curso, cada una con su definición y preguntas', () => {
  assert.equal(WEBDEV_JAVASCRIPT_LESSONS.length, 26);
  assert.equal(new Set(WEBDEV_JAVASCRIPT_LESSONS.map((l) => l.topic)).size, 26, 'temas únicos');
  for (const l of WEBDEV_JAVASCRIPT_LESSONS) {
    assert.ok(l.summary.length > 120, `${l.topic}: definición`);
    assert.ok(l.items.length >= 7, `${l.topic}: al menos 7 preguntas`);
    assert.ok(l.items.some((i) => i.kind === 'output' || ('run' in i && i.run)), `${l.topic}: alguna pregunta con código que se ejecuta`);
  }
  const bank = webdevJavascriptBank();
  assert.equal(bank.length, items.length + WEBDEV_JAVASCRIPT_EXERCISES.length);
  assert.equal(new Set(bank.map((q) => q.id)).size, bank.length, 'ids únicos');
  for (const q of bank) {
    assert.ok(q.topic, q.id);
    if (q.type === 'single') assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
    if (q.type === 'multiple') assert.ok(q.options.filter((o) => o.correct).length >= 2 && q.options.some((o) => !o.correct), q.id);
    if (q.type === 'single' || q.type === 'multiple') {
      assert.equal(new Set(q.options.map((o) => o.text)).size, q.options.length, `${q.id}: opciones distintas`);
      assert.ok(q.options.every((o) => /^o[0-9a-z]+$/.test(o.id)), `${q.id}: el id no revela la respuesta`);
    }
  }
  assert.deepEqual(new Set(bank.map((q) => q.type)), new Set(['single', 'multiple', 'truefalse', 'output', 'code']));
  // sin preguntas repetidas
  assert.equal(new Set(items.map(({ item }) => ('q' in item ? item.q : '') + '|' + ('code' in item ? item.code : ''))).size, items.length);
});

test('preguntas de valor: la opción correcta es lo que da el código en Node', () => {
  let checked = 0;
  for (const x of items) {
    const it = x.item as WebdevItem;
    if (it.kind || !('run' in it) || !it.run) continue;
    const r = node(it.code!);
    assert.equal(r.error, null, `${where(x)}: ${r.error}`);
    const correct = code(it.a);
    assert.ok(correct !== undefined, `${where(x)}: la respuesta debe ser código`);
    assert.equal(show(r.value), correct, where(x));
    for (const d of it.d) assert.notEqual(code(d), show(r.value), `${where(x)}: un distractor coincide con la respuesta`);
    checked++;
  }
  assert.ok(checked >= 70, `se comprobaron ${checked}`);
});

test('preguntas de error: el código lanza exactamente el error de la respuesta', () => {
  let checked = 0;
  for (const x of items) {
    const it = x.item as WebdevItem;
    if (it.kind || !it.code) continue;
    const m = it.a.match(/^Se lanza un `(\w+Error)`/);
    if (!m) continue;
    assert.equal(node(it.code).error, m[1], where(x));
    checked++;
  }
  assert.ok(checked >= 5, `se comprobaron ${checked}`);
});

test('opción múltiple con expresiones: se marcan correctas justo las que cumplen la condición', () => {
  let checked = 0;
  for (const x of items) {
    const it = x.item as WebdevItem;
    if (it.kind !== 'multiple') continue;
    const cond = /dan `true`/.test(it.q) ? (v: unknown) => v === true : /son falsy/.test(it.q) ? (v: unknown) => !v : null;
    if (!cond) continue;
    for (const [opts, expected] of [
      [it.a, true],
      [it.d, false],
    ] as const)
      for (const o of opts) assert.equal(cond(node(`(${code(o)})`).value), expected, `${where(x)}: ${o}`);
    checked++;
  }
  assert.ok(checked >= 3, `se comprobaron ${checked}`);
});

test('preguntas «¿qué muestra?»: el intérprete de PSJavaScript da la misma salida que Node', () => {
  const outputs = webdevJavascriptBank().filter((q): q is OutputQuestion => q.type === 'output');
  assert.ok(outputs.length >= 35);
  for (const q of outputs) {
    const expected = node(q.code);
    assert.equal(expected.error, null, `${q.id}: ${expected.error}`);
    const app = runProgram(q.code, flexible, []);
    assert.equal(app.error, null, `${q.id}: ${app.error}`);
    assert.equal(app.output, expected.output, q.id);
    // la salida correcta obtiene todos los puntos
    assert.equal(gradeQuestion(q, expected.output, flexible).status, 'correct', q.id);
  }
});

test('ejercicios: la solución pasa todas las pruebas y el código inicial no', () => {
  const exercises = webdevJavascriptBank().filter((q): q is CodeQuestion => q.type === 'code');
  assert.equal(exercises.length, WEBDEV_JAVASCRIPT_EXERCISES.length);
  const topics = new Set(WEBDEV_JAVASCRIPT_LESSONS.map((l) => l.topic));
  for (const ex of WEBDEV_JAVASCRIPT_EXERCISES) assert.ok(topics.has(ex.topic), `${ex.id}: la lección «${ex.topic}» existe`);
  for (const q of exercises) {
    assert.equal(q.topic, WEBDEV_EXERCISE_TOPIC);
    assert.ok(q.tests.some((t) => !t.hidden) && q.tests.some((t) => t.hidden), `${q.id}: casos visibles y ocultos`);
    const ok = gradeQuestion(q, q.solution, flexible);
    assert.equal(ok.status, 'correct', `${q.id}: ${ok.feedback} ${JSON.stringify(ok.tests?.filter((t) => !t.passed))}`);
    assert.notEqual(gradeQuestion(q, q.starter, flexible).status, 'correct', `${q.id}: el código inicial no debe aprobar`);
    // la solución da lo mismo en Node
    for (const t of q.tests) assert.equal(JSON.stringify(node(`${q.solution}\n${t.call}`).value), t.expected, `${q.id}: ${t.call}`);
  }
});

test('simulacro de web.dev: 2 preguntas por lección y 3 ejercicios por alumno', () => {
  const sim = webdevJavascriptSimulacro();
  assert.deepEqual(validateExam(sim), [], 'sin errores ni avisos');
  const per = 26 * WEBDEV_SIMULACRO.perTopic + WEBDEV_SIMULACRO.exercises;
  assert.equal(questionsPerStudent(sim), per);
  assert.equal(sim.passPercent, WEBDEV_PASS_PERCENT);
  assert.equal(sim.durationMin, WEBDEV_SIMULACRO.durationMin);
  assert.equal(sim.showResults, 'detailed');
  const a = buildPaper(sim, 'alumno-a');
  const b = buildPaper(sim, 'alumno-b');
  assert.equal(a.paper.questions.length, per);
  assert.notDeepEqual(a.key.questionIds.slice().sort(), b.key.questionIds.slice().sort());
  const byId = new Map(sim.questions.map((q) => [q.id, q]));
  const count = new Map<string, number>();
  for (const id of a.key.questionIds) count.set(byId.get(id)!.topic!, (count.get(byId.get(id)!.topic!) ?? 0) + 1);
  assert.equal(count.size, 27);
  for (const [topic, n] of count) assert.equal(n, topic === WEBDEV_EXERCISE_TOPIC ? WEBDEV_SIMULACRO.exercises : WEBDEV_SIMULACRO.perTopic, topic);
  const json = JSON.stringify(a.paper);
  assert.ok(!json.includes('"correct"') && !json.includes('"solution"') && !json.includes('"answer"'));
  // exportar e importar conserva todo
  assert.deepEqual(parseExam(serializeExam(sim)).questions, sim.questions);
});

test('copia de práctica de web.dev: mismas preguntas, sin tiempo y con respuestas', () => {
  const sim = webdevJavascriptSimulacro();
  const pra = webdevJavascriptPractica();
  assert.notEqual(pra.id, sim.id);
  assert.deepEqual(pra.questions.map((q) => q.id), sim.questions.map((q) => q.id));
  assert.equal(pra.durationMin, 0);
  assert.equal(pra.showResults, 'review');
  assert.ok(!pra.blockPaste && pra.allowAssist && !pra.trackFocus);
});

test('prácticas de web.dev: completas y por lección', () => {
  const { full, topics } = webdevPracticeOptions();
  assert.equal(topics.length, 27);
  for (const o of [...full, ...topics]) {
    const e = practiceExam(practiceKey('webdev', o.key));
    assert.deepEqual(validateExam(e).filter((i) => i.severity === 'error'), [], o.key);
    assert.equal(e.showResults, 'review', o.key);
    assert.ok(questionsPerStudent(e) > 0, o.key);
  }
  const classes = webdevJavascriptTopicPractice('Clases');
  assert.ok(classes.questions.some((q) => q.type === 'code' && q.topic === 'Clases'), 'incluye el ejercicio de la lección');
  assert.ok(classes.description.startsWith(webdevJavascriptTopics().find((t) => t.topic === 'Clases')!.summary));
  assert.equal(questionsPerStudent(practiceExam(`webdev/tema:${WEBDEV_EXERCISE_TOPIC}`)), 5);
  assert.throws(() => practiceExam('webdev/tema:No existe'));
});

test('certificaciones: freeCodeCamp y web.dev, con las claves antiguas de freeCodeCamp', () => {
  assert.deepEqual(
    CERTIFICATIONS.map((c) => c.id),
    ['fcc', 'webdev'],
  );
  for (const c of CERTIFICATIONS) {
    const [sim, pra] = c.exams();
    assert.ok(sim.durationMin > 0 && pra.durationMin === 0, c.id);
    assert.ok(c.teacherSummary().length > 100 && c.studentSummary.length > 50, c.id);
  }
  assert.match(getCertification('webdev').exams()[0].title, /web\.dev/);
  // una práctica de freeCodeCamp guardada antes (sin prefijo) sigue funcionando
  for (const o of fccPracticeOptions().topics) assert.equal(practiceExam(o.key).title, practiceExam(practiceKey('fcc', o.key)).title, o.key);
  assert.match(practiceExam('simulacro').title, /freeCodeCamp/);
  assert.match(practiceExam('webdev/simulacro').title, /web\.dev/);
  assert.throws(() => getCertification('nada'));
});

test('sala con el simulacro de web.dev: todo correcto da 100 % y resultado por lección', async () => {
  const net = new MemoryNetwork();
  const exam = webdevJavascriptSimulacro();
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('WEBDV1', exam, { kind: 'memory' }), tickMs: 0 });
  await host.open();
  host.start();
  const log: HostMsg[] = [];
  const c = new ExamClient({ code: 'WEBDV1', transport: () => new MemoryClient(net), identity: { studentId: 'al1', token: 'tk-al1-xxxxxxxx', name: 'Ana', group: '' }, onMessage: (m) => log.push(m), onStatus: () => {}, pingMs: 0 });
  await c.connect();
  c.send({ t: 'begin' });
  const paper = (log.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>).paper;
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const answers: Record<string, string | string[] | boolean> = {};
  for (const pq of paper.questions) {
    const q = byId.get(pq.id)!;
    if (q.type === 'single') answers[q.id] = (q as SingleQuestion).options.find((o) => o.correct)!.id;
    if (q.type === 'multiple') answers[q.id] = (q as MultipleQuestion).options.filter((o) => o.correct).map((o) => o.id);
    if (q.type === 'truefalse') answers[q.id] = q.answer;
    if (q.type === 'output') answers[q.id] = runProgram(q.code, flexible, []).output;
    if (q.type === 'code') answers[q.id] = q.solution;
  }
  c.send({ t: 'submit', answers, reason: 'manual' });
  const res = (log.find((m) => m.t === 'result') as Extract<HostMsg, { t: 'result' }>).result;
  assert.equal(res.percent, 100);
  assert.equal(res.passed, true);
  assert.equal(res.topics?.length, 27);
  await host.close(0);
  c.dispose();
  host.dispose();
});
