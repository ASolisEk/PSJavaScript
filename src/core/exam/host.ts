/**
 * Anfitrión de la sala (corre en el equipo del maestro): recibe a los
 * alumnos, les entrega su examen, sigue su avance y califica.
 */
import { ALWAYS_LOCKED, asClientMsg, ClientMsg, HostMsg, PROTOCOL_VERSION, RoomInfo, SubmitReason } from './protocol';
import { gradePaper, studentView } from './grading';
import { buildPaper } from './paper';
import { randomId } from './random';
import { RoomState, StudentEvent, StudentRecord } from './room';
import type { HostTransport } from './transport/types';
import type { Answers } from './types';
import { questionsPerStudent } from './config';

/** Segundos sin mensajes para considerar desconectado a un alumno. */
const OFFLINE_AFTER_MS = 25_000;
/** Margen tras el límite de tiempo antes de entregar el examen automáticamente. */
const DEADLINE_GRACE_MS = 15_000;
const MAX_EVENTS = 300;
const MAX_ANSWER_LENGTH = 50_000;

export interface HostOptions {
  transport: HostTransport;
  state: RoomState;
  onChange?: (state: RoomState) => void;
  onNetwork?: (online: boolean, detail?: string) => void;
  now?: () => number;
  /** Intervalo de revisión (desconexiones y tiempo límite). 0 = sin temporizador (pruebas). */
  tickMs?: number;
}

export function restrictionsOf(state: RoomState): string[] {
  const e = state.exam;
  const r = [...ALWAYS_LOCKED];
  if (!e.allowRun) r.push('Ejecutar código');
  if (!e.allowAssist) r.push('Autocompletado');
  if (e.blockPaste) r.push('Pegar texto');
  return r;
}

export class ExamHost {
  state: RoomState;
  private peers = new Map<string, string>();
  private timer: any = null;
  private now: () => number;
  private disposed = false;

  constructor(private opts: HostOptions) {
    this.state = opts.state;
    this.now = opts.now ?? Date.now;
    // al restaurar una sala nadie está conectado todavía
    const students: Record<string, StudentRecord> = {};
    for (const [id, s] of Object.entries(this.state.students)) students[id] = { ...s, connected: false, peer: null };
    this.state = { ...this.state, students };
  }

  async open() {
    const t = this.opts.transport;
    t.onPeerMessage = (peer, raw) => {
      const msg = asClientMsg(raw);
      if (msg) this.handle(peer, msg);
    };
    t.onPeerLeave = (peer) => this.peerLeft(peer);
    t.onStatus = (online, detail) => this.opts.onNetwork?.(online, detail);
    await t.open(this.state.code);
    const tick = this.opts.tickMs ?? 3000;
    if (tick > 0) this.timer = setInterval(() => this.tick(), tick);
  }

  /** Tema de una pregunta (para el resultado por tema). */
  private topicOf = (questionId: string) => this.state.exam.questions.find((q) => q.id === questionId)?.topic;

  dispose() {
    this.disposed = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.opts.transport.onPeerMessage = null;
    this.opts.transport.onPeerLeave = null;
    this.opts.transport.onStatus = null;
    this.opts.transport.close();
  }

  // ───────────────────────────── acciones del maestro ─────────────────────────────

  /** Permite que los alumnos comiencen. */
  start() {
    if (this.state.status !== 'lobby') return;
    this.set({ ...this.state, status: 'running', startedAt: this.now() });
    this.broadcast({ t: 'room', status: 'running' });
  }

  /** Cierra el examen: pide a todos que entreguen y califica lo pendiente. */
  async close(waitMs = 4000) {
    if (this.state.status === 'closed') return;
    const pending = Object.values(this.state.students).filter((s) => s.startedAt && !s.submittedAt);
    for (const s of pending) if (s.connected && s.peer) this.sendTo(s.id, { t: 'force-submit', reason: 'closed' });
    if (waitMs > 0 && pending.some((s) => s.connected)) {
      const until = this.now() + waitMs;
      await new Promise<void>((resolve) => {
        const check = () => {
          const left = Object.values(this.state.students).some((s) => s.startedAt && !s.submittedAt && s.connected);
          if (!left || this.now() >= until || this.disposed) resolve();
          else setTimeout(check, 200);
        };
        check();
      });
    }
    for (const s of Object.values(this.state.students)) {
      if (s.startedAt && !s.submittedAt) this.submit(s.id, s.answers, 'closed');
    }
    this.set({ ...this.state, status: 'closed', closedAt: this.now() });
    this.broadcast({ t: 'room', status: 'closed' });
  }

  /** Envía un aviso a todos los alumnos. */
  notice(text: string) {
    const at = this.now();
    this.set({ ...this.state, notices: [...this.state.notices, { at, text }] });
    this.broadcast({ t: 'notice', text, at });
  }

  /** Agrega minutos a todos los que están trabajando (o a uno). */
  addTime(minutes: number, studentId?: string) {
    const ms = minutes * 60_000;
    for (const s of Object.values(this.state.students)) {
      if (studentId && s.id !== studentId) continue;
      if (!s.startedAt || s.submittedAt || s.deadline === null) continue;
      const deadline = s.deadline + ms;
      this.patch(s.id, { deadline }, { kind: 'teacher', text: `El maestro agregó ${minutes} min` });
      this.sendTo(s.id, { t: 'deadline', deadline, now: this.now() });
    }
  }

  /** Recoge el examen de un alumno en este momento. */
  forceSubmit(studentId: string) {
    const s = this.state.students[studentId];
    if (!s || !s.startedAt || s.submittedAt) return;
    if (s.connected) this.sendTo(studentId, { t: 'force-submit', reason: 'teacher' });
    this.submit(studentId, s.answers, 'teacher');
  }

  /** Ajusta a mano los puntos de una pregunta (null = volver a la calificación automática). */
  adjust(studentId: string, questionId: string, points: number | null) {
    const s = this.state.students[studentId];
    if (!s || !s.key) return;
    const overrides = { ...s.overrides };
    if (points === null) delete overrides[questionId];
    else overrides[questionId] = points;
    const result = s.submittedAt ? gradePaper(this.state.exam, s.key, s.answers, overrides) : s.result;
    this.patch(studentId, { overrides, result });
    if (result && s.submittedAt) this.sendTo(studentId, { t: 'result', result: studentView(result, this.state.exam.showResults, this.topicOf), submittedAt: s.submittedAt, reason: s.submitReason ?? 'manual' });
  }

  /** Cierra o abre el ingreso de alumnos nuevos. */
  setLocked(locked: boolean) {
    if (!!this.state.locked === locked) return;
    this.set({ ...this.state, locked });
  }

  /**
   * Reabre el examen ya entregado de un alumno (p. ej. lo envió por error):
   * conserva sus respuestas y, si el examen tiene límite, le da `minutes` minutos.
   */
  reopen(studentId: string, minutes = 10) {
    const s = this.state.students[studentId];
    if (!s || !s.submittedAt || !s.key || this.state.status === 'closed') return;
    const now = this.now();
    const deadline = this.state.exam.durationMin > 0 ? now + minutes * 60_000 : null;
    this.patch(
      studentId,
      { submittedAt: null, submitReason: null, result: null, deadline, activity: 'reading', activitySince: now },
      { kind: 'teacher', text: `El maestro reabrió su examen${deadline ? ` (+${minutes} min)` : ''}` },
    );
    // el alumno vuelve a su examen con sus respuestas
    this.sendTo(studentId, { t: 'welcome', now, room: this.roomInfo(), started: true, submitted: false });
    this.sendPaper(studentId);
  }

  /** Quita a un alumno de la lista (p. ej. se unió por error). */
  remove(studentId: string) {
    const s = this.state.students[studentId];
    if (!s) return;
    if (s.peer) {
      this.opts.transport.send(s.peer, { t: 'rejected', reason: 'El maestro te quitó de la sala.' } satisfies HostMsg);
      this.peers.delete(s.peer);
    }
    const students = { ...this.state.students };
    delete students[studentId];
    this.set({ ...this.state, students });
  }

  // ───────────────────────────── mensajes ─────────────────────────────

  private handle(peer: string, msg: ClientMsg) {
    if (msg.t === 'hello') return this.hello(peer, msg);
    const id = this.peers.get(peer);
    const s = id ? this.state.students[id] : undefined;
    if (!s) return;
    const now = this.now();
    if (!s.connected) this.patch(s.id, { lastSeen: now, connected: true, peer }, { kind: 'reconnect', text: 'Recuperó la conexión' });
    else if (s.lastSeen < now - 1000) this.patch(s.id, { lastSeen: now });
    switch (msg.t) {
      case 'ping':
        this.sendTo(s.id, { t: 'pong', now });
        break;
      case 'begin':
        this.begin(s.id);
        break;
      case 'progress': {
        if (s.submittedAt) break;
        const patch: Partial<StudentRecord> = {};
        if (typeof msg.current === 'number' && msg.current !== s.current) patch.current = msg.current;
        if (msg.activity && msg.activity !== s.activity) {
          patch.activity = msg.activity;
          patch.activitySince = now;
        }
        if (typeof msg.focused === 'boolean' && msg.focused !== s.focused) patch.focused = msg.focused;
        if (msg.answers) patch.answers = { ...s.answers, ...this.cleanAnswers(s, msg.answers) };
        if (Object.keys(patch).length) this.patch(s.id, patch, patch.current !== undefined ? { kind: 'question', text: `Pasó a la pregunta ${patch.current + 1}` } : undefined);
        break;
      }
      case 'event': {
        const patch: Partial<StudentRecord> = {};
        let text = '';
        if (msg.kind === 'blur') {
          patch.focusLost = s.focusLost + 1;
          patch.focused = false;
          patch.activity = 'away';
          patch.activitySince = now;
          text = 'Salió de la ventana del examen';
        } else if (msg.kind === 'focus') {
          patch.focused = true;
          patch.awayMs = s.awayMs + Math.max(0, Math.min(msg.awayMs ?? 0, 4 * 3600_000));
          patch.activity = 'reading';
          patch.activitySince = now;
          text = `Regresó al examen${msg.awayMs ? ` (estuvo fuera ${Math.round(msg.awayMs / 1000)} s)` : ''}`;
        } else if (msg.kind === 'paste') {
          patch.pasteBlocked = s.pasteBlocked + 1;
          text = 'Intentó pegar texto (bloqueado)';
        } else if (msg.kind === 'run') {
          patch.runs = s.runs + 1;
          text = `Ejecutó su programa${msg.detail ? `: ${msg.detail}` : ''}`;
        } else if (msg.kind === 'test') {
          patch.tests = s.tests + 1;
          text = `Probó con los casos de ejemplo${msg.detail ? `: ${msg.detail}` : ''}`;
        } else if (msg.kind === 'leave') {
          text = 'Salió del examen';
        }
        this.patch(s.id, patch, text ? { kind: msg.kind as StudentEvent['kind'], text } : undefined);
        break;
      }
      case 'submit':
        if (s.submittedAt) this.sendResult(s.id);
        else if (s.startedAt) this.submit(s.id, { ...s.answers, ...this.cleanAnswers(s, msg.answers ?? {}) }, msg.reason === 'timeout' ? 'timeout' : msg.reason === 'closed' || msg.reason === 'teacher' ? msg.reason : 'manual');
        break;
    }
  }

  private hello(peer: string, msg: Extract<ClientMsg, { t: 'hello' }>) {
    const now = this.now();
    if (msg.v !== PROTOCOL_VERSION) {
      this.opts.transport.send(peer, { t: 'rejected', reason: 'Tu versión de PSJavaScript es distinta a la del maestro. Actualiza la aplicación.' } satisfies HostMsg);
      return;
    }
    let s = this.state.students[msg.studentId];
    if (s && s.token !== msg.token) {
      this.opts.transport.send(peer, { t: 'rejected', reason: 'Ya hay un alumno con esa identidad en la sala.' } satisfies HostMsg);
      return;
    }
    if (!s && this.state.status === 'closed') {
      this.opts.transport.send(peer, { t: 'rejected', reason: 'El examen ya fue cerrado por el maestro.' } satisfies HostMsg);
      return;
    }
    if (!s && this.state.locked) {
      this.opts.transport.send(peer, { t: 'rejected', reason: 'La sala ya no acepta alumnos nuevos. Pide a tu maestro que abra el ingreso.' } satisfies HostMsg);
      return;
    }
    const name = msg.name.trim().slice(0, 80) || 'Alumno';
    const group = (msg.group ?? '').trim().slice(0, 40);
    if (s?.peer && s.peer !== peer) this.peers.delete(s.peer);
    this.peers.set(peer, msg.studentId);
    if (!s) {
      s = {
        id: msg.studentId,
        token: msg.token,
        name,
        group,
        peer,
        connected: true,
        lastSeen: now,
        joinedAt: now,
        startedAt: null,
        deadline: null,
        submittedAt: null,
        submitReason: null,
        key: null,
        answers: {},
        current: 0,
        activity: 'reading',
        activitySince: now,
        focused: true,
        focusLost: 0,
        awayMs: 0,
        pasteBlocked: 0,
        runs: 0,
        tests: 0,
        events: [{ at: now, kind: 'join', text: 'Entró a la sala' }],
        result: null,
        overrides: {},
      };
      this.set({ ...this.state, students: { ...this.state.students, [s.id]: s } });
    } else {
      this.patch(s.id, { peer, connected: true, lastSeen: now, name, group }, { kind: 'reconnect', text: 'Se volvió a conectar' });
    }
    s = this.state.students[msg.studentId];
    this.sendTo(s.id, { t: 'welcome', now, room: this.roomInfo(), started: !!s.startedAt, submitted: !!s.submittedAt });
    if (s.submittedAt) this.sendResult(s.id);
    else if (s.startedAt) this.sendPaper(s.id);
  }

  private begin(id: string) {
    const s = this.state.students[id];
    if (!s || s.submittedAt) return;
    if (s.startedAt) return this.sendPaper(id);
    if (this.state.status !== 'running') return;
    const now = this.now();
    const seed = randomId('s');
    const { key } = buildPaper(this.state.exam, seed);
    const deadline = this.state.exam.durationMin > 0 ? now + this.state.exam.durationMin * 60_000 : null;
    this.patch(id, { key, startedAt: now, deadline, activity: 'reading', activitySince: now }, { kind: 'start', text: 'Comenzó el examen' });
    this.sendPaper(id);
  }

  private submit(id: string, answers: Answers, reason: SubmitReason) {
    const s = this.state.students[id];
    if (!s || !s.key || s.submittedAt) return;
    const now = this.now();
    const result = gradePaper(this.state.exam, s.key, answers, s.overrides);
    const why = reason === 'manual' ? 'Entregó su examen' : reason === 'timeout' ? 'Se acabó su tiempo: examen entregado automáticamente' : reason === 'teacher' ? 'El maestro recogió su examen' : 'Examen cerrado: entregado automáticamente';
    this.patch(id, { answers, submittedAt: now, submitReason: reason, result, activity: 'reviewing', activitySince: now }, { kind: 'submit', text: `${why} (calificación ${result.grade}/${result.scale})` });
    this.sendResult(id);
  }

  private sendPaper(id: string) {
    const s = this.state.students[id];
    if (!s?.key || !s.startedAt) return;
    const { paper } = buildPaper(this.state.exam, s.key.seed);
    this.sendTo(id, { t: 'paper', now: this.now(), paper, startedAt: s.startedAt, deadline: s.deadline, answers: s.answers });
  }

  private sendResult(id: string) {
    const s = this.state.students[id];
    if (!s?.result || !s.submittedAt) return;
    this.sendTo(id, { t: 'result', result: studentView(s.result, this.state.exam.showResults, this.topicOf), submittedAt: s.submittedAt, reason: s.submitReason ?? 'manual' });
  }

  private peerLeft(peer: string) {
    const id = this.peers.get(peer);
    this.peers.delete(peer);
    const s = id ? this.state.students[id] : undefined;
    if (s && s.peer === peer) this.patch(s.id, { connected: false, peer: null }, { kind: 'disconnect', text: 'Se desconectó' });
  }

  /** Revisa desconexiones silenciosas y tiempos vencidos. */
  tick() {
    const now = this.now();
    for (const s of Object.values(this.state.students)) {
      if (s.connected && now - s.lastSeen > OFFLINE_AFTER_MS) {
        this.patch(s.id, { connected: false }, { kind: 'disconnect', text: 'Perdió la conexión' });
      }
      if (s.startedAt && !s.submittedAt && s.deadline !== null && now > s.deadline + DEADLINE_GRACE_MS) {
        this.submit(s.id, s.answers, 'timeout');
      }
    }
  }

  // ───────────────────────────── utilidades ─────────────────────────────

  private cleanAnswers(s: StudentRecord, answers: Answers): Answers {
    const allowed = new Set(s.key?.questionIds ?? []);
    const out: Answers = {};
    for (const [k, v] of Object.entries(answers)) {
      if (!allowed.has(k)) continue;
      if (typeof v === 'string') out[k] = v.slice(0, MAX_ANSWER_LENGTH);
      else if (Array.isArray(v)) out[k] = v.slice(0, 200).map((x) => String(x).slice(0, 200));
      else if (typeof v === 'boolean' || v === null) out[k] = v;
    }
    return out;
  }

  roomInfo(): RoomInfo {
    const e = this.state.exam;
    return {
      status: this.state.status,
      title: e.title,
      description: e.description,
      durationMin: e.durationMin,
      questionCount: questionsPerStudent(e),
      restrictions: restrictionsOf(this.state),
    };
  }

  private sendTo(studentId: string, msg: HostMsg) {
    const s = this.state.students[studentId];
    if (s?.peer && s.connected) this.opts.transport.send(s.peer, msg);
  }

  private broadcast(msg: HostMsg) {
    for (const s of Object.values(this.state.students)) if (s.peer && s.connected) this.opts.transport.send(s.peer, msg);
  }

  private patch(id: string, patch: Partial<StudentRecord>, event?: Omit<StudentEvent, 'at'>) {
    const s = this.state.students[id];
    if (!s) return;
    let events = s.events;
    if (event) {
      events = [...events, { at: this.now(), ...event }];
      if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
    }
    this.set({ ...this.state, students: { ...this.state.students, [id]: { ...s, ...patch, events } } });
  }

  private set(state: RoomState) {
    this.state = state;
    this.opts.onChange?.(state);
  }
}
