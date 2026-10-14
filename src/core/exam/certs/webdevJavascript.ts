/**
 * Simulacro del curso «Learn JavaScript» de web.dev (https://web.dev/learn/javascript?hl=es-419).
 *
 * El curso no tiene un examen de certificación oficial: cada lección termina con
 * una autoevaluación («Comprueba tu comprensión»). El simulacro reúne las 26
 * lecciones del curso como temas, con preguntas sobre sus definiciones y sus
 * ejemplos de código, más ejercicios de programación que se califican con
 * pruebas que llaman a la función del alumno.
 *
 * Criterios elegidos para el simulacro (el curso no fija ninguno):
 * - 2 preguntas al azar de cada lección y 3 ejercicios de programación.
 * - Se aprueba con 80 %.
 * - Cada pregunta vale 1 punto y cada ejercicio 4, así todos los alumnos tienen el mismo total.
 */
import { createExam } from '../config';
import { hashString, randomId } from '../random';
import type { CodeQuestion, ExamConfig, MultipleQuestion, OutputQuestion, Question, SingleQuestion, TrueFalseQuestion } from '../types';
import { WEBDEV_JAVASCRIPT_EXERCISES, WEBDEV_JAVASCRIPT_LESSONS, WebdevExercise, WebdevItem, WebdevLesson } from './webdevJavascriptBank';

export const WEBDEV_JAVASCRIPT_URL = 'https://web.dev/learn/javascript?hl=es-419';
/** Tema de las preguntas de programación. */
export const WEBDEV_EXERCISE_TOPIC = 'Ejercicios de programación';
/** Porcentaje mínimo para aprobar el simulacro. */
export const WEBDEV_PASS_PERCENT = 80;

/** Configuración del simulacro: preguntas por tema y ejercicios por alumno. */
export const WEBDEV_SIMULACRO = { perTopic: 2, exercises: 3, durationMin: 90, exercisePoints: 4 };

const CREDIT = `Basado en el curso «Learn JavaScript» de web.dev (${WEBDEV_JAVASCRIPT_URL}), contenido CC BY 4.0.`;

const optionId = (qid: string, i: number) => 'o' + hashString(`${qid}|${i}`).toString(36);
const lessonSlug = (l: WebdevLesson) =>
  l.topic
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function itemQuestion(lesson: WebdevLesson, item: WebdevItem, i: number): Question {
  const id = `webdev-${lessonSlug(lesson)}-${i + 1}`;
  const base = { id, topic: lesson.topic, ...('code' in item && item.code ? { code: item.code } : {}) };
  switch (item.kind) {
    case 'multiple':
      return {
        ...base,
        type: 'multiple',
        prompt: item.q,
        points: 1,
        partialCredit: true,
        options: [...item.a.map((text) => ({ text, correct: true })), ...item.d.map((text) => ({ text, correct: false }))].map((o, k) => ({ id: optionId(id, k), ...o })),
      } satisfies MultipleQuestion;
    case 'truefalse':
      return { ...base, type: 'truefalse', prompt: `Verdadero o falso: ${item.q}`, points: 1, answer: item.answer } satisfies TrueFalseQuestion;
    case 'output':
      return { ...base, type: 'output', prompt: '¿Qué muestra en la consola el siguiente programa?', points: 1, code: item.code, inputs: [], match: 'flexible' } satisfies OutputQuestion;
    default:
      return {
        ...base,
        type: 'single',
        prompt: item.q,
        points: 1,
        options: [item.a, ...item.d].map((text, k) => ({ id: optionId(id, k), text, correct: k === 0 })),
      } satisfies SingleQuestion;
  }
}

function lessonQuestions(lesson: WebdevLesson): Question[] {
  return lesson.items.map((item, i) => itemQuestion(lesson, item, i));
}

function exerciseQuestion(ex: WebdevExercise, topic = WEBDEV_EXERCISE_TOPIC): CodeQuestion {
  const id = `webdev-ej-${ex.id}`;
  return {
    id,
    type: 'code',
    prompt: `**${ex.title}** (${ex.topic})\n\n${ex.prompt}`,
    points: WEBDEV_SIMULACRO.exercisePoints,
    topic,
    starter: ex.starter,
    solution: ex.solution,
    match: 'exact',
    tests: ex.tests.map((t, k) => ({ id: `${id}-t${k + 1}`, name: t.call, inputs: [], expected: t.expected, hidden: !!t.hidden, call: t.call })),
    rules: (ex.rules ?? []).map((r, k) => ({ id: `${id}-r${k + 1}`, ...r })),
  };
}

/** Temas del simulacro en el orden del curso. */
export function webdevJavascriptTopics(): { topic: string; module: string; summary: string; questions: number; exercises: number }[] {
  return WEBDEV_JAVASCRIPT_LESSONS.map((l) => ({
    topic: l.topic,
    module: l.module,
    summary: l.summary,
    questions: l.items.length,
    exercises: WEBDEV_JAVASCRIPT_EXERCISES.filter((e) => e.topic === l.topic).length,
  }));
}

/** Banco completo: todas las preguntas de las lecciones y todos los ejercicios. */
export function webdevJavascriptBank(): Question[] {
  return [...WEBDEV_JAVASCRIPT_LESSONS.flatMap(lessonQuestions), ...WEBDEV_JAVASCRIPT_EXERCISES.map((e) => exerciseQuestion(e))];
}

const perStudent = () => WEBDEV_JAVASCRIPT_LESSONS.length * WEBDEV_SIMULACRO.perTopic + WEBDEV_SIMULACRO.exercises;

function topicPicks(): Record<string, number> {
  const picks: Record<string, number> = {};
  for (const l of WEBDEV_JAVASCRIPT_LESSONS) picks[l.topic] = WEBDEV_SIMULACRO.perTopic;
  picks[WEBDEV_EXERCISE_TOPIC] = WEBDEV_SIMULACRO.exercises;
  return picks;
}

/** Simulacro con condiciones de examen: tiempo límite, sin ayudas y sin ver las respuestas. */
export function webdevJavascriptSimulacro(): ExamConfig {
  return createExam({
    title: 'Simulacro: Learn JavaScript (web.dev)',
    author: 'web.dev (adaptación PSJavaScript)',
    description:
      `Simulacro del curso «Learn JavaScript» de web.dev. Recibes ${WEBDEV_SIMULACRO.perTopic} preguntas al azar de cada una de las ${WEBDEV_JAVASCRIPT_LESSONS.length} lecciones del curso ` +
      `(tipos de datos, variables, comparación, flujo de control, funciones, objetos, colecciones y clases) y ${WEBDEV_SIMULACRO.exercises} ejercicios de programación (${perStudent()} en total). ` +
      `Hay preguntas de opción única, de opción múltiple, de verdadero o falso y de «¿qué muestra este programa?». Para aprobar necesitas ${WEBDEV_PASS_PERCENT} %. ` +
      `En los ejercicios escribe la función o la clase que se pide: cada prueba la llama y compara lo que devuelve. ${CREDIT}`,
    durationMin: WEBDEV_SIMULACRO.durationMin,
    topicPicks: topicPicks(),
    shuffleQuestions: true,
    shuffleOptions: true,
    passPercent: WEBDEV_PASS_PERCENT,
    scale: 100,
    showResults: 'detailed',
    profileId: 'flexible',
    allowRun: true,
    allowAssist: false,
    showDiagnostics: true,
    blockPaste: true,
    trackFocus: true,
    questions: webdevJavascriptBank(),
  });
}

/** Copia para practicar: mismas preguntas, sin tiempo, con ayudas y mostrando las respuestas correctas al final. */
export function webdevJavascriptPractica(): ExamConfig {
  const sim = webdevJavascriptSimulacro();
  return {
    ...sim,
    id: randomId('ex'),
    title: 'Práctica: Learn JavaScript (web.dev)',
    description:
      `Práctica para el curso «Learn JavaScript» de web.dev. Cada intento trae ${perStudent()} preguntas distintas (${WEBDEV_SIMULACRO.perTopic} por lección y ${WEBDEV_SIMULACRO.exercises} ejercicios), sin límite de tiempo. ` +
      `Al terminar verás tu resultado por tema y la respuesta correcta de cada pregunta. Repite hasta superar ${WEBDEV_PASS_PERCENT} % en todos los temas. ${CREDIT}`,
    durationMin: 0,
    showResults: 'review',
    allowAssist: true,
    blockPaste: false,
    trackFocus: false,
  };
}

/** Práctica de un tema: todas las preguntas de la lección y sus ejercicios (o ejercicios al azar). */
export function webdevJavascriptTopicPractice(topic: string): ExamConfig {
  const base = webdevJavascriptPractica();
  if (topic === WEBDEV_EXERCISE_TOPIC) {
    return {
      ...base,
      title: `Práctica: ${WEBDEV_EXERCISE_TOPIC} (web.dev)`,
      description: `5 ejercicios al azar del curso «Learn JavaScript» de web.dev. Escribe la función o la clase que se pide: cada prueba la llama y compara lo que devuelve. ${CREDIT}`,
      topicPicks: { [WEBDEV_EXERCISE_TOPIC]: 5 },
      questions: WEBDEV_JAVASCRIPT_EXERCISES.map((e) => exerciseQuestion(e)),
    };
  }
  const lesson = WEBDEV_JAVASCRIPT_LESSONS.find((l) => l.topic === topic);
  if (!lesson) throw new Error(`No existe el tema «${topic}».`);
  const exercises = WEBDEV_JAVASCRIPT_EXERCISES.filter((e) => e.topic === topic).map((e) => exerciseQuestion(e, topic));
  return {
    ...base,
    title: `Práctica: ${topic} (web.dev)`,
    description:
      `${lesson.summary}\n\nPreguntas de la lección «${topic}» (${lesson.items.length}${exercises.length ? ` y ${exercises.length} ejercicio${exercises.length > 1 ? 's' : ''}` : ''}). ` +
      `Al terminar verás la respuesta correcta de cada pregunta. ${CREDIT}`,
    topicPicks: {},
    questions: [...lessonQuestions(lesson), ...exercises],
  };
}

export interface PracticeOption {
  key: string;
  title: string;
  description: string;
}

export function webdevPracticeOptions(): { full: PracticeOption[]; topics: PracticeOption[] } {
  const per = perStudent();
  return {
    full: [
      { key: 'simulacro', title: 'Simulacro completo', description: `${per} preguntas · ${WEBDEV_SIMULACRO.durationMin} min · sin ayudas, como el examen` },
      { key: 'practica', title: 'Práctica sin tiempo', description: `${per} preguntas distintas en cada intento, con ayudas del editor` },
    ],
    topics: [
      ...webdevJavascriptTopics().map((x) => ({ key: `tema:${x.topic}`, title: x.topic, description: `${x.questions} preguntas${x.exercises ? ` + ${x.exercises} ej.` : ''}` })),
      { key: `tema:${WEBDEV_EXERCISE_TOPIC}`, title: WEBDEV_EXERCISE_TOPIC, description: `5 de ${WEBDEV_JAVASCRIPT_EXERCISES.length} al azar` },
    ],
  };
}

export function webdevPracticeExam(key: string): ExamConfig {
  if (key === 'simulacro') return { ...webdevJavascriptSimulacro(), showResults: 'review' };
  if (key === 'practica') return webdevJavascriptPractica();
  if (key.startsWith('tema:')) return webdevJavascriptTopicPractice(key.slice(5));
  throw new Error(`Práctica desconocida: ${key}`);
}
