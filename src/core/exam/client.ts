/**
 * Lado del alumno: se conecta a la sala, se reconecta solo si se pierde la
 * red y reenvía lo pendiente (avance y entrega) al recuperar la conexión.
 */
import { asHostMsg, ClientMsg, HostMsg, PROTOCOL_VERSION } from './protocol';
import type { ClientTransport } from './transport/types';

export type ClientNetStatus = 'connecting' | 'online' | 'offline' | 'failed';

export interface StudentIdentity {
  studentId: string;
  token: string;
  name: string;
  group: string;
}

export interface ClientOptions {
  /** Crea un transporte nuevo para cada intento de conexión. */
  transport: () => ClientTransport;
  code: string;
  identity: StudentIdentity;
  onMessage: (msg: HostMsg) => void;
  onStatus: (status: ClientNetStatus, detail?: string) => void;
  pingMs?: number;
  /** Reintentos automáticos tras perder la conexión (0 = sin reintentos). */
  retry?: boolean;
}

export class ExamClient {
  private t: ClientTransport | null = null;
  private status: ClientNetStatus = 'connecting';
  private ping: any = null;
  private retryTimer: any = null;
  private attempts = 0;
  private disposed = false;
  private lastPong = Date.now();
  /** Mensajes que deben llegar aunque se corte la red (se reenvían al reconectar). */
  private pendingSubmit: ClientMsg | null = null;
  private pendingProgress: Extract<ClientMsg, { t: 'progress' }> | null = null;
  private pendingEvents: ClientMsg[] = [];
  /** Diferencia entre el reloj del maestro y el local. */
  clockOffset = 0;

  constructor(private opts: ClientOptions) {}

  /** Primer intento: si falla, rechaza (para mostrar el error en la pantalla de ingreso). */
  async connect(): Promise<void> {
    await this.attempt();
  }

  private async attempt(): Promise<void> {
    if (this.disposed) return;
    this.setStatus('connecting');
    const t = this.opts.transport();
    this.t = t;
    t.onMessage = (raw) => {
      const m = asHostMsg(raw);
      if (!m) return;
      if (m.t === 'pong' || m.t === 'welcome' || m.t === 'paper' || m.t === 'deadline') this.clockOffset = m.now - Date.now();
      this.lastPong = Date.now();
      if (m.t === 'welcome') this.flush();
      if (m.t === 'result') this.pendingSubmit = null;
      this.opts.onMessage(m);
    };
    t.onClose = () => {
      if (this.t !== t) return;
      this.lost('Se perdió la conexión con el maestro.');
    };
    try {
      await t.connect(this.opts.code);
    } catch (e) {
      if (this.t === t) this.t = null;
      throw e;
    }
    if (this.disposed) {
      t.close();
      return;
    }
    this.attempts = 0;
    this.setStatus('online');
    const id = this.opts.identity;
    t.send({ t: 'hello', v: PROTOCOL_VERSION, studentId: id.studentId, token: id.token, name: id.name, group: id.group } satisfies ClientMsg);
    this.lastPong = Date.now();
    const every = this.opts.pingMs ?? 8000;
    clearInterval(this.ping);
    if (every > 0) {
      this.ping = setInterval(() => {
        if (Date.now() - this.lastPong > every * 3.5) {
          this.lost('El maestro no responde.');
          return;
        }
        this.raw({ t: 'ping' });
      }, every);
    }
  }

  private lost(detail: string) {
    clearInterval(this.ping);
    const t = this.t;
    this.t = null;
    if (t) {
      t.onClose = null;
      t.onMessage = null;
      try {
        t.close();
      } catch {
        /* ya cerrado */
      }
    }
    if (this.disposed) return;
    this.setStatus('offline', detail);
    this.scheduleRetry();
  }

  private scheduleRetry() {
    if (this.opts.retry === false || this.disposed) return;
    clearTimeout(this.retryTimer);
    const delay = Math.min(10_000, 1500 * 2 ** Math.min(this.attempts, 3));
    this.attempts++;
    this.retryTimer = setTimeout(() => {
      this.attempt().catch((e) => {
        this.setStatus('offline', e?.message ?? String(e));
        this.scheduleRetry();
      });
    }, delay);
  }

  /** Reintenta de inmediato (botón «Reintentar»). */
  retryNow() {
    if (this.status === 'online' || this.disposed) return;
    clearTimeout(this.retryTimer);
    this.attempts = 0;
    this.attempt().catch((e) => {
      this.setStatus('offline', e?.message ?? String(e));
      this.scheduleRetry();
    });
  }

  send(msg: ClientMsg) {
    if (msg.t === 'submit') this.pendingSubmit = msg;
    else if (msg.t === 'progress') {
      // acumula las respuestas cambiadas mientras no hay conexión
      const prev = this.pendingProgress;
      this.pendingProgress = prev ? { ...msg, answers: { ...(prev.answers ?? {}), ...(msg.answers ?? {}) } } : msg;
    } else if (msg.t === 'event') {
      this.pendingEvents.push(msg);
      if (this.pendingEvents.length > 50) this.pendingEvents.shift();
    }
    if (this.status === 'online') this.flush(msg.t === 'begin' || msg.t === 'ping' ? msg : undefined);
  }

  private flush(extra?: ClientMsg) {
    if (extra) this.raw(extra);
    const events = this.pendingEvents;
    this.pendingEvents = [];
    for (const e of events) this.raw(e);
    if (this.pendingProgress) {
      this.raw(this.pendingProgress);
      this.pendingProgress = null;
    }
    if (this.pendingSubmit) this.raw(this.pendingSubmit);
  }

  private raw(msg: ClientMsg) {
    try {
      this.t?.send(msg);
    } catch {
      /* se reintentará al reconectar */
    }
  }

  get netStatus() {
    return this.status;
  }

  /** Hora actual según el reloj del maestro. */
  serverNow() {
    return Date.now() + this.clockOffset;
  }

  private setStatus(s: ClientNetStatus, detail?: string) {
    this.status = s;
    this.opts.onStatus(s, detail);
  }

  dispose() {
    this.disposed = true;
    clearInterval(this.ping);
    clearTimeout(this.retryTimer);
    const t = this.t;
    this.t = null;
    if (t) {
      t.onClose = null;
      t.onMessage = null;
      t.close();
    }
  }
}
