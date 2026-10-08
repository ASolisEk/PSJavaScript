/**
 * Formateo de valores al estilo de la consola de Node/navegador.
 * Se usa en la consola, el panel de variables y la prueba de escritorio.
 */

export const INTERP = Symbol.for('psjs.interp');

export interface FormatOptions {
  depth?: number;
  /** En el nivel superior los textos se muestran sin comillas (como console.log). */
  topLevelRaw?: boolean;
  maxItems?: number;
  maxLength?: number;
}

function isClassFn(fn: any): boolean {
  const d = fn?.[INTERP];
  if (d) return d.kind === 'class';
  try {
    return /^class[\s{]/.test(Function.prototype.toString.call(fn));
  } catch {
    return false;
  }
}

function formatKey(k: string | symbol): string {
  if (typeof k === 'symbol') return `[${String(k)}]`;
  return /^[A-Za-z_$#][\w$]*$/.test(k) ? k : `'${k.replace(/'/g, "\\'")}'`;
}

function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function ctorName(obj: any): string | null {
  const proto = Object.getPrototypeOf(obj);
  if (proto === null) return '[Object: null prototype]';
  const c = proto && Object.prototype.hasOwnProperty.call(proto, 'constructor') ? proto.constructor : null;
  if (!c || c === Object) return null;
  return c.name || null;
}

export function formatValue(value: any, opts: FormatOptions = {}): string {
  const depth = opts.depth ?? 2;
  const maxItems = opts.maxItems ?? 100;
  const seen = new Set<any>();

  const fmt = (v: any, level: number, top: boolean): string => {
    switch (typeof v) {
      case 'string':
        return top && opts.topLevelRaw ? v : quote(v);
      case 'number':
        return Object.is(v, -0) ? '-0' : String(v);
      case 'bigint':
        return `${v}n`;
      case 'boolean':
        return String(v);
      case 'undefined':
        return 'undefined';
      case 'symbol':
        return String(v);
      case 'function': {
        if (isClassFn(v)) return `[class ${v.name || '(anónima)'}]`;
        return `[Function: ${v.name || '(anónima)'}]`;
      }
    }
    if (v === null) return 'null';
    if (seen.has(v)) return '[Circular]';

    if (v instanceof Date) return isNaN(v.getTime()) ? 'Invalid Date' : v.toISOString();
    if (v instanceof RegExp) return String(v);
    if (v instanceof Error) {
      const base = `${v.name}: ${v.message}`;
      return top ? base : `[${base}]`;
    }

    if (Array.isArray(v)) {
      if (level > depth) return '[Array]';
      seen.add(v);
      const parts: string[] = [];
      let holes = 0;
      const n = Math.min(v.length, maxItems);
      for (let i = 0; i < n; i++) {
        if (!(i in v)) {
          holes++;
          continue;
        }
        if (holes) {
          parts.push(`<${holes} vacío${holes > 1 ? 's' : ''}>`);
          holes = 0;
        }
        parts.push(fmt(v[i], level + 1, false));
      }
      if (holes) parts.push(`<${holes} vacío${holes > 1 ? 's' : ''}>`);
      if (v.length > maxItems) parts.push(`... ${v.length - maxItems} más`);
      seen.delete(v);
      return parts.length ? `[ ${parts.join(', ')} ]` : '[]';
    }

    if (v instanceof Map) {
      if (level > depth) return '[Map]';
      seen.add(v);
      const parts: string[] = [];
      for (const [k, val] of v) parts.push(`${fmt(k, level + 1, false)} => ${fmt(val, level + 1, false)}`);
      seen.delete(v);
      return `Map(${v.size}) {${parts.length ? ` ${parts.join(', ')} ` : ''}}`;
    }
    if (v instanceof Set) {
      if (level > depth) return '[Set]';
      seen.add(v);
      const parts: string[] = [];
      for (const val of v) parts.push(fmt(val, level + 1, false));
      seen.delete(v);
      return `Set(${v.size}) {${parts.length ? ` ${parts.join(', ')} ` : ''}}`;
    }

    const name = ctorName(v);
    if (level > depth) return name ? `[${name}]` : '[Object]';
    seen.add(v);
    const parts: string[] = [];
    const keys = Reflect.ownKeys(v);
    let count = 0;
    for (const k of keys) {
      const desc = Object.getOwnPropertyDescriptor(v, k);
      if (!desc || (!desc.enumerable && !(typeof k === 'string' && k.startsWith('#')))) continue;
      if (count++ >= maxItems) {
        parts.push('...');
        break;
      }
      let val: string;
      if (desc.get || desc.set) val = desc.get && desc.set ? '[Getter/Setter]' : desc.get ? '[Getter]' : '[Setter]';
      else val = fmt(desc.value, level + 1, false);
      parts.push(`${formatKey(k)}: ${val}`);
    }
    seen.delete(v);
    const body = parts.length ? `{ ${parts.join(', ')} }` : '{}';
    return name ? `${name} ${body}` : body;
  };

  let out = fmt(value, 0, true);
  const maxLength = opts.maxLength ?? 0;
  if (maxLength && out.length > maxLength) out = out.slice(0, maxLength - 1) + '…';
  return out;
}

/** Nombre del tipo en español, para el panel de variables. */
export function typeName(v: any): string {
  if (v === null) return 'nulo';
  if (Array.isArray(v)) return 'arreglo';
  switch (typeof v) {
    case 'number':
      return Number.isInteger(v) ? 'número (entero)' : 'número (real)';
    case 'string':
      return 'texto';
    case 'boolean':
      return 'lógico';
    case 'undefined':
      return 'indefinido';
    case 'bigint':
      return 'bigint';
    case 'symbol':
      return 'símbolo';
    case 'function':
      return isClassFn(v) ? 'clase' : 'función';
  }
  if (v instanceof Map) return 'Map';
  if (v instanceof Set) return 'Set';
  if (v instanceof Date) return 'fecha';
  if (v instanceof Error) return 'error';
  const n = ctorName(v);
  return n ? `objeto (${n})` : 'objeto';
}

/** Formatea los argumentos de console.log (soporta %s %d %i %f %o %O). */
export function formatLogArgs(args: any[]): string {
  if (!args.length) return '';
  let rest = args;
  let head = '';
  if (typeof args[0] === 'string' && /%[sdifoOc%]/.test(args[0]) && args.length > 1) {
    let i = 1;
    head = args[0].replace(/%([sdifoOc%])/g, (m, f) => {
      if (f === '%') return '%';
      if (i >= args.length) return m;
      const a = args[i++];
      switch (f) {
        case 's':
          return typeof a === 'string' ? a : formatValue(a, { depth: 1 });
        case 'd':
        case 'i':
          return String(f === 'i' ? Math.trunc(Number(a)) : Number(a));
        case 'f':
          return String(Number(a));
        case 'c':
          return '';
        default:
          return formatValue(a);
      }
    });
    rest = args.slice(i);
    return [head, ...rest.map((a) => formatValue(a, { topLevelRaw: true }))].join(' ');
  }
  return rest.map((a) => formatValue(a, { topLevelRaw: true })).join(' ');
}

/** console.table: tabla en texto. */
export function formatTable(data: any): string {
  if (data === null || typeof data !== 'object') return formatValue(data, { topLevelRaw: true });
  const rowKeys = Array.isArray(data) ? data.map((_, i) => String(i)) : Object.keys(data);
  const cols: string[] = [];
  let hasValues = false;
  for (const rk of rowKeys) {
    const row = (data as any)[rk];
    if (row !== null && typeof row === 'object') {
      for (const k of Object.keys(row)) if (!cols.includes(k)) cols.push(k);
    } else hasValues = true;
  }
  const header = ['(índice)', ...cols, ...(hasValues ? ['Valores'] : [])];
  const rows = rowKeys.map((rk) => {
    const row = (data as any)[rk];
    const isObj = row !== null && typeof row === 'object';
    return [
      rk,
      ...cols.map((c) => (isObj && c in row ? formatValue(row[c], { depth: 0 }) : '')),
      ...(hasValues ? [isObj ? '' : formatValue(row, { depth: 0 })] : []),
    ];
  });
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (l: string, m: string, r: string) => l + widths.map((w) => '─'.repeat(w + 2)).join(m) + r;
  const fmtRow = (cells: string[]) => '│' + cells.map((c, i) => ` ${c.padEnd(widths[i])} `).join('│') + '│';
  return [line('┌', '┬', '┐'), fmtRow(header), line('├', '┼', '┤'), ...rows.map(fmtRow), line('└', '┴', '┘')].join('\n');
}
