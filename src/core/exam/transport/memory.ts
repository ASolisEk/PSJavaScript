/** Transporte en memoria (pruebas automáticas y práctica del alumno en su dispositivo). */
import { ClientTransport, HostTransport, TransportError } from './types';

export class MemoryNetwork {
  hosts = new Map<string, MemoryHost>();
  private seq = 0;
  nextPeer() {
    return `p${++this.seq}`;
  }
}

const clone = (m: unknown) => JSON.parse(JSON.stringify(m));

export class MemoryHost implements HostTransport {
  onPeerMessage: HostTransport['onPeerMessage'] = null;
  onPeerLeave: HostTransport['onPeerLeave'] = null;
  onStatus: HostTransport['onStatus'] = null;
  clients = new Map<string, MemoryClient>();
  private code = '';
  constructor(private net: MemoryNetwork) {}

  async open(code: string) {
    if (this.net.hosts.has(code)) throw new TransportError('Ese código de sala ya está en uso.');
    this.code = code;
    this.net.hosts.set(code, this);
  }
  send(peer: string, msg: unknown) {
    this.clients.get(peer)?.deliver(clone(msg));
  }
  close() {
    if (this.net.hosts.get(this.code) === this) this.net.hosts.delete(this.code);
    for (const c of [...this.clients.values()]) c.drop();
    this.clients.clear();
  }
}

export class MemoryClient implements ClientTransport {
  onMessage: ClientTransport['onMessage'] = null;
  onClose: ClientTransport['onClose'] = null;
  peer = '';
  private host: MemoryHost | null = null;
  constructor(private net: MemoryNetwork) {}

  async connect(code: string) {
    const host = this.net.hosts.get(code);
    if (!host) throw new TransportError('No existe una sala con ese código.');
    this.peer = this.net.nextPeer();
    this.host = host;
    host.clients.set(this.peer, this);
  }
  send(msg: unknown) {
    this.host?.onPeerMessage?.(this.peer, clone(msg));
  }
  close() {
    const h = this.host;
    this.host = null;
    if (h) {
      h.clients.delete(this.peer);
      h.onPeerLeave?.(this.peer);
    }
  }
  deliver(msg: unknown) {
    this.onMessage?.(msg);
  }
  /** Simula una caída de la red. */
  drop() {
    const h = this.host;
    if (!h) return;
    this.host = null;
    h.clients.delete(this.peer);
    h.onPeerLeave?.(this.peer);
    this.onClose?.();
  }
}

/** Red de la práctica individual: anfitrión y alumno en la misma aplicación. */
export const PRACTICE_NETWORK = new MemoryNetwork();
