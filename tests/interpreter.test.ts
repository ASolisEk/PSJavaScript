import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runToEnd, Runner, RunnerSnapshot } from '../src/core/runner';
import { getProfile } from '../src/core/profiles';

const std = getProfile('estandar');
const flex = getProfile('flexible');
const strict = getProfile('estructurado');

function out(code: string, inputs: any[] = [], profile = std) {
  const r = runToEnd(code, profile, inputs);
  if (r.error) return `ERROR(${r.error.line}): ${r.error.message}`;
  return r.output.filter((l) => l.kind !== 'system' && l.kind !== 'input').map((l) => l.text).join('\n');
}

test('salida básica y formato', () => {
  assert.equal(out('console.log("Hola", 1+2, [1,"a"], {x:1})'), "Hola 3 [ 1, 'a' ] { x: 1 }");
  assert.equal(out('console.log(0.1+0.2)'), '0.30000000000000004');
  assert.equal(out('console.log(`a${1+1}b`)'), 'a2b');
  assert.equal(out('console.log("%d años", 5)'), '5 años');
});

test('variables, condicionales y ciclos', () => {
  const code = `
let suma = 0;
for (let i = 1; i <= 10; i++) { if (i % 2 === 0) continue; suma += i; }
let j = 0; while (true) { j++; if (j > 3) break; }
let k = 0; do { k += 2 } while (k < 7);
console.log(suma, j, k);`;
  assert.equal(out(code), '25 4 8');
});

test('switch con fallthrough y default', () => {
  const code = `
function f(x) { let r = ''; switch (x) { case 1: r += 'a'; case 2: r += 'b'; break; default: r += 'z'; } return r; }
console.log(f(1), f(2), f(9));`;
  assert.equal(out(code), 'ab b z');
});

test('funciones, recursión, closures y flechas', () => {
  const code = `
function fact(n) { return n <= 1 ? 1 : n * fact(n - 1); }
const contador = () => { let c = 0; return () => ++c; };
const inc = contador(); inc(); inc();
const fns = []; for (let i = 0; i < 3; i++) fns.push(() => i);
console.log(fact(6), inc(), fns.map(f => f()).join(','));`;
  assert.equal(out(code), '720 3 0,1,2');
});

test('arreglos con callbacks, sort, reduce, desestructuración', () => {
  const code = `
const a = [5, 3, 8, 1];
const [x, , ...resto] = a;
const {p, q = 9} = {p: 1};
console.log(a.filter(n => n > 2).map(n => n * 2), a.reduce((s, n) => s + n, 0), [...a].sort((u, v) => u - v), x, resto, p, q);`;
  assert.equal(out(code), '[ 10, 6, 16 ] 17 [ 1, 3, 5, 8 ] 5 [ 8, 1 ] 1 9');
});

test('clases, herencia, super, getters, static, campos', () => {
  const code = `
class Animal {
  #secreto = 1;
  static total = 0;
  constructor(nombre) { this.nombre = nombre; Animal.total++; }
  hablar() { return this.nombre + ' hace ruido'; }
  get mayus() { return this.nombre.toUpperCase(); }
}
class Perro extends Animal {
  patas = 4;
  constructor(n) { super(n); }
  hablar() { return super.hablar() + ' (guau)'; }
}
const p = new Perro('Fido');
console.log(p.hablar(), p.mayus, Animal.total, p instanceof Animal, p.patas);`;
  assert.equal(out(code), 'Fido hace ruido (guau) FIDO 1 true 4');
});

test('try/catch/finally y errores en español', () => {
  const code = `
let r = [];
try { null.x; } catch (e) { r.push(e instanceof TypeError); } finally { r.push('fin'); }
try { throw new Error('malo'); } catch ({ message }) { r.push(message); }
console.log(r);`;
  assert.equal(out(code), "[ true, 'fin', 'malo' ]");
  assert.match(out('let a; console.log(a.b);'), /ERROR\(1\): No se puede leer 'b' porque 'a' es undefined/);
  assert.match(out('const c = 1;\nc = 2;'), /ERROR\(2\): No se puede reasignar la constante 'c'/);
  assert.match(out('let contador = 1;\nconsole.log(contadr);'), /¿Quisiste decir 'contador'\?/);
  assert.match(out('x = 5;'), /no ha sido declarada/);
  assert.equal(out('x = 5; console.log(x)', [], flex), '5');
  assert.match(out('function f(){ return f(); } f();'), /Desbordamiento de pila/);
  assert.match(out('let a = ;'), /ERROR\(1\): Símbolo inesperado/);
});

test('prompt y confirm con entradas', () => {
  const code = `const n = Number(prompt("Número:")); const ok = confirm("¿Seguro?"); console.log(n * 2, ok);`;
  assert.equal(out(code, ['21', true]), '42 true');
});

test('tipos estrictos e índice fuera de rango', () => {
  assert.match(out('let a = "5" * 2;', [], strict), /Tipos incompatibles/);
  assert.match(out('let a = [1,2];\nlet b = a[2];', [], strict), /ERROR\(2\): Índice 2 fuera de rango/);
  assert.equal(out('let a = "5" * 2; console.log(a)'), '10');
});

test('setTimeout con tiempo virtual', () => {
  assert.equal(out('setTimeout(() => console.log("b"), 100); setTimeout(() => console.log("a"), 10); console.log("0");'), '0\na\nb');
});

test('optional chaining, nullish, labels, for-in', () => {
  const code = `
const o = {a: {b: 2}};
let s = 0;
fuera: for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { if (j === 1) continue fuera; if (i === 2) break fuera; s++; } }
const ks = []; for (const k in {x: 1, y: 2}) ks.push(k);
console.log(o?.a?.b, o.z?.b, o.z ?? 'def', s, ks);`;
  assert.equal(out(code), "2 undefined def 2 [ 'x', 'y' ]");
});

test('paso a paso, retroceso, prueba de escritorio', async () => {
  const code = `let a = 1;\nlet b = a + 1;\na = b * 10;\nconsole.log(a);`;
  let snap: RunnerSnapshot | null = null;
  const r = new Runner({ code, profile: std, onUpdate: (s) => (snap = s) });
  r.stepOnce();
  assert.equal(snap!.line, 1);
  r.stepOnce();
  r.stepOnce();
  assert.equal(snap!.line, 3);
  const vars = snap!.frames[0].scopes.find((s) => s.title === 'Global')!.vars;
  assert.equal(vars.find((v) => v.name === 'b')!.value, '2');
  r.stepBack();
  assert.equal(snap!.line, 2);
  r.stepOnce();
  r.stepOnce();
  assert.equal(snap!.status, 'paused');
  assert.equal(snap!.line, 4);
  r.stepOnce();
  assert.equal(snap!.status, 'finished');
  assert.deepEqual(snap!.desktop.columns, ['a', 'b']);
  assert.deepEqual(snap!.desktop.rows.map((x) => x.values), [['1', ''], ['1', '2'], ['20', '2']]);
});

test('ejecución con breakpoint y entrada asíncrona', async () => {
  const code = `let n = prompt("n");\nlet m = n + "!";\nconsole.log(m);`;
  let snap: RunnerSnapshot | null = null;
  const r = new Runner({ code, profile: std, breakpoints: new Set([3]), onUpdate: (s) => (snap = s) });
  r.start('run');
  await new Promise((res) => setTimeout(res, 20));
  assert.equal(snap!.status, 'input');
  assert.equal(snap!.inputRequest!.prompt, 'n');
  r.provideInput('hola');
  await new Promise((res) => setTimeout(res, 20));
  assert.equal(snap!.status, 'paused');
  assert.equal(snap!.line, 3);
  r.resume('run');
  await new Promise((res) => setTimeout(res, 20));
  assert.equal(snap!.status, 'finished');
  assert.equal(snap!.output.find((l) => l.kind === 'log')!.text, 'hola!');
});

test('explicación en lenguaje natural', () => {
  const r = new Runner({ code: 'let x = 3;\nif (x > 2) { x = x * 2; }', profile: std, explain: true });
  (r as any).init();
  (r as any).status = 'running';
  while ((r as any).next() === 'step');
  const texts = r.snapshot().explanations.map((e) => e.text);
  assert.ok(texts.includes('Se declara la variable x = 3'));
  assert.ok(texts.some((t) => t.startsWith('La condición (x > 2) es verdadera')));
  assert.ok(texts.includes('x ← 6'));
});
