/** Azar reproducible para generar exámenes distintos (pero repetibles) por alumno. */

/** Hash de 32 bits (FNV-1a) de un texto. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Generador pseudoaleatorio mulberry32: devuelve números en [0, 1). */
export function seededRandom(seed: string | number): () => number {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Copia mezclada (Fisher-Yates). */
export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sin letras ni números que se confunden (0/O, 1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Código de sala de 6 caracteres, fácil de dictar. */
export function roomCode(rand: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}

/** Normaliza lo que escribe el alumno al ingresar el código de sala. */
export function normalizeRoomCode(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

export function isValidRoomCode(s: string): boolean {
  return s.length === 6 && [...s].every((c) => CODE_ALPHABET.includes(c));
}

/** Identificador aleatorio corto. */
export function randomId(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}
