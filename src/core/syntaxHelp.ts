/**
 * "Detective de sintaxis": convierte los errores de acorn (casi siempre un
 * escueto "Unexpected token") en explicaciones que un estudiante entiende:
 * un título corto, qué pasó en lenguaje sencillo, la línea donde realmente
 * está el problema (que no siempre es donde se notó) y cómo arreglarlo.
 *
 * Reconoce delimitadores sin cerrar o sobrantes, comillas, hábitos de PSeInt
 * (Si…Entonces, :=, y/o, =<), palabras clave mal escritas, comas u operadores
 * faltantes y otros tropiezos comunes. Módulo puro (sin React).
 */
import { COMMANDS } from './catalog';
import { ErrorHint, hintFor, translateSyntaxError } from './errors';
import { closest } from './text';

export interface SyntaxExplanation {
  /** Corto, para la lista de problemas y la mascota. */
  title: string;
  /** Qué pasó, en lenguaje sencillo. */
  message: string;
  /** Dónde está probablemente el problema (1-based / 0-based). */
  line: number;
  col: number;
  /** Línea donde lo detectó el analizador, si es distinta. */
  detectedLine?: number;
  hint: ErrorHint;
}

interface SyntaxErrorLike {
  message: string;
  pos?: number;
  loc?: { line: number; column: number };
}

interface Pos {
  ch: string;
  pos: number;
  line: number;
  col: number;
}

interface Ctx {
  code: string;
  lines: string[];
  raw: string;
  pos: number;
  line: number;
  col: number;
  /** Texto de la línea del error. */
  text: string;
  /** Lexema que encontró el analizador ('' = fin del código). */
  token: string;
  /** Último carácter significativo antes del error. */
  before: Pos | null;
}

type Detector = (c: Ctx) => SyntaxExplanation | null;

// ───────────────────────────── utilidades ─────────────────────────────

const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const NAMES: Record<string, string> = {
  '(': 'el paréntesis (',
  ')': 'el paréntesis )',
  '[': 'el corchete [',
  ']': 'el corchete ]',
  '{': 'la llave {',
  '}': 'la llave }',
};

const mk = (title: string, message: string, at: { line: number; col: number }, causes: string[], solutions: string[], detectedLine?: number): SyntaxExplanation => ({
  title,
  message,
  line: at.line,
  col: at.col,
  detectedLine: detectedLine && detectedLine !== at.line ? detectedLine : undefined,
  hint: { causes, solutions },
});

/** Quita el contenido de los textos para buscar símbolos sin falsos positivos. */
const stripStrings = (s: string) => s.replace(/(["'`])(?:\\.|(?!\1).)*\1?/g, '""');

/**
 * Recorre ( [ { y sus cierres saltando textos y comentarios. Devuelve los que
 * quedaron abiertos, el primer cierre sobrante y el primer par cruzado.
 */
export function scanDelimiters(code: string) {
  const stack: Pos[] = [];
  let line = 1;
  let lineStart = 0;
  let extra: Pos | null = null;
  let mismatch: { open: Pos; close: Pos } | null = null;
  const newLine = (i: number) => {
    line++;
    lineStart = i + 1;
  };
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === '\n') {
      newLine(i);
      continue;
    }
    if (ch === '/' && code[i + 1] === '/') {
      while (i + 1 < code.length && code[i + 1] !== '\n') i++;
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') newLine(i);
        i++;
      }
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      // texto: hasta la comilla de cierre (los normales no cruzan líneas)
      while (i + 1 < code.length) {
        const c = code[++i];
        if (c === '\\') {
          i++;
          continue;
        }
        if (c === '\n') {
          if (ch !== '`') {
            i--;
            break;
          }
          newLine(i);
          continue;
        }
        if (c === ch) break;
      }
      continue;
    }
    const col = i - lineStart;
    if (PAIRS[ch]) stack.push({ ch, pos: i, line, col });
    else if (CLOSERS[ch]) {
      const top = stack[stack.length - 1];
      if (!top) {
        extra = extra ?? { ch, pos: i, line, col };
      } else if (top.ch !== CLOSERS[ch]) {
        mismatch = mismatch ?? { open: top, close: { ch, pos: i, line, col } };
        stack.pop();
      } else stack.pop();
    }
  }
  return { unclosed: stack, extra, mismatch };
}

function context(code: string, err: SyntaxErrorLike): Ctx {
  const lines = code.split('\n');
  const line = Math.max(1, Math.min(err.loc?.line ?? 1, lines.length));
  const col = err.loc?.column ?? 0;
  let pos = err.pos ?? -1;
  if (pos < 0) {
    pos = 0;
    for (let i = 0; i < line - 1; i++) pos += lines[i].length + 1;
    pos += col;
  }
  const rest = code.slice(pos);
  const token = rest.match(/^([A-Za-z_$À-ɏ][\w$À-ɏ]*|\d[\w.]*|"[^"\n]*"?|'[^'\n]*'?|\S)/)?.[1] ?? '';
  let before: Pos | null = null;
  for (let i = pos - 1, l = line, c = col - 1; i >= 0; i--) {
    const ch = code[i];
    if (ch === '\n') {
      l--;
      c = (lines[l - 1] ?? '').length - 1;
      continue;
    }
    if (!/\s/.test(ch)) {
      before = { ch, pos: i, line: l, col: c };
      break;
    }
    c--;
  }
  return { code, lines, raw: err.message.replace(/\s*\(\d+:\d+\)\s*$/, ''), pos, line, col, text: lines[line - 1] ?? '', token, before };
}

const firstWord = (s: string) => s.match(/^\s*(?:\}\s*)?([A-Za-zÀ-ɏ_$][\w$À-ɏ]*)/)?.[1] ?? '';
const indentOf = (s: string) => s.match(/^\s*/)![0].length;

/** Línea anterior con contenido. */
function prevLine(c: Ctx, from = c.line): { line: number; text: string } | null {
  for (let l = from - 1; l >= 1; l--) if (c.lines[l - 1].trim() && !/^\s*\/\//.test(c.lines[l - 1])) return { line: l, text: c.lines[l - 1] };
  return null;
}

// ───────────────────────────── detectores ─────────────────────────────

/** “Comillas” curvas copiadas de Word o del teléfono. */
const smartQuotes: Detector = (c) => {
  const m = c.raw.match(/^Unexpected character '([“”‘’«»])'/);
  if (!m) return null;
  return mk(
    'Comillas de procesador de texto',
    `Escribiste ${m[1]}: esas comillas curvas vienen de Word o del teléfono y JavaScript no las entiende. Usa comillas rectas " o '.`,
    c,
    ['Copiaste el código de un documento, una página o un chat que cambió las comillas.'],
    ['Borra las comillas curvas y escríbelas con el teclado: "hola".', 'En el teléfono, mantén presionada la tecla de comillas para elegir la recta.'],
  );
};

/** Texto, plantilla o comentario sin cerrar. */
const unterminated: Detector = (c) => {
  if (/^Unterminated (string constant|template)/.test(c.raw)) {
    const q = c.code[c.pos] === '`' || c.raw.includes('template') ? '`' : c.code[c.pos] === "'" ? "'" : '"';
    return mk(
      'Falta la comilla de cierre',
      `El texto que empieza con ${q} en la columna ${c.col + 1} no se cierra. Todo texto abre y cierra con la misma comilla, en la misma línea.`,
      c,
      ['Olvidaste la comilla final.', 'Abriste con un tipo de comilla y cerraste con otro (" y \').'],
      [`Agrega ${q} al final del texto: ${q}hola${q}`, 'Si el texto lleva la misma comilla adentro, usa la otra para rodearlo: "Dijo \'hola\'".'],
    );
  }
  if (/^Unterminated comment/.test(c.raw))
    return mk('Comentario sin cerrar', 'Un comentario que empieza con /* debe terminar con */. Todo lo que sigue se volvió comentario.', c, ['Falta el */ final.'], ['Agrega */ donde termina el comentario, o usa // para comentarios de una línea.']);
  return null;
};

/** Mensajes específicos de acorn que merecen una explicación mejor. */
const specific: Detector = (c) => {
  let m: RegExpMatchArray | null;
  if (/^Identifier directly after number/.test(c.raw))
    return mk(
      'Un nombre no puede empezar con número',
      'Los nombres de variables y funciones empiezan con una letra, _ o $. Los números pueden ir después: x2, nota1.',
      c,
      ['El nombre empieza con un dígito (por ejemplo 2x).'],
      ['Cambia el nombre: numero2 o x2 en lugar de 2x.', 'Si querías multiplicar, escribe el operador: 2 * x.'],
    );
  if ((m = c.raw.match(/^(?:Unexpected keyword|The keyword) '(\w+)'/))) {
    const alt: Record<string, string> = { class: 'clase', new: 'nuevo', function: 'funcion', for: 'para', if: 'si', case: 'caso', default: 'porDefecto', delete: 'borrar', in: 'dentro', return: 'resultado', switch: 'opcion', this: 'esto', var: 'valor' };
    return mk(
      `"${m[1]}" es una palabra reservada`,
      `JavaScript usa "${m[1]}" para su propio lenguaje, así que no puede ser el nombre de una variable.`,
      c,
      ['Elegiste como nombre una palabra que ya tiene un significado en JavaScript.'],
      [`Usa otro nombre, por ejemplo ${alt[m[1]] ?? m[1] + 'Valor'}.`],
    );
  }
  if ((m = c.raw.match(/^Identifier '(.*)' has already been declared/)))
    return mk(
      `"${m[1]}" ya fue declarada`,
      `Ya creaste una variable llamada ${m[1]} en este mismo bloque. let y const solo se escriben la primera vez.`,
      c,
      ['Escribiste let o const dos veces para la misma variable.'],
      [`Para cambiar su valor, quita el let/const: ${m[1]} = nuevoValor;`, 'Si es otra variable, dale un nombre distinto.'],
    );
  if (/^'return' outside of function/.test(c.raw))
    return mk('return fuera de una función', 'return sirve para devolver el resultado de una función, pero esta línea no está dentro de ninguna.', c, ['La función se cerró con } antes de llegar al return.'], ['Revisa las llaves de la función.', 'Para mostrar un resultado usa console.log(...).']);
  if ((m = c.raw.match(/^Unsyntactic (break|continue)/)))
    return mk(`${m[1]} fuera de un ciclo`, `${m[1]} solo puede usarse dentro de un ciclo (for, while)${m[1] === 'break' ? ' o de un switch' : ''}.`, c, ['El ciclo se cerró antes, o el break quedó fuera.'], ['Revisa las llaves del ciclo.']);
  return null;
};

/** for (let i = 0, i < 5, i++): las partes van con ; */
const forCommas: Detector = (c) => {
  const m = stripStrings(c.text).match(/\bfor\s*\(([^)]*)\)?/);
  if (!m || m[1].includes(';') || !m[1].includes(',') || /\b(of|in)\b/.test(m[1])) return null;
  return mk(
    'Las partes del for se separan con ;',
    'Un for tiene tres partes: inicio; condición; cambio. Van separadas por punto y coma, no por comas.',
    { line: c.line, col: indentOf(c.text) },
    ['Usaste comas en lugar de punto y coma dentro del for.'],
    ['Escríbelo así: for (let i = 0; i < 5; i++) { … }'],
  );
};

/** Palabras de PSeInt y su equivalente en JavaScript (del catálogo). */
const PSEINT: Record<string, { js: string; command?: string }> = {
  si: { js: 'if', command: 'Si-Entonces (if)' },
  sino: { js: 'else', command: 'Si-SiNo (if/else)' },
  mientras: { js: 'while', command: 'Mientras (while)' },
  para: { js: 'for', command: 'Para (for)' },
  escribir: { js: 'console.log', command: 'Escribir' },
  imprimir: { js: 'console.log', command: 'Escribir' },
  mostrar: { js: 'console.log', command: 'Escribir' },
  leer: { js: 'prompt', command: 'Leer número' },
  definir: { js: 'let', command: 'Declarar variable' },
  dimension: { js: 'un arreglo [ ]', command: 'Arreglo' },
  segun: { js: 'switch', command: 'Según (switch)' },
  repetir: { js: 'do … while', command: 'Repetir (do...while)' },
  funcion: { js: 'function', command: 'Función' },
  subproceso: { js: 'function', command: 'Función' },
  algoritmo: { js: 'nada: el programa son las instrucciones' },
  proceso: { js: 'nada: el programa son las instrucciones' },
};

const template = (label?: string) => {
  const item = label ? COMMANDS.find((x) => x.label === label) : undefined;
  return item?.insert?.replace(/\$\d/g, '').replace(/\s*\n\s*/g, ' ').trim();
};

const pseintKeyword: Detector = (c) => {
  const w = firstWord(c.text);
  const k = w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (!k) return null;
  const at = { line: c.line, col: indentOf(c.text) };
  if (/^fin(si|mientras|para|segun|funcion|subproceso|algoritmo|proceso)$/.test(k))
    return mk(
      `"${w}" es de PSeInt`,
      'En JavaScript los bloques no terminan con FinSi, FinMientras, etc.: se cierran con la llave }.',
      at,
      ['Escribiste el programa con la sintaxis de PSeInt.'],
      ['Cambia la palabra por }.', k.includes('algoritmo') || k.includes('proceso') ? 'Algoritmo/FinAlgoritmo no hacen falta: bórralos.' : 'Cada { que abre un bloque necesita su } al final.'],
    );
  const p = PSEINT[k];
  if (!p || /^\s*\w+\s*[=(.[]/.test(c.text.trimStart())) return null;
  const tpl = template(p.command);
  return mk(
    `"${w}" es de PSeInt; en JavaScript es ${p.js.split(':')[0]}`,
    `Esa instrucción está escrita como en PSeInt. En JavaScript se escribe con ${p.js}${tpl ? `, así: ${tpl}` : '.'}`,
    at,
    ['Escribiste el programa con la sintaxis de PSeInt.'],
    tpl ? [`Usa la forma de JavaScript: ${tpl}`, 'Con el botón Insertar (⊕) de la barra puedes agregar la estructura completa.'] : ['Bórralo: en JavaScript no hace falta.'],
  );
};

/** Operadores de PSeInt u operadores mal escritos en la línea del error. */
const pseintOperators: Detector = (c) => {
  const s = stripStrings(c.text);
  const at = (re: RegExp) => {
    const i = s.search(re);
    return { line: c.line, col: i < 0 ? c.col : i };
  };
  const ops: [RegExp, string, string, string][] = [
    [/:=/, 'En JavaScript se asigna con =', 'Para guardar un valor en una variable se usa un solo =. El := es de PSeInt y otros lenguajes.', 'let x = 5;'],
    [/<-/, 'En JavaScript se asigna con =', 'La flecha <- es de PSeInt; en JavaScript se usa =.', 'let x = 5;'],
    [/=</, 'Se escribe <= (primero el <)', 'Los operadores "menor o igual" y "mayor o igual" se escriben con el = al final: <= y >=.', 'if (x <= 2) { … }'],
    [/<>/, 'En JavaScript "distinto" es !==', 'El <> de PSeInt se escribe !== en JavaScript.', 'if (x !== 0) { … }'],
    [/\s(y|Y|AND|and)\s/, 'Usa && en lugar de "y"', 'Para que se cumplan dos condiciones a la vez se usa && (y lógico).', 'if (x > 1 && x < 5) { … }'],
    [/\s(o|O|OR|or)\s/, 'Usa || en lugar de "o"', 'Para que baste con que se cumpla una de dos condiciones se usa || (o lógico).', 'if (x < 1 || x > 5) { … }'],
    [/(^|[\s(])(no|NO|NOT|not)\s/, 'Usa ! en lugar de "no"', 'Para negar una condición se usa ! (no lógico).', 'if (!terminado) { … }'],
    [/\s(MOD|mod)\s/, 'El residuo se calcula con %', 'MOD es de PSeInt; en JavaScript el residuo de una división se calcula con %.', 'let r = 7 % 2;'],
  ];
  for (const [re, title, message, example] of ops) {
    if (re.test(s)) return mk(title, message, at(re), ['Usaste un operador de PSeInt u otro lenguaje.'], [`Ejemplo: ${example}`]);
  }
  if (/\b(if|while)\s*\(.*=>/.test(s))
    return mk('Se escribe >= (primero el >)', 'El "mayor o igual" se escribe >=. El => sirve para otra cosa (funciones flecha).', at(/=>/), ['Escribiste los símbolos al revés.'], ['Ejemplo: if (x >= 2) { … }']);
  return null;
};

/** Paréntesis, corchetes o llaves sin cerrar, sobrantes o cruzados. */
const delimiters: Detector = (c) => {
  const { unclosed, extra, mismatch } = scanDelimiters(c.code);
  if (mismatch) {
    const { open, close } = mismatch;
    return mk(
      `Abriste ${open.ch} pero cerraste con ${close.ch}`,
      `${NAMES[open.ch][0].toUpperCase() + NAMES[open.ch].slice(1)} de la línea ${open.line} se cierra con ${close.ch}, que no le corresponde. Cada ( se cierra con ), cada [ con ] y cada { con }.`,
      close,
      ['Falta cerrar algo antes, o usaste el símbolo equivocado.'],
      [`Cambia ${close.ch} por ${PAIRS[open.ch]}, o cierra primero lo que quedó abierto.`],
      c.line,
    );
  }
  if (extra) {
    // ¿un encabezado (if/for/function…) al que le falta su { ?
    if (extra.ch === '}') {
      for (let l = extra.line - 1; l >= 1; l--) {
        const t = stripStrings(c.lines[l - 1]);
        if (/\b(function\s*[\w$]*\s*\(.*\)|if\s*\(.*\)|else|for\s*\(.*\)|while\s*\(.*\)|class\s+[\w$]+)\s*$/.test(t.trimEnd()) && !t.includes('{'))
          return mk(
            'Falta la llave { para abrir el bloque',
            `En la línea ${l} empieza un bloque pero no tiene su { de apertura, así que la } de la línea ${extra.line} queda sin pareja.`,
            { line: l, col: t.trimEnd().length },
            ['Olvidaste la { al final del encabezado (if, for, while, function…).'],
            [`Agrega { al final de la línea ${l}.`],
            c.line,
          );
      }
    }
    return mk(
      `Sobra ${NAMES[extra.ch].replace(/^(el|la) /, '')}`,
      `${NAMES[extra.ch][0].toUpperCase() + NAMES[extra.ch].slice(1)} de la línea ${extra.line} no tiene su pareja de apertura ${CLOSERS[extra.ch]}.`,
      extra,
      ['Cerraste el bloque o el paréntesis dos veces.', `Falta el ${CLOSERS[extra.ch]} de apertura más arriba.`],
      ['Bórralo si sobra, o agrega el de apertura donde corresponde.', 'Mantener la sangría ordenada ayuda a ver qué cierra cada llave.'],
      c.line,
    );
  }
  if (unclosed.length) {
    const before = unclosed.filter((o) => o.pos < c.pos);
    const open = (before.length ? before : unclosed)[(before.length ? before : unclosed).length - 1];
    const brace = open.ch === '{';
    return mk(
      brace ? `La llave { de la línea ${open.line} nunca se cierra` : `Falta cerrar ${NAMES[open.ch]}`,
      brace
        ? `El bloque que abre en la línea ${open.line} necesita su } al final. JavaScript llegó a otra parte del código sin encontrarla.`
        : `En la línea ${open.line} abriste ${open.ch} y falta su ${PAIRS[open.ch]} (o sobra uno de apertura).`,
      open,
      brace ? ['Olvidaste la } que cierra el if, ciclo o función.'] : [`Falta ${PAIRS[open.ch]} al final, por ejemplo en console.log("hola").`],
      brace ? ['Agrega } donde termina el bloque.', 'Cada { necesita una }; la sangría te ayuda a ver dónde.'] : [`Agrega ${PAIRS[open.ch]} donde termina, o quita el ${open.ch} que sobra.`],
      c.line,
    );
  }
  return null;
};

/** if x > 2 { …  →  if (x > 2) { … } */
const conditionParens: Detector = (c) => {
  const m = c.text.match(/^(\s*(?:\}\s*)?(?:else\s+)?)(if|while|switch)\s+(?!\()(.+?)\s*(\{?)\s*$/);
  if (!m) return null;
  const kw = m[2];
  const what = kw === 'switch' ? 'El valor del switch' : `La condición del ${kw}`;
  return mk(
    `${what} va entre paréntesis`,
    `En JavaScript, ${kw} siempre lleva su ${kw === 'switch' ? 'valor' : 'condición'} entre ( ). Así: ${kw} (${m[3].replace(/\)$/, '')}) {`,
    { line: c.line, col: m[1].length },
    [`Faltan los paréntesis alrededor de ${kw === 'switch' ? 'el valor' : 'la condición'}.`],
    [`Escribe: ${kw} (${m[3].replace(/\)$/, '')}) { … }`],
  );
};

const KEYWORDS = ['function', 'return', 'const', 'let', 'var', 'if', 'else', 'while', 'for', 'switch', 'case', 'break', 'continue', 'class', 'new', 'do', 'true', 'false', 'null', 'console', 'typeof', 'try', 'catch', 'throw', 'default', 'prompt'];

/** ¿Letras iguales con dos vecinas intercambiadas? (retrun, esle) */
const swapped = (a: string, b: string) => {
  if (a.length !== b.length || a === b) return false;
  const d = [...a].map((ch, i) => (ch !== b[i] ? i : -1)).filter((i) => i >= 0);
  return d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]];
};

/** funcion, retrun, esle, cosnt… */
const misspelled: Detector = (c) => {
  const words: { w: string; line: number; col: number }[] = [];
  const fw = firstWord(c.text);
  if (fw) words.push({ w: fw, line: c.line, col: c.text.indexOf(fw) });
  // la palabra justo antes del error
  const prev = c.code.slice(0, c.pos).match(/([A-Za-z_$][\w$]*)\s*$/);
  if (prev) {
    const start = c.pos - prev[0].length;
    const ln = c.code.slice(0, start).split('\n').length;
    words.push({ w: prev[1], line: ln, col: start - (c.code.lastIndexOf('\n', start - 1) + 1) });
  }
  for (const { w, line, col } of words) {
    if (w.length < 3 || KEYWORDS.includes(w)) continue;
    const kw = KEYWORDS.find((k) => swapped(w.toLowerCase(), k)) ?? (w.length >= 4 ? closest(w, KEYWORDS) : null);
    if (!kw || kw === w) continue;
    return mk(
      `¿Quisiste escribir ${kw}?`,
      `"${w}" no es una palabra de JavaScript; se parece a ${kw}. Las palabras clave se escriben exactas y en minúsculas.`,
      { line, col },
      ['Error de dedo o palabra en español.'],
      [`Cámbiala por ${kw}.`],
      c.line,
    );
  }
  return null;
};

/** const PI;  →  const PI = 3.1416; */
const constWithoutValue: Detector = (c) => {
  const m = c.text.match(/^\s*const\s+([\w$]+)\s*;?\s*$/);
  if (!m) return null;
  return mk(
    'A una constante hay que darle valor',
    `const crea una variable que no puede cambiar, así que necesita su valor desde el inicio: const ${m[1]} = valor;`,
    { line: c.line, col: indentOf(c.text) },
    ['Declaraste una constante sin valor.'],
    [`Dale valor: const ${m[1]} = 10;`, `Si el valor llega después, usa let: let ${m[1]};`],
  );
};

/** let a = ;  ·  x = 3 + ;  ·  f(1, ) */
const missingValue: Detector = (c) => {
  const b = c.before;
  if (!b || !/[=+\-*/%,(<>&|!]/.test(b.ch) || !/^([;)\]}]|)$/.test(c.token)) return null;
  if (b.ch === ',' && /^[)\]}]$/.test(c.token)) return null; // coma final permitida
  const op = /[=<>!&|]/.test(b.ch) ? c.code.slice(Math.max(0, b.pos - 2), b.pos + 1).match(/[=<>!&|]+$/)![0] : b.ch;
  return mk(
    `Falta un valor después de «${op}»`,
    op === '='
      ? 'Después del = va el valor que quieres guardar, y no hay nada.'
      : `Después de «${op}» debería venir un valor (un número, un texto o una variable), pero no hay nada.`,
    { line: b.line, col: b.col },
    ['La instrucción quedó incompleta.'],
    op === '=' ? ['Escribe el valor: let a = 0;', 'Si todavía no tienes el valor, declara sin =: let a;'] : [`Completa la operación o quita el «${op}» que sobra.`],
  );
};

/** else que no viene justo después de la } de un if. */
const strayElse: Detector = (c) => {
  if (c.token !== 'else') return null;
  return mk(
    'Este else no tiene un if justo antes',
    'else va inmediatamente después de la } que cierra un if: if (…) { … } else { … }.',
    c,
    ['Hay instrucciones entre la } del if y el else.', 'Pusiste ; después de la } o del if (…).', 'Falta el if.'],
    ['Pon el else justo después de la } del if.', 'Revisa que las llaves del if estén bien cerradas.'],
  );
};

/** Dos valores seguidos sin coma ni operador: [1 2 3] · "Hola" nombre */
const missingSeparator: Detector = (c) => {
  const b = c.before;
  if (!b || b.line !== c.line || !c.token) return null;
  const endsValue = /["'`\w$)\]]/.test(b.ch);
  const startsValue = /^["'`\w$([]/.test(c.token) && !/^(of|in|instanceof)$/.test(c.token);
  if (!endsValue || !startsValue) return null;
  const inside = scanDelimiters(c.code.slice(0, c.pos)).unclosed.pop()?.ch;
  const text = /["'`]/.test(b.ch) || /^["'`]/.test(c.token);
  if (inside === '[')
    return mk('Falta una coma entre los elementos', 'En un arreglo cada elemento va separado por una coma: [1, 2, 3].', c, ['Olvidaste una coma entre dos elementos.'], ['Agrega , entre los elementos.']);
  if (text)
    return mk(
      'Para unir textos usa +',
      'Entre un texto y otro valor falta algo. Para unirlos en uno solo usa +; para mostrarlos separados usa una coma.',
      c,
      ['Pusiste un texto y una variable juntos sin nada en medio.'],
      ['Unir: "Hola " + nombre', 'Separar (console.log): console.log("Hola", nombre)'],
    );
  if (inside === '(')
    return mk('Falta una coma entre los valores', 'Los valores que le pasas a una función van separados por comas: Math.max(3, 7).', c, ['Olvidaste una coma entre dos valores.'], ['Agrega , entre los valores.']);
  return mk(
    'Falta un operador entre dos valores',
    'Hay dos valores seguidos sin nada que los una. ¿Falta un operador (+, -, *, /, =) o un punto y coma?',
    c,
    ['Olvidaste un operador o un ;.', 'Un nombre de variable tiene espacios (los nombres van juntos: totalVentas).'],
    ['Agrega el operador que necesitas, por ejemplo precio * cantidad.', 'Si son dos instrucciones, sepáralas con ;.'],
  );
};

/** El error se notó al inicio de una línea: suele estar al final de la anterior. */
const atLineStart: Detector = (c) => {
  if (c.col !== indentOf(c.text)) return null;
  const p = prevLine(c);
  if (!p) return null;
  return mk(
    `Revisa el final de la línea ${p.line}`,
    `Lo noté al inicio de la línea ${c.line}, pero normalmente el problema está al final de la línea ${p.line}: algo quedó incompleto.`,
    { line: p.line, col: p.text.trimEnd().length },
    ['Falta un ), un operador o una coma al final de la línea anterior.', 'La línea anterior terminó con un operador o una coma de más.'],
    [`Lee con calma la línea ${p.line} completa.`],
    c.line,
  );
};

/** Respaldo: al menos decir qué símbolo no esperaba. */
const fallback: Detector = (c) => {
  if (/^Unexpected token/.test(c.raw)) {
    if (!c.token)
      return mk('El código terminó antes de tiempo', 'Llegué al final del programa y algo quedó incompleto.', c, ['Falta cerrar algo o terminar una instrucción.'], ['Revisa las últimas líneas.']);
    return mk(`No esperaba «${c.token}» aquí`, `En esta posición «${c.token}» no tiene sentido. Revisa lo que escribiste justo antes.`, c, hintFor('syntax')!.causes, hintFor('syntax')!.solutions);
  }
  const t = translateSyntaxError(c.raw);
  return mk(t, t, c, hintFor('syntax')!.causes, hintFor('syntax')!.solutions);
};

// Orden: primero los mensajes concretos de acorn, luego la estructura y al final las heurísticas.
const DETECTORS: Detector[] = [
  smartQuotes,
  unterminated,
  forCommas,
  specific,
  pseintKeyword,
  delimiters,
  pseintOperators,
  constWithoutValue,
  conditionParens,
  strayElse,
  missingValue,
  misspelled,
  missingSeparator,
  atLineStart,
  fallback,
];

/** Explica un error de sintaxis de acorn para un estudiante. */
export function explainSyntaxError(code: string, err: SyntaxErrorLike): SyntaxExplanation {
  const c = context(code, err);
  for (const d of DETECTORS) {
    const r = d(c);
    if (r) return r;
  }
  return fallback(c)!;
}
