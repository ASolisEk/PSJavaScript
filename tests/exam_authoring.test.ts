import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendQuestions, bankSources, groupByTopic, matchesSearch, NO_TOPIC, promptKey } from '../src/core/exam/bank';
import { createExam, createQuestion, sampleExam, validateExam } from '../src/core/exam/config';
import { parseQuickText, QUICK_TEXT_EXAMPLE } from '../src/core/exam/quickText';
import type { MultipleQuestion, NumericQuestion, ShortQuestion, SingleQuestion, TrueFalseQuestion } from '../src/core/exam/types';

test('banco: incluye Fundamentos, freeCodeCamp y los otros exámenes del maestro', () => {
  const mine = { ...createExam({ title: 'Parcial 1' }), questions: [{ ...createQuestion('truefalse'), prompt: 'x' }] };
  const editing = createExam({ title: 'Editando' });
  const sources = bankSources([mine, editing, createExam({ title: 'Vacío' })], editing.id);
  assert.deepEqual(
    sources.map((s) => s.id),
    ['fundamentos', 'fcc', `exam:${mine.id}`],
  );
  assert.ok(sources[0].questions.length >= 40);
  assert.ok(sources[1].questions.length > 300);
  assert.ok(groupByTopic(sources[1].questions).length > 20);
});

test('banco: agrupa por tema y busca sin importar acentos ni mayúsculas', () => {
  const a = { ...createQuestion('single'), prompt: '¿Qué método AGREGA al final?', topic: 'Arreglos' };
  const b = { ...createQuestion('truefalse'), prompt: 'Las funciones flecha...' };
  assert.deepEqual(
    groupByTopic([a, b]).map((g) => [g.topic, g.questions.length]),
    [
      ['Arreglos', 1],
      [NO_TOPIC, 1],
    ],
  );
  assert.ok(matchesSearch(a, 'metodo agrega'));
  assert.ok(matchesSearch(a, 'arreglos'));
  assert.ok(!matchesSearch(a, 'flecha'));
  assert.equal(promptKey({ prompt: '  Hola   **Mundo** ' }), promptKey({ prompt: 'hola mundo' }));
});

test('banco: agregar copia las preguntas con ids nuevos y activa los temas nuevos', () => {
  const exam = sampleExam();
  const fcc = bankSources([])[1].questions;
  const src = [{ ...fcc[0], topic: 'Tema nuevo' }, { ...fcc[1], topic: exam.questions[0].topic }, { ...fcc[2], topic: 'Tema nuevo' }];
  const { exam: next, newTopics } = appendQuestions(exam, src);
  assert.equal(next.questions.length, exam.questions.length + 3);
  const added = next.questions.slice(-3);
  assert.ok(added.every((q, i) => q.id !== src[i].id && q.prompt === src[i].prompt));
  assert.deepEqual(newTopics, ['Tema nuevo']);
  assert.equal(next.topicPicks['Tema nuevo'], 1);
  assert.equal(next.topicPicks[exam.questions[0].topic!], exam.topicPicks[exam.questions[0].topic!]);
  assert.equal(validateExam(next).filter((i) => i.severity === 'error').length, 0);
  // sin selección por tema no se tocan los ajustes
  const plain = appendQuestions(createExam(), src);
  assert.deepEqual(plain.exam.topicPicks, {});
  assert.deepEqual(plain.newTopics, []);
});

test('captura rápida: el ejemplo produce 5 preguntas válidas de 5 tipos', () => {
  const { questions, issues } = parseQuickText(QUICK_TEXT_EXAMPLE);
  assert.deepEqual(issues, []);
  assert.deepEqual(
    questions.map((q) => q.type),
    ['single', 'multiple', 'truefalse', 'numeric', 'short'],
  );
  const [single, multiple, tf, num, short] = questions as [SingleQuestion, MultipleQuestion, TrueFalseQuestion, NumericQuestion, ShortQuestion];
  assert.equal(single.prompt, '¿Qué método agrega un elemento al final de un arreglo?');
  assert.deepEqual(
    single.options.map((o) => [o.text, o.correct]),
    [
      ['shift()', false],
      ['push()', true],
      ['pop()', false],
      ['unshift()', false],
    ],
  );
  assert.equal(multiple.options.filter((o) => o.correct).length, 2);
  assert.equal(tf.answer, false);
  assert.equal(num.answer, 1);
  assert.deepEqual(short.answers, ['===', 'triple igual']);
  assert.equal(short.points, 2);
  assert.deepEqual(
    questions.map((q) => q.topic),
    ['Arreglos', 'Arreglos', 'Arreglos', 'Números y operadores', 'Números y operadores'],
  );
  const exam = { ...createExam(), questions };
  assert.equal(validateExam(exam).filter((i) => i.severity === 'error').length, 0);
});

test('captura rápida: respuesta por letra, sufijo (correcta), tolerancia y código', () => {
  const text = [
    'Pregunta 1: ¿Qué imprime?',
    '```js',
    'console.log(1 + "1");',
    '',
    '```',
    'A) 2',
    'B) "11"',
    'C) 11',
    'Respuesta: c',
    '',
    '2) Elige los tipos primitivos',
    '- string (correcta)',
    '- objeto',
    '[x] number',
    '',
    '¿Cuánto es pi con dos decimales?',
    'R: 3,14 ± 0,01',
    '',
    'JavaScript distingue mayúsculas y minúsculas.',
    'Respuesta: verdadero',
  ].join('\n');
  const { questions, issues } = parseQuickText(text);
  assert.deepEqual(issues, []);
  assert.equal(questions.length, 4);
  const [q1, q2, q3, q4] = questions as [SingleQuestion, MultipleQuestion, NumericQuestion, TrueFalseQuestion];
  assert.equal(q1.type, 'single');
  assert.ok(q1.prompt.startsWith('¿Qué imprime?\n```js\nconsole.log(1 + "1");\n\n```'));
  assert.deepEqual(
    q1.options.map((o) => o.correct),
    [false, false, true],
  );
  assert.equal(q2.type, 'multiple');
  assert.equal(q2.prompt, 'Elige los tipos primitivos');
  assert.deepEqual(
    q2.options.map((o) => [o.text, o.correct]),
    [
      ['string', true],
      ['objeto', false],
      ['number', true],
    ],
  );
  assert.equal(q3.answer, 3.14);
  assert.equal(q3.tolerance, 0.01);
  assert.equal(q4.answer, true);
});

test('captura rápida: avisa con número de línea lo que falta y conserva lo válido', () => {
  const text = ['¿Sin respuesta?', '', '¿Sin correcta?', 'a) uno', 'b) dos', '', 'Bien', 'Respuesta: F', '', 'Puntos: 3'].join('\n');
  const { questions, issues } = parseQuickText(text);
  assert.equal(questions.length, 1);
  assert.deepEqual(
    issues.map((i) => i.line),
    [1, 3, 10],
  );
  assert.match(issues[0].message, /Falta la respuesta/);
  assert.match(issues[1].message, /Marca la opción correcta/);
});

test('captura rápida: texto vacío no produce nada', () => {
  assert.deepEqual(parseQuickText('  \n\n'), { questions: [], issues: [] });
});
