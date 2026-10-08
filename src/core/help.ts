/** Ayuda integrada: referencia del lenguaje y uso del entorno. */

export type HelpBlock = { p: string } | { code: string } | { list: string[] } | { table: string[][] };

export interface HelpTopic {
  id: string;
  title: string;
  group: 'Entorno' | 'Lenguaje';
  blocks: HelpBlock[];
}

export const HELP: HelpTopic[] = [
  {
    id: 'intro',
    title: '¿Qué es PSJavaScript?',
    group: 'Entorno',
    blocks: [
      { p: 'PSJavaScript es un entorno para aprender a programar inspirado en PSeInt, pero usando la sintaxis real de JavaScript. Puedes escribir, ejecutar paso a paso, ver variables, generar diagramas de flujo y convertir tu programa a otros lenguajes.' },
      { p: 'El programa se ejecuta en un intérprete educativo propio: no necesitas navegador ni Node.js, y todos los errores se explican en español.' },
      { list: [
        'Ejecutar (▶): corre el programa completo. Se detiene en los puntos de interrupción.',
        'Paso a paso (⏯): avanza solo, resaltando cada instrucción. Ajusta la velocidad.',
        'Siguiente paso (⏭): ejecuta una sola instrucción.',
        'Retroceder (⏮): deshace el último paso (re-ejecuta con los mismos datos).',
        'Detener (■): termina la ejecución.',
      ] },
    ],
  },
  {
    id: 'pseint',
    title: 'Equivalencias con PSeInt',
    group: 'Entorno',
    blocks: [
      { p: 'Si ya conoces PSeInt, esta tabla muestra cómo se escribe cada instrucción en JavaScript:' },
      { table: [
        ['PSeInt', 'JavaScript'],
        ['Algoritmo ... FinAlgoritmo', '(no hace falta: el programa es el archivo)'],
        ['Definir x Como Entero', 'let x = 0;'],
        ['x <- 5', 'x = 5;'],
        ['Leer x', 'x = Number(prompt("x:"));'],
        ['Escribir "Hola", x', 'console.log("Hola", x);'],
        ['Si c Entonces ... SiNo ... FinSi', 'if (c) { ... } else { ... }'],
        ['Segun x Hacer ... FinSegun', 'switch (x) { case 1: ... break; default: ... }'],
        ['Mientras c Hacer ... FinMientras', 'while (c) { ... }'],
        ['Repetir ... Hasta Que c', 'do { ... } while (!c);'],
        ['Para i <- 1 Hasta n Con Paso 1', 'for (let i = 1; i <= n; i++) { ... }'],
        ['Funcion r <- f(a) ... FinFuncion', 'function f(a) { ...; return r; }'],
        ['Dimensionar a[10]', 'const a = new Array(10).fill(0);'],
        ['a[1] (base 1)', 'a[0] (siempre base 0)'],
        ['=   <>', '===   !=='],
        ['Y   O   NO', '&&   ||   !'],
        ['MOD', '%'],
        ['x ^ 2', 'x ** 2'],
        ['raiz(x)  abs(x)  trunc(x)  redon(x)', 'Math.sqrt(x)  Math.abs(x)  Math.trunc(x)  Math.round(x)'],
        ['azar(n)', 'Math.floor(Math.random() * n)'],
        ['Longitud(s)', 's.length'],
        ['Subcadena(s, i, j)', 's.substring(i, j + 1)'],
        ['Mayusculas(s)  Minusculas(s)', 's.toUpperCase()  s.toLowerCase()'],
        ['ConvertirANumero(s)', 'Number(s)'],
        ['ConvertirATexto(n)', 'String(n)'],
        ['Borrar Pantalla', 'console.clear();'],
      ] },
    ],
  },
  {
    id: 'ejecucion',
    title: 'Ejecutar, depurar y prueba de escritorio',
    group: 'Entorno',
    blocks: [
      { p: 'Puntos de interrupción: toca el número de una línea para marcarla (●). Al ejecutar, el programa se pausa antes de esa línea.' },
      { p: 'Variables: muestra el valor y el tipo de cada variable visible, agrupadas por ámbito (bloque, función, global). La pila de llamadas permite ver las variables de cada función activa.' },
      { p: 'Expresiones vigiladas: agrega expresiones como suma / n o arreglo[i] y verás su valor en cada pausa (no pueden modificar variables).' },
      { p: 'Prueba de escritorio: tabla generada automáticamente con el valor de las variables después de cada instrucción que las modifica. Si defines expresiones vigiladas, la tabla usa esas columnas.' },
      { p: 'Explicación: en modo explicativo, cada paso se describe en lenguaje natural (qué condición se evaluó, qué valor se asignó, qué función se llamó…).' },
      { p: 'Entradas: los datos que ingresaste se guardan. Puedes editarlos y volver a ejecutar para ver cómo cambia el resultado, o activar la ejecución en tiempo real para que el programa se vuelva a ejecutar automáticamente cada vez que modificas el código.' },
      { p: 'Errores: los errores de sintaxis y advertencias aparecen mientras escribes (panel Problemas). Los errores de ejecución indican la línea, la causa probable y cómo solucionarlo.' },
    ],
  },
  {
    id: 'diagramas',
    title: 'Diagramas de flujo',
    group: 'Entorno',
    blocks: [
      { p: 'El panel Diagrama genera automáticamente el diagrama de flujo del programa principal y de cada función o método. Durante la ejecución paso a paso se resalta la figura que se está ejecutando.' },
      { list: [
        'Óvalo: inicio / fin.',
        'Rectángulo: proceso (asignación, declaración).',
        'Paralelogramo: entrada (prompt) o salida (console.log).',
        'Rombo: decisión (if, switch, condición de ciclos).',
        'Rectángulo con barras: llamada a una función.',
      ] },
      { p: 'También puedes ver el diagrama de Nassi-Shneiderman (estructograma) y exportarlo como imagen vectorial SVG.' },
    ],
  },
  {
    id: 'perfiles',
    title: 'Perfiles del lenguaje',
    group: 'Entorno',
    blocks: [
      { p: 'Los perfiles ajustan qué tan estricto es el lenguaje, igual que en PSeInt. Puedes elegir uno predefinido o personalizar cada regla.' },
      { list: [
        'Flexible: JavaScript estándar, permite variables sin declarar.',
        'Estándar: exige declarar variables y sugiere ===.',
        'Programación estructurada: sin clases ni funciones flecha; tipos estrictos e índices verificados, como en PSeInt.',
        'Estricto: todas las reglas de estilo (punto y coma, llaves, camelCase, const).',
      ] },
    ],
  },
  {
    id: 'exportar',
    title: 'Exportar a otros lenguajes',
    group: 'Entorno',
    blocks: [
      { p: 'Convierte tu programa a pseudocódigo de PSeInt, Python 3 o C++, o genera una explicación en lenguaje coloquial. La conversión es automática y puede requerir ajustes: revisa las advertencias que aparecen debajo del código.' },
    ],
  },
  {
    id: 'estructura',
    title: 'Estructura de un programa y comentarios',
    group: 'Lenguaje',
    blocks: [
      { p: 'Un programa es una secuencia de instrucciones que se ejecutan de arriba hacia abajo. Cada instrucción termina normalmente con punto y coma.' },
      { code: '// Comentario de una línea\n/* Comentario\n   de varias líneas */\nconsole.log("Inicio");\nconsole.log("Fin");' },
    ],
  },
  {
    id: 'variables',
    title: 'Variables y constantes',
    group: 'Lenguaje',
    blocks: [
      { p: 'let declara una variable que puede cambiar; const declara una constante. Evita var (es la forma antigua).' },
      { code: 'let contador = 0;\ncontador = contador + 1;\nconst PI = 3.1416;\nlet nombre = "Ana", edad = 20;' },
      { p: 'Los nombres distinguen mayúsculas/minúsculas, no pueden empezar con número y no pueden ser palabras reservadas. Se recomienda camelCase: precioTotal.' },
    ],
  },
  {
    id: 'tipos',
    title: 'Tipos de datos',
    group: 'Lenguaje',
    blocks: [
      { table: [
        ['Tipo', 'Ejemplo', 'typeof'],
        ['Número', '42, 3.14, -7', '"number"'],
        ['Texto', '"hola", \'hola\', `hola ${x}`', '"string"'],
        ['Lógico', 'true, false', '"boolean"'],
        ['Indefinido', 'undefined', '"undefined"'],
        ['Nulo', 'null', '"object"'],
        ['Arreglo', '[1, 2, 3]', '"object"'],
        ['Objeto', '{ nombre: "Ana" }', '"object"'],
        ['Función', 'function f() {}', '"function"'],
      ] },
      { p: 'Cuidado: "5" + 2 da "52" (concatena), pero "5" * 2 da 10. Convierte siempre los datos leídos con Number().' },
    ],
  },
  {
    id: 'operadores',
    title: 'Operadores',
    group: 'Lenguaje',
    blocks: [
      { table: [
        ['Aritméticos', '+  -  *  /  %  **'],
        ['Comparación', '===  !==  <  >  <=  >='],
        ['Lógicos', '&&  ||  !'],
        ['Asignación', '=  +=  -=  *=  /=  ++  --'],
        ['Condicional', 'condicion ? valorSi : valorNo'],
      ] },
      { code: 'const promedio = (a + b) / 2;\nconst aprobado = promedio >= 6 && asistencia > 80;\nconst mensaje = aprobado ? "Aprobado" : "Reprobado";' },
    ],
  },
  {
    id: 'entrada',
    title: 'Entrada y salida',
    group: 'Lenguaje',
    blocks: [
      { code: 'const nombre = prompt("¿Cómo te llamas?");\nconst edad = Number(prompt("¿Edad?"));\nconst seguir = confirm("¿Continuar?");\nconsole.log("Hola", nombre);\nconsole.log(`Tienes ${edad} años`);\nconsole.table([[1, 2], [3, 4]]);' },
      { p: 'Las plantillas de texto (entre comillas invertidas `) permiten insertar valores con ${expresión}.' },
    ],
  },
  {
    id: 'condicionales',
    title: 'Condicionales',
    group: 'Lenguaje',
    blocks: [
      { code: 'if (nota >= 9) {\n  console.log("Excelente");\n} else if (nota >= 6) {\n  console.log("Aprobado");\n} else {\n  console.log("Reprobado");\n}' },
      { code: 'switch (opcion) {\n  case 1:\n    console.log("Uno");\n    break;\n  case 2:\n  case 3:\n    console.log("Dos o tres");\n    break;\n  default:\n    console.log("Otra");\n}' },
    ],
  },
  {
    id: 'ciclos',
    title: 'Ciclos',
    group: 'Lenguaje',
    blocks: [
      { code: 'let i = 1;\nwhile (i <= 5) {\n  console.log(i);\n  i++;\n}\n\ndo {\n  respuesta = prompt("¿Salir? (s/n)");\n} while (respuesta !== "s");\n\nfor (let j = 10; j >= 0; j -= 2) {\n  console.log(j);\n}\n\nfor (const letra of "hola") {\n  console.log(letra);\n}' },
      { p: 'break sale del ciclo; continue salta a la siguiente repetición.' },
    ],
  },
  {
    id: 'funciones',
    title: 'Funciones',
    group: 'Lenguaje',
    blocks: [
      { code: 'function areaRectangulo(base, altura) {\n  return base * altura;\n}\n\nconst cuadrado = (x) => x * x;\n\nfunction saludar(nombre = "invitado") {\n  console.log("Hola", nombre);\n}\n\nconsole.log(areaRectangulo(3, 4), cuadrado(5));\nsaludar();' },
      { p: 'Las variables declaradas dentro de una función solo existen dentro de ella (ámbito local). Una función puede llamarse a sí misma (recursión) siempre que tenga un caso base.' },
    ],
  },
  {
    id: 'arreglos',
    title: 'Arreglos',
    group: 'Lenguaje',
    blocks: [
      { code: 'const numeros = [4, 8, 15];\nnumeros.push(16);\nconsole.log(numeros[0], numeros.length);\nfor (let i = 0; i < numeros.length; i++) {\n  console.log(i, numeros[i]);\n}\nconst dobles = numeros.map((n) => n * 2);\nconst pares = numeros.filter((n) => n % 2 === 0);\nconst suma = numeros.reduce((a, n) => a + n, 0);\nconst matriz = [[1, 2], [3, 4]];\nconsole.log(matriz[1][0]);' },
      { p: 'Los índices empiezan en 0 y el último es length - 1. Leer fuera de rango devuelve undefined (en el perfil estructurado es un error).' },
    ],
  },
  {
    id: 'textos',
    title: 'Textos (cadenas)',
    group: 'Lenguaje',
    blocks: [
      { code: 'const s = "Programar";\nconsole.log(s.length, s[0], s.toUpperCase());\nconsole.log(s.substring(0, 3), s.includes("gra"));\nconsole.log(s.split(""), s.replaceAll("r", "R"));\nconsole.log("ab".repeat(3), "  hola ".trim());' },
    ],
  },
  {
    id: 'objetos',
    title: 'Objetos y clases',
    group: 'Lenguaje',
    blocks: [
      { code: 'const alumno = { nombre: "Luis", notas: [8, 9] };\nalumno.edad = 17;\nconsole.log(alumno.nombre, alumno["edad"]);\n\nclass Punto {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n  }\n  distancia() {\n    return Math.sqrt(this.x ** 2 + this.y ** 2);\n  }\n}\nconst p = new Punto(3, 4);\nconsole.log(p.distancia());' },
      { p: 'Las clases admiten herencia (extends), super(), métodos estáticos, getters/setters y campos privados (#campo).' },
    ],
  },
  {
    id: 'errores',
    title: 'Errores y excepciones',
    group: 'Lenguaje',
    blocks: [
      { code: 'function dividir(a, b) {\n  if (b === 0) {\n    throw new Error("División entre cero");\n  }\n  return a / b;\n}\ntry {\n  console.log(dividir(4, 0));\n} catch (e) {\n  console.log("Ocurrió un error:", e.message);\n} finally {\n  console.log("Fin");\n}' },
    ],
  },
  {
    id: 'limitaciones',
    title: 'Características no soportadas',
    group: 'Lenguaje',
    blocks: [
      { p: 'El intérprete cubre JavaScript moderno para aprendizaje. No soporta: funciones async/await, promesas, generadores (function*), módulos import/export, DOM (document/window) ni acceso a la red. setTimeout y setInterval funcionan con tiempo simulado.' },
    ],
  },
];
