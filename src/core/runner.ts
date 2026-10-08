/**
 * Ejecutor: controla el intérprete (ejecutar, paso a paso, pausa, puntos de
 * interrupción, lectura de datos, retroceso) y produce instantáneas del
 * estado para la interfaz.
 *
 * El retroceso ("deshacer ejecución") se implementa re-ejecutando el programa
 * desde el inicio con las mismas entradas y números aleatorios registrados.
 */
import { ErrorHint, hintFor, translateSyntaxError, ErrorCode } from './errors';
import { formatValue } from './format';
import {
  Explanation,
  FatalError,
  FrameSnapshot,
  G,
  InputEvent,
  Interpreter,
  InterpEvent,
  OutputKind,
  ThrowSignal,
} from './interpreter/interpreter';
import type { Profile } from './profiles';

export type RunStatus = 'idle' | 'running' | 'paused' | 'input' | 'finished' | 'error' | 'stopped';
export type RunMode = 'run' | 'animate' | 'step';
export type InputValue = string | boolean | null;

export interface OutputLine {
  id: number;
  kind: OutputKind;
  text: string;
  prompt?: string;
}

export interface RuntimeErrorInfo {
  name: string;
  message: string;
  line: number | null;
  col: number | null;
  code?: ErrorCode;
  hint?: ErrorHint;
  syntax?: boolean;
}

export interface DesktopRow {
  step: number;
  line: number;
  values: string[];
  changed: boolean[];
}

export interface WatchValue {
  expr: string;
  ok: boolean;
  value: string;
}

export interface RunnerSnapshot {
  status: RunStatus;
  mode: RunMode;
  line: number | null;
  output: OutputLine[];
  frames: FrameSnapshot[];
  explanations: Explanation[];
  desktop: { columns: string[]; rows: DesktopRow[]; truncated: boolean };
  watches: WatchValue[];
  error: RuntimeErrorInfo | null;
  stepCount: number;
  inputs: InputValue[];
  inputRequest: Omit<InputEvent, 'type'> | null;
  notice: string | null;
  /** Variables (ámbito/nombre) del marco actual que cambiaron desde la instantánea anterior. */
  changed: string[];
  /** Duración total en ms (solo al terminar). */
  elapsedMs: number | null;
}

export interface RunnerOptions {
  code: string;
  profile: Profile;
  breakpoints?: Set<number>;
  watches?: string[];
  explain?: boolean;
  /** Milisegundos entre pasos en modo animado. */
  speed?: number;
  /** Entradas a reutilizar (re-ejecución / tiempo real). */
  replayInputs?: InputValue[];
  randoms?: number[];
  trackDesktop?: boolean;
  /** Cada cuántos pasos se pregunta si hay un ciclo infinito (modo ejecutar). */
  loopWarnEvery?: number;
  onUpdate?: (s: RunnerSnapshot) => void;
}

const MAX_OUTPUT = 5000;
const MAX_ROWS = 1000;
const CHUNK_MS = 16;

export class Runner {
  private interp: Interpreter | null = null;
  private gen: G<void> | null = null;
  private status: RunStatus = 'idle';
  private mode: RunMode = 'run';
  private pending: any = undefined;
  private output: OutputLine[] = [];
  private outId = 0;
  private line: number | null = null;
  private prevLine = 0;
  private eventSteps = 0;
  private error: RuntimeErrorInfo | null = null;
  private inputs: InputValue[] = [];
  private replayQueue: InputValue[] = [];
  private randoms: number[];
  private randIdx = 0;
  private inputRequest: Omit<InputEvent, 'type'> | null = null;
  private notice: string | null = null;
  private columns: string[] = [];
  private rows: DesktopRow[] = [];
  private lastValues: string[] = [];
  private truncated = false;
  private timer: any = null;
  private silentUntil = -1;
  private lastWarnAt = 0;
  private generation = 0;
  private lastVars = new Map<string, string>();
  private startedAt = 0;
  private elapsed: number | null = null;

  breakpoints: Set<number>;
  watches: string[];
  speed: number;
  explain: boolean;

  constructor(private opts: RunnerOptions) {
    this.breakpoints = opts.breakpoints ?? new Set();
    this.watches = opts.watches ?? [];
    this.speed = opts.speed ?? 300;
    this.explain = !!opts.explain;
    this.randoms = opts.randoms ? [...opts.randoms] : [];
    this.replayQueue = opts.replayInputs ? [...opts.replayInputs] : [];
  }

  // ───────────────────────────── API pública ─────────────────────────────

  /** Inicia la ejecución en el modo indicado. */
  start(mode: RunMode = 'run') {
    this.mode = mode;
    if (!this.init()) return;
    if (mode === 'step') {
      this.status = 'running';
      this.advanceToNextStep();
    } else {
      this.status = 'running';
      this.schedule(0);
    }
  }

  /** Continúa una ejecución pausada en el modo indicado. */
  resume(mode: RunMode = this.mode) {
    if (this.status !== 'paused') return;
    this.mode = mode;
    this.notice = null;
    this.status = 'running';
    if (mode === 'step') this.advanceToNextStep();
    else this.schedule(0);
  }

  /** Avanza una instrucción (inicia la ejecución si no ha empezado). */
  stepOnce() {
    if (this.status === 'idle') return this.start('step');
    if (this.status !== 'paused') return;
    this.mode = 'step';
    this.notice = null;
    this.status = 'running';
    this.advanceToNextStep();
  }

  pause() {
    if (this.status !== 'running') return;
    this.clearTimer();
    this.status = 'paused';
    this.publish();
  }

  stop() {
    this.clearTimer();
    this.generation++;
    if (this.status === 'finished' || this.status === 'error' || this.status === 'stopped') return;
    this.status = 'stopped';
    this.inputRequest = null;
    this.write('system', '*** Ejecución detenida por el usuario ***');
    this.publish();
  }

  /** Respuesta a prompt()/confirm(). null = cancelar. */
  provideInput(value: InputValue) {
    if (this.status !== 'input' || !this.inputRequest) return;
    this.acceptInput(value, this.inputRequest);
    this.status = 'running';
    if (this.mode === 'step') this.advanceToNextStep();
    else this.schedule(0);
  }

  /** Retrocede un paso (re-ejecuta hasta el paso anterior). */
  stepBack() {
    if (this.eventSteps <= 1) return;
    this.seek(this.eventSteps - 1);
  }

  /** Re-ejecuta silenciosamente hasta el paso `target` y pausa ahí. */
  seek(target: number) {
    this.clearTimer();
    const inputs = [...this.inputs];
    this.replayQueue = inputs;
    this.randIdx = 0;
    this.mode = 'step';
    if (!this.init()) return;
    this.silentUntil = target;
    this.status = 'running';
    while (this.status === 'running' && this.eventSteps < target) {
      const r = this.next();
      if (r !== 'step') break;
    }
    this.silentUntil = -1;
    if (this.status === 'running') this.status = 'paused';
    this.publish();
  }

  setBreakpoints(b: Set<number>) {
    this.breakpoints = b;
  }

  setWatches(w: string[]) {
    this.watches = w;
    this.columns = [];
    this.rows = [];
    this.lastValues = [];
    this.truncated = false;
    this.publish();
  }

  setSpeed(ms: number) {
    this.speed = ms;
  }

  getStatus() {
    return this.status;
  }

  getInputs() {
    return [...this.inputs];
  }

  getRandoms() {
    return [...this.randoms];
  }

  dispose() {
    this.clearTimer();
    this.generation++;
    this.opts.onUpdate = undefined;
  }

  // ───────────────────────────── interno ─────────────────────────────

  private init(): boolean {
    this.generation++;
    this.output = [];
    this.outId = 0;
    this.line = null;
    this.prevLine = 0;
    this.eventSteps = 0;
    this.error = null;
    this.inputs = [];
    this.inputRequest = null;
    this.notice = null;
    this.columns = [];
    this.rows = [];
    this.lastValues = [];
    this.truncated = false;
    this.pending = undefined;
    this.lastWarnAt = 0;
    this.startedAt = Date.now();
    this.elapsed = null;
    this.randIdx = 0;
    try {
      this.interp = new Interpreter(this.opts.code, {
        profile: this.opts.profile,
        explain: this.explain,
        random: () => {
          if (this.randIdx < this.randoms.length) return this.randoms[this.randIdx++];
          const v = Math.random();
          this.randoms.push(v);
          this.randIdx++;
          return v;
        },
        io: {
          write: (kind, text) => this.write(kind, text),
          clear: () => {
            this.output = [];
          },
        },
      });
      this.gen = this.interp.run();
      return true;
    } catch (e: any) {
      this.status = 'error';
      this.error = {
        name: 'SyntaxError',
        message: translateSyntaxError(e?.message ?? String(e)),
        line: e?.loc?.line ?? null,
        col: e?.loc?.column ?? null,
        code: 'syntax',
        hint: hintFor('syntax'),
        syntax: true,
      };
      this.write('error', `Error de sintaxis${this.error.line ? ` en la línea ${this.error.line}` : ''}: ${this.error.message}`);
      this.publish();
      return false;
    }
  }

  private write(kind: OutputKind, text: string, prompt?: string) {
    if (this.output.length >= MAX_OUTPUT) {
      this.output.splice(0, this.output.length - MAX_OUTPUT + 1);
    }
    this.output.push({ id: ++this.outId, kind, text, prompt });
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule(ms: number) {
    this.clearTimer();
    const gen = this.generation;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (gen === this.generation) this.pump();
    }, ms);
  }

  private acceptInput(value: InputValue, req: Omit<InputEvent, 'type'>) {
    this.inputs.push(value);
    const shown = req.mode === 'confirm' ? (value ? 'Aceptar' : 'Cancelar') : value === null ? '(cancelado)' : String(value);
    this.write('input', shown, req.prompt);
    this.inputRequest = null;
    this.pending = req.mode === 'confirm' ? !!value : value;
  }

  /** Avanza el generador un evento. */
  private next(): 'step' | 'input' | 'done' {
    if (!this.gen || !this.interp) return 'done';
    let r: IteratorResult<InterpEvent, void>;
    try {
      const v = this.pending;
      this.pending = undefined;
      r = this.gen.next(v);
    } catch (e) {
      this.fail(e);
      return 'done';
    }
    if (r.done) {
      this.status = 'finished';
      this.elapsed = Date.now() - this.startedAt;
      this.line = null;
      this.recordDesktop(true);
      this.write('system', '*** Ejecución finalizada ***');
      return 'done';
    }
    const ev = r.value;
    if (ev.type === 'input') {
      const req = { prompt: ev.prompt, mode: ev.mode, defaultValue: ev.defaultValue };
      if (this.replayQueue.length) {
        let v = this.replayQueue.shift()!;
        if (ev.mode === 'confirm' && typeof v === 'string') v = v === 'true';
        this.acceptInput(v, req);
        return this.next();
      }
      this.inputRequest = req;
      this.status = 'input';
      return 'input';
    }
    this.eventSteps++;
    this.recordDesktop(false);
    this.prevLine = this.line ?? ev.line;
    this.line = ev.line;
    if (ev.phase === 'debugger' && this.silentUntil < 0) {
      this.status = 'paused';
      this.notice = 'Pausa por la instrucción debugger';
    }
    return 'step';
  }

  private fail(e: any) {
    this.status = 'error';
    const interp = this.interp!;
    let info: RuntimeErrorInfo;
    if (e instanceof ThrowSignal) {
      const v = e.value;
      const node = e.node ?? interp.currentNode;
      const isErr = v instanceof Error;
      info = {
        name: isErr ? v.name : 'Excepción',
        message: isErr ? v.message : `Excepción no atrapada: ${formatValue(v)}`,
        line: node?.loc?.start.line ?? interp.currentLine ?? null,
        col: node?.loc?.start.column ?? null,
        code: e.code,
        hint: hintFor(e.code),
      };
    } else if (e instanceof FatalError) {
      const node = e.node ?? interp.currentNode;
      info = { name: 'Error', message: e.message, line: node?.loc?.start.line ?? null, col: node?.loc?.start.column ?? null, code: e.code, hint: hintFor(e.code) };
    } else {
      info = { name: 'Error interno', message: String(e?.message ?? e), line: interp.currentLine || null, col: null };
    }
    this.error = info;
    this.line = info.line;
    this.write('error', `${info.name}${info.line ? ` (línea ${info.line})` : ''}: ${info.message}`);
  }

  private pump() {
    if (this.status !== 'running') return;
    const warnEvery = this.opts.loopWarnEvery ?? 2_000_000;
    if (this.mode === 'animate') {
      const r = this.next();
      if (r === 'step' && this.status === 'running') {
        if (this.breakpoints.has(this.line!) && this.eventSteps > 1) {
          this.status = 'paused';
          this.notice = `Punto de interrupción en la línea ${this.line}`;
        } else this.schedule(this.speed);
      }
      this.publish();
      return;
    }
    const t0 = Date.now();
    let n = 0;
    while (this.status === 'running') {
      const r = this.next();
      if (r !== 'step') break;
      if (this.status !== 'running') break;
      if (this.breakpoints.has(this.line!)) {
        this.status = 'paused';
        this.notice = `Punto de interrupción en la línea ${this.line}`;
        break;
      }
      if (this.eventSteps - this.lastWarnAt >= warnEvery) {
        this.lastWarnAt = this.eventSteps;
        this.status = 'paused';
        this.notice = `Se ejecutaron ${this.eventSteps.toLocaleString()} pasos. ¿Hay un ciclo infinito? Puedes continuar o detener.`;
        break;
      }
      if ((++n & 255) === 0 && Date.now() - t0 > CHUNK_MS) {
        this.publish();
        this.schedule(0);
        return;
      }
    }
    this.publish();
  }

  private advanceToNextStep() {
    const r = this.next();
    if (r === 'step' && this.status === 'running') this.status = 'paused';
    this.publish();
  }

  private recordDesktop(final: boolean) {
    if (this.opts.trackDesktop === false || this.truncated || !this.interp) return;
    if (this.eventSteps <= 1 && !final) return;
    let values: string[];
    const short = (v: any) => formatValue(v, { depth: 1, maxLength: 60 });
    if (this.watches.length) {
      this.columns = this.watches;
      values = this.watches.map((w) => {
        const r = this.interp!.evalWatch(w);
        return r.ok ? short(r.value) : '—';
      });
    } else {
      const vis = this.interp.visibleValues();
      for (const k of vis.keys()) if (!this.columns.includes(k)) this.columns.push(k);
      values = this.columns.map((c) => (vis.has(c) ? short(vis.get(c)) : ''));
    }
    const changed = values.map((v, i) => v !== (this.lastValues[i] ?? ''));
    if (changed.some(Boolean)) {
      this.rows.push({ step: this.eventSteps - (final ? 0 : 1), line: this.line ?? this.prevLine, values, changed });
      this.lastValues = values;
      if (this.rows.length >= MAX_ROWS) this.truncated = true;
    }
  }

  snapshot(): RunnerSnapshot {
    const interp = this.interp;
    const live = this.status === 'paused' || this.status === 'input' || this.status === 'finished' || this.status === 'error' || this.status === 'stopped';
    const frames = interp && (live || this.mode !== 'run') ? interp.snapshotFrames() : [];
    const changed: string[] = [];
    if (frames.length) {
      const cur = new Map<string, string>();
      for (const sc of frames[0].scopes) for (const v of sc.vars) cur.set(`${sc.title}/${v.name}`, v.value);
      for (const [k, v] of cur) if (this.lastVars.size && this.lastVars.get(k) !== v) changed.push(k);
      this.lastVars = cur;
    }
    return {
      status: this.status,
      mode: this.mode,
      line: this.line,
      output: this.output.slice(),
      frames,
      changed,
      elapsedMs: this.elapsed,
      explanations: interp ? interp.explanations.slice(-500) : [],
      desktop: {
        columns: this.columns.slice(),
        rows: this.rows.map((r) => {
          const missing = this.columns.length - r.values.length;
          if (missing <= 0) return r;
          return { ...r, values: [...r.values, ...Array(missing).fill('')], changed: [...r.changed, ...Array(missing).fill(false)] };
        }),
        truncated: this.truncated,
      },
      watches: interp
        ? this.watches.map((expr) => {
            const r = interp.evalWatch(expr);
            return { expr, ok: r.ok, value: r.ok ? formatValue(r.value, { depth: 2, maxLength: 300 }) : r.error };
          })
        : [],
      error: this.error,
      stepCount: this.eventSteps,
      inputs: [...this.inputs],
      inputRequest: this.inputRequest,
      notice: this.notice,
    };
  }

  private publish() {
    if (this.silentUntil >= 0) return;
    this.opts.onUpdate?.(this.snapshot());
  }
}

/** Ejecuta un programa completo de forma síncrona (pruebas y ejecución en tiempo real). */
export function runToEnd(
  code: string,
  profile: Profile,
  inputs: InputValue[] = [],
  maxSteps = 1_000_000,
): { output: OutputLine[]; error: RuntimeErrorInfo | null; status: RunStatus; snapshot: RunnerSnapshot } {
  const r = new Runner({ code, profile, replayInputs: inputs, trackDesktop: true, loopWarnEvery: maxSteps });
  (r as any).init();
  (r as any).status = 'running';
  while ((r as any).status === 'running') {
    const res = (r as any).next();
    if (res !== 'step') break;
    if ((r as any).eventSteps >= maxSteps) {
      (r as any).status = 'paused';
      break;
    }
  }
  const snap = r.snapshot();
  return { output: snap.output, error: snap.error, status: snap.status, snapshot: snap };
}
