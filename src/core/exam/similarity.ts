/**
 * Código parecido entre alumnos (posibles copias) en las preguntas de programación.
 *
 * Se comparan fragmentos de 4 tokens (sin espacios) de cada respuesta, quitando los que vienen
 * del código inicial (todos los tienen). Se marcan dos casos:
 * - «casi idéntico»: mucho texto igual, incluidos nombres, valores y comentarios;
 * - «misma estructura»: igual al cambiar los nombres de variables y los valores.
 * Es una alerta para revisar, no una prueba: en ejercicios cortos dos soluciones correctas
 * pueden parecerse mucho.
 */
import { tokenize } from '../editor/tokenizer';
import type { RoomState } from './room';

export interface SimilarPair {
  questionId: string;
  /** Posición de la pregunta en el examen (1, 2, …), según el orden del banco. */
  index: number;
  a: string;
  b: string;
  aId: string;
  bId: string;
  /** Porcentaje de fragmentos en común (texto tal cual). */
  percent: number;
  /** Porcentaje en común al ignorar nombres y valores. */
  structure: number;
  kind: 'copy' | 'structure';
}

const N = 4;
/** Fragmentos propios mínimos para comparar (respuestas más cortas no dicen nada). */
const MIN_GRAMS = 12;

function grams(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + N <= tokens.length; i++) out.add(tokens.slice(i, i + N).join('\u0001'));
  return out;
}

function tokensOf(code: string, normalize: boolean): string[] {
  return tokenize(code)
    .filter((t) => t.type !== 'space' && !(normalize && t.type === 'comment'))
    .map((t) => {
      if (!normalize) return t.text;
      if (t.type === 'ident' || t.type === 'property' || t.type === 'func') return 'ID';
      if (t.type === 'string' || t.type === 'template') return 'STR';
      if (t.type === 'number') return 'NUM';
      return t.text;
    });
}

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const g of a) if (b.has(g)) common++;
  return common / (a.size + b.size - common);
};

const minus = (a: Set<string>, b: Set<string>) => new Set([...a].filter((x) => !b.has(x)));

/** Parejas de alumnos con respuestas de programación muy parecidas, de mayor a menor parecido. */
export function similarCode(room: RoomState, { copyAt = 0.75, structureAt = 0.95 } = {}): SimilarPair[] {
  const pairs: SimilarPair[] = [];
  const students = Object.values(room.students);
  room.exam.questions.forEach((q, index) => {
    if (q.type !== 'code') return;
    const starterRaw = grams(tokensOf(q.starter ?? '', false));
    const starterNorm = grams(tokensOf(q.starter ?? '', true));
    const answers = students
      .map((s) => {
        const code = typeof s.answers[q.id] === 'string' ? (s.answers[q.id] as string) : '';
        if (!code.trim() || code.trim() === (q.starter ?? '').trim()) return null;
        const raw = minus(grams(tokensOf(code, false)), starterRaw);
        const norm = minus(grams(tokensOf(code, true)), starterNorm);
        return raw.size >= MIN_GRAMS ? { id: s.id, name: s.name, raw, norm } : null;
      })
      .filter((x): x is { id: string; name: string; raw: Set<string>; norm: Set<string> } => !!x);
    for (let i = 0; i < answers.length; i++) {
      for (let j = i + 1; j < answers.length; j++) {
        const raw = jaccard(answers[i].raw, answers[j].raw);
        const norm = jaccard(answers[i].norm, answers[j].norm);
        const kind = raw >= copyAt ? 'copy' : norm >= structureAt && answers[i].norm.size >= 20 ? 'structure' : null;
        if (!kind) continue;
        pairs.push({ questionId: q.id, index: index + 1, a: answers[i].name, b: answers[j].name, aId: answers[i].id, bId: answers[j].id, percent: Math.round(raw * 100), structure: Math.round(norm * 100), kind });
      }
    }
  });
  return pairs.sort((x, y) => y.percent - x.percent || y.structure - x.structure);
}
