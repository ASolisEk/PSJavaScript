/**
 * Banco de preguntas: de dónde puede tomar preguntas el maestro para armar un
 * examen sin escribirlas una por una (los bancos incluidos y sus propios exámenes).
 */
import { fccJavascriptBank } from './certs/fccJavascript';
import { cloneQuestion, usesTopicPicks } from './config';
import { plainText } from './richText';
import { fundamentosQuestions } from './samples/fundamentos';
import type { ExamConfig, Question } from './types';

export interface BankSource {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
}

/** Tema que se muestra para las preguntas que no tienen uno. */
export const NO_TOPIC = 'Sin tema';

/** Bancos incluidos y los demás exámenes del maestro (sin el que está editando). */
export function bankSources(exams: ExamConfig[], excludeId?: string): BankSource[] {
  const own = exams
    .filter((e) => e.id !== excludeId && e.questions.length)
    .map((e) => ({ id: `exam:${e.id}`, title: e.title || 'Examen sin título', description: `De «Mis exámenes» · ${e.questions.length} preguntas`, icon: 'document-text-outline', questions: e.questions }));
  return [
    { id: 'fundamentos', title: 'Fundamentos de JavaScript', description: 'Variables, cadenas, condicionales, funciones, arreglos, objetos y ciclos. Todos los tipos de pregunta.', icon: 'school-outline', questions: fundamentosQuestions() },
    { id: 'fcc', title: 'Certificación freeCodeCamp', description: 'Cuestionarios del currículo JavaScript v9 (en español) y laboratorios de programación.', icon: 'ribbon-outline', questions: fccJavascriptBank() },
    ...own,
  ];
}

/** Preguntas agrupadas por tema, en el orden en que aparecen. */
export function groupByTopic(questions: Question[]): { topic: string; questions: Question[] }[] {
  const map = new Map<string, Question[]>();
  for (const q of questions) {
    const topic = q.topic?.trim() || NO_TOPIC;
    if (!map.has(topic)) map.set(topic, []);
    map.get(topic)!.push(q);
  }
  return [...map].map(([topic, qs]) => ({ topic, questions: qs }));
}

/** Texto para comparar enunciados (sin formato, mayúsculas ni espacios extra). */
export function promptKey(q: Pick<Question, 'prompt' | 'code'>): string {
  return (plainText(q.prompt) + '\n' + (q.code ?? ''))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Busca en el enunciado, el tema y el texto de las opciones. */
export function matchesSearch(q: Question, search: string): boolean {
  const words = promptKey({ prompt: search }).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = promptKey({ prompt: [q.prompt, q.topic ?? '', ...('options' in q ? q.options.map((o) => o.text) : [])].join(' '), code: q.code });
  return words.every((w) => hay.includes(w));
}

/**
 * Agrega copias de las preguntas al final del examen (con identificadores nuevos).
 * Si el examen elige preguntas por tema, los temas nuevos entran con 1 pregunta por alumno
 * para que no queden fuera sin que el maestro lo note.
 */
export function appendQuestions(exam: ExamConfig, questions: Question[]): { exam: ExamConfig; newTopics: string[] } {
  const added = questions.map(cloneQuestion);
  const topicPicks = { ...exam.topicPicks };
  const newTopics: string[] = [];
  if (usesTopicPicks(exam)) {
    for (const q of added) {
      const topic = q.topic?.trim();
      if (topic && !(topicPicks[topic] > 0)) {
        topicPicks[topic] = 1;
        newTopics.push(topic);
      }
    }
  }
  return { exam: { ...exam, topicPicks, questions: [...exam.questions, ...added] }, newTopics };
}
