/**
 * Catálogo de comandos, funciones, operadores y palabras clave.
 * Alimenta el autocompletado, las ayudas emergentes, los listados y la
 * paleta de comandos (equivalente a los paneles de PSeInt).
 * En los fragmentos, `$0` marca la posición final del cursor.
 */

export type CatalogKind = 'command' | 'function' | 'method' | 'property' | 'keyword' | 'operator' | 'constant';

export interface CatalogItem {
  label: string;
  kind: CatalogKind;
  category: string;
  insert: string;
  signature?: string;
  doc: string;
  /** Equivalente aproximado en PSeInt. */
  pseint?: string;
}

/** Plantillas de comandos (panel "Comandos" de PSeInt). */
export const COMMANDS: CatalogItem[] = [
  { label: 'Leer texto', kind: 'command', category: 'Entrada/Salida', pseint: 'Leer', insert: 'const dato = prompt("Mensaje");$0', doc: 'Pide un dato al usuario. prompt() devuelve siempre un texto (o null si se cancela).' },
  { label: 'Leer número', kind: 'command', category: 'Entrada/Salida', pseint: 'Leer', insert: 'const numero = Number(prompt("Ingresa un número:"));$0', doc: 'Pide un número al usuario y lo convierte con Number().' },
  { label: 'Escribir', kind: 'command', category: 'Entrada/Salida', pseint: 'Escribir', insert: 'console.log($0);', doc: 'Muestra valores en la consola, separados por espacios.' },
  { label: 'Confirmar', kind: 'command', category: 'Entrada/Salida', insert: 'const ok = confirm("¿Continuar?");$0', doc: 'Pregunta Sí/No. Devuelve true o false.' },
  { label: 'Declarar variable', kind: 'command', category: 'Variables', pseint: 'Definir / <-', insert: 'let variable = $0;', doc: 'Declara una variable que puede cambiar de valor.' },
  { label: 'Declarar constante', kind: 'command', category: 'Variables', insert: 'const NOMBRE = $0;', doc: 'Declara una constante: su valor no puede reasignarse.' },
  { label: 'Asignar', kind: 'command', category: 'Variables', pseint: '<-', insert: 'variable = $0;', doc: 'Cambia el valor de una variable ya declarada.' },
  { label: 'Si-Entonces (if)', kind: 'command', category: 'Condicionales', pseint: 'Si ... Entonces ... FinSi', insert: 'if (condicion) {\n  $0\n}', doc: 'Ejecuta el bloque solo si la condición es verdadera.' },
  { label: 'Si-SiNo (if/else)', kind: 'command', category: 'Condicionales', pseint: 'Si ... SiNo ... FinSi', insert: 'if (condicion) {\n  $0\n} else {\n  \n}', doc: 'Elige entre dos caminos según la condición.' },
  { label: 'Si anidado (else if)', kind: 'command', category: 'Condicionales', insert: 'if (condicion1) {\n  $0\n} else if (condicion2) {\n  \n} else {\n  \n}', doc: 'Evalúa varias condiciones en orden.' },
  { label: 'Según (switch)', kind: 'command', category: 'Condicionales', pseint: 'Segun ... Hacer', insert: 'switch (valor) {\n  case 1:\n    $0\n    break;\n  case 2:\n    \n    break;\n  default:\n    \n}', doc: 'Selección múltiple: compara un valor con varios casos (usa ===). No olvides break.' },
  { label: 'Mientras (while)', kind: 'command', category: 'Ciclos', pseint: 'Mientras ... Hacer', insert: 'while (condicion) {\n  $0\n}', doc: 'Repite el bloque de código mientras la condición sea verdadera. Evalúa la condición ANTES de entrar, por lo que podría no ejecutarse nunca si es falsa desde el principio.' },
  { label: 'Repetir (do...while)', kind: 'command', category: 'Ciclos', pseint: 'Repetir ... Hasta Que', insert: 'do {\n  $0\n} while (condicion);', doc: 'Garantiza que el código se ejecutará al menos UNA vez. Luego, repite mientras la condición sea verdadera. ¡Ojo! En JS se repite MIENTRAS la condición sea verdadera (a diferencia de PSeInt que es HASTA que sea verdadera).' },
  { label: 'Para (for)', kind: 'command', category: 'Ciclos', pseint: 'Para i <- 1 Hasta n', insert: 'for (let i = 0; i < 10; i++) {\n  $0\n}', doc: 'El clásico ciclo controlado por contador. Consta de 3 partes: 1) Inicialización (ej. let i = 0); 2) Condición para continuar (ej. i < 10); y 3) Incremento después de cada vuelta (ej. i++).' },
  { label: 'Para cada (for...of)', kind: 'command', category: 'Ciclos', pseint: 'Para Cada', insert: 'for (const elemento of arreglo) {\n  $0\n}', doc: 'La forma más fácil y moderna de recorrer arreglos (listas) o textos. En cada vuelta, extrae automáticamente el siguiente elemento sin que tengas que usar índices numéricos.' },
  { label: 'Para cada clave (for...in)', kind: 'command', category: 'Ciclos', insert: 'for (const clave in objeto) {\n  $0\n}', doc: 'Recorre las propiedades (claves) de un objeto.' },
  { label: 'Función', kind: 'command', category: 'Funciones', pseint: 'Funcion / SubProceso', insert: 'function nombre(parametro) {\n  $0\n  return resultado;\n}', doc: 'Define un subprograma reutilizable.' },
  { label: 'Función flecha', kind: 'command', category: 'Funciones', insert: 'const nombre = (parametro) => $0;', doc: 'Forma corta de escribir funciones.' },
  { label: 'Arreglo', kind: 'command', category: 'Arreglos', pseint: 'Dimensionar', insert: 'const lista = [$0];', doc: 'Crea un arreglo (lista). Los índices empiezan en 0.' },
  { label: 'Matriz', kind: 'command', category: 'Arreglos', insert: 'const matriz = [\n  [1, 2, 3],\n  [4, 5, 6],\n];$0', doc: 'Arreglo de arreglos (dos dimensiones).' },
  { label: 'Objeto', kind: 'command', category: 'Objetos', insert: 'const persona = {\n  nombre: "Ana",\n  edad: 20,$0\n};', doc: 'Agrupa datos con nombre (propiedades).' },
  { label: 'Clase', kind: 'command', category: 'Objetos', insert: 'class Nombre {\n  constructor(valor) {\n    this.valor = valor;\n  }\n\n  metodo() {\n    $0\n  }\n}', doc: 'Molde para crear objetos con new.' },
  { label: 'Intentar (try/catch)', kind: 'command', category: 'Errores', insert: 'try {\n  $0\n} catch (error) {\n  console.error(error.message);\n}', doc: 'Atrapa errores para que el programa no se detenga.' },
  { label: 'Lanzar error', kind: 'command', category: 'Errores', insert: 'throw new Error("Mensaje$0");', doc: 'Genera un error que detiene el programa si no se atrapa.' },
  { label: 'Comentario', kind: 'command', category: 'Otros', insert: '// $0', doc: 'Texto que el programa ignora.' },
  { label: 'Punto de pausa (debugger)', kind: 'command', category: 'Otros', insert: 'debugger;$0', doc: 'Pausa la ejecución en esta línea.' },
];

const fn = (label: string, category: string, signature: string, doc: string, pseint?: string, insert?: string): CatalogItem => ({
  label,
  kind: label.includes('.') && !/^(Math|JSON|Number|String|Object|Array|console)\./.test(label) ? 'method' : 'function',
  category,
  signature,
  doc,
  pseint,
  insert: insert ?? `${label}($0)`,
});

export const FUNCTIONS: CatalogItem[] = [
  fn('console.log', 'Entrada/Salida', 'console.log(valor1, valor2, ...)', 'Muestra valores en la consola.', 'Escribir'),
  fn('console.error', 'Entrada/Salida', 'console.error(mensaje)', 'Muestra un mensaje de error (en rojo).'),
  fn('console.warn', 'Entrada/Salida', 'console.warn(mensaje)', 'Muestra una advertencia.'),
  fn('console.table', 'Entrada/Salida', 'console.table(arreglo)', 'Muestra un arreglo u objeto como tabla.'),
  fn('console.clear', 'Entrada/Salida', 'console.clear()', 'Borra la consola.', 'Borrar Pantalla', 'console.clear();$0'),
  fn('prompt', 'Entrada/Salida', 'prompt(mensaje, valorPorDefecto?)', 'Pide un texto al usuario. Devuelve un texto o null.', 'Leer'),
  fn('confirm', 'Entrada/Salida', 'confirm(mensaje)', 'Pregunta Sí/No. Devuelve true o false.'),
  fn('alert', 'Entrada/Salida', 'alert(mensaje)', 'Muestra un aviso.'),
  fn('Number', 'Conversión', 'Number(valor)', 'Convierte a número. Devuelve NaN si no es un número válido.', 'ConvertirANumero'),
  fn('parseInt', 'Conversión', 'parseInt(texto)', 'Convierte un texto a número entero.', 'ConvertirANumero + trunc'),
  fn('parseFloat', 'Conversión', 'parseFloat(texto)', 'Convierte un texto a número decimal.', 'ConvertirANumero'),
  fn('String', 'Conversión', 'String(valor)', 'Convierte cualquier valor a texto.', 'ConvertirATexto'),
  fn('Boolean', 'Conversión', 'Boolean(valor)', 'Convierte a lógico (true/false).'),
  fn('isNaN', 'Conversión', 'isNaN(valor)', 'true si el valor no es un número.'),
  fn('Number.isInteger', 'Conversión', 'Number.isInteger(n)', 'true si n es un número entero.'),
  fn('Math.sqrt', 'Matemáticas', 'Math.sqrt(x)', 'Raíz cuadrada.', 'raiz(x)'),
  fn('Math.pow', 'Matemáticas', 'Math.pow(base, exponente)', 'Potencia (igual que base ** exponente).', 'base ^ exp'),
  fn('Math.abs', 'Matemáticas', 'Math.abs(x)', 'Valor absoluto.', 'abs(x)'),
  fn('Math.round', 'Matemáticas', 'Math.round(x)', 'Redondea al entero más cercano.', 'redon(x)'),
  fn('Math.floor', 'Matemáticas', 'Math.floor(x)', 'Redondea hacia abajo.', 'trunc(x)'),
  fn('Math.ceil', 'Matemáticas', 'Math.ceil(x)', 'Redondea hacia arriba.'),
  fn('Math.trunc', 'Matemáticas', 'Math.trunc(x)', 'Quita los decimales.', 'trunc(x)'),
  fn('Math.max', 'Matemáticas', 'Math.max(a, b, ...)', 'El mayor de los valores.'),
  fn('Math.min', 'Matemáticas', 'Math.min(a, b, ...)', 'El menor de los valores.'),
  fn('Math.random', 'Matemáticas', 'Math.random()', 'Número aleatorio entre 0 (incluido) y 1 (excluido). Entero de 0 a n-1: Math.floor(Math.random() * n).', 'azar(n)', 'Math.random()$0'),
  fn('Math.sin', 'Matemáticas', 'Math.sin(radianes)', 'Seno.', 'sen(x)'),
  fn('Math.cos', 'Matemáticas', 'Math.cos(radianes)', 'Coseno.', 'cos(x)'),
  fn('Math.tan', 'Matemáticas', 'Math.tan(radianes)', 'Tangente.', 'tan(x)'),
  fn('Math.log', 'Matemáticas', 'Math.log(x)', 'Logaritmo natural.', 'ln(x)'),
  fn('Math.exp', 'Matemáticas', 'Math.exp(x)', 'e elevado a x.', 'exp(x)'),
  { label: 'Math.PI', kind: 'constant', category: 'Matemáticas', insert: 'Math.PI$0', doc: 'El número π (3.14159...).', pseint: 'PI' },
  fn('.toFixed', 'Matemáticas', 'numero.toFixed(decimales)', 'Texto con el número redondeado a cierta cantidad de decimales.', undefined, '.toFixed($0)'),
  { label: '.length', kind: 'property', category: 'Textos', insert: '.length$0', doc: 'Cantidad de caracteres de un texto o de elementos de un arreglo.', pseint: 'Longitud(s)' },
  fn('.toUpperCase', 'Textos', 'texto.toUpperCase()', 'Convierte a mayúsculas.', 'Mayusculas(s)', '.toUpperCase()$0'),
  fn('.toLowerCase', 'Textos', 'texto.toLowerCase()', 'Convierte a minúsculas.', 'Minusculas(s)', '.toLowerCase()$0'),
  fn('.substring', 'Textos', 'texto.substring(inicio, fin)', 'Parte del texto desde inicio hasta fin (sin incluirlo).', 'Subcadena(s, i, f)', '.substring($0)'),
  fn('.slice', 'Textos', 'x.slice(inicio, fin)', 'Copia una parte de un texto o arreglo.', undefined, '.slice($0)'),
  fn('.charAt', 'Textos', 'texto.charAt(i)', 'Carácter en la posición i (también texto[i]).', undefined, '.charAt($0)'),
  fn('.includes', 'Textos', 'x.includes(valor)', 'true si el texto o arreglo contiene el valor.', undefined, '.includes($0)'),
  fn('.indexOf', 'Textos', 'x.indexOf(valor)', 'Posición del valor, o -1 si no está.', undefined, '.indexOf($0)'),
  fn('.split', 'Textos', 'texto.split(separador)', 'Divide un texto en un arreglo.', undefined, '.split($0)'),
  fn('.trim', 'Textos', 'texto.trim()', 'Quita espacios al inicio y al final.', undefined, '.trim()$0'),
  fn('.replace', 'Textos', 'texto.replace(buscar, reemplazo)', 'Reemplaza la primera coincidencia.', undefined, '.replace($0)'),
  fn('.replaceAll', 'Textos', 'texto.replaceAll(buscar, reemplazo)', 'Reemplaza todas las coincidencias.', undefined, '.replaceAll($0)'),
  fn('.repeat', 'Textos', 'texto.repeat(n)', 'Repite el texto n veces.', undefined, '.repeat($0)'),
  fn('.startsWith', 'Textos', 'texto.startsWith(prefijo)', 'true si el texto empieza con el prefijo.', undefined, '.startsWith($0)'),
  fn('.padStart', 'Textos', 'texto.padStart(largo, relleno)', 'Rellena a la izquierda hasta cierto largo.', undefined, '.padStart($0)'),
  fn('.push', 'Arreglos', 'arreglo.push(valor)', 'Agrega al final. Devuelve la nueva longitud.', undefined, '.push($0)'),
  fn('.pop', 'Arreglos', 'arreglo.pop()', 'Quita y devuelve el último elemento.', undefined, '.pop()$0'),
  fn('.shift', 'Arreglos', 'arreglo.shift()', 'Quita y devuelve el primer elemento.', undefined, '.shift()$0'),
  fn('.unshift', 'Arreglos', 'arreglo.unshift(valor)', 'Agrega al inicio.', undefined, '.unshift($0)'),
  fn('.splice', 'Arreglos', 'arreglo.splice(inicio, cantidad, ...nuevos)', 'Elimina o inserta elementos en una posición.', undefined, '.splice($0)'),
  fn('.join', 'Arreglos', 'arreglo.join(separador)', 'Une los elementos en un texto.', undefined, '.join($0)'),
  fn('.reverse', 'Arreglos', 'arreglo.reverse()', 'Invierte el orden (modifica el arreglo).', undefined, '.reverse()$0'),
  fn('.sort', 'Arreglos', 'arreglo.sort((a, b) => a - b)', 'Ordena. Para números usa una función de comparación.', undefined, '.sort((a, b) => a - b)$0'),
  fn('.map', 'Arreglos', 'arreglo.map((x) => ...)', 'Nuevo arreglo transformando cada elemento.', undefined, '.map((x) => $0)'),
  fn('.filter', 'Arreglos', 'arreglo.filter((x) => condición)', 'Nuevo arreglo con los elementos que cumplen la condición.', undefined, '.filter((x) => $0)'),
  fn('.reduce', 'Arreglos', 'arreglo.reduce((acum, x) => ..., inicial)', 'Combina todos los elementos en un solo valor.', undefined, '.reduce((acum, x) => $0, 0)'),
  fn('.forEach', 'Arreglos', 'arreglo.forEach((x) => ...)', 'Un método especial de los arreglos. Ejecuta la función que le des por cada uno de los elementos de la lista. Es muy similar a un for...of pero más funcional.', undefined, '.forEach((x) => {\n  $0\n})'),
  fn('.find', 'Arreglos', 'arreglo.find((x) => condición)', 'Primer elemento que cumple la condición.', undefined, '.find((x) => $0)'),
  fn('.some', 'Arreglos', 'arreglo.some((x) => condición)', 'true si alguno cumple la condición.', undefined, '.some((x) => $0)'),
  fn('.every', 'Arreglos', 'arreglo.every((x) => condición)', 'true si todos cumplen la condición.', undefined, '.every((x) => $0)'),
  fn('Array.from', 'Arreglos', 'Array.from({ length: n }, (_, i) => i)', 'Crea un arreglo a partir de algo iterable o de un tamaño.'),
  fn('Array.isArray', 'Arreglos', 'Array.isArray(x)', 'true si x es un arreglo.'),
  fn('new Array', 'Arreglos', 'new Array(n).fill(0)', 'Arreglo de tamaño n (rellénalo con fill).', 'Dimensionar a[n]', 'new Array($0).fill(0)'),
  fn('Object.keys', 'Objetos', 'Object.keys(objeto)', 'Arreglo con los nombres de las propiedades.'),
  fn('Object.values', 'Objetos', 'Object.values(objeto)', 'Arreglo con los valores de las propiedades.'),
  fn('Object.entries', 'Objetos', 'Object.entries(objeto)', 'Arreglo de pares [clave, valor].'),
  fn('JSON.stringify', 'Objetos', 'JSON.stringify(valor)', 'Convierte un valor a texto JSON.'),
  fn('JSON.parse', 'Objetos', 'JSON.parse(texto)', 'Convierte texto JSON a valor.'),
  fn('setTimeout', 'Tiempo', 'setTimeout(funcion, milisegundos)', 'Ejecuta la función después de un tiempo (simulado).'),
];

export const OPERATORS: CatalogItem[] = [
  ['+', 'Suma (o concatenación si hay textos)', '+'],
  ['-', 'Resta', '-'],
  ['*', 'Multiplicación', '*'],
  ['/', 'División (con decimales)', '/'],
  ['%', 'Resto de la división (módulo)', 'MOD'],
  ['**', 'Potencia', '^'],
  ['===', 'Igual (mismo valor y tipo)', '='],
  ['!==', 'Distinto', '<>'],
  ['<', 'Menor que', '<'],
  ['>', 'Mayor que', '>'],
  ['<=', 'Menor o igual', '<='],
  ['>=', 'Mayor o igual', '>='],
  ['&&', 'Y lógico', 'Y'],
  ['||', 'O lógico', 'O'],
  ['!', 'Negación lógica', 'NO'],
  ['=', 'Asignación', '<-'],
  ['+=', 'Sumar y asignar (x = x + v)', ''],
  ['-=', 'Restar y asignar', ''],
  ['++', 'Incrementar en 1', ''],
  ['--', 'Decrementar en 1', ''],
  ['? :', 'Condicional en una expresión: cond ? siVerdadero : siFalso', ''],
  ['??', 'Valor por defecto si es null/undefined', ''],
].map(([label, doc, pseint]) => ({ label, kind: 'operator' as const, category: 'Operadores', insert: label === '? :' ? ' ? $0 : ' : ` ${label} $0`.replace(/ \$0$/, ' $0'), doc, pseint: pseint || undefined }));

export const KEYWORD_ITEMS: CatalogItem[] = [
  ['let', 'Declara una variable.'],
  ['const', 'Declara una constante.'],
  ['if', 'Condicional.'],
  ['else', 'Rama alternativa del if.'],
  ['switch', 'Selección múltiple.'],
  ['case', 'Caso de un switch.'],
  ['default', 'Caso por defecto de un switch.'],
  ['break', 'Sale de un ciclo o switch.'],
  ['continue', 'Pasa a la siguiente iteración.'],
  ['for', 'Inicia un ciclo. Puede ser con contador (for) o para recorrer elementos (for...of).'],
  ['while', 'Inicia un ciclo que se repite mientras su condición sea verdadera.'],
  ['do', 'Inicia un ciclo do...while que siempre se ejecuta al menos una vez.'],
  ['function', 'Define una función.'],
  ['return', 'Devuelve un valor y termina la función.'],
  ['class', 'Define una clase.'],
  ['new', 'Crea un objeto de una clase.'],
  ['this', 'El objeto actual dentro de un método.'],
  ['try', 'Bloque protegido contra errores.'],
  ['catch', 'Atrapa el error.'],
  ['throw', 'Lanza un error.'],
  ['typeof', 'Tipo de un valor como texto.'],
  ['true', 'Verdadero.'],
  ['false', 'Falso.'],
  ['null', 'Valor vacío intencional.'],
  ['undefined', 'Sin valor.'],
].map(([label, doc]) => ({ label, kind: 'keyword' as const, category: 'Palabras clave', insert: `${label}$0`, doc }));

export const ALL_ITEMS: CatalogItem[] = [...FUNCTIONS, ...KEYWORD_ITEMS];

/** Ayuda emergente para la palabra bajo el cursor. */
export function lookupHelp(word: string): CatalogItem | undefined {
  if (!word) return undefined;
  const exact = FUNCTIONS.find((f) => f.label === word) ?? KEYWORD_ITEMS.find((k) => k.label === word);
  if (exact) return exact;
  const dot = word.lastIndexOf('.');
  if (dot > 0) {
    const member = word.slice(dot);
    return FUNCTIONS.find((f) => f.label === member);
  }
  return undefined;
}

/** Sugerencias de autocompletado para el prefijo escrito. */
export function suggest(prefix: string, userNames: string[], max = 12): CatalogItem[] {
  if (!prefix) return [];
  const p = prefix.toLowerCase();
  const out: CatalogItem[] = [];
  const seen = new Set<string>();
  const add = (it: CatalogItem) => {
    if (!seen.has(it.label) && it.label !== prefix) {
      seen.add(it.label);
      out.push(it);
    }
  };
  if (prefix.includes('.')) {
    const dot = prefix.lastIndexOf('.');
    const obj = prefix.slice(0, dot);
    const member = prefix.slice(dot).toLowerCase();
    // Objetos predefinidos (Math.sqrt…): la inserción reemplaza la palabra completa.
    for (const f of FUNCTIONS) if (f.label.startsWith(obj + '.') && f.label.toLowerCase().startsWith(p)) add(f);
    // Métodos de textos/arreglos (.push…): se conserva el objeto escrito.
    for (const f of FUNCTIONS) if (f.label.startsWith('.') && f.label.toLowerCase().startsWith(member)) add({ ...f, insert: obj + f.insert });
    return out.slice(0, max);
  }
  for (const n of userNames) if (n.toLowerCase().startsWith(p)) add({ label: n, kind: 'constant', category: 'Variables', insert: `${n}$0`, doc: 'Declarada en tu programa' });
  
  // Sugerencias nativas
  for (const k of KEYWORD_ITEMS) if (k.label.startsWith(p)) add(k);
  for (const f of FUNCTIONS) if (!f.label.startsWith('.') && f.label.toLowerCase().startsWith(p)) add(f);
  
  // Traducción PSeInt: Comandos, Funciones y Operadores
  for (const c of COMMANDS) {
    if (c.pseint && c.pseint.toLowerCase().startsWith(p)) add({ ...c, label: `${c.pseint.split(' ')[0]} → ${c.label}` });
  }
  for (const f of FUNCTIONS) {
    if (f.pseint && f.pseint.toLowerCase().startsWith(p)) add({ ...f, label: `${f.pseint.split('(')[0]} → ${f.label}` });
  }
  for (const o of OPERATORS) {
    if (o.pseint && o.pseint.toLowerCase().startsWith(p)) add({ ...o, label: `${o.pseint} → ${o.label}` });
  }

  return out.slice(0, max);
}
