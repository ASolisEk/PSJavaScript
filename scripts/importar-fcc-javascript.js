#!/usr/bin/env node
/**
 * Importa los cuestionarios de la certificación «JavaScript» (currículo v9)
 * de freeCodeCamp y genera src/core/exam/certs/fccJavascriptQuizzes.ts.
 *
 * Fuente: https://www.freecodecamp.org/learn/javascript-v9/
 * Repositorio: https://github.com/freeCodeCamp/freeCodeCamp (curriculum/)
 * Licencia del contenido: CC BY-SA 4.0 (© freeCodeCamp.org).
 *
 * Uso:  node scripts/importar-fcc-javascript.js
 *       node scripts/importar-fcc-javascript.js --dir ./copia-local
 *
 * Con --dir se lee una copia local con la misma estructura que el repositorio
 * (curriculum/structure/... y curriculum/challenges/english/blocks/...).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const RAW = 'https://raw.githubusercontent.com/freeCodeCamp/freeCodeCamp/main/';
const DIR = arg('dir');
const OUT = path.join(__dirname, '..', 'src', 'core', 'exam', 'certs', 'fccJavascriptQuizzes.ts');

/** Nombre en español de cada tema (un cuestionario por módulo). */
const TOPICS = {
  'quiz-javascript-variables-and-data-types': 'Variables y tipos de datos',
  'quiz-javascript-strings': 'Cadenas de texto',
  'quiz-javascript-math': 'Números y operadores',
  'quiz-javascript-comparisons-and-conditionals': 'Comparaciones y condicionales',
  'quiz-javascript-functions': 'Funciones',
  'quiz-javascript-arrays': 'Arreglos',
  'quiz-javascript-objects': 'Objetos',
  'quiz-javascript-loops': 'Ciclos',
  'quiz-javascript-fundamentals': 'Repaso de fundamentos',
  'quiz-javascript-higher-order-functions': 'Funciones de orden superior',
  'quiz-dom-manipulation-and-click-event-with-javascript': 'DOM y eventos',
  'quiz-js-a11y': 'JavaScript y accesibilidad',
  'quiz-debugging-javascript': 'Depuración',
  'quiz-javascript-regular-expressions': 'Expresiones regulares',
  'quiz-form-validation-with-javascript': 'Validación de formularios',
  'quiz-javascript-dates': 'Fechas',
  'quiz-javascript-audio-and-video': 'Audio y video',
  'quiz-javascript-maps-and-sets': 'Map y Set',
  'quiz-local-storage-and-crud': 'localStorage y CRUD',
  'quiz-javascript-classes': 'Clases y this',
  'quiz-recursion': 'Recursión',
  'quiz-data-structures-js': 'Estructuras de datos',
  'quiz-searching-and-sorting-algorithms-js': 'Búsqueda y ordenamiento',
  'quiz-graph-and-trees-js': 'Grafos y árboles',
  'quiz-dynamic-programming-js': 'Programación dinámica',
  'quiz-javascript-functional-programming': 'Programación funcional',
  'quiz-asynchronous-javascript': 'JavaScript asíncrono',
};

async function read(rel) {
  if (DIR) return fs.readFileSync(path.join(DIR, rel), 'utf8');
  const res = await fetch(RAW + rel);
  if (!res.ok) throw new Error(`${res.status} al descargar ${rel}`);
  return res.text();
}

/** Divide un bloque en partes separadas por líneas «---» (fuera de bloques de código). */
function splitAlternatives(text) {
  const parts = [[]];
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    if (!fence && line.trim() === '---') parts.push([]);
    else parts[parts.length - 1].push(line);
  }
  return parts.map((p) => p.join('\n').trim()).filter(Boolean);
}

/** Lee las preguntas (texto, respuesta y distractores) de un archivo de cuestionario. */
function parseQuiz(md) {
  const body = md.split(/^# --quizzes--\s*$/m)[1];
  if (!body) throw new Error('El archivo no tiene la sección --quizzes--');
  const sets = body.split(/^## --quiz--\s*$/m).slice(1);
  return sets.map((set) =>
    set
      .split(/^### --question--\s*$/m)
      .slice(1)
      .map((q) => {
        const sec = {};
        for (const part of q.split(/^#### --/m).slice(1)) {
          const m = part.match(/^([a-z]+)--\s*\n([\s\S]*)$/);
          if (m) sec[m[1]] = m[2].trim();
        }
        if (!sec.text || !sec.answer || !sec.distractors) throw new Error(`Pregunta incompleta: ${q.slice(0, 80)}`);
        return { q: sec.text, a: sec.answer, d: splitAlternatives(sec.distractors) };
      }),
  );
}

async function main() {
  const superblock = JSON.parse(await read('curriculum/structure/superblocks/javascript-v9.json'));
  const quizzes = [];
  for (const chapter of superblock.chapters) {
    for (const mod of chapter.modules) {
      for (const block of mod.blocks) {
        if (!block.startsWith('quiz-')) continue;
        const meta = JSON.parse(await read(`curriculum/structure/blocks/${block}.json`));
        const { id, title } = meta.challengeOrder[0];
        const md = await read(`curriculum/challenges/english/blocks/${block}/${id}.md`);
        const sets = parseQuiz(md);
        const pass = (md.match(/at least (\d+) of the (\d+) questions/) || []).slice(1).map(Number);
        quizzes.push({
          block,
          module: mod.dashedName,
          title,
          topic: TOPICS[block] || title.replace(/ Quiz$/, ''),
          passing: pass.length === 2 ? pass : [Math.ceil(sets[0].length * 0.9), sets[0].length],
          questions: sets.flat(),
        });
        console.log(`✓ ${title}: ${sets.flat().length} preguntas`);
      }
    }
  }
  const total = quizzes.reduce((s, q) => s + q.questions.length, 0);
  const out = `/**
 * Banco de preguntas de la certificación «JavaScript» de freeCodeCamp
 * (currículo v9): los cuestionarios de cada módulo, sin traducir.
 *
 * ARCHIVO GENERADO por scripts/importar-fcc-javascript.js — no lo edites a mano.
 * Fuente: https://www.freecodecamp.org/learn/javascript-v9/
 * Contenido © freeCodeCamp.org, licencia CC BY-SA 4.0.
 * ${quizzes.length} cuestionarios, ${total} preguntas.
 */

export interface FccQuizQuestion {
  /** Enunciado (Markdown). */
  q: string;
  /** Respuesta correcta. */
  a: string;
  /** Respuestas incorrectas. */
  d: string[];
}

export interface FccQuiz {
  block: string;
  module: string;
  title: string;
  /** Tema en español (se usa para elegir preguntas por tema). */
  topic: string;
  /** Aciertos mínimos para aprobar el cuestionario original: [aciertos, preguntas]. */
  passing: [number, number];
  questions: FccQuizQuestion[];
}

export const FCC_JAVASCRIPT_QUIZZES: FccQuiz[] = ${JSON.stringify(quizzes, null, 1)};
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, out);
  console.log(`\nSe escribió ${path.relative(process.cwd(), OUT)} (${quizzes.length} cuestionarios, ${total} preguntas).`);
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  console.error('Si no tienes acceso a raw.githubusercontent.com usa --dir con una copia local del repositorio.');
  process.exit(1);
});
