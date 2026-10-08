/** Sangría inteligente y formateo del código. */
import { tokenize } from './tokenizer';

export const INDENT = '  ';

function lineIndent(line: string): string {
  return /^[ \t]*/.exec(line)![0];
}

/**
 * Calcula el texto a insertar cuando el usuario presiona Enter en `cursor`.
 * Devuelve el nuevo texto y la nueva posición del cursor.
 */
export function newlineWithIndent(code: string, cursor: number): { text: string; cursor: number } {
  const lineStart = code.lastIndexOf('\n', cursor - 1) + 1;
  const current = code.slice(lineStart, cursor);
  const base = lineIndent(current);
  const before = current.trimEnd();
  const after = code.slice(cursor);
  const opens = /[{([]$/.test(before) || /\b(case\s.*|default)\s*:$/.test(before);
  const closesNext = /^[ \t]*[})\]]/.test(after);
  if (opens && closesNext && /[{([]$/.test(before)) {
    const inner = '\n' + base + INDENT;
    const insert = inner + '\n' + base;
    return { text: code.slice(0, cursor) + insert + after.replace(/^[ \t]*/, ''), cursor: cursor + inner.length };
  }
  const insert = '\n' + base + (opens ? INDENT : '');
  return { text: code.slice(0, cursor) + insert + after, cursor: cursor + insert.length };
}

/** Si el usuario escribe } al inicio de una línea, quita un nivel de sangría. */
export function dedentOnClose(code: string, cursor: number): { text: string; cursor: number } | null {
  const ch = code[cursor - 1];
  if (ch !== '}' && ch !== ']' && ch !== ')') return null;
  const lineStart = code.lastIndexOf('\n', cursor - 2) + 1;
  const prefix = code.slice(lineStart, cursor - 1);
  if (!/^[ \t]+$/.test(prefix)) return null;
  const newPrefix = prefix.slice(0, Math.max(0, prefix.length - INDENT.length));
  return { text: code.slice(0, lineStart) + newPrefix + code.slice(cursor - 1), cursor: lineStart + newPrefix.length + 1 };
}

/** Reindenta todo el programa según la estructura de llaves. */
export function formatCode(code: string): string {
  const toks = tokenize(code);
  const lines = code.split('\n');
  // profundidad al inicio de cada línea y si empieza cerrando
  const lineStarts: number[] = [];
  let off = 0;
  for (const l of lines) {
    lineStarts.push(off);
    off += l.length + 1;
  }
  const depthAt: number[] = new Array(lines.length).fill(0);
  const inSwitchCase: boolean[] = new Array(lines.length).fill(false);
  const stack: { ch: string; isSwitch: boolean; inCase: boolean }[] = [];
  let li = 0;
  let lineHasSwitch = false;
  const lineSnapshot = () => {
    depthAt[li] = stack.length;
    inSwitchCase[li] = !!stack.length && stack[stack.length - 1].isSwitch && stack[stack.length - 1].inCase;
  };
  lineSnapshot();
  const skipLines = new Set<number>(); // líneas dentro de comentarios multilínea o plantillas
  for (const t of toks) {
    // avanzar a la línea del token
    while (li + 1 < lines.length && lineStarts[li + 1] <= t.start) {
      li++;
      lineHasSwitch = false;
      lineSnapshot();
    }
    if ((t.type === 'comment' || t.type === 'template' || t.type === 'string') && t.text.includes('\n')) {
      let k = li;
      const end = t.start + t.text.length;
      while (k + 1 < lines.length && lineStarts[k + 1] < end) skipLines.add(++k);
    }
    if (t.type === 'keyword' && t.text === 'switch') lineHasSwitch = true;
    if (t.type === 'keyword' && (t.text === 'case' || t.text === 'default') && stack.length && stack[stack.length - 1].isSwitch) {
      stack[stack.length - 1].inCase = true;
    }
    if (t.type === 'punct' && (t.text === '{' || t.text === '(' || t.text === '[')) stack.push({ ch: t.text, isSwitch: t.text === '{' && lineHasSwitch, inCase: false });
    else if (t.type === 'punct' && (t.text === '}' || t.text === ')' || t.text === ']')) stack.pop();
  }
  return lines
    .map((line, i) => {
      if (skipLines.has(i)) return line;
      const trimmed = line.trim();
      if (!trimmed) return '';
      let depth = depthAt[i];
      // la línea comienza cerrando bloques
      const closers = /^[})\]]+/.exec(trimmed)?.[0].length ?? 0;
      depth -= closers;
      const isCase = /^(case\b|default\s*:)/.test(trimmed);
      if (inSwitchCase[i] && !isCase && closers === 0) depth += 1;
      return INDENT.repeat(Math.max(0, depth)) + trimmed;
    })
    .join('\n');
}

/** Comenta o descomenta las líneas seleccionadas. */
export function toggleComment(code: string, selStart: number, selEnd: number): { text: string; start: number; end: number } {
  const from = code.lastIndexOf('\n', selStart - 1) + 1;
  let to = code.indexOf('\n', Math.max(selEnd - (selEnd > selStart ? 1 : 0), selStart));
  if (to < 0) to = code.length;
  const block = code.slice(from, to).split('\n');
  const allCommented = block.every((l) => !l.trim() || /^\s*\/\//.test(l));
  const out = block.map((l) => {
    if (!l.trim()) return l;
    if (allCommented) return l.replace(/^(\s*)\/\/ ?/, '$1');
    const ind = lineIndent(l);
    return ind + '// ' + l.slice(ind.length);
  });
  const text = code.slice(0, from) + out.join('\n') + code.slice(to);
  return { text, start: from, end: from + out.join('\n').length };
}
