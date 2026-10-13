/**
 * Intérprete educativo de JavaScript.
 *
 * Recorre el AST generado por acorn usando generadores: cada instrucción
 * produce un evento `step` (permite ejecutar paso a paso, puntos de
 * interrupción y prueba de escritorio) y cada lectura con prompt()/confirm()
 * produce un evento `input` que el ejecutor responde con `gen.next(valor)`.
 *
 * Los valores son valores JS reales: números, textos, arreglos y objetos
 * nativos. Las funciones del usuario son funciones JS reales que, si se
 * invocan desde código nativo (getters, Array.from, etc.), se ejecutan de
 * forma síncrona; si se invocan desde el programa se ejecutan paso a paso.
 */
import * as acorn from 'acorn';
import { ErrorCode, translateNativeMessage } from '../errors';
import { INTERP, formatLogArgs, formatTable, formatValue, typeName } from '../format';
import type { Profile } from '../profiles';

type N = any;

export interface StepEvent {
  type: 'step';
  line: number;
  col: number;
  endLine: number;
  phase: 'stmt' | 'test' | 'update' | 'debugger';
}
export interface InputEvent {
  type: 'input';
  prompt: string;
  mode: 'prompt' | 'confirm';
  defaultValue?: string;
}
export type InterpEvent = StepEvent | InputEvent;
export type G<T = any> = Generator<InterpEvent, T, any>;

export type OutputKind = 'log' | 'info' | 'warn' | 'error' | 'alert' | 'input' | 'system' | 'canvas';
export interface IOHandler {
  write(kind: OutputKind, text: string): void;
  clear(): void;
}

/** Excepción del programa del usuario (atrapable con try/catch). */
export class ThrowSignal {
  constructor(public value: any, public node: N | null, public code?: ErrorCode) {}
}

/** Error que detiene la ejecución y no puede ser atrapado por el programa. */
export class FatalError extends Error {
  constructor(message: string, public code: ErrorCode, public node: N | null = null) {
    super(message);
  }
}

const CHAIN_SHORT = Symbol('chain-short');
export const GEN_NATIVE = Symbol.for('psjs.genNative');

export type DeclKind = 'var' | 'let' | 'const' | 'param' | 'function' | 'class' | 'implicit' | 'catch' | 'builtin';

interface Binding {
  value: any;
  kind: DeclKind;
  init: boolean;
}

interface FuncData {
  kind: 'normal' | 'arrow' | 'method' | 'class' | 'accessor';
  node: N | null;
  scope: Scope;
  name: string;
  homeObject?: any;
  isDerived?: boolean;
  parent?: any;
  fields?: { key: PropertyKey; value: N | null }[];
}

export class Scope {
  vars = new Map<string, Binding>();
  isFunction = false;
  isArrow = false;
  thisValue: any = undefined;
  thisInit = true;
  funcData: FuncData | null = null;
  newTarget: any = undefined;
  homeObject: any = undefined;

  constructor(public parent: Scope | null, public type: 'builtin' | 'global' | 'function' | 'block', public title = '') {}

  lookup(name: string): Binding | undefined {
    let s: Scope | null = this;
    while (s) {
      const b = s.vars.get(name);
      if (b) return b;
      s = s.parent;
    }
    return undefined;
  }

  declare(name: string, kind: DeclKind, value: any, init = true) {
    this.vars.set(name, { value, kind, init });
  }

  /** Ámbito donde se declaran las variables `var`. */
  varScope(): Scope {
    let s: Scope = this;
    while (s.type === 'block' && s.parent) s = s.parent;
    return s;
  }
}

type Completion =
  | { type: 'normal' }
  | { type: 'break' | 'continue'; label?: string }
  | { type: 'return'; value: any };
const NORMAL: Completion = { type: 'normal' };

export interface VarSnapshot {
  name: string;
  kind: DeclKind;
  type: string;
  value: string;
}
export interface ScopeSnapshot {
  title: string;
  vars: VarSnapshot[];
}
export interface FrameSnapshot {
  name: string;
  line: number;
  scopes: ScopeSnapshot[];
}
export interface Explanation {
  step: number;
  line: number;
  text: string;
}

export interface InterpreterOptions {
  profile: Profile;
  io: IOHandler;
  random?: () => number;
  explain?: boolean;
}

interface Frame {
  name: string;
  line: number;
  callerScope: Scope;
  callerLine: number;
}

export function parseProgram(source: string): N {
  return acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const SIMPLE_TYPES = new Set(['number', 'string', 'boolean', 'bigint']);

export class Interpreter {
  readonly ast: N;
  readonly builtins: Scope;
  readonly global: Scope;
  currentScope: Scope;
  currentNode: N | null = null;
  currentLine = 0;
  stepCount = 0;
  callStack: Frame[] = [];
  explanations: Explanation[] = [];
  explainEnabled: boolean;
  private watchMode = false;
  private syncDepth = 0;
  private timers: { id: number; fn: any; args: any[]; time: number; seq: number; interval: number | null }[] = [];
  private timerSeq = 0;
  private virtualTime = 0;
  private watchCache = new Map<string, N>();
  readonly profile: Profile;
  private io: IOHandler;
  private random: () => number;

  constructor(readonly source: string, opts: InterpreterOptions) {
    this.profile = opts.profile;
    this.io = opts.io;
    this.random = opts.random ?? Math.random;
    this.explainEnabled = !!opts.explain;
    this.ast = parseProgram(source);
    this.builtins = new Scope(null, 'builtin', 'Predefinidas');
    this.global = new Scope(this.builtins, 'global', 'Global');
    this.currentScope = this.global;
    this.setupBuiltins();
  }

  // ───────────────────────────── utilidades ─────────────────────────────

  src(node: N, max = 60): string {
    let s = this.source.slice(node.start, node.end).replace(/\s+/g, ' ');
    if (s.length > max) s = s.slice(0, max - 1) + '…';
    return s;
  }

  fmt(v: any): string {
    return formatValue(v, { depth: 1, maxLength: 80 });
  }

  explain(text: string, node?: N) {
    if (!this.explainEnabled || this.watchMode) return;
    if (this.explanations.length > 5000) this.explanations.shift();
    this.explanations.push({ step: this.stepCount, line: node?.loc?.start.line ?? this.currentLine, text });
  }

  private err(Ctor: ErrorConstructor, message: string, node: N | null, code?: ErrorCode): ThrowSignal {
    return new ThrowSignal(new Ctor(message), node ?? this.currentNode, code);
  }

  private wrapError(e: any, node: N): any {
    if (e instanceof ThrowSignal || e instanceof FatalError || e === CHAIN_SHORT) return e;
    const raw = e instanceof Error ? e.message : String(e);
    const { message, code } = translateNativeMessage(raw);
    const Ctor =
      e instanceof TypeError ? TypeError
      : e instanceof RangeError ? RangeError
      : e instanceof SyntaxError ? SyntaxError
      : e instanceof ReferenceError ? ReferenceError
      : Error;
    return new ThrowSignal(new Ctor(message), node, code);
  }

  /** Ejecuta un generador de forma síncrona (llamadas desde código nativo). */
  runSync<T>(gen: G<T>): T {
    this.syncDepth++;
    try {
      let r = gen.next();
      while (!r.done) {
        if (r.value.type === 'input') {
          throw this.err(Error, 'No se puede leer datos (prompt/confirm) dentro de una función invocada internamente', null, 'input-in-callback');
        }
        r = gen.next();
      }
      return r.value;
    } finally {
      this.syncDepth--;
    }
  }

  private *step(node: N, scope: Scope, phase: StepEvent['phase'] = 'stmt'): G<void> {
    if (this.watchMode) return;
    this.stepCount++;
    this.currentNode = node;
    this.currentScope = scope;
    this.currentLine = node.loc.start.line;
    if (this.syncDepth > 0) return;
    yield { type: 'step', line: node.loc.start.line, col: node.loc.start.column, endLine: node.loc.end.line, phase };
  }

  // ───────────────────────────── predefinidas ─────────────────────────────

  private genNative(name: string, gen: (this: Interpreter, thisArg: any, args: any[], node: N) => G): any {
    const interp = this;
    const f = function () {
      throw interp.err(Error, `${name}() no puede usarse aquí`, null, 'input-in-callback');
    };
    Object.defineProperty(f, 'name', { value: name });
    (f as any)[GEN_NATIVE] = gen;
    return f;
  }

  private setupBuiltins() {
    const def = (name: string, value: any) => this.builtins.declare(name, 'builtin', value);
    const io = this.io;
    const interp = this;

    const MathObj = Object.create(Object.prototype);
    for (const k of Object.getOwnPropertyNames(Math)) Object.defineProperty(MathObj, k, Object.getOwnPropertyDescriptor(Math, k)!);
    Object.defineProperty(MathObj, 'random', { value: () => this.random(), writable: true, configurable: true, enumerable: false });
    Object.defineProperty(MathObj, Symbol.toStringTag, { value: 'Math' });

    const logger = (kind: OutputKind, verb: string) => (...args: any[]) => {
      const text = formatLogArgs(args);
      io.write(kind, text);
      interp.explain(`${verb}: ${text.length > 80 ? text.slice(0, 79) + '…' : text}`);
    };
    const consoleObj = {
      log: logger('log', 'Se muestra en pantalla'),
      info: logger('info', 'Se muestra información'),
      debug: logger('log', 'Se muestra en pantalla'),
      warn: logger('warn', 'Se muestra una advertencia'),
      error: logger('error', 'Se muestra un error'),
      table: (data: any) => io.write('log', formatTable(data)),
      clear: () => io.clear(),
    };
    
    const canvasObj = {
      rect: (x: any, y: any, w: any, h: any, color?: any) => {
        io.write('canvas', JSON.stringify({ type: 'rect', x: Number(x)||0, y: Number(y)||0, w: Number(w)||0, h: Number(h)||0, color: color?String(color):'#000' }));
        interp.explain(`Dibuja un rectángulo en (${Number(x)||0}, ${Number(y)||0})`);
      },
      circle: (cx: any, cy: any, r: any, color?: any) => {
        io.write('canvas', JSON.stringify({ type: 'circle', cx: Number(cx)||0, cy: Number(cy)||0, r: Number(r)||0, color: color?String(color):'#000' }));
        interp.explain(`Dibuja un círculo en (${Number(cx)||0}, ${Number(cy)||0})`);
      },
      line: (x1: any, y1: any, x2: any, y2: any, color?: any, width?: any) => {
        io.write('canvas', JSON.stringify({ type: 'line', x1: Number(x1)||0, y1: Number(y1)||0, x2: Number(x2)||0, y2: Number(y2)||0, color: color?String(color):'#000', width: Number(width)||1 }));
        interp.explain(`Dibuja una línea de (${Number(x1)||0}, ${Number(y1)||0}) a (${Number(x2)||0}, ${Number(y2)||0})`);
      },
      text: (msg: any, x: any, y: any, size?: any, color?: any) => {
        io.write('canvas', JSON.stringify({ type: 'text', msg: String(msg), x: Number(x)||0, y: Number(y)||0, size: Number(size)||16, color: color?String(color):'#000' }));
        interp.explain(`Dibuja texto en (${Number(x)||0}, ${Number(y)||0})`);
      },
      clear: () => {
        io.write('canvas', JSON.stringify({ type: 'clear' }));
        interp.explain('Limpia el lienzo de dibujo');
      }
    };
    
    def('console', consoleObj);
    def('Math', MathObj);
    def('Canvas', canvasObj);

    def(
      'prompt',
      this.genNative('prompt', function* (_t, args) {
        const msg = args[0] === undefined ? '' : String(args[0]);
        const v = yield { type: 'input', prompt: msg, mode: 'prompt', defaultValue: args[1] === undefined ? undefined : String(args[1]) };
        this.explain(v === null ? 'Se canceló la lectura (null)' : `Se lee el dato: "${v}"`);
        return v;
      }),
    );
    def(
      'confirm',
      this.genNative('confirm', function* (_t, args) {
        const msg = args[0] === undefined ? '' : String(args[0]);
        const v = yield { type: 'input', prompt: msg, mode: 'confirm' };
        this.explain(`El usuario respondió: ${v ? 'Aceptar (true)' : 'Cancelar (false)'}`);
        return !!v;
      }),
    );
    def('alert', (m?: any) => {
      io.write('alert', m === undefined ? '' : String(m));
    });

    const addTimer = (fn: any, ms: any, args: any[], interval: boolean) => {
      if (typeof fn !== 'function') throw new TypeError('setTimeout necesita una función como primer argumento');
      const delay = Math.max(0, Number(ms) || 0);
      const id = ++this.timerSeq;
      this.timers.push({ id, fn, args, time: this.virtualTime + delay, seq: id, interval: interval ? Math.max(1, delay) : null });
      return id;
    };
    const clear = (id: any) => {
      this.timers = this.timers.filter((t) => t.id !== id);
    };
    def('setTimeout', (fn: any, ms?: any, ...args: any[]) => addTimer(fn, ms, args, false));
    def('setInterval', (fn: any, ms?: any, ...args: any[]) => addTimer(fn, ms, args, true));
    def('clearTimeout', clear);
    def('clearInterval', clear);

    const natives: Record<string, any> = {
      Number, String, Boolean, Array, Object, Map, Set, WeakMap, WeakSet, Date, RegExp, JSON, Symbol,
      Error, TypeError, RangeError, SyntaxError, ReferenceError,
      parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,
    };
    const g: any = globalThis as any;
    for (const opt of ['BigInt', 'Intl', 'structuredClone']) if (typeof g[opt] !== 'undefined') natives[opt] = g[opt];
    for (const [k, v] of Object.entries(natives)) def(k, v);
    def('Infinity', Infinity);
    def('NaN', NaN);
    def('undefined', undefined);
  }

  // ───────────────────────────── ejecución ─────────────────────────────

  *run(): G<void> {
    const body = this.ast.body;
    this.hoistVars(body, this.global);
    this.hoistLexical(body, this.global);
    yield* this.execStatements(body, this.global);
    // Temporizadores (setTimeout/setInterval) con tiempo virtual.
    while (this.timers.length) {
      this.timers.sort((a, b) => a.time - b.time || a.seq - b.seq);
      const t = this.timers.shift()!;
      this.virtualTime = t.time;
      if (t.interval !== null) this.timers.push({ ...t, time: t.time + t.interval, seq: ++this.timerSeq });
      this.explain(`Se ejecuta el temporizador #${t.id} (t = ${t.time} ms)`);
      yield* this.callFunction(t.fn, undefined, t.args, undefined, null);
    }
  }

  private hoistVars(nodes: N[], scope: Scope) {
    const visit = (n: N) => {
      if (!n) return;
      switch (n.type) {
        case 'VariableDeclaration':
          if (n.kind === 'var')
            for (const d of n.declarations)
              for (const name of patternNames(d.id)) if (!scope.vars.has(name)) scope.declare(name, 'var', undefined);
          break;
        case 'IfStatement':
          visit(n.consequent);
          visit(n.alternate);
          break;
        case 'ForStatement':
          visit(n.init);
          visit(n.body);
          break;
        case 'ForInStatement':
        case 'ForOfStatement':
          visit(n.left);
          visit(n.body);
          break;
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'LabeledStatement':
          visit(n.body);
          break;
        case 'BlockStatement':
          n.body.forEach(visit);
          break;
        case 'TryStatement':
          visit(n.block);
          if (n.handler) visit(n.handler.body);
          visit(n.finalizer);
          break;
        case 'SwitchStatement':
          for (const c of n.cases) c.consequent.forEach(visit);
          break;
      }
    };
    nodes.forEach(visit);
  }

  private hoistLexical(stmts: N[], scope: Scope) {
    for (const s of stmts) {
      if (s.type === 'VariableDeclaration' && s.kind !== 'var') {
        for (const d of s.declarations) for (const name of patternNames(d.id)) scope.declare(name, s.kind, undefined, false);
      } else if (s.type === 'ClassDeclaration') {
        scope.declare(s.id.name, 'class', undefined, false);
      } else if (s.type === 'FunctionDeclaration') {
        scope.declare(s.id.name, 'function', this.makeFunction({ kind: 'normal', node: s, scope, name: s.id.name }));
      }
    }
  }

  private *execStatements(stmts: N[], scope: Scope): G<Completion> {
    for (const s of stmts) {
      const c = yield* this.exec(s, scope);
      if (c.type !== 'normal') return c;
    }
    return NORMAL;
  }

  private *execBlock(stmts: N[], scope: Scope): G<Completion> {
    const needs = stmts.some(
      (s) => (s.type === 'VariableDeclaration' && s.kind !== 'var') || s.type === 'ClassDeclaration' || s.type === 'FunctionDeclaration',
    );
    const s = needs ? new Scope(scope, 'block', 'Bloque') : scope;
    if (needs) this.hoistLexical(stmts, s);
    return yield* this.execStatements(stmts, s);
  }

  private *exec(node: N, scope: Scope, labels?: string[]): G<Completion> {
    try {
      return yield* this.execInner(node, scope, labels);
    } catch (e) {
      throw this.wrapError(e, node);
    }
  }

  /** Decide qué hacer con la terminación del cuerpo de un ciclo. */
  private loopCtl(c: Completion, labels?: string[]): { stop: boolean; result: Completion } {
    if (c.type === 'break') {
      if (!c.label || labels?.includes(c.label)) return { stop: true, result: NORMAL };
      return { stop: true, result: c };
    }
    if (c.type === 'continue') {
      if (!c.label || labels?.includes(c.label)) return { stop: false, result: NORMAL };
      return { stop: true, result: c };
    }
    if (c.type === 'return') return { stop: true, result: c };
    return { stop: false, result: NORMAL };
  }

  private copyScope(s: Scope, parent: Scope): Scope {
    const n = new Scope(parent, 'block', s.title);
    for (const [k, b] of s.vars) n.vars.set(k, { ...b });
    return n;
  }

  private *execInner(node: N, scope: Scope, labels?: string[]): G<Completion> {
    switch (node.type) {
      case 'ExpressionStatement':
        yield* this.step(node, scope);
        yield* this.evaluate(node.expression, scope);
        return NORMAL;

      case 'VariableDeclaration':
        yield* this.step(node, scope);
        yield* this.execVarDecl(node, scope);
        return NORMAL;

      case 'FunctionDeclaration':
      case 'EmptyStatement':
        return NORMAL;

      case 'ClassDeclaration': {
        yield* this.step(node, scope);
        const C = yield* this.evalClass(node, scope);
        const b = scope.vars.get(node.id.name);
        if (b) {
          b.value = C;
          b.init = true;
        } else scope.declare(node.id.name, 'class', C);
        this.explain(`Se define la clase ${node.id.name}`, node);
        return NORMAL;
      }

      case 'DebuggerStatement':
        yield* this.step(node, scope, 'debugger');
        return NORMAL;

      case 'BlockStatement':
        return yield* this.execBlock(node.body, scope);

      case 'ReturnStatement': {
        yield* this.step(node, scope);
        const value = node.argument ? yield* this.evaluate(node.argument, scope) : undefined;
        return { type: 'return', value };
      }

      case 'IfStatement': {
        yield* this.step(node, scope);
        const t = yield* this.evaluate(node.test, scope);
        this.explain(
          `La condición (${this.src(node.test)}) es ${t ? 'verdadera' : 'falsa'}` +
            (t ? ' → se ejecuta el bloque del if' : node.alternate ? ' → se ejecuta el bloque else' : ' → no se ejecuta el bloque'),
          node,
        );
        if (t) return yield* this.exec(node.consequent, scope);
        if (node.alternate) return yield* this.exec(node.alternate, scope);
        return NORMAL;
      }

      case 'WhileStatement': {
        while (true) {
          yield* this.step(node, scope, 'test');
          const t = yield* this.evaluate(node.test, scope);
          this.explain(`Condición del ciclo while (${this.src(node.test)}) es ${t ? 'verdadera → se repite' : 'falsa → termina el ciclo'}`, node);
          if (!t) break;
          const ctl = this.loopCtl(yield* this.exec(node.body, scope), labels);
          if (ctl.stop) return ctl.result;
        }
        return NORMAL;
      }

      case 'DoWhileStatement': {
        yield* this.step(node, scope);
        while (true) {
          const ctl = this.loopCtl(yield* this.exec(node.body, scope), labels);
          if (ctl.stop) return ctl.result;
          yield* this.step(node.test, scope, 'test');
          const t = yield* this.evaluate(node.test, scope);
          this.explain(`Condición del do...while (${this.src(node.test)}) es ${t ? 'verdadera → se repite' : 'falsa → termina el ciclo'}`, node.test);
          if (!t) break;
        }
        return NORMAL;
      }

      case 'ForStatement': {
        const isLex = node.init?.type === 'VariableDeclaration' && node.init.kind !== 'var';
        const loopScope = isLex ? new Scope(scope, 'block', 'Ciclo for') : scope;
        if (node.init) {
          yield* this.step(node.init, loopScope);
          if (node.init.type === 'VariableDeclaration') {
            if (isLex) this.hoistLexical([node.init], loopScope);
            yield* this.execVarDecl(node.init, loopScope);
          } else yield* this.evaluate(node.init, loopScope);
        }
        let iter = isLex ? this.copyScope(loopScope, scope) : scope;
        while (true) {
          if (node.test) {
            yield* this.step(node.test, iter, 'test');
            const t = yield* this.evaluate(node.test, iter);
            this.explain(`Condición del ciclo for (${this.src(node.test)}) es ${t ? 'verdadera → se repite' : 'falsa → termina el ciclo'}`, node.test);
            if (!t) break;
          }
          const ctl = this.loopCtl(yield* this.exec(node.body, iter), labels);
          if (ctl.stop) return ctl.result;
          if (isLex) iter = this.copyScope(iter, scope);
          if (node.update) {
            yield* this.step(node.update, iter, 'update');
            yield* this.evaluate(node.update, iter);
          }
        }
        return NORMAL;
      }

      case 'ForOfStatement':
      case 'ForInStatement': {
        yield* this.step(node, scope);
        const right = yield* this.evaluate(node.right, scope);
        let iterator: Iterator<any>;
        if (node.type === 'ForOfStatement') {
          if (node.await) throw this.err(SyntaxError, 'for await no está soportado', node, 'unsupported');
          if (right == null || typeof right[Symbol.iterator] !== 'function')
            throw this.err(TypeError, `${this.src(node.right)} no es iterable (es ${typeName(right)})`, node.right, 'not-iterable');
          iterator = right[Symbol.iterator]();
        } else {
          const keys: string[] = [];
          if (right != null) for (const k in right) keys.push(k);
          iterator = keys[Symbol.iterator]();
        }
        let first = true;
        while (true) {
          if (!first) yield* this.step(node, scope, 'test');
          first = false;
          const r = iterator.next();
          if (r.done) {
            this.explain('No quedan más elementos → termina el ciclo', node);
            break;
          }
          const left = node.left;
          let iterScope = scope;
          if (left.type === 'VariableDeclaration') {
            const id = left.declarations[0].id;
            if (left.kind === 'var') yield* this.bindPattern(id, r.value, scope, null);
            else {
              iterScope = new Scope(scope, 'block', 'Ciclo');
              yield* this.bindPattern(id, r.value, iterScope, left.kind);
            }
          } else yield* this.bindPattern(left, r.value, scope, null);
          const ctl = this.loopCtl(yield* this.exec(node.body, iterScope), labels);
          if (ctl.stop) return ctl.result;
        }
        return NORMAL;
      }

      case 'BreakStatement':
        yield* this.step(node, scope);
        this.explain('break → se sale de la estructura', node);
        return { type: 'break', label: node.label?.name };

      case 'ContinueStatement':
        yield* this.step(node, scope);
        this.explain('continue → se pasa a la siguiente iteración', node);
        return { type: 'continue', label: node.label?.name };

      case 'SwitchStatement': {
        yield* this.step(node, scope);
        const d = yield* this.evaluate(node.discriminant, scope);
        const ss = new Scope(scope, 'block', 'switch');
        this.hoistLexical(node.cases.flatMap((c: N) => c.consequent), ss);
        let matched = -1;
        for (let i = 0; i < node.cases.length; i++) {
          const c = node.cases[i];
          if (!c.test) continue;
          const v = yield* this.evaluate(c.test, ss);
          if (d === v) {
            matched = i;
            break;
          }
        }
        if (matched < 0) matched = node.cases.findIndex((c: N) => !c.test);
        this.explain(
          `switch (${this.src(node.discriminant)}) vale ${this.fmt(d)} → ` +
            (matched < 0 ? 'ningún caso coincide' : node.cases[matched].test ? `caso ${this.src(node.cases[matched].test)}` : 'caso default'),
          node,
        );
        if (matched < 0) return NORMAL;
        for (let i = matched; i < node.cases.length; i++) {
          const c = yield* this.execStatements(node.cases[i].consequent, ss);
          if (c.type === 'break' && (!c.label || labels?.includes(c.label))) return NORMAL;
          if (c.type !== 'normal') return c;
        }
        return NORMAL;
      }

      case 'ThrowStatement': {
        yield* this.step(node, scope);
        const v = yield* this.evaluate(node.argument, scope);
        this.explain(`Se lanza un error: ${this.fmt(v)}`, node);
        throw new ThrowSignal(v, node, 'uncaught');
      }

      case 'TryStatement': {
        let completion: Completion = NORMAL;
        let pending: any = null;
        try {
          completion = yield* this.execBlock(node.block.body, scope);
        } catch (e) {
          if (e instanceof ThrowSignal && node.handler) {
            this.explain(`Se atrapa el error en catch: ${this.fmt(e.value)}`, node.handler);
            const cs = new Scope(scope, 'block', 'catch');
            try {
              if (node.handler.param) yield* this.bindPattern(node.handler.param, e.value, cs, 'catch');
              completion = yield* this.execBlock(node.handler.body.body, cs);
            } catch (e2) {
              if (!node.finalizer || e2 instanceof FatalError) throw e2;
              pending = e2;
            }
          } else {
            if (!node.finalizer || e instanceof FatalError) throw e;
            pending = e;
          }
        }
        if (node.finalizer) {
          const f = yield* this.execBlock(node.finalizer.body, scope);
          if (f.type !== 'normal') return f;
          if (pending) throw pending;
        }
        return completion;
      }

      case 'LabeledStatement': {
        const c = yield* this.exec(node.body, scope, [...(labels ?? []), node.label.name]);
        if (c.type === 'break' && c.label === node.label.name) return NORMAL;
        return c;
      }

      default:
        throw this.err(SyntaxError, `Instrucción no soportada: ${node.type}`, node, 'unsupported');
    }
  }

  private *execVarDecl(node: N, scope: Scope): G<void> {
    for (const d of node.declarations) {
      if (node.kind === 'var') {
        if (!d.init) continue;
        const v = yield* this.evaluateNamed(d.init, scope, d.id);
        yield* this.bindPattern(d.id, v, scope, null);
      } else {
        const v = d.init ? yield* this.evaluateNamed(d.init, scope, d.id) : undefined;
        yield* this.bindPattern(d.id, v, scope, node.kind);
      }
    }
  }

  // ───────────────────────────── variables ─────────────────────────────

  private similarName(name: string, scope: Scope): string | null {
    let best: string | null = null;
    let bestD = Infinity;
    let s: Scope | null = scope;
    while (s) {
      for (const k of s.vars.keys()) {
        const d = levenshtein(k.toLowerCase(), name.toLowerCase());
        if (d < bestD && d <= Math.max(1, Math.floor(name.length / 3))) {
          best = k;
          bestD = d;
        }
      }
      s = s.parent;
    }
    return best;
  }

  private readIdentifier(name: string, scope: Scope, node: N): any {
    const b = scope.lookup(name);
    if (!b) {
      const sim = this.similarName(name, scope);
      throw this.err(ReferenceError, `'${name}' no está definida${sim ? `. ¿Quisiste decir '${sim}'?` : ''}`, node, 'undefined-var');
    }
    if (!b.init) throw this.err(ReferenceError, `No se puede usar '${name}' antes de declararla`, node, 'tdz');
    return b.value;
  }

  private initBinding(scope: Scope, name: string, value: any, kind: DeclKind, node: N) {
    const b = scope.vars.get(name);
    if (b && kind !== 'param') {
      b.value = value;
      b.init = true;
    } else scope.declare(name, kind, value);
    this.explain(
      kind === 'param' ? `Parámetro ${name} = ${this.fmt(value)}` : `Se declara ${kind === 'const' ? 'la constante' : 'la variable'} ${name} = ${this.fmt(value)}`,
      node,
    );
  }

  private assignIdentifier(name: string, value: any, scope: Scope, node: N) {
    if (this.watchMode) throw new FatalError('La expresión no puede modificar variables', 'unsupported');
    const b = scope.lookup(name);
    if (!b) {
      if (this.profile.allowImplicitGlobals) {
        this.global.declare(name, 'implicit', value);
        this.explain(`${name} ← ${this.fmt(value)} (variable global implícita)`, node);
        return;
      }
      throw this.err(ReferenceError, `La variable '${name}' no ha sido declarada. Usa let ${name} = ...`, node, 'undeclared-assign');
    }
    if (b.kind === 'const') throw this.err(TypeError, `No se puede reasignar la constante '${name}'`, node, 'const-assign');
    if (b.kind === 'builtin') throw this.err(TypeError, `'${name}' es predefinida y no se puede reasignar`, node, 'const-assign');
    if (!b.init) throw this.err(ReferenceError, `No se puede usar '${name}' antes de declararla`, node, 'tdz');
    b.value = value;
    this.explain(`${name} ← ${this.fmt(value)}`, node);
  }

  private *bindPattern(p: N, value: any, scope: Scope, kind: DeclKind | null): G<void> {
    switch (p.type) {
      case 'Identifier':
        if (kind) this.initBinding(scope, p.name, value, kind, p);
        else this.assignIdentifier(p.name, value, scope, p);
        return;
      case 'MemberExpression': {
        const obj = yield* this.evalObject(p, scope);
        const key = yield* this.memberKey(p, scope);
        this.setMember(obj, key, value, p);
        return;
      }
      case 'AssignmentPattern': {
        if (value === undefined) value = yield* this.evaluateNamed(p.right, scope, p.left);
        yield* this.bindPattern(p.left, value, scope, kind);
        return;
      }
      case 'ObjectPattern': {
        if (value == null) throw this.err(TypeError, `No se puede desestructurar ${value}`, p, 'read-prop-nullish');
        const used = new Set<PropertyKey>();
        for (const prop of p.properties) {
          if (prop.type === 'RestElement') {
            const rest: any = {};
            for (const k of Object.keys(value)) if (!used.has(k)) rest[k] = value[k];
            yield* this.bindPattern(prop.argument, rest, scope, kind);
          } else {
            const key = prop.computed ? toKey(yield* this.evaluate(prop.key, scope)) : prop.key.type === 'Identifier' ? prop.key.name : String(prop.key.value);
            used.add(key);
            yield* this.bindPattern(prop.value, value[key], scope, kind);
          }
        }
        return;
      }
      case 'ArrayPattern': {
        if (value == null || typeof value[Symbol.iterator] !== 'function') throw this.err(TypeError, `${typeName(value)} no es iterable`, p, 'not-iterable');
        const arr = Array.from(value as Iterable<any>);
        for (let i = 0; i < p.elements.length; i++) {
          const el = p.elements[i];
          if (!el) continue;
          if (el.type === 'RestElement') yield* this.bindPattern(el.argument, arr.slice(i), scope, kind);
          else yield* this.bindPattern(el, arr[i], scope, kind);
        }
        return;
      }
      default:
        throw this.err(SyntaxError, `Patrón no soportado: ${p.type}`, p, 'unsupported');
    }
  }

  // ───────────────────────────── miembros ─────────────────────────────

  private *evalObject(node: N, scope: Scope): G<any> {
    if (node.object.type === 'Super') return this.superBase(scope, node);
    return yield* this.evaluate(node.object, scope);
  }

  private *memberKey(node: N, scope: Scope): G<PropertyKey> {
    if (node.computed) {
      const k = yield* this.evaluate(node.property, scope);
      return typeof k === 'number' ? k : toKey(k);
    }
    if (node.property.type === 'PrivateIdentifier') return '#' + node.property.name;
    return node.property.name;
  }

  private getMember(obj: any, key: PropertyKey, node: N, receiver?: any): any {
    if (obj === null || obj === undefined) {
      const what = node.object && node.object.type !== 'Super' ? `'${this.src(node.object)}'` : 'el valor';
      throw this.err(TypeError, `No se puede leer '${String(key)}' porque ${what} es ${obj}`, node, 'read-prop-nullish');
    }
    if (this.profile.strictTypes && Array.isArray(obj) && (typeof key === 'number' || (typeof key === 'string' && /^-?\d+$/.test(key)))) {
      const idx = Number(key);
      if (idx < 0 || idx >= obj.length || !Number.isInteger(idx))
        throw this.err(
          RangeError,
          `Índice ${idx} fuera de rango en '${this.src(node.object)}' (tiene ${obj.length} elemento${obj.length === 1 ? '' : 's'}: índices 0 a ${obj.length - 1})`,
          node,
          'read-prop-nullish',
        );
    }
    return receiver !== undefined ? Reflect.get(obj, key, receiver) : obj[key as any];
  }

  private setMember(obj: any, key: PropertyKey, value: any, node: N) {
    if (this.watchMode) throw new FatalError('La expresión no puede modificar variables', 'unsupported');
    if (obj === null || obj === undefined)
      throw this.err(TypeError, `No se puede asignar '${String(key)}' porque '${this.src(node.object)}' es ${obj}`, node, 'set-prop-nullish');
    if (typeof obj !== 'object' && typeof obj !== 'function') return;
    obj[key as any] = value;
    this.explain(`${this.src(node)} ← ${this.fmt(value)}`, node);
  }

  private thisScope(scope: Scope): Scope | null {
    let s: Scope | null = scope;
    while (s) {
      if (s.isFunction && !s.isArrow) return s;
      s = s.parent;
    }
    return null;
  }

  private getThis(scope: Scope, node: N): any {
    const fs = this.thisScope(scope);
    if (!fs) return undefined;
    if (!fs.thisInit) throw this.err(ReferenceError, 'Debes llamar a super() antes de usar this', node, 'super-first');
    return fs.thisValue;
  }

  private superBase(scope: Scope, node: N): any {
    const fs = this.thisScope(scope);
    if (!fs || !fs.homeObject) throw this.err(SyntaxError, "'super' solo puede usarse dentro de métodos de clase", node, 'unsupported');
    return Object.getPrototypeOf(fs.homeObject);
  }

  /** Obtiene una referencia (lectura/escritura) para ++, --, +=, etc. */
  private *getRef(node: N, scope: Scope): G<{ get: () => any; set: (v: any) => void }> {
    if (node.type === 'Identifier') {
      return { get: () => this.readIdentifier(node.name, scope, node), set: (v) => this.assignIdentifier(node.name, v, scope, node) };
    }
    if (node.type === 'MemberExpression') {
      const obj = yield* this.evalObject(node, scope);
      const key = yield* this.memberKey(node, scope);
      const isSuper = node.object.type === 'Super';
      const recv = isSuper ? this.getThis(scope, node) : undefined;
      return {
        get: () => this.getMember(obj, key, node, recv),
        set: (v) => this.setMember(isSuper ? recv : obj, key, v, node),
      };
    }
    throw this.err(SyntaxError, 'Lado izquierdo inválido en la asignación', node, 'syntax');
  }

  // ───────────────────────────── expresiones ─────────────────────────────

  private *evaluateNamed(node: N, scope: Scope, target: N | null): G<any> {
    const v = yield* this.evaluate(node, scope);
    if (
      target?.type === 'Identifier' &&
      typeof v === 'function' &&
      v[INTERP] &&
      !v[INTERP].name &&
      (node.type === 'ArrowFunctionExpression' || ((node.type === 'FunctionExpression' || node.type === 'ClassExpression') && !node.id))
    ) {
      v[INTERP].name = target.name;
      Object.defineProperty(v, 'name', { value: target.name, configurable: true });
    }
    return v;
  }

  private *evalArgs(args: N[], scope: Scope): G<any[]> {
    const out: any[] = [];
    for (const a of args) {
      if (a.type === 'SpreadElement') {
        const v = yield* this.evaluate(a.argument, scope);
        if (v == null || typeof v[Symbol.iterator] !== 'function') throw this.err(TypeError, `${typeName(v)} no es iterable`, a, 'not-iterable');
        out.push(...v);
      } else out.push(yield* this.evaluate(a, scope));
    }
    return out;
  }

  *evaluate(node: N, scope: Scope): G<any> {
    switch (node.type) {
      case 'Literal':
        if (node.regex) return new RegExp(node.regex.pattern, node.regex.flags);
        if (node.bigint !== undefined) return BigInt(node.bigint);
        return node.value;

      case 'Identifier':
        return this.readIdentifier(node.name, scope, node);

      case 'ThisExpression':
        return this.getThis(scope, node);

      case 'TemplateLiteral': {
        let s = node.quasis[0].value.cooked;
        for (let i = 0; i < node.expressions.length; i++) {
          const v = yield* this.evaluate(node.expressions[i], scope);
          if (this.profile.strictTypes && (v === undefined || v === null))
            throw this.err(TypeError, `Se intenta insertar ${v} en un texto (${this.src(node.expressions[i])})`, node.expressions[i], 'type-mismatch');
          s += String(v) + node.quasis[i + 1].value.cooked;
        }
        return s;
      }

      case 'ArrayExpression': {
        const arr: any[] = [];
        for (const el of node.elements) {
          if (el === null) arr.length++;
          else if (el.type === 'SpreadElement') arr.push(...(yield* this.evalArgs([el], scope)));
          else arr.push(yield* this.evaluate(el, scope));
        }
        return arr;
      }

      case 'ObjectExpression': {
        const obj: any = {};
        for (const prop of node.properties) {
          if (prop.type === 'SpreadElement') {
            Object.assign(obj, yield* this.evaluate(prop.argument, scope));
            continue;
          }
          const key = prop.computed ? toKey(yield* this.evaluate(prop.key, scope)) : prop.key.type === 'Identifier' ? prop.key.name : String(prop.key.value);
          if (prop.kind === 'init') {
            if (!prop.computed && !prop.shorthand && key === '__proto__') {
              const proto = yield* this.evaluate(prop.value, scope);
              if (proto === null || typeof proto === 'object' || typeof proto === 'function') Object.setPrototypeOf(obj, proto);
              continue;
            }
            const v = prop.method
              ? this.makeFunction({ kind: 'method', node: prop.value, scope, name: String(key), homeObject: obj })
              : yield* this.evaluateNamed(prop.value, scope, { type: 'Identifier', name: String(key) });
            Object.defineProperty(obj, key, { value: v, writable: true, enumerable: true, configurable: true });
          } else {
            const fn = this.makeFunction({ kind: 'accessor', node: prop.value, scope, name: String(key), homeObject: obj });
            const prev = Object.getOwnPropertyDescriptor(obj, key);
            Object.defineProperty(obj, key, {
              get: prop.kind === 'get' ? fn : prev?.get,
              set: prop.kind === 'set' ? fn : prev?.set,
              enumerable: true,
              configurable: true,
            });
          }
        }
        return obj;
      }

      case 'FunctionExpression': {
        if (node.id) {
          const fnScope = new Scope(scope, 'block', 'Función');
          const f = this.makeFunction({ kind: 'normal', node, scope: fnScope, name: node.id.name });
          fnScope.declare(node.id.name, 'const', f);
          return f;
        }
        return this.makeFunction({ kind: 'normal', node, scope, name: '' });
      }

      case 'ArrowFunctionExpression':
        return this.makeFunction({ kind: 'arrow', node, scope, name: '' });

      case 'ClassExpression':
        return yield* this.evalClass(node, scope);

      case 'UnaryExpression': {
        if (node.operator === 'typeof' && node.argument.type === 'Identifier' && !scope.lookup(node.argument.name)) return 'undefined';
        if (node.operator === 'delete') {
          if (node.argument.type === 'MemberExpression') {
            const obj = yield* this.evaluate(node.argument.object, scope);
            const key = yield* this.memberKey(node.argument, scope);
            if (obj == null) throw this.err(TypeError, `No se puede borrar '${String(key)}' de ${obj}`, node, 'read-prop-nullish');
            return delete obj[key];
          }
          return true;
        }
        const v = yield* this.evaluate(node.argument, scope);
        switch (node.operator) {
          case '-':
            if (this.profile.strictTypes && typeof v !== 'number' && typeof v !== 'bigint')
              throw this.err(TypeError, `No se puede aplicar '-' a ${typeName(v)}`, node, 'type-mismatch');
            return -v;
          case '+':
            return +v;
          case '!':
            return !v;
          case '~':
            return ~v;
          case 'typeof':
            return typeof v;
          case 'void':
            return undefined;
        }
        throw this.err(SyntaxError, `Operador no soportado: ${node.operator}`, node, 'unsupported');
      }

      case 'UpdateExpression': {
        const ref = yield* this.getRef(node.argument, scope);
        const old = ref.get();
        if (this.profile.strictTypes && typeof old !== 'number' && typeof old !== 'bigint')
          throw this.err(TypeError, `No se puede aplicar '${node.operator}' a ${typeName(old)}`, node, 'type-mismatch');
        const num: any = typeof old === 'bigint' ? old : Number(old);
        const one: any = typeof old === 'bigint' ? BigInt(1) : 1;
        const nv = node.operator === '++' ? num + one : num - one;
        ref.set(nv);
        return node.prefix ? nv : num;
      }

      case 'BinaryExpression': {
        const l = yield* this.evaluate(node.left, scope);
        const r = yield* this.evaluate(node.right, scope);
        return this.binary(node.operator, l, r, node);
      }

      case 'LogicalExpression': {
        const l = yield* this.evaluate(node.left, scope);
        if (node.operator === '&&' ? !l : node.operator === '||' ? l : l !== null && l !== undefined) return l;
        return yield* this.evaluate(node.right, scope);
      }

      case 'ConditionalExpression': {
        const t = yield* this.evaluate(node.test, scope);
        return yield* this.evaluate(t ? node.consequent : node.alternate, scope);
      }

      case 'AssignmentExpression': {
        const left = node.left;
        if (node.operator === '=') {
          if (left.type === 'ObjectPattern' || left.type === 'ArrayPattern') {
            const v = yield* this.evaluate(node.right, scope);
            yield* this.bindPattern(left, v, scope, null);
            return v;
          }
          if (left.type === 'Identifier') {
            const v = yield* this.evaluateNamed(node.right, scope, left);
            this.assignIdentifier(left.name, v, scope, left);
            return v;
          }
          const ref = yield* this.getRef(left, scope);
          const v = yield* this.evaluate(node.right, scope);
          ref.set(v);
          return v;
        }
        const ref = yield* this.getRef(left, scope);
        const cur = ref.get();
        if (node.operator === '&&=' || node.operator === '||=' || node.operator === '??=') {
          const skip = node.operator === '&&=' ? !cur : node.operator === '||=' ? !!cur : cur !== null && cur !== undefined;
          if (skip) return cur;
          const v = yield* this.evaluate(node.right, scope);
          ref.set(v);
          return v;
        }
        const r = yield* this.evaluate(node.right, scope);
        const v = this.binary(node.operator.slice(0, -1), cur, r, node);
        ref.set(v);
        return v;
      }

      case 'SequenceExpression': {
        let v: any;
        for (const e of node.expressions) v = yield* this.evaluate(e, scope);
        return v;
      }

      case 'MemberExpression': {
        const obj = yield* this.evalObject(node, scope);
        if (node.optional && (obj === null || obj === undefined)) throw CHAIN_SHORT;
        const key = yield* this.memberKey(node, scope);
        return this.getMember(obj, key, node, node.object.type === 'Super' ? this.getThis(scope, node) : undefined);
      }

      case 'ChainExpression':
        try {
          return yield* this.evaluate(node.expression, scope);
        } catch (e) {
          if (e === CHAIN_SHORT) return undefined;
          throw e;
        }

      case 'CallExpression':
        return yield* this.evalCall(node, scope);

      case 'NewExpression': {
        const callee = yield* this.evaluate(node.callee, scope);
        const args = yield* this.evalArgs(node.arguments, scope);
        return yield* this.construct(callee, args, node);
      }

      case 'MetaProperty': {
        if (node.meta.name === 'new') return this.thisScope(scope)?.newTarget;
        break;
      }

      case 'ParenthesizedExpression':
        return yield* this.evaluate(node.expression, scope);
    }
    const names: Record<string, string> = {
      AwaitExpression: 'await (funciones asíncronas)',
      YieldExpression: 'yield (generadores)',
      TaggedTemplateExpression: 'plantillas etiquetadas',
      ImportExpression: 'import()',
    };
    throw this.err(SyntaxError, `No soportado por el intérprete: ${names[node.type] ?? node.type}`, node, 'unsupported');
  }

  private binary(op: string, l: any, r: any, node: N): any {
    if (this.profile.strictTypes) this.checkTypes(op, l, r, node);
    switch (op) {
      case '+':
        return l + r;
      case '-':
        return l - r;
      case '*':
        return l * r;
      case '/':
        return l / r;
      case '%':
        return l % r;
      case '**':
        return l ** r;
      case '==':
        // eslint-disable-next-line eqeqeq -- semántica de JavaScript
        return l == r;
      case '!=':
        // eslint-disable-next-line eqeqeq -- semántica de JavaScript
        return l != r;
      case '===':
        return l === r;
      case '!==':
        return l !== r;
      case '<':
        return l < r;
      case '<=':
        return l <= r;
      case '>':
        return l > r;
      case '>=':
        return l >= r;
      case '&':
        return l & r;
      case '|':
        return l | r;
      case '^':
        return l ^ r;
      case '<<':
        return l << r;
      case '>>':
        return l >> r;
      case '>>>':
        return l >>> r;
      case 'in':
        if (r === null || (typeof r !== 'object' && typeof r !== 'function'))
          throw this.err(TypeError, `No se puede usar 'in' sobre ${typeName(r)}`, node, 'native');
        return l in r;
      case 'instanceof':
        if (typeof r !== 'function') throw this.err(TypeError, `El lado derecho de instanceof debe ser una clase`, node, 'not-constructor');
        return l instanceof r;
    }
    throw this.err(SyntaxError, `Operador no soportado: ${op}`, node, 'unsupported');
  }

  private checkTypes(op: string, l: any, r: any, node: N) {
    const tl = typeof l;
    const tr = typeof r;
    const fail = (why: string) => {
      throw this.err(TypeError, `Tipos incompatibles en '${this.src(node)}': ${why}`, node, 'type-mismatch');
    };
    if (op === '+') {
      if (!(SIMPLE_TYPES.has(tl) && SIMPLE_TYPES.has(tr)) || tl !== tr)
        fail(`no se puede sumar ${typeName(l)} con ${typeName(r)}. Convierte con Number() o String()`);
    } else if (['-', '*', '/', '%', '**', '&', '|', '^', '<<', '>>', '>>>'].includes(op)) {
      if (!((tl === 'number' && tr === 'number') || (tl === 'bigint' && tr === 'bigint')))
        fail(`el operador '${op}' requiere números y recibió ${typeName(l)} y ${typeName(r)}`);
    } else if (['<', '<=', '>', '>='].includes(op)) {
      if (tl !== tr || !SIMPLE_TYPES.has(tl)) fail(`no se puede comparar ${typeName(l)} con ${typeName(r)}`);
    }
  }

  // ───────────────────────────── llamadas ─────────────────────────────

  private *evalCall(node: N, scope: Scope): G<any> {
    const callee = node.callee;
    if (callee.type === 'Super') {
      const fs = this.thisScope(scope);
      if (!fs || fs.funcData?.kind !== 'class' || !fs.funcData.isDerived)
        throw this.err(SyntaxError, "super() solo puede llamarse en el constructor de una clase derivada (extends)", node, 'unsupported');
      const args = yield* this.evalArgs(node.arguments, scope);
      yield* this.doSuperCall(fs, args, node);
      return undefined;
    }
    let fn: any;
    let thisArg: any;
    if (callee.type === 'MemberExpression') {
      const obj = yield* this.evalObject(callee, scope);
      if (callee.optional && (obj === null || obj === undefined)) throw CHAIN_SHORT;
      const key = yield* this.memberKey(callee, scope);
      if (callee.object.type === 'Super') {
        thisArg = this.getThis(scope, callee);
        fn = this.getMember(obj, key, callee, thisArg);
      } else {
        fn = this.getMember(obj, key, callee);
        thisArg = obj;
        if (Array.isArray(obj) && typeof key === 'string' && Object.prototype.hasOwnProperty.call(ARRAY_HOF, key) && fn === (Array.prototype as any)[key]) {
          if (node.optional && fn == null) throw CHAIN_SHORT;
          const args = yield* this.evalArgs(node.arguments, scope);
          return yield* ARRAY_HOF[key].call(this, obj, args, node);
        }
      }
    } else {
      fn = yield* this.evaluate(callee, scope);
    }
    if (node.optional && (fn === null || fn === undefined)) throw CHAIN_SHORT;
    const args = yield* this.evalArgs(node.arguments, scope);
    if (typeof fn !== 'function')
      throw this.err(TypeError, `${this.src(callee)} no es una función (es ${typeName(fn)})`, callee, 'not-function');
    return yield* this.callFunction(fn, thisArg, args, undefined, node);
  }

  private *construct(callee: any, args: any[], node: N): G<any> {
    if (typeof callee !== 'function') throw this.err(TypeError, `${this.src(node.callee)} no es un constructor`, node, 'not-constructor');
    const d: FuncData | undefined = callee[INTERP];
    if ((d && d.kind !== 'normal' && d.kind !== 'class') || callee[GEN_NATIVE])
      throw this.err(TypeError, `${this.src(node.callee)} no es un constructor`, node, 'not-constructor');
    this.explain(`Se crea un nuevo objeto con new ${callee.name || this.src(node.callee)}`, node);
    return yield* this.callFunction(callee, undefined, args, callee, node);
  }

  callFunctionSync(fn: any, thisArg: any, args: any[]): any {
    return this.runSync(this.callFunction(fn, thisArg, args, undefined, null));
  }

  *callFunction(fn: any, thisArg: any, args: any[], newTarget: any, callNode: N | null): G<any> {
    const gen = fn[GEN_NATIVE];
    if (gen) return yield* gen.call(this, thisArg, args, callNode);
    const d: FuncData | undefined = fn[INTERP];
    if (!d) {
      try {
        return newTarget ? Reflect.construct(fn, args, newTarget) : Reflect.apply(fn, thisArg, args);
      } catch (e) {
        throw this.wrapError(e, callNode ?? this.currentNode);
      }
    }
    if (this.watchMode) throw new FatalError('La expresión no puede llamar funciones del programa', 'unsupported');
    if (d.kind === 'class' && !newTarget) throw this.err(TypeError, `La clase ${d.name} debe crearse con new ${d.name}(...)`, callNode, 'class-call');
    if (this.callStack.length >= this.profile.maxCallDepth)
      throw this.err(RangeError, `Desbordamiento de pila: más de ${this.profile.maxCallDepth} llamadas anidadas (¿recursión sin caso base?)`, callNode, 'stack-overflow');

    const name = d.name || '(anónima)';
    const fs = new Scope(d.scope, 'function', `Función ${name}`);
    fs.isFunction = true;
    fs.funcData = d;
    if (d.kind === 'arrow') fs.isArrow = true;
    else {
      fs.newTarget = newTarget;
      fs.homeObject = d.homeObject;
      if (newTarget) {
        if (d.kind === 'class' && d.isDerived) fs.thisInit = false;
        else {
          const proto = newTarget.prototype;
          fs.thisValue = Object.create(proto !== null && (typeof proto === 'object' || typeof proto === 'function') ? proto : Object.prototype);
          if (d.kind === 'class') yield* this.initFields(d, fs.thisValue);
        }
      } else fs.thisValue = thisArg;
      fs.declare('arguments', 'var', args);
    }

    const callerLine = this.currentLine;
    this.callStack.push({ name, line: callNode?.loc?.start.line ?? callerLine, callerScope: this.currentScope, callerLine });
    if (this.explainEnabled) this.explain(`Se llama a ${name}(${args.map((a) => this.fmt(a)).join(', ')})`, callNode ?? undefined);
    let result: any = undefined;
    let returned = false;
    try {
      const node = d.node;
      if (!node) {
        if (d.isDerived) yield* this.doSuperCall(fs, args, callNode);
      } else {
        if (node.async || node.generator)
          throw this.err(SyntaxError, 'Las funciones async y generadoras (function*) no están soportadas', node, 'unsupported');
        for (let i = 0; i < node.params.length; i++) {
          const p = node.params[i];
          if (p.type === 'RestElement') yield* this.bindPattern(p.argument, args.slice(i), fs, 'param');
          else yield* this.bindPattern(p, args[i], fs, 'param');
        }
        if (node.expression) {
          result = yield* this.evaluate(node.body, fs);
          returned = true;
        } else {
          const body = node.body.body;
          this.hoistVars(body, fs);
          this.hoistLexical(body, fs);
          const c = yield* this.execStatements(body, fs);
          if (c.type === 'return') {
            result = c.value;
            returned = true;
          }
        }
      }
    } finally {
      this.callStack.pop();
    }
    if (returned && d.kind !== 'class') this.explain(`${name} devuelve ${this.fmt(result)}`, callNode ?? undefined);
    if (newTarget) {
      if (result !== null && (typeof result === 'object' || typeof result === 'function')) return result;
      if (!fs.thisInit) throw this.err(ReferenceError, 'Debes llamar a super() en el constructor de la clase derivada', callNode, 'super-first');
      return fs.thisValue;
    }
    return result;
  }

  private *doSuperCall(fs: Scope, args: any[], node: N | null): G<void> {
    const d = fs.funcData!;
    if (fs.thisInit) throw this.err(ReferenceError, 'super() ya fue llamado en este constructor', node, 'super-first');
    const parent = d.parent;
    if (parent === null || parent === undefined) throw this.err(TypeError, 'La clase base no es un constructor', node, 'not-constructor');
    let obj: any;
    if (parent[INTERP]) obj = yield* this.callFunction(parent, undefined, args, fs.newTarget, node);
    else {
      try {
        obj = Reflect.construct(parent, args, fs.newTarget);
      } catch (e) {
        throw this.wrapError(e, node);
      }
    }
    fs.thisValue = obj;
    fs.thisInit = true;
    yield* this.initFields(d, obj);
  }

  private *initFields(d: FuncData, obj: any): G<void> {
    if (!d.fields?.length) return;
    const fsc = new Scope(d.scope, 'function', 'Inicialización de campos');
    fsc.isFunction = true;
    fsc.thisValue = obj;
    fsc.homeObject = d.homeObject;
    for (const f of d.fields) {
      const v = f.value ? yield* this.evaluateNamed(f.value, fsc, { type: 'Identifier', name: String(f.key) }) : undefined;
      Object.defineProperty(obj, f.key, {
        value: v,
        writable: true,
        configurable: true,
        enumerable: !(typeof f.key === 'string' && f.key.startsWith('#')),
      });
    }
  }

  makeFunction(d: FuncData): any {
    const interp = this;
    const f = function (this: any, ...args: any[]) {
      return interp.runSync(interp.callFunction(f, this, args, new.target, null));
    };
    Object.defineProperty(f, 'name', { value: d.name, configurable: true });
    if (d.node) {
      let len = 0;
      for (const p of d.node.params) {
        if (p.type === 'AssignmentPattern' || p.type === 'RestElement') break;
        len++;
      }
      Object.defineProperty(f, 'length', { value: len, configurable: true });
      const text = this.source.slice(d.node.start, d.node.end);
      Object.defineProperty(f, 'toString', { value: () => text, configurable: true, writable: true, enumerable: false });
    }
    (f as any)[INTERP] = d;
    return f;
  }

  private *propKey(m: N, scope: Scope): G<PropertyKey> {
    if (m.computed) return toKey(yield* this.evaluate(m.key, scope));
    if (m.key.type === 'PrivateIdentifier') return '#' + m.key.name;
    if (m.key.type === 'Identifier') return m.key.name;
    return String(m.key.value);
  }

  private *evalClass(node: N, scope: Scope): G<any> {
    const name = node.id?.name ?? '';
    let parent: any = null;
    if (node.superClass) {
      parent = yield* this.evaluate(node.superClass, scope);
      if (parent !== null && typeof parent !== 'function')
        throw this.err(TypeError, `La clase base '${this.src(node.superClass)}' no es una clase`, node.superClass, 'not-constructor');
    }
    const cs = new Scope(scope, 'block', `Clase ${name}`);
    if (name) cs.declare(name, 'const', undefined, false);
    const ctor = node.body.body.find((m: N) => m.type === 'MethodDefinition' && m.kind === 'constructor');
    const d: FuncData = { kind: 'class', node: ctor?.value ?? null, scope: cs, name, isDerived: !!node.superClass, parent, fields: [] };
    const C = this.makeFunction(d);
    if (!ctor) Object.defineProperty(C, 'toString', { value: () => this.source.slice(node.start, node.end), configurable: true, writable: true });
    const proto = C.prototype;
    if (node.superClass) {
      Object.setPrototypeOf(proto, parent === null ? null : parent.prototype);
      if (parent) Object.setPrototypeOf(C, parent);
    }
    d.homeObject = proto;
    const statics: { key: PropertyKey; value: N | null }[] = [];
    const staticBlocks: N[] = [];
    for (const m of node.body.body) {
      if (m.type === 'MethodDefinition') {
        if (m.kind === 'constructor') continue;
        const target = m.static ? C : proto;
        const key = yield* this.propKey(m, cs);
        const fn = this.makeFunction({ kind: m.kind === 'method' ? 'method' : 'accessor', node: m.value, scope: cs, name: String(key), homeObject: target });
        if (m.kind === 'method') Object.defineProperty(target, key, { value: fn, writable: true, configurable: true, enumerable: false });
        else {
          const prev = Object.getOwnPropertyDescriptor(target, key);
          Object.defineProperty(target, key, {
            get: m.kind === 'get' ? fn : prev?.get,
            set: m.kind === 'set' ? fn : prev?.set,
            configurable: true,
            enumerable: false,
          });
        }
      } else if (m.type === 'PropertyDefinition') {
        const key = yield* this.propKey(m, cs);
        (m.static ? statics : d.fields!).push({ key, value: m.value });
      } else if (m.type === 'StaticBlock') staticBlocks.push(m);
    }
    if (name) {
      const b = cs.vars.get(name)!;
      b.value = C;
      b.init = true;
    }
    if (statics.length || staticBlocks.length) {
      const fsc = new Scope(cs, 'function', `Clase ${name}`);
      fsc.isFunction = true;
      fsc.thisValue = C;
      fsc.homeObject = C;
      for (const s of statics) {
        C[s.key] = s.value ? yield* this.evaluateNamed(s.value, fsc, { type: 'Identifier', name: String(s.key) }) : undefined;
      }
      for (const b of staticBlocks) yield* this.execBlock(b.body, fsc);
    }
    return C;
  }

  // ───────────────────────────── inspección ─────────────────────────────

  private snapshotChain(start: Scope): ScopeSnapshot[] {
    const out: ScopeSnapshot[] = [];
    let s: Scope | null = start;
    while (s && s.type !== 'builtin') {
      const vars: VarSnapshot[] = [];
      for (const [name, b] of s.vars) {
        if (name === 'arguments') continue;
        vars.push({
          name,
          kind: b.kind,
          type: b.init ? typeName(b.value) : '—',
          value: b.init ? formatValue(b.value, { depth: 2, maxLength: 400 }) : '‹sin inicializar›',
        });
      }
      if (vars.length || s.type === 'global') out.push({ title: s.title || (s.type === 'global' ? 'Global' : 'Bloque'), vars });
      s = s.parent;
    }
    return out;
  }

  snapshotScopes(): ScopeSnapshot[] {
    return this.snapshotChain(this.currentScope);
  }

  /** Pila de llamadas: el primer elemento es el programa principal. */
  snapshotFrames(): FrameSnapshot[] {
    const frames: FrameSnapshot[] = [];
    const n = this.callStack.length;
    for (let i = 0; i <= n; i++) {
      const scope = i < n ? this.callStack[i].callerScope : this.currentScope;
      const line = i < n ? this.callStack[i].callerLine : this.currentLine;
      frames.push({ name: i === 0 ? 'Programa principal' : this.callStack[i - 1].name, line, scopes: this.snapshotChain(scope) });
    }
    return frames.reverse();
  }

  /** Variables visibles en el punto actual (la más interna gana). */
  visibleValues(): Map<string, any> {
    const out = new Map<string, any>();
    let s: Scope | null = this.currentScope;
    while (s && s.type !== 'builtin') {
      for (const [name, b] of s.vars) {
        if (name === 'arguments' || out.has(name) || !b.init) continue;
        if (b.kind === 'function' || b.kind === 'class') continue;
        out.set(name, b.value);
      }
      s = s.parent;
    }
    return out;
  }

  /** Evalúa una expresión de inspección sin efectos secundarios. */
  evalWatch(expr: string): { ok: true; value: any } | { ok: false; error: string } {
    let node = this.watchCache.get(expr);
    try {
      if (!node) {
        node = acorn.parseExpressionAt(expr, 0, { ecmaVersion: 'latest' }) as N;
        if (expr.slice(node.end).trim()) throw new Error('expresión inválida');
        this.watchCache.set(expr, node);
      }
      this.watchMode = true;
      const value = this.runSync(this.evaluate(node, this.currentScope));
      return { ok: true, value };
    } catch (e: any) {
      if (e instanceof ThrowSignal) return { ok: false, error: e.value instanceof Error ? e.value.message : formatValue(e.value) };
      return { ok: false, error: e?.message ?? String(e) };
    } finally {
      this.watchMode = false;
    }
  }
}

function toKey(k: any): PropertyKey {
  return typeof k === 'symbol' ? k : String(k);
}

export function patternNames(p: N): string[] {
  if (!p) return [];
  switch (p.type) {
    case 'Identifier':
      return [p.name];
    case 'AssignmentPattern':
      return patternNames(p.left);
    case 'RestElement':
      return patternNames(p.argument);
    case 'ObjectPattern':
      return p.properties.flatMap((q: N) => (q.type === 'RestElement' ? patternNames(q.argument) : patternNames(q.value)));
    case 'ArrayPattern':
      return p.elements.flatMap((e: N) => patternNames(e));
  }
  return [];
}

// ─────────── Métodos de arreglos con callbacks ejecutados paso a paso ───────────

type HOF = (this: Interpreter, arr: any[], args: any[], node: N) => G<any>;

function checkFn(fn: any, method: string, node: N) {
  if (typeof fn !== 'function') throw new ThrowSignal(new TypeError(`${method}: ${typeName(fn)} no es una función`), node, 'not-function');
}

function* call(this: Interpreter, fn: any, thisArg: any, args: any[], node: N): G<any> {
  return yield* this.callFunction(fn, thisArg, args, undefined, node);
}

const ARRAY_HOF: Record<string, HOF> = {
  *forEach(arr, [fn, t], node) {
    checkFn(fn, 'forEach', node);
    for (let i = 0; i < arr.length; i++) if (i in arr) yield* call.call(this, fn, t, [arr[i], i, arr], node);
    return undefined;
  },
  *map(arr, [fn, t], node) {
    checkFn(fn, 'map', node);
    const out = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) if (i in arr) out[i] = yield* call.call(this, fn, t, [arr[i], i, arr], node);
    return out;
  },
  *filter(arr, [fn, t], node) {
    checkFn(fn, 'filter', node);
    const out: any[] = [];
    for (let i = 0; i < arr.length; i++) if (i in arr && (yield* call.call(this, fn, t, [arr[i], i, arr], node))) out.push(arr[i]);
    return out;
  },
  *find(arr, [fn, t], node) {
    checkFn(fn, 'find', node);
    for (let i = 0; i < arr.length; i++) if (yield* call.call(this, fn, t, [arr[i], i, arr], node)) return arr[i];
    return undefined;
  },
  *findIndex(arr, [fn, t], node) {
    checkFn(fn, 'findIndex', node);
    for (let i = 0; i < arr.length; i++) if (yield* call.call(this, fn, t, [arr[i], i, arr], node)) return i;
    return -1;
  },
  *findLast(arr, [fn, t], node) {
    checkFn(fn, 'findLast', node);
    for (let i = arr.length - 1; i >= 0; i--) if (yield* call.call(this, fn, t, [arr[i], i, arr], node)) return arr[i];
    return undefined;
  },
  *findLastIndex(arr, [fn, t], node) {
    checkFn(fn, 'findLastIndex', node);
    for (let i = arr.length - 1; i >= 0; i--) if (yield* call.call(this, fn, t, [arr[i], i, arr], node)) return i;
    return -1;
  },
  *some(arr, [fn, t], node) {
    checkFn(fn, 'some', node);
    for (let i = 0; i < arr.length; i++) if (i in arr && (yield* call.call(this, fn, t, [arr[i], i, arr], node))) return true;
    return false;
  },
  *every(arr, [fn, t], node) {
    checkFn(fn, 'every', node);
    for (let i = 0; i < arr.length; i++) if (i in arr && !(yield* call.call(this, fn, t, [arr[i], i, arr], node))) return false;
    return true;
  },
  *reduce(arr, args, node) {
    const fn = args[0];
    checkFn(fn, 'reduce', node);
    let i = 0;
    let acc: any;
    if (args.length > 1) acc = args[1];
    else {
      while (i < arr.length && !(i in arr)) i++;
      if (i >= arr.length) throw new ThrowSignal(new TypeError('reduce de un arreglo vacío sin valor inicial'), node, 'native');
      acc = arr[i++];
    }
    for (; i < arr.length; i++) if (i in arr) acc = yield* call.call(this, fn, undefined, [acc, arr[i], i, arr], node);
    return acc;
  },
  *reduceRight(arr, args, node) {
    const fn = args[0];
    checkFn(fn, 'reduceRight', node);
    let i = arr.length - 1;
    let acc: any;
    if (args.length > 1) acc = args[1];
    else {
      while (i >= 0 && !(i in arr)) i--;
      if (i < 0) throw new ThrowSignal(new TypeError('reduceRight de un arreglo vacío sin valor inicial'), node, 'native');
      acc = arr[i--];
    }
    for (; i >= 0; i--) if (i in arr) acc = yield* call.call(this, fn, undefined, [acc, arr[i], i, arr], node);
    return acc;
  },
  *flatMap(arr, [fn, t], node) {
    checkFn(fn, 'flatMap', node);
    const out: any[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (!(i in arr)) continue;
      const v = yield* call.call(this, fn, t, [arr[i], i, arr], node);
      if (Array.isArray(v)) out.push(...v);
      else out.push(v);
    }
    return out;
  },
  *sort(arr, [cmp], node) {
    if (cmp === undefined) return arr.sort();
    checkFn(cmp, 'sort', node);
    const sorted = yield* mergeSort.call(this, arr.slice(), cmp, node);
    for (let i = 0; i < sorted.length; i++) arr[i] = sorted[i];
    return arr;
  },
  *toSorted(arr, [cmp], node) {
    if (cmp === undefined) return arr.slice().sort();
    checkFn(cmp, 'toSorted', node);
    return yield* mergeSort.call(this, arr.slice(), cmp, node);
  },
};

function* mergeSort(this: Interpreter, a: any[], cmp: any, node: N): G<any[]> {
  if (a.length <= 1) return a;
  const mid = a.length >> 1;
  const left = yield* mergeSort.call(this, a.slice(0, mid), cmp, node);
  const right = yield* mergeSort.call(this, a.slice(mid), cmp, node);
  const out: any[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const r = Number(yield* call.call(this, cmp, undefined, [left[i], right[j]], node));
    if (r > 0) out.push(right[j++]);
    else out.push(left[i++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}
