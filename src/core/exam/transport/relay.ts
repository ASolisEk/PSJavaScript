/**
 * Transporte "red local": un servidor del aula (`npm run sala`) reenvía los
 * mensajes por WebSocket. No necesita Internet, solo estar en la misma red.
 */
import { ClientTransport, HostTransport, TransportError } from './types';

type ServerPacket =
  | { t: 'hosted' }
  | { t: 'joined'; peer: string }
  | { t: 'join'; peer: string }
  | { t: 'leave'; peer: string }
  | { t: 'msg'; from?: string; data: unknown }
  | { t: 'host-left' }
  | { t: 'error'; message: string };

/** Dirección del servidor del aula si la página fue servida por él. */
export function defaultRelayUrl(): string | undefined {
  const g: any = typeof globalThis !== 'undefined' ? globalThis : {};
  if (typeof g.__PSJS_SALA__ === 'string') return g.__PSJS_SALA__;
  return undefined;
}

/** Acepta "192.168.1.10", "192.168.1.10:8787", "http://…" o "ws://…/sala". */
export function normalizeRelayUrl(input: string): string {
  let s = input.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) s = s.replace(/^http/i, 'ws');
  if (!/^wss?:\/\//i.test(s)) s = `ws://${s}`;
  const m = /^(wss?:\/\/[^/]+)(\/.*)?$/i.exec(s);
  if (!m) return s;
  let host = m[1];
  if (!/:\d+$/.test(host) && !host.startsWith('wss://')) host += ':8787';
  const path = m[2] && m[2] !== '/' ? m[2] : '/sala';
  return host + path;
}

function openSocket(url: string, timeoutMs = 8000): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (typeof WebSocket === 'undefined') return reject(new TransportError('Este dispositivo no permite conexiones WebSocket.'));
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return reject(new TransportError(`Dirección del servidor no válida: ${url}`));
    }
    const t = setTimeout(() => {
      ws.close();
      reject(new TransportError('El servidor del aula no responde. Revisa la dirección y que estés en la misma red.'));
    }, timeoutMs);
    ws.onopen = () => {
      clearTimeout(t);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(t);
      reject(new TransportError('No se pudo conectar con el servidor del aula. Revisa la dirección y que esté encendido.'));
    };
  });
}

function parse(data: unknown): ServerPacket | null {
  try {
    return JSON.parse(typeof data === 'string' ? data : String(data));
  } catch {
    return null;
  }
}

/** Espera la primera respuesta del servidor. */
function firstReply(ws: WebSocket): Promise<ServerPacket> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new TransportError('El servidor del aula no respondió.')), 6000);
    ws.onmessage = (e) => {
      const p = parse(e.data);
      if (!p) return;
      clearTimeout(t);
      resolve(p);
    };
    ws.onclose = () => {
      clearTimeout(t);
      reject(new TransportError('El servidor del aula cerró la conexión.'));
    };
  });
}

export class RelayHost implements HostTransport {
  onPeerMessage: HostTransport['onPeerMessage'] = null;
  onPeerLeave: HostTransport['onPeerLeave'] = null;
  onStatus: HostTransport['onStatus'] = null;
  private ws: WebSocket | null = null;
  private code = '';
  private closed = false;
  private retry: any = null;

  constructor(private url: string) {}

  async open(code: string) {
    this.code = code;
    await this.connect();
  }

  private async connect() {
    const ws = await openSocket(this.url);
    ws.send(JSON.stringify({ t: 'host', code: this.code }));
    const r = await firstReply(ws);
    if (r.t !== 'hosted') {
      ws.close();
      throw new TransportError(r.t === 'error' ? r.message : 'Respuesta inesperada del servidor del aula.');
    }
    this.ws = ws;
    ws.onmessage = (e) => {
      const p = parse(e.data);
      if (!p) return;
      if (p.t === 'msg' && p.from) this.onPeerMessage?.(p.from, p.data);
      else if (p.t === 'leave') this.onPeerLeave?.(p.peer);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.closed) return;
      this.onStatus?.(false, 'Se perdió la conexión con el servidor del aula. Reintentando…');
      this.reconnect();
    };
  }

  private reconnect() {
    clearTimeout(this.retry);
    this.retry = setTimeout(() => {
      if (this.closed) return;
      this.connect()
        .then(() => this.onStatus?.(true))
        .catch(() => this.reconnect());
    }, 3000);
  }

  send(peer: string, msg: unknown) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ t: 'msg', to: peer, data: msg }));
  }

  close() {
    this.closed = true;
    clearTimeout(this.retry);
    const ws = this.ws;
    this.ws = null;
    ws?.close();
  }
}

export class RelayClient implements ClientTransport {
  onMessage: ClientTransport['onMessage'] = null;
  onClose: ClientTransport['onClose'] = null;
  private ws: WebSocket | null = null;

  constructor(private url: string) {}

  async connect(code: string) {
    const ws = await openSocket(this.url);
    ws.send(JSON.stringify({ t: 'join', code }));
    const r = await firstReply(ws);
    if (r.t !== 'joined') {
      ws.close();
      throw new TransportError(r.t === 'error' ? r.message : 'Respuesta inesperada del servidor del aula.');
    }
    this.ws = ws;
    ws.onmessage = (e) => {
      const p = parse(e.data);
      if (!p) return;
      if (p.t === 'msg') this.onMessage?.(p.data);
      else if (p.t === 'host-left') {
        this.ws = null;
        ws.close();
        this.onClose?.();
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.onClose?.();
    };
  }

  send(msg: unknown) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ t: 'msg', data: msg }));
  }

  close() {
    const ws = this.ws;
    this.ws = null;
    ws?.close();
  }
}
