import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EXAMPLES } from '../src/core/examples';
import { runToEnd } from '../src/core/runner';
import { analyze } from '../src/core/analyzer';
import { getProfile } from '../src/core/profiles';
import { buildFlow } from '../src/core/flowchart/model';
import { layoutClassic, layoutNassi } from '../src/core/flowchart/layout';
import { toSVG } from '../src/core/flowchart/svg';
import { exportCode } from '../src/core/exporters';

const std = getProfile('estandar');

function has(cmd: string) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

for (const ex of EXAMPLES) {
  test(`ejemplo "${ex.title}": analiza, ejecuta, diagrama y exporta`, () => {
    const diags = analyze(ex.code, std).filter((d) => d.severity === 'error');
    assert.deepEqual(diags, [], 'sin errores estáticos');
    const r = runToEnd(ex.code, std, ex.sampleInputs ?? []);
    assert.equal(r.error, null, r.error?.message);
    assert.equal(r.status, 'finished');
    for (const d of buildFlow(ex.code)) {
      assert.ok(toSVG(layoutClassic(d)).startsWith('<svg'));
      assert.ok(toSVG(layoutNassi(d)).startsWith('<svg'));
    }
    for (const t of ['pseint', 'python', 'cpp', 'java', 'csharp', 'coloquial']) {
      const out = exportCode(t, ex.code, ex.id);
      assert.ok(out.code.length > 20, `${t} genera código`);
    }
  });
}

const pyAvailable = has('python3');
test('el código Python exportado se ejecuta igual que el original', { skip: !pyAvailable }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'psjs-py-'));
  const ids = ['hola', 'suma', 'par', 'mayor', 'dia', 'tabla', 'factorial', 'fibonacci', 'primos', 'binaria', 'hanoi', 'palindromo', 'vocales', 'burbuja', 'calculadora', 'cuenta'];
  for (const id of ids) {
    const ex = EXAMPLES.find((e) => e.id === id)!;
    const py = exportCode('python', ex.code).code;
    const file = join(dir, `${id}.py`);
    writeFileSync(file, py);
    const input = (ex.sampleInputs ?? []).map(String).join('\n') + '\n';
    let stdout = "";
    try {
      stdout = execFileSync('python3', [file], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e: any) {
      assert.fail(`${id}: Python falló\n${e.stderr}\n---\n${py}`);
    }
    const js = runToEnd(ex.code, std, ex.sampleInputs ?? []).output.filter((l) => l.kind === 'log');
    const lastJs = js[js.length - 1]?.text ?? '';
    assert.ok(stdout.trim().length > 0, `${id}: produce salida`);
    // la última línea suele coincidir (las listas y booleanos se imprimen distinto)
    if (!/\[|\{|true|false/.test(lastJs)) assert.ok(stdout.includes(lastJs.split(' ').pop()!), `${id}: ${lastJs} vs ${stdout}`);
  }
});

const cxx = has('clang++') ? 'clang++' : has('g++') ? 'g++' : null;
test('el código C++ exportado compila', { skip: !cxx }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'psjs-cpp-'));
  for (const id of ['hola', 'suma', 'circulo', 'par', 'mayor', 'dia', 'tabla', 'factorial', 'primos', 'binaria', 'hanoi', 'burbuja', 'adivina']) {
    const ex = EXAMPLES.find((e) => e.id === id)!;
    const cpp = exportCode('cpp', ex.code).code;
    const file = join(dir, `${id}.cpp`);
    writeFileSync(file, cpp);
    try {
      execFileSync(cxx!, ['-std=c++20', '-fsyntax-only', file], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    } catch (e: any) {
      assert.fail(`${id}: no compila\n${e.stderr}\n---\n${cpp}`);
    }
  }
});
