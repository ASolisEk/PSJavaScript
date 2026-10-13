/**
 * Transporte "este dispositivo": pestañas del mismo navegador se comunican
 * con BroadcastChannel. Sirve para probar un examen sin red.
 */
import { randomId } from '../random';
import { ClientTransport, HostTransport, TransportError } from './types';

type Packet =
  | { k: 'probe'; from: string }
  | { k: 'here'; to: string }
  | { k: 'connect'; from: string }
  | { k: 'accept'; to: string }
  | { k: 'msg'; from?: string; to?: string; data: string }
  | { k: 'leave'; from: string }
  | { k: 'host-closed' };

const channelName = (code: string) => `psjavascript-sala-${code}`;

export function broadcastAvailable(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

export class BroadcastHost implements HostTransport {
  onPeerMessage: HostTransport['onPeerMessage'] = null;
  onPeerLeave: HostTransport['onPeerLeave'] = null;
  onStatus: HostTransport['onStatus'] = null;
  private ch: BroadcastChannel | null = null;
  private id = randomId('h');

  async open(code: string) {
    if (!broadcastAvailable()) throw new TransportError('Este navegador no permite salas en el mismo dispositivo.');
    const ch = new BroadcastChannel(channelName(code));
    // ¿ya hay un maestro con este código en otra pestaña?
    const taken = await new Promise<boolean>((resolve) => {
      const t = setTimeout(() => resolve(false), 300);
      ch.onmessage = (e) => {
        const p = e.data as Packet;
        if (p?.k === 'here' && p.to === this.id) {
          clearTimeout(t);
          resolve(true);
        }
      };
      ch.postMessage({ k: 'probe', from: this.id } satisfies Packet);
    });
    if (taken) {
      ch.close();
      throw new TransportError('Ese código de sala ya está abierto en otra pestaña.');
    }
    this.ch = ch;
    // al recargar o cerrar la pestaña del maestro, los alumnos se enteran de inmediato y se reconectan
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pagehide', this.unload);
    ch.onmessage = (e) => {
      const p = e.data as Packet;
      if (!p || typeof p !== 'object') return;
      if (p.k === 'probe') ch.postMessage({ k: 'here', to: p.from } satisfies Packet);
      else if (p.k === 'connect') ch.postMessage({ k: 'accept', to: p.from } satisfies Packet);
      else if (p.k === 'msg' && p.from && !p.to) {
        try {
          this.onPeerMessage?.(p.from, JSON.parse(p.data));
        } catch {
          /* mensaje inválido */
        }
      } else if (p.k === 'leave') this.onPeerLeave?.(p.from);
    };
  }

  send(peer: string, msg: unknown) {
    this.ch?.postMessage({ k: 'msg', to: peer, data: JSON.stringify(msg) } satisfies Packet);
  }

  private unload = () => this.close();

  close() {
    if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('pagehide', this.unload);
    if (!this.ch) return;
    this.ch.postMessage({ k: 'host-closed' } satisfies Packet);
    this.ch.close();
    this.ch = null;
  }
}

export class BroadcastClient implements ClientTransport {
  onMessage: ClientTransport['onMessage'] = null;
  onClose: ClientTransport['onClose'] = null;
  private ch: BroadcastChannel | null = null;
  private id = randomId('c');

  async connect(code: string) {
    if (!broadcastAvailable()) throw new TransportError('Este navegador no permite salas en el mismo dispositivo.');
    const ch = new BroadcastChannel(channelName(code));
    const ok = await new Promise<boolean>((resolve) => {
      const t = setTimeout(() => resolve(false), 1500);
      ch.onmessage = (e) => {
        const p = e.data as Packet;
        if (p?.k === 'accept' && p.to === this.id) {
          clearTimeout(t);
          resolve(true);
        }
      };
      ch.postMessage({ k: 'connect', from: this.id } satisfies Packet);
    });
    if (!ok) {
      ch.close();
      throw new TransportError('No se encontró la sala en este dispositivo. ¿El maestro la abrió en otra pestaña de este navegador?');
    }
    this.ch = ch;
    ch.onmessage = (e) => {
      const p = e.data as Packet;
      if (!p || typeof p !== 'object') return;
      if (p.k === 'msg' && p.to === this.id) {
        try {
          this.onMessage?.(JSON.parse(p.data));
        } catch {
          /* mensaje inválido */
        }
      } else if (p.k === 'host-closed') {
        this.ch?.close();
        this.ch = null;
        this.onClose?.();
      }
    };
  }

  send(msg: unknown) {
    this.ch?.postMessage({ k: 'msg', from: this.id, data: JSON.stringify(msg) } satisfies Packet);
  }

  close() {
    if (!this.ch) return;
    this.ch.postMessage({ k: 'leave', from: this.id } satisfies Packet);
    this.ch.close();
    this.ch = null;
  }
}
