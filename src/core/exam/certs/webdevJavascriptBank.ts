/**
 * Banco de preguntas del curso «Learn JavaScript» de web.dev
 * (https://web.dev/learn/javascript?hl=es-419), en español.
 *
 * Una entrada por lección del curso, en el mismo orden, con la definición clave
 * de la lección y preguntas sobre sus conceptos y sus ejemplos de código, en el
 * estilo de las autoevaluaciones «Comprueba tu comprensión» del curso (algunas,
 * como las de Números, Cadenas, Objetos, Clases o Colecciones indexadas, siguen
 * esas autoevaluaciones). Los ejemplos de código son preguntas «¿Qué muestra?»
 * que se califican ejecutando el programa.
 *
 * tests/webdev_certification.test.ts comprueba cada respuesta: las preguntas con
 * `run` evalúan su código en Node y comparan el valor con la opción correcta, y
 * cada programa de las preguntas «¿Qué muestra?» da la misma salida en Node y en
 * el intérprete de PSJavaScript.
 *
 * Contenido basado en web.dev (Google), licencia CC BY 4.0; ejemplos de código
 * bajo licencia Apache 2.0.
 */

/** Opción única. Con `run`, la opción correcta es el valor de la última expresión de `code`. */
export interface WebdevSingle {
  kind?: 'single';
  q: string;
  code?: string;
  a: string;
  d: string[];
  run?: true;
}
export interface WebdevMultiple {
  kind: 'multiple';
  q: string;
  code?: string;
  a: string[];
  d: string[];
}
export interface WebdevTrueFalse {
  kind: 'truefalse';
  q: string;
  code?: string;
  answer: boolean;
}
/** «¿Qué muestra?»: la respuesta es la salida del programa. */
export interface WebdevOutput {
  kind: 'output';
  code: string;
}
export type WebdevItem = WebdevSingle | WebdevMultiple | WebdevTrueFalse | WebdevOutput;

export interface WebdevLesson {
  /** Ruta de la lección dentro de https://web.dev/learn/javascript/ (vacía si no se pudo confirmar). */
  path: string;
  /** Módulo del curso al que pertenece la lección. */
  module: string;
  /** Tema (nombre de la lección en español). */
  topic: string;
  /** Definición clave de la lección. */
  summary: string;
  items: WebdevItem[];
}

const tf = (q: string, answer: boolean, code?: string): WebdevTrueFalse => ({ kind: 'truefalse', q, answer, ...(code ? { code } : {}) });
const out = (code: string): WebdevOutput => ({ kind: 'output', code });
const multi = (q: string, a: string[], d: string[], code?: string): WebdevMultiple => ({ kind: 'multiple', q, a, d, ...(code ? { code } : {}) });
/** Pregunta cuya respuesta es el valor de la última expresión de `code`. */
const val = (q: string, code: string, a: string, d: string[]): WebdevSingle => ({ q, code, a, d, run: true });
const RESULT = '¿Cuál es el resultado de esta expresión?';
const VALUE = '¿Qué valor tiene la última línea?';

export const WEBDEV_JAVASCRIPT_LESSONS: WebdevLesson[] = [
  // ═══════════════ Introducción ═══════════════
  {
    path: 'introduction',
    module: 'Introducción',
    topic: 'Introducción a JavaScript',
    summary:
      'JavaScript es un lenguaje de programación de tipado dinámico que agrega interactividad a las páginas web y también se ejecuta fuera del navegador. Su estándar se llama ECMAScript y lo mantiene el comité TC39 de Ecma International. El modo estricto ("use strict") convierte algunos errores silenciosos en errores que se lanzan.',
    items: [
      { q: '¿Qué organización mantiene el estándar en el que se basa JavaScript?', a: 'Ecma International, a través de su comité TC39.', d: ['El W3C (World Wide Web Consortium).', 'Mozilla Foundation.', 'Google, a través del equipo de Chrome.'] },
      { q: '¿Cómo se llama el estándar del lenguaje JavaScript?', a: 'ECMAScript', d: ['JScript', 'TypeScript', 'WebAssembly'] },
      tf('JavaScript es un lenguaje de tipado dinámico: una misma variable puede guardar un número y después una cadena.', true),
      {
        q: '¿Qué hace la directiva `"use strict"` al inicio de un script?',
        a: 'Activa el modo estricto, que convierte algunos errores silenciosos en errores que se lanzan.',
        d: ['Obliga a declarar el tipo de cada variable.', 'Hace que el código siempre se ejecute más rápido.', 'Desactiva las funciones flecha y las clases.'],
      },
      { q: '¿Qué elemento HTML se usa para incluir JavaScript en una página?', a: '`<script>`', d: ['`<js>`', '`<javascript>`', '`<code>`'] },
      multi(
        '¿Qué afirmaciones sobre la sintaxis de JavaScript son ciertas?',
        ['Distingue mayúsculas y minúsculas: `miVar` y `mivar` son variables distintas.', 'Las instrucciones pueden terminar con punto y coma `;`.', 'Los comentarios de una línea empiezan con `//`.'],
        ['Los bloques se delimitan con la sangría, como en Python.', 'Los comentarios de una línea empiezan con `#`.'],
      ),
      tf('En modo estricto, asignar un valor a una variable que nunca se declaró lanza un `ReferenceError`.', true),
      {
        q: '¿Qué es la inserción automática de punto y coma (ASI)?',
        a: 'El intérprete agrega `;` donde falta, siguiendo ciertas reglas.',
        d: ['Un error que impide ejecutar el código si falta un `;`.', 'Una extensión del editor que escribe los `;` por ti.', 'Una regla que prohíbe usar `;` en JavaScript moderno.'],
      },
      out('const lenguaje = "JavaScript";\nlet version = 2015;\nversion = version + 10;\nconsole.log(lenguaje, version);\nconsole.log(typeof lenguaje, typeof version);\n'),
    ],
  },

  // ═══════════════ Tipos de datos y estructuras ═══════════════
  {
    path: 'data-types',
    module: 'Tipos de datos y estructuras',
    topic: 'Tipos de datos y estructuras',
    summary:
      'JavaScript tiene siete tipos primitivos (Number, String, Boolean, null, undefined, BigInt y Symbol); todo lo demás es un objeto, incluidos los arreglos y las funciones. Los primitivos son inmutables y se copian por valor; los objetos se comparan y se copian por referencia. Para usar métodos en un primitivo, JavaScript lo envuelve en un objeto temporal (String, Number…).',
    items: [
      { q: '¿Cuántos tipos de datos primitivos tiene JavaScript?', a: 'Siete', d: ['Cinco', 'Seis', 'Ocho'] },
      multi('¿Cuáles de estos son tipos primitivos?', ['`string`', '`bigint`', '`symbol`', '`undefined`'], ['`Array`', '`Object`', '`Function`']),
      val(RESULT, 'typeof null', '`"object"`', ['`"null"`', '`"undefined"`', '`"primitive"`']),
      val(RESULT, 'typeof function () {}', '`"function"`', ['`"object"`', '`"undefined"`', '`"method"`']),
      val(RESULT, 'typeof []', '`"object"`', ['`"array"`', '`"list"`', '`"undefined"`']),
      tf('Los valores primitivos son inmutables: `"hola".toUpperCase()` devuelve una cadena nueva y no cambia la original.', true),
      out('let a = "hola";\nlet b = a;\nb = "adiós";\nconsole.log(a);\nconst x = { n: 1 };\nconst y = x;\ny.n = 2;\nconsole.log(x.n);\n'),
      {
        q: '¿Por qué un primitivo como `"texto"` puede usar métodos como `.length` o `.toUpperCase()`?',
        a: 'JavaScript lo envuelve temporalmente en un objeto (`String`) que tiene esos métodos y propiedades.',
        d: ['Porque en JavaScript las cadenas no son primitivos, son objetos.', 'Porque `.length` es una variable global.', 'No puede: hay que crear la cadena con `new String()`.'],
      },
      val(RESULT, '"texto".length', '`5`', ['`4`', '`6`', '`undefined`']),
    ],
  },
  {
    path: 'data-types/number',
    module: 'Tipos de datos y estructuras',
    topic: 'Números',
    summary:
      'Number representa números de punto flotante de doble precisión (IEEE 754): enteros y decimales usan el mismo tipo, por eso 0.1 + 0.2 no es exactamente 0.3. Incluye los valores especiales NaN («no es un número») e Infinity. Number() convierte a número; parseInt() y parseFloat() leen números al inicio de una cadena.',
    items: [
      val('¿Cuál es el resultado de pasar `false` a `Number()`?', 'Number(false)', '`0`', ['`false`', '`NaN`', '`1`']),
      val('¿Cuál es el resultado de esta expresión?', '"Six" * 3', '`NaN`', ['`"SixSixSix"`', '`18`', '`Infinity`']),
      val(RESULT, 'typeof NaN', '`"number"`', ['`"NaN"`', '`"undefined"`', '`"object"`']),
      val(RESULT, '0.1 + 0.2 === 0.3', '`false`', ['`true`', '`NaN`', '`undefined`']),
      val(RESULT, 'Number("")', '`0`', ['`NaN`', '`undefined`', '`""`']),
      val(RESULT, 'parseInt("42px")', '`42`', ['`NaN`', '`"42"`', '`4`']),
      val(RESULT, '10 / 0', '`Infinity`', ['`NaN`', '`0`', 'Se lanza un error de división entre cero.']),
      tf('`NaN === NaN` da `true`.', false),
      multi('¿Cuáles de estas expresiones dan `true`?', ['`Number.isNaN(NaN)`', '`Number.isInteger(5.0)`', '`Number.isFinite(10)`'], ['`Number.isNaN("hola")`', '`Number.isInteger(5.5)`']),
      out('console.log(7 % 3);\nconsole.log(2 ** 3);\nconsole.log((3.14159).toFixed(2));\nconsole.log(Math.round(2.5));\nconsole.log(Number("12.5") + 1);\n'),
    ],
  },
  {
    path: 'data-types/string',
    module: 'Tipos de datos y estructuras',
    topic: 'Cadenas',
    summary:
      'Una cadena es una secuencia de caracteres entre comillas simples, dobles o invertidas. Las comillas invertidas crean plantillas literales, que insertan expresiones con ${} y pueden ocupar varias líneas; una plantilla etiquetada pasa sus partes a una función. La barra invertida \\ escapa caracteres y el operador + concatena. Las cadenas son inmutables y se indexan desde 0.',
    items: [
      { q: '¿Qué carácter se usa para escapar caracteres dentro de una cadena?', a: 'La barra invertida (`\\`).', d: ['La barra (`/`).', 'El signo de porcentaje (`%`).', 'El signo de pesos (`$`).'] },
      { q: '¿Qué operador concatena (une) cadenas?', a: '`+`', d: ['`&`', '`.`', '`*`'] },
      val(RESULT, '"Hola" + 1 + 2', '`"Hola12"`', ['`"Hola3"`', '`3`', '`NaN`']),
      val(RESULT, '1 + 2 + "Hola"', '`"3Hola"`', ['`"12Hola"`', '`"Hola3"`', '`NaN`']),
      {
        q: '¿Con qué comillas puedes insertar expresiones usando `${}`?',
        a: 'Con las comillas invertidas (plantillas literales).',
        d: ['Con las comillas dobles.', 'Con las comillas simples.', 'Con cualquier tipo de comillas.'],
      },
      val(VALUE, 'const nombre = "Ana";\n`Hola, ${nombre}!`', '`"Hola, Ana!"`', ['`"Hola, ${nombre}!"`', '`"Hola, nombre!"`', '`undefined`']),
      val(RESULT, '"JavaScript"[4]', '`"S"`', ['`"c"`', '`"a"`', '`undefined`']),
      val(RESULT, '"hola".at(-1)', '`"a"`', ['`"h"`', '`undefined`', '`"-1"`']),
      tf('Las cadenas son inmutables: `texto[0] = "X"` no cambia el contenido de `texto`.', true),
      out('function etiqueta(textos, ...valores) {\n  return textos.join("|") + " -> " + valores.join(",");\n}\nconsole.log(etiqueta`a${1}b${2}c`);\n'),
      out('const s = "Aprende JavaScript";\nconsole.log(s.length);\nconsole.log(s.toUpperCase());\nconsole.log(s.indexOf("Java"));\nconsole.log(s.slice(-6));\n'),
    ],
  },
  {
    path: 'data-types/boolean',
    module: 'Tipos de datos y estructuras',
    topic: 'Booleanos',
    summary:
      'Boolean tiene dos valores: true y false. Cualquier valor se puede convertir a booleano con Boolean() o con !!. Son falsy: false, 0, -0, 0n, "", null, undefined y NaN; todos los demás valores (incluidos "0", [] y {}) son truthy.',
    items: [
      multi('¿Cuáles de estos valores son falsy?', ['`0`', '`""`', '`null`', '`NaN`'], ['`"0"`', '`[]`', '`{}`']),
      val(RESULT, 'Boolean("false")', '`true`', ['`false`', '`"false"`', '`undefined`']),
      val(RESULT, '!!"0"', '`true`', ['`false`', '`0`', '`"0"`']),
      val(RESULT, 'Boolean([])', '`true`', ['`false`', '`undefined`', '`0`']),
      tf('`new Boolean(false)` crea un objeto, así que en un `if` se comporta como verdadero.', true),
      { q: '¿Qué hace el operador `!` con un valor?', a: 'Lo convierte a booleano y lo invierte.', d: ['Lo convierte a número.', 'Lanza un error si el valor no es booleano.', 'Devuelve el mismo valor sin cambios.'] },
      out('const valores = [0, "texto", "", 42, null];\nfor (const v of valores) {\n  console.log(v ? "truthy" : "falsy");\n}\n'),
    ],
  },
  {
    path: '',
    module: 'Tipos de datos y estructuras',
    topic: 'null y undefined',
    summary:
      'undefined indica que no se ha asignado un valor: lo tienen las variables sin inicializar, los parámetros que faltan, las propiedades que no existen y lo que devuelve una función sin return. null indica la ausencia intencional de un valor. null == undefined es true, pero null === undefined es false. El operador ?? y el encadenamiento opcional ?. ayudan a trabajar con ellos.',
    items: [
      val(RESULT, 'null == undefined', '`true`', ['`false`', '`null`', '`undefined`']),
      val(RESULT, 'null === undefined', '`false`', ['`true`', '`null`', '`undefined`']),
      { q: '¿Qué valor tiene una variable declarada con `let` a la que no se le asignó nada?', a: '`undefined`', d: ['`null`', '`0`', 'Se lanza un error.'] },
      {
        q: '¿Qué describe mejor a `null`?',
        a: 'La ausencia intencional de un valor, asignada por quien escribe el código.',
        d: ['El valor de una variable que nunca se inicializó.', 'Un número igual a cero.', 'Una cadena vacía.'],
      },
      val(RESULT, 'null ?? "predeterminado"', '`"predeterminado"`', ['`null`', '`undefined`', '`""`']),
      val(RESULT, '0 ?? 5', '`0`', ['`5`', '`null`', '`undefined`']),
      val(VALUE, 'const usuario = {};\nusuario.direccion?.calle', '`undefined`', ['`null`', 'Se lanza un `TypeError`.', '`""`']),
      tf('Una función que no tiene `return` devuelve `null`.', false),
      out('function saludar(nombre) {\n  console.log(nombre);\n}\nsaludar();\nconst obj = { a: null };\nconsole.log(obj.a, obj.b);\n'),
    ],
  },
  {
    path: '',
    module: 'Tipos de datos y estructuras',
    topic: 'BigInt',
    summary:
      'BigInt representa enteros de cualquier tamaño, más allá de Number.MAX_SAFE_INTEGER. Se crea agregando n al final de un entero (10n) o con BigInt(). No se puede mezclar con Number en operaciones aritméticas (TypeError) y la división descarta los decimales.',
    items: [
      val(RESULT, 'typeof 10n', '`"bigint"`', ['`"number"`', '`"object"`', '`"integer"`']),
      { q: '¿Qué pasa al evaluar `5n + 1`?', a: 'Se lanza un `TypeError`: no se pueden mezclar BigInt y Number.', d: ['`6n`', '`6`', '`"5n1"`'] },
      val(RESULT, '7n / 2n', '`3n`', ['`3.5n`', '`3.5`', '`4n`']),
      val(RESULT, '10n === 10', '`false`', ['`true`', '`10n`', 'Se lanza un `TypeError`.']),
      val(RESULT, '10n == 10', '`true`', ['`false`', '`10n`', 'Se lanza un `TypeError`.']),
      {
        q: '¿Para qué sirve BigInt?',
        a: 'Para representar enteros más grandes que `Number.MAX_SAFE_INTEGER` sin perder precisión.',
        d: ['Para guardar decimales con más precisión que Number.', 'Para guardar cadenas muy largas.', 'Para que los cálculos con números sean más rápidos.'],
      },
      tf('Se puede crear un BigInt con la función `BigInt()`, por ejemplo `BigInt(42)`.', true),
      out('const grande = 2n ** 64n;\nconsole.log(String(grande));\nconsole.log(typeof grande);\nconsole.log(Number.MAX_SAFE_INTEGER + 2);\n'),
    ],
  },
  {
    path: '',
    module: 'Tipos de datos y estructuras',
    topic: 'Symbol',
    summary:
      'Symbol crea valores primitivos únicos: dos símbolos con la misma descripción son distintos. Se usan como claves de propiedad que no chocan con otras y que Object.keys, for...in y JSON.stringify ignoran. Symbol.for() usa un registro global, y los símbolos conocidos (como Symbol.iterator) definen comportamientos del lenguaje.',
    items: [
      val(RESULT, 'Symbol("id") === Symbol("id")', '`false`', ['`true`', '`"id"`', 'Se lanza un error.']),
      val(RESULT, 'typeof Symbol()', '`"symbol"`', ['`"object"`', '`"string"`', '`"function"`']),
      val(RESULT, 'Symbol.for("app") === Symbol.for("app")', '`true`', ['`false`', '`"app"`', '`undefined`']),
      {
        q: '¿Para qué se usan comúnmente los símbolos?',
        a: 'Como claves de propiedad únicas que no chocan con otras claves del objeto.',
        d: ['Para guardar texto con caracteres especiales.', 'Para representar números enteros grandes.', 'Para declarar constantes globales.'],
      },
      val(VALUE, 'const id = Symbol("id");\nconst obj = { [id]: 1, nombre: "A" };\nObject.keys(obj).length', '`1`', ['`2`', '`0`', '`undefined`']),
      tf('`new Symbol()` crea un símbolo nuevo.', false),
      val(RESULT, 'Symbol("clave").description', '`"clave"`', ['`"Symbol(clave)"`', '`undefined`', '`"symbol"`']),
      { q: '¿Qué símbolo conocido define cómo se recorre un objeto con `for...of`?', a: '`Symbol.iterator`', d: ['`Symbol.for`', '`Symbol.loop`', '`Symbol.forEach`'] },
    ],
  },
  {
    path: '',
    module: 'Tipos de datos y estructuras',
    topic: 'Variables',
    summary:
      'Las variables se declaran con let, const o var. const no se puede reasignar (aunque el objeto que guarda sí puede cambiar); let y const tienen alcance de bloque, y var, de función. Las declaraciones se elevan (hoisting): var vale undefined antes de su línea, mientras que let y const están en la zona muerta temporal y lanzan ReferenceError. Los identificadores pueden tener letras, $, _ y dígitos (no al inicio) y no pueden ser palabras reservadas.',
    items: [
      { q: '¿Cuál de estos es un identificador válido?', a: '`$precio_total`', d: ['`2precio`', '`precio-total`', '`class`'] },
      multi(
        '¿Qué afirmaciones sobre `const` son ciertas?',
        ['No se puede reasignar.', 'Hay que darle un valor al declararla.', 'Si guarda un objeto, sus propiedades sí se pueden modificar.'],
        ['Hace que el objeto que guarda sea inmutable.', 'Tiene alcance de función, como `var`.'],
      ),
      { q: '¿Qué alcance tiene una variable declarada con `var` dentro de una función?', a: 'Toda la función, aunque esté dentro de un bloque `{ }`.', d: ['Solo el bloque `{ }` donde se declara.', 'Siempre es global.', 'Solo la línea donde se declara.'] },
      out('var a = 1;\nif (true) {\n  var a = 2;\n  let b = 3;\n}\nconsole.log(a);\nconsole.log(typeof b);\n'),
      out('console.log(x);\nvar x = 5;\nconsole.log(x);\n'),
      { q: '¿Qué pasa al ejecutar este código?', code: 'console.log(y);\nlet y = 1;', a: 'Se lanza un `ReferenceError`: `y` está en la zona muerta temporal.', d: ['Muestra `undefined`.', 'Muestra `1`.', 'Muestra `null`.'] },
      tf('Con `let` se puede volver a declarar la misma variable en el mismo bloque.', false),
      out('const fns = [];\nfor (let i = 0; i < 3; i++) {\n  fns.push(() => i);\n}\nconsole.log(fns.map((f) => f()).join(","));\n'),
    ],
  },

  // ═══════════════ Operadores de comparación ═══════════════
  {
    path: 'comparison',
    module: 'Operadores de comparación',
    topic: 'Operadores de comparación',
    summary:
      'Los operadores de comparación evalúan si una expresión es verdadera o falsa. == compara con conversión de tipos (igualdad flexible) y === sin conversión (igualdad estricta); igual con != y !==. Las cadenas se comparan carácter por carácter y los objetos por referencia. Los operadores lógicos &&, || y ?? hacen cortocircuito y devuelven uno de sus operandos.',
    items: [
      val(RESULT, '2 == "2"', '`true`', ['`false`', 'Se lanza un `TypeError`.', '`undefined`']),
      val(RESULT, '2 === "2"', '`false`', ['`true`', 'Se lanza un `TypeError`.', '`undefined`']),
      {
        q: '¿Cuál es la diferencia entre `==` y `===`?',
        a: '`===` compara valor y tipo sin convertir; `==` convierte los tipos antes de comparar.',
        d: ['`==` compara valor y tipo; `===` convierte los tipos antes de comparar.', 'No hay diferencia: son sinónimos.', '`===` solo sirve para comparar cadenas.'],
      },
      val(RESULT, '"10" < "9"', '`true`', ['`false`', '`NaN`', 'Se lanza un error.']),
      val(RESULT, '[1] === [1]', '`false`', ['`true`', '`[1]`', '`undefined`']),
      val(RESULT, '"" || "valor"', '`"valor"`', ['`""`', '`true`', '`false`']),
      val(RESULT, '0 && "nunca"', '`0`', ['`"nunca"`', '`false`', '`true`']),
      multi('¿Cuáles de estas comparaciones dan `true`?', ['`null == undefined`', '`"5" == 5`', '`"abc" < "abd"`'], ['`NaN == NaN`', '`null === undefined`', '`{} === {}`']),
      out('const a = { x: 1 };\nconst b = a;\nconst c = { x: 1 };\nconsole.log(a === b);\nconsole.log(a === c);\nconsole.log(a.x === c.x);\n'),
    ],
  },

  // ═══════════════ Flujo de control ═══════════════
  {
    path: 'control-flow',
    module: 'Flujo de control',
    topic: 'Flujo de control',
    summary:
      'El flujo de control es el orden en que el intérprete ejecuta las instrucciones. Las condicionales (if...else, switch y el operador ternario) eligen qué ejecutar; los ciclos (while, do...while, for, for...in y for...of) repiten. break sale del ciclo o del switch, continue salta a la siguiente iteración y las etiquetas permiten aplicarlos a un ciclo externo.',
    items: [
      out('const fruta = "pera";\nswitch (fruta) {\n  case "manzana":\n    console.log("roja");\n  case "pera":\n    console.log("verde");\n  case "uva":\n    console.log("morada");\n    break;\n  default:\n    console.log("desconocida");\n}\n'),
      {
        q: '¿Qué diferencia hay entre `while` y `do...while`?',
        a: '`do...while` ejecuta su bloque al menos una vez antes de evaluar la condición.',
        d: ['`while` siempre se ejecuta al menos una vez.', '`do...while` no puede usar `break`.', 'No hay diferencia.'],
      },
      { q: '¿Qué recorre `for...in` en un objeto?', a: 'Las claves de sus propiedades enumerables.', d: ['Los valores de sus propiedades.', 'Solo los índices numéricos.', 'Solo sus métodos.'] },
      { q: '¿Qué recorre `for...of`?', a: 'Los valores de un iterable, como un arreglo, una cadena o un `Map`.', d: ['Las claves de un objeto común.', 'Solo rangos de números.', 'Las propiedades heredadas de un objeto.'] },
      out('externo: for (let i = 0; i < 3; i++) {\n  for (let j = 0; j < 3; j++) {\n    if (j === 1) continue externo;\n    if (i === 2) break externo;\n    console.log(i, j);\n  }\n}\n'),
      val(VALUE, 'const edad = 20;\nedad >= 18 ? "adulto" : "menor"', '`"adulto"`', ['`"menor"`', '`true`', '`20`']),
      tf('En un `switch`, si un `case` no termina con `break`, también se ejecutan los `case` siguientes.', true),
      out('let n = 10;\nlet pasos = 0;\nwhile (n > 1) {\n  n = n % 2 === 0 ? n / 2 : 3 * n + 1;\n  pasos++;\n}\nconsole.log(pasos);\n'),
      multi('¿Qué palabras clave sirven para salir de un ciclo o saltar una iteración?', ['`break`', '`continue`'], ['`skip`', '`exit`', '`stop`']),
    ],
  },

  // ═══════════════ Funciones ═══════════════
  {
    path: 'functions',
    module: 'Funciones',
    topic: 'Funciones',
    summary:
      'Una función es un bloque de código reutilizable que se ejecuta al llamarla. Se declara con function nombre(parámetros) { }; los valores que recibe al llamarla son los argumentos. Los parámetros pueden tener valores predeterminados y un parámetro rest (...resto) reúne los argumentos sobrantes. Las declaraciones de función se elevan completas, y las funciones son objetos: se guardan en variables y se pasan como argumentos.',
    items: [
      { q: 'En `function sumar(a, b) { }`, ¿qué son `a` y `b`?', a: 'Parámetros', d: ['Argumentos', 'Variables globales', 'Propiedades de `sumar`'] },
      out('function saludar(nombre = "invitado", saludo = "Hola") {\n  return `${saludo}, ${nombre}`;\n}\nconsole.log(saludar());\nconsole.log(saludar("Ana"));\nconsole.log(saludar(undefined, "Buenas"));\n'),
      out('function contar(primero, ...resto) {\n  return resto.length;\n}\nconsole.log(contar(1, 2, 3, 4));\nconsole.log(contar(1));\n'),
      out('console.log(doble(4));\nfunction doble(n) {\n  return n * 2;\n}\n'),
      tf('Las funciones de JavaScript son objetos: se pueden guardar en variables y pasar como argumentos a otras funciones.', true),
      val(VALUE, 'function f(a, b) {\n  return arguments.length;\n}\nf(1, 2, 3)', '`3`', ['`2`', '`1`', '`undefined`']),
      { q: '¿Qué pasa si llamas a una función con menos argumentos que parámetros?', a: 'Los parámetros que faltan valen `undefined`.', d: ['Se lanza un error.', 'Los parámetros que faltan valen `null`.', 'Los parámetros que faltan valen `0`.'] },
      val(VALUE, 'function f(a, b) {}\nf.length', '`2`', ['`0`', '`undefined`', '`1`']),
    ],
  },
  {
    path: 'functions/function-expressions',
    module: 'Funciones',
    topic: 'Expresiones de función',
    summary:
      'Una expresión de función crea una función como parte de una expresión, por ejemplo al asignarla a una variable; no se eleva como una declaración. Las funciones flecha (=>) son una forma corta: con una sola expresión devuelven su valor sin return, y no tienen this ni arguments propios ni se pueden usar con new. Una IIFE es una expresión de función que se ejecuta inmediatamente.',
    items: [
      {
        q: '¿Qué pasa al ejecutar este código?',
        code: 'console.log(cuadrado(3));\nconst cuadrado = function (n) {\n  return n * n;\n};',
        a: 'Se lanza un `ReferenceError`: `cuadrado` todavía no está inicializada.',
        d: ['Muestra `9`.', 'Muestra `undefined`.', 'Muestra `NaN`.'],
      },
      val(VALUE, 'const triple = (n) => n * 3;\ntriple(4)', '`12`', ['`undefined`', '`"n * 3"`', '`7`']),
      val('Una función flecha con cuerpo de bloque necesita `return` explícito. ¿Qué valor tiene la última línea?', 'const f = (x) => { x * 2; };\nf(5)', '`undefined`', ['`10`', '`5`', 'Se lanza un error.']),
      { q: '¿Qué es una IIFE?', a: 'Una expresión de función que se ejecuta inmediatamente después de definirse.', d: ['Una función que solo se puede llamar una vez.', 'Una función sin parámetros.', 'Una función que se ejecuta al cargar la página con un evento.'] },
      out('const contador = (function () {\n  let cuenta = 0;\n  return () => ++cuenta;\n})();\ncontador();\ncontador();\nconsole.log(contador());\n'),
      tf('Las funciones flecha se pueden usar como constructores con `new`.', false),
      { q: '¿Cuál es una forma válida de devolver un objeto literal desde una función flecha de una sola expresión?', a: '`() => ({ a: 1 })`', d: ['`() => { a: 1 }`', '`() => return { a: 1 }`', '`() => [a: 1]`'] },
      multi(
        '¿Qué es cierto sobre las funciones flecha?',
        ['No tienen su propio `this`: usan el del contexto donde se definen.', 'No tienen su propio objeto `arguments`.'],
        ['Se elevan (hoisting) como las declaraciones de función.', 'Siempre necesitan llaves y `return`.'],
      ),
    ],
  },
  {
    path: '',
    module: 'Funciones',
    topic: 'La palabra clave new',
    summary:
      'Llamar a una función con new la usa como constructor: crea un objeto nuevo, lo enlaza al prototype de la función, ejecuta la función con this apuntando a ese objeto y lo devuelve (a menos que la función devuelva otro objeto). Por convención los constructores empiezan con mayúscula; las clases solo se pueden llamar con new, y new.target indica si se usó.',
    items: [
      {
        q: '¿Qué hace `new` al llamar a una función constructora?',
        a: 'Crea un objeto nuevo, lo enlaza al `prototype` de la función, ejecuta la función con `this` apuntando a él y lo devuelve.',
        d: ['Copia la función para poder llamarla dos veces.', 'Ejecuta la función en un hilo nuevo.', 'Declara una variable global con el resultado.'],
      },
      out('function Mascota(nombre) {\n  this.nombre = nombre;\n}\nMascota.prototype.hablar = function () {\n  return this.nombre + " hace ruido";\n};\nconst m = new Mascota("Firulais");\nconsole.log(m.hablar());\nconsole.log(m instanceof Mascota);\n'),
      val(VALUE, 'function F() {\n  this.a = 1;\n  return { b: 2 };\n}\nnew F().a', '`undefined`', ['`1`', '`2`', '`null`']),
      val(VALUE, 'function F() {\n  this.a = 1;\n  return 5;\n}\nnew F().a', '`1`', ['`5`', '`undefined`', '`null`']),
      { q: '¿Qué pasa si llamas a una clase sin `new`, por ejemplo `MiClase()`?', a: 'Se lanza un `TypeError`.', d: ['Devuelve `undefined`.', 'Crea el objeto igual que con `new`.', 'Devuelve la clase sin cambios.'] },
      tf('Por convención, los nombres de las funciones constructoras empiezan con mayúscula.', true),
      out('function Quien() {\n  console.log(new.target === undefined ? "sin new" : "con new");\n}\nQuien();\nnew Quien();\n'),
      val(RESULT, 'typeof new String("hola")', '`"object"`', ['`"string"`', '`"String"`', '`"function"`']),
    ],
  },
  {
    path: 'functions/return',
    module: 'Funciones',
    topic: 'La palabra clave return',
    summary:
      'return termina la ejecución de la función y especifica el valor que devuelve; el código que sigue no se ejecuta. Una función sin return, o con return sin valor, devuelve undefined. Las funciones flecha de una sola expresión devuelven su valor de forma implícita. Por la inserción automática de punto y coma, un salto de línea justo después de return hace que devuelva undefined.',
    items: [
      out('function clasificar(n) {\n  if (n < 0) return "negativo";\n  if (n === 0) return "cero";\n  return "positivo";\n}\nconsole.log(clasificar(-3));\nconsole.log(clasificar(0));\nconsole.log(clasificar(8));\n'),
      val(VALUE, 'function f() {\n  return;\n}\nf()', '`undefined`', ['`null`', '`0`', '`""`']),
      val('Por la inserción automática de punto y coma, ¿qué valor tiene la última línea?', 'function f() {\n  return\n    42;\n}\nf()', '`undefined`', ['`42`', '`null`', 'Se lanza un `SyntaxError`.']),
      tf('Una función puede devolver otra función.', true),
      val(VALUE, 'const suma = (a, b) => a + b;\nsuma(2, 3)', '`5`', ['`undefined`', '`"23"`', '`"a + b"`']),
      { q: '¿Qué pasa con las instrucciones que están después de un `return` que se ejecuta?', a: 'No se ejecutan.', d: ['Se ejecutan al terminar la función.', 'Se lanza un error.', 'Se ejecutan solo si son `console.log`.'] },
      out('function multiplicador(factor) {\n  return (n) => n * factor;\n}\nconst doble = multiplicador(2);\nconsole.log(doble(21));\n'),
    ],
  },
  {
    path: 'functions/this',
    module: 'Funciones',
    topic: 'La palabra clave this',
    summary:
      'this es un valor que depende de cómo se llama la función: en un método es el objeto antes del punto; con new, el objeto nuevo; en una función suelta, undefined en modo estricto (o el objeto global si no lo es). Las funciones flecha toman el this del lugar donde se definen. call(), apply() y bind() permiten indicar el valor de this.',
    items: [
      out('const persona = {\n  nombre: "Lu",\n  saludar() {\n    return "Hola, soy " + this.nombre;\n  },\n};\nconsole.log(persona.saludar());\n'),
      { q: 'En modo estricto, ¿qué vale `this` dentro de una función llamada de forma suelta, como `f()`?', a: '`undefined`', d: ['El objeto global (`window`).', 'La propia función `f`.', '`null`'] },
      { q: '¿Qué valor de `this` usa una función flecha?', a: 'El `this` del contexto donde se definió (alcance léxico).', d: ['El objeto que la llama.', 'Siempre `undefined`.', 'Siempre el objeto global.'] },
      out('function presentar(saludo) {\n  return saludo + ", " + this.nombre;\n}\nconst ana = { nombre: "Ana" };\nconsole.log(presentar.call(ana, "Hola"));\nconsole.log(presentar.apply(ana, ["Buenas"]));\nconst ligada = presentar.bind(ana);\nconsole.log(ligada("Qué tal"));\n'),
      out('const temporizador = {\n  segundos: 3,\n  iniciar() {\n    return [1, 2].map(() => this.segundos);\n  },\n};\nconsole.log(temporizador.iniciar().join(","));\n'),
      multi('¿Qué métodos permiten indicar el valor de `this` al llamar a una función?', ['`call()`', '`apply()`', '`bind()`'], ['`this()`', '`with()`']),
      tf('Dentro de un constructor llamado con `new`, `this` es el objeto nuevo que se está creando.', true),
      { q: '¿Qué hace `bind()`?', a: 'Devuelve una función nueva con `this` fijado al valor indicado.', d: ['Llama a la función de inmediato con otro `this`.', 'Cambia el `this` de la función original para siempre.', 'Une dos funciones en una.'] },
    ],
  },

  // ═══════════════ Objetos ═══════════════
  {
    path: 'objects',
    module: 'Objetos',
    topic: 'Objetos',
    summary:
      'Un objeto es una colección de propiedades: pares clave-valor donde la clave es una cadena o un símbolo y el valor puede ser de cualquier tipo (una función guardada en una propiedad es un método). A diferencia de los primitivos, los objetos son mutables y se comparan por referencia. La sintaxis de propagación (...) hace copias superficiales y la desestructuración extrae propiedades a variables.',
    items: [
      multi('¿Con qué notaciones puedes asignar una propiedad a un objeto?', ['`obj.prop = 1`', '`obj["prop"] = 1`'], ['`obj->prop = 1`', '`obj::prop = 1`', '`obj(prop) = 1`']),
      { q: '¿Cuál lee correctamente la propiedad `nombre` del objeto `usuario`?', a: '`usuario.nombre`', d: ['`usuario->nombre`', '`usuario(nombre)`', '`usuario:nombre`'] },
      tf('Los objetos son mutables: aunque estén en una `const`, se les pueden agregar o cambiar propiedades.', true),
      out('const original = { a: 1, interno: { b: 2 } };\nconst copia = { ...original };\ncopia.a = 10;\ncopia.interno.b = 20;\nconsole.log(original.a);\nconsole.log(original.interno.b);\n'),
      out('const libro = { titulo: "Ficciones", autor: "Borges", anio: 1944 };\nconst { titulo, anio: publicado, editorial = "Sur" } = libro;\nconsole.log(titulo, publicado, editorial);\n'),
      val(RESULT, 'Object.keys({ a: 1, b: 2, c: 3 }).length', '`3`', ['`6`', '`1`', '`undefined`']),
      val(VALUE, 'const x = 5;\nconst o = { x };\no.x', '`5`', ['`undefined`', '`"x"`', 'Se lanza un `SyntaxError`.']),
      val(RESULT, 'Object.entries({ a: 1 })', '`[["a", 1]]`', ['`["a", 1]`', '`{ a: 1 }`', '`[1]`']),
    ],
  },
  {
    path: '',
    module: 'Objetos',
    topic: 'Accesores de propiedades',
    summary:
      'Las propiedades se leen y asignan con notación de punto (obj.clave) o de corchetes (obj["clave"]); los corchetes aceptan claves calculadas, en variables o que no son identificadores válidos. Leer una propiedad inexistente da undefined, y leer una propiedad de null o undefined lanza TypeError; el encadenamiento opcional ?. lo evita. get y set definen propiedades que ejecutan una función al leerlas o asignarlas.',
    items: [
      {
        q: '¿Cuándo es obligatorio usar la notación de corchetes?',
        a: 'Cuando la clave está en una variable o no es un identificador válido (por ejemplo, tiene espacios).',
        d: ['Nunca: siempre se puede usar el punto.', 'Solo cuando el valor de la propiedad es un número.', 'Cuando el objeto se declaró con `const`.'],
      },
      val(VALUE, 'const clave = "color";\nconst auto = { color: "rojo" };\nauto[clave]', '`"rojo"`', ['`undefined`', '`"color"`', 'Se lanza un `ReferenceError`.']),
      val(VALUE, 'const o = { "mi clave": 1 };\no["mi clave"]', '`1`', ['`undefined`', '`"mi clave"`', 'Se lanza un `SyntaxError`.']),
      val(VALUE, 'const o = {};\no.a?.b', '`undefined`', ['`null`', 'Se lanza un `TypeError`.', '`{}`']),
      out('const termometro = {\n  _celsius: 20,\n  get fahrenheit() {\n    return this._celsius * 9 / 5 + 32;\n  },\n  set fahrenheit(f) {\n    this._celsius = (f - 32) * 5 / 9;\n  },\n};\nconsole.log(termometro.fahrenheit);\ntermometro.fahrenheit = 212;\nconsole.log(termometro._celsius);\n'),
      val(RESULT, '"toString" in {}', '`true`', ['`false`', '`undefined`', 'Se lanza un `TypeError`.']),
      val(RESULT, 'Object.hasOwn({}, "toString")', '`false`', ['`true`', '`undefined`', 'Se lanza un `TypeError`.']),
      { q: '¿Qué pasa al ejecutar este código?', code: 'const o = null;\nconsole.log(o.prop);', a: 'Se lanza un `TypeError`.', d: ['Muestra `undefined`.', 'Muestra `null`.', 'No muestra nada.'] },
      val(VALUE, 'const obj = {\n  metodo() {\n    return "hola";\n  },\n};\nobj.noExiste?.()', '`undefined`', ['`"hola"`', 'Se lanza un `TypeError`.', '`null`']),
    ],
  },
  {
    path: 'objects/property-descriptors',
    module: 'Objetos',
    topic: 'Descriptores de propiedades',
    summary:
      'Cada propiedad tiene atributos ocultos llamados descriptores. Un descriptor de datos tiene value y writable; uno de acceso, get y set; ambos tienen enumerable y configurable. Object.defineProperty() define una propiedad con su descriptor (lo que no indiques vale false) y Object.getOwnPropertyDescriptor() lo lee. Escribir en una propiedad de solo lectura no hace nada, salvo en modo estricto, donde lanza TypeError. Object.freeze() congela un objeto de forma superficial.',
    items: [
      {
        q: '¿Qué dos tipos de descriptores de propiedad existen?',
        a: 'De datos (`value`, `writable`) y de acceso (`get`, `set`).',
        d: ['Públicos y privados.', 'Estáticos y de instancia.', 'De lectura y de escritura.'],
      },
      multi('¿Qué atributos tienen tanto los descriptores de datos como los de acceso?', ['`enumerable`', '`configurable`'], ['`writable`', '`value`', '`get`']),
      {
        q: 'Con `Object.defineProperty()`, si no indicas `writable`, `enumerable` ni `configurable`, ¿qué valor toman?',
        a: '`false`',
        d: ['`true`', '`undefined`', 'El mismo valor que en las demás propiedades del objeto.'],
      },
      out('const obj = {};\nObject.defineProperty(obj, "id", { value: 7, enumerable: false });\nobj.id = 99;\nconsole.log(obj.id);\nconsole.log(Object.keys(obj).length);\nconsole.log(JSON.stringify(obj));\n'),
      val(VALUE, 'const o = { a: 1 };\nObject.getOwnPropertyDescriptor(o, "a").writable', '`true`', ['`false`', '`undefined`', '`1`']),
      tf('En modo estricto, asignar un valor a una propiedad con `writable: false` lanza un `TypeError`.', true),
      out('"use strict";\nconst config = Object.freeze({ modo: "oscuro" });\ntry {\n  config.modo = "claro";\n} catch (error) {\n  console.log(error.name);\n}\nconsole.log(config.modo);\n'),
      {
        q: '¿Qué hace `Object.freeze(obj)`?',
        a: 'Impide agregar, quitar o cambiar las propiedades del objeto (solo en el primer nivel).',
        d: ['Congela también todos los objetos anidados.', 'Crea una copia del objeto que no se puede modificar.', 'Impide leer las propiedades del objeto.'],
      },
      val(VALUE, 'const o = Object.freeze({ datos: [1] });\no.datos.push(2);\no.datos.length', '`2`', ['`1`', 'Se lanza un `TypeError`.', '`undefined`']),
    ],
  },
  {
    path: 'objects/prototypal-inheritance',
    module: 'Objetos',
    topic: 'Herencia de prototipos',
    summary:
      'Cada objeto tiene un prototipo, otro objeto del que hereda propiedades. Al leer una propiedad que el objeto no tiene, JavaScript la busca en su prototipo y sigue por la cadena de prototipos hasta llegar a null (después de Object.prototype). Object.create() crea un objeto con el prototipo indicado y Object.getPrototypeOf() lo lee; una propiedad propia con el mismo nombre oculta (sombrea) la heredada.',
    items: [
      {
        q: '¿Qué pasa cuando lees una propiedad que el objeto no tiene?',
        a: 'JavaScript la busca en su prototipo y sigue por la cadena de prototipos hasta encontrarla o llegar a `null`.',
        d: ['Devuelve `undefined` sin buscar en ningún otro lado.', 'Se lanza un `ReferenceError`.', 'Busca una variable global con ese nombre.'],
      },
      val(RESULT, 'Object.getPrototypeOf(Object.prototype)', '`null`', ['`undefined`', '`Object`', '`{}`']),
      out('const animal = {\n  respira: true,\n  sonido() {\n    return "...";\n  },\n};\nconst perro = Object.create(animal);\nperro.sonido = function () {\n  return "guau";\n};\nconsole.log(perro.respira);\nconsole.log(perro.sonido());\nconsole.log(Object.hasOwn(perro, "respira"));\nconsole.log(Object.getPrototypeOf(perro) === animal);\n'),
      val(RESULT, 'Object.getPrototypeOf([]) === Array.prototype', '`true`', ['`false`', '`undefined`', 'Se lanza un `TypeError`.']),
      { q: '¿Qué hace `Object.create(proto)`?', a: 'Crea un objeto nuevo cuyo prototipo es `proto`.', d: ['Hace una copia de todas las propiedades de `proto`.', 'Crea una clase llamada `proto`.', 'Cambia el prototipo de `proto` por `Object`.'] },
      tf('Si agregas una propiedad al prototipo, la ven todos los objetos que heredan de él (mientras no tengan una propia con ese nombre).', true),
      val(VALUE, 'const base = { x: 1 };\nconst hijo = Object.create(base);\nhijo.x = 2;\nbase.x', '`1`', ['`2`', '`undefined`', 'Se lanza un `TypeError`.']),
      { q: '¿Cuál es la forma recomendada de leer el prototipo de un objeto?', a: '`Object.getPrototypeOf(obj)`', d: ['`obj.prototype`', '`Object.prototypeOf(obj)`', '`obj.__proto__`, que es la forma estándar actual'] },
    ],
  },

  // ═══════════════ Colecciones ═══════════════
  {
    path: 'collections/indexed',
    module: 'Colecciones',
    topic: 'Colecciones indexadas',
    summary:
      'Un arreglo (Array) es una colección ordenada de valores indexada desde 0, con una propiedad length. Leer un índice que no existe da undefined y un arreglo puede tener huecos. Algunos métodos modifican el arreglo original (push, pop, shift, unshift, splice, sort, reverse) y otros devuelven uno nuevo (map, filter, slice, concat, toSorted). La desestructuración y la propagación (...) también funcionan con arreglos.',
    items: [
      val('Si `miArreglo` tiene tres elementos, ¿qué devuelve `miArreglo[1]`?', 'const miArreglo = ["a", "b", "c"];\nmiArreglo[1]', '`"b"`', ['`"a"`', '`"c"`', '`undefined`']),
      val('¿Qué devuelve leer un índice fuera de rango?', 'const miArreglo = ["a", "b", "c"];\nmiArreglo[3]', '`undefined`', ['`"c"`', '`null`', 'Se lanza un `RangeError`.']),
      val(VALUE, 'const a = [1, , 3];\na.length', '`3`', ['`2`', '`undefined`', 'Se lanza un `SyntaxError`.']),
      multi('¿Qué métodos modifican el arreglo original?', ['`push()`', '`splice()`', '`sort()`'], ['`map()`', '`slice()`', '`toSorted()`']),
      out('const numeros = [5, 1, 10];\nconst ordenados = numeros.toSorted((a, b) => a - b);\nconsole.log(ordenados.join(","));\nconsole.log(numeros.join(","));\nnumeros.sort();\nconsole.log(numeros.join(","));\n'),
      val(RESULT, 'Array(3).length', '`3`', ['`1`', '`0`', '`undefined`']),
      val(VALUE, 'const [primero, , tercero] = [10, 20, 30];\ntercero', '`30`', ['`20`', '`undefined`', 'Se lanza un `SyntaxError`.']),
      out('const letras = ["a", "b", "c", "d"];\nconst quitadas = letras.splice(1, 2, "x");\nconsole.log(quitadas.join(""));\nconsole.log(letras.join(""));\n'),
      tf('`Array.isArray([])` devuelve `true`, pero `typeof []` devuelve `"object"`.', true),
    ],
  },
  {
    path: '',
    module: 'Colecciones',
    topic: 'Colecciones con clave',
    summary:
      'Map guarda pares clave-valor cuyas claves pueden ser de cualquier tipo, conserva el orden de inserción y tiene size; Set guarda valores sin repetir. WeakMap y WeakSet solo aceptan objetos como claves, no impiden que el recolector de basura libere esos objetos y no se pueden recorrer.',
    items: [
      {
        q: '¿Qué ventaja tiene `Map` frente a un objeto común para guardar pares clave-valor?',
        a: 'Sus claves pueden ser de cualquier tipo, incluso objetos, y tiene la propiedad `size`.',
        d: ['Es la única forma de guardar cadenas como claves.', 'No se puede modificar después de crearlo.', 'Ordena las claves alfabéticamente.'],
      },
      val(RESULT, 'new Set([1, 2, 2, 3, 3]).size', '`3`', ['`5`', '`2`', '`undefined`']),
      out('const inventario = new Map();\ninventario.set("manzanas", 5);\ninventario.set("peras", 2);\ninventario.set("manzanas", 7);\nconsole.log(inventario.size);\nconsole.log(inventario.get("manzanas"));\nconsole.log(inventario.has("uvas"));\n'),
      val(RESULT, '[...new Set("banana")].join("")', '`"ban"`', ['`"banana"`', '`"bn"`', '`"aaa"`']),
      { q: '¿Qué claves acepta un `WeakMap`?', a: 'Objetos; no acepta primitivos como cadenas o números.', d: ['Cualquier tipo de valor.', 'Solo cadenas.', 'Solo números.'] },
      tf('Se puede recorrer un `WeakMap` con `for...of`.', false),
      out('const visitados = new Set();\nfor (const ciudad of ["Lima", "Quito", "Lima", "Bogotá"]) {\n  visitados.add(ciudad);\n}\nconsole.log([...visitados].join(", "));\nvisitados.delete("Quito");\nconsole.log(visitados.size);\n'),
      val(VALUE, 'const m = new Map([["a", 1], ["b", 2]]);\n[...m.keys()].join("")', '`"ab"`', ['`"12"`', '`"a1b2"`', '`""`']),
    ],
  },

  // ═══════════════ Clases ═══════════════
  {
    path: 'classes',
    module: 'Clases',
    topic: 'Clases',
    summary:
      'Una clase es una plantilla para crear objetos: class Nombre { constructor() { } metodos() { } }. Solo puede tener un constructor, sus métodos se guardan en el prototipo y sus instancias se crean con new. Las clases no se pueden usar antes de declararlas, su código siempre está en modo estricto y typeof de una clase es "function". También se pueden definir como expresiones (const A = class { }).',
    items: [
      {
        q: '¿Cuál de estos códigos define correctamente una clase?',
        a: '`class Perro { constructor(nombre) { this.nombre = nombre; } }`',
        d: ['`class Perro(nombre) { this.nombre = nombre; }`', '`function class Perro() { }`', '`class = Perro { }`'],
      },
      { q: '¿Cuántos métodos `constructor` puede tener una clase?', a: 'Uno como máximo.', d: ['Ninguno.', 'Dos: uno con parámetros y otro sin ellos.', 'Todos los que quieras.'] },
      val(VALUE, 'class A {}\ntypeof A', '`"function"`', ['`"class"`', '`"object"`', '`"undefined"`']),
      {
        q: '¿Qué pasa al ejecutar este código?',
        code: 'const p = new Punto();\nclass Punto {}',
        a: 'Se lanza un `ReferenceError`: la clase no se puede usar antes de declararla.',
        d: ['Funciona: las clases se elevan como las funciones.', '`p` vale `undefined`.', 'Se lanza un `SyntaxError`.'],
      },
      out('class Rectangulo {\n  constructor(ancho, alto) {\n    this.ancho = ancho;\n    this.alto = alto;\n  }\n  area() {\n    return this.ancho * this.alto;\n  }\n}\nconst r = new Rectangulo(3, 4);\nconsole.log(r.area());\nconsole.log(Object.hasOwn(r, "area"));\nconsole.log(typeof Rectangulo.prototype.area);\n'),
      tf('El código dentro de una clase siempre se ejecuta en modo estricto.', true),
      { q: '¿Qué es una expresión de clase?', a: 'Una clase definida como parte de una expresión, por ejemplo `const Gato = class { };`.', d: ['Una clase sin constructor.', 'Una clase que solo tiene métodos estáticos.', 'Una función que devuelve `this`.'] },
      val(VALUE, 'class A {\n  constructor() {\n    this.x = 1;\n  }\n}\nconst a = new A();\na.constructor === A', '`true`', ['`false`', '`undefined`', 'Se lanza un `TypeError`.']),
    ],
  },
  {
    path: 'classes/extends',
    module: 'Clases',
    topic: 'Extender clases',
    summary:
      'extends crea una subclase que hereda las propiedades y los métodos de la clase padre y puede sobrescribirlos. En el constructor de la subclase hay que llamar a super() antes de usar this; super.metodo() llama a la versión del padre. Si la subclase no define constructor, se usa uno que pasa todos los argumentos a super().',
    items: [
      multi(
        '¿Qué es cierto sobre las clases creadas con `extends`?',
        ['Heredan las propiedades y los métodos de la clase padre.', 'Pueden sobrescribir los métodos que heredan.'],
        ['No pueden tener su propio constructor.', 'Copian los métodos del padre en cada instancia.'],
      ),
      {
        q: '¿Qué pasa al ejecutar este código?',
        code: 'class A {}\nclass B extends A {\n  constructor() {\n    this.x = 1;\n    super();\n  }\n}\nnew B();',
        a: 'Se lanza un `ReferenceError`: se usa `this` antes de llamar a `super()`.',
        d: ['Crea el objeto con `x` igual a `1`.', 'Se lanza un `SyntaxError` al definir la clase.', 'Crea el objeto sin la propiedad `x`.'],
      },
      out('class Vehiculo {\n  constructor(ruedas) {\n    this.ruedas = ruedas;\n  }\n  describir() {\n    return `Tengo ${this.ruedas} ruedas`;\n  }\n}\nclass Moto extends Vehiculo {\n  constructor() {\n    super(2);\n  }\n  describir() {\n    return super.describir() + " y manubrio";\n  }\n}\nconst m = new Moto();\nconsole.log(m.describir());\nconsole.log(m instanceof Vehiculo);\n'),
      val(VALUE, 'class A {}\nclass B extends A {}\nObject.getPrototypeOf(B.prototype) === A.prototype', '`true`', ['`false`', '`undefined`', 'Se lanza un `TypeError`.']),
      { q: '¿Qué hace `super.metodo()` dentro de un método de la subclase?', a: 'Llama a la versión del método definida en la clase padre.', d: ['Llama al constructor de la clase padre.', 'Llama al mismo método de la subclase otra vez.', 'Elimina el método de la clase padre.'] },
      tf('Si una subclase no define `constructor`, se usa uno predeterminado que llama a `super()` con los mismos argumentos.', true),
      out('class Animal {\n  constructor(nombre) {\n    this.nombre = nombre;\n  }\n  hablar() {\n    return this.nombre + " hace un sonido";\n  }\n}\nclass Gato extends Animal {\n  hablar() {\n    return this.nombre + " maúlla";\n  }\n}\nconst g = new Gato("Misu");\nconsole.log(g.hablar());\nconsole.log(g.nombre);\n'),
    ],
  },
  {
    path: 'classes/class-fields',
    module: 'Clases',
    topic: 'Campos y métodos de clase',
    summary:
      'Los campos públicos se declaran en el cuerpo de la clase y cada instancia recibe su copia. Los campos y métodos privados empiezan con # y solo son accesibles dentro de la clase; usarlos desde fuera es un SyntaxError. Los miembros static pertenecen a la clase y no a sus instancias. get y set definen propiedades de acceso.',
    items: [
      { q: '¿Qué tipo de campo solo es accesible desde dentro de la clase?', a: 'Los campos privados (los que empiezan con `#`).', d: ['Los campos públicos.', 'Los campos estáticos.', 'Los campos heredados.'] },
      out('class Cuenta {\n  #saldo = 0;\n  depositar(monto) {\n    this.#saldo += monto;\n    return this;\n  }\n  get saldo() {\n    return this.#saldo;\n  }\n}\nconst c = new Cuenta();\nc.depositar(50).depositar(25);\nconsole.log(c.saldo);\nconsole.log(Object.keys(c).length);\n'),
      { q: '¿Qué pasa si escribes `cuenta.#saldo` fuera de la clase?', a: 'Es un `SyntaxError`: el programa no llega a ejecutarse.', d: ['Devuelve `undefined`.', 'Se lanza un `TypeError` al llegar a esa línea.', 'Devuelve el saldo normalmente.'] },
      out('class Contador {\n  static total = 0;\n  constructor() {\n    Contador.total++;\n  }\n}\nnew Contador();\nnew Contador();\nconsole.log(Contador.total);\nconst c = new Contador();\nconsole.log(c.total);\n'),
      tf('Los métodos `static` se llaman desde la clase, no desde sus instancias.', true),
      val(VALUE, 'class P {\n  x = 1;\n}\nnew P().x', '`1`', ['`undefined`', 'Se lanza un `SyntaxError`.', '`null`']),
      multi('¿Qué declaraciones son válidas dentro del cuerpo de una clase?', ['`#secreto = 1;`', '`static version = "1.0";`', '`get nombre() { return "x"; }`'], ['`let contador = 0;`', '`function metodo() { }`']),
      { q: '¿Dónde quedan los campos públicos de instancia como `x = 1;`?', a: 'En cada instancia que crea la clase.', d: ['En el prototipo de la clase.', 'En la clase misma, como campos estáticos.', 'En una variable global.'] },
    ],
  },
  {
    path: 'classes/static-initialization-blocks',
    module: 'Clases',
    topic: 'Bloques de inicialización estáticos',
    summary:
      'Un bloque static { } dentro de una clase contiene código que se ejecuta una sola vez, al evaluar la definición de la clase, para establecer o cambiar campos estáticos con varias instrucciones (por ejemplo, try...catch). Dentro del bloque, this es la clase. Una clase puede tener varios bloques: se ejecutan en el orden en que aparecen, junto con los campos estáticos, y pueden acceder a los miembros privados. Se estandarizaron en ECMAScript 2022.',
    items: [
      { q: '¿Cuándo se ejecuta un bloque `static { }`?', a: 'Una sola vez, cuando se evalúa la definición de la clase.', d: ['Cada vez que se crea una instancia con `new`.', 'Cada vez que se llama a un método estático.', 'Solo si se llama explícitamente.'] },
      out('class Config {\n  static ajustes;\n  static {\n    console.log("inicializando");\n    this.ajustes = { tema: "claro" };\n  }\n}\nconsole.log(Config.ajustes.tema);\nnew Config();\nnew Config();\n'),
      out('class Orden {\n  static a = 1;\n  static {\n    console.log("bloque 1:", this.a, this.b);\n  }\n  static b = 2;\n  static {\n    console.log("bloque 2:", this.b);\n  }\n}\n'),
      { q: 'Dentro de un bloque de inicialización estático, ¿a qué se refiere `this`?', a: 'A la clase misma.', d: ['A la instancia que se está creando.', 'Al objeto global.', 'Es `undefined`.'] },
      tf('Una clase puede tener más de un bloque de inicialización estático.', true),
      {
        q: '¿Para qué conviene un bloque estático en lugar de un campo `static x = ...`?',
        a: 'Para ejecutar varias instrucciones (como `try...catch` o ciclos) al inicializar los campos estáticos.',
        d: ['Para que el campo se pueda reasignar.', 'Para que cada instancia tenga su propia copia.', 'Para que el campo sea privado.'],
      },
      multi(
        '¿Qué es cierto sobre los bloques de inicialización estáticos?',
        ['Pueden acceder a los campos privados de la clase.', 'Se ejecutan en el orden en que aparecen, junto con los campos estáticos.'],
        ['Reciben parámetros como un constructor.', 'Se ejecutan cada vez que se crea una instancia.'],
      ),
    ],
  },
];

// ───────────────────────────── ejercicios de programación ─────────────────────────────

export interface WebdevExerciseTest {
  call: string;
  /** Valor esperado en JSON (cadenas entre comillas). */
  expected: string;
  hidden?: boolean;
}

export interface WebdevExercise {
  id: string;
  /** Lección del curso que practica (coincide con `WebdevLesson.topic`). */
  topic: string;
  title: string;
  prompt: string;
  starter: string;
  solution: string;
  tests: WebdevExerciseTest[];
  rules?: { kind: 'contains' | 'notContains'; pattern: string; message: string }[];
}

const stub = (signature: string) => `function ${signature} {\n  // Escribe tu código aquí\n\n}\n`;

/** Ejercicios que llevan a la práctica los ejemplos del curso; cada prueba llama a la función y compara lo que devuelve. */
export const WEBDEV_JAVASCRIPT_EXERCISES: WebdevExercise[] = [
  {
    id: 'es-falsy',
    topic: 'Booleanos',
    title: 'Valores falsy',
    prompt: 'Escribe la función `esFalsy(valor)` que devuelva `true` si el valor es falsy y `false` si es truthy.',
    starter: stub('esFalsy(valor)'),
    solution: 'function esFalsy(valor) {\n  return !valor;\n}\n',
    tests: [
      { call: 'esFalsy(0)', expected: 'true' },
      { call: 'esFalsy("0")', expected: 'false' },
      { call: 'esFalsy(null)', expected: 'true' },
      { call: 'esFalsy([])', expected: 'false', hidden: true },
      { call: 'esFalsy(NaN)', expected: 'true', hidden: true },
    ],
  },
  {
    id: 'valor-predeterminado',
    topic: 'null y undefined',
    title: 'Valor predeterminado con ??',
    prompt:
      'Escribe la función `valorPredeterminado(valor, respaldo)` que devuelva `respaldo` solo cuando `valor` sea `null` o `undefined`; en cualquier otro caso (incluidos `0` y `""`) devuelve `valor`.\n\nUsa el operador de fusión de nulos `??`.',
    starter: stub('valorPredeterminado(valor, respaldo)'),
    solution: 'function valorPredeterminado(valor, respaldo) {\n  return valor ?? respaldo;\n}\n',
    tests: [
      { call: 'valorPredeterminado(0, 5)', expected: '0' },
      { call: 'valorPredeterminado(null, 5)', expected: '5' },
      { call: 'valorPredeterminado("", "x")', expected: '""' },
      { call: 'valorPredeterminado(undefined, 1)', expected: '1', hidden: true },
      { call: 'valorPredeterminado(false, true)', expected: 'false', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: '??', message: 'Usa el operador ??.' }],
  },
  {
    id: 'clasificar',
    topic: 'Flujo de control',
    title: 'Clasificar un número',
    prompt: 'Escribe la función `clasificar(n)` que devuelva `"negativo"`, `"cero"` o `"positivo"` según el número.',
    starter: stub('clasificar(n)'),
    solution: 'function clasificar(n) {\n  if (n < 0) return "negativo";\n  if (n === 0) return "cero";\n  return "positivo";\n}\n',
    tests: [
      { call: 'clasificar(-3)', expected: '"negativo"' },
      { call: 'clasificar(0)', expected: '"cero"' },
      { call: 'clasificar(8)', expected: '"positivo"' },
      { call: 'clasificar(-0.5)', expected: '"negativo"', hidden: true },
    ],
  },
  {
    id: 'saludar',
    topic: 'Funciones',
    title: 'Parámetro predeterminado',
    prompt: 'Escribe la función `saludar(nombre)` que devuelva `"Hola, <nombre>!"`. Si no recibe nombre, debe usar `"invitado"` con un parámetro predeterminado.',
    starter: stub('saludar(nombre)'),
    solution: 'function saludar(nombre = "invitado") {\n  return `Hola, ${nombre}!`;\n}\n',
    tests: [
      { call: 'saludar("Ana")', expected: '"Hola, Ana!"' },
      { call: 'saludar()', expected: '"Hola, invitado!"' },
      { call: 'saludar(undefined)', expected: '"Hola, invitado!"', hidden: true },
    ],
  },
  {
    id: 'sumar-todos',
    topic: 'Funciones',
    title: 'Parámetro rest',
    prompt: 'Escribe la función `sumarTodos(...numeros)` que devuelva la suma de todos los argumentos que reciba (o `0` si no recibe ninguno).',
    starter: stub('sumarTodos(...numeros)'),
    solution: 'function sumarTodos(...numeros) {\n  return numeros.reduce((total, n) => total + n, 0);\n}\n',
    tests: [
      { call: 'sumarTodos(1, 2, 3)', expected: '6' },
      { call: 'sumarTodos()', expected: '0' },
      { call: 'sumarTodos(10)', expected: '10', hidden: true },
      { call: 'sumarTodos(-1, 1, 5, 5)', expected: '10', hidden: true },
    ],
  },
  {
    id: 'crear-contador',
    topic: 'La palabra clave return',
    title: 'Función que devuelve una función',
    prompt: 'Escribe la función `crearContador()` que devuelva una función. Cada vez que se llame a esa función debe devolver el siguiente número, empezando en `1`. Cada contador lleva su propia cuenta.',
    starter: stub('crearContador()'),
    solution: 'function crearContador() {\n  let cuenta = 0;\n  return () => ++cuenta;\n}\n',
    tests: [
      { call: 'crearContador()()', expected: '1' },
      { call: '(() => { const c = crearContador(); c(); c(); return c(); })()', expected: '3' },
      { call: '(() => { const a = crearContador(); const b = crearContador(); a(); a(); return b(); })()', expected: '1', hidden: true },
    ],
  },
  {
    id: 'mayusculas-etiqueta',
    topic: 'Cadenas',
    title: 'Plantilla etiquetada',
    prompt:
      'Escribe la función `mayus(textos, ...valores)` para usarla como etiqueta de una plantilla literal: debe devolver la cadena completa con los valores insertados en mayúsculas.\n\nPor ejemplo, ``mayus`hola ${"ana"}!` `` devuelve `"hola ANA!"`.',
    starter: stub('mayus(textos, ...valores)'),
    solution: 'function mayus(textos, ...valores) {\n  let resultado = textos[0];\n  for (let i = 0; i < valores.length; i++) {\n    resultado += String(valores[i]).toUpperCase() + textos[i + 1];\n  }\n  return resultado;\n}\n',
    tests: [
      { call: 'mayus`hola ${"ana"}!`', expected: '"hola ANA!"' },
      { call: 'mayus`${"a"}-${"b"}`', expected: '"A-B"' },
      { call: 'mayus`sin valores`', expected: '"sin valores"', hidden: true },
    ],
  },
  {
    id: 'solo-lectura',
    topic: 'Descriptores de propiedades',
    title: 'Propiedad de solo lectura',
    prompt:
      'Escribe la función `soloLectura(obj, clave, valor)` que agregue a `obj` una propiedad `clave` con ese `valor` que no se pueda modificar (`writable: false`) pero sí aparezca en `Object.keys` (`enumerable: true`), y devuelva `obj`.\n\nUsa `Object.defineProperty`.',
    starter: stub('soloLectura(obj, clave, valor)'),
    solution: 'function soloLectura(obj, clave, valor) {\n  Object.defineProperty(obj, clave, { value: valor, writable: false, enumerable: true });\n  return obj;\n}\n',
    tests: [
      { call: 'soloLectura({}, "id", 5).id', expected: '5' },
      { call: '(() => { const o = soloLectura({}, "id", 5); o.id = 9; return o.id; })()', expected: '5' },
      { call: 'Object.keys(soloLectura({ a: 1 }, "b", 2))', expected: '["a","b"]', hidden: true },
      { call: 'Object.getOwnPropertyDescriptor(soloLectura({}, "x", 1), "x").writable', expected: 'false', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'defineProperty', message: 'Usa Object.defineProperty.' }],
  },
  {
    id: 'hereda-de',
    topic: 'Herencia de prototipos',
    title: 'Crear un objeto con prototipo',
    prompt: 'Escribe la función `heredaDe(proto, propiedades)` que devuelva un objeto nuevo cuyo prototipo sea `proto` y que tenga como propias las propiedades del objeto `propiedades`.\n\nPista: `Object.create` y `Object.assign`.',
    starter: stub('heredaDe(proto, propiedades)'),
    solution: 'function heredaDe(proto, propiedades) {\n  return Object.assign(Object.create(proto), propiedades);\n}\n',
    tests: [
      { call: '(() => { const base = { saludar() { return "hola " + this.nombre; } }; return heredaDe(base, { nombre: "Ana" }).saludar(); })()', expected: '"hola Ana"' },
      { call: '(() => { const base = {}; return Object.getPrototypeOf(heredaDe(base, {})) === base; })()', expected: 'true' },
      { call: 'Object.keys(heredaDe({ x: 1 }, { y: 2 }))', expected: '["y"]', hidden: true },
    ],
  },
  {
    id: 'sin-repetidos',
    topic: 'Colecciones con clave',
    title: 'Quitar repetidos con Set',
    prompt: 'Escribe la función `sinRepetidos(arreglo)` que devuelva un arreglo nuevo con los valores de `arreglo` sin repetir, en el orden en que aparecen por primera vez.',
    starter: stub('sinRepetidos(arreglo)'),
    solution: 'function sinRepetidos(arreglo) {\n  return [...new Set(arreglo)];\n}\n',
    tests: [
      { call: 'sinRepetidos([1, 2, 2, 3, 1])', expected: '[1,2,3]' },
      { call: 'sinRepetidos(["a", "b", "a"])', expected: '["a","b"]' },
      { call: 'sinRepetidos([])', expected: '[]', hidden: true },
    ],
  },
  {
    id: 'frecuencias',
    topic: 'Colecciones con clave',
    title: 'Contar con Map',
    prompt:
      'Escribe la función `frecuencias(lista)` que cuente cuántas veces aparece cada valor usando un `Map` y devuelva sus entradas como arreglo de pares `[valor, veces]`, en el orden en que aparece cada valor por primera vez.\n\nPor ejemplo, `frecuencias(["a", "b", "a"])` devuelve `[["a", 2], ["b", 1]]`.',
    starter: stub('frecuencias(lista)'),
    solution: 'function frecuencias(lista) {\n  const conteo = new Map();\n  for (const v of lista) {\n    conteo.set(v, (conteo.get(v) ?? 0) + 1);\n  }\n  return [...conteo];\n}\n',
    tests: [
      { call: 'frecuencias(["a", "b", "a"])', expected: '[["a",2],["b",1]]' },
      { call: 'frecuencias([3, 3, 3])', expected: '[[3,3]]' },
      { call: 'frecuencias([])', expected: '[]', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'Map', message: 'Usa un Map para contar.' }],
  },
  {
    id: 'rectangulo',
    topic: 'Clases',
    title: 'Clase Rectangulo',
    prompt: 'Escribe la clase `Rectangulo` con un constructor que reciba `ancho` y `alto`, y los métodos `area()` y `perimetro()`.',
    starter: 'class Rectangulo {\n  // Escribe tu código aquí\n\n}\n',
    solution: 'class Rectangulo {\n  constructor(ancho, alto) {\n    this.ancho = ancho;\n    this.alto = alto;\n  }\n  area() {\n    return this.ancho * this.alto;\n  }\n  perimetro() {\n    return 2 * (this.ancho + this.alto);\n  }\n}\n',
    tests: [
      { call: 'new Rectangulo(3, 4).area()', expected: '12' },
      { call: 'new Rectangulo(3, 4).perimetro()', expected: '14' },
      { call: 'new Rectangulo(5, 5).area()', expected: '25', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'class', message: 'Define una clase con class.' }],
  },
  {
    id: 'perro-extends',
    topic: 'Extender clases',
    title: 'Subclase con extends',
    prompt: 'Ya existe la clase `Animal`. Escribe la clase `Perro` que extienda `Animal` y sobrescriba `hablar()` para que devuelva `"<nombre> dice guau"`.',
    starter: 'class Animal {\n  constructor(nombre) {\n    this.nombre = nombre;\n  }\n  hablar() {\n    return this.nombre + " hace un sonido";\n  }\n}\n\n// Escribe la clase Perro aquí\n',
    solution:
      'class Animal {\n  constructor(nombre) {\n    this.nombre = nombre;\n  }\n  hablar() {\n    return this.nombre + " hace un sonido";\n  }\n}\n\nclass Perro extends Animal {\n  hablar() {\n    return this.nombre + " dice guau";\n  }\n}\n',
    tests: [
      { call: 'new Perro("Rex").hablar()', expected: '"Rex dice guau"' },
      { call: 'new Perro("Rex") instanceof Animal', expected: 'true' },
      { call: 'new Animal("Gato").hablar()', expected: '"Gato hace un sonido"', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'extends', message: 'Usa extends.' }],
  },
  {
    id: 'temperatura-privada',
    topic: 'Campos y métodos de clase',
    title: 'Campo privado y método estático',
    prompt:
      'Escribe la clase `Temperatura` que guarde los grados Celsius en un campo privado `#celsius` (recibido en el constructor) y tenga:\n\n- un getter `celsius`,\n- un getter `fahrenheit` (`celsius * 9 / 5 + 32`),\n- un método estático `desdeFahrenheit(f)` que devuelva una nueva `Temperatura`.',
    starter: 'class Temperatura {\n  // Escribe tu código aquí\n\n}\n',
    solution:
      'class Temperatura {\n  #celsius;\n  constructor(celsius) {\n    this.#celsius = celsius;\n  }\n  get celsius() {\n    return this.#celsius;\n  }\n  get fahrenheit() {\n    return this.#celsius * 9 / 5 + 32;\n  }\n  static desdeFahrenheit(f) {\n    return new Temperatura((f - 32) * 5 / 9);\n  }\n}\n',
    tests: [
      { call: 'new Temperatura(100).fahrenheit', expected: '212' },
      { call: 'Temperatura.desdeFahrenheit(32).celsius', expected: '0' },
      { call: 'Object.keys(new Temperatura(5)).length', expected: '0', hidden: true },
      { call: 'new Temperatura(-40).fahrenheit', expected: '-40', hidden: true },
    ],
    rules: [
      { kind: 'contains', pattern: '#celsius', message: 'Guarda los grados en el campo privado #celsius.' },
      { kind: 'contains', pattern: 'static', message: 'desdeFahrenheit debe ser un método estático.' },
    ],
  },
];
