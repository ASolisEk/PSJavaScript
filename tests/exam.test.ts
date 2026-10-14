import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { cloneExam, createExam, createQuestion, parseExam, sampleExam, serializeExam, validateExam } from '../src/core/exam/config';
import { expectedFromSolution, gradePaper, gradeQuestion, outputMatches, ruleSatisfied, runProgram, studentView } from '../src/core/exam/grading';
import { buildPaper, isAnswered } from '../src/core/exam/paper';
import { ExamHost } from '../src/core/exam/host';
import { ExamClient } from '../src/core/exam/client';
import type { HostMsg } from '../src/core/exam/protocol';
import { normalizeRoomCode, roomCode, seededRandom, isValidRoomCode } from '../src/core/exam/random';
import { compactRoom, createRoom, RoomState } from '../src/core/exam/room';
import { summarizeRoom, summaryCsv } from '../src/core/exam/summary';
import { MemoryClient, MemoryHost, MemoryNetwork } from '../src/core/exam/transport/memory';
import { normalizeRelayUrl, RelayClient, RelayHost } from '../src/core/exam/transport/relay';
import { getProfile } from '../src/core/profiles';
import type { CodeQuestion, ExamConfig, OrderQuestion, Question } from '../src/core/exam/types';

const std = getProfile('estandar');

test('comparación de salidas', () => {
  assert.ok(outputMatches('Hola  Mundo\n\n', 'hola mundo', 'flexible'));
  assert.ok(outputMatches('Área: 3', 'area: 3', 'flexible'));
  assert.ok(!outputMatches('Hola Mundo', 'hola mundo', 'exact'));
  assert.ok(outputMatches('Hola Mundo   \n', 'Hola Mundo', 'exact'));
  assert.ok(outputMatches('El resultado es 12 y luego 3.5', '12\n3.5', 'numbers'));
  assert.ok(!outputMatches('12 y 4', '12\n3.5', 'numbers'));
  assert.ok(outputMatches('Bienvenido\nTotal: 10\nAdiós', 'total: 10', 'contains'));
});

test('requisitos de código ignoran comentarios y textos', () => {
  assert.ok(ruleSatisfied('for (let i = 0; i < 3; i++) {}', { kind: 'contains', pattern: 'for' }));
  assert.ok(!ruleSatisfied('// usa for aquí\nlet x = "for";', { kind: 'contains', pattern: 'for' }));
  assert.ok(ruleSatisfied('let a = [1].map(x => x);', { kind: 'notContains', pattern: 'while' }));
  assert.ok(!ruleSatisfied('const s = a.reduce((p, c) => p + c, 0);', { kind: 'notContains', pattern: 'reduce' }));
  assert.ok(ruleSatisfied('x.forEach(f)', { kind: 'notContains', pattern: 'for' }));
});

test('ejecutar programas para calificar', () => {
  const r = runProgram('const n = Number(prompt("n")); console.log(n * 2);', std, ['21']);
  assert.equal(r.output, '42');
  assert.equal(r.error, null);
  const more = runProgram('prompt("a"); prompt("b");', std, ['1']);
  assert.ok(more.needsInput);
  const loop = runProgram('while (true) {}', std, [], 5000);
  assert.ok(loop.tooLong);
  const err = runProgram('console.log("antes"); noExiste();', std, []);
  assert.equal(err.output, 'antes');
  assert.ok(err.error);
});

test('calificación por tipo de pregunta', () => {
  const ex = sampleExam();
  const [single, multiple, tf, short, numeric, output, order, code] = ex.questions as any[];
  const right = single.options.find((o: any) => o.correct).id;
  const wrong = single.options.find((o: any) => !o.correct).id;
  assert.equal(gradeQuestion(single, right, std).status, 'correct');
  assert.equal(gradeQuestion(single, wrong, std).score, 0);
  assert.equal(gradeQuestion(single, null, std).status, 'blank');

  const corr = multiple.options.filter((o: any) => o.correct).map((o: any) => o.id);
  assert.equal(gradeQuestion(multiple, corr, std).score, 2);
  const partial = gradeQuestion(multiple, corr.slice(0, 2), std);
  assert.equal(partial.status, 'partial');
  assert.ok(partial.score > 0 && partial.score < 2);

  assert.equal(gradeQuestion(tf, true, std).status, 'correct');
  assert.equal(gradeQuestion(tf, false, std).status, 'wrong');
  assert.equal(gradeQuestion(short, '  number ', std).status, 'correct');
  assert.equal(gradeQuestion(short, 'parseint.', std).status, 'correct');
  assert.equal(gradeQuestion(short, 'String', std).status, 'wrong');
  assert.equal(gradeQuestion(numeric, '20', std).status, 'correct');
  assert.equal(gradeQuestion({ ...numeric, tolerance: 0.5 }, '20,4', std).status, 'correct');
  assert.equal(gradeQuestion(numeric, 'veinte', std).status, 'wrong');
  assert.equal(gradeQuestion(output, 'mayor: 8', std).status, 'correct');
  assert.equal(gradeQuestion(output, 'Mayor: 3', std).status, 'wrong');

  const sol = gradeQuestion(code, code.solution, std);
  assert.equal(sol.status, 'correct', sol.feedback);
  assert.equal(sol.tests?.length, 4);
  const half = gradeQuestion(code, 'const n = Number(prompt("n"));\nif (n > 0) { console.log("par"); }', std);
  assert.equal(half.status, 'partial');
  const noIf = gradeQuestion(code, 'const n = Number(prompt("n"));\nconsole.log(n % 2 === 0 ? "par" : "impar");', std);
  assert.equal(noIf.status, 'partial');
  assert.ok(noIf.feedback.includes('Requisitos sin cumplir'));

  const { key } = buildPaper(ex, 'semilla');
  const ids = key.lineIds[order.id];
  assert.equal(gradeQuestion(order, ids, std, key).status, 'correct');
  assert.equal(gradeQuestion(order, [...ids].reverse(), std, key).status, 'wrong');
  const swapped = [ids[0], ids[1], ids[3], ids[2], ids[4]];
  assert.equal(gradeQuestion(order, swapped, std, key).status, 'partial');
});

test('salidas esperadas calculadas con la solución', () => {
  const q = createQuestion('code') as CodeQuestion;
  q.solution = 'const a = Number(prompt()); const b = Number(prompt()); console.log(a + b);';
  q.tests = [
    { id: 't1', name: 'uno', inputs: ['2', '3'], expected: '', hidden: false },
    { id: 't2', name: 'dos', inputs: ['10'], expected: '', hidden: true },
  ];
  const r = expectedFromSolution(q, std);
  assert.equal(r[0].output, '5');
  assert.equal(r[0].error, null);
  assert.ok(r[1].error?.includes('más datos'));
});

test('examen distinto por alumno, reproducible y sin respuestas', () => {
  const ex = sampleExam();
  ex.pickCount = 5;
  const a = buildPaper(ex, 'alumno-a');
  const a2 = buildPaper(ex, 'alumno-a');
  const b = buildPaper(ex, 'alumno-b');
  assert.deepEqual(a.paper, a2.paper);
  assert.equal(a.paper.questions.length, 5);
  assert.notDeepEqual(a.key.questionIds, b.key.questionIds);
  const json = JSON.stringify(a.paper);
  assert.ok(!json.includes('"correct"'));
  assert.ok(!json.includes('"solution"'));
  assert.ok(!json.includes('"answers"'));
  // los casos ocultos no viajan al alumno
  const full = buildPaper({ ...ex, pickCount: 0 }, 'x').paper;
  const codeQ = full.questions.find((q) => q.type === 'code')!;
  assert.equal(codeQ.tests?.length, 2);
  assert.equal(codeQ.hiddenTests, 2);
  assert.ok(!JSON.stringify(full).includes('Negativo impar'));
  // la pregunta de ordenar nunca aparece resuelta
  for (let i = 0; i < 30; i++) {
    const p = buildPaper({ ...ex, pickCount: 0 }, `s${i}`);
    const q = p.paper.questions.find((x) => x.type === 'order')!;
    const orig = (ex.questions.find((x) => x.type === 'order') as OrderQuestion).lines;
    assert.notDeepEqual(q.lines!.map((l) => l.text), orig);
  }
  assert.ok(!isAnswered(codeQ, codeQ.starter));
  assert.ok(isAnswered(codeQ, codeQ.starter + 'console.log(1);'));
});

test('exportar e importar configuración', () => {
  const ex = sampleExam();
  const back = parseExam(serializeExam(ex));
  assert.deepEqual(back, ex);
  assert.throws(() => parseExam('no es json'), /JSON válido/);
  assert.throws(() => parseExam('{"hola": 1}'), /configuración de examen/);
  const partial = parseExam(JSON.stringify({ title: 'Mini', questions: [{ type: 'truefalse', prompt: '¿1 = 1?', answer: true }, { type: 'desconocido' }] }));
  assert.equal(partial.questions.length, 1);
  assert.equal(partial.durationMin, 45);
  assert.ok(partial.questions[0].id);
  const copy = cloneExam(ex);
  assert.notEqual(copy.id, ex.id);
  assert.notEqual(copy.questions[0].id, ex.questions[0].id);
});

test('validación del examen', () => {
  const ex = createExam({ title: '' });
  const issues = validateExam(ex);
  assert.ok(issues.some((i) => i.message.includes('título')));
  assert.ok(issues.some((i) => i.message.includes('al menos una pregunta')));
  const q = createQuestion('single');
  ex.questions.push(q);
  assert.ok(validateExam(ex).some((i) => i.questionId === q.id && i.severity === 'error'));
  assert.equal(validateExam(sampleExam()).filter((i) => i.severity === 'error').length, 0);
});

test('códigos de sala', () => {
  const rand = seededRandom(7);
  const c = roomCode(rand);
  assert.equal(c.length, 6);
  assert.ok(isValidRoomCode(c));
  assert.equal(normalizeRoomCode(' k7p-4qx '), 'K7P4QX');
  assert.equal(normalizeRelayUrl('192.168.1.10'), 'ws://192.168.1.10:8787/sala');
  assert.equal(normalizeRelayUrl('http://10.0.0.5:9000/'), 'ws://10.0.0.5:9000/sala');
  assert.equal(normalizeRelayUrl('ws://aula.local:8787/sala'), 'ws://aula.local:8787/sala');
});

// ───────────────────────────── sala completa ─────────────────────────────

const flush = () => new Promise((r) => setTimeout(r, 0));

function student(net: MemoryNetwork, code: string, name: string, log: HostMsg[]) {
  const transports: MemoryClient[] = [];
  const c = new ExamClient({
    code,
    transport: () => {
      const t = new MemoryClient(net);
      transports.push(t);
      return t;
    },
    identity: { studentId: `id-${name}`, token: `tok-${name}`, name, group: '3A' },
    onMessage: (m) => log.push(m),
    onStatus: () => {},
    pingMs: 0,
    retry: false,
  });
  return { c, transports };
}

test('sala: alumnos entran, presentan, se califican y se genera el concentrado', async () => {
  const net = new MemoryNetwork();
  const exam = sampleExam();
  let clock = 1_000_000;
  let changes = 0;
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('ABC234', exam, { kind: 'memory' }, clock), now: () => clock, tickMs: 0, onChange: () => changes++ });
  await host.open();

  const la: HostMsg[] = [];
  const lb: HostMsg[] = [];
  const a = student(net, 'ABC234', 'Ana', la);
  const b = student(net, 'ABC234', 'Beto', lb);
  await a.c.connect();
  await b.c.connect();
  await flush();
  assert.equal(Object.keys(host.state.students).length, 2);
  const welcome = la.find((m) => m.t === 'welcome') as Extract<HostMsg, { t: 'welcome' }>;
  assert.equal(welcome.room.status, 'lobby');
  assert.ok(welcome.room.restrictions.includes('Mascota'));

  // no puede comenzar antes de que el maestro inicie
  a.c.send({ t: 'begin' });
  assert.ok(!la.some((m) => m.t === 'paper'));

  host.start();
  assert.ok(la.some((m) => m.t === 'room' && m.status === 'running'));
  a.c.send({ t: 'begin' });
  b.c.send({ t: 'begin' });
  const pa = (la.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>).paper;
  const pb = (lb.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>).paper;
  assert.equal(pa.questions.length, exam.questions.length);
  assert.ok(!JSON.stringify(pa).includes('"correct"'));

  // Ana responde todo bien
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const key = host.state.students['id-Ana'].key!;
  const perfect: Record<string, any> = {};
  for (const pq of pa.questions) {
    const q = byId.get(pq.id) as Question;
    if (q.type === 'single') perfect[q.id] = q.options.find((o) => o.correct)!.id;
    if (q.type === 'multiple') perfect[q.id] = q.options.filter((o) => o.correct).map((o) => o.id);
    if (q.type === 'truefalse') perfect[q.id] = q.answer;
    if (q.type === 'short') perfect[q.id] = q.answers[0];
    if (q.type === 'numeric') perfect[q.id] = String(q.answer);
    if (q.type === 'output') perfect[q.id] = 'Mayor: 8';
    if (q.type === 'order') perfect[q.id] = key.lineIds[q.id];
    if (q.type === 'code') perfect[q.id] = q.solution;
  }
  a.c.send({ t: 'progress', current: 2, activity: 'coding', focused: true, answers: perfect });
  assert.equal(host.state.students['id-Ana'].activity, 'coding');
  assert.equal(host.state.students['id-Ana'].current, 2);
  a.c.send({ t: 'event', kind: 'blur' });
  clock += 5000;
  a.c.send({ t: 'event', kind: 'focus', awayMs: 5000 });
  a.c.send({ t: 'event', kind: 'paste' });
  assert.equal(host.state.students['id-Ana'].focusLost, 1);
  assert.equal(host.state.students['id-Ana'].pasteBlocked, 1);

  clock += 10 * 60_000;
  a.c.send({ t: 'submit', answers: perfect, reason: 'manual' });
  const ra = la.find((m) => m.t === 'result') as Extract<HostMsg, { t: 'result' }>;
  assert.ok(ra);
  assert.equal(ra.result.grade, 10);
  assert.equal(ra.result.visibility, 'score');
  assert.equal(ra.result.questions, undefined);
  assert.equal(host.state.students['id-Ana'].result?.percent, 100);

  // Beto se desconecta y vuelve: recupera su examen y sus respuestas
  const tfId = pb.questions.find((q) => q.type === 'truefalse')!.id;
  b.c.send({ t: 'progress', current: 0, activity: 'answering', focused: true, answers: { [tfId]: false } });
  b.transports[0].drop();
  await flush();
  assert.equal(host.state.students['id-Beto'].connected, false);
  lb.length = 0;
  await b.c.connect();
  await flush();
  const again = lb.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>;
  assert.deepEqual(again.paper, pb);
  assert.equal(again.answers[tfId], false);

  // el maestro da más tiempo y luego cierra: el examen de Beto se recoge solo
  const before = host.state.students['id-Beto'].deadline!;
  host.addTime(5);
  assert.equal(host.state.students['id-Beto'].deadline, before + 5 * 60_000);
  host.notice('Quedan 5 minutos');
  assert.ok(lb.some((m) => m.t === 'notice' && m.text === 'Quedan 5 minutos'));
  await host.close(0);
  assert.equal(host.state.status, 'closed');
  assert.ok(lb.some((m) => m.t === 'force-submit'));
  const beto = host.state.students['id-Beto'];
  assert.equal(beto.submitReason, 'closed');
  assert.ok(beto.result!.percent < 100);

  // ajuste manual de puntos
  const codeId = exam.questions.find((q) => q.type === 'code')!.id;
  host.adjust('id-Beto', codeId, 5);
  assert.equal(host.state.students['id-Beto'].result!.questions.find((q) => q.questionId === codeId)!.score, 5);

  const sum = summarizeRoom(host.state);
  assert.equal(sum.students, 2);
  assert.equal(sum.submitted, 2);
  assert.equal(sum.best, 10);
  assert.equal(sum.rows[0].name, 'Ana');
  assert.equal(sum.rows[0].minutes, 10.1);
  assert.equal(sum.rows[0].focusLost, 1);
  assert.equal(sum.questions.length, exam.questions.length);
  const csv = summaryCsv(sum);
  assert.ok(csv.includes('Ana,3A,10'));
  assert.ok(csv.split('\r\n').length === 3);
  assert.ok(changes > 5);

  // nadie nuevo puede entrar a un examen cerrado
  const lc: HostMsg[] = [];
  const c = student(net, 'ABC234', 'Carla', lc);
  await c.c.connect();
  assert.ok(lc.some((m) => m.t === 'rejected'));
  host.dispose();
});

test('sala: el tiempo límite entrega el examen automáticamente', async () => {
  const net = new MemoryNetwork();
  const exam: ExamConfig = { ...sampleExam(), durationMin: 1, showResults: 'detailed' };
  let clock = 5000;
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('TIME22', exam, { kind: 'memory' }, clock), now: () => clock, tickMs: 0 });
  await host.open();
  host.start();
  const log: HostMsg[] = [];
  const s = student(net, 'TIME22', 'Dani', log);
  await s.c.connect();
  s.c.send({ t: 'begin' });
  const paper = (log.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>).paper;
  const codeId = paper.questions.find((q) => q.type === 'code')!.id;
  s.c.send({ t: 'progress', current: 0, activity: 'coding', focused: true, answers: { [codeId]: 'console.log("par");' } });
  clock += 61_000;
  host.tick();
  assert.equal(host.state.students['id-Dani'].submittedAt, null);
  clock += 20_000;
  s.c.send({ t: 'ping' });
  host.tick();
  const st = host.state.students['id-Dani'];
  assert.equal(st.submitReason, 'timeout');
  const r = log.find((m) => m.t === 'result') as Extract<HostMsg, { t: 'result' }>;
  assert.equal(r.result.visibility, 'detailed');
  assert.equal(r.result.questions?.length, exam.questions.length);
  // el detalle no revela casos ocultos
  const codeQ = r.result.questions!.find((q) => q.tests && q.tests.some((t) => t.hidden));
  assert.ok(codeQ);
  assert.ok(codeQ!.tests!.filter((t) => t.hidden).every((t) => t.expected === undefined));
  host.dispose();
});

test('sala: una identidad no puede ser suplantada', async () => {
  const net = new MemoryNetwork();
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('SAFE22', sampleExam(), { kind: 'memory' }), tickMs: 0 });
  await host.open();
  const l1: HostMsg[] = [];
  const s1 = student(net, 'SAFE22', 'Eva', l1);
  await s1.c.connect();
  const l2: HostMsg[] = [];
  const t = new MemoryClient(net);
  t.onMessage = (m) => l2.push(m as HostMsg);
  await t.connect('SAFE22');
  t.send({ t: 'hello', v: 1, studentId: 'id-Eva', token: 'otro', name: 'Impostor', group: '' });
  assert.ok(l2.some((m) => m.t === 'rejected'));
  assert.equal(host.state.students['id-Eva'].name, 'Eva');
  host.dispose();
});

test('calificación con ajustes y vista del alumno', () => {
  const ex = sampleExam();
  const { key } = buildPaper(ex, 'z');
  const r = gradePaper(ex, key, {});
  assert.equal(r.score, 0);
  assert.equal(r.questions.every((q) => q.status === 'blank'), true);
  const q0 = key.questionIds[0];
  const adj = gradePaper(ex, key, {}, { [q0]: 1 });
  assert.equal(adj.score, 1);
  assert.ok(adj.questions.find((q) => q.questionId === q0)!.manual);
  assert.deepEqual(studentView(r, 'none'), { visibility: 'none' });
});

test('sala: cerrar el ingreso solo deja reconectarse a quienes ya entraron', async () => {
  const net = new MemoryNetwork();
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('LOCK22', sampleExam(), { kind: 'memory' }), tickMs: 0 });
  await host.open();
  const la: HostMsg[] = [];
  const a = student(net, 'LOCK22', 'Ana', la);
  await a.c.connect();
  host.setLocked(true);
  assert.equal(host.state.locked, true);
  const lb: HostMsg[] = [];
  const b = student(net, 'LOCK22', 'Beto', lb);
  await b.c.connect();
  const rej = lb.find((m) => m.t === 'rejected') as Extract<HostMsg, { t: 'rejected' }>;
  assert.ok(rej && /no acepta alumnos nuevos/.test(rej.reason));
  assert.equal(host.state.students['id-Beto'], undefined);
  // Ana se cae y vuelve: sí puede
  a.transports[0].drop();
  la.length = 0;
  await a.c.connect();
  assert.ok(la.some((m) => m.t === 'welcome'));
  host.setLocked(false);
  await b.c.connect();
  assert.ok(host.state.students['id-Beto']);
  host.dispose();
});

test('sala: el maestro reabre un examen entregado por error', async () => {
  const net = new MemoryNetwork();
  let clock = 10_000;
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('OPEN22', sampleExam(), { kind: 'memory' }, clock), now: () => clock, tickMs: 0 });
  await host.open();
  host.start();
  const log: HostMsg[] = [];
  const a = student(net, 'OPEN22', 'Ana', log);
  await a.c.connect();
  a.c.send({ t: 'begin' });
  const paper = (log.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>).paper;
  const tf = paper.questions.find((q) => q.type === 'truefalse')!.id;
  a.c.send({ t: 'progress', current: 0, activity: 'answering', focused: true, answers: { [tf]: true } });
  a.c.send({ t: 'submit', answers: { [tf]: true }, reason: 'manual' });
  assert.ok(host.state.students['id-Ana'].submittedAt);
  log.length = 0;
  clock += 60_000;
  host.reopen('id-Ana', 10);
  const st = host.state.students['id-Ana'];
  assert.equal(st.submittedAt, null);
  assert.equal(st.result, null);
  assert.equal(st.deadline, clock + 10 * 60_000);
  const w = log.find((m) => m.t === 'welcome') as Extract<HostMsg, { t: 'welcome' }>;
  assert.ok(w && w.started && !w.submitted);
  const again = log.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>;
  assert.equal(again.answers[tf], true);
  // vuelve a enviar y obtiene calificación nueva
  a.c.send({ t: 'submit', answers: { [tf]: true }, reason: 'manual' });
  assert.ok(host.state.students['id-Ana'].result);
  assert.ok(st.events.some((e) => e.kind === 'teacher' && /reabrió/.test(e.text)));
  // con la sala cerrada ya no se puede reabrir
  await host.close(0);
  host.reopen('id-Ana');
  assert.ok(host.state.students['id-Ana'].submittedAt);
  host.dispose();
});

test('historial compacto: sin datos de conexión y con bitácora recortada', () => {
  const room = createRoom('HIST22', sampleExam(), { kind: 'memory' });
  room.students.x = {
    id: 'x', token: 'secreto', name: 'Ana', group: '', peer: 'p1', connected: true, lastSeen: 0, joinedAt: 0, startedAt: 1, deadline: null,
    submittedAt: 2, submitReason: 'manual', key: null, answers: { q: 'a' }, current: 0, activity: 'reading', activitySince: 0, focused: true,
    focusLost: 3, awayMs: 0, pasteBlocked: 0, runs: 0, tests: 0, events: Array.from({ length: 200 }, (_, i) => ({ at: i, kind: 'run' as const, text: `e${i}` })), result: null, overrides: {},
  };
  const c = compactRoom(room, 40);
  const st = c.students.x;
  assert.equal(st.token, '');
  assert.equal(st.peer, null);
  assert.equal(st.connected, false);
  assert.equal(st.events.length, 40);
  assert.equal(st.events[39].text, 'e199');
  assert.deepEqual(st.answers, { q: 'a' });
  assert.equal(st.focusLost, 3);
  assert.equal(room.students.x.events.length, 200);
});

// ───────────────────────────── servidor del aula ─────────────────────────────

test('servidor del aula: reenvía mensajes por WebSocket', { skip: typeof WebSocket === 'undefined' }, async () => {
  process.env.SALA_SILENCIO = '1';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { server } = require('../scripts/sala-servidor.js');
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  const url = `ws://127.0.0.1:${port}/sala`;
  let state: RoomState | null = null;
  const host = new ExamHost({ transport: new RelayHost(url), state: createRoom('LAN234', sampleExam(), { kind: 'lan', url }), tickMs: 0, onChange: (s) => (state = s) });
  try {
    await host.open();
    // el mismo código no puede abrirse dos veces
    await assert.rejects(new RelayHost(url).open('LAN234'), /en uso/);
    await assert.rejects(new RelayClient(url).connect('NOPE22'), /No existe/);

    const log: HostMsg[] = [];
    const c = new ExamClient({
      code: 'LAN234',
      transport: () => new RelayClient(url),
      identity: { studentId: 's1', token: 't1', name: 'Fer', group: '' },
      onMessage: (m) => log.push(m),
      onStatus: () => {},
      pingMs: 0,
      retry: false,
    });
    await c.connect();
    const until = async (fn: () => boolean) => {
      for (let i = 0; i < 100 && !fn(); i++) await new Promise((r) => setTimeout(r, 20));
      assert.ok(fn());
    };
    await until(() => log.some((m) => m.t === 'welcome'));
    host.start();
    c.send({ t: 'begin' });
    await until(() => log.some((m) => m.t === 'paper'));
    c.send({ t: 'submit', answers: {}, reason: 'manual' });
    await until(() => log.some((m) => m.t === 'result'));
    assert.equal((state as RoomState | null)?.students['s1']?.name, 'Fer');
    c.dispose();
  } finally {
    host.dispose();
    await new Promise((r) => server.close(r));
    // cierra conexiones que el servidor aún tenga abiertas
    server.closeAllConnections?.();
  }
});
