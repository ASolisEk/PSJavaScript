/** Estado de una sala de examen (lo guarda el maestro). */
import type { RoomStatus, SubmitReason } from './protocol';
import type { TransportSpec } from './transport/types';
import type { Activity, Answers, ExamConfig, GradeResult, PaperKey } from './types';

export type StudentEventKind =
  | 'join'
  | 'reconnect'
  | 'disconnect'
  | 'start'
  | 'question'
  | 'blur'
  | 'focus'
  | 'paste'
  | 'lockdown'
  | 'run'
  | 'test'
  | 'submit'
  | 'leave'
  | 'teacher';

export interface StudentEvent {
  at: number;
  kind: StudentEventKind;
  text: string;
}

export interface StudentRecord {
  id: string;
  token: string;
  name: string;
  group: string;
  peer: string | null;
  connected: boolean;
  lastSeen: number;
  joinedAt: number;
  startedAt: number | null;
  deadline: number | null;
  submittedAt: number | null;
  submitReason: SubmitReason | null;
  key: PaperKey | null;
  answers: Answers;
  /** Índice de la pregunta que está viendo. */
  current: number;
  activity: Activity;
  activitySince: number;
  focused: boolean;
  focusLost: number;
  awayMs: number;
  pasteBlocked: number;
  /** Incidentes del examen bloqueado (pantalla completa, F12, capturas…). */
  lockdown?: number;
  runs: number;
  tests: number;
  events: StudentEvent[];
  result: GradeResult | null;
  /** Puntos asignados a mano por el maestro (por pregunta). */
  overrides: Record<string, number>;
}

export interface RoomState {
  code: string;
  transport: TransportSpec;
  exam: ExamConfig;
  status: RoomStatus;
  openedAt: number;
  startedAt: number | null;
  closedAt: number | null;
  students: Record<string, StudentRecord>;
  notices: { at: number; text: string }[];
  /** Ya no se aceptan alumnos nuevos (los que están pueden reconectarse). */
  locked?: boolean;
}

export type StudentPhase = 'lobby' | 'ready' | 'working' | 'submitted';

export function studentPhase(s: StudentRecord, room: Pick<RoomState, 'status'>): StudentPhase {
  if (s.submittedAt) return 'submitted';
  if (s.startedAt) return 'working';
  return room.status === 'running' ? 'ready' : 'lobby';
}

export function createRoom(code: string, exam: ExamConfig, transport: TransportSpec, now = Date.now()): RoomState {
  return { code, transport, exam, status: 'lobby', openedAt: now, startedAt: null, closedAt: null, students: {}, notices: [] };
}

export function answeredCount(s: StudentRecord, room: RoomState): number {
  const ids = s.key?.questionIds ?? [];
  const byId = new Map(room.exam.questions.map((q) => [q.id, q]));
  return ids.filter((id) => {
    const a = s.answers[id];
    const q = byId.get(id);
    if (a === undefined || a === null) return false;
    if (typeof a === 'string') return a.trim() !== '' && !(q?.type === 'code' && a.trim() === q.starter.trim());
    if (Array.isArray(a)) return a.length > 0;
    return true;
  }).length;
}

export const ACTIVITY_LABEL: Record<Activity, string> = {
  reading: 'Leyendo la pregunta',
  answering: 'Respondiendo',
  coding: 'Escribiendo código',
  running: 'Ejecutando su programa',
  testing: 'Probando con los casos de ejemplo',
  reviewing: 'Revisando antes de enviar',
  idle: 'Sin actividad',
  away: 'Fuera de la ventana del examen',
};

/**
 * Versión ligera de una sala para el historial: sin datos de conexión, con
 * solo las preguntas que se usaron y los eventos más recientes de cada alumno (la bitácora completa ocupa
 * la mayor parte del espacio y el almacenamiento del navegador es limitado).
 */
export function compactRoom(room: RoomState, maxEvents = 40): RoomState {
  const students: Record<string, StudentRecord> = {};
  for (const [id, s] of Object.entries(room.students)) {
    students[id] = { ...s, token: '', peer: null, connected: false, events: s.events.slice(-maxEvents) };
  }
  // de un banco grande (p. ej. el simulacro de certificación) solo se guardan las preguntas que le tocaron a alguien
  const used = new Set(Object.values(room.students).flatMap((s) => s.key?.questionIds ?? []));
  const exam = used.size && used.size < room.exam.questions.length ? { ...room.exam, questions: room.exam.questions.filter((q) => used.has(q.id)) } : room.exam;
  return { ...room, exam, students };
}
