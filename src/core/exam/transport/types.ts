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

/** Servidor STUN/TURN para atravesar firewalls (WebRTC). */
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Red para las salas «Por Internet»: servidores TURN propios (p. ej. `turns:turn.escuela.mx:443`,
 * que pasan por los firewalls escolares) y, opcionalmente, un servidor de enlace PeerJS propio.
 * Viaja con la sala y en el enlace del examen, así los alumnos usan la misma configuración.
 */
export interface PeerNetwork {
  iceServers?: IceServer[];
  server?: { host: string; port?: number; path?: string; secure?: boolean };
}

export interface TransportSpec {
  kind: TransportKind;
  /** Dirección del servidor del aula (solo `lan`), p. ej. ws://192.168.1.10:8787/sala */
  url?: string;
  /** Solo `internet`: servidores TURN y de enlace propios. */
  net?: PeerNetwork;
}

/** ¿La configuración de red trae algo (servidores TURN o de enlace)? */
export function hasPeerNetwork(net?: PeerNetwork | null): net is PeerNetwork {
  return !!net && (!!net.iceServers?.length || !!net.server?.host);
}

/** Valida una configuración de red recibida (enlace o archivo); null si no sirve. */
export function sanitizePeerNetwork(raw: unknown): PeerNetwork | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as any;
  const out: PeerNetwork = {};
  if (Array.isArray(r.iceServers)) {
    const list: IceServer[] = [];
    for (const x of r.iceServers.slice(0, 6)) {
      const urls = (Array.isArray(x?.urls) ? x.urls : [x?.urls]).filter((u: unknown) => typeof u === 'string' && /^(stun|stuns|turn|turns):/i.test(u)).slice(0, 4) as string[];
      if (!urls.length) continue;
      list.push({ urls: urls.length === 1 ? urls[0] : urls, ...(typeof x.username === 'string' ? { username: x.username.slice(0, 200) } : {}), ...(typeof x.credential === 'string' ? { credential: x.credential.slice(0, 200) } : {}) });
    }
    if (list.length) out.iceServers = list;
  }
  if (r.server && typeof r.server.host === 'string' && /^[a-z0-9.-]{1,200}$/i.test(r.server.host)) {
    out.server = {
      host: r.server.host,
      ...(Number.isInteger(r.server.port) && r.server.port > 0 && r.server.port < 65536 ? { port: r.server.port } : {}),
      ...(typeof r.server.path === 'string' && /^\/[\w./-]{0,100}$/.test(r.server.path) ? { path: r.server.path } : {}),
      ...(typeof r.server.secure === 'boolean' ? { secure: r.server.secure } : {}),
    };
  }
  return hasPeerNetwork(out) ? out : null;
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
