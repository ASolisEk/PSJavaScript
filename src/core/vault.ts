/**
 * Cifrado de los datos del maestro en el dispositivo.
 *
 * La clave se deriva de la contraseña con PBKDF2-SHA256 (sal aleatoria, muchas
 * iteraciones) y nunca se guarda; los datos se cifran con AES-256-GCM (que además
 * detecta cualquier alteración). Sin la contraseña, lo guardado es ilegible aunque
 * se abran las herramientas del navegador.
 */
import { gcm } from '@noble/ciphers/aes';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

/** Prefijo de los valores cifrados (los demás son JSON normal). */
export const ENC_PREFIX = 'psjs-enc:1:';
const CHECK_TEXT = 'psjs-maestro-ok';

/** Lo que se guarda para reconocer la contraseña (no permite obtenerla). */
export interface VaultMeta {
  v: 1;
  salt: string;
  iterations: number;
  /** Texto conocido cifrado con la clave: si se descifra, la contraseña es correcta. */
  check: string;
}

export type RandomBytes = (n: number) => Uint8Array;

/** Bytes aleatorios seguros del navegador o de Node (en el teléfono se pasa expo-crypto). */
export const defaultRandom: RandomBytes = (n) => {
  const c = (globalThis as any).crypto;
  if (!c?.getRandomValues) throw new Error('No hay generador de números aleatorios seguro.');
  return c.getRandomValues(new Uint8Array(n));
};

// ───────────── texto ↔ bytes (sin depender de TextEncoder/TextDecoder) ─────────────

export function utf8Encode(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

export function utf8Decode(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; ) {
    const x = b[i++];
    let c: number;
    if (x < 0x80) c = x;
    else if (x < 0xe0) c = ((x & 31) << 6) | (b[i++] & 63);
    else if (x < 0xf0) c = ((x & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    else c = ((x & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    if (c >= 0x10000) {
      c -= 0x10000;
      s += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 1023));
    } else s += String.fromCharCode(c);
  }
  return s;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < b.length ? B64[n & 63] : '=');
  }
  return s;
}

export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) | ((B64.indexOf(clean[i + 2] ?? 'A') & 63) << 6) | (B64.indexOf(clean[i + 3] ?? 'A') & 63);
    out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return out;
}

// ───────────── clave y cifrado ─────────────

/** Deriva la clave AES de 256 bits. En el navegador usa WebCrypto (mucho más rápido). */
export async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle?.importKey) {
    try {
      const base = await subtle.importKey('raw', utf8Encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, 256);
      return new Uint8Array(bits);
    } catch {
      /* se usa la versión en JavaScript */
    }
  }
  return pbkdf2Async(sha256, utf8Encode(password), salt, { c: iterations, dkLen: 32, asyncTick: 20 });
}

export function encryptText(key: Uint8Array, text: string, random: RandomBytes = defaultRandom): string {
  const nonce = random(12);
  const sealed = gcm(key, nonce).encrypt(utf8Encode(text));
  const all = new Uint8Array(nonce.length + sealed.length);
  all.set(nonce);
  all.set(sealed, nonce.length);
  return ENC_PREFIX + toBase64(all);
}

/** Lanza un error si la clave no es la correcta o el dato fue alterado. */
export function decryptText(key: Uint8Array, value: string): string {
  if (!isEncrypted(value)) throw new Error('El dato no está cifrado.');
  const all = fromBase64(value.slice(ENC_PREFIX.length));
  return utf8Decode(gcm(key, all.subarray(0, 12)).decrypt(all.subarray(12)));
}

export const isEncrypted = (value: string | null | undefined): value is string => typeof value === 'string' && value.startsWith(ENC_PREFIX);

/** Iteraciones de PBKDF2: WebCrypto es nativo; en JavaScript puro (teléfono) se usan menos para no tardar demasiado. */
export const defaultIterations = () => ((globalThis as any).crypto?.subtle?.importKey ? 310_000 : 120_000);

/** Crea la clave y los datos para verificar una contraseña nueva. */
export async function createVault(password: string, random: RandomBytes = defaultRandom, iterations = defaultIterations()): Promise<{ key: Uint8Array; meta: VaultMeta }> {
  const salt = random(16);
  const key = await deriveKey(password, salt, iterations);
  return { key, meta: { v: 1, salt: toBase64(salt), iterations, check: encryptText(key, CHECK_TEXT, random) } };
}

/** Devuelve la clave si la contraseña es correcta; si no, null. */
export async function openVault(password: string, meta: VaultMeta): Promise<Uint8Array | null> {
  const key = await deriveKey(password, fromBase64(meta.salt), meta.iterations);
  try {
    return decryptText(key, meta.check) === CHECK_TEXT ? key : null;
  } catch {
    return null;
  }
}
