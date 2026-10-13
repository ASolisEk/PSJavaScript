/**
 * Estado del modo Maestro: biblioteca de exámenes, sala activa (anfitrión)
 * e historial de exámenes aplicados. Todo se guarda en el dispositivo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { cloneExam, createExam, parseExam, sampleExam } from '../core/exam/config';
import { gradePaper } from '../core/exam/grading';
import { ExamHost } from '../core/exam/host';
import { roomCode } from '../core/exam/random';
import { compactRoom, createRoom, RoomState } from '../core/exam/room';
import { createHostTransport, TransportError, TransportSpec } from '../core/exam/transport';
import type { ExamConfig } from '../core/exam/types';

export type TeacherTab = 'library' | 'editor' | 'room' | 'results';

/** Versión anterior: exámenes e historial en una sola clave (se migra al abrir). */
const LEGACY_KEY = 'psjs.teacher.v1';
const EXAMS_KEY = 'psjs.teacher.exams.v2';
const HISTORY_INDEX_KEY = 'psjs.teacher.history.v2';
const historyItemKey = (key: string) => `${HISTORY_INDEX_KEY}:${key}`;
const ROOM_KEY = 'psjs.teacher.room.v1';
const MAX_HISTORY = 30;
/** Cada cuánto se guarda la sala activa mientras cambia (la interfaz se actualiza más seguido). */
const ROOM_SAVE_MS = 2000;

/** Guarda sin lanzar errores; devuelve false si no se pudo (p. ej. sin espacio). */
async function safeSet(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

interface TeacherState {
  hydrated: boolean;
  exams: ExamConfig[];
  editingId: string | null;
  tab: TeacherTab;
  room: RoomState | null;
  /** La sala está abierta y aceptando alumnos en este momento. */
  live: boolean;
  network: { online: boolean; detail?: string };
  opening: boolean;
  openError: string | null;
  /** Exámenes aplicados (salas cerradas). */
  history: RoomState[];
  /** Sala del historial que se está consultando en «Resultados» (ver roomKey). */
  viewingKey: string | null;
  /** Problema al guardar en el dispositivo (sin espacio). */
  storageWarning: string | null;

  hydrate(): Promise<void>;
  setTab(t: TeacherTab): void;
  edit(id: string | null): void;
  newExam(sample?: boolean): ExamConfig;
  saveExam(e: ExamConfig): void;
  deleteExam(id: string): void;
  duplicateExam(id: string): void;
  importExam(text: string): ExamConfig;

  openRoom(examId: string, transport: TransportSpec): Promise<boolean>;
  reopenRoom(): Promise<boolean>;
  startExam(): void;
  closeExam(): Promise<void>;
  notice(text: string): void;
  addTime(minutes: number, studentId?: string): void;
  forceSubmit(studentId: string): void;
  adjust(studentId: string, questionId: string, points: number | null): void;
  removeStudent(studentId: string): void;
  setLocked(locked: boolean): void;
  reopenStudent(studentId: string, minutes?: number): void;
  /** Sale de la sala (si está cerrada pasa al historial). */
  leaveRoom(): void;
  viewHistory(key: string | null): void;
  deleteHistory(key: string): void;
  dismissStorageWarning(): void;
}

/** Identificador de una sala del historial. */
export const roomKey = (r: Pick<RoomState, 'code' | 'openedAt'>) => `${r.code}@${r.openedAt}`;

let host: ExamHost | null = null;
let roomTimer: any = null;
let pendingRoom: RoomState | null = null;
let examsTimer: any = null;
let saveRoomTimer: any = null;
let lastRoomSave = 0;

export const useTeacher = create<TeacherState>((set, get) => {
  const NO_SPACE = 'El dispositivo se quedó sin espacio para guardar. Exporta tus exámenes y borra resultados antiguos del historial.';

  const persistExams = () => {
    clearTimeout(examsTimer);
    examsTimer = setTimeout(async () => {
      if (!(await safeSet(EXAMS_KEY, JSON.stringify(get().exams)))) set({ storageWarning: NO_SPACE });
    }, 300);
  };

  /** Guarda el índice y las salas del historial; si no hay espacio, descarta las más antiguas. */
  const persistHistory = async (changed?: RoomState) => {
    let history = get().history;
    if (changed && !(await safeSet(historyItemKey(roomKey(changed)), JSON.stringify(changed)))) {
      // libera espacio borrando las salas más antiguas (nunca la que se acaba de guardar)
      let dropped = 0;
      let saved = false;
      while (!saved && history.length > 1) {
        const old = history[history.length - 1];
        if (roomKey(old) === roomKey(changed)) break;
        history = history.slice(0, -1);
        dropped++;
        await AsyncStorage.removeItem(historyItemKey(roomKey(old))).catch(() => {});
        saved = await safeSet(historyItemKey(roomKey(changed)), JSON.stringify(changed));
      }
      set({
        history,
        storageWarning: saved
          ? `No había espacio: se borraron ${dropped} resultado(s) antiguo(s) del historial. Exporta los resultados que quieras conservar.`
          : NO_SPACE,
      });
    }
    if (!(await safeSet(HISTORY_INDEX_KEY, JSON.stringify(history.map(roomKey))))) set({ storageWarning: NO_SPACE });
  };

  const writeRoom = (room: RoomState | null) => {
    clearTimeout(saveRoomTimer);
    saveRoomTimer = null;
    lastRoomSave = Date.now();
    if (room) safeSet(ROOM_KEY, JSON.stringify(room)).then((ok) => ok || set({ storageWarning: NO_SPACE }));
    else AsyncStorage.removeItem(ROOM_KEY).catch(() => {});
  };

  /** La sala activa cambia muy seguido: se guarda a lo más cada ROOM_SAVE_MS. */
  const persistRoom = (room: RoomState | null, now = false) => {
    if (now || !room) return writeRoom(room);
    if (saveRoomTimer) return;
    const wait = Math.max(0, ROOM_SAVE_MS - (Date.now() - lastRoomSave));
    saveRoomTimer = setTimeout(() => writeRoom(host?.state ?? get().room), wait);
  };

  /** El anfitrión cambia muy seguido (avance de cada alumno): se agrupan las actualizaciones. */
  const onRoomChange = (room: RoomState) => {
    pendingRoom = room;
    if (roomTimer) return;
    roomTimer = setTimeout(() => {
      roomTimer = null;
      const r = pendingRoom;
      pendingRoom = null;
      if (!r || !host) return;
      set({ room: r });
      persistRoom(r);
    }, 250);
  };

  // al cerrar o recargar la pestaña se guarda lo último
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', () => {
      if (host) writeRoom(host.state);
    });
  }

  const startHost = async (room: RoomState): Promise<boolean> => {
    host?.dispose();
    host = null;
    set({ opening: true, openError: null });
    let transport;
    try {
      transport = createHostTransport(room.transport);
    } catch (e: any) {
      set({ opening: false, openError: e?.message ?? String(e) });
      return false;
    }
    const h = new ExamHost({
      transport,
      state: room,
      onChange: onRoomChange,
      onNetwork: (online, detail) => set({ network: { online, detail } }),
    });
    try {
      await h.open();
    } catch (e: any) {
      h.dispose();
      set({ opening: false, openError: e instanceof TransportError ? e.message : `No se pudo abrir la sala: ${e?.message ?? e}` });
      return false;
    }
    host = h;
    set({ room: h.state, live: true, opening: false, network: { online: true }, tab: 'room' });
    persistRoom(h.state, true);
    return true;
  };

  const sync = () => {
    if (!host) return;
    clearTimeout(roomTimer);
    roomTimer = null;
    pendingRoom = null;
    set({ room: host.state });
    persistRoom(host.state, true);
  };

  return {
    hydrated: false,
    exams: [],
    editingId: null,
    tab: 'library',
    room: null,
    live: false,
    network: { online: true },
    opening: false,
    openError: null,
    history: [],
    viewingKey: null,
    storageWarning: null,

    async hydrate() {
      if (get().hydrated) return;
      const read = async (key: string) => {
        try {
          const raw = await AsyncStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      };
      let rawExams: any[] = (await read(EXAMS_KEY)) ?? [];
      let history: RoomState[] = [];
      const index: string[] = (await read(HISTORY_INDEX_KEY)) ?? [];
      for (const k of index) {
        const r = await read(historyItemKey(k));
        if (r) history.push(r);
      }
      // migración desde la versión con una sola clave
      const legacy = await read(LEGACY_KEY);
      if (legacy) {
        rawExams = [...rawExams, ...(legacy.exams ?? []).filter((e: any) => !rawExams.some((x) => x?.id === e?.id))];
        const keys = new Set(history.map(roomKey));
        history = [...history, ...(Array.isArray(legacy.history) ? legacy.history : []).filter((h: RoomState) => !keys.has(roomKey(h))).map((h: RoomState) => compactRoom(h))];
      }
      const exams: ExamConfig[] = [];
      for (const e of rawExams) {
        try {
          exams.push(parseExam(JSON.stringify(e)));
        } catch {
          /* se omite */
        }
      }
      set({ exams, history: history.slice(0, MAX_HISTORY), room: await read(ROOM_KEY), hydrated: true });
      if (legacy) {
        const ok = await safeSet(EXAMS_KEY, JSON.stringify(exams));
        for (const h of get().history) await persistHistory(h);
        if (ok) await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
      }
    },

    setTab(tab) {
      set({ tab });
    },

    edit(id) {
      set({ editingId: id, tab: id ? 'editor' : get().tab });
    },

    newExam(sample = false) {
      const e = sample ? sampleExam() : createExam();
      set((s) => ({ exams: [e, ...s.exams], editingId: e.id, tab: 'editor' }));
      persistExams();
      return e;
    },

    saveExam(e) {
      const exam = { ...e, updatedAt: Date.now() };
      set((s) => ({ exams: s.exams.some((x) => x.id === e.id) ? s.exams.map((x) => (x.id === e.id ? exam : x)) : [exam, ...s.exams] }));
      persistExams();
    },

    deleteExam(id) {
      set((s) => ({ exams: s.exams.filter((x) => x.id !== id), editingId: s.editingId === id ? null : s.editingId }));
      persistExams();
    },

    duplicateExam(id) {
      const e = get().exams.find((x) => x.id === id);
      if (!e) return;
      const c = cloneExam(e);
      set((s) => ({ exams: [c, ...s.exams] }));
      persistExams();
    },

    importExam(text) {
      const e = parseExam(text);
      // si ya existe uno con el mismo id se importa como copia
      const exam = get().exams.some((x) => x.id === e.id) ? cloneExam(e, e.title) : e;
      set((s) => ({ exams: [exam, ...s.exams] }));
      persistExams();
      return exam;
    },

    async openRoom(examId, transport) {
      const exam = get().exams.find((x) => x.id === examId);
      if (!exam) return false;
      if (get().room && get().room!.status !== 'closed') {
        set({ openError: 'Ya hay una sala abierta. Ciérrala antes de abrir otra.' });
        return false;
      }
      if (get().room) get().leaveRoom();
      // si el código ya existe (muy raro) se intenta con otro
      for (let i = 0; i < 3; i++) {
        const room = createRoom(roomCode(), JSON.parse(JSON.stringify(exam)), transport);
        const ok = await startHost(room);
        if (ok) return true;
        if (!/en uso/.test(get().openError ?? '')) return false;
      }
      return false;
    },

    async reopenRoom() {
      const room = get().room;
      if (!room) return false;
      return startHost(room);
    },

    startExam() {
      host?.start();
      sync();
    },

    async closeExam() {
      if (!host) return;
      await host.close();
      sync();
      set({ viewingKey: null, tab: 'results' });
    },

    notice(text) {
      host?.notice(text);
      sync();
    },
    addTime(minutes, studentId) {
      host?.addTime(minutes, studentId);
      sync();
    },
    forceSubmit(studentId) {
      host?.forceSubmit(studentId);
      sync();
    },
    adjust(studentId, questionId, points) {
      const key = get().viewingKey;
      if (host && (!key || key === roomKey(host.state))) {
        host.adjust(studentId, questionId, points);
        sync();
        return;
      }
      // examen del historial: se recalcula aquí mismo
      const room = get().history.find((h) => roomKey(h) === key);
      const st = room?.students[studentId];
      if (!room || !st?.key || !st.submittedAt) return;
      const overrides = { ...st.overrides };
      if (points === null) delete overrides[questionId];
      else overrides[questionId] = points;
      const result = gradePaper(room.exam, st.key, st.answers, overrides);
      const updated: RoomState = { ...room, students: { ...room.students, [studentId]: { ...st, overrides, result } } };
      set((s) => ({ history: s.history.map((h) => (roomKey(h) === key ? updated : h)) }));
      persistHistory(updated);
    },
    removeStudent(studentId) {
      host?.remove(studentId);
      sync();
    },
    setLocked(locked) {
      host?.setLocked(locked);
      sync();
    },
    reopenStudent(studentId, minutes) {
      host?.reopen(studentId, minutes);
      sync();
    },

    leaveRoom() {
      const room = host?.state ?? get().room;
      host?.dispose();
      host = null;
      clearTimeout(roomTimer);
      roomTimer = null;
      if (room && room.status === 'closed') {
        const compact = compactRoom(room);
        const kept = [compact, ...get().history.filter((h) => roomKey(h) !== roomKey(room))];
        for (const old of kept.slice(MAX_HISTORY)) AsyncStorage.removeItem(historyItemKey(roomKey(old))).catch(() => {});
        set((s) => ({ history: kept.slice(0, MAX_HISTORY), viewingKey: s.tab === 'results' ? roomKey(room) : s.viewingKey }));
        persistHistory(compact);
      }
      set({ room: null, live: false, openError: null });
      persistRoom(null);
    },

    viewHistory(viewingKey) {
      set({ viewingKey, tab: 'results' });
    },

    deleteHistory(key) {
      set((s) => ({ history: s.history.filter((h) => roomKey(h) !== key), viewingKey: s.viewingKey === key ? null : s.viewingKey, storageWarning: null }));
      AsyncStorage.removeItem(historyItemKey(key)).catch(() => {});
      persistHistory();
    },

    dismissStorageWarning() {
      set({ storageWarning: null });
    },
  };
});

/** Sala que se muestra en «Resultados»: la del historial elegida o la actual. */
export function useResultsRoom(): RoomState | null {
  const room = useTeacher((s) => s.room);
  const history = useTeacher((s) => s.history);
  const key = useTeacher((s) => s.viewingKey);
  if (key) return history.find((h) => roomKey(h) === key) ?? null;
  return room;
}
