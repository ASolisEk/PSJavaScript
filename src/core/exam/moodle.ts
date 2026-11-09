/**
 * Importar preguntas de Moodle y otras plataformas:
 * - GIFT: `::Título:: ¿Pregunta? {=correcta ~incorrecta}`, `{T}`/`{F}`, `{=respuesta =otra}`,
 *   `{#3.14:0.01}`, pesos parciales `~%50%opción`, comentarios `//` y `$CATEGORY: tema`.
 * - Aiken: la pregunta, opciones `A. …` / `A) …` y `ANSWER: B`.
 * El resultado tiene la misma forma que la captura rápida (preguntas y problemas por línea).
 */
import { createQuestion, option } from './config';
import type { QuickTextIssue, QuickTextResult } from './quickText';
import type { ChoiceOption, Question } from './types';

/** ¿Parece GIFT? (bloques de respuesta entre llaves con = o ~, o {T}/{F}). */
export function looksLikeGift(text: string): boolean {
  return /\{\s*[=~#]/.test(text) || /\{\s*(T|F|TRUE|FALSE)\s*[}#]/i.test(text) || /^\s*::[^:]+::/m.test(text);
}

/** ¿Parece Aiken? (líneas «ANSWER: X»). */
export function looksLikeAiken(text: string): boolean {
  return /^\s*ANSWER\s*:\s*[A-Z]\s*$/im.test(text);
}

// ───────────────────────────── GIFT ─────────────────────────────

const ESCAPED = /\\([~=#{}:\\])/g;
const unescape = (s: string) => s.replace(ESCAPED, '$1').replace(/\\n/g, '\n');
/** Quita el formato de Moodle ([html], [markdown]…) y etiquetas HTML sencillas. */
const clean = (s: string) =>
  unescape(s.replace(/^\s*\[(html|markdown|plain|moodle)\]/i, ''))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|span|strong|b|em|i)[^>]*>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

/** Separa por un carácter que no esté escapado con \. */
function splitUnescaped(s: string, re: RegExp): { mark: string; text: string }[] {
  const out: { mark: string; text: string }[] = [];
  let cur = '';
  let mark = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) {
      cur += c + s[i + 1];
      i++;
      continue;
    }
    if (re.test(c)) {
      if (mark || cur.trim()) out.push({ mark, text: cur });
      mark = c;
      cur = '';
      continue;
    }
    cur += c;
  }
  if (mark || cur.trim()) out.push({ mark, text: cur });
  return out;
}

/** Índice de la llave que abre el bloque de respuesta (no escapada). */
function answerBlock(s: string): { start: number; end: number } | null {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') {
      i++;
      continue;
    }
    if (s[i] === '{') {
      for (let j = i + 1; j < s.length; j++) {
        if (s[j] === '\\') {
          j++;
          continue;
        }
        if (s[j] === '}') return { start: i, end: j };
      }
      return null;
    }
  }
  return null;
}

/** Quita la retroalimentación «#…» de una opción (si no está escapada). */
const withoutFeedback = (s: string) => {
  const parts = splitUnescaped(s, /#/);
  return parts.length ? (parts[0].mark ? '' : parts[0].text) : s;
};

function giftQuestion(src: string, topic: string): Question | string {
  let text = src.trim();
  // título opcional ::Título::
  const title = /^::((?:\\:|[^:])*)::/.exec(text);
  if (title) text = text.slice(title[0].length);
  const block = answerBlock(text);
  if (!block) return 'No tiene bloque de respuesta {…}.';
  const before = text.slice(0, block.start).trim();
  const after = text.slice(block.end + 1).trim();
  const body = text.slice(block.start + 1, block.end).trim();
  // pregunta con hueco: «La palabra {=let} declara…» → «La palabra ____ declara…»
  const prompt = clean(after ? `${before} ____ ${after}` : before);
  if (!prompt) return 'La pregunta no tiene enunciado.';
  const base = { prompt, ...(topic ? { topic } : {}) };

  if (!body) return 'Las preguntas abiertas (ensayo) no se pueden calificar solas; usa «Escribir un programa» o respuesta corta.';
  if (/->/.test(body)) return 'Las preguntas de relacionar (->) aún no se pueden importar.';

  // verdadero o falso
  const tf = /^(T|TRUE|F|FALSE)\b/i.exec(body);
  if (tf) return { ...(createQuestion('truefalse') as any), ...base, answer: /^T/i.test(tf[1]) };

  // numérica: {#3.14:0.01} o {#1..5}
  if (body.startsWith('#')) {
    const first = withoutFeedback(splitUnescaped(body.slice(1), /=/)[0]?.text ?? body.slice(1)).trim();
    const range = /^(-?[\d.]+)\.\.(-?[\d.]+)$/.exec(first);
    const tol = /^(-?[\d.]+)(?::([\d.]+))?$/.exec(first);
    if (range) {
      const lo = Number(range[1]);
      const hi = Number(range[2]);
      return { ...(createQuestion('numeric') as any), ...base, answer: (lo + hi) / 2, tolerance: Math.abs(hi - lo) / 2 };
    }
    if (tol) return { ...(createQuestion('numeric') as any), ...base, answer: Number(tol[1]), tolerance: Number(tol[2] ?? 0) };
    return `No se entendió la respuesta numérica «${first}».`;
  }

  const parts = splitUnescaped(body, /[=~]/).filter((p) => p.mark);
  if (!parts.length) return 'No se encontraron opciones (= correcta, ~ incorrecta).';
  const choices = parts.map((p) => {
    let t = withoutFeedback(p.text).trim();
    let weight = p.mark === '=' ? 100 : 0;
    const w = /^%(-?[\d.]+)%/.exec(t);
    if (w) {
      weight = Number(w[1]);
      t = t.slice(w[0].length).trim();
    }
    return { text: clean(t), weight };
  });
  // solo respuestas correctas (=) y sin ~: respuesta corta
  if (parts.every((p) => p.mark === '=')) {
    return { ...(createQuestion('short') as any), ...base, answers: choices.map((c) => c.text).filter(Boolean) };
  }
  const options: ChoiceOption[] = choices.filter((c) => c.text).map((c) => option(c.text, c.weight > 0));
  const right = options.filter((o) => o.correct).length;
  if (options.length < 2) return 'Se necesitan al menos dos opciones.';
  if (!right) return 'Ninguna opción está marcada como correcta (=).';
  if (right === 1) return { ...(createQuestion('single') as any), ...base, options };
  return { ...(createQuestion('multiple') as any), ...base, options, partialCredit: true };
}

export function parseGift(text: string): QuickTextResult {
  const questions: Question[] = [];
  const issues: QuickTextIssue[] = [];
  let topic = '';
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let cur: string[] = [];
  let startLine = 1;
  const flush = () => {
    const src = cur.join('\n').trim();
    cur = [];
    if (!src) return;
    const q = giftQuestion(src, topic);
    if (typeof q === 'string') issues.push({ line: startLine, message: q });
    else questions.push(q);
  };
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*\/\//.test(line)) return;
    const cat = /^\s*\$CATEGORY:\s*(.+)$/i.exec(line);
    if (cat) {
      flush();
      // «$course$/Programación/Arreglos» → «Arreglos»
      topic = cat[1].split('/').filter(Boolean).pop()!.trim();
      return;
    }
    if (!line.trim()) {
      // una línea en blanco termina la pregunta si ya se cerró su bloque de respuesta
      if (answerBlock(cur.join('\n'))) flush();
      return;
    }
    if (!cur.length) startLine = i + 1;
    cur.push(line);
  });
  flush();
  return { questions, issues };
}

// ───────────────────────────── Aiken ─────────────────────────────

export function parseAiken(text: string): QuickTextResult {
  const questions: Question[] = [];
  const issues: QuickTextIssue[] = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let prompt: string[] = [];
  let opts: { letter: string; text: string }[] = [];
  let start = 1;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const ans = /^ANSWER\s*:\s*([A-Z])\s*$/i.exec(line);
    const opt = /^([A-Z])[.)]\s+(.*)$/.exec(line);
    if (ans) {
      const letter = ans[1].toUpperCase();
      if (!prompt.length || opts.length < 2) issues.push({ line: start, message: 'Faltan el enunciado o las opciones (A. …, B. …).' });
      else if (!opts.some((o) => o.letter === letter)) issues.push({ line: i + 1, message: `La respuesta ${letter} no es una de las opciones.` });
      else questions.push({ ...(createQuestion('single') as any), prompt: prompt.join('\n'), options: opts.map((o) => option(o.text, o.letter === letter)) });
      prompt = [];
      opts = [];
      return;
    }
    if (opt && prompt.length) opts.push({ letter: opt[1].toUpperCase(), text: opt[2] });
    else {
      if (!prompt.length) start = i + 1;
      if (opts.length) {
        // texto suelto después de las opciones: continúa la última
        opts[opts.length - 1].text += ` ${line}`;
      } else prompt.push(line);
    }
  });
  if (prompt.length) issues.push({ line: start, message: 'La última pregunta no tiene «ANSWER: …».' });
  return { questions, issues };
}
