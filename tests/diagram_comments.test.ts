import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFlow, FBlock } from '../src/core/flowchart/model';
import { layoutClassic, layoutNassi } from '../src/core/flowchart/layout';
import { toSVG } from '../src/core/flowchart/svg';

function findCommentBlocks(b: FBlock): { text: string; line: number }[] {
  const result: { text: string; line: number }[] = [];
  const walk = (node: FBlock) => {
    if (!node) return;
    if (node.k === 'op' && node.shape === 'comment') {
      result.push({ text: node.text, line: node.line });
    } else if (node.k === 'seq') {
      node.items.forEach(walk);
    } else if (node.k === 'if') {
      walk(node.yes);
      if (node.no) walk(node.no);
    } else if (node.k === 'while' || node.k === 'dowhile') {
      walk(node.body);
    } else if (node.k === 'for') {
      walk(node.body);
    } else if (node.k === 'forof') {
      walk(node.body);
    } else if (node.k === 'switch') {
      node.cases.forEach((c) => walk(c.body));
    } else if (node.k === 'try') {
      walk(node.body);
      if (node.handler) walk(node.handler);
      if (node.finalizer) walk(node.finalizer);
    }
  };
  walk(b);
  return result;
}

test('diagrama: comentarios de línea y bloque en el programa principal', () => {
  const code = `
// Inicializar variables
let x = 10;
/* Bloque explicativo */
let y = 20;
// Fin
`;
  const diagrams = buildFlow(code);
  const main = diagrams.find((d) => d.id === 'main');
  assert.ok(main, 'existe diagrama principal');

  const comments = findCommentBlocks(main.body);
  assert.equal(comments.length, 3);
  assert.equal(comments[0].text, '// Inicializar variables');
  assert.equal(comments[0].line, 2);
  assert.equal(comments[1].text, '/* Bloque explicativo */');
  assert.equal(comments[1].line, 4);
  assert.equal(comments[2].text, '// Fin');
  assert.equal(comments[2].line, 6);
});

test('diagrama: agrupación de comentarios consecutivos', () => {
  const code = `
// Paso 1: Configurar acumulador
// Se inicia en cero para la suma
let suma = 0;
`;
  const diagrams = buildFlow(code);
  const main = diagrams.find((d) => d.id === 'main');
  assert.ok(main);

  const comments = findCommentBlocks(main.body);
  assert.equal(comments.length, 1);
  assert.equal(comments[0].text, '// Paso 1: Configurar acumulador\n// Se inicia en cero para la suma');
  assert.equal(comments[0].line, 2);
});

test('diagrama: comentarios dentro de estructuras de control (if, while)', () => {
  const code = `
// Comentario previo
if (x > 0) {
  // Caso positivo
  console.log("positivo");
} else {
  // Caso no positivo
  console.log("cero o negativo");
}

while (x < 10) {
  // Incrementar contador
  x++;
}
`;
  const diagrams = buildFlow(code);
  const main = diagrams.find((d) => d.id === 'main');
  assert.ok(main);

  const comments = findCommentBlocks(main.body);
  assert.equal(comments.length, 4);
  assert.ok(comments.some((c) => c.text === '// Comentario previo'));
  assert.ok(comments.some((c) => c.text === '// Caso positivo'));
  assert.ok(comments.some((c) => c.text === '// Caso no positivo'));
  assert.ok(comments.some((c) => c.text === '// Incrementar contador'));
});

test('diagrama: comentarios de cabecera y cuerpo en funciones', () => {
  const code = `
// Función para calcular el factorial
function factorial(n) {
  // Caso base
  if (n <= 1) return 1;
  // Llamada recursiva
  return n * factorial(n - 1);
}
`;
  const diagrams = buildFlow(code);
  const fnDiagram = diagrams.find((d) => d.name === 'factorial');
  assert.ok(fnDiagram, 'existe diagrama de factorial');

  const comments = findCommentBlocks(fnDiagram.body);
  assert.ok(comments.some((c) => c.text === '// Función para calcular el factorial'));
  assert.ok(comments.some((c) => c.text === '// Caso base'));
  assert.ok(comments.some((c) => c.text === '// Llamada recursiva'));
});

test('diagrama: opción showComments desactiva la inclusión de comentarios', () => {
  const code = `
// Comentario que debe omitirse
let a = 1;
`;
  const diagramsWithComments = buildFlow(code, { showComments: true });
  const diagramsWithoutComments = buildFlow(code, { showComments: false });

  assert.equal(findCommentBlocks(diagramsWithComments[0].body).length, 1);
  assert.equal(findCommentBlocks(diagramsWithoutComments[0].body).length, 0);
});

test('diagrama: distribución clásica y Nassi con comentarios exporta a SVG válido', () => {
  const code = `
// Cálculo de promedio
let nota1 = 8;
let nota2 = 9;
// Promediar
let prom = (nota1 + nota2) / 2;
if (prom >= 6) {
  // Aprobado
  console.log("Aprobado");
}
`;
  const diagrams = buildFlow(code);
  for (const d of diagrams) {
    const classic = layoutClassic(d);
    const nassi = layoutNassi(d);

    const svgClassic = toSVG(classic, undefined, d.name);
    const svgNassi = toSVG(nassi, undefined, d.name);

    assert.ok(svgClassic.startsWith('<svg'), 'SVG clásico válido');
    assert.ok(svgClassic.includes('stroke-dasharray="5,4"'), 'SVG clásico contiene borde punteado para comentario');
    assert.ok(svgClassic.includes('// Cálculo de promedio'), 'SVG contiene texto del comentario');

    assert.ok(svgNassi.startsWith('<svg'), 'SVG Nassi válido');
    assert.ok(svgNassi.includes('// Promediar'), 'SVG Nassi contiene comentario');
  }
});
