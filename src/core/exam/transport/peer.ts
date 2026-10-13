/**
 * Transporte "Internet": conexión directa (WebRTC) entre cada alumno y el
 * maestro usando PeerJS. El servidor público de PeerJS solo presenta a los
 * equipos; los mensajes del examen viajan directo entre ellos.
 */
import type { DataConnection, Peer as PeerType, PeerOptions } from 'peerjs';
import { ClientTransport, HostTransport, TransportError } from './types';

const hostPeerId = (code: string) => `psjavascript-sala-${code.toLowerCase()}`;

export function peerAvailable(): boolean {
  return typeof RTCPeerConnection !== 'undefined' && typeof window !== 'undefined';
}

/** Se carga solo cuando se usa (no existe WebRTC en todas las plataformas). */
function PeerClass(): typeof PeerType {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('peerjs').Peer;
}

/**
 * Opciones de PeerJS. Por omisión se usa el servidor de enlace público; una
 * escuela puede usar el suyo definiendo window.__PSJS_PEER__ = { host, port, path, secure }.
 */
function peerOptions(): PeerOptions {
  const custom = (globalThis as any).__PSJS_PEER__;
  return { debug: 0, ...(custom && typeof custom === 'object' ? custom : {}) };
}

function describe(err: any): string {
  switch (err?.type) {
    case 'unavailable-id':
      return 'Ese código de sala ya está en uso. Intenta de nuevo.';
    case 'peer-unavailable':
      return 'No existe una sala abierta con ese código. Revisa el código o espera a que el maestro la abra.';
    case 'browser-incompatible':
      return 'Este navegador no permite conexiones directas (WebRTC). Usa otro navegador o la conexión por red local.';
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
      return 'No se pudo conectar al servidor de enlace. Revisa tu conexión a Internet.';
    default:
      return `Error de conexión: ${err?.message ?? err}`;
  }
}

const decode = (d: unknown) => {
  if (typeof d !== 'string') return d;
  try {
    return JSON.parse(d);
  } catch {
    return null;
  }
};

export class PeerHost implements HostTransport {
  onPeerMessage: HostTransport['onPeerMessage'] = null;
  onPeerLeave: HostTransport['onPeerLeave'] = null;
  onStatus: HostTransport['onStatus'] = null;
  private peer: PeerType | null = null;
  private conns = new Map<string, DataConnection>();
  private closed = false;

  async open(code: string) {
    if (!peerAvailable()) throw new TransportError('Esta plataforma no permite salas por Internet. Usa la conexión por red local.');
    const Peer = PeerClass();
    const peer = new Peer(hostPeerId(code), peerOptions());
    this.peer = peer;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        peer.destroy();
        reject(new TransportError('El servidor de enlace no respondió. Revisa tu conexión a Internet.'));
      }, 20_000);
      peer.once('open', () => {
        clearTimeout(t);
        resolve();
      });
      peer.once('error', (err) => {
        clearTimeout(t);
        peer.destroy();
        reject(new TransportError(describe(err)));
      });
    });
    peer.on('connection', (conn) => this.accept(conn));
    peer.on('disconnected', () => {
      if (this.closed || peer.destroyed) return;
      this.onStatus?.(false, 'Se perdió la conexión con el servidor de enlace. Los alumnos ya conectados siguen en la sala; reintentando…');
      setTimeout(() => {
        if (!this.closed && !peer.destroyed && peer.disconnected) peer.reconnect();
      }, 2000);
    });
    peer.on('open', () => this.onStatus?.(true));
    peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') return;
      this.onStatus?.(false, describe(err));
    });
  }

  private accept(conn: DataConnection) {
    const id = conn.connectionId;
    conn.on('open', () => this.conns.set(id, conn));
    conn.on('data', (d) => this.onPeerMessage?.(id, decode(d)));
    const gone = () => {
      if (!this.conns.has(id)) return;
      this.conns.delete(id);
      this.onPeerLeave?.(id);
    };
    conn.on('close', gone);
    conn.on('error', gone);
  }

  send(peer: string, msg: unknown) {
    const c = this.conns.get(peer);
    if (c?.open) c.send(JSON.stringify(msg));
  }

  close() {
    this.closed = true;
    for (const c of this.conns.values()) c.close();
    this.conns.clear();
    this.peer?.destroy();
    this.peer = null;
  }
}

export class PeerClient implements ClientTransport {
  onMessage: ClientTransport['onMessage'] = null;
  onClose: ClientTransport['onClose'] = null;
  private peer: PeerType | null = null;
  private conn: DataConnection | null = null;
  private closed = false;

  async connect(code: string) {
    if (!peerAvailable()) throw new TransportError('Esta plataforma no permite salas por Internet. Usa la conexión por red local.');
    const Peer = PeerClass();
    const peer = new Peer(peerOptions());
    this.peer = peer;
    const conn = await new Promise<DataConnection>((resolve, reject) => {
      let done = false;
      const fail = (e: Error) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        peer.destroy();
        reject(e);
      };
      const t = setTimeout(() => fail(new TransportError('No se pudo entrar a la sala (tiempo agotado). Revisa el código y tu conexión a Internet.')), 25_000);
      peer.on('error', (err) => fail(new TransportError(describe(err))));
      peer.once('open', () => {
        const c = peer.connect(hostPeerId(code), { reliable: true });
        c.once('open', () => {
          if (done) return;
          done = true;
          clearTimeout(t);
          resolve(c);
        });
        c.on('error', (err) => fail(new TransportError(describe(err))));
      });
    });
    this.conn = conn;
    conn.on('data', (d) => this.onMessage?.(decode(d)));
    const lost = () => {
      if (this.closed || this.conn !== conn) return;
      this.conn = null;
      this.onClose?.();
    };
    conn.on('close', lost);
    conn.on('error', lost);
    peer.removeAllListeners('error');
    peer.on('error', () => {
      /* los errores posteriores se manejan con el latido de la sala */
    });
  }

  send(msg: unknown) {
    if (this.conn?.open) this.conn.send(JSON.stringify(msg));
  }

  close() {
    this.closed = true;
    this.conn?.close();
    this.conn = null;
    this.peer?.destroy();
    this.peer = null;
  }
}
