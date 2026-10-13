/**
 * Transportes de la sala de examen. El maestro es el anfitrión: todos los
 * alumnos se conectan a él usando el código de la sala.
 *
 * - internet: WebRTC punto a punto con PeerJS (sin instalar nada; requiere Internet).
 * - lan: servidor del aula (`npm run sala`) por WebSocket; funciona sin Internet.
 * - device: misma computadora/navegador (otra pestaña), útil para probar.
 * - practice: el alumno practica solo; la sala corre en su propio dispositivo.
 */

export type TransportKind = 'internet' | 'lan' | 'device' | 'memory' | 'practice';

export interface TransportSpec {
  kind: TransportKind;
  /** Dirección del servidor del aula (solo `lan`), p. ej. ws://192.168.1.10:8787/sala */
  url?: string;
}

export interface HostTransport {
  /** Abre la sala con el código indicado. Rechaza con un Error en español si no es posible. */
  open(code: string): Promise<void>;
  send(peer: string, msg: unknown): void;
  close(): void;
  onPeerMessage: ((peer: string, msg: unknown) => void) | null;
  onPeerLeave: ((peer: string) => void) | null;
  /** Cambios en la conexión del anfitrión con la red (servidor de señalización o del aula). */
  onStatus: ((online: boolean, detail?: string) => void) | null;
}

export interface ClientTransport {
  /** Se conecta a la sala. Rechaza con un Error en español si no existe o no hay red. */
  connect(code: string): Promise<void>;
  send(msg: unknown): void;
  close(): void;
  onMessage: ((msg: unknown) => void) | null;
  /** Se perdió la conexión (no se llama al cerrar con close()). */
  onClose: (() => void) | null;
}

export class TransportError extends Error {}
