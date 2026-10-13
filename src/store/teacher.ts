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
import { createRoom, RoomState } from '../core/exam/room';
import { createHostTransport, TransportError, TransportSpec } from '../core/exam/transport';
import type { ExamConfig } from '../core/exam/types';

export type TeacherTab = 'library' | 'editor' | 'room' | 'results';

const LIB_KEY = 'psjs.teacher.v1';
const ROOM_KEY = 'psjs.teacher.room.v1';
const MAX_HISTORY = 25;

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
  /** Sale de la sala (si está cerrada pasa al historial). */
  leaveRoom(): void;
  viewHistory(key: string | null): void;
  deleteHistory(key: string): void;
}

/** Identificador de una sala del historial. */
export const roomKey = (r: Pick<RoomState, 'code' | 'openedAt'>) => `${r.code}@${r.openedAt}`;

let host: ExamHost | null = null;
let roomTimer: any = null;
let pendingRoom: RoomState | null = null;
let libTimer: any = null;

export const useTeacher = create<TeacherState>((set, get) => {
  const persistLib = () => {
    clearTimeout(libTimer);
    libTimer = setTimeout(() => {
      const { exams, history } = get();
      AsyncStorage.setItem(LIB_KEY, JSON.stringify({ exams, history })).catch(() => {});
    }, 300);
  };

  const persistRoom = (room: RoomState | null) => {
    if (room) AsyncStorage.setItem(ROOM_KEY, JSON.stringify(room)).catch(() => {});
    else AsyncStorage.removeItem(ROOM_KEY).catch(() => {});
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
    persistRoom(h.state);
    return true;
  };

  const sync = () => {
    if (!host) return;
    clearTimeout(roomTimer);
    roomTimer = null;
    pendingRoom = null;
    set({ room: host.state });
    persistRoom(host.state);
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

    async hydrate() {
      if (get().hydrated) return;
      let lib: any = null;
      let room: RoomState | null = null;
      try {
        const raw = await AsyncStorage.getItem(LIB_KEY);
        lib = raw ? JSON.parse(raw) : null;
        const rr = await AsyncStorage.getItem(ROOM_KEY);
        room = rr ? JSON.parse(rr) : null;
      } catch {
        /* datos dañados: se empieza de cero */
      }
      const exams: ExamConfig[] = [];
      for (const e of lib?.exams ?? []) {
        try {
          exams.push(parseExam(JSON.stringify(e)));
        } catch {
          /* se omite */
        }
      }
      set({ exams, history: Array.isArray(lib?.history) ? lib.history : [], room, hydrated: true });
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
      persistLib();
      return e;
    },

    saveExam(e) {
      const exam = { ...e, updatedAt: Date.now() };
      set((s) => ({ exams: s.exams.some((x) => x.id === e.id) ? s.exams.map((x) => (x.id === e.id ? exam : x)) : [exam, ...s.exams] }));
      persistLib();
    },

    deleteExam(id) {
      set((s) => ({ exams: s.exams.filter((x) => x.id !== id), editingId: s.editingId === id ? null : s.editingId }));
      persistLib();
    },

    duplicateExam(id) {
      const e = get().exams.find((x) => x.id === id);
      if (!e) return;
      const c = cloneExam(e);
      set((s) => ({ exams: [c, ...s.exams] }));
      persistLib();
    },

    importExam(text) {
      const e = parseExam(text);
      // si ya existe uno con el mismo id se importa como copia
      const exam = get().exams.some((x) => x.id === e.id) ? cloneExam(e, e.title) : e;
      set((s) => ({ exams: [exam, ...s.exams] }));
      persistLib();
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
      persistLib();
    },
    removeStudent(studentId) {
      host?.remove(studentId);
      sync();
    },

    leaveRoom() {
      const room = host?.state ?? get().room;
      host?.dispose();
      host = null;
      clearTimeout(roomTimer);
      roomTimer = null;
      if (room && room.status === 'closed') {
        set((s) => ({ history: [room, ...s.history.filter((h) => roomKey(h) !== roomKey(room))].slice(0, MAX_HISTORY), viewingKey: s.tab === 'results' ? roomKey(room) : s.viewingKey }));
        persistLib();
      }
      set({ room: null, live: false, openError: null });
      persistRoom(null);
    },

    viewHistory(viewingKey) {
      set({ viewingKey, tab: 'results' });
    },

    deleteHistory(key) {
      set((s) => ({ history: s.history.filter((h) => roomKey(h) !== key), viewingKey: s.viewingKey === key ? null : s.viewingKey }));
      persistLib();
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
