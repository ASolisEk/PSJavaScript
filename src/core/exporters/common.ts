/** Utilidades compartidas por los exportadores a otros lenguajes. */
import * as acorn from 'acorn';

export type N = any;

export interface ExportResult {
  code: string;
  warnings: string[];
}

export function parse(code: string): N {
  return acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
}

export class Writer {
  lines: string[] = [];
  level = 0;
  constructor(private unit = '    ') {}
  line(s = '') {
    this.lines.push(s ? this.unit.repeat(this.level) + s : '');
  }
  indent<T>(fn: () => T): T {
    this.level++;
    try {
      return fn();
    } finally {
      this.level--;
    }
  }
  toString() {
    return this.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
}

export interface ReadInfo {
  prompt: N | null;
  conv: 'number' | 'int' | 'float' | 'string' | 'bool';
}

/** Detecta prompt(...), Number(prompt(...)), parseInt(prompt(...)), +prompt(...), confirm(...). */
export function readOf(e: N): ReadInfo | null {
  if (!e) return null;
  const isPrompt = (x: N) => x?.type === 'CallExpression' && x.callee.type === 'Identifier' && x.callee.name === 'prompt';
  if (isPrompt(e)) return { prompt: e.arguments[0] ?? null, conv: 'string' };
  if (e.type === 'CallExpression' && e.callee.type === 'Identifier' && e.callee.name === 'confirm') return { prompt: e.arguments[0] ?? null, conv: 'bool' };
  if (e.type === 'UnaryExpression' && e.operator === '+' && isPrompt(e.argument)) return { prompt: e.argument.arguments[0] ?? null, conv: 'number' };
  if (e.type === 'CallExpression' && e.callee.type === 'Identifier' && isPrompt(e.arguments[0])) {
    const conv = ({ Number: 'number', parseInt: 'int', parseFloat: 'float', String: 'string' } as const)[e.callee.name as 'Number'];
    if (conv) return { prompt: e.arguments[0].arguments[0] ?? null, conv };
  }
  return null;
}

export interface ForRange {
  name: string;
  start: N;
  end: N;
  inclusive: boolean;
  step: number;
}

/** Detecta for (let i = a; i < b; i++) y variantes simples. */
export function forRange(n: N): ForRange | null {
  let name: string | null = null;
  let start: N = null;
  const init = n.init;
  if (init?.type === 'VariableDeclaration' && init.declarations.length === 1 && init.declarations[0].id.type === 'Identifier' && init.declarations[0].init) {
    name = init.declarations[0].id.name;
    start = init.declarations[0].init;
  } else if (init?.type === 'AssignmentExpression' && init.operator === '=' && init.left.type === 'Identifier') {
    name = init.left.name;
    start = init.right;
  }
  if (!name) return null;
  const t = n.test;
  if (t?.type !== 'BinaryExpression' || t.left.type !== 'Identifier' || t.left.name !== name || !['<', '<=', '>', '>='].includes(t.operator)) return null;
  const u = n.update;
  let step: number | null = null;
  if (u?.type === 'UpdateExpression' && u.argument.type === 'Identifier' && u.argument.name === name) step = u.operator === '++' ? 1 : -1;
  else if (u?.type === 'AssignmentExpression' && u.left.type === 'Identifier' && u.left.name === name && u.right.type === 'Literal' && typeof u.right.value === 'number') {
    if (u.operator === '+=') step = u.right.value;
    else if (u.operator === '-=') step = -u.right.value;
  } else if (
    u?.type === 'AssignmentExpression' &&
    u.operator === '=' &&
    u.left.type === 'Identifier' &&
    u.left.name === name &&
    u.right.type === 'BinaryExpression' &&
    u.right.left.type === 'Identifier' &&
    u.right.left.name === name &&
    u.right.right.type === 'Literal' &&
    typeof u.right.right.value === 'number' &&
    (u.right.operator === '+' || u.right.operator === '-')
  ) {
    step = u.right.operator === '+' ? u.right.right.value : -u.right.right.value;
  }
  if (!step) return null;
  const up = t.operator === '<' || t.operator === '<=';
  if (up !== step > 0) return null;
  return { name, start, end: t.right, inclusive: t.operator === '<=' || t.operator === '>=', step };
}

export type SimpleType = 'int' | 'float' | 'string' | 'bool' | 'array' | 'object' | 'unknown';

export function literalType(e: N): SimpleType {
  if (!e) return 'unknown';
  if (e.type === 'Literal') {
    if (typeof e.value === 'number') return Number.isInteger(e.value) && !/[.eE]/.test(e.raw) ? 'int' : 'float';
    if (typeof e.value === 'string') return 'string';
    if (typeof e.value === 'boolean') return 'bool';
  }
  if (e.type === 'TemplateLiteral') return 'string';
  if (e.type === 'ArrayExpression') return 'array';
  if (e.type === 'ObjectExpression') return 'object';
  if (e.type === 'UnaryExpression' && e.operator === '-' ) return literalType(e.argument);
  if (e.type === 'UnaryExpression' && e.operator === '!') return 'bool';
  if (e.type === 'BinaryExpression' && ['<', '>', '<=', '>=', '==', '===', '!=', '!=='].includes(e.operator)) return 'bool';
  const r = readOf(e);
  if (r) return r.conv === 'number' || r.conv === 'float' ? 'float' : r.conv === 'int' ? 'int' : r.conv === 'bool' ? 'bool' : 'string';
  return 'unknown';
}

/** ¿La expresión es claramente un texto? (para insertar conversiones en concatenaciones). */
export function isStringy(e: N): boolean {
  if (!e) return false;
  if (e.type === 'Literal') return typeof e.value === 'string';
  if (e.type === 'TemplateLiteral') return true;
  if (e.type === 'BinaryExpression' && e.operator === '+') return isStringy(e.left) || isStringy(e.right);
  return false;
}

export function functionHasReturnValue(fn: N): boolean {
  let found = false;
  const walk = (x: N) => {
    if (found || !x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(walk);
    if (x !== fn && /Function/.test(x.type)) return;
    if (x.type === 'ReturnStatement' && x.argument) {
      found = true;
      return;
    }
    for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') walk(x[k]);
  };
  walk(fn.body);
  return found || fn.expression;
}

export function str(s: string, quote = '"') {
  return quote + s.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), '\\' + quote).replace(/\n/g, '\\n') + quote;
}

/** Fragmentos de una plantilla `a${b}c` como lista de partes. */
export function templateParts(e: N): ({ text: string } | { expr: N })[] {
  const parts: ({ text: string } | { expr: N })[] = [];
  e.quasis.forEach((q: N, i: number) => {
    if (q.value.cooked) parts.push({ text: q.value.cooked });
    if (i < e.expressions.length) parts.push({ expr: e.expressions[i] });
  });
  return parts;
}
