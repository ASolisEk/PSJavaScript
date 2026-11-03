/**
 * Mensajes entre el equipo del maestro (anfitrión de la sala) y los alumnos.
 * Viajan como JSON por cualquier transporte (PeerJS, WebSocket o BroadcastChannel).
 */
import type { Activity, Answers, Paper, StudentResultView } from './types';

export const PROTOCOL_VERSION = 1;

export type RoomStatus = 'lobby' | 'running' | 'closed';
export type SubmitReason = 'manual' | 'timeout' | 'closed' | 'teacher';
/** `lockdown`: algo que el examen bloqueado impidió o detectó (detalle en `detail`). */
export type ClientEventKind = 'blur' | 'focus' | 'paste' | 'run' | 'test' | 'leave' | 'lockdown';

export interface RoomInfo {
  status: RoomStatus;
  title: string;
  description: string;
  durationMin: number;
  questionCount: number;
  restrictions: string[];
}

/** Alumno → maestro. */
export type ClientMsg =
  | { t: 'hello'; v: number; studentId: string; token: string; name: string; group: string }
  | { t: 'begin' }
  | { t: 'progress'; current: number; activity: Activity; focused: boolean; answers?: Answers }
  | { t: 'event'; kind: ClientEventKind; detail?: string; awayMs?: number }
  | { t: 'submit'; answers: Answers; reason: SubmitReason }
  | { t: 'ping' };

/** Maestro → alumno. */
export type HostMsg =
  | {
      t: 'welcome';
      now: number;
      room: RoomInfo;
      started: boolean;
      submitted: boolean;
    }
  | { t: 'room'; status: RoomStatus }
  | { t: 'paper'; now: number; paper: Paper; startedAt: number; deadline: number | null; answers: Answers }
  | { t: 'result'; result: StudentResultView; submittedAt: number; reason: SubmitReason }
  | { t: 'deadline'; deadline: number | null; now: number }
  | { t: 'notice'; text: string; at: number }
  | { t: 'force-submit'; reason: SubmitReason }
  | { t: 'rejected'; reason: string }
  | { t: 'pong'; now: number };

const CLIENT_TYPES = new Set(['hello', 'begin', 'progress', 'event', 'submit', 'ping']);

/** Valida superficialmente un mensaje recibido de un alumno. */
export function asClientMsg(raw: unknown): ClientMsg | null {
  let m: any = raw;
  if (typeof m === 'string') {
    try {
      m = JSON.parse(m);
    } catch {
      return null;
    }
  }
  if (!m || typeof m !== 'object' || !CLIENT_TYPES.has(m.t)) return null;
  if (m.t === 'hello' && (typeof m.studentId !== 'string' || typeof m.token !== 'string' || typeof m.name !== 'string')) return null;
  if ((m.answers !== undefined && (typeof m.answers !== 'object' || m.answers === null || Array.isArray(m.answers)))) return null;
  return m as ClientMsg;
}

export function asHostMsg(raw: unknown): HostMsg | null {
  let m: any = raw;
  if (typeof m === 'string') {
    try {
      m = JSON.parse(m);
    } catch {
      return null;
    }
  }
  if (!m || typeof m !== 'object' || typeof m.t !== 'string') return null;
  return m as HostMsg;
}

/** Herramientas que nunca están disponibles durante un examen. */
export const ALWAYS_LOCKED = ['Ayuda', 'Mascota', 'Insertar comandos', 'Archivos y ejemplos', 'Exportar a otros lenguajes'];
