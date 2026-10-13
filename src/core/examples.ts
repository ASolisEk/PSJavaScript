/** Colección de ejemplos y desafíos por nivel de dificultad (como los de PSeInt). */

export type Level = 'Básico' | 'Intermedio' | 'Avanzado' | 'Desafíos';

export interface Example {
  id: string;
  title: string;
  level: Level;
  description: string;
  code: string;
  /** Entradas de ejemplo (para pruebas automáticas). */
  sampleInputs?: (string | boolean)[];
}

export const EXAMPLES: Example[] = [
  {
    id: 'hola',
    title: 'Hola mundo',
    level: 'Básico',
    description: 'Muestra un mensaje en pantalla.',
    code: `// Mi primer programa
console.log("¡Hola, mundo!");
`,
  },
  {
    id: 'suma',
    title: 'Suma de dos números',
    level: 'Básico',
    description: 'Lee dos números y muestra su suma. prompt() siempre devuelve texto: hay que convertirlo con Number().',
    sampleInputs: ['7', '5'],
    code: `const a = Number(prompt("Ingresa el primer número:"));
const b = Number(prompt("Ingresa el segundo número:"));
const suma = a + b;
console.log("La suma es:", suma);
`,
  },
  {
    id: 'circulo',
    title: 'Área de un círculo',
    level: 'Básico',
    description: 'Usa la constante Math.PI y toFixed para redondear.',
    sampleInputs: ['3'],
    code: `const radio = Number(prompt("Radio del círculo:"));
const area = Math.PI * radio ** 2;
const perimetro = 2 * Math.PI * radio;
console.log(\`Área: \${area.toFixed(2)}\`);
console.log(\`Perímetro: \${perimetro.toFixed(2)}\`);
`,
  },
  {
    id: 'par',
    title: 'Par o impar',
    level: 'Básico',
    description: 'Condicional if / else con el operador módulo (%).',
    sampleInputs: ['8'],
    code: `const n = Number(prompt("Ingresa un número entero:"));
if (n % 2 === 0) {
  console.log(n, "es par");
} else {
  console.log(n, "es impar");
}
`,
  },
  {
    id: 'mayor',
    title: 'Mayor de tres números',
    level: 'Básico',
    description: 'Condicionales anidados y operadores lógicos.',
    sampleInputs: ['4', '9', '2'],
    code: `const a = Number(prompt("Primer número:"));
const b = Number(prompt("Segundo número:"));
const c = Number(prompt("Tercer número:"));
let mayor;
if (a >= b && a >= c) {
  mayor = a;
} else if (b >= a && b >= c) {
  mayor = b;
} else {
  mayor = c;
}
console.log("El mayor es", mayor);
`,
  },
  {
    id: 'dia',
    title: 'Día de la semana (switch)',
    level: 'Básico',
    description: 'Selección múltiple con switch.',
    sampleInputs: ['3'],
    code: `const dia = Number(prompt("Número de día (1-7):"));
let nombre;
switch (dia) {
  case 1: nombre = "Lunes"; break;
  case 2: nombre = "Martes"; break;
  case 3: nombre = "Miércoles"; break;
  case 4: nombre = "Jueves"; break;
  case 5: nombre = "Viernes"; break;
  case 6:
  case 7: nombre = "Fin de semana"; break;
  default: nombre = "Día inválido";
}
console.log(nombre);
`,
  },
  {
    id: 'tabla',
    title: 'Tabla de multiplicar',
    level: 'Intermedio',
    description: 'Ciclo for con contador.',
    sampleInputs: ['7'],
    code: `const n = Number(prompt("¿Qué tabla quieres ver?"));
for (let i = 1; i <= 10; i++) {
  console.log(\`\${n} x \${i} = \${n * i}\`);
}
`,
  },
  {
    id: 'factorial',
    title: 'Factorial',
    level: 'Intermedio',
    description: 'Función con ciclo while y versión recursiva.',
    sampleInputs: ['5'],
    code: `function factorial(n) {
  let resultado = 1;
  while (n > 1) {
    resultado = resultado * n;
    n--;
  }
  return resultado;
}

function factorialRecursivo(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorialRecursivo(n - 1);
}

const num = Number(prompt("Número:"));
console.log("Iterativo:", factorial(num));
console.log("Recursivo:", factorialRecursivo(num));
`,
  },
  {
    id: 'fibonacci',
    title: 'Serie de Fibonacci',
    level: 'Intermedio',
    description: 'Genera los primeros N términos.',
    sampleInputs: ['10'],
    code: `const cantidad = Number(prompt("¿Cuántos términos?"));
let a = 0;
let b = 1;
const serie = [];
for (let i = 0; i < cantidad; i++) {
  serie.push(a);
  const siguiente = a + b;
  a = b;
  b = siguiente;
}
console.log(serie.join(", "));
`,
  },
  {
    id: 'primos',
    title: 'Números primos',
    level: 'Intermedio',
    description: 'Ciclos anidados, break y una función booleana.',
    sampleInputs: ['30'],
    code: `function esPrimo(n) {
  if (n < 2) {
    return false;
  }
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) {
      return false;
    }
  }
  return true;
}

const limite = Number(prompt("Mostrar primos hasta:"));
const primos = [];
for (let i = 2; i <= limite; i++) {
  if (esPrimo(i)) {
    primos.push(i);
  }
}
console.log("Primos:", primos);
console.log("Cantidad:", primos.length);
`,
  },
  {
    id: 'adivina',
    title: 'Adivina el número',
    level: 'Intermedio',
    description: 'Ciclo do...while y números aleatorios.',
    sampleInputs: ['50', '25', '75', '12', '37', '62', '88', '6', '18', '31', '43', '56', '68', '81', '94'],
    code: `const secreto = Math.floor(Math.random() * 100) + 1;
let intentos = 0;
let respuesta;
do {
  respuesta = Number(prompt("Adivina el número (1-100):"));
  intentos++;
  if (respuesta < secreto) {
    console.log("Más alto");
  } else if (respuesta > secreto) {
    console.log("Más bajo");
  }
} while (respuesta !== secreto && intentos < 15);
if (respuesta === secreto) {
  console.log(\`¡Correcto! Lo lograste en \${intentos} intentos\`);
} else {
  console.log("Se acabaron los intentos. Era", secreto);
}
`,
  },
  {
    id: 'promedio',
    title: 'Promedio de notas',
    level: 'Intermedio',
    description: 'Arreglos, acumuladores y recorrido con for...of.',
    sampleInputs: ['4', '8', '6.5', '9', '7'],
    code: `const cantidad = Number(prompt("¿Cuántas notas?"));
const notas = [];
for (let i = 0; i < cantidad; i++) {
  notas.push(Number(prompt(\`Nota \${i + 1}:\`)));
}
let suma = 0;
for (const nota of notas) {
  suma += nota;
}
const promedio = suma / notas.length;
console.log("Notas:", notas);
console.log("Promedio:", promedio.toFixed(2));
console.log(promedio >= 6 ? "Aprobado" : "Reprobado");
`,
  },
  {
    id: 'vocales',
    title: 'Contar vocales',
    level: 'Intermedio',
    description: 'Recorrer un texto carácter por carácter.',
    sampleInputs: ['Programación en JavaScript'],
    code: `const texto = prompt("Escribe una frase:").toLowerCase();
let vocales = 0;
for (let i = 0; i < texto.length; i++) {
  const letra = texto[i];
  if ("aeiouáéíóú".includes(letra)) {
    vocales++;
  }
}
console.log("Cantidad de vocales:", vocales);
`,
  },
  {
    id: 'burbuja',
    title: 'Ordenamiento burbuja',
    level: 'Avanzado',
    description: 'Ordena un arreglo intercambiando elementos vecinos. Ideal para ver paso a paso.',
    code: `const datos = [29, 10, 14, 37, 13, 5];
const n = datos.length;
for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - 1 - i; j++) {
    if (datos[j] > datos[j + 1]) {
      const aux = datos[j];
      datos[j] = datos[j + 1];
      datos[j + 1] = aux;
    }
  }
}
console.log("Ordenado:", datos);
`,
  },
  {
    id: 'binaria',
    title: 'Búsqueda binaria',
    level: 'Avanzado',
    description: 'Busca un valor en un arreglo ordenado dividiendo el rango a la mitad.',
    sampleInputs: ['23'],
    code: `function busquedaBinaria(arreglo, buscado) {
  let inicio = 0;
  let fin = arreglo.length - 1;
  while (inicio <= fin) {
    const medio = Math.floor((inicio + fin) / 2);
    if (arreglo[medio] === buscado) {
      return medio;
    } else if (arreglo[medio] < buscado) {
      inicio = medio + 1;
    } else {
      fin = medio - 1;
    }
  }
  return -1;
}

const lista = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const valor = Number(prompt("Valor a buscar:"));
const pos = busquedaBinaria(lista, valor);
if (pos >= 0) {
  console.log(\`Encontrado en la posición \${pos}\`);
} else {
  console.log("No encontrado");
}
`,
  },
  {
    id: 'hanoi',
    title: 'Torres de Hanoi',
    level: 'Avanzado',
    description: 'Recursión: mueve N discos entre tres torres.',
    sampleInputs: ['3'],
    code: `let movimientos = 0;

function hanoi(n, origen, destino, auxiliar) {
  if (n === 0) {
    return;
  }
  hanoi(n - 1, origen, auxiliar, destino);
  movimientos++;
  console.log(\`Mover disco \${n} de \${origen} a \${destino}\`);
  hanoi(n - 1, auxiliar, destino, origen);
}

const discos = Number(prompt("Número de discos:"));
hanoi(discos, "A", "C", "B");
console.log("Total de movimientos:", movimientos);
`,
  },
  {
    id: 'matriz',
    title: 'Matrices',
    level: 'Avanzado',
    description: 'Arreglos bidimensionales: suma y transpuesta.',
    code: `const a = [
  [1, 2, 3],
  [4, 5, 6],
];
const b = [
  [6, 5, 4],
  [3, 2, 1],
];
const suma = [];
for (let i = 0; i < a.length; i++) {
  suma[i] = [];
  for (let j = 0; j < a[i].length; j++) {
    suma[i][j] = a[i][j] + b[i][j];
  }
}
console.log("Suma:");
console.table(suma);

const transpuesta = [];
for (let j = 0; j < a[0].length; j++) {
  transpuesta.push([]);
  for (let i = 0; i < a.length; i++) {
    transpuesta[j].push(a[i][j]);
  }
}
console.log("Transpuesta:", transpuesta);
`,
  },
  {
    id: 'calculadora',
    title: 'Calculadora con validación',
    level: 'Avanzado',
    description: 'switch, funciones y manejo de errores con try...catch.',
    sampleInputs: ['10', '/', '0', '10', '*', '4', 'n'],
    code: `function calcular(x, op, y) {
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/":
      if (y === 0) {
        throw new Error("No se puede dividir entre cero");
      }
      return x / y;
    default:
      throw new Error("Operador desconocido: " + op);
  }
}

let seguir = "s";
while (seguir === "s") {
  const x = Number(prompt("Primer número:"));
  const op = prompt("Operación (+ - * /):");
  const y = Number(prompt("Segundo número:"));
  try {
    console.log("Resultado:", calcular(x, op, y));
  } catch (error) {
    console.error("Error:", error.message);
  }
  seguir = prompt("¿Otra operación? (s/n)");
}
`,
  },
  {
    id: 'cuenta',
    title: 'Clases: cuenta bancaria',
    level: 'Avanzado',
    description: 'Programación orientada a objetos: clases, herencia, métodos y getters.',
    code: `class Cuenta {
  constructor(titular, saldo) {
    this.titular = titular;
    this.saldo = saldo;
  }
  depositar(monto) {
    this.saldo += monto;
  }
  retirar(monto) {
    if (monto > this.saldo) {
      throw new Error("Saldo insuficiente");
    }
    this.saldo -= monto;
  }
  get resumen() {
    return \`\${this.titular}: $\${this.saldo}\`;
  }
}

class CuentaAhorro extends Cuenta {
  constructor(titular, saldo, tasa) {
    super(titular, saldo);
    this.tasa = tasa;
  }
  aplicarInteres() {
    this.depositar(this.saldo * this.tasa);
  }
}

const cuenta = new CuentaAhorro("Ana", 1000, 0.05);
cuenta.depositar(500);
cuenta.aplicarInteres();
console.log(cuenta.resumen);
try {
  cuenta.retirar(5000);
} catch (e) {
  console.log("No se pudo retirar:", e.message);
}
console.log(cuenta);
`,
  },
  {
    id: 'funcional',
    title: 'map, filter y reduce',
    level: 'Avanzado',
    description: 'Métodos de arreglos con funciones flecha (se ejecutan paso a paso).',
    code: `const productos = [
  { nombre: "Lápiz", precio: 5, cantidad: 10 },
  { nombre: "Cuaderno", precio: 35, cantidad: 3 },
  { nombre: "Mochila", precio: 450, cantidad: 1 },
];
const subtotales = productos.map((p) => p.precio * p.cantidad);
const caros = productos.filter((p) => p.precio > 20).map((p) => p.nombre);
const total = subtotales.reduce((acum, x) => acum + x, 0);
console.log("Subtotales:", subtotales);
console.log("Productos caros:", caros);
console.log("Total:", total);
`,
  },
  {
    id: 'palindromo',
    title: 'Palíndromo',
    level: 'Avanzado',
    description: 'Manipulación de textos: limpiar, invertir y comparar.',
    sampleInputs: ['Anita lava la tina'],
    code: `function esPalindromo(texto) {
  const limpio = texto.toLowerCase().replaceAll(" ", "");
  let invertido = "";
  for (let i = limpio.length - 1; i >= 0; i--) {
    invertido += limpio[i];
  }
  return limpio === invertido;
}

const frase = prompt("Escribe una frase:");
if (esPalindromo(frase)) {
  console.log("Es palíndromo");
} else {
  console.log("No es palíndromo");
}
`,
  },
  {
    id: 'validar',
    title: 'Validación de entrada',
    level: 'Básico',
    description: 'Comprueba si un valor es un número válido usando isNaN y operadores lógicos.',
    sampleInputs: ['abc', '25'],
    code: `const entrada = prompt("Ingresa tu edad:");
const edad = Number(entrada);

if (isNaN(edad) || entrada === "") {
  console.log("Error: debes ingresar un número válido.");
} else if (edad < 0 || edad > 120) {
  console.log("Edad fuera de rango.");
} else if (edad >= 18) {
  console.log("Eres mayor de edad.");
} else {
  console.log("Eres menor de edad.");
}
`,
  },
  {
    id: 'set',
    title: 'Colecciones únicas con Set',
    level: 'Intermedio',
    description: 'Eliminar duplicados de una lista y verificar pertenencia eficiente con Set.',
    code: `const repetidos = [1, 2, 2, 3, 4, 4, 5, 1];
const unicos = new Set(repetidos);

unicos.add(10);
console.log("Tiene el 3?", unicos.has(3));
console.log("Tiene el 99?", unicos.has(99));
console.log("Cantidad de elementos únicos:", unicos.size);

for (const elemento of unicos) {
  console.log("Elemento:", elemento);
}
`,
  },
  {
    id: 'desestructuracion',
    title: 'Desestructuración y Spread',
    level: 'Intermedio',
    description: 'Extraer datos de arreglos y objetos, y combinar elementos con el operador spread.',
    code: `const coordenadas = [15, 30];
const [x, y] = coordenadas;
console.log("X:", x, "Y:", y);

const usuario = { nombre: "Carlos", rol: "Estudiante", nivel: 2 };
const { nombre, rol } = usuario;
console.log(\`Usuario: \${nombre} (\${rol})\`);

const primos = [2, 3, 5];
const pares = [4, 6, 8];
const combinados = [...primos, ...pares];
console.log("Combinados:", combinados);
`,
  },
  {
    id: 'fizzbuzz',
    title: 'Desafío: FizzBuzz',
    level: 'Desafíos',
    description: 'Múltiplos de 3 imprimen "Fizz", de 5 "Buzz", y de ambos "FizzBuzz". Clásico de entrevistas.',
    code: `for (let i = 1; i <= 20; i++) {
  if (i % 3 === 0 && i % 5 === 0) {
    console.log("FizzBuzz");
  } else if (i % 3 === 0) {
    console.log("Fizz");
  } else if (i % 5 === 0) {
    console.log("Buzz");
  } else {
    console.log(i);
  }
}
`,
  },
  {
    id: 'palabras',
    title: 'Desafío: Contar palabras',
    level: 'Desafíos',
    description: 'Separa un texto por espacios e ignora espacios vacíos para contar palabras reales.',
    sampleInputs: ['  Aprender JavaScript con PSJavaScript es genial!  '],
    code: `const texto = prompt("Ingresa una oración:").trim();
const partes = texto.split(" ");
const palabras = [];

for (const p of partes) {
  if (p !== "") {
    palabras.push(p);
  }
}

console.log("Total de palabras:", palabras.length);
console.log("Lista:", palabras);
`,
  },
  {
    id: 'frecuencia',
    title: 'Desafío: Frecuencia de caracteres',
    level: 'Desafíos',
    description: 'Cuenta cuántas veces se repite cada letra en un texto usando un objeto contador.',
    sampleInputs: ['javascript'],
    code: `const palabra = prompt("Escribe una palabra:").toLowerCase();
const conteo = {};

for (let i = 0; i < palabra.length; i++) {
  const letra = palabra[i];
  if (conteo[letra]) {
    conteo[letra]++;
  } else {
    conteo[letra] = 1;
  }
}

console.log("Frecuencia de letras:");
for (const letra in conteo) {
  console.log(\`\${letra}: \${conteo[letra]}\`);
}
`,
  },
  {
    id: 'truthy',
    title: 'Valores Truthy y Falsy',
    level: 'Básico',
    description: 'Comprueba cómo JavaScript clasifica distintos valores en contextos condicionales.',
    code: `// Comprobación de valores truthy y falsy en JavaScript
const valores = [0, "Hola", "", null, undefined, 42];

for (let i = 0; i < valores.length; i++) {
  const v = valores[i];
  if (v) {
    console.log("Elemento", i, "es TRUTHY");
  } else {
    console.log("Elemento", i, "es FALSY");
  }
}
`,
  },
  {
    id: 'this',
    title: 'El contexto de this',
    level: 'Intermedio',
    description: 'Comportamiento de this en métodos de objetos y preservación léxica con funciones flecha.',
    code: `const contador = {
  valor: 10,
  obtener() {
    return this.valor;
  },
  crearSumador(delta) {
    // La función flecha preserva el "this" léxico del método
    return () => {
      this.valor += delta;
      return this.valor;
    };
  },
};

console.log("Valor inicial:", contador.obtener());
const sumarCinco = contador.crearSumador(5);
console.log("Nuevo valor:", sumarCinco());
`,
  },
  {
    id: 'map_set',
    title: 'Colecciones con Map y Set',
    level: 'Intermedio',
    description: 'Eliminación de duplicados con Set y conteo de frecuencias con Map.',
    code: `const frutas = ["manzana", "pera", "manzana", "platano", "pera", "manzana"];

// 1. Eliminar duplicados con Set
const unicas = new Set(frutas);
console.log("Frutas unicas:", unicas.size);

// 2. Contar frecuencias con Map
const conteo = new Map();
for (const fruta of frutas) {
  const actual = conteo.get(fruta) ?? 0;
  conteo.set(fruta, actual + 1);
}

for (const [nombre, total] of conteo) {
  console.log(\`\${nombre}: \${total}\`);
}
`,
  },
  {
    id: 'clase_estatica',
    title: 'Campos privados y estáticos',
    level: 'Avanzado',
    description: 'Clase con campo privado (#id), método estático y bloque de inicialización static.',
    code: `class ContadorUsuarios {
  static #total = 0;
  #id;

  static {
    // Inicialización dentro del bloque estático
    ContadorUsuarios.#total = 100;
  }

  constructor(nombre) {
    ContadorUsuarios.#total++;
    this.#id = ContadorUsuarios.#total;
    this.nombre = nombre;
  }

  get identificador() {
    return \`Usuario #\${this.#id}: \${this.nombre}\`;
  }

  static obtenerTotal() {
    return ContadorUsuarios.#total;
  }
}

const u1 = new ContadorUsuarios("Carlos");
const u2 = new ContadorUsuarios("Elena");
console.log(u1.identificador);
console.log(u2.identificador);
console.log("Total registrados:", ContadorUsuarios.obtenerTotal());
`,
  },
];

export const NEW_FILE_TEMPLATE = `// Escribe tu programa aquí
const nombre = prompt("¿Cómo te llamas?");
console.log(\`Hola, \${nombre}\`);
`;
