/**
 * Tipos del modo Maestro / modo Examen.
 *
 * Un `ExamConfig` es lo que el maestro diseña (incluye respuestas correctas y
 * casos de prueba ocultos). A cada alumno se le entrega un `Paper` generado a
 * partir de la configuración: preguntas elegidas y mezcladas con una semilla
 * propia del alumno y SIN respuestas. La calificación ocurre en el equipo del
 * maestro con la configuración completa.
 */

export type QuestionType = 'single' | 'multiple' | 'truefalse' | 'short' | 'numeric' | 'output' | 'code' | 'order';

/** Cómo se compara la salida del programa con la esperada. */
export type OutputMatch = 'exact' | 'flexible' | 'contains' | 'numbers';

export interface ChoiceOption {
  id: string;
  text: string;
  correct: boolean;
}

/** Caso de prueba de una pregunta de programación. */
export interface CodeTest {
  id: string;
  /** Descripción breve (p. ej. "Números negativos"). */
  name: string;
  /** Datos que recibirá prompt(), en orden. */
  inputs: string[];
  /** Salida esperada en la consola. */
  expected: string;
  /** Los casos ocultos no se muestran al alumno (solo se usan al calificar). */
  hidden: boolean;
  /**
   * Llamada que se evalúa después del programa del alumno, p. ej. `reverseString("hola")`.
   * Si existe, se compara su valor (en JSON) con `expected` en lugar de la salida del programa,
   * como en los laboratorios de freeCodeCamp («reverseString("hola") debe devolver "aloh"»).
   */
  call?: string;
}

/** Requisito sobre el código del alumno (p. ej. "debe usar for"). */
export interface CodeRule {
  id: string;
  kind: 'contains' | 'notContains';
  pattern: string;
  message: string;
}

interface QuestionBase {
  id: string;
  type: QuestionType;
  /** Enunciado. */
  prompt: string;
  points: number;
  /** Fragmento de código que acompaña al enunciado (opcional). */
  code?: string;
  /** Tema o módulo (p. ej. "Arreglos"); permite elegir preguntas por tema y ver resultados por tema. */
  topic?: string;
}

export interface SingleQuestion extends QuestionBase {
  type: 'single';
  options: ChoiceOption[];
}

export interface MultipleQuestion extends QuestionBase {
  type: 'multiple';
  options: ChoiceOption[];
  /** Otorga puntos parciales (aciertos menos errores). */
  partialCredit: boolean;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'truefalse';
  answer: boolean;
}

export interface ShortQuestion extends QuestionBase {
  type: 'short';
  /** Respuestas aceptadas. */
  answers: string[];
  caseSensitive: boolean;
}

export interface NumericQuestion extends QuestionBase {
  type: 'numeric';
  answer: number;
  tolerance: number;
}

/** "¿Qué imprime este programa?": se ejecuta `code` y se compara con lo que escribe el alumno. */
export interface OutputQuestion extends QuestionBase {
  type: 'output';
  code: string;
  inputs: string[];
  match: OutputMatch;
}

/** El alumno escribe un programa que se califica con casos de prueba. */
export interface CodeQuestion extends QuestionBase {
  type: 'code';
  starter: string;
  /** Solución de referencia del maestro (nunca se envía al alumno). */
  solution: string;
  tests: CodeTest[];
  match: OutputMatch;
  rules: CodeRule[];
}

/** Ordenar líneas de código (problema de Parsons). `lines` está en el orden correcto. */
export interface OrderQuestion extends QuestionBase {
  type: 'order';
  lines: string[];
  partialCredit: boolean;
}

export type Question =
  | SingleQuestion
  | MultipleQuestion
  | TrueFalseQuestion
  | ShortQuestion
  | NumericQuestion
  | OutputQuestion
  | CodeQuestion
  | OrderQuestion;

/** `review`: calificación, detalle y respuesta correcta de cada pregunta (para practicar). */
export type ResultsVisibility = 'none' | 'score' | 'detailed' | 'review';

export interface ExamConfig {
  format: 'psjavascript-exam';
  version: 1;
  id: string;
  title: string;
  /** Instrucciones para el alumno. */
  description: string;
  author: string;
  /** Duración en minutos (0 = sin límite). */
  durationMin: number;
  /** Cuántas preguntas se le muestran a cada alumno (0 = todas). */
  pickCount: number;
  /**
   * Preguntas por tema. Si algún tema tiene un valor mayor que 0, cada alumno recibe
   * esa cantidad de preguntas al azar de cada tema (y `pickCount` no se usa); los
   * temas que no aparecen o valen 0 no se incluyen.
   */
  topicPicks: Record<string, number>;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  /** Porcentaje mínimo para aprobar. */
  passPercent: number;
  /** Escala de la calificación (10 o 100). */
  scale: number;
  showResults: ResultsVisibility;
  /** Perfil del lenguaje con el que se ejecuta y califica el código. */
  profileId: string;
  /** Permite ejecutar y probar el código en las preguntas de programación. */
  allowRun: boolean;
  /** Autocompletado y ayuda contextual del editor. */
  allowAssist: boolean;
  /** Muestra errores de sintaxis en tiempo real en el editor. */
  showDiagnostics: boolean;
  /** Impide pegar texto (web/escritorio). */
  blockPaste: boolean;
  /** Avisa al maestro cuando el alumno sale de la ventana. */
  trackFocus: boolean;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

/** Respuesta de un alumno a una pregunta. */
export type AnswerValue = string | string[] | boolean | null;
export type Answers = Record<string, AnswerValue>;

/** Pregunta tal como la ve el alumno (sin respuestas). */
export interface PaperQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  code?: string;
  topic?: string;
  options?: { id: string; text: string }[];
  inputs?: string[];
  starter?: string;
  /** Casos de prueba visibles (de ejemplo). */
  tests?: { id: string; name: string; inputs: string[]; expected: string; call?: string }[];
  hiddenTests?: number;
  match?: OutputMatch;
  rules?: { kind: CodeRule['kind']; pattern: string; message: string }[];
  /** Líneas desordenadas (preguntas de ordenar). */
  lines?: { id: string; text: string }[];
}

export interface PaperSettings {
  allowRun: boolean;
  allowAssist: boolean;
  showDiagnostics: boolean;
  blockPaste: boolean;
  trackFocus: boolean;
  profileId: string;
  showResults: ResultsVisibility;
  scale: number;
  passPercent: number;
}

/** Examen personalizado que recibe cada alumno. */
export interface Paper {
  examId: string;
  title: string;
  description: string;
  durationMin: number;
  totalPoints: number;
  questions: PaperQuestion[];
  settings: PaperSettings;
}

/** Datos para calificar un Paper (se quedan en el equipo del maestro). */
export interface PaperKey {
  seed: string;
  questionIds: string[];
  /** Identificadores de las líneas en el orden correcto (preguntas de ordenar). */
  lineIds: Record<string, string[]>;
}

export interface TestResult {
  id: string;
  name: string;
  hidden: boolean;
  passed: boolean;
  inputs?: string[];
  call?: string;
  expected?: string;
  actual?: string;
  error?: string;
}

export type QuestionStatus = 'correct' | 'partial' | 'wrong' | 'blank';

export interface QuestionResult {
  questionId: string;
  type: QuestionType;
  score: number;
  max: number;
  status: QuestionStatus;
  feedback: string;
  tests?: TestResult[];
  rules?: { message: string; passed: boolean }[];
  /** Puntos ajustados a mano por el maestro. */
  manual?: boolean;
}

export interface GradeResult {
  score: number;
  max: number;
  percent: number;
  grade: number;
  scale: number;
  passed: boolean;
  questions: QuestionResult[];
  gradedAt: number;
}

/** Resultado que se le muestra al alumno (según `showResults`). */
export interface StudentResultView {
  visibility: ResultsVisibility;
  grade?: number;
  scale?: number;
  percent?: number;
  passed?: boolean;
  score?: number;
  max?: number;
  questions?: { questionId: string; status: QuestionStatus; score: number; max: number; feedback: string; tests?: TestResult[] }[];
  /** Resultado por tema (si las preguntas tienen tema). */
  topics?: TopicScore[];
}

export interface TopicScore {
  topic: string;
  score: number;
  max: number;
  /** Preguntas correctas y total de preguntas del tema. */
  correct: number;
  total: number;
}

/** Qué está haciendo el alumno en este momento. */
export type Activity = 'reading' | 'answering' | 'coding' | 'running' | 'testing' | 'reviewing' | 'idle' | 'away';
