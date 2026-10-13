/**
 * Genera el examen de cada alumno: elige y mezcla preguntas y opciones con una
 * semilla propia y quita todo lo que revelaría las respuestas.
 */
import { hashString, seededRandom, shuffled } from './random';
import type { ExamConfig, Paper, PaperKey, PaperQuestion, Question } from './types';

/** Identificador de línea que no revela su posición correcta. */
function lineId(seed: string, qid: string, index: number): string {
  return 'l' + hashString(`${seed}|${qid}|${index}`).toString(36);
}

function sanitize(q: Question, seed: string, shuffleOptions: boolean, rand: () => number, key: PaperKey): PaperQuestion {
  const base: PaperQuestion = { id: q.id, type: q.type, prompt: q.prompt, points: q.points, ...(q.code ? { code: q.code } : {}) };
  switch (q.type) {
    case 'single':
    case 'multiple': {
      const opts = q.options.filter((o) => o.text.trim()).map((o) => ({ id: o.id, text: o.text }));
      return { ...base, options: shuffleOptions ? shuffled(opts, rand) : opts };
    }
    case 'truefalse':
    case 'short':
    case 'numeric':
      return base;
    case 'output':
      return { ...base, code: q.code, inputs: q.inputs.slice() };
    case 'code': {
      const visible = q.tests.filter((t) => !t.hidden);
      return {
        ...base,
        starter: q.starter,
        tests: visible.map((t) => ({ id: t.id, name: t.name, inputs: t.inputs.slice(), expected: t.expected })),
        hiddenTests: q.tests.length - visible.length,
        match: q.match,
        rules: q.rules.filter((r) => r.pattern.trim()).map((r) => ({ kind: r.kind, pattern: r.pattern, message: r.message })),
      };
    }
    case 'order': {
      const lines = q.lines.map((text, i) => ({ id: lineId(seed, q.id, i), text }));
      key.lineIds[q.id] = lines.map((l) => l.id);
      let mixed = shuffled(lines, rand);
      // que nunca aparezca ya resuelta
      for (let k = 0; k < 5 && lines.length > 1 && mixed.every((l, i) => l.text === lines[i].text); k++) mixed = shuffled(lines, rand);
      if (lines.length > 1 && mixed.every((l, i) => l.text === lines[i].text)) mixed = [...mixed.slice(1), mixed[0]];
      return { ...base, lines: mixed };
    }
  }
}

/** Examen del alumno + clave para calificarlo. La misma semilla produce siempre el mismo examen. */
export function buildPaper(config: ExamConfig, seed: string): { paper: Paper; key: PaperKey } {
  const rand = seededRandom(`${config.id}|${seed}`);
  let qs = config.questions.slice();
  const pick = config.pickCount > 0 ? Math.min(config.pickCount, qs.length) : qs.length;
  if (pick < qs.length) {
    // elige al azar pero conserva el orden original si no se mezclan
    const chosen = new Set(shuffled(qs, rand).slice(0, pick).map((q) => q.id));
    qs = qs.filter((q) => chosen.has(q.id));
  }
  if (config.shuffleQuestions) qs = shuffled(qs, rand);
  const key: PaperKey = { seed, questionIds: qs.map((q) => q.id), lineIds: {} };
  const questions = qs.map((q) => sanitize(q, seed, config.shuffleOptions, rand, key));
  return {
    key,
    paper: {
      examId: config.id,
      title: config.title,
      description: config.description,
      durationMin: config.durationMin,
      totalPoints: questions.reduce((s, q) => s + q.points, 0),
      questions,
      settings: {
        allowRun: config.allowRun,
        allowAssist: config.allowAssist,
        showDiagnostics: config.showDiagnostics,
        blockPaste: config.blockPaste,
        trackFocus: config.trackFocus,
        profileId: config.profileId,
        showResults: config.showResults,
        scale: config.scale,
        passPercent: config.passPercent,
      },
    },
  };
}

/** ¿El alumno ya respondió esta pregunta? */
export function isAnswered(q: PaperQuestion, a: unknown): boolean {
  if (a === null || a === undefined) return false;
  if (q.type === 'truefalse') return typeof a === 'boolean';
  if (Array.isArray(a)) return q.type === 'order' ? a.length > 0 : a.length > 0;
  if (typeof a === 'string') {
    if (q.type === 'code') return a.trim() !== '' && a.trim() !== (q.starter ?? '').trim();
    return a.trim() !== '';
  }
  return false;
}
