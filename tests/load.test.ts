/**
 * Carga: una sala con 40 alumnos que entran, comienzan, responden (muchos mensajes de avance)
 * y entregan. Mide los tiempos del equipo del maestro y el tamaño de la sala guardada, para
 * detectar a tiempo si algo se vuelve lento con un grupo completo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleExam } from '../src/core/exam/config';
import { ExamClient } from '../src/core/exam/client';
import { ExamHost } from '../src/core/exam/host';
import type { HostMsg } from '../src/core/exam/protocol';
import { compactRoom, createRoom } from '../src/core/exam/room';
import { MemoryClient, MemoryHost, MemoryNetwork } from '../src/core/exam/transport/memory';
import type { Answers } from '../src/core/exam/types';

const STUDENTS = 40;
const PROGRESS_PER_STUDENT = 30;

test('carga: 40 alumnos en una sala', async (t) => {
  const net = new MemoryNetwork();
  const exam = sampleExam();
  let changes = 0;
  const host = new ExamHost({ transport: new MemoryHost(net), state: createRoom('CARGA4', exam, { kind: 'memory' }), tickMs: 0, onChange: () => changes++ });
  await host.open();

  const clients: { c: ExamClient; log: HostMsg[] }[] = [];
  let t0 = performance.now();
  for (let i = 0; i < STUDENTS; i++) {
    const log: HostMsg[] = [];
    const c = new ExamClient({
      code: 'CARGA4',
      transport: () => new MemoryClient(net),
      identity: { studentId: `id-${i}`, token: `tk-${i}`, name: `Alumno ${i}`, group: '3A' },
      onMessage: (m) => log.push(m),
      onStatus: () => {},
      pingMs: 0,
      retry: false,
    });
    await c.connect();
    clients.push({ c, log });
  }
  const joinMs = performance.now() - t0;
  assert.equal(Object.keys(host.state.students).length, STUDENTS);

  host.start();
  t0 = performance.now();
  for (const { c } of clients) c.send({ t: 'begin' });
  const beginMs = performance.now() - t0;

  // cada alumno responde poco a poco (como el autoguardado mientras escribe)
  t0 = performance.now();
  for (let k = 0; k < PROGRESS_PER_STUDENT; k++) {
    for (const { c, log } of clients) {
      const paper = (log.find((m) => m.t === 'paper') as Extract<HostMsg, { t: 'paper' }>).paper;
      const q = paper.questions[k % paper.questions.length];
      const answers: Answers = { [q.id]: q.type === 'code' ? `// intento ${k}\nconsole.log(${k});` : `respuesta ${k}` };
      c.send({ t: 'progress', current: k % paper.questions.length, activity: 'answering', focused: true, answers });
    }
  }
  const progressMs = performance.now() - t0;
  const progressMsgs = STUDENTS * PROGRESS_PER_STUDENT;

  // todos entregan (se califica cada examen, con sus programas)
  t0 = performance.now();
  for (const { c } of clients) c.send({ t: 'submit', answers: {}, reason: 'manual' });
  const submitMs = performance.now() - t0;
  assert.ok(Object.values(host.state.students).every((s) => s.result));

  t0 = performance.now();
  const json = JSON.stringify(host.state);
  const stringifyMs = performance.now() - t0;
  const compact = JSON.stringify(compactRoom(host.state));

  t.diagnostic(
    [
      `entrar: ${joinMs.toFixed(0)} ms`,
      `comenzar: ${beginMs.toFixed(0)} ms`,
      `avance: ${progressMsgs} mensajes en ${progressMs.toFixed(0)} ms (${((progressMs / progressMsgs) * 1000).toFixed(0)} µs c/u)`,
      `entregar y calificar: ${submitMs.toFixed(0)} ms (${(submitMs / STUDENTS).toFixed(1)} ms por alumno)`,
      `sala guardada: ${(json.length / 1024).toFixed(0)} KB (historial compacto ${(compact.length / 1024).toFixed(0)} KB), serializar ${stringifyMs.toFixed(1)} ms`,
      `cambios notificados: ${changes}`,
    ].join(' · '),
  );

  // presupuestos generosos (una computadora escolar puede ser varias veces más lenta)
  assert.ok(progressMs / progressMsgs < 5, 'cada mensaje de avance se procesa en menos de 5 ms');
  assert.ok(submitMs / STUDENTS < 400, 'calificar un examen toma menos de 400 ms');
  assert.ok(json.length < 4_000_000, 'la sala completa ocupa menos de 4 MB');
  assert.ok(compact.length < json.length, 'el historial es más compacto');
  for (const { c } of clients) c.dispose();
  host.dispose();
});
