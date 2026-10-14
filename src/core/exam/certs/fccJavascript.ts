/**
 * Simulacro de la certificación «JavaScript» de freeCodeCamp (currículo v9).
 *
 * El examen real se presenta en la aplicación de exámenes de freeCodeCamp y sus
 * preguntas no son públicas. El simulacro usa los mismos temas y los mismos
 * ejercicios del currículo: las preguntas de los 27 cuestionarios (una respuesta
 * correcta y tres distractores, traducidas al español con el mismo código) y los
 * laboratorios que se pueden resolver sin el DOM ni la red.
 *
 * Criterios tomados del currículo:
 * - Cada módulo termina con un cuestionario que se aprueba con 90 % (18 de 20).
 * - Los laboratorios se aprueban cuando pasan todas sus pruebas.
 */
import { createExam } from '../config';
import { hashString, randomId } from '../random';
import type { CodeQuestion, ExamConfig, Question, SingleQuestion } from '../types';
import { FCC_JAVASCRIPT_LABS, FccLab } from './fccJavascriptLabs';
import { FCC_JAVASCRIPT_QUIZZES, FccQuiz } from './fccJavascriptQuizzes';
import { FCC_JAVASCRIPT_QUIZZES_ES } from './fccJavascriptQuizzesEs';

export const FCC_JAVASCRIPT_URL = 'https://www.freecodecamp.org/learn/javascript-v9/';
/** Tema de las preguntas de programación (laboratorios). */
export const LAB_TOPIC = 'Laboratorios (programación)';
/** Porcentaje mínimo, igual que los cuestionarios de freeCodeCamp (18 de 20). */
export const FCC_PASS_PERCENT = 90;

/** Configuración del simulacro: preguntas por tema y laboratorios por alumno. */
export const SIMULACRO = { perTopic: 2, labs: 3, durationMin: 90, labPoints: 4 };

const CREDIT = `Basado en el currículo «JavaScript» de freeCodeCamp (${FCC_JAVASCRIPT_URL}), contenido CC BY-SA 4.0.`;

/** Identificador que no revela si la opción es la correcta. */
const optionId = (qid: string, i: number) => 'o' + hashString(`${qid}|${i}`).toString(36);
const shortBlock = (block: string) => block.replace(/^(quiz|lab)-/, '').replace(/-js$/, '');

/** Preguntas del cuestionario en español (o en el original si falta la traducción). */
function quizQuestions(quiz: FccQuiz): SingleQuestion[] {
  const es = FCC_JAVASCRIPT_QUIZZES_ES[quiz.block];
  const source = es?.length === quiz.questions.length ? es : quiz.questions;
  return source.map((q, i) => {
    const id = `fccjs-${shortBlock(quiz.block)}-${i + 1}`;
    return {
      id,
      type: 'single',
      prompt: q.q,
      points: 1,
      topic: quiz.topic,
      options: [q.a, ...q.d].map((text, k) => ({ id: optionId(id, k), text, correct: k === 0 })),
    };
  });
}

function labQuestion(lab: FccLab): CodeQuestion {
  const id = `fccjs-lab-${shortBlock(lab.block)}`;
  return {
    id,
    type: 'code',
    prompt: `**${lab.title}**\n\n${lab.prompt}`,
    points: SIMULACRO.labPoints,
    topic: LAB_TOPIC,
    starter: lab.starter,
    solution: lab.solution,
    match: 'exact',
    tests: lab.tests.map((t, k) => ({ id: `${id}-t${k + 1}`, name: t.call, inputs: [], expected: t.expected, hidden: !!t.hidden, call: t.call })),
    rules: (lab.rules ?? []).map((r, k) => ({ id: `${id}-r${k + 1}`, ...r })),
  };
}

/** Temas del simulacro en el orden del currículo. */
export function fccJavascriptTopics(): { topic: string; module: string; title: string; questions: number; labs: number }[] {
  return FCC_JAVASCRIPT_QUIZZES.map((z) => ({
    topic: z.topic,
    module: z.module,
    title: z.title,
    questions: z.questions.length,
    labs: FCC_JAVASCRIPT_LABS.filter((l) => l.module === z.module).length,
  }));
}

/** Banco completo: todas las preguntas de los cuestionarios y todos los laboratorios. */
export function fccJavascriptBank(): Question[] {
  return [...FCC_JAVASCRIPT_QUIZZES.flatMap(quizQuestions), ...FCC_JAVASCRIPT_LABS.map(labQuestion)];
}

function topicPicks(perTopic: number, labs: number): Record<string, number> {
  const picks: Record<string, number> = {};
  for (const z of FCC_JAVASCRIPT_QUIZZES) picks[z.topic] = perTopic;
  picks[LAB_TOPIC] = labs;
  return picks;
}

const perStudent = () => FCC_JAVASCRIPT_QUIZZES.length * SIMULACRO.perTopic + SIMULACRO.labs;

/** Simulacro con condiciones de examen: tiempo límite, sin ayudas y sin ver las respuestas. */
export function fccJavascriptSimulacro(): ExamConfig {
  return createExam({
    title: 'Simulacro: Certificación JavaScript (freeCodeCamp)',
    author: 'freeCodeCamp (adaptación PSJavaScript)',
    description:
      `Simulacro del examen de la certificación «JavaScript» de freeCodeCamp. Recibes ${SIMULACRO.perTopic} preguntas al azar de cada uno de los ${FCC_JAVASCRIPT_QUIZZES.length} temas del currículo ` +
      `y ${SIMULACRO.labs} laboratorios de programación (${perStudent()} en total). Las preguntas están traducidas al español; el código se deja igual que en freeCodeCamp. ` +
      `Para aprobar necesitas ${FCC_PASS_PERCENT} %, el mismo criterio de los cuestionarios de freeCodeCamp (18 de 20). ` +
      `En los laboratorios escribe la función que se pide: cada prueba la llama y compara lo que devuelve. ${CREDIT}`,
    durationMin: SIMULACRO.durationMin,
    topicPicks: topicPicks(SIMULACRO.perTopic, SIMULACRO.labs),
    shuffleQuestions: true,
    shuffleOptions: true,
    passPercent: FCC_PASS_PERCENT,
    scale: 100,
    showResults: 'detailed',
    profileId: 'flexible',
    allowRun: true,
    allowAssist: false,
    showDiagnostics: true,
    blockPaste: true,
    trackFocus: true,
    questions: fccJavascriptBank(),
  });
}

/** Copia para practicar: mismas preguntas, sin tiempo, con ayudas y mostrando las respuestas correctas al final. */
export function fccJavascriptPractica(): ExamConfig {
  const sim = fccJavascriptSimulacro();
  return {
    ...sim,
    id: randomId('ex'),
    title: 'Práctica: Certificación JavaScript (freeCodeCamp)',
    description:
      `Práctica para la certificación «JavaScript» de freeCodeCamp. Cada intento trae ${perStudent()} preguntas distintas (${SIMULACRO.perTopic} por tema y ${SIMULACRO.labs} laboratorios), sin límite de tiempo. ` +
      `Al terminar verás tu resultado por tema y la respuesta correcta de cada pregunta. Repite hasta superar ${FCC_PASS_PERCENT} % en todos los temas. ${CREDIT}`,
    durationMin: 0,
    showResults: 'review',
    allowAssist: true,
    blockPaste: false,
    trackFocus: false,
  };
}

/** Práctica de un solo tema: todas las preguntas de su cuestionario y sus laboratorios (o laboratorios al azar). */
export function fccJavascriptTopicPractice(topic: string): ExamConfig {
  const base = fccJavascriptPractica();
  if (topic === LAB_TOPIC) {
    return {
      ...base,
      title: `Práctica: ${LAB_TOPIC}`,
      description: `5 laboratorios al azar de la certificación «JavaScript» de freeCodeCamp. Escribe la función que se pide: cada prueba la llama y compara lo que devuelve. ${CREDIT}`,
      topicPicks: { [LAB_TOPIC]: 5 },
      questions: FCC_JAVASCRIPT_LABS.map(labQuestion),
    };
  }
  const quiz = FCC_JAVASCRIPT_QUIZZES.find((z) => z.topic === topic);
  if (!quiz) throw new Error(`No existe el tema «${topic}».`);
  const labs = FCC_JAVASCRIPT_LABS.filter((l) => l.module === quiz.module).map((l) => ({ ...labQuestion(l), topic: quiz.topic }));
  const [need, of] = quiz.passing;
  return {
    ...base,
    title: `Práctica: ${quiz.topic}`,
    description:
      `Cuestionario de «${quiz.topic}» de freeCodeCamp (${quiz.questions.length} preguntas${labs.length ? ` y ${labs.length} laboratorio${labs.length > 1 ? 's' : ''}` : ''}). ` +
      `En freeCodeCamp se aprueba con ${need} de ${of}. Al terminar verás la respuesta correcta de cada pregunta. ${CREDIT}`,
    topicPicks: {},
    questions: [...quizQuestions(quiz), ...labs],
  };
}

/** Prácticas que el alumno puede hacer por su cuenta (sin maestro). */
export interface PracticeOption {
  key: string;
  title: string;
  description: string;
}

export function practiceOptions(): { full: PracticeOption[]; topics: PracticeOption[] } {
  const per = perStudent();
  return {
    full: [
      { key: 'simulacro', title: 'Simulacro completo', description: `${per} preguntas · ${SIMULACRO.durationMin} min · sin ayudas, como el examen` },
      { key: 'practica', title: 'Práctica sin tiempo', description: `${per} preguntas distintas en cada intento, con ayudas del editor` },
    ],
    topics: [
      ...fccJavascriptTopics().map((x) => ({ key: `tema:${x.topic}`, title: x.topic, description: `${x.questions} preguntas${x.labs ? ` + ${x.labs} lab.` : ''}` })),
      { key: `tema:${LAB_TOPIC}`, title: LAB_TOPIC, description: `5 de ${FCC_JAVASCRIPT_LABS.length} al azar` },
    ],
  };
}

/** Configuración de una práctica individual. Al practicar solo siempre se muestran las respuestas al final. */
export function practiceExam(key: string): ExamConfig {
  if (key === 'simulacro') return { ...fccJavascriptSimulacro(), showResults: 'review' };
  if (key === 'practica') return fccJavascriptPractica();
  if (key.startsWith('tema:')) return fccJavascriptTopicPractice(key.slice(5));
  throw new Error(`Práctica desconocida: ${key}`);
}
