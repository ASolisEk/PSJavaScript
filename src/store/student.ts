/**
 * Estado del modo Examen (alumno). La sesión se guarda en el dispositivo:
 * si se recarga la página o se cae la red, el alumno vuelve a su examen con
 * sus respuestas.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { ClientNetStatus, ExamClient, StudentIdentity } from '../core/exam/client';
import type { ClientEventKind, HostMsg, RoomInfo, SubmitReason } from '../core/exam/protocol';
import { randomId } from '../core/exam/random';
import { createClientTransport, TransportSpec } from '../core/exam/transport';
import { forgetStudent } from '../ui/examLink';
import { practiceExam } from '../core/exam/certs';
import { resumePractice, startPractice, stopPractice } from './practice';
import type { Activity, AnswerValue, Answers, Paper, StudentResultView } from '../core/exam/types';

const KEY = 'psjs.student.v1';

export type StudentPhase = 'lobby' | 'ready' | 'exam' | 'submitted' | 'rejected';

export interface StudentSession {
  code: string;
  transport: TransportSpec;
  identity: StudentIdentity;
  phase: StudentPhase;
  room: RoomInfo | null;
  paper: Paper | null;
  startedAt: number | null;
  deadline: number | null;
  answers: Answers;
  current: number;
  flagged: string[];
  result: StudentResultView | null;
  submittedAt: number | null;
  submitReason: SubmitReason | null;
  /** Se pidió entregar y aún no llega la calificación. */
  submitting: boolean;
  notices: { at: number; text: string }[];
  rejectedReason: string | null;
  roomClosed: boolean;
  /** Tamaño de letra elegido por el alumno para el examen. */
  fontSize?: number;
  /** Práctica individual (sin maestro): qué práctica es, para repetirla. */
  practiceKey?: string;
}

interface StudentState {
  hydrated: boolean;
  session: StudentSession | null;
  net: ClientNetStatus;
  netDetail: string | null;
  joining: boolean;
  joinError: string | null;
  /** Último aviso del maestro aún no leído. */
  banner: string | null;
  /** Hay respuestas cambiadas que aún no se envían al maestro. */
  pendingSync: boolean;
  clockOffset: number;

  hydrate(): Promise<StudentSession | null>;
  /** Reconecta un examen en curso (al abrir la pantalla del alumno). */
  resume(): void;
  join(p: { code: string; name: string; group: string; transport: TransportSpec }): Promise<boolean>;
  /** Comienza una práctica individual (la sala corre en este dispositivo). */
  practice(key: string, name: string): Promise<boolean>;
  begin(): void;
  setAnswer(questionId: string, value: AnswerValue): void;
  goTo(index: number): void;
  toggleFlag(questionId: string): void;
  setActivity(a: Activity): void;
  /** El alumno hizo algo (escribir, navegar…): actualiza su actividad. */
  touch(a: Activity): void;
  report(kind: ClientEventKind, detail?: string, awayMs?: number): void;
  submit(reason?: SubmitReason): void;
  retry(): void;
  dismissBanner(): void;
  setFontSize(size: number): void;
  /** Sale del modo examen y borra la sesión. */
  leave(): void;
}

let client: ExamClient | null = null;
let saveTimer: any = null;
let progressTimer: any = null;
let dirty: Answers = {};
let lastActivity: Activity = 'reading';
let lastTouch = Date.now();

export const useStudent = create<StudentState>((set, get) => {
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const s = get().session;
      if (s) AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
      else AsyncStorage.removeItem(KEY).catch(() => {});
    }, 300);
  };

  const patch = (p: Partial<StudentSession>) => {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, ...p } });
    persist();
  };

  const sendProgress = (immediate = false) => {
    clearTimeout(progressTimer);
    const go = () => {
      const s = get().session;
      if (!client || !s || s.phase !== 'exam') return;
      const answers = dirty;
      dirty = {};
      client.send({ t: 'progress', current: s.current, activity: lastActivity, focused: lastActivity !== 'away', ...(Object.keys(answers).length ? { answers } : {}) });
      set({ pendingSync: false });
    };
    if (immediate) go();
    else progressTimer = setTimeout(go, 700);
  };

  const onMessage = (m: HostMsg) => {
    const s = get().session;
    if (!s) return;
    set({ clockOffset: client?.clockOffset ?? 0 });
    switch (m.t) {
      case 'welcome': {
        // el maestro pudo reabrir un examen que este dispositivo tenía como entregado
        const reopened = !m.submitted && m.started && s.phase === 'submitted';
        patch({
          room: m.room,
          roomClosed: m.room.status === 'closed',
          phase: m.submitted ? 'submitted' : m.started ? (reopened ? 'exam' : s.phase) : m.room.status === 'running' ? 'ready' : 'lobby',
          ...(reopened ? { result: null, submittedAt: null, submitReason: null, submitting: false } : {}),
        });
        if (reopened) set({ banner: 'Tu maestro reabrió tu examen: puedes seguir respondiendo.' });
        break;
      }
      case 'room':
        patch({
          room: s.room ? { ...s.room, status: m.status } : s.room,
          roomClosed: m.status === 'closed',
          phase: s.phase === 'lobby' && m.status === 'running' ? 'ready' : s.phase,
        });
        break;
      case 'paper': {
        // conserva lo que el alumno respondió localmente (puede ser más reciente que la copia del maestro)
        const answers = { ...m.answers, ...s.answers };
        patch({ paper: m.paper, startedAt: m.startedAt, deadline: m.deadline, answers, phase: s.phase === 'submitted' ? 'submitted' : 'exam', current: Math.min(s.current, m.paper.questions.length - 1) });
        // reenvía lo que el maestro no tenga
        const missing: Answers = {};
        for (const [k, v] of Object.entries(s.answers)) if (JSON.stringify(m.answers[k]) !== JSON.stringify(v)) missing[k] = v;
        if (Object.keys(missing).length) {
          dirty = { ...missing, ...dirty };
          sendProgress(true);
        }
        break;
      }
      case 'deadline':
        patch({ deadline: m.deadline });
        set({ banner: 'El maestro te dio más tiempo.' });
        break;
      case 'notice':
        patch({ notices: [...s.notices, { at: m.at, text: m.text }].slice(-20) });
        set({ banner: m.text });
        break;
      case 'force-submit':
        if (s.phase === 'exam') get().submit(m.reason);
        break;
      case 'result':
        patch({ result: m.result, submittedAt: m.submittedAt, submitReason: m.reason, phase: 'submitted', submitting: false });
        break;
      case 'rejected':
        patch({ phase: 'rejected', rejectedReason: m.reason });
        client?.dispose();
        client = null;
        break;
    }
  };

  const connect = async (s: StudentSession) => {
    client?.dispose();
    const c = new ExamClient({
      code: s.code,
      transport: () => createClientTransport(s.transport),
      identity: s.identity,
      onMessage,
      onStatus: (net, detail) => set({ net, netDetail: detail ?? null }),
    });
    client = c;
    await c.connect();
  };

  return {
    hydrated: false,
    session: null,
    net: 'connecting',
    netDetail: null,
    joining: false,
    joinError: null,
    banner: null,
    pendingSync: false,
    clockOffset: 0,

    async hydrate() {
      if (get().hydrated) return get().session;
      let session: StudentSession | null = null;
      try {
        const raw = await AsyncStorage.getItem(KEY);
        session = raw ? JSON.parse(raw) : null;
      } catch {
        session = null;
      }
      set({ session, hydrated: true });
      return session;
    },

    resume() {
      const session = get().session;
      if (client || !hasActiveExam(session)) return;
      if (session!.transport.kind === 'practice') {
        // la sala de práctica corre aquí mismo: se vuelve a abrir antes de conectar
        resumePractice(session!.code)
          .then(() => connect(session!))
          .catch((e) => {
            // sin la sala no hay a quién entregar: se vuelve a la pantalla de inicio con el aviso
            get().leave();
            set({ joinError: `${e?.message ?? e} Comienza una práctica nueva.` });
          });
        return;
      }
      // retoma la sesión; si el maestro no está disponible, el cliente reintenta solo
      connect(session!).catch((e) => {
        set({ net: 'offline', netDetail: e?.message ?? String(e) });
        client?.retryNow();
      });
    },

    async join({ code, name, group, transport }) {
      set({ joining: true, joinError: null });
      const prev = get().session;
      const same = prev && prev.code === code && prev.identity.name === name && prev.phase !== 'rejected';
      const session: StudentSession = same
        ? { ...prev!, transport }
        : {
            code,
            transport,
            identity: { studentId: randomId('al'), token: randomId('tk') + randomId(), name, group },
            phase: 'lobby',
            room: null,
            paper: null,
            startedAt: null,
            deadline: null,
            answers: {},
            current: 0,
            flagged: [],
            result: null,
            submittedAt: null,
            submitReason: null,
            submitting: false,
            notices: [],
            rejectedReason: null,
            roomClosed: false,
          };
      set({ session });
      try {
        await connect(session);
      } catch (e: any) {
        client?.dispose();
        client = null;
        set({ joining: false, joinError: e?.message ?? String(e), session: prev });
        return false;
      }
      persist();
      set({ joining: false });
      return true;
    },

    async practice(key, name) {
      set({ joining: true, joinError: null });
      let code: string;
      try {
        code = await startPractice(practiceExam(key));
      } catch (e: any) {
        set({ joining: false, joinError: e?.message ?? String(e) });
        return false;
      }
      const ok = await get().join({ code, name: name.trim() || 'Alumno', group: '', transport: { kind: 'practice' } });
      if (!ok) {
        stopPractice(code);
        return false;
      }
      patch({ practiceKey: key });
      get().begin();
      return true;
    },

    begin() {
      client?.send({ t: 'begin' });
    },

    setAnswer(questionId, value) {
      const s = get().session;
      if (!s || s.phase !== 'exam') return;
      patch({ answers: { ...s.answers, [questionId]: value } });
      dirty[questionId] = value;
      set({ pendingSync: true });
      sendProgress();
    },

    goTo(index) {
      const s = get().session;
      if (!s?.paper) return;
      lastTouch = Date.now();
      const current = Math.max(0, Math.min(s.paper.questions.length - 1, index));
      if (current === s.current) return;
      patch({ current });
      lastActivity = 'reading';
      sendProgress(true);
    },

    toggleFlag(questionId) {
      const s = get().session;
      if (!s) return;
      patch({ flagged: s.flagged.includes(questionId) ? s.flagged.filter((x) => x !== questionId) : [...s.flagged, questionId] });
    },

    setActivity(a) {
      if (a === lastActivity) return;
      lastActivity = a;
      sendProgress(a === 'away' || a === 'running' || a === 'testing' || a === 'reviewing');
    },

    touch(a) {
      lastTouch = Date.now();
      get().setActivity(a);
    },

    report(kind, detail, awayMs) {
      client?.send({ t: 'event', kind, ...(detail ? { detail } : {}), ...(awayMs ? { awayMs } : {}) });
    },

    submit(reason = 'manual') {
      const s = get().session;
      if (!s || s.phase !== 'exam') return;
      clearTimeout(progressTimer);
      dirty = {};
      patch({ submitting: true });
      client?.send({ t: 'submit', answers: s.answers, reason });
    },

    retry() {
      client?.retryNow();
    },

    dismissBanner() {
      set({ banner: null });
    },

    setFontSize(fontSize) {
      patch({ fontSize: Math.max(12, Math.min(24, fontSize)) });
    },

    leave() {
      const s = get().session;
      if (s && (s.phase === 'exam' || s.phase === 'ready' || s.phase === 'lobby')) client?.send({ t: 'event', kind: 'leave' });
      const c = client;
      client = null;
      // deja salir el último mensaje antes de cerrar
      setTimeout(() => c?.dispose(), 300);
      clearTimeout(progressTimer);
      dirty = {};
      lastActivity = 'reading';
      if (s?.transport.kind === 'practice') setTimeout(() => stopPractice(s.code), 350);
      set({ session: null, banner: null, joinError: null, net: 'connecting' });
      forgetStudent();
      persist();
    },
  };
});

/** Milisegundos desde la última interacción del alumno. */
export function idleMs(): number {
  return Date.now() - lastTouch;
}

/** Hora actual según el reloj del maestro. */
export function serverNow(): number {
  return Date.now() + useStudent.getState().clockOffset;
}

/** ¿Hay un examen en curso que debe retomarse al abrir la aplicación? */
export function hasActiveExam(s: StudentSession | null): boolean {
  if (!s || s.phase === 'rejected') return false;
  if (s.phase === 'submitted' && s.result) return false;
  // la sala se cerró antes de que comenzara: ya no hay nada que retomar
  return !(s.roomClosed && !s.startedAt);
}
