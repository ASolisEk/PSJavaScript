import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, hasBlockingErrors } from '../src/core/analyzer';
import { getProfile } from '../src/core/profiles';

const msgs = (code: string, id = 'estandar') => analyze(code, getProfile(id)).map((d) => `${d.line}:${d.severity}:${d.rule}`);

test('sintaxis', () => {
  const d = analyze('let x = (1 + 2;', getProfile('estandar'));
  assert.equal(d[0].rule, 'syntax');
  assert.ok(hasBlockingErrors(d));
});

test('programa limpio sin diagnósticos', () => {
  const code = `
const nombre = prompt("Nombre:");
function saludar(n) { return "Hola " + n; }
class A { constructor(x) { this.x = x; } get doble() { return this.x * 2; } }
const a = new A(2);
for (let i = 0; i < 3; i++) { console.log(saludar(nombre), a.doble, i); }
const arr = [1, 2, 3];
for (const v of arr) { console.log(v); }
try { JSON.parse("{"); } catch (e) { console.log(e.message); }
const f = function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); };
console.log(f(5), typeof noExiste);`;
  assert.deepEqual(msgs(code), []);
});

test('variables no definidas, const, tdz, sin usar', () => {
  const code = `let contador = 0;\nconsole.log(contadr);\nconst k = 1;\nk = 2;\nconsole.log(z);\nlet z = 1;\nlet nada = 3;\ny = 4;`;
  const m = msgs(code);
  assert.ok(m.includes('2:error:undefined'));
  assert.ok(m.includes('4:error:const-assign'));
  assert.ok(m.includes('5:error:tdz'));
  assert.ok(m.includes('7:warning:unused'));
  assert.ok(m.includes('8:error:undeclared'));
  assert.ok(msgs('y = 4; console.log(y);', 'flexible').every((x) => !x.includes('error')));
});

test('reglas de perfil', () => {
  const m = msgs('var x = 1\nif (x == 1) console.log(x)\nconst f = () => 1;\nf();', 'estructurado');
  assert.ok(m.includes('1:error:forbid-var'));
  assert.ok(m.includes('1:warning:semicolon'));
  assert.ok(m.includes('2:warning:strict-equality'));
  assert.ok(m.includes('2:warning:require-braces'));
  assert.ok(m.includes('3:error:basic-only'));
});

test('errores comunes de principiante', () => {
  const m = msgs('let x = 1;\nif (x = 2) { console.log(x); }\nwhile (true) { x++; }\nconsole.Log(x);\ndocument.write(x);\nif (x === NaN) {}');
  assert.ok(m.includes('2:warning:assign-in-condition'));
  assert.ok(m.includes('3:warning:infinite-loop'));
  assert.ok(m.includes('4:error:unknown-member'));
  assert.ok(m.includes('5:error:unavailable'));
  assert.ok(m.includes('6:warning:nan-compare'));
  const d = analyze('console.Log(1);', getProfile('estandar'));
  assert.match(d[0].message, /¿Quisiste decir console.log\?/);
});

test('código inalcanzable', () => {
  assert.ok(msgs('function f() { return 1;\n console.log(2); }\nf();').includes('2:warning:unreachable'));
});
