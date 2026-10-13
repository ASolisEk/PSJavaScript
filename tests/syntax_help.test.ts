import assert from 'node:assert/strict';
import test from 'node:test';
import * as acorn from 'acorn';
import { explainSyntaxError } from '../src/core/syntaxHelp';

function explain(code: string) {
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  } catch (e: any) {
    return explainSyntaxError(code, e);
  }
  throw new Error(`el código es válido: ${code}`);
}

// [caso, código, título esperado, línea esperada]
const CASES: [string, string, RegExp, number][] = [
  ['falta )', 'console.log("hola";\nlet x = 1;', /Falta cerrar el paréntesis \(/, 1],
  ['falta }', 'if (x > 1) {\n  console.log(x);\n\nlet y = 2;', /La llave \{ de la línea 1 nunca se cierra/, 1],
  ['sobra }', 'let x = 1;\n}\n', /Sobra llave \}/, 2],
  ['par cruzado', 'let a = [1, 2);', /Abriste \[ pero cerraste con \)/, 1],
  ['comilla sin cerrar', 'console.log("hola);\nlet y = 2;', /Falta la comilla de cierre/, 1],
  ['if sin paréntesis', 'let x = 3;\nif x > 2 {\n  x++;\n}', /La condición del if va entre paréntesis/, 2],
  ['while sin paréntesis', 'let x = 3;\nwhile x > 0 {\n  x--;\n}', /La condición del while va entre paréntesis/, 2],
  ['for con comas', 'for (let i = 0, i < 5, i++) {}', /Las partes del for se separan con ;/, 1],
  ['falta coma en arreglo', 'let a = [1 2 3];', /Falta una coma entre los elementos/, 1],
  ['número al inicio', 'let 2x = 5;', /no puede empezar con número/, 1],
  ['asignación :=', 'let x := 5;', /se asigna con =/, 1],
  ['y en lugar de &&', 'let x = 2;\nif (x > 1 y x < 5) {}', /Usa && en lugar de "y"/, 2],
  ['o en lugar de ||', 'let x = 2;\nif (x < 1 o x > 5) {}', /Usa \|\| en lugar de "o"/, 2],
  ['=< al revés', 'let x = 2;\nif (x =< 2) {}', /Se escribe <=/, 2],
  ['else suelto', 'else {\n}', /else no tiene un if/, 1],
  ['funcion (PSeInt/español)', 'funcion suma(a, b) {\n return a + b;\n}', /function/, 1],
  ['palabra mal escrita', 'function f() {\n  retrun 5;\n}', /¿Quisiste escribir return\?/, 2],
  ['falta + al unir texto', 'let n = "Ana";\nconsole.log("Hola" n);', /Para unir textos usa \+/, 2],
  ['paréntesis de más', 'console.log((1 + 2);', /Falta cerrar el paréntesis \(/, 1],
  ['const sin valor', 'const PI;', /A una constante hay que darle valor/, 1],
  ['palabra reservada', 'let class = 1;', /"class" es una palabra reservada/, 1],
  ['Si de PSeInt', 'Si x > 1 Entonces\nFinSi', /"Si" es de PSeInt; en JavaScript es if/, 1],
  ['Escribir de PSeInt', 'Escribir "Hola"', /en JavaScript es console\.log/, 1],
  ['función sin {', 'function f(a)\n  return a;\n}', /Falta la llave \{ para abrir el bloque/, 1],
  ['comillas tipográficas', 'console.log(“hola”);', /Comillas de procesador de texto/, 1],
  ['falta valor tras =', 'let a = ;', /Falta un valor después de «=»/, 1],
  ['falta valor tras +', 'let a = 3 +;', /Falta un valor después de «\+»/, 1],
  ['ya declarada', 'let x = 1;\nlet x = 2;', /"x" ya fue declarada/, 2],
];

for (const [name, code, title, line] of CASES) {
  test(`sintaxis: ${name}`, () => {
    const x = explain(code);
    assert.match(x.title, title, `título: ${x.title}`);
    assert.equal(x.line, line, `línea (título: ${x.title})`);
    assert.ok(x.message.length > 10);
    assert.ok(x.hint.solutions.length > 0);
  });
}

test('sintaxis: indica dónde lo detectó cuando el problema está en otra línea', () => {
  const x = explain('if (x > 1) {\n  console.log(x);\n\nlet y = 2;');
  assert.equal(x.line, 1);
  assert.equal(x.detectedLine, 4);
});
