import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExam, createQuestion, option, parseExam, serializeExam } from '../src/core/exam/config';
import { gradePaper, gradeQuestion, regradeAll } from '../src/core/exam/grading';
import { buildPaper } from '../src/core/exam/paper';
import { ExamHost } from '../src/core/exam/host';
import { ExamClient } from '../src/core/exam/client';
import type { HostMsg } from '../src/core/exam/protocol';
import { createRoom, missingFromRoster, pendingAsks } from '../src/core/exam/room';
import { compareRooms, studentHistory, summarizeRoom } from '../src/core/exam/summary';
import { printableExamHtml } from '../src/core/exam/print';
import { MemoryClient, MemoryHost, MemoryNetwork } from '../src/core/exam/transport/memory';
import { getProfile } from '../src/core/profiles';
import type { ExamConfig, Question } from '../src/core/exam/types';

const std = getProfile('estandar');
const flush = () => new Promise((r) => setTimeout(r, 0));

function single(correct: boolean): Question {
  const q = createQuestion('single') as any;
  q.prompt = '¿2 + 2?';
  q.options = [option('4', correct), option('5', !correct)];
  return q;
}

function exam(p: Partial<ExamConfig> = {}): ExamConfig {
  const essay = { ...(createQuestion('essay') as any), prompt: 'Explica const.', guide: 'No se reasigna' };
  return createExam({ title: 'Mejoras', shuffleQuestions: false, shuffleOptions: false, durationMin: 0, questions: [single(true), essay], ...p });
}

function student(net: MemoryNetwork, code: string, name: string, log: HostMsg[]) {
  const c = new ExamClient({ code, transport: () => new MemoryClient(net), identity: { studentId: `id-${name}`, token: `tok-${name}`, name, group: '' }, onMessage: (m) => log.push(m), onStatus: () => {}, pingMs: 0, retry: false });
  return c;
}

test('respuesta abierta: queda por calificar, se califica a mano y se importa/exporta', () => {
  const e = exam();
  const essay = e.questions[1];
  const r = gradeQuestion(essay, 'Porque no se puede reasignar', std);
  assert.equal(r.status, 'pending');
  assert.equal(r.score, 0);
  assert.equal(gradeQuestion(essay, '', std).status, 'blank');
  const { key, paper } = buildPaper(e, 's1');
  assert.equal(paper.questions[1].maxChars, 3000);
  assert.ok(!JSON.stringify(paper).includes('No se reasigna'), 'la guía no llega al alumno');
  const g = gradePaper(e, key, { [essay.id]: 'texto' }, { [essay.id]: 4 });
  const er = g.questions.find((x) => x.questionId === essay.id)!;
  assert.equal(er.score, 4);
  assert.equal(er.status, 'partial');
  const back = parseExam(serializeExam(e));
  assert.equal(back.questions[1].type, 'essay');
  assert.equal((back.questions[1] as any).guide, 'No se reasigna');
});

test('penalización por error, anulación y todo o nada', () => {
  const e = exam({ wrongPenalty: 0.5, questions: [single(true), single(true)] });
  const [q1, q2] = e.questions as any[];
  const { key } = buildPaper(e, 's');
  const wrong = q1.options.find((o: any) => !o.correct).id;
  const right = q2.options.find((o: any) => o.correct).id;
  const g = gradePaper(e, key, { [q1.id]: wrong, [q2.id]: right });
  assert.equal(g.questions[0].score, -0.5);
  assert.equal(g.score, 0.5);
  // sin responder no resta
  assert.equal(gradePaper(e, key, { [q2.id]: right }).score, 1);
  // el total nunca baja de 0
  assert.equal(gradePaper(e, key, { [q1.id]: wrong }).score, 0);
  // anular: no cuenta para nadie
  const voided = { ...e, questions: [{ ...q1, voided: true }, q2] };
  const gv = gradePaper(voided, key, { [q1.id]: wrong, [q2.id]: right });
  assert.equal(gv.max, 1);
  assert.equal(gv.percent, 100);

  const code = { ...(createQuestion('code') as any), prompt: 'Imprime 1 y 2', tests: [{ id: 'a', name: 'a', inputs: [], expected: '1\n2', hidden: false }], rules: [{ id: 'r', kind: 'contains', pattern: 'for', message: '' }] };
  assert.equal(gradeQuestion(code, 'console.log(1);\nconsole.log(2);', std).score, 2.5, 'proporcional');
  assert.equal(gradeQuestion({ ...code, allOrNothing: true }, 'console.log(1);\nconsole.log(2);', std).score, 0, 'todo o nada');
});

test('recalificar a todos tras corregir la clave de una pregunta', () => {
  const e = exam({ questions: [single(false)] });
  const q = e.questions[0] as any;
  const { key } = buildPaper(e, 's');
  const chosen = q.options.find((o: any) => o.text === '4').id;
  const students = { a: { key, answers: { [q.id]: chosen }, overrides: {}, submittedAt: 1, result: gradePaper(e, key, { [q.id]: chosen }) } };
  assert.equal(students.a.result.score, 0);
  const fixed = { ...e, questions: [{ ...q, options: q.options.map((o: any) => ({ ...o, correct: o.text === '4' })) }] };
  assert.equal(regradeAll(fixed, students, q.id).a.result!.score, 1);
  assert.equal(regradeAll(fixed, students).a.result!.score, 1);
});

test('sala: lista del grupo, preguntas al maestro, resultados retenidos y explicación', async () => {
  const net = new MemoryNetwork();
  const e = exam({ roster: ['Ana López', 'Beto Ruiz'], holdResults: true, showResults: 'detailed' });
  e.questions[0].explanation = 'Dos más dos son cuatro.';
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('MEJ234', e, { kind: 'memory' }), tickMs: 0 });
  await host.open();

  // un nombre que no está en la lista se rechaza con la lista para elegir
  const lx: HostMsg[] = [];
  await student(net, 'MEJ234', 'Desconocido', lx).connect().catch(() => {});
  await flush();
  const rej = lx.find((m) => m.t === 'rejected') as Extract<HostMsg, { t: 'rejected' }>;
  assert.deepEqual(rej.roster, ['Ana López', 'Beto Ruiz']);

  // con acentos y mayúsculas distintas sí entra, con el nombre de la lista
  const la: HostMsg[] = [];
  const a = student(net, 'MEJ234', 'ana lopez', la);
  await a.connect();
  await flush();
  assert.equal(host.state.students['id-ana lopez'].name, 'Ana López');
  assert.deepEqual(missingFromRoster(host.state), ['Beto Ruiz']);

  host.start();
  a.send({ t: 'begin' });
  a.send({ t: 'ask', text: '¿Se vale usar decimales?', question: 0 });
  const asks = pendingAsks(host.state);
  assert.equal(asks.length, 1);
  host.reply('id-ana lopez', asks[0].ask.id, 'Sí.');
  assert.ok(la.some((m) => m.t === 'reply' && m.text === 'Sí.'));
  assert.equal(pendingAsks(host.state).length, 0);

  const q = e.questions[0] as any;
  a.send({ t: 'submit', answers: { [q.id]: q.options.find((o: any) => o.correct).id }, reason: 'manual' });
  const held = la.filter((m) => m.t === 'result').pop() as Extract<HostMsg, { t: 'result' }>;
  assert.equal(held.result.held, true);
  assert.equal(held.result.grade, undefined);

  host.publishResults();
  const pub = la.filter((m) => m.t === 'result').pop() as Extract<HostMsg, { t: 'result' }>;
  assert.ok(!pub.result.held);
  assert.equal(pub.result.questions?.[0].explanation, 'Dos más dos son cuatro.');
  assert.equal(pub.result.questions?.[1].status, 'blank');

  // corregir (anular) una pregunta en vivo vuelve a calificar y avisa al alumno
  host.updateQuestion({ ...e.questions[1], voided: true });
  const after = host.state.students['id-ana lopez'].result!;
  assert.equal(after.max, 1);
  assert.equal(after.percent, 100);
  a.dispose();
  host.dispose();
});

test('sala programada: inicia y cierra sola a su hora', async () => {
  const net = new MemoryNetwork();
  let clock = 1_000_000;
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('PRG234', exam(), { kind: 'memory' }, clock), now: () => clock, tickMs: 0 });
  await host.open();
  host.setSchedule(clock + 60_000, clock + 120_000);
  host.tick();
  assert.equal(host.state.status, 'lobby');
  clock += 61_000;
  host.tick();
  assert.equal(host.state.status, 'running');
  clock += 60_000;
  host.tick();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(host.state.status, 'closed');
  host.dispose();
});

test('análisis: discriminación, grupos, comparación de salas e historial del alumno', () => {
  const e = exam({ questions: [single(true), single(true)] });
  const [q1, q2] = e.questions as any[];
  q1.points = 2;
  const room = createRoom('ANA234', e, { kind: 'memory' });
  const right = (q: any) => q.options.find((o: any) => o.correct).id;
  const wrong = (q: any) => q.options.find((o: any) => !o.correct).id;
  const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  names.forEach((n, i) => {
    const { key } = buildPaper(e, n);
    // los mejores aciertan q1; q2 la aciertan justo los peores (discrimina al revés)
    const answers = { [q1.id]: i < 4 ? right(q1) : wrong(q1), [q2.id]: i < 4 ? wrong(q2) : right(q2) };
    room.students[n] = { id: n, token: n, name: n, group: i % 2 ? '3B' : '3A', peer: null, connected: false, lastSeen: 0, joinedAt: 0, startedAt: 1, deadline: null, submittedAt: 2, submitReason: 'manual', key, answers, current: 0, activity: 'reviewing', activitySince: 0, focused: true, focusLost: 0, awayMs: 0, pasteBlocked: 0, runs: 0, tests: 0, events: [], result: gradePaper(e, key, answers), overrides: {} };
  });
  const sum = summarizeRoom(room);
  const d1 = sum.questions.find((x) => x.questionId === q1.id)!.discrimination!;
  const d2 = sum.questions.find((x) => x.questionId === q2.id)!.discrimination!;
  assert.ok(d1 > 0.5, `q1 discrimina bien (${d1})`);
  assert.ok(d2 < 0, `q2 discrimina al revés (${d2})`);
  assert.deepEqual(sum.groups.map((g) => g.group), ['3A', '3B']);

  const other = { ...createRoom('OTR234', e, { kind: 'memory' }), openedAt: room.openedAt + 1000 };
  const cmp = compareRooms([room, other], e.id);
  assert.equal(cmp.length, 2);
  assert.equal(cmp[0].code, 'OTR234');
  assert.equal(studentHistory([room, other], 'a').length, 1);
});

test('examen impreso: versiones con hoja de respuestas y clave', () => {
  const e = exam({ shuffleOptions: true, shuffleQuestions: true });
  const html = printableExamHtml(e, { versions: 2, withKey: true });
  assert.ok(html.includes('Versión A') && html.includes('Versión B'));
  assert.ok(html.includes('Hoja de respuestas'));
  assert.ok(html.includes('Clave de respuestas'));
  assert.ok(!printableExamHtml(e, { versions: 1, withKey: false }).includes('Clave de respuestas'));
});

test('modo secuencial: el avance no retrocede aunque el alumno reentre desde cero', async () => {
  const net = new MemoryNetwork();
  const e = exam({ sequential: true, questions: [single(true), single(true), single(true)] });
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('SEC234', e, { kind: 'memory' }), tickMs: 0 });
  await host.open();
  const log: HostMsg[] = [];
  const a = student(net, 'SEC234', 'Ana', log);
  await a.connect();
  await flush();
  host.start();
  a.send({ t: 'begin' });
  a.send({ t: 'progress', current: 2, activity: 'reading', focused: true });
  assert.equal(host.state.students['id-Ana'].current, 2);
  // intenta volver a la primera: el maestro conserva dónde iba
  a.send({ t: 'progress', current: 0, activity: 'reading', focused: true });
  assert.equal(host.state.students['id-Ana'].current, 2);
  // al reconectarse recibe su posición
  a.send({ t: 'begin' });
  const paper = log.filter((m) => m.t === 'paper').pop() as Extract<HostMsg, { t: 'paper' }>;
  assert.equal(paper.current, 2);
  assert.equal(paper.paper.settings.sequential, true);
  a.dispose();
  host.dispose();
});

test('validación: avisos de configuraciones que se contradicen', async () => {
  const { validateExam } = await import('../src/core/exam/config');
  const msgs = (e: ExamConfig) => validateExam(e).map((i) => i.message).join('\n');
  assert.match(msgs(exam({ holdResults: true, showResults: 'none' })), /no habrá nada que publicar/);
  assert.match(msgs(exam({ showResults: 'score' })), /respuesta\(s\) abiertas que calificas a mano/);
  assert.doesNotMatch(msgs(exam({ showResults: 'score', holdResults: true })), /calificas a mano/);
  const essayOnly = exam({ wrongPenalty: 0.5, holdResults: true });
  essayOnly.questions = [essayOnly.questions[1]];
  assert.match(msgs(essayOnly), /penalización por error no se aplica/);
  const heavy = exam({ holdResults: true });
  heavy.questions = heavy.questions.map((q) => ({ ...q, image: 'data:image/png;base64,' + 'A'.repeat(399_000) }));
  heavy.questions.push(...[1, 2, 3, 4].map((k) => ({ ...single(true), id: `img${k}`, image: 'data:image/png;base64,' + 'A'.repeat(399_000) })));
  assert.match(msgs(heavy), /imágenes del examen pesan/);
});

test('reporte TXT: marca la pregunta anulada e incluye la explicación', async () => {
  const { answersTxt } = await import('../src/core/exam/report');
  const e = exam({ questions: [{ ...single(true), explanation: 'Porque **sí**.', voided: true }] });
  const q = e.questions[0] as any;
  const room = createRoom('TXT234', e, { kind: 'memory' });
  const { key } = buildPaper(e, 's');
  const answers = { [q.id]: q.options[0].id };
  room.students.a = { id: 'a', token: 'a', name: 'Ana', group: '', peer: null, connected: false, lastSeen: 0, joinedAt: 0, startedAt: 1, deadline: null, submittedAt: 2, submitReason: 'manual', key, answers, current: 0, activity: 'reviewing', activitySince: 0, focused: true, focusLost: 0, awayMs: 0, pasteBlocked: 0, runs: 0, tests: 0, events: [], result: gradePaper(e, key, answers), overrides: {} };
  const txt = answersTxt(room);
  assert.match(txt, /ANULADA/);
  assert.match(txt, /Explicación: Porque sí\./);
});
