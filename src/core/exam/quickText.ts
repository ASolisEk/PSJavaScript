/**
 * Captura rápida: el maestro escribe (o pega desde Word) varias preguntas en
 * texto sencillo y se convierten en preguntas del examen.
 *
 *   Tema: Arreglos
 *
 *   1. ¿Qué método agrega un elemento al final?
 *   a) shift()
 *   *b) push()          ← el asterisco marca la correcta
 *
 *   2. `const` permite reasignar la variable.
 *   Respuesta: Falso    ← verdadero/falso, número o texto (varias con |)
 *
 * Una línea en blanco separa las preguntas. Los bloques ```código``` se respetan.
 */
import { createQuestion, option } from './config';
import type { ChoiceOption, Question } from './types';

export interface QuickTextIssue {
  /** Línea (desde 1) donde empieza la pregunta con el problema. */
  line: number;
  message: string;
}

export interface QuickTextResult {
  questions: Question[];
  issues: QuickTextIssue[];
}

export const QUICK_TEXT_EXAMPLE = `Tema: Arreglos

1. ¿Qué método agrega un elemento al final de un arreglo?
a) shift()
*b) push()
c) pop()
d) unshift()

2. ¿Cuáles de estos valores son falsy? Marca todos.
*a) 0
*b) ""
c) "0"
d) []

3. \`const\` permite reasignar la variable.
Respuesta: Falso

Tema: Números y operadores

4. ¿Cuánto vale \`7 % 3\`?
Respuesta: 1

5. ¿Qué operador compara el valor y también el tipo?
Respuesta: === | triple igual
Puntos: 2
`;

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const TRUE = ['v', 'verdadero', 'cierto', 'true'];
const FALSE = ['f', 'falso', 'false'];

const TOPIC_RE = /^\s*(?:#{1,6}\s+(.*)|tema\s*:\s*(.*))$/i;
const POINTS_RE = /^\s*puntos?\s*:\s*(\d+(?:[.,]\d+)?)\s*$/i;
const ANSWER_RE = /^\s*(?:respuestas?|resp|r)\s*:\s*(.*)$/i;
/** `a) texto`, `b. texto`, `- texto` o `[x] texto`; un `*` o `+` al inicio marca la correcta. */
const OPTION_RE = /^\s*([*+])?\s*(?:\(?([a-zA-Z])[).]|-|•|\[([ xX])\])\s+(.*\S)\s*$/;
const CORRECT_SUFFIX_RE = /\s*(?:\((?:correcta|correcto)\)|✓|✔)\s*$/i;
const NUMBER_RE = /^(-?\d+(?:[.,]\d+)?)(?:\s*(?:±|\+-|\+\/-)\s*(\d+(?:[.,]\d+)?))?$/;
const LETTERS_RE = /^[a-z](?:\s*(?:,|y|e)\s*[a-z])*$/i;
const NUMBERING_RE = /^\s*(?:pregunta\s*)?\d+\s*[).:-]\s*/i;
const toNum = (s: string) => Number(s.replace(',', '.'));

interface Block {
  line: number;
  lines: string[];
}

/** Separa por líneas en blanco sin cortar los bloques de código. */
function splitBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  let fence = false;
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((raw, i) => {
      const isFence = /^\s*```/.test(raw);
      if (!fence && !raw.trim()) {
        cur = null;
        return;
      }
      if (!cur) {
        cur = { line: i + 1, lines: [] };
        blocks.push(cur);
      }
      cur.lines.push(raw);
      if (isFence) fence = !fence;
    });
  return blocks;
}

export function parseQuickText(text: string): QuickTextResult {
  const questions: Question[] = [];
  const issues: QuickTextIssue[] = [];
  let topic = '';

  for (const block of splitBlocks(text)) {
    const prompt: string[] = [];
    const opts: { letter?: string; text: string; correct: boolean }[] = [];
    let answer: string | null = null;
    let points: number | null = null;
    let fence = false;

    for (const raw of block.lines) {
      const isFence = /^\s*```/.test(raw);
      const inCode = fence || isFence;
      if (isFence) fence = !fence;
      const last = opts[opts.length - 1];
      if (inCode) {
        if (last) last.text += '\n' + raw;
        else prompt.push(raw);
        continue;
      }
      let m: RegExpMatchArray | null;
      if ((m = raw.match(TOPIC_RE))) {
        topic = (m[1] ?? m[2] ?? '').trim();
      } else if ((m = raw.match(POINTS_RE))) {
        points = toNum(m[1]);
      } else if (prompt.length && (m = raw.match(ANSWER_RE))) {
        answer = m[1].trim();
      } else if (prompt.length && (m = raw.match(OPTION_RE))) {
        let body = m[4];
        const suffix = CORRECT_SUFFIX_RE.test(body);
        if (suffix) body = body.replace(CORRECT_SUFFIX_RE, '');
        opts.push({ letter: m[2]?.toLowerCase(), text: body.trim(), correct: !!m[1] || m[3] === 'x' || m[3] === 'X' || suffix });
      } else if (last) {
        last.text += '\n' + raw.trim();
      } else {
        prompt.push(prompt.length ? raw : raw.replace(NUMBERING_RE, ''));
      }
    }

    // un bloque con solo «Tema: …» cambia el tema de las siguientes preguntas
    if (!prompt.length && !opts.length && answer === null) {
      if (points !== null) issues.push({ line: block.line, message: '«Puntos:» debe ir dentro de una pregunta.' });
      continue;
    }
    const at = (message: string) => issues.push({ line: block.line, message });
    const promptText = prompt.join('\n').trim();
    if (!promptText) {
      at('Falta el enunciado de la pregunta.');
      continue;
    }

    let q: Question | null = null;
    if (opts.length) {
      if (answer && LETTERS_RE.test(answer)) {
        const wanted = answer.toLowerCase().split(/\s*(?:,|y|e)\s*/);
        opts.forEach((o, i) => (o.correct = o.correct || wanted.includes(o.letter ?? String.fromCharCode(97 + i))));
      }
      const correct = opts.filter((o) => o.correct).length;
      if (opts.length < 2) at('Necesita al menos dos opciones.');
      else if (!correct) at('Marca la opción correcta con * al inicio (por ejemplo «*b) push()») o agrega «Respuesta: b».');
      else {
        const options: ChoiceOption[] = opts.map((o) => option(o.text, o.correct));
        q = { ...createQuestion(correct > 1 ? 'multiple' : 'single'), prompt: promptText, options } as Question;
      }
    } else if (answer === null || !answer) {
      at('Falta la respuesta: agrega opciones (marca la correcta con *) o una línea «Respuesta: …».');
    } else if (TRUE.includes(fold(answer)) || FALSE.includes(fold(answer))) {
      q = { ...createQuestion('truefalse'), prompt: promptText, answer: TRUE.includes(fold(answer)) } as Question;
    } else if (NUMBER_RE.test(answer)) {
      const [, n, tol] = answer.match(NUMBER_RE)!;
      q = { ...createQuestion('numeric'), prompt: promptText, answer: toNum(n), tolerance: tol ? toNum(tol) : 0 } as Question;
    } else {
      const answers = answer
        .split('|')
        .map((a) => a.trim())
        .filter(Boolean);
      q = { ...createQuestion('short'), prompt: promptText, answers } as Question;
    }
    if (!q) continue;
    if (points !== null) {
      if (points > 0) q.points = points;
      else at('Los puntos deben ser mayores que 0; se dejó el valor normal.');
    }
    if (topic) q.topic = topic;
    questions.push(q);
  }
  return { questions, issues };
}

/** Resumen de la respuesta correcta para la vista previa. */
export function answerSummary(q: Question): string {
  switch (q.type) {
    case 'single':
    case 'multiple':
      return q.options
        .map((o, i) => `${o.correct ? '✓ ' : ''}${String.fromCharCode(97 + i)}) ${o.text.split('\n')[0]}`)
        .filter((s) => s.startsWith('✓'))
        .join('   ');
    case 'truefalse':
      return q.answer ? 'Verdadero' : 'Falso';
    case 'numeric':
      return q.tolerance ? `${q.answer} ± ${q.tolerance}` : String(q.answer);
    case 'short':
      return q.answers.join(' | ');
    default:
      return '';
  }
}
