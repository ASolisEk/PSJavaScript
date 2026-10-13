/**
 * Práctica individual: el alumno presenta un examen sin maestro. La sala corre
 * dentro de la misma aplicación (transporte en memoria) y se guarda en el
 * dispositivo para retomarla si se recarga la página.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExamHost } from '../core/exam/host';
import { roomCode } from '../core/exam/random';
import { createRoom, RoomState } from '../core/exam/room';
import { createHostTransport, TransportError } from '../core/exam/transport';
import type { ExamConfig } from '../core/exam/types';

const KEY = 'psjs.practice.room.v1';
let host: ExamHost | null = null;
let saveTimer: any = null;

function save(room: RoomState, now = false) {
  clearTimeout(saveTimer);
  const go = () => AsyncStorage.setItem(KEY, JSON.stringify(room)).catch(() => {});
  if (now) go();
  else saveTimer = setTimeout(go, 800);
}

async function run(room: RoomState): Promise<ExamHost> {
  host?.dispose();
  const h = new ExamHost({ transport: createHostTransport({ kind: 'practice' }), state: room, onChange: (r) => save(r) });
  await h.open();
  host = h;
  return h;
}

/** Abre una sala de práctica ya iniciada y devuelve su código. */
export async function startPractice(exam: ExamConfig): Promise<string> {
  const h = await run(createRoom(roomCode(), exam, { kind: 'practice' }));
  h.start();
  save(h.state, true);
  return h.state.code;
}

/** Vuelve a abrir la sala de práctica guardada (al recargar la aplicación). */
export async function resumePractice(code: string): Promise<void> {
  if (host?.state.code === code) return;
  let room: RoomState | null = null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    room = raw ? JSON.parse(raw) : null;
  } catch {
    room = null;
  }
  if (!room || room.code !== code) throw new TransportError('Esta práctica ya no está disponible en el dispositivo.');
  await run(room);
}

/** Termina la práctica y borra su sala (si se indica `code`, solo si sigue siendo esa). */
export function stopPractice(code?: string) {
  if (code && host && host.state.code !== code) return;
  clearTimeout(saveTimer);
  host?.dispose();
  host = null;
  AsyncStorage.removeItem(KEY).catch(() => {});
}
