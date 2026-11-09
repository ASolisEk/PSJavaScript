import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Runner, runToEnd } from '../src/core/runner';
import { getProfile } from '../src/core/profiles';

const std = getProfile('estandar');
const COUNTDOWN = 'let i = 3;\nconst id = setInterval(() => {\n  console.log(i);\n  i--;\n  if (i === 0) {\n    clearInterval(id);\n    console.log("¡Despegue!");\n  }\n}, 120);\nconsole.log("inicio");\n';

function finish(r: Runner): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const h = setInterval(() => {
      if (['finished', 'error', 'stopped'].includes(r.getStatus())) {
        clearInterval(h);
        resolve();
      } else if (Date.now() - t0 > 5000) {
        clearInterval(h);
        reject(new Error('no terminó'));
      }
    }, 5);
  });
}

test('setTimeout/setInterval: en el editor esperan su tiempo de verdad', async () => {
  let waiting = false;
  const r = new Runner({ code: COUNTDOWN, profile: std, realTime: true, onUpdate: (s) => (waiting ||= !!s.notice?.startsWith('Esperando')) });
  const t0 = Date.now();
  r.start('run');
  await finish(r);
  const ms = Date.now() - t0;
  assert.ok(ms >= 330, `tardó ${ms} ms`);
  assert.ok(waiting, 'la consola avisa que está esperando');
  assert.deepEqual(r.snapshot().output.map((o) => o.text).slice(0, 5), ['inicio', '3', '2', '1', '¡Despegue!']);
});

test('setTimeout/setInterval: al calificar y en paso a paso no se espera', async () => {
  // las dos son síncronas: si terminan, no esperaron (una espera real necesitaría temporizadores).
  // No se mide el tiempo: con el equipo ocupado una medición así fallaba sin motivo.
  const res: any = runToEnd(COUNTDOWN, std, []);
  assert.ok(JSON.stringify(res).includes('¡Despegue!'));

  const r = new Runner({ code: COUNTDOWN, profile: std, realTime: true });
  r.start('step');
  while (!['finished', 'error'].includes(r.getStatus())) r.stepOnce();
  assert.ok(r.snapshot().output.some((o) => o.text === '¡Despegue!'));
  assert.ok(!r.snapshot().notice?.startsWith('Esperando'), 'no avisó que esperaba');
});

test('setTimeout: detener durante la espera', async () => {
  const r = new Runner({ code: 'setTimeout(() => {\n  console.log("tarde");\n}, 2000);\n', profile: std, realTime: true });
  r.start('run');
  await new Promise((res) => setTimeout(res, 60));
  assert.equal(r.getStatus(), 'running');
  r.stop();
  assert.equal(r.getStatus(), 'stopped');
  assert.ok(!r.snapshot().output.some((o) => o.text === 'tarde'));
});

test('prompt dentro de un while (lee hasta un centinela) y aviso de tipos con prompt', async () => {
  const code = 'let n = Number(prompt("Número (0 para salir):"));\nwhile (n !== 0) {\n  console.log(n * 2);\n  n = Number(prompt("Número (0 para salir):"));\n}\nconsole.log("fin");\n';
  const res: any = runToEnd(code, std, ['3', '5', '0']);
  assert.ok(JSON.stringify(res).includes('"fin"'));
  // con tipos estrictos, comparar el texto de prompt() con un número explica cómo convertirlo
  const strict = runToEnd('let n = prompt("N:");\nwhile (n > 0) {\n  n = prompt("N:");\n}\n', getProfile('estructurado'), ['3']);
  assert.match(JSON.stringify(strict), /Number\(prompt/);
});
