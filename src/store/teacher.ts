/**
 * Estado del modo Maestro: biblioteca de exámenes, salas activas (anfitrión)
 * e historial de exámenes aplicados. Todo se guarda en el dispositivo.
 *
 * Se pueden tener varias salas abiertas al mismo tiempo (por ejemplo, un examen
 * distinto para cada grupo): cada una tiene su propio código, su propia conexión
 * y se guarda por separado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { cloneExam, createExam, parseExam, sampleExam } from '../core/exam/config';
import { getCertification } from '../core/exam/certs';
import { adjustResult, gradePaper } from '../core/exam/grading';
import { ExamHost } from '../core/exam/host';
import { roomCode } from '../core/exam/random';
import { compactRoom, createRoom, normalizeName, RoomState, studentPhase } from '../core/exam/room';
import { createHostTransport, TransportError, TransportSpec } from '../core/exam/transport';
import type { ExamConfig } from '../core/exam/types';
import { createVault, decryptText, defaultRandom, encryptText, isEncrypted, openVault, RandomBytes, VaultMeta } from '../core/vault';

export type TeacherTab = 'library' | 'editor' | 'room' | 'results';

/** Versión anterior: exámenes e historial en una sola clave (se migra al abrir). */
const LEGACY_KEY = 'psjs.teacher.v1';
const EXAMS_KEY = 'psjs.teacher.exams.v2';
const HISTORY_INDEX_KEY = 'psjs.teacher.history.v2';
const historyItemKey = (key: string) => `${HISTORY_INDEX_KEY}:${key}`;
/** Versión anterior: una sola sala activa (se migra al abrir). */
const LEGACY_ROOM_KEY = 'psjs.teacher.room.v1';
/** Índice de las salas activas y cada sala en su propia clave. */
const ROOMS_INDEX_KEY = 'psjs.teacher.rooms.v2';
/** Tiempo adicional que se recuerda por alumno (adecuaciones), por nombre. */
const ACCOM_KEY = 'psjs.teacher.accommodations.v1';
const roomItemKey = (key: string) => `${ROOMS_INDEX_KEY}:${key}`;
/** Datos para reconocer la contraseña del modo Maestro (si existe, todo lo demás va cifrado). */
const LOCK_KEY = 'psjs.teacher.lock.v1';
const TEACHER_PREFIX = 'psjs.teacher.';
/** Sin actividad durante este tiempo, el modo Maestro protegido se bloquea solo. */
export const AUTO_LOCK_MS = 10 * 60_000;
const random: RandomBytes = Platform.OS === 'web' ? defaultRandom : (n) => ExpoCrypto.getRandomBytes(n);
const MAX_HISTORY = 30;
/** Salas abiertas a la vez (cada una mantiene su conexión y la recibe este equipo). */
export const MAX_OPEN_ROOMS = 8;
/** Cada cuánto se guardan las salas activas mientras cambian (la interfaz se actualiza más seguido). */
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

export interface NetworkState {
  online: boolean;
  detail?: string;
}

interface TeacherState {
  hydrated: boolean;
  exams: ExamConfig[];
  editingId: string | null;
  tab: TeacherTab;
  /** Salas actuales (abiertas, o cerradas que aún no se archivan), la más reciente primero. */
  rooms: RoomState[];
  /** Sala que se muestra en «Sala en vivo» (ver roomKey); null = abrir una sala nueva. */
  activeKey: string | null;
  /** Salas cuyo anfitrión está funcionando (aceptando alumnos) en este momento. */
  liveKeys: string[];
  /** Conexión de cada sala con la red. */
  network: Record<string, NetworkState>;
  opening: boolean;
  openError: string | null;
  /** Exámenes aplicados (salas archivadas). */
  history: RoomState[];
  /** Sala que se consulta en «Resultados» (actual o del historial); null = la sala activa. */
  viewingKey: string | null;
  /** Problema al guardar en el dispositivo (sin espacio). */
  storageWarning: string | null;
  /** Minutos adicionales que se aplican solos a cada alumno (por nombre normalizado). */
  accommodations: Record<string, number>;
  /** El modo Maestro tiene contraseña: lo guardado está cifrado. */
  secured: boolean;
  /** Pantalla bloqueada: hace falta la contraseña para ver o usar los exámenes. */
  locked: boolean;

  hydrate(): Promise<void>;
  setTab(t: TeacherTab): void;
  edit(id: string | null): void;
  newExam(sample?: boolean): ExamConfig;
  saveExam(e: ExamConfig): void;
  deleteExam(id: string): void;
  duplicateExam(id: string): void;
  importExam(text: string): ExamConfig;
  /** Agrega el simulacro y la copia de práctica de una certificación incluida. */
  addCertification(id: string): ExamConfig[];

  /** Muestra una sala en «Sala en vivo» (null = formulario para abrir otra). */
  selectRoom(key: string | null): void;
  /** Abre una sala nueva (las que ya están abiertas siguen funcionando). */
  openRoom(examId: string, transport: TransportSpec): Promise<boolean>;
  /** Vuelve a abrir una sala que quedó sin cerrar (p. ej. al recargar). */
  reopenRoom(key: string): Promise<boolean>;
  /** Vuelve a abrir todas las salas sin cerrar. */
  reopenAll(): Promise<void>;
  startExam(key: string): void;
  closeExam(key: string): Promise<void>;
  notice(key: string, text: string): void;
  addTime(key: string, minutes: number, studentId?: string): void;
  forceSubmit(key: string, studentId: string): void;
  /** Ajusta a mano los puntos de una pregunta (en una sala actual o del historial). */
  adjust(key: string, studentId: string, questionId: string, points: number | null): void;
  removeStudent(key: string, studentId: string): void;
  setLocked(key: string, locked: boolean): void;
  reopenStudent(key: string, studentId: string, minutes?: number): void;
  /** Solicitud para seguir un examen en otro dispositivo: es la misma persona. */
  approveReconnect(key: string, requestId: string): void;
  /** Solicitud de reconexión que en realidad es otro alumno con el mismo nombre. */
  admitAsNew(key: string, requestId: string): void;
  rejectReconnect(key: string, requestId: string): void;
  /** Tiempo adicional de un alumno; `remember` lo aplica en los próximos exámenes (por su nombre). */
  setExtraTime(key: string, studentId: string, minutes: number, remember?: boolean): void;
  /** Comentario del maestro en una pregunta (lo ve el alumno con su resultado). */
  setComment(key: string, studentId: string, questionId: string, text: string): void;
  /** Criterios de la rúbrica cumplidos; la pregunta vale la suma de sus puntos. */
  setRubric(key: string, studentId: string, questionId: string, ids: string[]): void;
  /** Quita la sala de la lista (si está cerrada, pasa al historial; si no, se descarta). */
  leaveRoom(key: string): void;
  viewHistory(key: string | null): void;
  /** Agrega al historial una sala desde su respaldo (.json); devuelve su clave. */
  importHistory(text: string): string;
  deleteHistory(key: string): void;
  dismissStorageWarning(): void;

  /** Abre el modo Maestro con la contraseña; false si es incorrecta. */
  unlock(password: string): Promise<boolean>;
  /** Bloquea (si hay salas en vivo siguen funcionando, solo se ocultan). */
  lock(): Promise<void>;
  /** ¿Es la contraseña actual? */
  checkPassword(password: string): Promise<boolean>;
  /** Pone o cambia la contraseña y vuelve a cifrar todo. */
  setPassword(password: string): Promise<void>;
  /** Quita la contraseña: los datos se guardan otra vez sin cifrar. */
  removePassword(): Promise<void>;
  /** Contraseña olvidada: borra todos los datos del modo Maestro de este dispositivo. */
  forgetAll(): Promise<void>;
}

/** Identificador de una sala (actual o del historial). */
export const roomKey = (r: Pick<RoomState, 'code' | 'openedAt'>) => `${r.code}@${r.openedAt}`;

/** La sala sigue abierta (en espera o en curso). */
export const isOpenRoom = (r: RoomState) => r.status !== 'closed';

/** Alumnos que están resolviendo el examen en una sala. */
export const workingCount = (r: RoomState) => Object.values(r.students).filter((x) => studentPhase(x, r) === 'working').length;

/** Anfitrión de cada sala abierta en este equipo (por roomKey). */
const hosts = new Map<string, ExamHost>();
let roomTimer: any = null;
/** Cambios de las salas que aún no llegan a la interfaz. */
const pendingRooms = new Map<string, RoomState>();
/** Salas que cambiaron y faltan por guardar. */
const dirtyRooms = new Set<string>();
let examsTimer: any = null;
let saveRoomTimer: any = null;
let lastRoomSave = 0;
/** Clave de cifrado (solo en memoria, mientras el modo Maestro está abierto). */
let vaultKey: Uint8Array | null = null;
let vaultMeta: VaultMeta | null = null;
/** Exámenes, historial y salas ya están en memoria (se descargan al bloquear). */
let dataLoaded = false;
/** Escrituras del historial en curso (se esperan antes de bloquear o cambiar la contraseña). */
let historyChain: Promise<void> = Promise.resolve();

/** Texto a guardar: JSON, cifrado si hay contraseña. null = no se puede guardar ahora (bloqueado). */
function pack(value: unknown): string | null {
  const json = JSON.stringify(value);
  if (!vaultMeta) return json;
  return vaultKey ? encryptText(vaultKey, json, random) : null;
}

/** Lee lo guardado (cifrado o no). Sin la clave, lo cifrado no se puede leer. */
function unpack(raw: string | null): any {
  if (!raw) return null;
  if (isEncrypted(raw)) return vaultKey ? JSON.parse(decryptText(vaultKey, raw)) : null;
  return JSON.parse(raw);
}

/** Guarda (cifrado si corresponde). Nunca escribe en claro algo que debería ir cifrado. */
async function save(key: string, value: unknown): Promise<boolean> {
  const text = pack(value);
  return text === null ? true : safeSet(key, text);
}

/** Reemplaza (o agrega al principio) una sala en la lista. */
function upsertRoom(rooms: RoomState[], room: RoomState): RoomState[] {
  const key = roomKey(room);
  return rooms.some((r) => roomKey(r) === key) ? rooms.map((r) => (roomKey(r) === key ? room : r)) : [room, ...rooms];
}

/** Ajusta a mano los puntos de una pregunta de un alumno (sin volver a calificar todo su examen). */
function regrade(room: RoomState, studentId: string, questionId: string, points: number | null): RoomState | null {
  const st = room.students[studentId];
  if (!st?.key || !st.submittedAt) return null;
  const overrides = { ...st.overrides };
  if (points === null) delete overrides[questionId];
  else overrides[questionId] = points;
  const result = st.result ? adjustResult(room.exam, st.key, st.answers, st.result, questionId, points) : gradePaper(room.exam, st.key, st.answers, overrides);
  return { ...room, students: { ...room.students, [studentId]: { ...st, overrides, result } } };
}

export const useTeacher = create<TeacherState>((set, get) => {
  const NO_SPACE = 'El dispositivo se quedó sin espacio para guardar. Exporta tus exámenes y borra resultados antiguos del historial.';

  const persistExams = () => {
    clearTimeout(examsTimer);
    examsTimer = setTimeout(async () => {
      examsTimer = null;
      if (!(await save(EXAMS_KEY, get().exams))) set({ storageWarning: NO_SPACE });
    }, 300);
  };

  /** Guarda el índice y las salas del historial (en orden); si no hay espacio, descarta las más antiguas. */
  const persistHistory = (changed?: RoomState) => {
    historyChain = historyChain.then(() => writeHistory(changed)).catch(() => {});
    return historyChain;
  };
  const writeHistory = async (changed?: RoomState) => {
    let history = get().history;
    if (changed && !(await save(historyItemKey(roomKey(changed)), changed))) {
      // libera espacio borrando las salas más antiguas (nunca la que se acaba de guardar)
      let dropped = 0;
      let saved = false;
      while (!saved && history.length > 1) {
        const old = history[history.length - 1];
        if (roomKey(old) === roomKey(changed)) break;
        history = history.slice(0, -1);
        dropped++;
        await AsyncStorage.removeItem(historyItemKey(roomKey(old))).catch(() => {});
        saved = await save(historyItemKey(roomKey(changed)), changed);
      }
      set({
        history,
        storageWarning: saved
          ? `No había espacio: se borraron ${dropped} resultado(s) antiguo(s) del historial. Exporta los resultados que quieras conservar.`
          : NO_SPACE,
      });
    }
    if (!(await save(HISTORY_INDEX_KEY, history.map(roomKey)))) set({ storageWarning: NO_SPACE });
  };

  /** Salas actuales con el estado más reciente de cada anfitrión. */
  const currentRooms = () => get().rooms.map((r) => hosts.get(roomKey(r))?.state ?? r);

  /** Escribe las salas que cambiaron y el índice. */
  const writeRooms = () => {
    clearTimeout(saveRoomTimer);
    saveRoomTimer = null;
    lastRoomSave = Date.now();
    const rooms = currentRooms();
    for (const r of rooms) {
      if (dirtyRooms.has(roomKey(r))) save(roomItemKey(roomKey(r)), r).then((ok) => ok || set({ storageWarning: NO_SPACE }));
    }
    dirtyRooms.clear();
    save(ROOMS_INDEX_KEY, rooms.map(roomKey)).then((ok) => ok || set({ storageWarning: NO_SPACE }));
  };

  /** Las salas cambian muy seguido: se guardan a lo más cada ROOM_SAVE_MS. */
  const persistRoom = (key: string, now = false) => {
    dirtyRooms.add(key);
    if (now) return writeRooms();
    if (saveRoomTimer) return;
    const wait = Math.max(0, ROOM_SAVE_MS - (Date.now() - lastRoomSave));
    saveRoomTimer = setTimeout(writeRooms, wait);
  };

  /** Los anfitriones cambian muy seguido (avance de cada alumno): se agrupan las actualizaciones. */
  const onRoomChange = (room: RoomState) => {
    pendingRooms.set(roomKey(room), room);
    if (roomTimer) return;
    roomTimer = setTimeout(() => {
      roomTimer = null;
      const changed = [...pendingRooms.entries()].filter(([k]) => hosts.has(k));
      pendingRooms.clear();
      if (!changed.length) return;
      const byKey = new Map(changed);
      set((s) => ({ rooms: s.rooms.map((r) => byKey.get(roomKey(r)) ?? r) }));
      for (const [k] of changed) persistRoom(k);
      // tiempo adicional recordado (adecuaciones): se aplica solo a quien entra
      const accom = get().accommodations;
      if (Object.keys(accom).length) {
        for (const [k, r] of changed) {
          for (const st of Object.values(r.students)) {
            const extra = accom[normalizeName(st.name)];
            if (extra && st.extraMinutes === undefined && !st.submittedAt) hosts.get(k)?.setExtraTime(st.id, extra);
          }
        }
      }
    }, 250);
  };

  // al cerrar o recargar la pestaña se guarda lo último
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', () => {
      flushHistorySoon();
      if (!hosts.size && !saveRoomTimer) return;
      for (const k of hosts.keys()) dirtyRooms.add(k);
      writeRooms();
    });
  }

  /** Abre el anfitrión de una sala. `focus`: muestra la sala en «Sala en vivo». */
  const startHost = async (room: RoomState, focus = true): Promise<boolean> => {
    const key = roomKey(room);
    hosts.get(key)?.dispose();
    hosts.delete(key);
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
      onNetwork: (online, detail) => set((s) => ({ network: { ...s.network, [key]: { online, detail } } })),
    });
    try {
      await h.open();
    } catch (e: any) {
      h.dispose();
      set({ opening: false, openError: e instanceof TransportError ? e.message : `No se pudo abrir la sala: ${e?.message ?? e}` });
      return false;
    }
    hosts.set(key, h);
    set((s) => ({
      rooms: upsertRoom(s.rooms, h.state),
      liveKeys: s.liveKeys.includes(key) ? s.liveKeys : [...s.liveKeys, key],
      network: { ...s.network, [key]: { online: true } },
      opening: false,
      ...(focus ? { tab: 'room' as const, activeKey: key } : {}),
    }));
    persistRoom(key, true);
    return true;
  };

  /**
   * Reabre una sala con su mismo código. Si el servidor todavía lo tiene «en uso» (la
   * conexión anterior no se ha liberado, puede tardar hasta un minuto), se reintenta solo
   * para que los alumnos puedan reconectarse sin que el maestro tenga que hacer nada.
   */
  const reopenWithRetry = async (room: RoomState, focus: boolean): Promise<boolean> => {
    const key = roomKey(room);
    for (let i = 0; i < 12; i++) {
      if (await startHost(get().rooms.find((r) => roomKey(r) === key) ?? room, focus)) return true;
      if (!/en uso/.test(get().openError ?? '') || !get().rooms.some((r) => roomKey(r) === key)) return false;
      set({ openError: `El código ${room.code} todavía está ocupado por la conexión anterior. Reintentando para que tus alumnos puedan volver (${i + 1}/12)…`, opening: true });
      await new Promise((r) => setTimeout(r, 5000));
    }
    set({ opening: false, openError: `No se pudo recuperar el código ${room.code}. Presiona «Reabrir sala» en un momento.` });
    return false;
  };

  /** Lleva a la interfaz el estado actual de un anfitrión y lo guarda. */
  const sync = (key: string, saveNow = true) => {
    const h = hosts.get(key);
    if (!h) return;
    pendingRooms.delete(key);
    set((s) => ({ rooms: upsertRoom(s.rooms, h.state) }));
    persistRoom(key, saveNow);
  };

  /** Cambia un alumno de una sala sin anfitrión (cerrada antes de recargar) o del historial. */
  const editOffline = (key: string, studentId: string, change: (room: RoomState) => RoomState | null) => {
    const current = get().rooms.find((r) => roomKey(r) === key);
    if (current) {
      const updated = change(current);
      if (!updated) return;
      set((s) => ({ rooms: upsertRoom(s.rooms, updated) }));
      persistRoom(key);
      return;
    }
    const room = get().history.find((h) => roomKey(h) === key);
    const updated = room && change(room);
    if (!updated) return;
    set((s) => ({ history: s.history.map((h) => (roomKey(h) === key ? updated : h)) }));
    persistHistorySoon(updated);
  };

  /** Ajustes del historial pendientes de guardar (al calificar a mano se agrupan los clics). */
  const historyTimers = new Map<string, any>();
  const persistHistorySoon = (room: RoomState) => {
    const key = roomKey(room);
    clearTimeout(historyTimers.get(key));
    historyTimers.set(
      key,
      setTimeout(() => {
        historyTimers.delete(key);
        const latest = get().history.find((h) => roomKey(h) === key);
        if (latest) persistHistory(latest);
      }, 800),
    );
  };

  /** Guarda ya los ajustes del historial que esperaban (antes de bloquear o al cerrar la pestaña). */
  const flushHistorySoon = () => {
    for (const [key, timer] of historyTimers) {
      clearTimeout(timer);
      historyTimers.delete(key);
      const latest = get().history.find((h) => roomKey(h) === key);
      if (latest) persistHistory(latest);
    }
  };

  /** Acción del maestro sobre el anfitrión de una sala. */
  const withHost = (key: string, fn: (h: ExamHost) => void) => {
    const h = hosts.get(key);
    if (!h) return;
    fn(h);
    sync(key);
  };

  /** Lee exámenes, historial y salas del dispositivo (descifrando si hay contraseña). */
  const loadAll = async () => {
    const read = async (key: string) => {
      try {
        return unpack(await AsyncStorage.getItem(key));
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
    // salas activas (y la sala única de la versión anterior)
    const rooms: RoomState[] = [];
    const roomIndex: string[] = (await read(ROOMS_INDEX_KEY)) ?? [];
    for (const k of roomIndex) {
      const r = await read(roomItemKey(k));
      if (r?.code) rooms.push(r);
    }
    const legacyRoom: RoomState | null = await read(LEGACY_ROOM_KEY);
    if (legacyRoom?.code && !rooms.some((r) => roomKey(r) === roomKey(legacyRoom))) rooms.push(legacyRoom);
    const first = rooms.find(isOpenRoom) ?? rooms[0];
    const accommodations = (await read(ACCOM_KEY)) ?? {};
    set({ exams, history: history.slice(0, MAX_HISTORY), rooms, activeKey: first ? roomKey(first) : null, accommodations });
    dataLoaded = true;
    if (legacy) {
      const ok = await save(EXAMS_KEY, exams);
      for (const h of get().history) await persistHistory(h);
      if (ok) await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
    }
    if (legacyRoom) {
      for (const r of rooms) await save(roomItemKey(roomKey(r)), r);
      if (await save(ROOMS_INDEX_KEY, rooms.map(roomKey))) await AsyncStorage.removeItem(LEGACY_ROOM_KEY).catch(() => {});
    }
  };

  /** Escribe ya lo pendiente (antes de bloquear o de cambiar la contraseña). */
  const flush = async () => {
    if (examsTimer) {
      clearTimeout(examsTimer);
      examsTimer = null;
      await save(EXAMS_KEY, get().exams);
    }
    if (saveRoomTimer) writeRooms();
    flushHistorySoon();
    await historyChain;
  };

  /** Vuelve a guardar todo con la clave actual (o sin cifrar si ya no hay contraseña). */
  const rewriteAll = async () => {
    await save(EXAMS_KEY, get().exams);
    for (const h of get().history) await save(historyItemKey(roomKey(h)), h);
    await save(HISTORY_INDEX_KEY, get().history.map(roomKey));
    const rooms = currentRooms();
    for (const r of rooms) await save(roomItemKey(roomKey(r)), r);
    await save(ROOMS_INDEX_KEY, rooms.map(roomKey));
    await save(ACCOM_KEY, get().accommodations);
  };

  return {
    hydrated: false,
    exams: [],
    editingId: null,
    tab: 'library',
    rooms: [],
    activeKey: null,
    liveKeys: [],
    network: {},
    opening: false,
    openError: null,
    history: [],
    viewingKey: null,
    storageWarning: null,
    accommodations: {},
    secured: false,
    locked: false,

    async hydrate() {
      if (get().hydrated) return;
      try {
        const raw = await AsyncStorage.getItem(LOCK_KEY);
        vaultMeta = raw ? JSON.parse(raw) : null;
      } catch {
        vaultMeta = null;
      }
      // con contraseña no se lee nada hasta desbloquear
      if (vaultMeta && !vaultKey) {
        set({ hydrated: true, secured: true, locked: true });
        return;
      }
      await loadAll();
      set({ hydrated: true, secured: !!vaultMeta, locked: false });
    },

    async unlock(password) {
      if (!vaultMeta) return true;
      const key = await openVault(password, vaultMeta);
      if (!key) return false;
      vaultKey = key;
      // con salas en vivo los datos siguen en memoria (solo estaban ocultos)
      if (!dataLoaded) await loadAll();
      set({ locked: false });
      // las salas que estaban abiertas al recargar vuelven a recibir alumnos
      get().reopenAll();
      return true;
    },

    async lock() {
      if (!vaultMeta) return;
      await flush();
      if (hosts.size) {
        set({ locked: true });
        return;
      }
      vaultKey = null;
      dataLoaded = false;
      set({ locked: true, exams: [], history: [], rooms: [], activeKey: null, liveKeys: [], network: {}, accommodations: {}, editingId: null, viewingKey: null, tab: 'library' });
    },

    async checkPassword(password) {
      return !vaultMeta || !!(await openVault(password, vaultMeta));
    },

    async setPassword(password) {
      if (get().locked) throw new Error('Primero desbloquea el modo Maestro.');
      await flush();
      const { key, meta } = await createVault(password, random);
      // primero la contraseña y luego los datos: si se interrumpe, lo no reescrito sigue legible (en claro)
      if (!(await safeSet(LOCK_KEY, JSON.stringify(meta)))) throw new Error('No se pudo guardar la contraseña en el dispositivo.');
      vaultMeta = meta;
      vaultKey = key;
      await rewriteAll();
      set({ secured: true });
    },

    async removePassword() {
      if (get().locked || !vaultMeta) return;
      await flush();
      vaultMeta = null;
      vaultKey = null;
      await rewriteAll();
      await AsyncStorage.removeItem(LOCK_KEY).catch(() => {});
      set({ secured: false });
    },

    async forgetAll() {
      for (const h of hosts.values()) h.dispose();
      hosts.clear();
      pendingRooms.clear();
      dirtyRooms.clear();
      clearTimeout(examsTimer);
      clearTimeout(saveRoomTimer);
      examsTimer = saveRoomTimer = null;
      await historyChain;
      try {
        const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(TEACHER_PREFIX));
        if (keys.length) await AsyncStorage.multiRemove(keys);
      } catch {
        /* se ignora */
      }
      vaultMeta = null;
      vaultKey = null;
      dataLoaded = true;
      set({ exams: [], history: [], rooms: [], activeKey: null, liveKeys: [], network: {}, accommodations: {}, editingId: null, viewingKey: null, tab: 'library', secured: false, locked: false });
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

    addCertification(id) {
      const list = getCertification(id).exams();
      set((s) => ({ exams: [...list, ...s.exams] }));
      persistExams();
      return list;
    },

    selectRoom(key) {
      set({ activeKey: key, tab: 'room', openError: null });
    },

    async openRoom(examId, transport) {
      const exam = get().exams.find((x) => x.id === examId);
      if (!exam) return false;
      if (get().rooms.filter(isOpenRoom).length >= MAX_OPEN_ROOMS) {
        set({ openError: `Ya tienes ${MAX_OPEN_ROOMS} salas abiertas. Cierra alguna antes de abrir otra.` });
        return false;
      }
      // si el código ya existe (muy raro) se intenta con otro
      for (let i = 0; i < 3; i++) {
        let code = roomCode();
        while (get().rooms.some((r) => r.code === code)) code = roomCode();
        const room = createRoom(code, JSON.parse(JSON.stringify(exam)), transport);
        const ok = await startHost(room);
        if (ok) return true;
        if (!/en uso/.test(get().openError ?? '')) return false;
      }
      return false;
    },

    async reopenRoom(key) {
      const room = get().rooms.find((r) => roomKey(r) === key);
      if (!room) return false;
      return reopenWithRetry(room, true);
    },

    async reopenAll() {
      for (const room of get().rooms) {
        if (isOpenRoom(room) && !hosts.has(roomKey(room))) await reopenWithRetry(room, false);
      }
    },

    startExam(key) {
      withHost(key, (h) => h.start());
    },

    async closeExam(key) {
      const h = hosts.get(key);
      if (!h) return;
      await h.close();
      sync(key);
      set({ viewingKey: key, tab: 'results' });
    },

    notice(key, text) {
      withHost(key, (h) => h.notice(text));
    },
    addTime(key, minutes, studentId) {
      withHost(key, (h) => h.addTime(minutes, studentId));
    },
    forceSubmit(key, studentId) {
      withHost(key, (h) => h.forceSubmit(studentId));
    },
    adjust(key, studentId, questionId, points) {
      const h = hosts.get(key);
      if (h) {
        // la interfaz se actualiza ya; se guarda en el dispositivo poco después (agrupando clics)
        h.adjust(studentId, questionId, points);
        sync(key, false);
        return;
      }
      // sala actual sin anfitrión (cerrada antes de recargar): se recalcula aquí mismo
      const current = get().rooms.find((r) => roomKey(r) === key);
      if (current) {
        const updated = regrade(current, studentId, questionId, points);
        if (!updated) return;
        set((s) => ({ rooms: upsertRoom(s.rooms, updated) }));
        persistRoom(key);
        return;
      }
      // examen del historial
      const room = get().history.find((h) => roomKey(h) === key);
      const updated = room && regrade(room, studentId, questionId, points);
      if (!updated) return;
      set((s) => ({ history: s.history.map((h) => (roomKey(h) === key ? updated : h)) }));
      persistHistorySoon(updated);
    },
    removeStudent(key, studentId) {
      withHost(key, (h) => h.remove(studentId));
    },
    setLocked(key, locked) {
      withHost(key, (h) => h.setLocked(locked));
    },
    reopenStudent(key, studentId, minutes) {
      withHost(key, (h) => h.reopen(studentId, minutes));
    },
    approveReconnect(key, requestId) {
      withHost(key, (h) => h.approveReconnect(requestId));
    },
    admitAsNew(key, requestId) {
      withHost(key, (h) => h.admitAsNew(requestId));
    },
    rejectReconnect(key, requestId) {
      withHost(key, (h) => h.rejectReconnect(requestId));
    },
    setExtraTime(key, studentId, minutes, remember) {
      const h = hosts.get(key);
      const st = (h?.state ?? get().rooms.find((r) => roomKey(r) === key))?.students[studentId];
      if (h) withHost(key, (x) => x.setExtraTime(studentId, minutes));
      if (remember !== undefined && st) {
        const accommodations = { ...get().accommodations };
        if (remember && minutes > 0) accommodations[normalizeName(st.name)] = minutes;
        else delete accommodations[normalizeName(st.name)];
        set({ accommodations });
        save(ACCOM_KEY, accommodations);
      }
    },
    setComment(key, studentId, questionId, text) {
      const h = hosts.get(key);
      if (h) {
        h.setComment(studentId, questionId, text);
        sync(key, false);
        return;
      }
      editOffline(key, studentId, (room) => {
        const st = room.students[studentId];
        if (!st) return null;
        const comments = { ...(st.comments ?? {}) };
        if (text.trim()) comments[questionId] = text.trim().slice(0, 2000);
        else delete comments[questionId];
        return { ...room, students: { ...room.students, [studentId]: { ...st, comments } } };
      });
    },
    setRubric(key, studentId, questionId, ids) {
      const h = hosts.get(key);
      if (h) {
        h.setRubric(studentId, questionId, ids);
        sync(key, false);
        return;
      }
      editOffline(key, studentId, (room) => {
        const q = room.exam.questions.find((x) => x.id === questionId);
        const st = room.students[studentId];
        if (!q?.rubric?.length || !st) return null;
        const valid = q.rubric.filter((c) => ids.includes(c.id));
        const marked: RoomState = { ...room, students: { ...room.students, [studentId]: { ...st, rubric: { ...(st.rubric ?? {}), [questionId]: valid.map((c) => c.id) } } } };
        return regrade(marked, studentId, questionId, valid.reduce((a, c) => a + c.points, 0)) ?? marked;
      });
    },

    leaveRoom(key) {
      const h = hosts.get(key);
      const room = h?.state ?? get().rooms.find((r) => roomKey(r) === key);
      h?.dispose();
      hosts.delete(key);
      pendingRooms.delete(key);
      dirtyRooms.delete(key);
      if (room && room.status === 'closed') {
        const compact = compactRoom(room);
        const kept = [compact, ...get().history.filter((x) => roomKey(x) !== key)];
        for (const old of kept.slice(MAX_HISTORY)) AsyncStorage.removeItem(historyItemKey(roomKey(old))).catch(() => {});
        set({ history: kept.slice(0, MAX_HISTORY) });
        persistHistory(compact);
      }
      set((s) => {
        const rooms = s.rooms.filter((r) => roomKey(r) !== key);
        const network = { ...s.network };
        delete network[key];
        const next = rooms.find(isOpenRoom) ?? rooms[0];
        return {
          rooms,
          network,
          liveKeys: s.liveKeys.filter((k) => k !== key),
          activeKey: s.activeKey === key ? (next ? roomKey(next) : null) : s.activeKey,
          // si se archivó, los resultados siguen visibles desde el historial con la misma clave
          viewingKey: s.viewingKey === key && !(room && room.status === 'closed') ? null : s.viewingKey,
          openError: null,
        };
      });
      AsyncStorage.removeItem(roomItemKey(key)).catch(() => {});
      writeRooms();
    },

    viewHistory(viewingKey) {
      set({ viewingKey, tab: 'results' });
    },

    importHistory(text) {
      let raw: any;
      try {
        raw = JSON.parse(text.replace(/^\uFEFF/, ''));
      } catch {
        throw new Error('El archivo no es un respaldo válido (JSON).');
      }
      if (!raw || typeof raw.code !== 'string' || typeof raw.openedAt !== 'number' || !raw.exam?.questions || typeof raw.students !== 'object') {
        throw new Error('El archivo no parece un respaldo de una sala de PSJavaScript.');
      }
      // una sala restaurada no queda «abierta»: se guarda cerrada en el historial
      const room = compactRoom({ ...(raw as RoomState), status: 'closed', closedAt: raw.closedAt ?? Date.now(), transport: raw.transport ?? { kind: 'device' }, notices: raw.notices ?? [] });
      const key = roomKey(room);
      if (get().rooms.some((r) => roomKey(r) === key)) throw new Error('Esa sala sigue abierta en este equipo.');
      const kept = [room, ...get().history.filter((h) => roomKey(h) !== key)];
      for (const old of kept.slice(MAX_HISTORY)) AsyncStorage.removeItem(historyItemKey(roomKey(old))).catch(() => {});
      set({ history: kept.slice(0, MAX_HISTORY), viewingKey: key, tab: 'results' });
      persistHistory(room);
      return key;
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

/** Sala que se muestra en «Sala en vivo». */
export function useActiveRoom(): RoomState | null {
  return useTeacher((s) => (s.activeKey ? s.rooms.find((r) => roomKey(r) === s.activeKey) ?? null : null));
}

/** Sala que se muestra en «Resultados»: la elegida (actual o del historial) o la sala activa. */
export function useResultsRoom(): RoomState | null {
  return useTeacher((s) => {
    const key = s.viewingKey ?? s.activeKey;
    if (!key) return s.rooms[0] ?? null;
    return s.rooms.find((r) => roomKey(r) === key) ?? s.history.find((h) => roomKey(h) === key) ?? null;
  });
}

/** Cuántas salas abiertas están recibiendo alumnos en este equipo. */
export function useLiveRoomCount(): number {
  return useTeacher((s) => s.rooms.filter((r) => isOpenRoom(r) && s.liveKeys.includes(roomKey(r))).length);
}
