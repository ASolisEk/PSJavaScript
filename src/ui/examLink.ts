/** Enlaces para que los alumnos entren directo a una sala (?sala=CODIGO). */
import { Platform } from 'react-native';
import { normalizeRoomCode } from '../core/exam/random';
import { normalizeRelayUrl, TransportSpec } from '../core/exam/transport';

export interface ExamLink {
  code: string;
  transport?: TransportSpec;
}

/** Lee el enlace con el que se abrió la aplicación (solo web). */
export function readExamLink(): ExamLink | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  const code = normalizeRoomCode(p.get('sala') ?? '');
  if (!code) return null;
  const via = p.get('via');
  const srv = p.get('srv');
  let transport: TransportSpec | undefined;
  if (via === 'internet') transport = { kind: 'internet' };
  else if (via === 'device') transport = { kind: 'device' };
  else if (via === 'lan') transport = { kind: 'lan', url: srv ?? '' };
  return { code, transport };
}

/** Quita ?sala= de la barra de direcciones (para no volver a entrar al recargar). */
export function clearExamLink() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('sala')) return;
  ['sala', 'via', 'srv'].forEach((k) => url.searchParams.delete(k));
  window.history.replaceState(null, '', url.toString());
}

/** Enlace para compartir con los alumnos (solo web). */
export function buildExamLink(code: string, transport: TransportSpec): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('sala', code);
  url.searchParams.set('via', transport.kind);
  if (transport.kind === 'lan' && transport.url) url.searchParams.set('srv', normalizeRelayUrl(transport.url));
  return url.toString();
}

const MODE_KEY = 'psjs.mode';

/** Recuerda el modo de esta pestaña (para que al recargar no se mezclen maestro y alumno en el mismo navegador). */
export function rememberMode(mode: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(MODE_KEY, mode);
  } catch {
    /* sin almacenamiento */
  }
}

export function rememberedMode(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(MODE_KEY);
  } catch {
    return null;
  }
}

const STUDENT_KEY = 'psjs.student.lastName';

/**
 * Nombre y grupo del alumno solo para esta pestaña (sobrevive a una recarga).
 * No se guarda de forma permanente: en computadoras compartidas el siguiente
 * alumno no debe ver el nombre del anterior.
 */
export function rememberStudent(v: { name: string; group: string }) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STUDENT_KEY, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
}

export function rememberedStudent(): { name: string; group: string } {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return { name: '', group: '' };
  try {
    // versiones anteriores lo guardaban de forma permanente
    window.localStorage.removeItem(STUDENT_KEY);
    return JSON.parse(window.sessionStorage.getItem(STUDENT_KEY) ?? 'null') ?? { name: '', group: '' };
  } catch {
    return { name: '', group: '' };
  }
}

export function forgetStudent() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STUDENT_KEY);
  } catch {
    /* sin almacenamiento */
  }
}
