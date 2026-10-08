/**
 * Analizador léxico ligero para resaltado de sintaxis, pareo de llaves y
 * sangría. Tolera código incompleto (mientras se escribe).
 */

export type TokType = 'keyword' | 'string' | 'template' | 'number' | 'comment' | 'ident' | 'builtin' | 'func' | 'operator' | 'punct' | 'space' | 'regex' | 'property' | 'constant';

export interface Token {
  type: TokType;
  text: string;
  start: number;
}

export const KEYWORDS = new Set([
  'let', 'const', 'var', 'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break', 'continue', 'function',
  'return', 'class', 'extends', 'new', 'this', 'super', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in',
  'of', 'delete', 'void', 'static', 'get', 'set', 'async', 'await', 'yield', 'debugger', 'import', 'export',
]);
export const CONSTANTS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
export const BUILTIN_OBJECTS = new Set([
  'console', 'Math', 'JSON', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Map', 'Set', 'Date', 'RegExp', 'Error',
  'TypeError', 'RangeError', 'prompt', 'confirm', 'alert', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'setTimeout',
  'setInterval', 'clearTimeout', 'clearInterval', 'Symbol', 'BigInt',
]);

const PUNCT = new Set(['{', '}', '(', ')', '[', ']', ';', ',', '.', ':']);
const OPS = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'];

export function tokenize(code: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  const n = code.length;
  const templateDepth: number[] = []; // profundidad de llaves dentro de ${ }
  let braceDepth = 0;
  const regexAllowed = () => {
    for (let k = toks.length - 1; k >= 0; k--) {
      const t = toks[k];
      if (t.type === 'space' || t.type === 'comment') continue;
      if (t.type === 'number' || t.type === 'string' || t.type === 'template' || t.type === 'regex' || t.type === 'constant') return false;
      if (t.type === 'ident' || t.type === 'builtin' || t.type === 'func' || t.type === 'property') return false;
      if (t.type === 'keyword') return !['this', 'super'].includes(t.text);
      if (t.text === ')' || t.text === ']' || t.text === '}') return false;
      return true;
    }
    return true;
  };

  const readTemplate = (start: number) => {
    // lee desde ` o desde } (continuación) hasta ` o ${
    let j = start + 1;
    while (j < n) {
      if (code[j] === '\\') {
        j += 2;
        continue;
      }
      if (code[j] === '`') {
        j++;
        toks.push({ type: 'template', text: code.slice(start, j), start });
        return j;
      }
      if (code[j] === '$' && code[j + 1] === '{') {
        j += 2;
        toks.push({ type: 'template', text: code.slice(start, j), start });
        templateDepth.push(braceDepth);
        braceDepth++;
        return j;
      }
      j++;
    }
    toks.push({ type: 'template', text: code.slice(start), start });
    return n;
  };

  while (i < n) {
    const c = code[i];
    // espacios
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      let j = i + 1;
      while (j < n && /[ \t\n\r]/.test(code[j])) j++;
      toks.push({ type: 'space', text: code.slice(i, j), start: i });
      i = j;
      continue;
    }
    // comentarios
    if (c === '/' && code[i + 1] === '/') {
      let j = code.indexOf('\n', i);
      if (j < 0) j = n;
      toks.push({ type: 'comment', text: code.slice(i, j), start: i });
      i = j;
      continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      let j = code.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      toks.push({ type: 'comment', text: code.slice(i, j), start: i });
      i = j;
      continue;
    }
    // textos
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && code[j] !== c && code[j] !== '\n') j += code[j] === '\\' ? 2 : 1;
      if (code[j] === c) j++;
      toks.push({ type: 'string', text: code.slice(i, j), start: i });
      i = j;
      continue;
    }
    if (c === '`') {
      i = readTemplate(i);
      continue;
    }
    if (c === '}' && templateDepth.length && templateDepth[templateDepth.length - 1] === braceDepth - 1) {
      templateDepth.pop();
      braceDepth--;
      i = readTemplate(i);
      continue;
    }
    // números
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(code[i + 1] ?? ''))) {
      const m = /^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(\d[\d_]*\.?\d*|\.\d+)([eE][+-]?\d+)?)n?/.exec(code.slice(i, i + 64));
      const len = m ? m[0].length : 1;
      toks.push({ type: 'number', text: code.slice(i, i + len), start: i });
      i += len;
      continue;
    }
    // identificadores
    if (/[A-Za-z_$#À-￿]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$À-￿]/.test(code[j])) j++;
      const word = code.slice(i, j);
      let type: TokType = 'ident';
      const prev = lastSignificant(toks);
      if (prev && (prev.text === '.' || prev.text === '?.')) type = 'property';
      else if (KEYWORDS.has(word)) type = 'keyword';
      else if (CONSTANTS.has(word)) type = 'constant';
      else if (BUILTIN_OBJECTS.has(word)) type = 'builtin';
      if (type === 'ident' || type === 'property') {
        let k = j;
        while (k < n && (code[k] === ' ' || code[k] === '\t')) k++;
        if (code[k] === '(') type = 'func';
      }
      toks.push({ type, text: word, start: i });
      i = j;
      continue;
    }
    // expresiones regulares
    if (c === '/' && regexAllowed()) {
      let j = i + 1;
      let inClass = false;
      let ok = false;
      while (j < n && code[j] !== '\n') {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === '[') inClass = true;
        else if (code[j] === ']') inClass = false;
        else if (code[j] === '/' && !inClass) {
          ok = true;
          j++;
          break;
        }
        j++;
      }
      if (ok) {
        while (j < n && /[a-z]/.test(code[j])) j++;
        toks.push({ type: 'regex', text: code.slice(i, j), start: i });
        i = j;
        continue;
      }
    }
    if (PUNCT.has(c) && !(c === '.' && code.startsWith('...', i))) {
      if (c === '{') braceDepth++;
      else if (c === '}') braceDepth = Math.max(0, braceDepth - 1);
      toks.push({ type: 'punct', text: c, start: i });
      i++;
      continue;
    }
    const op = OPS.find((o) => code.startsWith(o, i));
    const text = op ?? c;
    toks.push({ type: 'operator', text, start: i });
    i += text.length;
  }
  return toks;
}

function lastSignificant(toks: Token[]): Token | undefined {
  for (let k = toks.length - 1; k >= 0; k--) if (toks[k].type !== 'space' && toks[k].type !== 'comment') return toks[k];
  return undefined;
}

export interface LineToken {
  type: TokType;
  text: string;
  start: number;
}

/** Divide los tokens por líneas (para dibujar el resaltado línea por línea). */
export function tokensByLine(code: string, toks = tokenize(code)): LineToken[][] {
  const lines: LineToken[][] = [[]];
  for (const t of toks) {
    const parts = t.text.split('\n');
    let offset = t.start;
    parts.forEach((p, idx) => {
      if (idx > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ type: t.type, text: p, start: offset });
      offset += p.length + 1;
    });
  }
  return lines;
}

const OPEN: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSE: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

/** Posición del corchete pareja del que está junto al cursor. */
export function matchBracket(toks: Token[], cursor: number): [number, number] | null {
  const br = toks.filter((t) => t.type === 'punct' && (OPEN[t.text] || CLOSE[t.text]));
  let idx = br.findIndex((t) => t.start === cursor - 1 && (OPEN[t.text] || CLOSE[t.text]));
  if (idx < 0) idx = br.findIndex((t) => t.start === cursor);
  if (idx < 0) return null;
  const t = br[idx];
  if (OPEN[t.text]) {
    let depth = 0;
    for (let k = idx; k < br.length; k++) {
      if (br[k].text === t.text) depth++;
      else if (br[k].text === OPEN[t.text]) {
        depth--;
        if (depth === 0) return [t.start, br[k].start];
      }
    }
  } else {
    let depth = 0;
    for (let k = idx; k >= 0; k--) {
      if (br[k].text === t.text) depth++;
      else if (br[k].text === CLOSE[t.text]) {
        depth--;
        if (depth === 0) return [br[k].start, t.start];
      }
    }
  }
  return null;
}

/** Palabra (identificador, con puntos) que termina en la posición del cursor. */
export function wordBefore(code: string, cursor: number): { word: string; start: number } {
  let s = cursor;
  while (s > 0 && /[\w$.À-￿]/.test(code[s - 1])) s--;
  return { word: code.slice(s, cursor), start: s };
}

/** Nombres declarados en el código (para autocompletar). */
export function declaredNames(code: string): string[] {
  const names = new Set<string>();
  const re = /\b(?:let|const|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) names.add(m[1]);
  const params = /function\s*[\w$]*\s*\(([^)]*)\)|\(([^()]*)\)\s*=>/g;
  while ((m = params.exec(code))) {
    for (const p of (m[1] ?? m[2] ?? '').split(',')) {
      const name = p.trim().replace(/=.*$/, '').replace(/^\.\.\./, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return [...names];
}
