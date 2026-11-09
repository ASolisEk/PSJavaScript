/**
 * Repaso después de un examen del maestro: a cada tema débil se le busca la práctica incluida
 * (freeCodeCamp) que más se le parece por palabras clave, para practicarlo de inmediato.
 */
import { normalizeName } from './room';

/** Temas de la práctica de freeCodeCamp y palabras (sin acentos) que los identifican. */
const TOPIC_WORDS: [string, string[]][] = [
  ['Recursión', ['recurs']],
  ['Funciones de orden superior', ['orden superior', 'callback', 'map', 'filter', 'reduce']],
  ['Expresiones regulares', ['regex', 'expresion regular', 'expresiones regulares', 'patron']],
  ['Clases y this', ['clase', 'this', 'poo', 'orientad', 'herencia', 'constructor']],
  ['Map y Set', ['map y set', 'conjunto', 'diccionario', 'coleccion']],
  ['JavaScript asíncrono', ['asincron', 'promesa', 'async', 'await', 'settimeout', 'temporizador']],
  ['Búsqueda y ordenamiento', ['busqueda', 'ordenamiento', 'ordenar', 'sort', 'buscar']],
  ['Depuración', ['depura', 'debug', 'errores', 'excepcion', 'try']],
  ['DOM y eventos', ['dom', 'evento', 'html', 'pagina']],
  ['Fechas', ['fecha', 'date', 'hora']],
  ['Cadenas de texto', ['cadena', 'texto', 'string', 'caracter']],
  ['Arreglos', ['arreglo', 'array', 'lista', 'vector', 'matriz']],
  ['Objetos', ['objeto', 'propiedad', 'json']],
  ['Ciclos', ['ciclo', 'bucle', 'for', 'while', 'repeti', 'iteracion']],
  ['Funciones', ['funcion', 'parametro', 'retorno', 'return', 'procedimiento']],
  ['Comparaciones y condicionales', ['condicion', 'if', 'compar', 'logic', 'decision', 'booleano', 'switch']],
  ['Números y operadores', ['numero', 'operador', 'aritmetic', 'matematic', 'expresion']],
  ['Variables y tipos de datos', ['variable', 'tipo', 'dato', 'declarar', 'declaracion', 'constante']],
];

/** Tema de la práctica incluida para repasar un tema del examen (o null si no hay uno parecido). */
export function practiceTopicFor(topic: string): string | null {
  const t = normalizeName(topic);
  if (!t) return null;
  const exact = TOPIC_WORDS.find(([title]) => normalizeName(title) === t);
  if (exact) return exact[0];
  // la lista va de lo más específico a lo más general: gana la primera coincidencia
  // («Funciones recursivas» → Recursión, no Funciones)
  const hit = TOPIC_WORDS.find(([, words]) => words.some((w) => new RegExp(`(^|[^a-z])${w}`).test(t)));
  return hit?.[0] ?? null;
}
