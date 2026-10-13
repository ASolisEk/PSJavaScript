import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExam, parseExam, questionsPerStudent, serializeExam, validateExam } from '../src/core/exam/config';
import { fccJavascriptBank, fccJavascriptPractica, fccJavascriptSimulacro, fccJavascriptTopicPractice, fccJavascriptTopics, LAB_TOPIC, practiceExam, practiceOptions, SIMULACRO } from '../src/core/exam/certs/fccJavascript';
import { FCC_JAVASCRIPT_LABS } from '../src/core/exam/certs/fccJavascriptLabs';
import { FCC_JAVASCRIPT_QUIZZES } from '../src/core/exam/certs/fccJavascriptQuizzes';
import { ExamClient } from '../src/core/exam/client';
import { gradePaper, gradeQuestion, runTests, studentView } from '../src/core/exam/grading';
import { ExamHost } from '../src/core/exam/host';
import { buildPaper } from '../src/core/exam/paper';
import type { HostMsg } from '../src/core/exam/protocol';
import { parseInline, parseRichText, plainText } from '../src/core/exam/richText';
import { compactRoom, createRoom } from '../src/core/exam/room';
import { summarizeRoom } from '../src/core/exam/summary';
import { MemoryClient, MemoryHost, MemoryNetwork } from '../src/core/exam/transport/memory';
import { getProfile } from '../src/core/profiles';
import type { CodeQuestion, Question, SingleQuestion } from '../src/core/exam/types';

const flexible = getProfile('flexible');

test('banco de freeCodeCamp: cuestionarios completos y una sola respuesta correcta', () => {
  assert.equal(FCC_JAVASCRIPT_QUIZZES.length, 27);
  const bank = fccJavascriptBank();
  const singles = bank.filter((q): q is SingleQuestion => q.type === 'single');
  assert.equal(singles.length, FCC_JAVASCRIPT_QUIZZES.reduce((s, z) => s + z.questions.length, 0));
  assert.equal(bank.length - singles.length, FCC_JAVASCRIPT_LABS.length);
  for (const q of singles) {
    assert.equal(q.options.length, 4, q.id);
    assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
    assert.ok(q.topic, q.id);
  }
  assert.equal(new Set(bank.map((q) => q.id)).size, bank.length, 'ids únicos');
  // los ids de las opciones no revelan cuál es la correcta
  assert.ok(singles.every((q) => q.options.every((o) => /^o[0-9a-z]+$/.test(o.id))));
  // los temas del banco coinciden con los del currículo
  assert.deepEqual(fccJavascriptTopics().map((x) => x.topic), FCC_JAVASCRIPT_QUIZZES.map((z) => z.topic));
});

test('laboratorios: la solución pasa todas las pruebas y el código inicial no', () => {
  const lab = fccJavascriptBank().filter((q): q is CodeQuestion => q.type === 'code');
  assert.equal(lab.length, FCC_JAVASCRIPT_LABS.length);
  for (const q of lab) {
    assert.ok(q.tests.every((t) => t.call), q.id);
    assert.ok(q.tests.some((t) => !t.hidden) && q.tests.some((t) => t.hidden), `${q.id}: casos visibles y ocultos`);
    const ok = gradeQuestion(q, q.solution, flexible);
    assert.equal(ok.status, 'correct', `${q.id}: ${ok.feedback} ${JSON.stringify(ok.tests?.filter((t) => !t.passed))}`);
    assert.notEqual(gradeQuestion(q, q.starter, flexible).status, 'correct', `${q.id}: el código inicial no debe aprobar`);
  }
});

test('pruebas con llamada: comparan el valor devuelto aunque el alumno imprima otras cosas', () => {
  const tests = [
    { id: 'a', name: 'a', inputs: [], expected: '"olleh"', call: 'reverseString("hello")' },
    { id: 'b', name: 'b', inputs: [], expected: '[1,2]', call: 'f()' },
  ];
  const code = 'function reverseString(s) { console.log("depurando", s); return s.split("").reverse().join(""); }\nfunction f() { return [1, 2]; }\nconsole.log("hola");';
  assert.deepEqual(runTests(code, tests, 'flexible', flexible).map((r) => r.passed), [true, true]);
  // distingue mayúsculas y comillas (es una comparación exacta del JSON)
  const wrong = runTests('function reverseString(s) { return "OLLEH"; }', tests.slice(0, 1), 'flexible', flexible)[0];
  assert.equal(wrong.passed, false);
  assert.equal(wrong.actual, '"OLLEH"');
  const err = runTests('function reverseString(s) { return s.nope(); }', tests.slice(0, 1), 'flexible', flexible)[0];
  assert.ok(!err.passed && err.error);
});

test('simulacro: preguntas por tema, sin errores y con la misma estructura para cada alumno', () => {
  const sim = fccJavascriptSimulacro();
  const issues = validateExam(sim);
  assert.deepEqual(issues.filter((i) => i.severity === 'error'), []);
  const per = FCC_JAVASCRIPT_QUIZZES.length * SIMULACRO.perTopic + SIMULACRO.labs;
  assert.equal(questionsPerStudent(sim), per);
  const a = buildPaper(sim, 'alumno-a');
  const b = buildPaper(sim, 'alumno-b');
  assert.equal(a.paper.questions.length, per);
  assert.notDeepEqual(a.key.questionIds.slice().sort(), b.key.questionIds.slice().sort(), 'cada alumno recibe preguntas distintas');
  const count = (ids: string[]) => {
    const byId = new Map(sim.questions.map((q) => [q.id, q]));
    const m = new Map<string, number>();
    for (const id of ids) m.set(byId.get(id)!.topic!, (m.get(byId.get(id)!.topic!) ?? 0) + 1);
    return m;
  };
  for (const [topic, n] of count(a.key.questionIds)) assert.equal(n, topic === LAB_TOPIC ? SIMULACRO.labs : SIMULACRO.perTopic, topic);
  assert.deepEqual(buildPaper(sim, 'alumno-a').key, a.key, 'misma semilla, mismo examen');
  // el examen del alumno no trae respuestas ni soluciones
  const json = JSON.stringify(a.paper);
  assert.ok(!json.includes('"correct"') && !json.includes('"solution"'));
  assert.ok(a.paper.questions.every((q) => q.topic));
});

test('copia de práctica: mismas preguntas, sin tiempo y mostrando las respuestas', () => {
  const sim = fccJavascriptSimulacro();
  const pra = fccJavascriptPractica();
  assert.notEqual(pra.id, sim.id);
  assert.deepEqual(pra.questions.map((q) => q.id), sim.questions.map((q) => q.id));
  assert.equal(pra.durationMin, 0);
  assert.equal(pra.showResults, 'review');
  assert.equal(pra.passPercent, sim.passPercent);
  assert.ok(!pra.blockPaste && pra.allowAssist);
});

test('prácticas individuales: todas generan exámenes válidos', () => {
  const { full, topics } = practiceOptions();
  for (const o of [...full, ...topics]) {
    const e = practiceExam(o.key);
    assert.deepEqual(validateExam(e).filter((i) => i.severity === 'error'), [], o.key);
    assert.equal(e.showResults, 'review', o.key);
    assert.ok(questionsPerStudent(e) > 0, o.key);
  }
  const strings = fccJavascriptTopicPractice('Cadenas de texto');
  assert.equal(questionsPerStudent(strings), 20);
  const functions = fccJavascriptTopicPractice('Funciones');
  assert.ok(functions.questions.some((q) => q.type === 'code' && q.topic === 'Funciones'));
  assert.equal(questionsPerStudent(practiceExam(`tema:${LAB_TOPIC}`)), 5);
  assert.throws(() => practiceExam('tema:No existe'));
});

test('configuración: temas, llamadas y selección por tema sobreviven exportar e importar', () => {
  const sim = fccJavascriptSimulacro();
  const back = parseExam(serializeExam(sim));
  assert.deepEqual(back.topicPicks, sim.topicPicks);
  assert.deepEqual(back.questions, sim.questions);
  assert.equal(back.showResults, 'detailed');
  assert.equal(parseExam(serializeExam({ ...sim, showResults: 'review' })).showResults, 'review');
  // exámenes anteriores (sin temas) siguen funcionando igual
  const old = parseExam(JSON.stringify({ format: 'psjavascript-exam', questions: [{ type: 'truefalse', prompt: 'x', answer: true }] }));
  assert.deepEqual(old.topicPicks, {});
  assert.equal(questionsPerStudent(old), 1);
});

test('validación de la selección por tema', () => {
  const q = (topic?: string): Question => ({ id: `q${Math.random()}`, type: 'truefalse', prompt: 'p', points: 1, answer: true, ...(topic ? { topic } : {}) });
  const e = createExam({ questions: [q('A'), q('A'), q('B'), q()], topicPicks: { A: 3, B: 0 } });
  assert.equal(questionsPerStudent(e), 2);
  const msgs = validateExam(e).map((i) => i.message).join('\n');
  assert.match(msgs, /Tema «A»: pediste 3/);
  assert.match(msgs, /«B» no aparecerá/);
  assert.match(msgs, /1 pregunta\(s\) sin tema/);
  const none = createExam({ questions: [q('A')], topicPicks: { Z: 2 } });
  assert.ok(validateExam(none).some((i) => i.severity === 'error'));
});

test('resultado de repaso: respuesta correcta y calificación por tema', () => {
  const exam = fccJavascriptTopicPractice('Arreglos');
  const { paper, key } = buildPaper(exam, 's');
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const answers: Record<string, string> = {};
  paper.questions.forEach((pq, i) => {
    const q = byId.get(pq.id)!;
    if (q.type === 'single') answers[q.id] = (i % 2 ? q.options.find((o) => o.correct) : q.options.find((o) => !o.correct))!.id;
  });
  const r = gradePaper(exam, key, answers);
  const topicOf = (id: string) => byId.get(id)?.topic;
  const review = studentView(r, 'review', topicOf);
  const wrong = review.questions!.find((x) => x.status === 'wrong')!;
  assert.match(wrong.feedback, /La respuesta correcta es:/);
  assert.equal(review.topics?.length, 1);
  assert.equal(review.topics![0].topic, 'Arreglos');
  assert.equal(review.topics![0].total, paper.questions.length);
  // con «detallado» no se revela la respuesta correcta
  const detailed = studentView(r, 'detailed', topicOf);
  assert.ok(detailed.questions!.every((x) => !/respuesta correcta/.test(x.feedback)));
  assert.equal(studentView(r, 'score', topicOf).topics, undefined);
});

test('sala con el simulacro: entrega, resultado por tema e historial compacto', async () => {
  const net = new MemoryNetwork();
  const exam = fccJavascriptSimulacro();
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('CERT22', exam, { kind: 'memory' }), tickMs: 0 });
  await host.open();
  host.start();
  const log: HostMsg[] = [];
  const c = new ExamClient({ code: 'CERT22', transport: () => new MemoryClient(net), identity: { studentId: 'al1', token: 'tk-al1-xxxxxxxx', name: 'Ana', group: '' }, onMessage: (m) => log.push(m), onStatus: () => {}, pingMs: 0 });
  await c.connect();
  c.send({ t: 'begin' });
  const paper = (log.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>).paper;
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const answers: Record<string, string> = {};
  for (const pq of paper.questions) {
    const q = byId.get(pq.id)!;
    if (q.type === 'single') answers[q.id] = q.options.find((o) => o.correct)!.id;
    if (q.type === 'code') answers[q.id] = q.solution;
  }
  c.send({ t: 'submit', answers, reason: 'manual' });
  const res = (log.find((m) => m.t === 'result') as Extract<HostMsg, { t: 'result' }>).result;
  assert.equal(res.percent, 100);
  assert.equal(res.passed, true);
  assert.equal(res.topics?.length, FCC_JAVASCRIPT_QUIZZES.length + 1);
  await host.close(0);

  const sum = summarizeRoom(host.state);
  assert.equal(sum.questions.length, paper.questions.length, 'el análisis solo incluye las preguntas que se usaron');
  assert.equal(sum.topics.length, FCC_JAVASCRIPT_QUIZZES.length + 1);
  assert.ok(sum.topics.every((t) => t.avgPercent === 100));
  const compact = compactRoom(host.state);
  assert.equal(compact.exam.questions.length, paper.questions.length);
  assert.ok(JSON.stringify(compact).length < JSON.stringify(host.state).length / 3);
  c.dispose();
  host.dispose();
});

test('texto con formato: código en línea, bloques y negritas', () => {
  assert.deepEqual(parseInline('Use `let` or **const**'), [
    { kind: 'text', text: 'Use ' },
    { kind: 'code', text: 'let' },
    { kind: 'text', text: ' or ' },
    { kind: 'bold', text: 'const' },
  ]);
  assert.deepEqual(parseInline('`` `Hello, ${user}!` ``'), [{ kind: 'code', text: '`Hello, ${user}!`' }]);
  assert.deepEqual(parseInline('Press <kbd>Enter</kbd>'), [{ kind: 'text', text: 'Press ' }, { kind: 'code', text: 'Enter' }]);
  const blocks = parseRichText('What does this print?\n\n```js\nconsole.log(1);\n```');
  assert.deepEqual(blocks, [
    { kind: 'text', parts: [{ kind: 'text', text: 'What does this print?' }] },
    { kind: 'code', code: 'console.log(1);' },
  ]);
  assert.equal(plainText('Use `x`\n\n```js\nlet a;\n```'), 'Use x\nlet a;');
  assert.deepEqual(parseRichText('texto normal'), [{ kind: 'text', parts: [{ kind: 'text', text: 'texto normal' }] }]);
});
