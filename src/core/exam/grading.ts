/**
 * Calificación automática. Se ejecuta en el equipo del maestro con la
 * configuración completa (respuestas y casos ocultos).
 */
import { tokenize } from '../editor/tokenizer';
import { getProfile, Profile } from '../profiles';
import { runToEnd } from '../runner';
import type {
  AnswerValue,
  Answers,
  CodeQuestion,
  CodeRule,
  ExamConfig,
  GradeResult,
  OutputMatch,
  PaperKey,
  Question,
  QuestionResult,
  StudentResultView,
  TestResult,
} from './types';

/** Pasos máximos por ejecución al calificar (evita que un ciclo infinito congele al maestro). */
export const GRADING_MAX_STEPS = 300_000;

const round2 = (n: number) => Math.round(n * 100) / 100;

// ───────────────────────────── ejecutar y comparar ─────────────────────────────

export interface ProgramRun {
  output: string;
  error: string | null;
  /** El programa pidió más datos de los que trae el caso de prueba. */
  needsInput: boolean;
  /** Se detuvo por exceder el límite de pasos. */
  tooLong: boolean;
}

/** Ejecuta un programa completo con los datos indicados y devuelve su salida en consola. */
export function runProgram(code: string, profile: Profile, inputs: string[], maxSteps = GRADING_MAX_STEPS): ProgramRun {
  const r = runToEnd(code, profile, inputs, maxSteps);
  let lines = r.output.filter((l) => l.kind === 'log' || l.kind === 'info' || l.kind === 'warn' || l.kind === 'alert' || l.kind === 'error');
  // la última línea de error es el mensaje del intérprete, no parte de la salida del programa
  if (r.error && lines.length && lines[lines.length - 1].kind === 'error') lines = lines.slice(0, -1);
  const output = lines.map((l) => l.text).join('\n');
  let error: string | null = null;
  if (r.error) error = `${r.error.name}${r.error.line ? ` (línea ${r.error.line})` : ''}: ${r.error.message}`;
  return { output, error, needsInput: r.status === 'input', tooLong: r.status === 'paused' };
}

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

function cleanLines(s: string): string[] {
  const lines = s.replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\s+$/, ''));
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  while (lines.length && !lines[0]) lines.shift();
  return lines;
}

function flexible(s: string): string {
  return cleanLines(stripAccents(s).toLowerCase())
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function numbersIn(s: string): number[] {
  return (s.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? []).map(Number);
}

/** ¿La salida obtenida coincide con la esperada según el modo? */
export function outputMatches(actual: string, expected: string, mode: OutputMatch): boolean {
  switch (mode) {
    case 'exact':
      return cleanLines(actual).join('\n') === cleanLines(expected).join('\n');
    case 'flexible':
      return flexible(actual) === flexible(expected);
    case 'contains': {
      const e = flexible(expected);
      return e === '' ? true : flexible(actual).includes(e);
    }
    case 'numbers': {
      const a = numbersIn(actual);
      const e = numbersIn(expected);
      return a.length === e.length && a.every((x, i) => Math.abs(x - e[i]) <= 1e-6 * Math.max(1, Math.abs(e[i])));
    }
  }
}

/** Código sin comentarios ni textos (para revisar requisitos como "usar for"). */
function codeSkeleton(code: string): string {
  return tokenize(code)
    .map((t) => (t.type === 'comment' ? ' ' : t.type === 'string' || t.type === 'template' ? '""' : t.text))
    .join('');
}

export function ruleSatisfied(code: string, rule: Pick<CodeRule, 'kind' | 'pattern'>): boolean {
  const p = rule.pattern.trim();
  if (!p) return true;
  const sk = codeSkeleton(code);
  const word = /^[A-Za-z_$][\w$]*$/.test(p);
  const found = word ? new RegExp(`(^|[^\\w$])${p.replace(/\$/g, '\\$')}(?![\\w$])`).test(sk) : sk.includes(p);
  return rule.kind === 'contains' ? found : !found;
}

/** Salidas esperadas calculadas con la solución del maestro (para llenar los casos). */
export function expectedFromSolution(q: Pick<CodeQuestion, 'solution' | 'tests'>, profile: Profile): { id: string; output: string; error: string | null }[] {
  return q.tests.map((t) => {
    const r = runProgram(q.solution, profile, t.inputs);
    return { id: t.id, output: r.output, error: r.error ?? (r.needsInput ? 'El programa pidió más datos de los que tiene el caso.' : r.tooLong ? 'El programa tardó demasiado (¿ciclo infinito?).' : null) };
  });
}

/** Ejecuta un programa contra casos de prueba. */
export function runTests(code: string, tests: { id: string; name: string; inputs: string[]; expected: string; hidden?: boolean }[], match: OutputMatch, profile: Profile): TestResult[] {
  return tests.map((t) => {
    const r = runProgram(code, profile, t.inputs);
    const error = r.error ?? (r.needsInput ? 'El programa pidió más datos (prompt) de los que trae este caso.' : r.tooLong ? 'El programa no terminó (¿ciclo infinito?).' : undefined);
    const passed = !error && outputMatches(r.output, t.expected, match);
    const hidden = !!t.hidden;
    return { id: t.id, name: t.name, hidden, passed, inputs: t.inputs, expected: t.expected, actual: r.output, ...(error ? { error } : {}) };
  });
}

// ───────────────────────────── por tipo de pregunta ─────────────────────────────

function normText(s: string, caseSensitive: boolean): string {
  let r = s.trim().replace(/\s+/g, ' ');
  if (!caseSensitive) r = stripAccents(r).toLowerCase();
  return r.replace(/[.;]+$/, '');
}

function parseNumber(s: string): number {
  return Number(s.trim().replace(/\s/g, '').replace(/,(?=\d{1,2}$)/, '.'));
}

/** Longitud de la subsecuencia común más larga. */
function lcs<T>(a: T[], b: T[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

function result(q: Question, fraction: number, feedback: string, extra: Partial<QuestionResult> = {}): QuestionResult {
  const f = Math.max(0, Math.min(1, fraction));
  const score = round2(q.points * f);
  return {
    questionId: q.id,
    type: q.type,
    score,
    max: q.points,
    status: f >= 0.999 ? 'correct' : f > 0 ? 'partial' : 'wrong',
    feedback,
    ...extra,
  };
}

const blank = (q: Question): QuestionResult => ({ questionId: q.id, type: q.type, score: 0, max: q.points, status: 'blank', feedback: 'Sin responder.' });

export function gradeQuestion(q: Question, answer: AnswerValue | undefined, profile: Profile, key?: PaperKey): QuestionResult {
  if (answer === undefined || answer === null || (typeof answer === 'string' && !answer.trim()) || (Array.isArray(answer) && !answer.length)) return blank(q);
  switch (q.type) {
    case 'single': {
      const ok = q.options.find((o) => o.id === answer)?.correct ?? false;
      const right = q.options.find((o) => o.correct);
      return result(q, ok ? 1 : 0, ok ? '¡Correcto!' : `Incorrecto. La respuesta correcta era: ${right?.text ?? '—'}.`);
    }
    case 'multiple': {
      const chosen = new Set(Array.isArray(answer) ? answer : [String(answer)]);
      const correct = q.options.filter((o) => o.correct && o.text.trim());
      const hits = correct.filter((o) => chosen.has(o.id)).length;
      const wrong = q.options.filter((o) => !o.correct && chosen.has(o.id)).length;
      const exact = hits === correct.length && wrong === 0;
      const f = exact ? 1 : q.partialCredit ? (hits - wrong) / Math.max(1, correct.length) : 0;
      return result(q, f, exact ? '¡Correcto!' : `Acertaste ${hits} de ${correct.length}${wrong ? ` y marcaste ${wrong} incorrecta${wrong > 1 ? 's' : ''}` : ''}.`);
    }
    case 'truefalse': {
      const ok = answer === q.answer || String(answer) === String(q.answer);
      return result(q, ok ? 1 : 0, ok ? '¡Correcto!' : `Incorrecto: la afirmación es ${q.answer ? 'verdadera' : 'falsa'}.`);
    }
    case 'short': {
      const a = normText(String(answer), q.caseSensitive);
      const ok = q.answers.some((x) => x.trim() && normText(x, q.caseSensitive) === a);
      return result(q, ok ? 1 : 0, ok ? '¡Correcto!' : `Incorrecto. Respuesta esperada: ${q.answers.filter((x) => x.trim()).join(' / ')}.`);
    }
    case 'numeric': {
      const n = parseNumber(String(answer));
      const ok = Number.isFinite(n) && Math.abs(n - q.answer) <= Math.abs(q.tolerance) + 1e-9;
      return result(q, ok ? 1 : 0, ok ? '¡Correcto!' : Number.isFinite(n) ? `Incorrecto. La respuesta era ${q.answer}.` : 'La respuesta no es un número.');
    }
    case 'output': {
      const r = runProgram(q.code ?? '', profile, q.inputs);
      const expected = r.error ? `${r.output}\n${r.error}`.trim() : r.output;
      const ok = outputMatches(String(answer), expected, q.match);
      return result(q, ok ? 1 : 0, ok ? '¡Correcto!' : 'La salida no coincide con la del programa.', {
        tests: [{ id: 'salida', name: 'Salida del programa', hidden: false, passed: ok, expected, actual: String(answer) }],
      });
    }
    case 'code': {
      const code = String(answer);
      const tests = runTests(code, q.tests, q.match, profile);
      const rules = q.rules.filter((r) => r.pattern.trim()).map((r) => ({ message: r.message || (r.kind === 'contains' ? `Debe usar «${r.pattern}»` : `No debe usar «${r.pattern}»`), passed: ruleSatisfied(code, r) }));
      const total = tests.length + rules.length;
      const passed = tests.filter((t) => t.passed).length + rules.filter((r) => r.passed).length;
      const f = total ? passed / total : 0;
      const tp = tests.filter((t) => t.passed).length;
      const failedRules = rules.filter((r) => !r.passed);
      let feedback = `Pasó ${tp} de ${tests.length} casos de prueba.`;
      if (failedRules.length) feedback += ` Requisitos sin cumplir: ${failedRules.map((r) => r.message).join('; ')}.`;
      return result(q, f, feedback, { tests, rules });
    }
    case 'order': {
      const ids = key?.lineIds[q.id];
      const given = Array.isArray(answer) ? answer : [];
      if (!ids) return result(q, 0, 'No se pudo calificar (falta la clave).');
      // líneas con el mismo texto son intercambiables
      const textOf = new Map(ids.map((id, i) => [id, q.lines[i]?.trim() ?? '']));
      const expectedTexts = q.lines.map((l) => l.trim());
      const givenTexts = given.map((id) => textOf.get(id) ?? '?');
      const exact = givenTexts.length === expectedTexts.length && givenTexts.every((t, i) => t === expectedTexts[i]);
      const f = exact ? 1 : q.partialCredit ? Math.max(0, (lcs(givenTexts, expectedTexts) - 1) / Math.max(1, expectedTexts.length - 1)) : 0;
      return result(q, f, exact ? '¡Correcto!' : 'El orden no es correcto.');
    }
  }
}

export function scoreToGrade(score: number, max: number, scale: number): { percent: number; grade: number } {
  const percent = max > 0 ? (score / max) * 100 : 0;
  const grade = Math.round((percent / 100) * scale * 10) / 10;
  return { percent: Math.round(percent * 10) / 10, grade };
}

/** Califica el examen completo de un alumno. */
export function gradePaper(config: ExamConfig, key: PaperKey, answers: Answers, overrides: Record<string, number> = {}): GradeResult {
  const profile = getProfile(config.profileId);
  const byId = new Map(config.questions.map((q) => [q.id, q]));
  const questions: QuestionResult[] = [];
  for (const id of key.questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    let r: QuestionResult;
    try {
      r = gradeQuestion(q, answers[id], profile, key);
    } catch (e: any) {
      r = { questionId: q.id, type: q.type, score: 0, max: q.points, status: 'wrong', feedback: `No se pudo calificar: ${e?.message ?? e}` };
    }
    if (overrides[id] !== undefined) {
      const s = Math.max(0, Math.min(q.points, overrides[id]));
      r = { ...r, score: round2(s), manual: true, status: s >= q.points ? 'correct' : s > 0 ? 'partial' : r.status === 'blank' ? 'blank' : 'wrong' };
    }
    questions.push(r);
  }
  return summarize(questions, config.scale, config.passPercent);
}

/** Recalcula totales (p. ej. después de un ajuste manual). */
export function summarize(questions: QuestionResult[], scale: number, passPercent: number): GradeResult {
  const score = round2(questions.reduce((s, q) => s + q.score, 0));
  const max = round2(questions.reduce((s, q) => s + q.max, 0));
  const { percent, grade } = scoreToGrade(score, max, scale);
  return { score, max, percent, grade, scale, passed: percent >= passPercent, questions, gradedAt: Date.now() };
}

/** Lo que puede ver el alumno de su resultado. */
export function studentView(r: GradeResult, visibility: ExamConfig['showResults']): StudentResultView {
  if (visibility === 'none') return { visibility };
  const head = { visibility, grade: r.grade, scale: r.scale, percent: r.percent, passed: r.passed, score: r.score, max: r.max };
  if (visibility === 'score') return head;
  return {
    ...head,
    questions: r.questions.map((q) => ({
      questionId: q.questionId,
      status: q.status,
      score: q.score,
      max: q.max,
      // en preguntas de programación solo se detallan los casos visibles
      feedback: q.type === 'single' || q.type === 'short' || q.type === 'numeric' || q.type === 'truefalse' ? (q.status === 'correct' ? '¡Correcto!' : 'Incorrecto.') : q.feedback,
      // los casos ocultos y la salida de «¿Qué imprime?» no se revelan (otros alumnos pueden seguir en el examen)
      tests: q.tests?.map((t) => (t.hidden || q.type === 'output' ? { id: t.id, name: t.name, hidden: t.hidden, passed: t.passed } : t)),
    })),
  };
}
