/**
 * Laboratorios de la certificación «JavaScript» de freeCodeCamp (currículo v9)
 * adaptados como preguntas de programación de PSJavaScript.
 *
 * Se conservan el nombre de la función y los requisitos de cada laboratorio; cada
 * caso de prueba llama a la función (`call`) y compara el valor que devuelve, igual
 * que las pruebas de freeCodeCamp. Solo se incluyen laboratorios que no necesitan
 * el DOM ni la red (PSJavaScript no los tiene).
 * Enunciados basados en https://www.freecodecamp.org/learn/javascript-v9/ (CC BY-SA 4.0).
 */

export interface FccLabTest {
  call: string;
  /** Valor esperado en JSON (cadenas entre comillas). */
  expected: string;
  hidden?: boolean;
}

export interface FccLab {
  /** Bloque del laboratorio en freeCodeCamp (p. ej. "lab-reverse-a-string"). */
  block: string;
  /** Módulo del currículo (coincide con el de los cuestionarios). */
  module: string;
  title: string;
  prompt: string;
  starter: string;
  solution: string;
  tests: FccLabTest[];
  rules?: { kind: 'contains' | 'notContains'; pattern: string; message: string }[];
}

const stub = (signature: string) => `function ${signature} {\n  // Escribe tu código aquí\n\n}\n`;

export const FCC_JAVASCRIPT_LABS: FccLab[] = [
  {
    block: 'lab-celsius-to-fahrenheit-converter',
    module: 'javascript-functions',
    title: 'Convertidor de Celsius a Fahrenheit',
    prompt: 'Escribe la función `convertCtoF(celsius)` que convierta una temperatura de grados Celsius a Fahrenheit y devuelva un número.\n\nFórmula: `fahrenheit = celsius * (9/5) + 32`',
    starter: stub('convertCtoF(celsius)'),
    solution: 'function convertCtoF(celsius) {\n  return celsius * (9 / 5) + 32;\n}\n',
    tests: [
      { call: 'convertCtoF(0)', expected: '32' },
      { call: 'convertCtoF(-30)', expected: '-22' },
      { call: 'convertCtoF(20)', expected: '68' },
      { call: 'convertCtoF(-10)', expected: '14', hidden: true },
      { call: 'convertCtoF(30)', expected: '86', hidden: true },
    ],
  },
  {
    block: 'lab-leap-year-calculator',
    module: 'javascript-functions',
    title: 'Calculadora de años bisiestos',
    prompt:
      'Escribe la función `isLeapYear(year)`. Un año es bisiesto si es divisible entre `4`, excepto los divisibles entre `100` que no son divisibles entre `400`.\n\nDebe devolver `"[year] is a leap year."` o `"[year] is not a leap year."` (reemplaza `[year]` por el año).',
    starter: stub('isLeapYear(year)'),
    solution: 'function isLeapYear(year) {\n  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;\n  return leap ? `${year} is a leap year.` : `${year} is not a leap year.`;\n}\n',
    tests: [
      { call: 'isLeapYear(2024)', expected: '"2024 is a leap year."' },
      { call: 'isLeapYear(2023)', expected: '"2023 is not a leap year."' },
      { call: 'isLeapYear(1900)', expected: '"1900 is not a leap year."' },
      { call: 'isLeapYear(2000)', expected: '"2000 is a leap year."', hidden: true },
      { call: 'isLeapYear(1600)', expected: '"1600 is a leap year."', hidden: true },
    ],
  },
  {
    block: 'lab-truncate-string',
    module: 'javascript-functions',
    title: 'Recortar una cadena',
    prompt: 'Escribe la función `truncateString(str, num)`. Si el texto es más largo que `num`, córtalo a `num` caracteres y agrega `...` al final; si no, devuélvelo sin cambios.',
    starter: stub('truncateString(str, num)'),
    solution: 'function truncateString(str, num) {\n  return str.length > num ? str.slice(0, num) + "..." : str;\n}\n',
    tests: [
      { call: 'truncateString("A-tisket a-tasket A green and yellow basket", 8)', expected: '"A-tisket..."' },
      { call: 'truncateString("Peter Piper picked a peck of pickled peppers", 11)', expected: '"Peter Piper..."' },
      { call: 'truncateString("A-", 1)', expected: '"A..."' },
      { call: 'truncateString("A-tisket a-tasket A green and yellow basket", 43)', expected: '"A-tisket a-tasket A green and yellow basket"', hidden: true },
      { call: 'truncateString("Absolutely Longer", 2)', expected: '"Ab..."', hidden: true },
    ],
  },
  {
    block: 'lab-string-ending-checker',
    module: 'javascript-functions',
    title: 'Revisar el final de una cadena',
    prompt: 'Escribe la función `confirmEnding(str, target)` que devuelva `true` si `str` termina con `target` y `false` si no.\n\nNo uses `.endsWith()`: resuélvelo con un método para obtener subcadenas.',
    starter: stub('confirmEnding(str, target)'),
    solution: 'function confirmEnding(str, target) {\n  return str.slice(str.length - target.length) === target;\n}\n',
    tests: [
      { call: 'confirmEnding("Bastian", "n")', expected: 'true' },
      { call: 'confirmEnding("Congratulation", "on")', expected: 'true' },
      { call: 'confirmEnding("Connor", "n")', expected: 'false' },
      { call: 'confirmEnding("Walking on water and developing software from a specification are easy if both are frozen", "specification")', expected: 'false', hidden: true },
      { call: 'confirmEnding("Open sesame", "same")', expected: 'true', hidden: true },
    ],
    rules: [{ kind: 'notContains', pattern: 'endsWith', message: 'No uses .endsWith().' }],
  },
  {
    block: 'lab-email-masker',
    module: 'javascript-functions',
    title: 'Ocultar un correo electrónico',
    prompt: 'Escribe la función `maskEmail(email)` que oculte con asteriscos el nombre de usuario de un correo, dejando visibles su primera y su última letra, y conserve el dominio.\n\nEjemplo: `maskEmail("apple.pie@example.com")` devuelve `"a*******e@example.com"`.',
    starter: stub('maskEmail(email)'),
    solution:
      'function maskEmail(email) {\n  const at = email.indexOf("@");\n  const user = email.slice(0, at);\n  return user[0] + "*".repeat(user.length - 2) + user[user.length - 1] + email.slice(at);\n}\n',
    tests: [
      { call: 'maskEmail("apple.pie@example.com")', expected: '"a*******e@example.com"' },
      { call: 'maskEmail("info@test.dev")', expected: '"i**o@test.dev"' },
      { call: 'maskEmail("freecodecamp@example.com")', expected: '"f**********p@example.com"', hidden: true },
      { call: 'maskEmail("user@domain.org")', expected: '"u**r@domain.org"', hidden: true },
    ],
  },
  {
    block: 'lab-golf-score-translator',
    module: 'javascript-arrays',
    title: 'Traductor de puntajes de golf',
    prompt:
      'Escribe la función `golfScore(par, strokes)` que devuelva el apodo del resultado:\n\n- `strokes` es `1`: `"Hole-in-one!"`\n- `strokes <= par - 2`: `"Eagle"`\n- `strokes === par - 1`: `"Birdie"`\n- `strokes === par`: `"Par"`\n- `strokes === par + 1`: `"Bogey"`\n- `strokes === par + 2`: `"Double Bogey"`\n- `strokes >= par + 3`: `"Go Home!"`',
    starter: stub('golfScore(par, strokes)'),
    solution:
      'function golfScore(par, strokes) {\n  if (strokes === 1) return "Hole-in-one!";\n  if (strokes <= par - 2) return "Eagle";\n  if (strokes === par - 1) return "Birdie";\n  if (strokes === par) return "Par";\n  if (strokes === par + 1) return "Bogey";\n  if (strokes === par + 2) return "Double Bogey";\n  return "Go Home!";\n}\n',
    tests: [
      { call: 'golfScore(4, 1)', expected: '"Hole-in-one!"' },
      { call: 'golfScore(5, 2)', expected: '"Eagle"' },
      { call: 'golfScore(4, 3)', expected: '"Birdie"' },
      { call: 'golfScore(4, 4)', expected: '"Par"' },
      { call: 'golfScore(5, 6)', expected: '"Bogey"', hidden: true },
      { call: 'golfScore(4, 6)', expected: '"Double Bogey"', hidden: true },
      { call: 'golfScore(5, 9)', expected: '"Go Home!"', hidden: true },
    ],
  },
  {
    block: 'lab-factorial-calculator',
    module: 'javascript-loops',
    title: 'Calculadora de factorial',
    prompt: 'Escribe la función `factorialCalculator(num)` que devuelva el factorial de `num` usando un ciclo (`for`, `while` o `do...while`). Por ejemplo, el factorial de `5` es `5 * 4 * 3 * 2 * 1 = 120`.',
    starter: stub('factorialCalculator(num)'),
    solution: 'function factorialCalculator(num) {\n  let result = 1;\n  for (let i = 1; i <= num; i++) {\n    result *= i;\n  }\n  return result;\n}\n',
    tests: [
      { call: 'factorialCalculator(5)', expected: '120' },
      { call: 'factorialCalculator(1)', expected: '1' },
      { call: 'factorialCalculator(10)', expected: '3628800', hidden: true },
      { call: 'factorialCalculator(0)', expected: '1', hidden: true },
    ],
  },
  {
    block: 'lab-repeat-a-string',
    module: 'javascript-loops',
    title: 'Repetir una cadena',
    prompt: 'Escribe la función `repeatStringNumTimes(str, num)` que devuelva `str` repetido `num` veces. Si `num` es menor o igual que cero, devuelve `""`.\n\nNo uses el método `.repeat()`.',
    starter: stub('repeatStringNumTimes(str, num)'),
    solution: 'function repeatStringNumTimes(str, num) {\n  let result = "";\n  for (let i = 0; i < num; i++) {\n    result += str;\n  }\n  return result;\n}\n',
    tests: [
      { call: 'repeatStringNumTimes("*", 3)', expected: '"***"' },
      { call: 'repeatStringNumTimes("abc", 3)', expected: '"abcabcabc"' },
      { call: 'repeatStringNumTimes("abc", -2)', expected: '""' },
      { call: 'repeatStringNumTimes("abc", 1)', expected: '"abc"', hidden: true },
      { call: 'repeatStringNumTimes("abc", 0)', expected: '""', hidden: true },
    ],
    rules: [{ kind: 'notContains', pattern: 'repeat', message: 'No uses .repeat().' }],
  },
  {
    block: 'lab-longest-word-in-a-string',
    module: 'javascript-loops',
    title: 'Buscar la palabra más larga',
    prompt: 'Escribe la función `findLongestWordLength(str)` que devuelva la longitud de la palabra más larga de la oración.',
    starter: stub('findLongestWordLength(str)'),
    solution: 'function findLongestWordLength(str) {\n  let longest = 0;\n  for (const word of str.split(" ")) {\n    if (word.length > longest) longest = word.length;\n  }\n  return longest;\n}\n',
    tests: [
      { call: 'findLongestWordLength("The quick brown fox jumped over the lazy dog")', expected: '6' },
      { call: 'findLongestWordLength("May the force be with you")', expected: '5' },
      { call: 'findLongestWordLength("Google do a barrel roll")', expected: '6', hidden: true },
      { call: 'findLongestWordLength("What is the average airspeed velocity of an unladen swallow")', expected: '8', hidden: true },
    ],
  },
  {
    block: 'lab-mutations',
    module: 'javascript-loops',
    title: 'Mutaciones',
    prompt: 'Escribe la función `mutation(arr)` que devuelva `true` si el texto del primer elemento contiene todas las letras del texto del segundo elemento (sin importar mayúsculas) y `false` si no.',
    starter: stub('mutation(arr)'),
    solution:
      'function mutation(arr) {\n  const first = arr[0].toLowerCase();\n  for (const ch of arr[1].toLowerCase()) {\n    if (!first.includes(ch)) return false;\n  }\n  return true;\n}\n',
    tests: [
      { call: 'mutation(["hello", "hey"])', expected: 'false' },
      { call: 'mutation(["hello", "Hello"])', expected: 'true' },
      { call: 'mutation(["Alien", "line"])', expected: 'true' },
      { call: 'mutation(["Mary", "Army"])', expected: 'true', hidden: true },
      { call: 'mutation(["voodoo", "no"])', expected: 'false', hidden: true },
    ],
  },
  {
    block: 'lab-chunky-monkey',
    module: 'javascript-loops',
    title: 'Dividir en grupos (Chunky Monkey)',
    prompt: 'Escribe la función `chunkArrayInGroups(arr, size)` que divida el arreglo en grupos de tamaño `size` y los devuelva como un arreglo bidimensional.',
    starter: stub('chunkArrayInGroups(arr, size)'),
    solution: 'function chunkArrayInGroups(arr, size) {\n  const result = [];\n  for (let i = 0; i < arr.length; i += size) {\n    result.push(arr.slice(i, i + size));\n  }\n  return result;\n}\n',
    tests: [
      { call: 'chunkArrayInGroups(["a", "b", "c", "d"], 2)', expected: '[["a","b"],["c","d"]]' },
      { call: 'chunkArrayInGroups([0, 1, 2, 3, 4, 5], 4)', expected: '[[0,1,2,3],[4,5]]' },
      { call: 'chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6], 3)', expected: '[[0,1,2],[3,4,5],[6]]', hidden: true },
      { call: 'chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6, 7, 8], 2)', expected: '[[0,1],[2,3],[4,5],[6,7],[8]]', hidden: true },
    ],
  },
  {
    block: 'lab-missing-letter-detector',
    module: 'javascript-loops',
    title: 'Detectar la letra faltante',
    prompt: 'Escribe la función `fearNotLetter(str)` que reciba un rango de letras en orden alfabético y devuelva la letra que falta. Si no falta ninguna, devuelve `undefined`.',
    starter: stub('fearNotLetter(str)'),
    solution:
      'function fearNotLetter(str) {\n  for (let i = 1; i < str.length; i++) {\n    if (str.charCodeAt(i) !== str.charCodeAt(i - 1) + 1) {\n      return String.fromCharCode(str.charCodeAt(i - 1) + 1);\n    }\n  }\n  return undefined;\n}\n',
    tests: [
      { call: 'fearNotLetter("abce")', expected: '"d"' },
      { call: 'fearNotLetter("abcdefghjklmno")', expected: '"i"' },
      { call: 'fearNotLetter("abcdefghijklmnopqrstuvwxyz")', expected: 'undefined' },
      { call: 'fearNotLetter("stvwx")', expected: '"u"', hidden: true },
      { call: 'fearNotLetter("bcdf")', expected: '"e"', hidden: true },
    ],
  },
  {
    block: 'lab-reverse-a-string',
    module: 'review-javascript-fundamentals',
    title: 'Invertir una cadena',
    prompt: 'Escribe la función `reverseString(str)` que devuelva el texto al revés. Por ejemplo, `"hello"` se convierte en `"olleh"`.',
    starter: stub('reverseString(str)'),
    solution: 'function reverseString(str) {\n  let result = "";\n  for (let i = str.length - 1; i >= 0; i--) {\n    result += str[i];\n  }\n  return result;\n}\n',
    tests: [
      { call: 'reverseString("hello")', expected: '"olleh"' },
      { call: 'reverseString("Howdy")', expected: '"ydwoH"' },
      { call: 'reverseString("Greetings from Earth")', expected: '"htraE morf sgniteerG"', hidden: true },
    ],
  },
  {
    block: 'lab-largest-number-finder',
    module: 'review-javascript-fundamentals',
    title: 'Buscar los números más grandes',
    prompt: 'Escribe la función `largestOfAll(arr)` que reciba un arreglo de arreglos de números y devuelva un arreglo con el número mayor de cada subarreglo.',
    starter: stub('largestOfAll(arr)'),
    solution:
      'function largestOfAll(arr) {\n  const result = [];\n  for (const sub of arr) {\n    let max = sub[0];\n    for (const n of sub) {\n      if (n > max) max = n;\n    }\n    result.push(max);\n  }\n  return result;\n}\n',
    tests: [
      { call: 'largestOfAll([[4, 5, 1, 3], [13, 27, 18, 26], [32, 35, 37, 39], [1000, 1001, 857, 1]])', expected: '[5,27,39,1001]' },
      { call: 'largestOfAll([[13, 27, 18, 26], [4, 5, 1, 3], [32, 35, 37, 39], [1000, 1001, 857, 1]])', expected: '[27,5,39,1001]' },
      { call: 'largestOfAll([[17, 23, 25, 12], [25, 7, 34, 48], [4, -10, 18, 21], [-72, -3, -17, -10]])', expected: '[25,48,21,-3]', hidden: true },
    ],
  },
  {
    block: 'lab-title-case-converter',
    module: 'review-javascript-fundamentals',
    title: 'Mayúscula inicial en cada palabra',
    prompt: 'Escribe la función `titleCase(str)` que devuelva el texto con la primera letra de cada palabra en mayúscula y el resto en minúsculas.\n\nEjemplo: `titleCase("javaScript is fun")` devuelve `"Javascript Is Fun"`.',
    starter: stub('titleCase(str)'),
    solution: 'function titleCase(str) {\n  return str\n    .split(" ")\n    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())\n    .join(" ");\n}\n',
    tests: [
      { call: 'titleCase("I like to code")', expected: '"I Like To Code"' },
      { call: 'titleCase("javaScript is fun")', expected: '"Javascript Is Fun"' },
      { call: 'titleCase("sHoRt AnD sToUt")', expected: '"Short And Stout"', hidden: true },
      { call: 'titleCase("HERE IS MY HANDLE HERE IS MY SPOUT")', expected: '"Here Is My Handle Here Is My Spout"', hidden: true },
    ],
  },
  {
    block: 'lab-falsy-remover',
    module: 'review-javascript-fundamentals',
    title: 'Quitar valores falsy',
    prompt: 'Escribe la función `bouncer(arr)` que devuelva un arreglo nuevo sin los valores falsy (`false`, `null`, `0`, `""`, `undefined` y `NaN`). No modifiques el arreglo original.',
    starter: stub('bouncer(arr)'),
    solution: 'function bouncer(arr) {\n  return arr.filter((x) => Boolean(x));\n}\n',
    tests: [
      { call: 'bouncer([7, "ate", "", false, 9])', expected: '[7,"ate",9]' },
      { call: 'bouncer(["a", "b", "c"])', expected: '["a","b","c"]' },
      { call: 'bouncer([false, null, 0, NaN, undefined, ""])', expected: '[]', hidden: true },
      { call: 'bouncer([null, NaN, 1, 2, undefined])', expected: '[1,2]', hidden: true },
    ],
  },
  {
    block: 'lab-unique-sorted-union',
    module: 'review-javascript-fundamentals',
    title: 'Unión ordenada sin repetidos',
    prompt: 'Escribe la función `uniteUnique(...arrays)` que reciba dos o más arreglos y devuelva un arreglo nuevo con los valores sin repetir, en el orden en que aparecen por primera vez.\n\nEjemplo: `uniteUnique([1, 2, 4], [2, 3, 5])` devuelve `[1, 2, 4, 3, 5]`.',
    starter: stub('uniteUnique(...arrays)'),
    solution: 'function uniteUnique(...arrays) {\n  const result = [];\n  for (const arr of arrays) {\n    for (const x of arr) {\n      if (!result.includes(x)) result.push(x);\n    }\n  }\n  return result;\n}\n',
    tests: [
      { call: 'uniteUnique([1, 3, 2], [5, 2, 1, 4], [2, 1])', expected: '[1,3,2,5,4]' },
      { call: 'uniteUnique([1, 2, 3], [5, 2, 1])', expected: '[1,2,3,5]' },
      { call: 'uniteUnique([1, 2, 3], [5, 2, 1, 4], [2, 1], [6, 7, 8])', expected: '[1,2,3,5,4,6,7,8]', hidden: true },
    ],
  },
  {
    block: 'lab-sum-all-numbers-algorithm',
    module: 'review-javascript-fundamentals',
    title: 'Sumar todos los números de un rango',
    prompt: 'Escribe la función `sumAll(arr)` que reciba un arreglo con dos números y devuelva la suma de ambos y de todos los números entre ellos. El menor no siempre viene primero.\n\nEjemplo: `sumAll([4, 1])` devuelve `10`.',
    starter: stub('sumAll(arr)'),
    solution: 'function sumAll(arr) {\n  const min = Math.min(arr[0], arr[1]);\n  const max = Math.max(arr[0], arr[1]);\n  let sum = 0;\n  for (let i = min; i <= max; i++) sum += i;\n  return sum;\n}\n',
    tests: [
      { call: 'sumAll([1, 4])', expected: '10' },
      { call: 'sumAll([4, 1])', expected: '10' },
      { call: 'sumAll([5, 10])', expected: '45', hidden: true },
      { call: 'sumAll([10, 5])', expected: '45', hidden: true },
    ],
  },
  {
    block: 'lab-dna-pair-generator',
    module: 'review-javascript-fundamentals',
    title: 'Generador de pares de ADN',
    prompt: 'Escribe la función `pairElement(str)` que, para cada base de la cadena de ADN, devuelva su par: `A` con `T`, `T` con `A`, `C` con `G` y `G` con `C`. El resultado es un arreglo de pares.\n\nEjemplo: `pairElement("ATCG")` devuelve `[["A","T"],["T","A"],["C","G"],["G","C"]]`.',
    starter: stub('pairElement(str)'),
    solution: 'function pairElement(str) {\n  const pairs = { A: "T", T: "A", C: "G", G: "C" };\n  return str.split("").map((b) => [b, pairs[b]]);\n}\n',
    tests: [
      { call: 'pairElement("GCG")', expected: '[["G","C"],["C","G"],["G","C"]]' },
      { call: 'pairElement("ATCGA")', expected: '[["A","T"],["T","A"],["C","G"],["G","C"],["A","T"]]' },
      { call: 'pairElement("TTGAG")', expected: '[["T","A"],["T","A"],["G","C"],["A","T"],["G","C"]]', hidden: true },
    ],
  },
  {
    block: 'lab-odd-fibonacci-sum-calculator',
    module: 'review-javascript-fundamentals',
    title: 'Suma de Fibonacci impares',
    prompt: 'Escribe la función `sumFibs(num)` que devuelva la suma de todos los números impares de la sucesión de Fibonacci (0, 1, 1, 2, 3, 5, 8…) que sean menores o iguales que `num`.',
    starter: stub('sumFibs(num)'),
    solution: 'function sumFibs(num) {\n  let a = 0;\n  let b = 1;\n  let sum = 0;\n  while (b <= num) {\n    if (b % 2 !== 0) sum += b;\n    const next = a + b;\n    a = b;\n    b = next;\n  }\n  return sum;\n}\n',
    tests: [
      { call: 'sumFibs(10)', expected: '10' },
      { call: 'sumFibs(4)', expected: '5' },
      { call: 'sumFibs(1000)', expected: '1785', hidden: true },
      { call: 'sumFibs(75025)', expected: '135721', hidden: true },
    ],
  },
  {
    block: 'lab-symmetric-difference',
    module: 'higher-order-functions-and-callbacks',
    title: 'Diferencia simétrica',
    prompt: 'Escribe la función `diffArray(arr1, arr2)` que devuelva un arreglo con los elementos que están solo en uno de los dos arreglos. Primero los del primer arreglo y después los del segundo, en su orden original. Usa el método `filter`.',
    starter: stub('diffArray(arr1, arr2)'),
    solution: 'function diffArray(arr1, arr2) {\n  return arr1.filter((x) => !arr2.includes(x)).concat(arr2.filter((x) => !arr1.includes(x)));\n}\n',
    tests: [
      { call: 'diffArray(["diamond", "stick", "apple"], ["stick", "emerald", "bread"])', expected: '["diamond","apple","emerald","bread"]' },
      { call: 'diffArray([1, 2, 3, 5], [1, 2, 3, 4, 5])', expected: '[4]' },
      { call: 'diffArray([1, "calf", 3, "piglet"], [1, "calf", 3, 4])', expected: '["piglet",4]', hidden: true },
      { call: 'diffArray([], ["snuffleupagus", "cookie monster", "elmo"])', expected: '["snuffleupagus","cookie monster","elmo"]', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'filter', message: 'Usa el método filter.' }],
  },
  {
    block: 'lab-value-remover-function',
    module: 'higher-order-functions-and-callbacks',
    title: 'Función para quitar valores',
    prompt: 'Escribe la función `destroyer(arr, ...values)` que devuelva un arreglo nuevo sin los elementos de `arr` que sean iguales a cualquiera de los demás argumentos.',
    starter: stub('destroyer(arr, ...values)'),
    solution: 'function destroyer(arr, ...values) {\n  return arr.filter((x) => !values.includes(x));\n}\n',
    tests: [
      { call: 'destroyer([1, 2, 3, 1, 2, 3], 2, 3)', expected: '[1,1]' },
      { call: 'destroyer([1, 2, 3, 5, 1, 2, 3], 2, 3)', expected: '[1,5,1]' },
      { call: 'destroyer(["tree", "hamburger", 53], "tree", 53)', expected: '["hamburger"]', hidden: true },
      { call: 'destroyer([3, 5, 1, 2, 2], 2, 3, 5)', expected: '[1]', hidden: true },
    ],
  },
  {
    block: 'lab-sorted-index-finder',
    module: 'higher-order-functions-and-callbacks',
    title: 'Buscar el índice en orden',
    prompt: 'Escribe la función `getIndexToIns(arr, num)` que devuelva el menor índice en el que se debe insertar `num` una vez que el arreglo esté ordenado de menor a mayor. Usa `sort` y `findIndex`.',
    starter: stub('getIndexToIns(arr, num)'),
    solution: 'function getIndexToIns(arr, num) {\n  const sorted = [...arr].sort((a, b) => a - b);\n  const i = sorted.findIndex((x) => x >= num);\n  return i === -1 ? sorted.length : i;\n}\n',
    tests: [
      { call: 'getIndexToIns([10, 20, 30, 40, 50], 35)', expected: '3' },
      { call: 'getIndexToIns([20, 3, 5], 19)', expected: '2' },
      { call: 'getIndexToIns([], 1)', expected: '0' },
      { call: 'getIndexToIns([2, 5, 10], 15)', expected: '3', hidden: true },
      { call: 'getIndexToIns([5, 3, 20, 3], 5)', expected: '2', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'findIndex', message: 'Usa el método findIndex.' }],
  },
  {
    block: 'lab-deep-flattening-tool',
    module: 'higher-order-functions-and-callbacks',
    title: 'Aplanar arreglos anidados',
    prompt: 'Escribe la función `steamrollArray(arr)` que aplane un arreglo anidado a cualquier profundidad. No uses `flat()` ni `flatMap()`.\n\nEjemplo: `steamrollArray([[1], [], [2, [3]]])` devuelve `[1, 2, 3]`.',
    starter: stub('steamrollArray(arr)'),
    solution: 'function steamrollArray(arr) {\n  const result = [];\n  for (const x of arr) {\n    if (Array.isArray(x)) result.push(...steamrollArray(x));\n    else result.push(x);\n  }\n  return result;\n}\n',
    tests: [
      { call: 'steamrollArray([[["a"]], [["b"]]])', expected: '["a","b"]' },
      { call: 'steamrollArray([1, [2], [3, [[4]]]])', expected: '[1,2,3,4]' },
      { call: 'steamrollArray([1, [], [3, [[4]]]])', expected: '[1,3,4]', hidden: true },
      { call: 'steamrollArray([1, {}, [3, [[4]]]])', expected: '[1,{},3,4]', hidden: true },
    ],
    rules: [
      { kind: 'notContains', pattern: 'flat', message: 'No uses flat().' },
      { kind: 'notContains', pattern: 'flatMap', message: 'No uses flatMap().' },
    ],
  },
  {
    block: 'lab-spinal-case-converter',
    module: 'basic-regex',
    title: 'Convertir a spinal-case',
    prompt: 'Escribe la función `spinalCase(str)` que convierta el texto a spinal case: todo en minúsculas y las palabras separadas por guiones.\n\nEjemplo: `spinalCase("ProductLanding page")` devuelve `"product-landing-page"`.',
    starter: stub('spinalCase(str)'),
    solution: 'function spinalCase(str) {\n  return str\n    .replace(/([a-z])([A-Z])/g, "$1 $2")\n    .split(/[\\s_-]+/)\n    .join("-")\n    .toLowerCase();\n}\n',
    tests: [
      { call: 'spinalCase("This Is Spinal Tap")', expected: '"this-is-spinal-tap"' },
      { call: 'spinalCase("thisIsSpinalTap")', expected: '"this-is-spinal-tap"' },
      { call: 'spinalCase("The_Andy_Griffith_Show")', expected: '"the-andy-griffith-show"', hidden: true },
      { call: 'spinalCase("Teletubbies say Eh-oh")', expected: '"teletubbies-say-eh-oh"', hidden: true },
      { call: 'spinalCase("AllThe-small Things")', expected: '"all-the-small-things"', hidden: true },
    ],
  },
  {
    block: 'lab-pig-latin',
    module: 'basic-regex',
    title: 'Pig Latin',
    prompt:
      'Escribe la función `translatePigLatin(str)`:\n\n- Si la palabra empieza con consonante (o grupo de consonantes), muévelas al final y agrega `ay`.\n- Si empieza con vocal, agrega `way` al final.\n- Si no tiene vocales, agrega `ay` al final.\n\nLas vocales son `a`, `e`, `i`, `o` y `u`.',
    starter: stub('translatePigLatin(str)'),
    solution: 'function translatePigLatin(str) {\n  if (/^[aeiou]/.test(str)) return str + "way";\n  const m = str.match(/^[^aeiou]+/);\n  return str.slice(m[0].length) + m[0] + "ay";\n}\n',
    tests: [
      { call: 'translatePigLatin("california")', expected: '"aliforniacay"' },
      { call: 'translatePigLatin("algorithm")', expected: '"algorithmway"' },
      { call: 'translatePigLatin("glove")', expected: '"oveglay"', hidden: true },
      { call: 'translatePigLatin("schwartz")', expected: '"artzschway"', hidden: true },
      { call: 'translatePigLatin("rhythm")', expected: '"rhythmay"', hidden: true },
    ],
  },
  {
    block: 'lab-palindrome-checker',
    module: 'basic-regex',
    title: 'Revisar palíndromos',
    prompt: 'Escribe la función `palindrome(str)` que devuelva `true` si el texto se lee igual al derecho y al revés, ignorando mayúsculas, espacios, signos de puntuación y símbolos (solo cuentan letras y números).',
    starter: stub('palindrome(str)'),
    solution: 'function palindrome(str) {\n  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}\n',
    tests: [
      { call: 'palindrome("eye")', expected: 'true' },
      { call: 'palindrome("_eye")', expected: 'true' },
      { call: 'palindrome("not a palindrome")', expected: 'false' },
      { call: 'palindrome("A man, a plan, a canal. Panama")', expected: 'true', hidden: true },
      { call: 'palindrome("1 eye for of 1 eye.")', expected: 'false', hidden: true },
      { call: 'palindrome("0_0 (: /-\\\\ :) 0-0")', expected: 'true', hidden: true },
    ],
  },
  {
    block: 'lab-voting-system',
    module: 'lab-voting-system',
    title: 'Sistema de votación (proyecto de certificación)',
    prompt:
      'Crea un sistema de votación con `Map` y `Set`:\n\n- `poll` es un `Map` (ya declarado).\n- `addOption(option)`: si está vacía devuelve `"Option cannot be empty."`; si ya existe, `Option "<option>" already exists.`; si no, la agrega con un `Set` vacío de votantes y devuelve `Option "<option>" added to the poll.`\n- `vote(option, voterId)`: si la opción no existe, `Option "<option>" does not exist.`; si ese votante ya votó por ella, `Voter <voterId> has already voted for "<option>".`; si no, registra el voto y devuelve `Voter <voterId> voted for "<option>".`',
    starter: 'const poll = new Map();\n\nfunction addOption(option) {\n  // Escribe tu código aquí\n\n}\n\nfunction vote(option, voterId) {\n  // Escribe tu código aquí\n\n}\n',
    solution:
      'const poll = new Map();\n\nfunction addOption(option) {\n  if (!option) return "Option cannot be empty.";\n  if (poll.has(option)) return `Option "${option}" already exists.`;\n  poll.set(option, new Set());\n  return `Option "${option}" added to the poll.`;\n}\n\nfunction vote(option, voterId) {\n  if (!poll.has(option)) return `Option "${option}" does not exist.`;\n  const voters = poll.get(option);\n  if (voters.has(voterId)) return `Voter ${voterId} has already voted for "${option}".`;\n  voters.add(voterId);\n  return `Voter ${voterId} voted for "${option}".`;\n}\n',
    tests: [
      { call: 'addOption("Turkey")', expected: '"Option \\"Turkey\\" added to the poll."' },
      { call: '(addOption("Turkey"), addOption("Turkey"))', expected: '"Option \\"Turkey\\" already exists."' },
      { call: 'addOption("")', expected: '"Option cannot be empty."' },
      { call: '(addOption("Morocco"), vote("Morocco", "traveler1"))', expected: '"Voter traveler1 voted for \\"Morocco\\"."' },
      { call: '(addOption("Morocco"), vote("Morocco", "traveler1"), vote("Morocco", "traveler1"))', expected: '"Voter traveler1 has already voted for \\"Morocco\\"."', hidden: true },
      { call: 'vote("Nowhere", "traveler2")', expected: '"Option \\"Nowhere\\" does not exist."', hidden: true },
    ],
    rules: [
      { kind: 'contains', pattern: 'Map', message: 'Usa un Map para la encuesta.' },
      { kind: 'contains', pattern: 'Set', message: 'Usa un Set para los votantes.' },
    ],
  },
  {
    block: 'lab-bank-account-manager',
    module: 'lab-bank-account-manager',
    title: 'Administrador de cuenta bancaria (proyecto de certificación)',
    prompt:
      'Define la clase `BankAccount`:\n\n- El constructor inicia `balance` en `0` y `transactions` como arreglo vacío. Cada transacción es un objeto `{ type, amount }` con `type` igual a `"deposit"` o `"withdraw"`.\n- `deposit(amount)`: si `amount > 0` registra la transacción, actualiza el saldo y devuelve `"Successfully deposited $[amount]. New balance: $[balance]"`; si no, `"Deposit amount must be greater than zero."`\n- `withdraw(amount)`: si `amount > 0` y no excede el saldo, registra y devuelve `"Successfully withdrew $[amount]. New balance: $[balance]"`; si no, `"Insufficient balance or invalid amount."`\n- `checkBalance()` devuelve `"Current balance: $[balance]"`.\n- `listAllDeposits()` devuelve `"Deposits: amount,amount,..."` y `listAllWithdrawals()` devuelve `"Withdrawals: amount,amount,..."`.',
    starter: 'class BankAccount {\n  // Escribe tu código aquí\n\n}\n',
    solution:
      'class BankAccount {\n  constructor() {\n    this.balance = 0;\n    this.transactions = [];\n  }\n  deposit(amount) {\n    if (amount <= 0) return "Deposit amount must be greater than zero.";\n    this.transactions.push({ type: "deposit", amount });\n    this.balance += amount;\n    return `Successfully deposited $${amount}. New balance: $${this.balance}`;\n  }\n  withdraw(amount) {\n    if (amount <= 0 || amount > this.balance) return "Insufficient balance or invalid amount.";\n    this.transactions.push({ type: "withdraw", amount });\n    this.balance -= amount;\n    return `Successfully withdrew $${amount}. New balance: $${this.balance}`;\n  }\n  checkBalance() {\n    return `Current balance: $${this.balance}`;\n  }\n  listAllDeposits() {\n    return "Deposits: " + this.transactions.filter((t) => t.type === "deposit").map((t) => t.amount).join(",");\n  }\n  listAllWithdrawals() {\n    return "Withdrawals: " + this.transactions.filter((t) => t.type === "withdraw").map((t) => t.amount).join(",");\n  }\n}\n',
    tests: [
      { call: 'new BankAccount().deposit(50)', expected: '"Successfully deposited $50. New balance: $50"' },
      { call: 'new BankAccount().deposit(0)', expected: '"Deposit amount must be greater than zero."' },
      { call: '((a) => (a.deposit(100), a.withdraw(30)))(new BankAccount())', expected: '"Successfully withdrew $30. New balance: $70"' },
      { call: '((a) => (a.deposit(20), a.withdraw(50)))(new BankAccount())', expected: '"Insufficient balance or invalid amount."', hidden: true },
      { call: '((a) => (a.deposit(120), a.withdraw(20), a.checkBalance()))(new BankAccount())', expected: '"Current balance: $100"', hidden: true },
      { call: '((a) => (a.deposit(10), a.deposit(25), a.withdraw(5), a.listAllDeposits()))(new BankAccount())', expected: '"Deposits: 10,25"', hidden: true },
      { call: '((a) => (a.deposit(100), a.withdraw(5), a.withdraw(15), a.listAllWithdrawals()))(new BankAccount())', expected: '"Withdrawals: 5,15"', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'class', message: 'Define una clase.' }],
  },
  {
    block: 'lab-range-of-numbers',
    module: 'recursion',
    title: 'Rango de números',
    prompt: 'Escribe la función recursiva `rangeOfNumbers(startNum, endNum)` que devuelva un arreglo con los enteros de `startNum` a `endNum` (inclusive). Debe llamarse a sí misma y no usar ciclos (`for`, `while`) ni `map`, `filter`, `reduce` o `forEach`.',
    starter: stub('rangeOfNumbers(startNum, endNum)'),
    solution: 'function rangeOfNumbers(startNum, endNum) {\n  if (startNum === endNum) return [startNum];\n  const rest = rangeOfNumbers(startNum, endNum - 1);\n  rest.push(endNum);\n  return rest;\n}\n',
    tests: [
      { call: 'rangeOfNumbers(1, 5)', expected: '[1,2,3,4,5]' },
      { call: 'rangeOfNumbers(6, 9)', expected: '[6,7,8,9]' },
      { call: 'rangeOfNumbers(4, 4)', expected: '[4]', hidden: true },
    ],
    rules: [
      { kind: 'notContains', pattern: 'for', message: 'No uses ciclos for.' },
      { kind: 'notContains', pattern: 'while', message: 'No uses ciclos while.' },
    ],
  },
  {
    block: 'lab-implement-a-stack',
    module: 'data-structures',
    title: 'Implementar una pila',
    prompt:
      'Implementa una pila con funciones. `collection` es un arreglo cuyo último elemento es la cima:\n\n- `initStack()` devuelve `{ collection: [] }`.\n- `push(stack, el)` agrega a la cima.\n- `pop(stack)` quita y devuelve la cima (o `undefined`).\n- `peek(stack)` devuelve la cima sin quitarla (o `undefined`).\n- `isEmpty(stack)` y `clear(stack)`.',
    starter: 'function initStack() {\n\n}\n\nfunction push(stack, el) {\n\n}\n\nfunction pop(stack) {\n\n}\n\nfunction peek(stack) {\n\n}\n\nfunction isEmpty(stack) {\n\n}\n\nfunction clear(stack) {\n\n}\n',
    solution:
      'function initStack() {\n  return { collection: [] };\n}\n\nfunction push(stack, el) {\n  stack.collection.push(el);\n}\n\nfunction pop(stack) {\n  return stack.collection.pop();\n}\n\nfunction peek(stack) {\n  return stack.collection[stack.collection.length - 1];\n}\n\nfunction isEmpty(stack) {\n  return stack.collection.length === 0;\n}\n\nfunction clear(stack) {\n  stack.collection = [];\n}\n',
    tests: [
      { call: 'initStack()', expected: '{"collection":[]}' },
      { call: '((s) => (push(s, 1), push(s, 2), s.collection))(initStack())', expected: '[1,2]' },
      { call: '((s) => (push(s, "a"), push(s, "b"), [pop(s), s.collection]))(initStack())', expected: '["b",["a"]]' },
      { call: '((s) => (push(s, 7), [peek(s), isEmpty(s)]))(initStack())', expected: '[7,false]', hidden: true },
      { call: '((s) => (push(s, 1), clear(s), [isEmpty(s), pop(s), peek(s)]))(initStack())', expected: '[true,null,null]', hidden: true },
    ],
  },
  {
    block: 'lab-bubble-sort-algorithm',
    module: 'algorithms',
    title: 'Ordenamiento de burbuja',
    prompt: 'Escribe la función `bubbleSort(arr)` que ordene un arreglo de enteros de menor a mayor con el algoritmo de la burbuja: compara elementos vecinos y los intercambia si están en desorden, hasta que no haya intercambios. No uses `sort()`.',
    starter: stub('bubbleSort(arr)'),
    solution:
      'function bubbleSort(arr) {\n  const a = [...arr];\n  let swapped = true;\n  while (swapped) {\n    swapped = false;\n    for (let i = 0; i < a.length - 1; i++) {\n      if (a[i] > a[i + 1]) {\n        [a[i], a[i + 1]] = [a[i + 1], a[i]];\n        swapped = true;\n      }\n    }\n  }\n  return a;\n}\n',
    tests: [
      { call: 'bubbleSort([5, 3, 8, 1])', expected: '[1,3,5,8]' },
      { call: 'bubbleSort([1, 4, 2, 8, 345, 123, 43, 32, 5643, 63, 123, 43, 2, 55, 1, 234, 92])', expected: '[1,1,2,2,4,8,32,43,43,55,63,92,123,123,234,345,5643]' },
      { call: 'bubbleSort([])', expected: '[]', hidden: true },
      { call: 'bubbleSort([-3, 10, -7, 0])', expected: '[-7,-3,0,10]', hidden: true },
    ],
    rules: [{ kind: 'notContains', pattern: 'sort(', message: 'No uses el método sort().' }],
  },
  {
    block: 'lab-nth-fibonacci-number-js',
    module: 'dynamic-programming',
    title: 'El n-ésimo número de Fibonacci',
    prompt: 'Escribe la función `fibonacci(n)` que devuelva el número de Fibonacci en la posición `n` (empezando en `fibonacci(0) = 0`, `fibonacci(1) = 1`) con programación dinámica: guarda los valores calculados en un arreglo `sequence` que empieza como `[0, 1]`.',
    starter: stub('fibonacci(n)'),
    solution: 'function fibonacci(n) {\n  const sequence = [0, 1];\n  for (let i = 2; i <= n; i++) {\n    sequence.push(sequence[i - 1] + sequence[i - 2]);\n  }\n  return sequence[n];\n}\n',
    tests: [
      { call: 'fibonacci(0)', expected: '0' },
      { call: 'fibonacci(1)', expected: '1' },
      { call: 'fibonacci(10)', expected: '55' },
      { call: 'fibonacci(50)', expected: '12586269025', hidden: true },
    ],
    rules: [{ kind: 'contains', pattern: 'sequence', message: 'Guarda los valores en el arreglo sequence.' }],
  },
  {
    block: 'lab-prime-number-sum-calculator',
    module: 'dynamic-programming',
    title: 'Suma de números primos',
    prompt: 'Escribe la función `sumPrimes(num)` que devuelva la suma de todos los números primos menores o iguales que `num`. Si `num` es menor que `2`, devuelve `0`.',
    starter: stub('sumPrimes(num)'),
    solution:
      'function sumPrimes(num) {\n  let sum = 0;\n  for (let n = 2; n <= num; n++) {\n    let prime = true;\n    for (let d = 2; d * d <= n; d++) {\n      if (n % d === 0) {\n        prime = false;\n        break;\n      }\n    }\n    if (prime) sum += n;\n  }\n  return sum;\n}\n',
    tests: [
      { call: 'sumPrimes(10)', expected: '17' },
      { call: 'sumPrimes(1)', expected: '0' },
      { call: 'sumPrimes(977)', expected: '73156', hidden: true },
    ],
  },
  {
    block: 'lab-optional-arguments-sum-function',
    module: 'functional-programming',
    title: 'Suma con argumentos opcionales',
    prompt: 'Escribe la función `addTogether(a, b)`: con dos números devuelve su suma; con un solo número devuelve una función que espera el segundo y devuelve la suma. Si algún argumento no es un número, devuelve `undefined`.\n\nEjemplo: `addTogether(2)(3)` devuelve `5`.',
    starter: stub('addTogether(...args)'),
    solution:
      'function addTogether(...args) {\n  const [a, b] = args;\n  if (typeof a !== "number") return undefined;\n  if (args.length === 1) return (c) => (typeof c === "number" ? a + c : undefined);\n  return typeof b === "number" ? a + b : undefined;\n}\n',
    tests: [
      { call: 'addTogether(2, 3)', expected: '5' },
      { call: 'addTogether(5)(7)', expected: '12' },
      { call: 'addTogether(23, "30")', expected: 'undefined' },
      { call: 'addTogether("2", 3)', expected: 'undefined', hidden: true },
      { call: 'addTogether(2)([3])', expected: 'undefined', hidden: true },
      { call: 'addTogether(23.4, 30)', expected: '53.4', hidden: true },
    ],
  },
];
