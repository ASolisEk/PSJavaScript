/**
 * Mensajes de error en español con causas comunes y posibles soluciones,
 * al estilo de las descripciones detalladas de PSeInt.
 */

export interface ErrorHint {
  causes: string[];
  solutions: string[];
}

export type ErrorCode =
  | 'undefined-var'
  | 'undeclared-assign'
  | 'const-assign'
  | 'tdz'
  | 'read-prop-nullish'
  | 'set-prop-nullish'
  | 'not-function'
  | 'not-constructor'
  | 'class-call'
  | 'not-iterable'
  | 'stack-overflow'
  | 'type-mismatch'
  | 'super-first'
  | 'input-in-callback'
  | 'unsupported'
  | 'uncaught'
  | 'native'
  | 'syntax'
  | 'step-limit';

const HINTS: Record<ErrorCode, ErrorHint> = {
  'undefined-var': {
    causes: [
      'Escribiste mal el nombre de la variable (JavaScript distingue mayúsculas y minúsculas).',
      'Usas la variable antes de declararla o fuera del bloque { } donde fue declarada.',
    ],
    solutions: ['Revisa la ortografía del nombre.', 'Declárala con let o const antes de usarla.'],
  },
  'undeclared-assign': {
    causes: ['Asignas un valor a una variable que nunca fue declarada.'],
    solutions: ['Agrega let antes del nombre la primera vez que la usas: let x = 5;'],
  },
  'const-assign': {
    causes: ['La variable fue declarada con const y su valor no puede cambiar.'],
    solutions: ['Si necesitas modificarla, declárala con let en lugar de const.'],
  },
  tdz: {
    causes: ['Usas una variable declarada con let/const antes de la línea donde se declara.'],
    solutions: ['Mueve la declaración antes del primer uso.'],
  },
  'read-prop-nullish': {
    causes: [
      'La variable u objeto vale undefined o null.',
      'Accediste a una posición de un arreglo que no existe (índice fuera de rango).',
      'Una función no devolvió nada (falta return).',
    ],
    solutions: [
      'Verifica que la variable tenga valor antes de usarla (por ejemplo con if (x !== undefined)).',
      'Revisa los límites de los ciclos que recorren arreglos (usa < arreglo.length).',
      'Puedes usar el encadenamiento opcional: objeto?.propiedad',
    ],
  },
  'set-prop-nullish': {
    causes: ['Intentas asignar una propiedad a un valor undefined o null.'],
    solutions: ['Inicializa el objeto o arreglo antes de asignar sus elementos: let a = [];'],
  },
  'not-function': {
    causes: [
      'El nombre no corresponde a una función (quizás es una variable).',
      'Escribiste mal el nombre del método (ej. console.Log en lugar de console.log).',
    ],
    solutions: ['Revisa la ortografía y que la función esté definida.', 'Consulta la ayuda (F1) para ver las funciones disponibles.'],
  },
  'not-constructor': {
    causes: ['Usas new con algo que no es una clase ni una función constructora.'],
    solutions: ['Usa new solo con clases (class) o funciones normales.'],
  },
  'class-call': {
    causes: ['Las clases no se pueden llamar como funciones.'],
    solutions: ['Crea un objeto con new: let obj = new MiClase();'],
  },
  'not-iterable': {
    causes: ['for...of solo recorre arreglos, textos, Map, Set u otros iterables.'],
    solutions: ['Para recorrer las propiedades de un objeto usa for...in u Object.keys(obj).'],
  },
  'stack-overflow': {
    causes: ['Una función recursiva no tiene caso base o nunca lo alcanza.', 'Dos funciones se llaman entre sí indefinidamente.'],
    solutions: ['Agrega una condición de parada (caso base) antes de la llamada recursiva.'],
  },
  'type-mismatch': {
    causes: ['El perfil actual exige tipos estrictos y la operación mezcla tipos distintos.', 'prompt() siempre devuelve texto.'],
    solutions: ['Convierte explícitamente: Number(texto), String(numero).', 'Cambia de perfil si quieres permitir conversiones automáticas.'],
  },
  'super-first': {
    causes: ['En una clase derivada debes llamar a super() antes de usar this.'],
    solutions: ['Agrega super(...) como primera instrucción del constructor.'],
  },
  'input-in-callback': {
    causes: ['prompt()/confirm() se llamó desde una función ejecutada internamente por JavaScript (getter, toString, Array.from...).'],
    solutions: ['Lee los datos fuera de esa función y pásalos como parámetros.'],
  },
  unsupported: {
    causes: ['El intérprete educativo no implementa esta característica.'],
    solutions: ['Reescribe el código usando las estructuras soportadas (ver Ayuda).'],
  },
  uncaught: {
    causes: ['Se lanzó un error con throw y ningún try...catch lo atrapó.'],
    solutions: ['Envuelve el código en try { ... } catch (e) { ... } si quieres manejar el error.'],
  },
  native: {
    causes: ['Una función predefinida recibió argumentos inválidos.'],
    solutions: ['Revisa los argumentos y consulta la ayuda de la función.'],
  },
  syntax: {
    causes: ['Falta o sobra un símbolo como ), }, ], ; o comillas.', 'Una palabra reservada se usó incorrectamente.'],
    solutions: ['Revisa la línea indicada y la anterior.', 'Verifica que cada { tenga su }.'],
  },
  'step-limit': {
    causes: ['El programa ejecutó demasiados pasos: probablemente un ciclo infinito.'],
    solutions: ['Revisa que la condición del ciclo llegue a ser falsa (que la variable de control cambie).'],
  },
};

export function hintFor(code: ErrorCode | undefined): ErrorHint | undefined {
  return code ? HINTS[code] : undefined;
}

/** Traduce mensajes de errores nativos del motor JS (V8/Hermes/JSC) al español. */
export function translateNativeMessage(msg: string): { message: string; code: ErrorCode } {
  let m: RegExpMatchArray | null;
  if ((m = msg.match(/Cannot read propert(?:y|ies) (?:of )?(?:'([^']*)' )?of (undefined|null)/i)) ||
      (m = msg.match(/(undefined|null) is not an object \(evaluating '(.*)'\)/i))) {
    return { message: `No se puede leer una propiedad de ${m[2] && m[2] !== 'undefined' && m[2] !== 'null' ? 'un valor vacío' : m[2] || m[1]}`, code: 'read-prop-nullish' };
  }
  if ((m = msg.match(/Cannot set propert(?:y|ies) (?:of )?(?:'([^']*)' )?of (undefined|null)/i)))
    return { message: `No se puede asignar la propiedad '${m[1] ?? '?'}' de ${m[2]}`, code: 'set-prop-nullish' };
  if ((m = msg.match(/^(.*) is not a function/))) return { message: `${m[1]} no es una función`, code: 'not-function' };
  if ((m = msg.match(/^(.*) is not a constructor/))) return { message: `${m[1]} no es un constructor`, code: 'not-constructor' };
  if ((m = msg.match(/^(.*) is not iterable/))) return { message: `${m[1]} no es iterable`, code: 'not-iterable' };
  if (/Maximum call stack|stack overflow|too much recursion/i.test(msg))
    return { message: 'Desbordamiento de pila: demasiadas llamadas anidadas', code: 'stack-overflow' };
  if (/Invalid array length/i.test(msg)) return { message: 'Longitud de arreglo inválida', code: 'native' };
  if (/JSON/i.test(msg) || /Unexpected token .* in JSON/i.test(msg)) return { message: `JSON inválido: ${msg}`, code: 'native' };
  if (/toFixed|toPrecision|radix|digits argument/i.test(msg)) return { message: `Argumento fuera de rango: ${msg}`, code: 'native' };
  if (/Cannot convert/i.test(msg)) return { message: `No se puede convertir el valor: ${msg}`, code: 'native' };
  if (/Cannot mix BigInt/i.test(msg)) return { message: 'No se pueden mezclar BigInt con otros tipos en operaciones', code: 'type-mismatch' };
  if (/Invalid regular expression/i.test(msg)) return { message: `Expresión regular inválida: ${msg}`, code: 'native' };
  return { message: msg, code: 'native' };
}

const SYNTAX_PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Unexpected token$/, () => 'Símbolo inesperado. Revisa paréntesis, llaves, comas o punto y coma.'],
  [/^Unexpected character '(.*)'$/, (m) => `Carácter inesperado '${m[1]}'`],
  [/^Unterminated string constant$/, () => 'Texto sin cerrar: falta la comilla de cierre'],
  [/^Unterminated template$/, () => 'Plantilla de texto sin cerrar: falta la comilla invertida `'],
  [/^Unterminated comment$/, () => 'Comentario sin cerrar: falta */'],
  [/^Unterminated regular expression$/, () => 'Expresión regular sin cerrar'],
  [/^Identifier '(.*)' has already been declared$/, (m) => `El identificador '${m[1]}' ya fue declarado en este bloque`],
  [/^'return' outside of function$/, () => "'return' solo puede usarse dentro de una función"],
  [/^Unsyntactic break$/, () => "'break' solo puede usarse dentro de un ciclo o switch"],
  [/^Unsyntactic continue$/, () => "'continue' solo puede usarse dentro de un ciclo"],
  [/^Assigning to rvalue$/, () => 'No se puede asignar a esta expresión (el lado izquierdo debe ser una variable)'],
  [/^Invalid left-hand side in (.*)$/, () => 'Lado izquierdo inválido en la asignación'],
  [/^The keyword '(.*)' is reserved$/, (m) => `'${m[1]}' es una palabra reservada y no puede usarse como nombre`],
  [/^Unexpected keyword '(.*)'$/, (m) => `Palabra reservada inesperada '${m[1]}'`],
  [/^Missing initializer in const declaration$/, () => 'Las constantes (const) deben inicializarse: const x = valor;'],
  [/^Complex binding patterns require an initialization value$/, () => 'La desestructuración requiere un valor inicial'],
  [/^Expecting Unicode escape sequence/, () => 'Secuencia de escape inválida'],
  [/^Invalid number$/, () => 'Número inválido'],
  [/^Identifier directly after number$/, () => 'Un nombre no puede ir pegado a un número'],
  [/^Deleting local variable in strict mode$/, () => 'No se puede borrar una variable'],
  [/^Shorthand property assignments are valid only in destructuring patterns$/, () => 'Asignación abreviada inválida en objeto'],
  [/^Unexpected string$/, () => 'Texto inesperado. ¿Falta una coma o un operador +?'],
  [/^Unexpected (.*)$/, (m) => `Elemento inesperado: ${m[1]}`],
];

/** Traduce un error de sintaxis de acorn al español. */
export function translateSyntaxError(raw: string): string {
  const msg = raw.replace(/\s*\(\d+:\d+\)\s*$/, '');
  for (const [re, fn] of SYNTAX_PATTERNS) {
    const m = msg.match(re);
    if (m) return fn(m);
  }
  return msg;
}
