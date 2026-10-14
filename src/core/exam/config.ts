/**
 * Creación, validación, importación y exportación de configuraciones de examen.
 */
import { DEFAULT_PROFILE_ID, PROFILES } from '../profiles';
import { randomId } from './random';
import { FUNDAMENTOS_PER_TOPIC, FUNDAMENTOS_TOPICS, fundamentosQuestions } from './samples/fundamentos';
import type { ChoiceOption, CodeRule, CodeTest, ExamConfig, OutputMatch, Question, QuestionType, ResultsVisibility } from './types';

export const EXAM_FORMAT = 'psjavascript-exam';

export interface QuestionTypeInfo {
  type: QuestionType;
  label: string;
  description: string;
  icon: string;
  /** Se califica ejecutando código. */
  usesCode: boolean;
}

export const QUESTION_TYPES: QuestionTypeInfo[] = [
  { type: 'single', label: 'Opción múltiple', description: 'Una sola respuesta correcta entre varias opciones.', icon: 'radio-button-on-outline', usesCode: false },
  { type: 'multiple', label: 'Varias respuestas', description: 'El alumno marca todas las opciones correctas.', icon: 'checkbox-outline', usesCode: false },
  { type: 'truefalse', label: 'Verdadero o falso', description: 'Una afirmación que es verdadera o falsa.', icon: 'contrast-outline', usesCode: false },
  { type: 'short', label: 'Respuesta corta', description: 'Una palabra o frase; aceptas una o varias respuestas.', icon: 'text-outline', usesCode: false },
  { type: 'numeric', label: 'Respuesta numérica', description: 'Un número, con margen de tolerancia opcional.', icon: 'calculator-outline', usesCode: false },
  { type: 'output', label: '¿Qué imprime?', description: 'Muestras un programa y el alumno escribe la salida.', icon: 'terminal-outline', usesCode: true },
  { type: 'code', label: 'Escribir un programa', description: 'El alumno programa; se califica con casos de prueba.', icon: 'code-slash-outline', usesCode: true },
  { type: 'order', label: 'Ordenar líneas', description: 'El alumno acomoda líneas de código en el orden correcto.', icon: 'reorder-four-outline', usesCode: false },
];

export function questionTypeInfo(type: QuestionType): QuestionTypeInfo {
  return QUESTION_TYPES.find((q) => q.type === type) ?? QUESTION_TYPES[0];
}

export const MATCH_MODES: { id: OutputMatch; label: string; description: string }[] = [
  { id: 'flexible', label: 'Flexible', description: 'Ignora mayúsculas, espacios extra y líneas vacías.' },
  { id: 'exact', label: 'Exacta', description: 'La salida debe ser idéntica (solo se ignoran espacios al final).' },
  { id: 'numbers', label: 'Solo números', description: 'Compara únicamente los números que aparecen, en orden.' },
  { id: 'contains', label: 'Contiene', description: 'La salida debe incluir el texto esperado en algún lugar.' },
];

export const RESULTS_VISIBILITY: { id: ResultsVisibility; label: string; description: string }[] = [
  { id: 'score', label: 'Solo la calificación', description: 'El alumno ve su calificación al enviar.' },
  { id: 'detailed', label: 'Calificación y detalle', description: 'Ve la calificación y qué preguntas acertó.' },
  { id: 'none', label: 'Nada', description: 'Solo se le confirma que su examen fue entregado.' },
  { id: 'review', label: 'Todo, con respuestas', description: 'Para practicar: ve su calificación por tema, qué acertó y la respuesta correcta de cada pregunta.' },
];

export const option = (text = '', correct = false): ChoiceOption => ({ id: randomId('o'), text, correct });
export const codeTest = (p: Partial<CodeTest> = {}): CodeTest => ({ id: randomId('t'), name: '', inputs: [], expected: '', hidden: false, ...p });
export const codeRule = (p: Partial<CodeRule> = {}): CodeRule => ({ id: randomId('r'), kind: 'contains', pattern: '', message: '', ...p });

/** Pregunta nueva con valores de ejemplo para que el maestro solo ajuste. */
export function createQuestion(type: QuestionType): Question {
  const id = randomId('q');
  switch (type) {
    case 'single':
      return { id, type, prompt: '', points: 1, options: [option('', true), option(), option(), option()] };
    case 'multiple':
      return { id, type, prompt: '', points: 2, options: [option('', true), option('', true), option(), option()], partialCredit: true };
    case 'truefalse':
      return { id, type, prompt: '', points: 1, answer: true };
    case 'short':
      return { id, type, prompt: '', points: 1, answers: [''], caseSensitive: false };
    case 'numeric':
      return { id, type, prompt: '', points: 1, answer: 0, tolerance: 0 };
    case 'output':
      return { id, type, prompt: '¿Qué muestra en la consola el siguiente programa?', points: 2, code: 'let x = 3;\nconsole.log(x * 2);\n', inputs: [], match: 'flexible' };
    case 'code':
      return {
        id,
        type,
        prompt: '',
        points: 5,
        starter: '// Escribe tu programa aquí\n',
        solution: '',
        tests: [codeTest({ name: 'Caso 1' })],
        match: 'flexible',
        rules: [],
      };
    case 'order':
      return { id, type, prompt: 'Ordena las líneas para que el programa funcione.', points: 2, lines: ['let suma = 0;', 'for (let i = 1; i <= 3; i++) {', '  suma += i;', '}', 'console.log(suma);'], partialCredit: true };
  }
}

export function createExam(p: Partial<ExamConfig> = {}): ExamConfig {
  const now = Date.now();
  return {
    format: EXAM_FORMAT,
    version: 1,
    id: randomId('ex'),
    title: 'Examen sin título',
    description: 'Lee con atención cada pregunta. Al terminar presiona «Enviar a calificar».',
    author: '',
    durationMin: 45,
    pickCount: 0,
    topicPicks: {},
    shuffleQuestions: true,
    shuffleOptions: true,
    passPercent: 60,
    scale: 10,
    showResults: 'score',
    profileId: DEFAULT_PROFILE_ID,
    allowRun: true,
    allowAssist: false,
    showDiagnostics: true,
    blockPaste: true,
    trackFocus: true,
    questions: [],
    createdAt: now,
    updatedAt: now,
    ...p,
  };
}

/** Copia profunda con identificadores nuevos (duplicar examen o pregunta). */
export function cloneQuestion(q: Question): Question {
  const c: any = JSON.parse(JSON.stringify(q));
  c.id = randomId('q');
  if (c.options) c.options = c.options.map((o: ChoiceOption) => ({ ...o, id: randomId('o') }));
  if (c.tests) c.tests = c.tests.map((t: CodeTest) => ({ ...t, id: randomId('t') }));
  if (c.rules) c.rules = c.rules.map((r: CodeRule) => ({ ...r, id: randomId('r') }));
  return c;
}

export function cloneExam(e: ExamConfig, title = `${e.title} (copia)`): ExamConfig {
  const now = Date.now();
  return { ...JSON.parse(JSON.stringify(e)), id: randomId('ex'), title, createdAt: now, updatedAt: now, questions: e.questions.map(cloneQuestion) };
}

export function totalPoints(e: Pick<ExamConfig, 'questions'>): number {
  return e.questions.reduce((s, q) => s + q.points, 0);
}

/** ¿Cada alumno recibe preguntas elegidas por tema? */
export function usesTopicPicks(e: Pick<ExamConfig, 'topicPicks'>): boolean {
  return Object.values(e.topicPicks ?? {}).some((n) => n > 0);
}

/** Temas del examen en el orden en que aparecen, con cuántas preguntas tiene cada uno. */
export function examTopics(e: Pick<ExamConfig, 'questions'>): { topic: string; count: number }[] {
  const map = new Map<string, number>();
  for (const q of e.questions) if (q.topic?.trim()) map.set(q.topic, (map.get(q.topic) ?? 0) + 1);
  return [...map].map(([topic, count]) => ({ topic, count }));
}

/** Cuántas preguntas recibe cada alumno. */
export function questionsPerStudent(e: Pick<ExamConfig, 'questions' | 'pickCount' | 'topicPicks'>): number {
  if (usesTopicPicks(e)) return examTopics(e).reduce((s, t) => s + Math.min(t.count, Math.max(0, e.topicPicks[t.topic] ?? 0)), 0);
  return e.pickCount > 0 ? Math.min(e.pickCount, e.questions.length) : e.questions.length;
}

// ───────────────────────────── validación ─────────────────────────────

export interface ExamIssue {
  severity: 'error' | 'warning';
  questionId?: string;
  message: string;
}

export function validateExam(e: ExamConfig): ExamIssue[] {
  const issues: ExamIssue[] = [];
  if (!e.title.trim()) issues.push({ severity: 'error', message: 'El examen necesita un título.' });
  if (!e.questions.length) issues.push({ severity: 'error', message: 'Agrega al menos una pregunta.' });
  if (usesTopicPicks(e)) {
    const topics = examTopics(e);
    const missing = topics.filter((t) => !(e.topicPicks[t.topic] > 0));
    const noTopic = e.questions.filter((q) => !q.topic?.trim()).length;
    if (!questionsPerStudent(e)) issues.push({ severity: 'error', message: 'Elegiste preguntas por tema, pero ningún tema con preguntas tiene una cantidad mayor que 0.' });
    for (const t of topics) {
      const n = e.topicPicks[t.topic] ?? 0;
      if (n > t.count) issues.push({ severity: 'warning', message: `Tema «${t.topic}»: pediste ${n} preguntas pero solo hay ${t.count}; se usarán todas.` });
    }
    for (const topic of Object.keys(e.topicPicks)) {
      if (e.topicPicks[topic] > 0 && !topics.some((t) => t.topic === topic)) issues.push({ severity: 'warning', message: `El tema «${topic}» ya no tiene preguntas.` });
    }
    if (missing.length) issues.push({ severity: 'warning', message: `${missing.length === 1 ? 'El tema' : 'Los temas'} ${missing.map((t) => `«${t.topic}»`).join(', ')} no ${missing.length === 1 ? 'aparecerá' : 'aparecerán'} en el examen (0 preguntas).` });
    if (noTopic) issues.push({ severity: 'warning', message: `${noTopic} pregunta(s) sin tema no aparecerán: con la selección por tema solo se eligen preguntas que tienen tema.` });
  } else if (e.pickCount > e.questions.length) issues.push({ severity: 'warning', message: `Pediste mostrar ${e.pickCount} preguntas pero solo hay ${e.questions.length}; se mostrarán todas.` });
  if (usesTopicPicks(e) || (e.pickCount > 0 && e.pickCount < e.questions.length)) {
    // con selección por tema solo importa que varíen dentro de un mismo tema
    const groups = usesTopicPicks(e) ? examTopics(e).map((t) => e.questions.filter((q) => q.topic === t.topic)) : [e.questions];
    if (groups.some((g) => new Set(g.map((q) => q.points)).size > 1)) issues.push({ severity: 'warning', message: 'Las preguntas valen distinto y cada alumno recibe una selección al azar: el total de puntos puede variar entre alumnos (la calificación se calcula en porcentaje).' });
  }
  e.questions.forEach((q, i) => {
    const n = `Pregunta ${i + 1}`;
    const add = (severity: ExamIssue['severity'], message: string) => issues.push({ severity, questionId: q.id, message: `${n}: ${message}` });
    if (!q.prompt.trim()) add('error', 'falta el enunciado.');
    if (!(q.points > 0)) add('error', 'debe valer más de 0 puntos.');
    switch (q.type) {
      case 'single':
      case 'multiple': {
        const filled = q.options.filter((o) => o.text.trim());
        if (filled.length < 2) add('error', 'necesita al menos dos opciones con texto.');
        const correct = q.options.filter((o) => o.correct && o.text.trim()).length;
        if (q.type === 'single' && correct !== 1) add('error', 'marca exactamente una opción correcta.');
        if (q.type === 'multiple' && correct < 1) add('error', 'marca al menos una opción correcta.');
        if (q.options.some((o) => !o.text.trim())) add('warning', 'hay opciones vacías (no se mostrarán).');
        break;
      }
      case 'short':
        if (!q.answers.some((a) => a.trim())) add('error', 'escribe al menos una respuesta aceptada.');
        break;
      case 'numeric':
        if (!Number.isFinite(q.answer)) add('error', 'la respuesta debe ser un número.');
        break;
      case 'output':
        if (!q.code?.trim()) add('error', 'escribe el programa que el alumno debe analizar.');
        break;
      case 'code':
        if (!q.tests.length) add('error', 'agrega al menos un caso de prueba.');
        q.tests.forEach((t, k) => {
          if (!t.expected.trim()) add('warning', `el caso ${k + 1} no tiene salida esperada (usa «Calcular con la solución»).`);
        });
        if (q.tests.length && q.tests.every((t) => t.hidden)) add('warning', 'todos los casos están ocultos: el alumno no tendrá ejemplos para probar.');
        q.rules.forEach((r, k) => {
          if (!r.pattern.trim()) add('warning', `el requisito ${k + 1} está vacío.`);
        });
        break;
      case 'order':
        if (q.lines.filter((l) => l.trim()).length < 2) add('error', 'necesita al menos dos líneas.');
        if (new Set(q.lines.map((l) => l.trim())).size !== q.lines.length) add('warning', 'hay líneas repetidas: cualquiera de ellas se aceptará en esa posición.');
        break;
    }
  });
  return issues;
}

export function hasExamErrors(e: ExamConfig): boolean {
  return validateExam(e).some((i) => i.severity === 'error');
}

// ───────────────────────────── importar / exportar ─────────────────────────────

export function serializeExam(e: ExamConfig): string {
  return JSON.stringify(e, null, 2);
}

export function examFileName(e: ExamConfig): string {
  const slug = e.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${slug || 'examen'}.examen.json`;
}

const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : v === undefined || v === null ? d : String(v));
const num = (v: unknown, d: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : d;
};
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)) : typeof v === 'string' ? v.split('\n') : []);
const MATCHES: OutputMatch[] = ['exact', 'flexible', 'contains', 'numbers'];
const match = (v: unknown): OutputMatch => (MATCHES.includes(v as OutputMatch) ? (v as OutputMatch) : 'flexible');

function normalizeQuestion(raw: any): Question | null {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type as QuestionType;
  if (!QUESTION_TYPES.some((t) => t.type === type)) return null;
  const base = {
    id: str(raw.id) || randomId('q'),
    type,
    prompt: str(raw.prompt),
    points: Math.max(0, num(raw.points, 1)),
    ...(raw.code ? { code: str(raw.code) } : {}),
    ...(typeof raw.topic === 'string' && raw.topic.trim() ? { topic: raw.topic.trim() } : {}),
  };
  const options = (): ChoiceOption[] =>
    (Array.isArray(raw.options) ? raw.options : []).map((o: any) => ({ id: str(o?.id) || randomId('o'), text: str(o?.text), correct: bool(o?.correct, false) }));
  switch (type) {
    case 'single':
      return { ...base, type, options: options() };
    case 'multiple':
      return { ...base, type, options: options(), partialCredit: bool(raw.partialCredit, true) };
    case 'truefalse':
      return { ...base, type, answer: bool(raw.answer, true) };
    case 'short':
      return { ...base, type, answers: strList(raw.answers), caseSensitive: bool(raw.caseSensitive, false) };
    case 'numeric':
      return { ...base, type, answer: num(raw.answer, 0), tolerance: Math.abs(num(raw.tolerance, 0)) };
    case 'output':
      return { ...base, type, code: str(raw.code), inputs: strList(raw.inputs), match: match(raw.match) };
    case 'code':
      return {
        ...base,
        type,
        starter: str(raw.starter),
        solution: str(raw.solution),
        match: match(raw.match),
        tests: (Array.isArray(raw.tests) ? raw.tests : []).map((t: any, i: number) => ({
          id: str(t?.id) || randomId('t'),
          name: str(t?.name, `Caso ${i + 1}`),
          inputs: strList(t?.inputs),
          expected: str(t?.expected),
          hidden: bool(t?.hidden, false),
          ...(typeof t?.call === 'string' && t.call.trim() ? { call: t.call } : {}),
        })),
        rules: (Array.isArray(raw.rules) ? raw.rules : []).map((r: any) => ({
          id: str(r?.id) || randomId('r'),
          kind: r?.kind === 'notContains' ? 'notContains' : 'contains',
          pattern: str(r?.pattern),
          message: str(r?.message),
        })),
      };
    case 'order':
      return { ...base, type, lines: strList(raw.lines), partialCredit: bool(raw.partialCredit, true) };
  }
  return null;
}

/** Lee un examen exportado (JSON). Completa valores faltantes; lanza Error con un mensaje en español si no es válido. */
export function parseExam(text: string): ExamConfig {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!raw || typeof raw !== 'object' || (raw.format && raw.format !== EXAM_FORMAT) || !Array.isArray(raw.questions)) {
    throw new Error('El archivo no es una configuración de examen de PSJavaScript.');
  }
  const d = createExam();
  const questions = raw.questions.map(normalizeQuestion).filter(Boolean) as Question[];
  const ids = new Set<string>();
  for (const q of questions) {
    if (ids.has(q.id)) q.id = randomId('q');
    ids.add(q.id);
  }
  const vis: ResultsVisibility[] = ['none', 'score', 'detailed', 'review'];
  const topicPicks: Record<string, number> = {};
  if (raw.topicPicks && typeof raw.topicPicks === 'object' && !Array.isArray(raw.topicPicks)) {
    for (const [k, v] of Object.entries(raw.topicPicks)) if (k.trim()) topicPicks[k.trim()] = Math.max(0, Math.round(num(v, 0)));
  }
  return {
    ...d,
    id: str(raw.id) || d.id,
    title: str(raw.title, d.title),
    description: str(raw.description, d.description),
    author: str(raw.author),
    durationMin: Math.max(0, Math.round(num(raw.durationMin, d.durationMin))),
    pickCount: Math.max(0, Math.round(num(raw.pickCount, 0))),
    topicPicks,
    shuffleQuestions: bool(raw.shuffleQuestions, d.shuffleQuestions),
    shuffleOptions: bool(raw.shuffleOptions, d.shuffleOptions),
    passPercent: Math.min(100, Math.max(0, num(raw.passPercent, d.passPercent))),
    scale: num(raw.scale, d.scale) > 0 ? num(raw.scale, d.scale) : d.scale,
    showResults: vis.includes(raw.showResults) ? raw.showResults : d.showResults,
    profileId: PROFILES.some((p) => p.id === raw.profileId) ? raw.profileId : d.profileId,
    allowRun: bool(raw.allowRun, d.allowRun),
    allowAssist: bool(raw.allowAssist, d.allowAssist),
    showDiagnostics: bool(raw.showDiagnostics, d.showDiagnostics),
    blockPaste: bool(raw.blockPaste, d.blockPaste),
    trackFocus: bool(raw.trackFocus, d.trackFocus),
    questions,
    createdAt: num(raw.createdAt, d.createdAt),
    updatedAt: num(raw.updatedAt, d.updatedAt),
  };
}

// ───────────────────────────── examen de ejemplo ─────────────────────────────

/** Examen listo para usar: 100 preguntas de fundamentos en 8 temas, con todos los tipos de pregunta. */
export function sampleExam(): ExamConfig {
  const per = FUNDAMENTOS_PER_TOPIC;
  return createExam({
    title: 'Fundamentos de JavaScript (ejemplo)',
    description: `Examen de ejemplo con todos los tipos de pregunta. Recibes ${per} preguntas al azar de cada uno de los ${FUNDAMENTOS_TOPICS.length} temas (${per * FUNDAMENTOS_TOPICS.length} en total). Lee con atención; puedes moverte entre preguntas y cambiar tus respuestas antes de enviar.`,
    durationMin: 45,
    topicPicks: Object.fromEntries(FUNDAMENTOS_TOPICS.map((t) => [t, per])),
    questions: fundamentosQuestions(),
  });
}
