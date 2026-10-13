/**
 * Traducción al español de los cuestionarios de la certificación «JavaScript»
 * de freeCodeCamp (fccJavascriptQuizzes.ts), en el mismo orden y con el mismo
 * código: solo cambia el texto. Si vuelves a correr
 * scripts/importar-fcc-javascript.js y cambian las preguntas, actualiza aquí la
 * traducción (tests/certification.test.ts revisa que coincidan).
 *
 * Contenido original © freeCodeCamp.org, licencia CC BY-SA 4.0. Traducción
 * bajo la misma licencia.
 * 27 cuestionarios, 480 preguntas.
 */
import type { FccQuizQuestion } from './fccJavascriptQuizzes';

export const FCC_JAVASCRIPT_QUIZZES_ES: Record<string, FccQuizQuestion[]> = {
 "quiz-javascript-variables-and-data-types": [
  {
   "q": "¿Cuál de las siguientes opciones describe mejor a JavaScript?",
   "a": "Un lenguaje de programación que se usa para el desarrollo web.",
   "d": [
    "Un lenguaje de marcado que se usa para diseñar sitios web.",
    "Un lenguaje de programación del lado del servidor.",
    "Un sistema gestor de bases de datos."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un tipo de dato de JavaScript?",
   "a": "`Double`",
   "d": [
    "`Number`",
    "`Undefined`",
    "`Object`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes NO es una declaración de variable válida en JavaScript?",
   "a": "`public Int x;`",
   "d": [
    "`const x = 0;`",
    "`let x;`",
    "`var x;`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es una convención común para nombrar variables en JavaScript?",
   "a": "Camel case.",
   "d": [
    "JavaScript case.",
    "Lightning case.",
    "Giraffe case."
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre declarar una variable con `let` y con `const` en JavaScript?",
   "a": "`const` no se puede reasignar ni volver a declarar. `let` se puede reasignar, pero no volver a declarar.",
   "d": [
    "`const` no se puede reasignar ni volver a declarar. `let` se puede reasignar y volver a declarar.",
    "`const` se puede reasignar y volver a declarar. `let` no se puede reasignar ni volver a declarar.",
    "`const` se puede reasignar pero no volver a declarar. `let` se puede volver a declarar, pero no reasignar."
   ]
  },
  {
   "q": "¿Por qué se considera que las cadenas son inmutables en JavaScript?",
   "a": "Una vez creada una cadena, no puedes cambiar sus caracteres directamente.",
   "d": [
    "No puedes crear cadenas usando variables.",
    "Las cadenas solo se pueden crear con literales.",
    "Puedes cambiar las cadenas, pero solo mediante variables globales."
   ]
  },
  {
   "q": "¿Cómo imprimirías la cadena `Hello, world!` en la consola con JavaScript?",
   "a": "`console.log(\"Hello, world!\");`",
   "d": [
    "`print(\"Hello, world!\")`",
    "`alert(\"Hello, world\");`",
    "`System.out.println(\"Hello, world!\");`"
   ]
  },
  {
   "q": "¿Qué hace el siguiente código?\n\n```js\nlet hello = \"Hello\";\nhello += \" world\";\nconsole.log(hello);\n```",
   "a": "Une el valor actual de `hello` con la cadena `\" world\"`, lo vuelve a asignar a `hello` y lo imprime en la consola.",
   "d": [
    "Asigna `\" world\"` a la variable `hello` y lo imprime en la consola.",
    "Imprime en la consola el número de caracteres de `Hello world`.",
    "Une `\"Hello\"` y `\" world\"` en una cadena nueva y la imprime, pero el valor de `hello` sigue siendo `\"Hello\"`."
   ]
  },
  {
   "q": "¿Qué carácter se usa en JavaScript para marcar el final de una instrucción?",
   "a": "`;`",
   "d": [
    "`:`",
    "`,`",
    "`.`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es una sintaxis válida de comentario de una línea en JavaScript?",
   "a": "`// This is a single line comment`",
   "d": [
    "`# This is a single line comment`",
    "`-- This is a single line comment`",
    "`/* This is a single line comment */`"
   ]
  },
  {
   "q": "El tipado dinámico de JavaScript significa que:",
   "a": "JavaScript deduce el tipo a partir del valor asignado a la variable.",
   "d": [
    "Debes declarar el tipo de dato de una variable antes de usarla.",
    "No puedes asignar un valor de un tipo de dato a una variable de otro tipo.",
    "JavaScript revisa los tipos antes de ejecutar, así que los errores de tipo aparecen antes de correr el código."
   ]
  },
  {
   "q": "¿Cuál de las siguientes instrucciones imprime en la consola el tipo de la variable `x`?",
   "a": "`console.log(typeof x);`",
   "d": [
    "`console.log(x.type);`",
    "`console.log(typeOf(x));`",
    "`console.log(isNaN(x));`"
   ]
  },
  {
   "q": "¿Qué imprime `console.log(typeof null);`?",
   "a": "`\"object\"`",
   "d": [
    "`\"undefined\"`",
    "`\"null\"`",
    "`\"NaN\"`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un comentario de varias líneas válido en JavaScript?",
   "a": "```js\n/*\nThis is a\nmulti-line\ncomment\n*/\n```",
   "d": [
    "```js\n// This is a\n// multi-line\n// comment\n```",
    "```py\n'''\nThis is a\nmulti-line\ncomment\n'''\n```",
    "```html\n<!--\nThis is a\nmulti-line\ncomment\n-->\n```"
   ]
  },
  {
   "q": "¿Cuál de las siguientes declara en JavaScript una variable que no se puede cambiar?",
   "a": "`const x = 0;`",
   "d": [
    "`var x = 0;`",
    "`let x = 0;`",
    "`final x = 0;`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un nombre de variable válido en JavaScript?",
   "a": "`$number`",
   "d": [
    "`tart@n`",
    "`4cats`",
    "`!!dogs`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes NO es una forma válida de concatenar cadenas en JavaScript?",
   "a": "`console.log(string1 string2);`",
   "d": [
    "`console.log(string1 + \" \" + string2);`",
    "`console.log(\"string1 \" + string2);`",
    "`console.log(string1.concat(\" \", string2));`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes nombres de variable usa camel case correctamente?",
   "a": "`aLongVariableName`",
   "d": [
    "`a_long_variable_name`",
    "`alongvariableName`",
    "`ALongVariableName`"
   ]
  },
  {
   "q": "¿Por qué conviene escribir los punto y coma aunque JavaScript los inserte automáticamente (ASI)?",
   "a": "Para que el código sea más legible y confiable.",
   "d": [
    "Para que el código se ejecute más rápido.",
    "Para ser coherente con otros lenguajes de programación.",
    "Para depurar y rastrear errores mejor."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un tipo de dato de JavaScript?",
   "a": "`Float`",
   "d": [
    "`Symbol`",
    "`Boolean`",
    "`Null`"
   ]
  }
 ],
 "quiz-javascript-strings": [
  {
   "q": "¿Qué devuelve el método `includes()`?",
   "a": "Si encuentra la subcadena dentro de la cadena, devuelve `true`. Si no, devuelve `false`.",
   "d": [
    "Si encuentra la subcadena dentro de la cadena, devuelve la cadena. Si no, devuelve `undefined`.",
    "Si encuentra la subcadena dentro de la cadena, devuelve `true`. Si no, devuelve una cadena vacía.",
    "Si encuentra la subcadena dentro de la cadena, devuelve la cadena. Si no, devuelve `null`."
   ]
  },
  {
   "q": "¿Qué opción muestra interpolación de cadenas?",
   "a": "`` `Hello, ${user}!` ``",
   "d": [
    "`\"Hello, \" + user + \"!\"`",
    "`\"Hello, $user!\"`",
    "`` `Hello, {user}!` ``"
   ]
  },
  {
   "q": "¿Cuál de las siguientes opciones es el carácter de salto de línea?",
   "a": "`\\n`",
   "d": [
    "`\\newline`",
    "`\\new`",
    "`\\line`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre las cadenas es correcta?",
   "a": "Las cadenas son inmutables.",
   "d": [
    "Las cadenas son mutables y se pueden cambiar después de crearlas.",
    "Las cadenas no son tipos de datos primitivos.",
    "Las cadenas solo se pueden crear con comillas simples."
   ]
  },
  {
   "q": "¿Qué significa ASCII?",
   "a": "American Standard Code for Information Interchange",
   "d": [
    "American Standard Code for Internet Information",
    "Advanced Systematic Code for Internal Interchange",
    "Automatic Standard Code for Internal Information"
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos extrae una parte de una cadena y devuelve una cadena nueva?",
   "a": "`slice()`",
   "d": [
    "`trim()`",
    "`indexOf()`",
    "`prompt()`"
   ]
  },
  {
   "q": "¿Para qué sirve el método `prompt()`?",
   "a": "Muestra un cuadro de diálogo que espera a que el usuario escriba algo.",
   "d": [
    "Muestra un mensaje en la consola.",
    "Muestra un cuadro de alerta con un mensaje.",
    "Muestra un cuadro de confirmación con un mensaje."
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de obtener el tercer carácter de una cadena?",
   "a": "```js\nconst developer = \"Jessica\";\ndeveloper[2];\n```",
   "d": [
    "```js\nconst developer = \"Jessica\";\ndeveloper[3];\n```",
    "```js\nconst developer = \"Jessica\";\ndeveloper[-1];\n```",
    "```js\nconst developer = \"Jessica\";\ndeveloper[0];\n```"
   ]
  },
  {
   "q": "¿Cómo obtienes el valor ASCII del primer carácter de la cadena `\"hello\"`?",
   "a": "`\"hello\".charCodeAt(0)`",
   "d": [
    "`\"hello\".charCode(0)`",
    "`\"hello\".codeAt(0)`",
    "`\"hello\".getCharIndex(0)`"
   ]
  },
  {
   "q": "¿Qué método puedes usar para obtener el carácter que corresponde a un valor ASCII?",
   "a": "`fromCharCode()`",
   "d": [
    "`toASCII()`",
    "`toChar()`",
    "`toCode()`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes ejemplos con `indexOf` imprime `-1` en la consola?",
   "a": "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"c\"));\n```",
   "d": [
    "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"e\"));\n```",
    "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"f\"));\n```",
    "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"C\"));\n```"
   ]
  },
  {
   "q": "¿Cómo revisas si la cadena `\"JavaScript\"` contiene `\"Script\"`?",
   "a": "`\"JavaScript\".includes(\"Script\")`",
   "d": [
    "`\"JavaScript\".has(\"Script\")`",
    "`\"JavaScript\".contains(\"Script\")`",
    "`\"JavaScript\".exists(\"Script\")`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes extrae la subcadena `\"Script\"` de la cadena `\"JavaScript\"`?",
   "a": "`\"JavaScript\".slice(4)`",
   "d": [
    "`\"JavaScript\".find(5)`",
    "`\"JavaScript\".extract(4)`",
    "`\"JavaScript\".cut(5)`"
   ]
  },
  {
   "q": "¿Cómo conviertes la cadena `\"JavaScript\"` a mayúsculas?",
   "a": "`\"JavaScript\".toUpperCase()`",
   "d": [
    "`\"JavaScript\".upper()`",
    "`\"JavaScript\".toUpper()`",
    "`\"JavaScript\".convertUpper()`"
   ]
  },
  {
   "q": "¿Cómo conviertes la cadena `\"JavaScript\"` a minúsculas?",
   "a": "`\"JavaScript\".toLowerCase()`",
   "d": [
    "`\"JavaScript\".lower()`",
    "`\"JavaScript\".toLower()`",
    "`\"JavaScript\".convertLower()`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes reemplaza `\"dogs\"` por `\"cats\"` en la cadena `\"I love dogs\"`?",
   "a": "`\"I love dogs\".replace(\"dogs\", \"cats\")`",
   "d": [
    "`\"I love dogs\".slice(\"dogs\", \"cats\")`",
    "`\"I love dogs\".replaceWith(\"dogs\", \"cats\")`",
    "`\"I love dogs\".find(\"dogs\", \"cats\")`"
   ]
  },
  {
   "q": "¿Qué método se usa para repetir una cadena un número determinado de veces?",
   "a": "`repeat()`",
   "d": [
    "`times()`",
    "`repeatTimes()`",
    "`repeatNumber()`"
   ]
  },
  {
   "q": "¿Qué devuelve el siguiente código: `\"abc\".repeat(3)`?",
   "a": "`\"abcabcabc\"`",
   "d": [
    "`\"abcabc\"`",
    "`\"abcabcabcabc\"`",
    "Lanza un error."
   ]
  },
  {
   "q": "¿Qué método quita los espacios en blanco al inicio y al final de una cadena?",
   "a": "`trim()`",
   "d": [
    "`strip()`",
    "`removeWhitespace()`",
    "`trimWhitespace()`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la sintaxis correcta para escapar comillas?",
   "a": "```js\n\"She said, \\\"Hello!\\\"\"\n```",
   "d": [
    "```js\n\"She said, ?\"Hello!?\"\"\n```",
    "```js\n\"She said, .\"Hello!.\"\"\n```",
    "```js\n\"She said, //\"Hello!//\"\"\n```"
   ]
  }
 ],
 "quiz-javascript-math": [
  {
   "q": "¿Qué significa `NaN`?",
   "a": "`Not a Number`",
   "d": [
    "`Numeric and Number`",
    "`Not a Null`",
    "`Null and Number`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un operador aritmético de JavaScript?",
   "a": "`??`",
   "d": [
    "`*`",
    "`+`",
    "`-`"
   ]
  },
  {
   "q": "¿Qué pasa si intentas dividir entre cero en JavaScript?",
   "a": "JavaScript da como resultado `Infinity`",
   "d": [
    "JavaScript da como resultado 0.",
    "No pasa nada.",
    "JavaScript lanza un error."
   ]
  },
  {
   "q": "¿Cuál de los siguientes es el uso correcto del operador de exponenciación?",
   "a": "`2**3`",
   "d": [
    "`2*3`",
    "`2#3`",
    "`2%3`"
   ]
  },
  {
   "q": "¿Qué operador debes usar para decrementar una variable en JavaScript?",
   "a": "`--`",
   "d": [
    "`++`",
    "`//`",
    "`**`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un operador a nivel de bits?",
   "a": "`>`",
   "d": [
    "`&`",
    "`|`",
    "`^`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es el operador compuesto correcto para obtener el residuo?",
   "a": "`%=`",
   "d": [
    "`//=`",
    "`\\=`",
    "`%%=`"
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre los operadores `==` y `===`?",
   "a": "El operador `==` solo compara valores, mientras que `===` compara valores y tipos.",
   "d": [
    "No hay diferencia. La comparación siempre da el mismo resultado.",
    "El operador `==` revisa si el tipo de dato es el mismo y `===` revisa si el valor es igual.",
    "El operador `==` solo se usa con tipos primitivos y `===` solo con objetos."
   ]
  },
  {
   "q": "¿Para qué se usa el operador unario de suma (`+`)?",
   "a": "Para convertir su operando en número.",
   "d": [
    "Para restarle uno a un valor.",
    "Para obtener el residuo de una operación.",
    "Para invertir la representación binaria de un número."
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos de `Math` redondea un valor al entero más cercano?",
   "a": "`Math.round()`",
   "d": [
    "`Math.trunc()`",
    "`Math.max()`",
    "`Math.min()`"
   ]
  },
  {
   "q": "¿Qué hace el método `Math.sqrt()`?",
   "a": "Devuelve la raíz cuadrada de un número.",
   "d": [
    "Devuelve un número decimal al azar.",
    "Devuelve el valor absoluto de un número.",
    "Devuelve el cubo de un número."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un método válido del objeto `Math`?",
   "a": "`Math.extend()`",
   "d": [
    "`Math.ceil()`",
    "`Math.pow()`",
    "`Math.abs()`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes devuelve `false`?",
   "a": "`isNaN(7)`",
   "d": [
    "`isNaN(\"Matt\")`",
    "`isNaN()`",
    "`isNaN(undefined)`"
   ]
  },
  {
   "q": "¿Qué hace el método `parseFloat()`?",
   "a": "Analiza una cadena y devuelve un número de punto flotante.",
   "d": [
    "Analiza una cadena y le aplica una operación a nivel de bits.",
    "Analiza una cadena y devuelve `false`.",
    "Analiza una cadena y devuelve un entero."
   ]
  },
  {
   "q": "¿Qué se imprime en la consola?\n\n```js\nlet num = 5;\nconsole.log(++num);\n```",
   "a": "`6`",
   "d": [
    "`error`",
    "`null`",
    "`5`"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconsole.log(5 == '5');\n```",
   "a": "`true`",
   "d": [
    "`undefined`",
    "`false`",
    "`null`"
   ]
  },
  {
   "q": "¿Qué es la precedencia de operadores?",
   "a": "Determina el orden en que se evalúan las operaciones de una expresión.",
   "d": [
    "Sirve para revisar si el valor de la izquierda es menor que el de la derecha.",
    "Sirve para elevar una variable a la potencia indicada y volver a asignarle el resultado.",
    "Sirve para aumentar un valor en uno."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un operador de comparación?",
   "a": "`!>`",
   "d": [
    "`>`",
    "`>=`",
    "`<`"
   ]
  },
  {
   "q": "¿Qué hace el operador unario de negación (`-`)?",
   "a": "Cambia el signo del operando.",
   "d": [
    "Invierte el valor booleano de su operando.",
    "Le resta uno al valor.",
    "Le suma uno al valor."
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un ejemplo del operador de fusión nula (nullish coalescing)?",
   "a": "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme ?? 'light';\n```",
   "d": [
    "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme () 'light';\n```",
    "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme ** 'light';\n```",
    "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme \\\\ 'light';\n```"
   ]
  }
 ],
 "quiz-javascript-comparisons-and-conditionals": [
  {
   "q": "¿Cuál es el resultado de la expresión `undefined > 0`?",
   "a": "`false`",
   "d": [
    "`true`",
    "`undefined`",
    "`null`"
   ]
  },
  {
   "q": "¿Qué operación lógica representa `||`?",
   "a": "OR (o)",
   "d": [
    "XOR (o exclusivo)",
    "AND (y)",
    "NOT (no)"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconsole.log(5 === 2 + 3 || 4 == 2);\n```",
   "a": "`true`",
   "d": [
    "`undefined`",
    "`false`",
    "Se lanza un error."
   ]
  },
  {
   "q": "¿Qué es un valor truthy y uno falsy?",
   "a": "Un valor que se considera `true` o `false` cuando aparece en un contexto booleano.",
   "d": [
    "Un valor que es `true` y `false` a la vez.",
    "Un valor que cambia según el contexto.",
    "Un valor que funciona distinto a los valores `true` o `false`."
   ]
  },
  {
   "q": "¿Qué se imprime en la consola con el siguiente código?\n\n```js\nif (1) {\n  console.log(\"True!\");\n}\n```",
   "a": "`True!`",
   "d": [
    "`false`",
    "No se imprime nada en la consola.",
    "Se lanza un error."
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre `undefined` y `null`?",
   "a": "Las variables sin valor son `undefined`, mientras que `null` representa la ausencia intencional de un valor de objeto.",
   "d": [
    "`null` y `undefined` apuntan a una posición de memoria fuera de rango y no se puede acceder a ellos.",
    "`null` es el valor implícito que se asigna a las variables y no se puede cambiar, mientras que `undefined` es el valor explícito que se les asigna.",
    "`null` es una propiedad global y `undefined` no."
   ]
  },
  {
   "q": "¿Qué pasa si no incluyes `break` al escribir una instrucción `switch`?",
   "a": "El código sigue evaluando los siguientes `case`, aun después de encontrar una coincidencia.",
   "d": [
    "La instrucción `switch` se detiene de golpe.",
    "La instrucción `switch` lanza un error después de la instrucción anterior.",
    "La instrucción `switch` termina después de la primera coincidencia."
   ]
  },
  {
   "q": "¿Qué se imprime en la consola con el siguiente código?\n\n```js\nconst a = 2;\nif (1 == \"1\") {\n  let b = 3;\n  console.log(a + b);\n}\nconsole.log(b);\n```",
   "a": "`5` y después se lanza un error.",
   "d": [
    "Se lanza un error.",
    "```js\n5\n3\n```",
    "```js\n5\nundefined\n```"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código de JavaScript?\n\n```js\nlet vehicle = \"car\";\n\nswitch (vehicle) {\n  case \"bike\":\n    console.log(\"Bikes are two-wheelers.\");\n    break;\n  case \"car\":\n    console.log(\"Some cars are 4x4.\");\n  case \"truck\":\n    console.log(\"Trucks can carry heavy loads.\");\n    break;\n  default:\n    console.log(\"Unknown vehicle.\");\n}\n```",
   "a": "```md\nSome cars are 4x4.\nTrucks can carry heavy loads.\n```",
   "d": [
    "```md\nSome cars are 4x4.\n```",
    "```md\nSome cars are 4x4.\nTrucks can carry heavy loads.\nUnknown vehicle.\n```",
    "```md\nUnknown vehicle.\n```"
   ]
  },
  {
   "q": "¿Qué se imprime en la consola con el siguiente código?\n\n```js\nlet x = 5;\nif (x > 1 && x < 10) {\n  console.log(\"x is between 1 and 10\");\n} else {\n  console.log(\"x is not between 1 and 10\");\n}\n```",
   "a": "`x is between 1 and 10`",
   "d": [
    "Se lanza un error.",
    "No se imprime nada.",
    "`x is not between 1 and 10`"
   ]
  }
 ],
 "quiz-javascript-functions": [
  {
   "q": "¿Cuál de las siguientes es la forma correcta de declarar una función en JavaScript?",
   "a": "```js\nfunction greet() {\n  console.log(\"Hello there!\");\n}\n```",
   "d": [
    "```js\nfunc greet() {\n  console.log(\"Hello there!\");\n}\n```",
    "```js\ndefineFunction greet() {\n  console.log(\"Hello there!\");\n}\n```",
    "```js\ndef greet() {\n  console.log(\"Hello there!\");\n}\n```"
   ]
  },
  {
   "q": "¿Qué pasa cuando llamas (ejecutas) una función?",
   "a": "Se ejecuta el código dentro de la función y se devuelve un valor.",
   "d": [
    "Se ejecuta el código dentro de la función y siempre se devuelve `null`.",
    "No pasa nada al llamar una función.",
    "Se lanza un `TypeError` y el programa falla."
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de llamar una función?",
   "a": "```js\nexampleFunction();\n```",
   "d": [
    "```js\nexampleFunction;\n```",
    "```js\nexampleFunction>>;\n```",
    "```js\n()exampleFunction();\n```"
   ]
  },
  {
   "q": "¿Qué papel tiene la palabra clave `return`?",
   "a": "La palabra clave `return` devuelve un valor desde la función.",
   "d": [
    "La palabra clave `return` ejecuta la función.",
    "La palabra clave `return` lanza un error de tipo.",
    "La palabra clave `return` no sirve de nada en las funciones."
   ]
  },
  {
   "q": "¿Cuál de las siguientes es una expresión de función válida?",
   "a": "```js\nconst getSum = function(x, y) {\n    return x + y;\n};\n```",
   "d": [
    "```js\nexpression function getSum(x, y) {\n    return x + y;\n};\n```",
    "```js\ngetSum: function(x, y) {\n    return x + y;\n};\n```",
    "```js\nfunction = getSum(x, y) {\n    return x + y;\n};\n```"
   ]
  },
  {
   "q": "¿Qué son los argumentos de una función?",
   "a": "Los valores reales que se le pasan a una función al llamarla.",
   "d": [
    "Valores que representan la ausencia de un valor.",
    "Valores especiales que se comportan como funciones anónimas.",
    "Valores de marcador que se usan dentro de la función."
   ]
  },
  {
   "q": "¿Qué son los parámetros de una función?",
   "a": "Los valores que se listan en la definición de la función.",
   "d": [
    "Valores de punto flotante que se usan dentro de la función.",
    "Valores que se le pasan a una función al llamarla.",
    "Valores que representan la ausencia intencional de un valor."
   ]
  },
  {
   "q": "¿Qué se imprime en la consola?\n\n```js\nconst calculateTotal = (amount, taxRate = 0.05) => {\n  return amount + (amount * taxRate);\n};\n\nconsole.log(calculateTotal(100));\n```",
   "a": "`105`",
   "d": [
    "`10`",
    "`undefined`",
    "`1`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la sintaxis correcta de una función flecha?",
   "a": "```js\nconst sum = (num1, num2) => num1 + num2;\n```",
   "d": [
    "```js\nconst sum <<>> (num1, num2) => num1 + num2;\n```",
    "```js\nconst sum === (num1, num2) === num1 + num2;\n```",
    "```js\nconst sum >=> (num1, num2) => num1 + num2;\n```"
   ]
  },
  {
   "q": "¿Cuál es el resultado del siguiente código?\n\n```js\nfunction greet() {\n  const developer = \"Jessica\";\n  console.log(\"Hello there!\");\n}\n\nconsole.log(developer);\n```",
   "a": "Un error de referencia, porque `developer` no está definida en el ámbito global.",
   "d": [
    "No pasa nada y el código se ejecuta normalmente.",
    "Se imprime en la consola la cadena `\"Hello there!\"`.",
    "Se imprime en la consola la cadena `\"Hello!\"`."
   ]
  },
  {
   "q": "¿Cuándo puedes omitir los paréntesis alrededor de los parámetros de una función flecha?",
   "a": "Solo cuando tiene un único parámetro.",
   "d": [
    "Siempre debes omitir los paréntesis alrededor de los parámetros.",
    "Nunca debes omitir los paréntesis en una función flecha.",
    "Solo cuando trabajas con varios parámetros."
   ]
  },
  {
   "q": "¿Cuándo puedes omitir las llaves y la palabra clave `return` en una función flecha?",
   "a": "Cuando el cuerpo de la función es una sola expresión.",
   "d": [
    "Siempre debes omitir las llaves y la palabra clave `return`.",
    "Nunca debes omitir las llaves y la palabra clave `return`.",
    "Cuando el cuerpo de la función tiene varias líneas de código."
   ]
  },
  {
   "q": "¿Qué devuelve la siguiente función?\n\n```js\nfunction exampleFunction() {\n  return \"Hello\";\n  return \"World!\";\n}\n```",
   "a": "`\"Hello\"`",
   "d": [
    "`\"World!\"`",
    "`\"Hello World!\"`",
    "`undefined`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de usar parámetros predeterminados?",
   "a": "```js\nfunction sum(num1, num2 = 12) {\n  return num1 + num2;\n}\n```",
   "d": [
    "```js\nfunction sum(num1, num2 <<>> 12) {\n  return num1 + num2;\n}\n```",
    "```js\nfunction sum(num1, num2 === 12) {\n  return num1 + num2;\n}\n```",
    "```js\nfunction sum(num1, num2 >> 12) {\n  return num1 + num2;\n}\n```"
   ]
  },
  {
   "q": "¿Cuál es el resultado del siguiente código?\n\n```js\nconst developer = \"Jessica\";\n\nfunction greet() {\n  console.log(\"Hello, \" + developer);\n}\n\ngreet();\n```",
   "a": "Se imprime en la consola la cadena `\"Hello, Jessica\"`.",
   "d": [
    "Se imprime en la consola la cadena `\"Hello, developer\"`.",
    "Aparece un mensaje de error en la consola.",
    "No aparece nada en la consola."
   ]
  },
  {
   "q": "¿Qué pasa si quitas las llaves de una función normal?",
   "a": "Obtienes un error de sintaxis.",
   "d": [
    "Aparece en la página un cuadro de alerta con un error.",
    "El programa falla y no vuelve a iniciar.",
    "No pasa nada."
   ]
  },
  {
   "q": "¿Cuál es el resultado del siguiente código?\n\n```js\nconst sum = (num1, num2) => num1 + num2;\nconsole.log(sum(0, 0) + 10);\n```",
   "a": "Se imprime en la consola el número `10`.",
   "d": [
    "Aparece un mensaje de error en la consola.",
    "Se imprime en la consola el número `0`.",
    "No se imprime nada en la consola."
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconst exampleFunction = (param1, param2) => param1 + param2;\nconsole.log(exampleFunction(3, \"Something\"));\n```",
   "a": "`\"3Something\"`",
   "d": [
    "`null`",
    "`undefined`",
    "`3 + \"Something\"`"
   ]
  },
  {
   "q": "¿Cuál es el resultado del siguiente código?\n\n```js\nconst sum = (num1, num2) => num1 + num2;\nconsole.log(sum(0, 0) + num2);\n```",
   "a": "Un mensaje de error que dice que `num2` no está definida.",
   "d": [
    "Un mensaje de error que dice que `num1` no está definida.",
    "Se muestra en la consola el número `0`.",
    "Se muestra `undefined` en la consola."
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconst divideTwoNumbers = (num1, num2) => num1 / num2;\nconsole.log(divideTwoNumbers(3, 0));\n```",
   "a": "`Infinity`",
   "d": [
    "`Error`",
    "`0`",
    "`null`"
   ]
  }
 ],
 "quiz-javascript-arrays": [
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconst numbers = [1, 2, 3];\nconsole.log(numbers[10]);\n```",
   "a": "`undefined`",
   "d": [
    "`[1, 2, 3]`",
    "`null`",
    "`10`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de obtener la cadena `\"Jessica\"` del arreglo `developers`?",
   "a": "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[0]\n```",
   "d": [
    "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[1]\n```",
    "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[2]\n```",
    "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[-1]\n```"
   ]
  },
  {
   "q": "¿Qué valor se asigna a la variable `index`?\n\n```js\nconst numbers = [10, 20, 30, 40];\nconst index = numbers.indexOf(20);\nconsole.log(index);\n```",
   "a": "1",
   "d": [
    "2",
    "3",
    "-1"
   ]
  },
  {
   "q": "¿Qué hace la sintaxis rest?",
   "a": "Reúne los elementos restantes de un arreglo en un arreglo nuevo.",
   "d": [
    "Divide una cadena en un arreglo de subcadenas.",
    "Agrega o quita elementos en cualquier posición de un arreglo.",
    "Agrega elementos al final del arreglo y devuelve la nueva longitud."
   ]
  },
  {
   "q": "¿Qué es la desestructuración de arreglos?",
   "a": "Una forma más concisa y legible de extraer valores de un arreglo y asignarlos a variables.",
   "d": [
    "Una forma de unir todos los elementos de un arreglo en una sola cadena.",
    "Una forma de revisar si un arreglo contiene un valor específico.",
    "Una forma de quitar el último elemento de un arreglo y devolverlo."
   ]
  },
  {
   "q": "¿Qué valor se asigna a la variable `arr2`?\n\n```js\nconst arr1 = [1, 2, 3];\nconst arr2 = [...arr1, 4, 5];\nconsole.log(arr2);\n```",
   "a": "`[1, 2, 3, 4, 5]`",
   "d": [
    "`[4, 5, 1, 2, 3]`",
    "`[1, 2, [3, 4, 5]]`",
    "`[1, 2, 3]`"
   ]
  },
  {
   "q": "¿Qué imprime este código en la consola?\n\n```js\nconst colors = [\"red\", \"blue\", \"green\", \"yellow\"];\ncolors.splice(1, 2, \"purple\");\nconsole.log(colors);\n```",
   "a": "`[\"red\", \"purple\", \"yellow\"]`",
   "d": [
    "`[\"red\", \"blue\", \"green\", \"yellow\"]`",
    "`[\"red\", \"blue\", \"yellow\"]`",
    "`[\"red\", \"yellow\"]`"
   ]
  },
  {
   "q": "¿Qué valor se asigna a la variable `slicedArr`?\n\n```js\nconst arr = [\"apple\", \"banana\", \"cherry\", \"date\"];\nconst slicedArr = arr.slice(1, 3);\nconsole.log(slicedArr);\n```",
   "a": "`[\"banana\", \"cherry\"]`",
   "d": [
    "`[\"apple\", \"banana\"]`",
    "`[\"cherry\", \"date\"]`",
    "`[\"apple\", \"cherry\"]`"
   ]
  },
  {
   "q": "¿Qué método devuelve el primer índice de un elemento en un arreglo?",
   "a": "`indexOf()`",
   "d": [
    "`firstIndex()`",
    "`lastIndex()`",
    "`searchIndex()`"
   ]
  },
  {
   "q": "¿Qué método quita el primer elemento de un arreglo y lo devuelve?",
   "a": "`shift()`",
   "d": [
    "`pop()`",
    "`slice()`",
    "`splice()`"
   ]
  },
  {
   "q": "¿Qué hace el método `concat()`?",
   "a": "Une dos arreglos en un arreglo nuevo.",
   "d": [
    "Une los elementos de un arreglo en una cadena.",
    "Agrega un elemento al inicio de un arreglo.",
    "Quita un elemento del arreglo."
   ]
  },
  {
   "q": "¿Qué imprime este código?\n\n```js\nconst fruits = [\"apple\", \"banana\", \"cherry\", \"apple\", \"orange\"];\n\nfruits.splice(0, 1);\n\nconsole.log(fruits);\n```",
   "a": "`[\"banana\", \"cherry\", \"apple\", \"orange\"]`",
   "d": [
    "`[\"apple\", \"banana\", \"cherry\", \"apple\", \"orange\"]`",
    "`[\"apple\", \"banana\", \"cherry\"]`",
    "`[\"cherry\", 'apple']`"
   ]
  },
  {
   "q": "¿Qué hace el método `includes()`?",
   "a": "Revisa si un arreglo contiene un valor específico.",
   "d": [
    "Divide una cadena en un arreglo de subcadenas.",
    "Une todos los elementos de un arreglo en una sola cadena.",
    "Agrega o quita elementos en cualquier posición de un arreglo."
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos invierte un arreglo en su lugar?",
   "a": "`reverse()`",
   "d": [
    "`reversed()`",
    "`reverseArr()`",
    "`reversing()`"
   ]
  },
  {
   "q": "¿Qué es un arreglo bidimensional?",
   "a": "Un arreglo de arreglos.",
   "d": [
    "Un arreglo que solo contiene literales de objeto.",
    "Un arreglo de longitud fija.",
    "Un arreglo de números de punto flotante."
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre el método `indexOf()` de los arreglos es verdadera?",
   "a": "Devuelve `-1` si no encuentra el elemento.",
   "d": [
    "Siempre devuelve la última aparición del elemento.",
    "Lanza un error si no encuentra el elemento.",
    "Necesita que el arreglo esté ordenado."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un método de arreglos?",
   "a": "`trim()`",
   "d": [
    "`includes()`",
    "`pop()`",
    "`push()`"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconst arr = [\"o\", \"l\", \"l\", \"e\", \"h\"];\nconsole.log(arr.join(\"\"));\n```",
   "a": "`\"olleh\"`",
   "d": [
    "`[\"o\", \"l\", \"l\", \"e\", \"h\"]`",
    "`\"hello\"`",
    "`undefined`"
   ]
  },
  {
   "q": "¿Qué resulta de usar el método `shift()` en un arreglo vacío?",
   "a": "`undefined`",
   "d": [
    "`TypeError`",
    "`[]`",
    "`null`"
   ]
  },
  {
   "q": "¿Qué método devuelve un arreglo nuevo sin cambiar el original?",
   "a": "`slice()`",
   "d": [
    "`shift()`",
    "`pop()`",
    "`push()`"
   ]
  }
 ],
 "quiz-javascript-objects": [
  {
   "q": "¿Cuál de las siguientes NO describe a un objeto en JavaScript?",
   "a": "Un tipo de dato primitivo.",
   "d": [
    "Una colección de pares clave-valor.",
    "Un contenedor de propiedades y métodos.",
    "Un tipo de dato no primitivo."
   ]
  },
  {
   "q": "¿Cuál de las siguientes definiciones de objeto no es válida?",
   "a": "`const product = { color: blue };`",
   "d": [
    "`const book = { \"pages\": 255 };`",
    "`const car = { year: 2025 };`",
    "`const person = { \"name\": \"nora\" };`"
   ]
  },
  {
   "q": "¿Cómo accedes a la propiedad `job` de este objeto `person`?\n\n```js\nlet person = { job: \"Software Developer\" };\n```",
   "a": "`person.job`",
   "d": [
    "`person -> job`",
    "`person#job`",
    "`person[job]`"
   ]
  },
  {
   "q": "¿Cómo accedes a la propiedad `street` del siguiente objeto `person`?\n\n```js\nconst person = {\n  address: {\n    street: \"sample-street\"\n  }\n};\n```",
   "a": "`person[\"address\"][\"street\"]`",
   "d": [
    "`person -> address -> street`",
    "`person#address#street`",
    "`person[address.street]`"
   ]
  },
  {
   "q": "¿Cuál de estas claves de propiedad solo se puede leer con notación de corchetes?",
   "a": "Una clave de propiedad dinámica.",
   "d": [
    "Una clave de propiedad conocida y fija.",
    "Una clave de propiedad anidada en varios niveles del objeto.",
    "Una clave de propiedad que tal vez no exista en el objeto."
   ]
  },
  {
   "q": "¿Cuál de las siguientes usa correctamente la desestructuración para obtener la propiedad `name` del siguiente objeto `person`?\n\n```js\nconst person = { name: \"John\" }\n```",
   "a": "`const { name } = person;`",
   "d": [
    "`const name = person.name;`",
    "`const name = person[\"name\"];`",
    "`const { ...name } = person;`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes usa correctamente la desestructuración para obtener la propiedad `flour` del siguiente objeto `recipe`?\n\n```js\nconst recipe = {\n  ingredients: {\n    flour: \"2 cups\",\n    sugar: \"1 cup\"\n  }\n};\n```",
   "a": "`const { ingredients: { flour } } = recipe;`",
   "d": [
    "`const flour = recipe.ingredients.flour;`",
    "`const flour = recipe[\"ingredients\"][\"flour\"];`",
    "`const { ingredients: flour } = recipe;`"
   ]
  },
  {
   "q": "¿Cómo asignas un valor predeterminado a una clave de propiedad al usar desestructuración en JavaScript?",
   "a": "`const { key = \"defaultValue\" } = object;`",
   "d": [
    "`const key = object.key && \"defaultValue\";`",
    "`const key = object.key || \"defaultValue\";`",
    "`const { key: \"defaultValue\" } = object;`"
   ]
  },
  {
   "q": "¿Cómo revisas si un objeto `car` tiene la propiedad `year`?",
   "a": "`car.hasOwnProperty(\"year\");`",
   "d": [
    "`year.hasProperty(\"car\");`",
    "`car.hasProperty(\"year\");`",
    "`car.hasOwnProperty(year);`"
   ]
  },
  {
   "q": "¿Qué es un método de un objeto?",
   "a": "Una función asociada a un objeto.",
   "d": [
    "Una cadena asociada a un objeto.",
    "Un arreglo asociado a un objeto.",
    "Un número asociado a un objeto."
   ]
  },
  {
   "q": "¿Cómo llamas al método `add` de este objeto `calculator` para sumar los números `10` y `7`?\n\n```js\nconst calculator = {\n  add: function(a, b) {\n    return a + b;\n  }\n};\n```",
   "a": "`calculator.add(10, 7);`",
   "d": [
    "`calculator#add(10, 7);`",
    "`calculator.call(add(10, 7));`",
    "`add.calculator(10, 7);`"
   ]
  },
  {
   "q": "¿Qué operador elimina una propiedad de un objeto?",
   "a": "`delete`",
   "d": [
    "`remove`",
    "`erase`",
    "`discard`"
   ]
  },
  {
   "q": "¿Cómo revisas si existe la propiedad `score` en un objeto `player`?",
   "a": "`\"score\" in player`",
   "d": [
    "`player in \"score\"`",
    "`player in score`",
    "`score in player`"
   ]
  },
  {
   "q": "¿Cómo creas un objeto vacío nuevo en JavaScript?",
   "a": "`new Object()`",
   "d": [
    "`object() new`",
    "`new object()`",
    "`Object() new`"
   ]
  },
  {
   "q": "¿Cuál es la sintaxis correcta del encadenamiento opcional en JavaScript?",
   "a": "`object?.key`",
   "d": [
    "`object?key`",
    "`object.[\"key\"]`",
    "`object.?key`"
   ]
  },
  {
   "q": "¿Para qué se usa el encadenamiento opcional en JavaScript?",
   "a": "Para leer con seguridad propiedades de un objeto que podría ser `null` o `undefined`.",
   "d": [
    "Para definir variables con valores predeterminados.",
    "Para definir métodos opcionales dentro de un objeto que tal vez se llamen o no.",
    "Para escribir código más corto encadenando varias llamadas a métodos en una sola instrucción."
   ]
  },
  {
   "q": "¿Qué método convierte un objeto de JavaScript en una cadena JSON?",
   "a": "`JSON.stringify()`",
   "d": [
    "`Stringify.toJSON()`",
    "`JSON.toObject()`",
    "`Object.toJSON()`"
   ]
  },
  {
   "q": "¿Qué método convierte una cadena JSON de vuelta en un objeto de JavaScript?",
   "a": "`JSON.parse()`",
   "d": [
    "`JSON.toObject()`",
    "`JSON.convert()`",
    "`JSON.object()`"
   ]
  },
  {
   "q": "¿Cuál de estas opciones lee la propiedad `color` de un objeto `toy` con notación de corchetes?",
   "a": "`toy[\"color\"]`",
   "d": [
    "`toy.color`",
    "`toy[color]`",
    "`color[toy]`"
   ]
  },
  {
   "q": "¿Cómo lees el teléfono de casa (`home`) de este objeto `learner` usando notación de punto?\n\n```js\nconst learner = {\n  name: \"Nora\",\n  age: 45,\n  contact: {\n    email: \"nora@email.com\",\n    phone: {\n      home: \"123-456-7890\",\n      work: \"098-765-4321\"\n    }\n  }\n};\n```",
   "a": "`learner.contact.phone.home`",
   "d": [
    "`learner.name.phone.home`",
    "`learner.email.work`",
    "`learner.contact.home`"
   ]
  }
 ],
 "quiz-javascript-loops": [
  {
   "q": "¿Cuál de las siguientes describe mejor la iteración?",
   "a": "Es el proceso de repetir un conjunto de instrucciones varias veces.",
   "d": [
    "Es el proceso de reescribir el código una y otra vez hasta que funcione.",
    "Es una técnica para guardar datos en posiciones de memoria consecutivas.",
    "Es el proceso de enviar señales entre componentes para establecer una conexión."
   ]
  },
  {
   "q": "¿Qué técnica se usa en programación para hacer iteraciones?",
   "a": "Los ciclos (bucles)",
   "d": [
    "La recursión",
    "Las condicionales",
    "La compilación"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un objeto iterable?",
   "a": "String (cadena)",
   "d": [
    "Undefined",
    "Number (número)",
    "Boolean (booleano)"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un tipo de ciclo de JavaScript?",
   "a": "El ciclo `if...else`.",
   "d": [
    "El ciclo `for`.",
    "El ciclo `while`.",
    "El ciclo `for...in`."
   ]
  },
  {
   "q": "¿Cuál es el orden correcto en la declaración de un ciclo `for`?",
   "a": "```javascript\nfor (initialization; condition; increment/decrement) {\n  statement;\n}\n```",
   "d": [
    "```javascript\nfor (condition; increment/decrement; initialization) {\n  statement;\n}\n```",
    "```javascript\nfor (increment/decrement; condition; initialization) {\n  statement;\n}\n```",
    "```javascript\nfor (initialization; increment/decrement; condition) {\n  statement;\n}\n```"
   ]
  },
  {
   "q": "¿Qué ciclo ejecuta su bloque una vez antes de revisar la condición y sigue mientras la condición sea verdadera?",
   "a": "El ciclo `do...while`.",
   "d": [
    "El ciclo `while`.",
    "El ciclo `for...of`.",
    "El ciclo `for...in`."
   ]
  },
  {
   "q": "¿Cuál de los siguientes recorre los valores de un objeto iterable?",
   "a": "El ciclo `for...of`.",
   "d": [
    "El ciclo `for...in`.",
    "El ciclo `for`.",
    "El ciclo `do...while`."
   ]
  },
  {
   "q": "¿Cuál de las siguientes define mejor un ciclo infinito?",
   "a": "Un ciclo cuya condición de término nunca se cumple o no existe.",
   "d": [
    "Un ciclo que se ejecuta hasta que la condición se vuelve falsa.",
    "Un ciclo que se ejecuta una vez y termina.",
    "Un ciclo que se detiene solo después de un número fijo de iteraciones."
   ]
  },
  {
   "q": "¿Cuántas veces se ejecuta el siguiente ciclo?\n\n```js\nfor (let i = 2; i < 10; i+=2) {  \n  console.log(i);  \n}\n```",
   "a": "4",
   "d": [
    "5",
    "9",
    "10"
   ]
  },
  {
   "q": "¿Qué ciclo es el mejor para recorrer objetos?",
   "a": "El ciclo `for...in`.",
   "d": [
    "El ciclo `for...of`.",
    "El ciclo `do...while`.",
    "El ciclo `for`."
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre el ciclo `for...in` y el ciclo `for...of`?",
   "a": "`for...in` recorre los nombres de las propiedades (claves), mientras que `for...of` recorre los valores.",
   "d": [
    "`for...in` recorre los valores, mientras que `for...of` recorre los nombres de las propiedades (claves).",
    "`for...in` crea propiedades nuevas, mientras que `for...of` modifica las existentes.",
    "`for...in` solo funciona con cadenas, mientras que `for...of` funciona con cadenas y números."
   ]
  },
  {
   "q": "¿Cuál de estas causaría un ciclo infinito?",
   "a": "Una condición del ciclo que siempre es verdadera.",
   "d": [
    "La inicialización de la variable.",
    "Una condición del ciclo que en algún momento es falsa.",
    "La lógica de incremento o decremento."
   ]
  },
  {
   "q": "¿Qué instrucción sirve para salir por completo de un ciclo?",
   "a": "La instrucción `break`.",
   "d": [
    "La instrucción `continue`.",
    "La instrucción `label`.",
    "La instrucción `skip`."
   ]
  },
  {
   "q": "¿Qué instrucción sirve para saltar la iteración actual y pasar a la siguiente?",
   "a": "La instrucción `continue`.",
   "d": [
    "La instrucción `break`.",
    "La instrucción `label`.",
    "La instrucción `return`."
   ]
  },
  {
   "q": "¿Qué se imprime en la consola con el siguiente código?\n\n```js\nfor (let i = 0; i < 25; i += 2) {\n  if (i % 5 === 0) {\n    continue;\n  }\n  if (i % 13 === 0) {\n    break;\n  }\n  console.log(i);\n}\n```",
   "a": "`2`, `4`, `6`, `8`, `12`, `14`, `16`, `18`, `22`, `24`",
   "d": [
    "`0`, `2`, `4`, `6`, `8`, `12`, `14`, `16`, `18`, `22`, `24`",
    "`0`, `2`, `4`, `6`, `8`, `12`",
    "`2`, `4`, `6`, `8`, `12`"
   ]
  },
  {
   "q": "¿Qué imprime en la consola el siguiente código?\n\n```javascript\nfor (let i = 1; i < 6; i++) {\n  if (i === 4) break;\n  console.log(i);\n}\n```",
   "a": "`1`, `2`, `3`",
   "d": [
    "`1`, `2`, `3`, `4`, `5`, `6`",
    "`1`, `2`, `3`, `4`, `5`",
    "`1`, `2`, `3`, `4`"
   ]
  },
  {
   "q": "¿Qué se imprime en la consola con el siguiente código?\n\n```javascript\nconst shoppingList = { tomatoes: 4, apples: 10 };\nfor (const item in shoppingList) {\n  console.log(item);\n}\n```",
   "a": "`tomatoes`, `apples`",
   "d": [
    "`tomatoes - 4`, `apples - 10`",
    "`4`, `10`",
    "`tomatoes:4`, `apples:10`"
   ]
  },
  {
   "q": "¿Qué muestra la consola con el siguiente código?\n\n```javascript\nfor (let i = 2; i <= 13; i++) {\n  if (i % 2 === 0) continue;\n  console.log(i);\n}\n```",
   "a": "`3`, `5`, `7`, `9`, `11`, `13`",
   "d": [
    "`2`, `4`, `6`, `8`, `10`, `12`",
    "`1`, `3`, `5`, `7`, `9`, `11`, `13`",
    "`1`, `3`, `5`, `7`, `9`, `11`"
   ]
  },
  {
   "q": "¿Qué se imprime en la consola con el siguiente código?\n\n```javascript\nconst fruits = [\"Mango\", \"Pineapple\", \"Oranges\"];\nfor (const fruit of fruits) {\n  console.log(fruit);\n}\n```",
   "a": "`Mango`, `Pineapple`, `Oranges`",
   "d": [
    "`0`, `1`, `2`",
    "`Pineapple`, `Oranges`, `Mango`",
    "`Oranges`, `Pineapple`, `Mango`"
   ]
  },
  {
   "q": "¿Cuántas veces imprime el siguiente código la cadena `in the loop`?\n\n```javascript\nlet x = 0\nwhile (x < 5) {\n  console.log(\"in the loop\");\n}\n```",
   "a": "Infinitas veces",
   "d": [
    "3 veces",
    "4 veces",
    "5 veces"
   ]
  }
 ],
 "quiz-javascript-fundamentals": [
  {
   "q": "¿Cuál de estas crea un objeto String?",
   "a": "```js\nnew String(\"Hello World\");\n```",
   "d": [
    "```js\nString({ \"Hello World\" });\n```",
    "```js\nString(\"Hello World\");\n```",
    "```js\n\"Hello World\".toString();\n```"
   ]
  },
  {
   "q": "¿Cómo conviertes un objeto String en un literal de cadena?",
   "a": "Con el método `.toString()`.",
   "d": [
    "Con el constructor `String()`.",
    "Con el método `.stringify()`.",
    "Encerrando el objeto `String` entre comillas dobles."
   ]
  },
  {
   "q": "¿Por qué puedes usar `.length`, `.repeat()`, `.concat()` y `.slice()` sobre una cadena primitiva en JavaScript?",
   "a": "JavaScript envuelve temporalmente la cadena primitiva en un objeto String.",
   "d": [
    "Esos métodos existen de forma nativa en las cadenas primitivas.",
    "Internamente, las cadenas primitivas se guardan como objetos.",
    "JavaScript convierte temporalmente la cadena primitiva en un arreglo."
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código en la consola?\n\n```js\nlet stringArray = [8, 9, 10].toString();\nconsole.log(stringArray);\n```",
   "a": "`\"8,9,10\"`",
   "d": [
    "`[8,9,10]`",
    "`[\"8\", \"9\", \"10\"]`",
    "`\"8\", \"9\", \"10\"`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes devuelve un objeto `Number` a partir de la cadena `\"123\"`?",
   "a": "`new Number(\"123\")`",
   "d": [
    "`Object(\"123\")`",
    "`\"123\".toNumber()`",
    "`Number(\"123\")`"
   ]
  },
  {
   "q": "¿Qué devuelven `Number(true)` y `Number(false)`, respectivamente?",
   "a": "`1` y `0`",
   "d": [
    "`undefined` y `undefined`",
    "`NaN` y `NaN`",
    "`true` y `false`"
   ]
  },
  {
   "q": "¿Qué devuelven `Number(undefined)` y `Number(null)`, respectivamente?",
   "a": "`NaN` y `0`",
   "d": [
    "`NaN` y `NaN`",
    "`0` y `0`",
    "`undefined` y `null`"
   ]
  },
  {
   "q": "¿Cuál es el mejor nombre para una variable booleana que indica si un usuario tiene permiso para hacer algo en tu sitio web?",
   "a": "`hasPermission`",
   "d": [
    "`getPermission`",
    "`handlePermission`",
    "`permission`"
   ]
  },
  {
   "q": "¿Cuál es el mejor nombre para una función que se ejecuta cuando el usuario envía un formulario?",
   "a": "`handleSubmit`",
   "d": [
    "`hasSubmitted`",
    "`formSubmit`",
    "`didSubmit`"
   ]
  },
  {
   "q": "¿Qué es un arreglo disperso (sparse array)?",
   "a": "Un arreglo en el que uno o más índices no tienen un valor asignado.",
   "d": [
    "Un arreglo en el que uno o más índices valen `null`.",
    "Un arreglo en el que uno o más índices valen `undefined`.",
    "Un arreglo en el que uno o más índices contienen un literal de objeto vacío."
   ]
  },
  {
   "q": "¿En cuál de los siguientes ejemplos `arr` NO es un arreglo disperso?",
   "a": "```js\nconst arr = Array.from({ length: 5 });\n```",
   "d": [
    "```js\nconst arr = new Array(5);\n```",
    "```js\nconst arr = [1, 2, 3];\narr[4] = 4;\n```",
    "```js\nconst arr = [1, 2, 3, , 5];\n```"
   ]
  },
  {
   "q": "¿Cuál es el propósito principal de un linter?",
   "a": "Detectar posibles errores y problemas en el código.",
   "d": [
    "Dar formato al código automáticamente.",
    "Optimizar el rendimiento del código.",
    "Generar documentación del código."
   ]
  },
  {
   "q": "¿Qué ventaja tiene usar un formateador en un proyecto?",
   "a": "Asegura un estilo de código uniforme.",
   "d": [
    "Permite compilar el código de forma más eficiente.",
    "Convierte el código a un lenguaje de programación específico.",
    "Detecta errores de lógica."
   ]
  },
  {
   "q": "En JavaScript, ¿quién o qué se encarga normalmente de asignar memoria a las variables?",
   "a": "El motor de ejecución.",
   "d": [
    "El desarrollador.",
    "El sistema operativo.",
    "El servidor."
   ]
  },
  {
   "q": "¿Qué se imprime en la consola con el siguiente código?\n\n```js\nfunction trackTotal(initialValue) {\n  let total = initialValue;\n  return function(increment) {\n    total += increment;\n    return total;\n  };\n}\n\nlet track = trackTotal(1);\nconsole.log(track(2));\nconsole.log(track(3));\n```",
   "a": "```js\n3\n6\n```",
   "d": [
    "```js\n2\n5\n```",
    "```js\n2\n3\n```",
    "```js\n5\n6\n```"
   ]
  },
  {
   "q": "¿Qué es el hoisting (elevación) en JavaScript?",
   "a": "El proceso de mover las declaraciones de variables al inicio de su ámbito.",
   "d": [
    "Llevar los errores al inicio del código.",
    "El proceso de crear variables nuevas.",
    "Mover automáticamente las declaraciones `var` al inicio del bloque."
   ]
  },
  {
   "q": "¿Por qué se considera una mala práctica usar `var` en JavaScript moderno?",
   "a": "Sus variables se pueden usar fuera de su bloque.",
   "d": [
    "Son más lentas que `let` y `const`.",
    "Causan errores de sintaxis.",
    "No permiten revisar tipos."
   ]
  },
  {
   "q": "¿Para qué sirven los módulos en JavaScript?",
   "a": "Para organizar el código en unidades reutilizables.",
   "d": [
    "Para mejorar el rendimiento del código.",
    "Para que el código sea más difícil de entender.",
    "Para crear nuevos lenguajes de programación."
   ]
  },
  {
   "q": "¿Cómo agregas el script `app.js` como módulo en un documento HTML?",
   "a": "```html\n<script type=\"module\" src=\"app.js\"></script>\n```",
   "d": [
    "```html\n<script type=\"module/javascript\" src=\"app.js\"></script>\n```",
    "```html\n<script src=\"app.js\"></script>\n```",
    "```html\n<script src=\"app.js\" module></script>\n```"
   ]
  },
  {
   "q": "¿Cuál de los siguientes ejemplos exporta la función `calculateSum` desde el módulo `utils.js` y la importa y usa correctamente en `app.js`?",
   "a": "```js\n// utils.js\nexport function calculateSum(a, b) {\n  return a + b;\n}\n\n// app.js\nimport { calculateSum } from './utils.js';\nconsole.log(calculateSum(2, 3));\n```",
   "d": [
    "```js\n// utils.js\nexport default function calculateSum(a, b) {\n  return a + b;\n}\n\n// app.js\nimport { calculateSum } from './utils.js';\nconsole.log(calculateSum(2, 3));\n```",
    "```js\n// utils.js\nexport function calculateSum(a, b) {\n  return a + b;\n}\n\n// app.js\nimport calculateSum from './utils.js';\nconsole.log(calculateSum(2, 3));\n```",
    "```js\n// utils.js\nfunction calculateSum(a, b) {\n  return a + b;\n}\n\nexport default calculateSum;\n\n// app.js\nimport * as utils from './utils.js';\nconsole.log(utils.calculateSum(2, 3));\n```"
   ]
  }
 ],
 "quiz-javascript-higher-order-functions": [
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre las funciones de orden superior en JavaScript NO es verdadera?",
   "a": "Todas las funciones de JavaScript, incluso las que no reciben ni devuelven otras funciones, se pueden clasificar como funciones de orden superior.",
   "d": [
    "Las funciones de orden superior pueden mejorar mucho la legibilidad y el mantenimiento del código al permitir técnicas de programación funcional.",
    "Funciones de orden superior como map, filter y reduce son herramientas poderosas para manipular arreglos, pero no son exclusivas de la programación funcional.",
    "Las funciones de orden superior pueden hacer el código más difícil de entender, pero también pueden dar soluciones más expresivas y concisas."
   ]
  },
  {
   "q": "En el contexto de las funciones de orden superior, ¿qué es una función fábrica (factory function)?",
   "a": "Una función que devuelve una función nueva según ciertos parámetros",
   "d": [
    "Una función que crea variables nuevas.",
    "Una función que solo trabaja con cadenas.",
    "Una función que genera comentarios de código automáticamente."
   ]
  },
  {
   "q": "Después de ejecutar el código, ¿cuánto valen `forEachRes` y `mapRes`?\n\n```js\nconst numbers = [1, 1, 1, 1, 1];\nlet sum = 0;\nconst forEachRes = numbers.forEach(num => {\n  return (sum += num);\n});\nconst mapRes = numbers.map(num => {\n  return (sum += num);\n});\n```",
   "a": "`forEachRes` es `undefined` y `mapRes` es `[6,7,8,9,10]`",
   "d": [
    "`forEachRes` es `undefined` y `mapRes` es `[1,2,3,4,5]`",
    "`forEachRes` es `0` y `mapRes` es `[1,2,3,4,5]`",
    "`forEachRes` es `5` y `mapRes` es `[1,2,3,4,5]`"
   ]
  },
  {
   "q": "¿Cuál es el resultado de este código?\n\n```js\n[, undefined, 'a', 'b', { 20: 5 }].sort();\n```",
   "a": "```js\n[{ '20': 5 }, 'a', 'b', undefined, empty]\n```",
   "d": [
    "Error, porque el arreglo tiene elementos que no se pueden ordenar.",
    "Error, porque no se pasó una función de comparación.",
    "```js\n[empty, 'a', 'b', undefined, { '20': 5 }]\n```"
   ]
  },
  {
   "q": "¿Cuál de las siguientes describe una función callback en JavaScript?",
   "a": "Una función que se pasa como argumento a otra función para que esta la ejecute como parte de su lógica.",
   "d": [
    "Una función que se llama justo al declararla.",
    "Una función que se invoca con un contexto específico.",
    "Una función que devuelve otra función."
   ]
  },
  {
   "q": "¿Qué resulta de usar `reduce()` en un arreglo?",
   "a": "Depende del valor inicial del acumulador y de la función callback.",
   "d": [
    "Un booleano que indica si algún elemento cumple una condición.",
    "Un arreglo con todos los elementos reducidos por la función callback.",
    "Un arreglo de booleanos."
   ]
  },
  {
   "q": "¿Cómo ordena el método `sort()` números si no se le pasa una función de comparación?",
   "a": "Ordena el arreglo como cadenas según sus unidades de código UTF-16.",
   "d": [
    "Llena los huecos vacíos con `null`.",
    "Devuelve un arreglo de caracteres especiales.",
    "Ordena el arreglo en orden inverso."
   ]
  },
  {
   "q": "¿Para qué sirve el método `some()` en JavaScript?",
   "a": "Para saber si algún elemento de un arreglo pasa una prueba.",
   "d": [
    "Para crear un arreglo nuevo con el resultado de aplicar una función a cada elemento.",
    "Para recorrer un arreglo sin producir un resultado.",
    "Para reducir un arreglo a un solo valor con una función callback."
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un ejemplo válido de encadenamiento de métodos?",
   "a": "```js\nstr.toLowerCase().trim().replace(' ', '_');\n```",
   "d": [
    "```js\nMath.random();\n```",
    "```js\narray.push(1).pop();\n```",
    "```js\nconsole.log('Hello');\n```"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nlet numbers = [2, 4, 8, 10];\n\nnumbers.forEach(function(number) {\n    console.log(number % 2);\n});\n```",
   "a": "`0 0 0 0`",
   "d": [
    "`2 4 8 10`",
    "`null null null null`",
    "`1 2 4 5`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es una ventaja del encadenamiento de métodos?",
   "a": "Simplifica la sintaxis y hace el código más legible al permitir varias operaciones en una sola expresión.",
   "d": [
    "Por sí mismo mejora el rendimiento al reducir el tiempo de ejecución de las funciones.",
    "Elimina la necesidad de variables temporales, aunque puede usar más memoria en algunos casos.",
    "Hace que el manejo de errores y la depuración sean más sencillos."
   ]
  },
  {
   "q": "¿Cómo ordenas un arreglo de objetos por una propiedad con el método `sort`?",
   "a": "Con una función de comparación que compare los valores de esa propiedad.",
   "d": [
    "El método `sort` no puede ordenar objetos.",
    "Usando el método `reverse` después de ordenar.",
    "Convirtiendo los objetos a cadenas y ordenándolas."
   ]
  },
  {
   "q": "Al encadenar métodos, ¿qué práctica común ayuda a la claridad y la depuración?",
   "a": "Dividir las cadenas largas en varios pasos.",
   "d": [
    "Usar menos métodos en la cadena.",
    "Evitar encadenar métodos que solo devuelven valores primitivos.",
    "Usar solo métodos integrados."
   ]
  },
  {
   "q": "¿Qué desventaja puede tener abusar del encadenamiento de métodos?",
   "a": "Puede hacer el código más difícil de depurar.",
   "d": [
    "Hace que el código se ejecute más lento.",
    "Impide usar comentarios.",
    "Hace que el archivo pese más."
   ]
  },
  {
   "q": "¿Qué método usarías para saber si todos los elementos de un arreglo son cadenas?",
   "a": "`every()`",
   "d": [
    "`some()`",
    "`everyInstance()`",
    "`filter()`"
   ]
  },
  {
   "q": "¿Cuánto vale `originalArray` después de ejecutar el siguiente código?\n\n```js\nconst originalArray = [{ id: 1 }, { id: 2 }, { id: 3 }];\nconst filteredArray = originalArray.filter(item => item.id > 1);\nfilteredArray[0].id = 4;\n```",
   "a": "`[{ id: 1 }, { id: 4 }, { id: 3 }]`",
   "d": [
    "`[{ id: 1 }, { id: 2 }, { id: 3 }]`",
    "`[{ id: 1 }]`",
    "`[{ id: 4 }, { id: 2 }, { id: 3 }]`"
   ]
  },
  {
   "q": "¿Cuánto vale `shortWords` después de ejecutar el siguiente código?\n\n```js\nconst words = ['apple', 'banana', 'pear', 'kiwi'];\nconst shortWords = words.filter(word => word.length <= 5);\n```",
   "a": "`['apple', 'pear', 'kiwi']`",
   "d": [
    "`[]`",
    "`['pear', 'kiwi']`",
    "`['apple', 'banana']`"
   ]
  },
  {
   "q": "¿Para qué sirve pasarle un valor inicial al método `reduce()`?",
   "a": "Para definir el valor con que empieza el acumulador.",
   "d": [
    "Para fijar la longitud del arreglo.",
    "Para limitar el número de iteraciones.",
    "Para indicar el tipo de dato que devuelve la función."
   ]
  },
  {
   "q": "¿Se puede usar el método `map` en objetos que no son arreglos?",
   "a": "No, está diseñado específicamente para arreglos.",
   "d": [
    "Sí, se puede usar en cualquier objeto.",
    "Sí, pero solo en objetos con propiedades numéricas.",
    "Depende de la versión de JavaScript."
   ]
  },
  {
   "q": "¿Cuál es el propósito principal del método `map` en JavaScript?",
   "a": "Crear un arreglo nuevo con el resultado de llamar una función sobre cada elemento del arreglo original.",
   "d": [
    "Ordenar un arreglo y devolver uno nuevo conservando el orden original.",
    "Filtrar elementos de un arreglo y quitar o agregar elementos según una condición.",
    "Encontrar un elemento en un arreglo y devolver su índice junto con el elemento."
   ]
  }
 ],
 "quiz-dom-manipulation-and-click-event-with-javascript": [
  {
   "q": "¿Qué es el Document Object Model (DOM)?",
   "a": "Una interfaz de programación que te permite interactuar con documentos HTML.",
   "d": [
    "Un lenguaje de programación para interactuar con una página HTML.",
    "Un conjunto de objetos que solo contienen números de punto flotante.",
    "Un conjunto de clases de JavaScript que representan los elementos HTML."
   ]
  },
  {
   "q": "¿Qué significa API?",
   "a": "Application Programming Interface (interfaz de programación de aplicaciones)",
   "d": [
    "Additional Programming Interface",
    "Adding Programming Interface",
    "Another Programming Interface"
   ]
  },
  {
   "q": "¿Cómo usas JavaScript para encontrar todos los enlaces (anchors) de HTML que no tienen hipervínculo?",
   "a": "```js\ndocument.querySelectorAll(\"a:not([href])\");\n```",
   "d": [
    "```js\ndocument.querySelectorAll(\"link![href]\");\n```",
    "```js\ndocument.querySelectorAll(\"link:not([href])\");\n```",
    "```js\ndocument.querySelectorAll(\"a![href]\");\n```"
   ]
  },
  {
   "q": "¿Qué hace la propiedad `textContent`?",
   "a": "Devuelve el contenido de texto plano de un elemento.",
   "d": [
    "Quita el contenido de texto de todos los elementos HTML.",
    "Quita el contenido de texto de tu archivo JavaScript.",
    "Agrega texto a todos los arreglos y objetos de tu archivo JavaScript."
   ]
  },
  {
   "q": "¿Qué hace la propiedad `innerHTML`?",
   "a": "Es una propiedad de `Element` que sirve para asignar o actualizar partes del marcado HTML.",
   "d": [
    "Es una propiedad de `Element` que sirve para obtener todo el texto de un elemento HTML.",
    "Es una propiedad de `Element` que sirve para agregar anotaciones a tu HTML.",
    "Es una propiedad de `Element` que sirve para disparar eventos en tu HTML."
   ]
  },
  {
   "q": "¿Cuál de los siguientes agrega un detector de eventos válido?",
   "a": "```js\nbtn.addEventListener(\"click\", () => alert(\"You clicked the button\"));\n```",
   "d": [
    "```js\nbtn.addEventListener(\"accept\", () => alert(\"You clicked the button\"));\n```",
    "```js\nbtn.addEventListener(\"allow\", () => alert(\"You clicked the button\"));\n```",
    "```js\nbtn.addEventListener(\"trigger\", () => alert(\"You clicked the button\"));\n```"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un método válido del objeto `document`?",
   "a": "`addElementToDOM()`",
   "d": [
    "`getElementById()`",
    "`querySelector()`",
    "`createElement()`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes asigna el atributo `class` con el valor `my-class`?",
   "a": "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"class\", \"my-class\");\n```",
   "d": [
    "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"set\", \"class\");\n```",
    "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"remove\", \"my-class\");\n```",
    "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"add\", \"class\");\n```"
   ]
  },
  {
   "q": "¿Qué es el objeto `Event`?",
   "a": "Es la información que se genera cuando el usuario interactúa de alguna forma con tu página web.",
   "d": [
    "Es un objeto especial para quitar eventos de tu proyecto de JavaScript.",
    "Sirve para agregar eventos automáticamente a tus proyectos de JavaScript.",
    "Es un objeto especial para trabajar con arreglos."
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos quita un detector de eventos que se agregó antes con `addEventListener()`?",
   "a": "`removeEventListener()`",
   "d": [
    "`removalOfEventListener()`",
    "`removedEventListener()`",
    "`removingEventListener()`"
   ]
  },
  {
   "q": "¿Qué son los manejadores de eventos en línea (inline)?",
   "a": "Atributos especiales de un elemento HTML que ejecutan código JavaScript cuando ocurre un evento.",
   "d": [
    "Atributos especiales de un elemento HTML que cancelan todos los eventos.",
    "Atributos especiales de un elemento HTML que solo sirven para enviar formularios desde tu código JavaScript.",
    "Atributos especiales de un elemento HTML que sirven para quitar eventos."
   ]
  },
  {
   "q": "¿Cuáles son las dos categorías principales de las APIs web?",
   "a": "APIs del navegador y APIs de terceros.",
   "d": [
    "APIs de Java y APIs de terceros.",
    "APIs del navegador y APIs de Rust.",
    "APIs del sistema y APIs de terceros."
   ]
  },
  {
   "q": "¿Qué evento se dispara cuando el navegador terminó de analizar todos los elementos de la página HTML?",
   "a": "`DOMContentLoaded`",
   "d": [
    "`load`",
    "`DOMLoaded`",
    "`HTMLContentLoaded`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes propiedades representa el estilo en línea de un elemento?",
   "a": "`style`",
   "d": [
    "`content`",
    "`event`",
    "`load`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de usar un manejador de eventos en línea?",
   "a": "`<button onclick=\"validate()\">Validate</button>`",
   "d": [
    "`<button eventclick=\"validate()\">Validate</button>`",
    "`<button click=\"validate()\">Validate</button>`",
    "`<button clickevent=\"validate()\">Validate</button>`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos sirve para retrasar una acción un tiempo determinado?",
   "a": "`setTimeout()`",
   "d": [
    "`setInterval()`",
    "`delay()`",
    "`sleep()`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes permite crear y controlar animaciones directamente desde JavaScript?",
   "a": "Web Animations API",
   "d": [
    "Allow Animations API",
    "Control Animations API",
    "Create Animations API"
   ]
  },
  {
   "q": "¿Qué hace la Canvas API?",
   "a": "Sirve para manipular gráficos desde tu archivo JavaScript.",
   "d": [
    "Sirve para animar gráficos en tu archivo CSS.",
    "Sirve solo para quitar gráficos de tu archivo JavaScript.",
    "Sirve para quitar gráficos de tu archivo HTML."
   ]
  },
  {
   "q": "¿Qué es la delegación de eventos?",
   "a": "Escuchar en un elemento padre los eventos que suben (burbujean) desde sus hijos.",
   "d": [
    "Escuchar eventos cuando un evento se cancela.",
    "Escuchar eventos cuando ocurre un clic.",
    "Escuchar eventos cuando ocurre un evento change."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un método que puedas usar con diálogos y ventanas modales?",
   "a": "`removeModal()`",
   "d": [
    "`show()`",
    "`close()`",
    "`showModal()`"
   ]
  }
 ],
 "quiz-js-a11y": [
  {
   "q": "¿Qué atributo de accesibilidad indica si un control está expandido o contraído?",
   "a": "`aria-expanded`",
   "d": [
    "`aria-controlled`",
    "`aria-controls`",
    "`aria-expands`"
   ]
  },
  {
   "q": "¿Qué dos atributos se pueden combinar con `aria-expanded` para relacionar programáticamente el elemento que controla con el elemento controlado?",
   "a": "`aria-controls` y `aria-owns`",
   "d": [
    "`aria-labelledBy` y `aria-owns`",
    "`aria-controls` y `aria-label`",
    "`aria-live` y `aria-owns`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes atributos crea una región dinámica (live region) en la página para avisar a los usuarios de lectores de pantalla de los cambios en el contenido en cuanto ocurren?",
   "a": "`aria-live`",
   "d": [
    "`aria-live-regions`",
    "`aria-lives`",
    "`aria-live-region`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes elementos `div` estará deshabilitado solo para quienes usan tecnologías de asistencia, como lectores de pantalla?",
   "a": "```html\n<div role=\"button\" tabindex=\"-1\" aria-disabled=\"true\">Edit</div>\n```",
   "d": [
    "```html\n<div role=\"button\" tabindex=\"-1\" aria-disables=\"true\">Edit</div>\n```",
    "```html\n<div role=\"button\" tabindex=\"-1\" aria-disabling=\"true\">Edit</div>\n```",
    "```html\n<div role=\"button\" tabindex=\"-1\" aria-disable=\"true\">Edit</div>\n```"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un uso válido del atributo `aria-expanded`?",
   "a": "```html\n<button aria-expanded=\"true\">Menu</button>\n```",
   "d": [
    "```html\n<button aria-expanded=\"expand\">Menu</button>\n```",
    "```html\n<button aria-expanded=\"allow\">Menu</button>\n```",
    "```html\n<button aria-expanded=\"set\">Menu</button>\n```"
   ]
  },
  {
   "q": "¿Qué atributo crea una relación programática entre un elemento que controla y el elemento de la página al que afecta?",
   "a": "`aria-controls`",
   "d": [
    "`aria-set`",
    "`aria-region`",
    "`aria-expanded`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un uso común de las regiones dinámicas?",
   "a": "Mensajes que se muestran antes de hacer una acción (como un diálogo de confirmación).",
   "d": [
    "Mensajes que se muestran después de hacer una acción (como un error o una confirmación).",
    "Contenido que se actualiza periódicamente (como un ticker, una marquesina o una cuenta regresiva).",
    "Mensajes de estado generales (como el avance de un proceso)."
   ]
  },
  {
   "q": "¿Cuál de los siguientes ejemplos indica correctamente qué pestaña está seleccionada?",
   "a": "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-selected=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-selected=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-selected=\"false\">Tab 3</button>\n</div>\n```",
   "d": [
    "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-selecting=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-selecting=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-selecting=\"false\">Tab 3</button>\n</div>\n```",
    "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-select=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-select=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-select=\"false\">Tab 3</button>\n</div>\n```",
    "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-selects=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-selects=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-selects=\"false\">Tab 3</button>\n</div>\n```"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un valor válido del atributo `aria-live`?",
   "a": "`on`",
   "d": [
    "`off`",
    "`polite`",
    "`assertive`"
   ]
  },
  {
   "q": "¿Qué valor del atributo `aria-live` indica que la actualización es muy importante y tiene la máxima prioridad?",
   "a": "`assertive`",
   "d": [
    "`now`",
    "`immediate`",
    "`urgent`"
   ]
  }
 ],
 "quiz-debugging-javascript": [
  {
   "q": "¿Qué tipo de error ocurre cuando se usa una variable antes de definirla?",
   "a": "`ReferenceError`",
   "d": [
    "`SyntaxError`",
    "`LogicalError`",
    "`RangeError`"
   ]
  },
  {
   "q": "¿Qué instrucción de JavaScript sirve para pausar a propósito la ejecución del código al depurar?",
   "a": "`debugger`",
   "d": [
    "`try...catch`",
    "`console.log()`",
    "`alert()`"
   ]
  },
  {
   "q": "¿Qué método de la consola muestra los datos en forma de tabla?",
   "a": "`console.table()`",
   "d": [
    "`console.log()`",
    "`console.warn()`",
    "`console.error()`"
   ]
  },
  {
   "q": "¿Cómo revisas las solicitudes de red en las herramientas para desarrolladores de Chrome?",
   "a": "Con la pestaña \"Network\".",
   "d": [
    "Con la pestaña \"Network Links\".",
    "Con la pestaña \"Console\".",
    "Con la pestaña \"Sources\"."
   ]
  },
  {
   "q": "¿Cuál es la sintaxis correcta de `try...catch` en JavaScript?",
   "a": "`try { ... } catch(error) { ... }`",
   "d": [
    "`try { ... } else { ... }`",
    "`try { ... } stack(catch) { ... }`",
    "`try { ... } error { ... }`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un ejemplo de `SyntaxError`?",
   "a": "Olvidar una coma entre los elementos de un arreglo.",
   "d": [
    "Usar una variable antes de declararla.",
    "Usar una variable dos veces en el mismo ámbito.",
    "Usar una variable fuera de su ámbito."
   ]
  },
  {
   "q": "¿Para qué sirven los puntos de interrupción (breakpoints) al depurar JavaScript?",
   "a": "Para pausar la ejecución en un punto específico.",
   "d": [
    "Para corregir errores del código automáticamente.",
    "Para evitar que el código se ejecute.",
    "Para imprimir mensajes en la consola."
   ]
  },
  {
   "q": "¿Qué pasa cuando se ejecuta la instrucción `throw`?",
   "a": "Se lanza una excepción y se ejecuta el bloque `catch` (si existe).",
   "d": [
    "El programa termina de inmediato e ignora el resto del código.",
    "La instrucción throw imprime un error en la consola pero no detiene la ejecución.",
    "Pausa la ejecución hasta que se reanude desactivando los puntos de interrupción."
   ]
  },
  {
   "q": "¿Qué método usarías para inspeccionar variables o expresiones al depurar con las herramientas para desarrolladores?",
   "a": "`console.log()`",
   "d": [
    "`inspect()`",
    "`trace()`",
    "`console.error()`"
   ]
  },
  {
   "q": "¿Qué tipo de error ocurre al ejecutar el siguiente código?\n\n```js\nfunction example() {\n  console.log(a);\n  let a = 5;\n}\n\nexample();\n```",
   "a": "`ReferenceError`",
   "d": [
    "`FunctionError`",
    "`SyntaxError`",
    "Desbordamiento de pila (stack overflow)"
   ]
  },
  {
   "q": "¿Qué herramienta se usa normalmente para avanzar por el código línea por línea al depurar?",
   "a": "Los puntos de interrupción de las herramientas para desarrolladores.",
   "d": [
    "`console.log()`",
    "`alert()`",
    "La instrucción `throw`."
   ]
  },
  {
   "q": "¿Qué tipo de error ocurre al intentar leer una propiedad de `undefined`?",
   "a": "`TypeError`",
   "d": [
    "`SyntaxError`",
    "`LogicalError`",
    "`RangeError`"
   ]
  },
  {
   "q": "¿Qué hace el bloque `finally` en una instrucción `try...catch`?",
   "a": "Se ejecuta siempre, haya errores o no.",
   "d": [
    "Solo se ejecuta si hay un error.",
    "No se ejecuta si se activa el `catch`.",
    "Sale del bloque de código de inmediato."
   ]
  },
  {
   "q": "¿Qué resulta de ejecutar el siguiente código?\n\n```js\nconst arr = [];\narr.length = -1; \n```",
   "a": "El código lanza un `RangeError`.",
   "d": [
    "El código lanza un `SyntaxError`.",
    "El código imprime un arreglo vacío en la consola.",
    "El código lanza un error de memoria insuficiente."
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre la instrucción `debugger` de JavaScript es verdadera?",
   "a": "La instrucción `debugger` se ignora cuando las herramientas para desarrolladores no están abiertas.",
   "d": [
    "El navegador siempre ignora la instrucción `debugger`.",
    "La instrucción `debugger` envía un reporte de error al servidor.",
    "La instrucción `debugger` siempre recarga la página y limpia la consola."
   ]
  },
  {
   "q": "¿Cuál es el propósito principal del \"profiling\" (perfilado) en JavaScript?",
   "a": "Encontrar cuellos de botella de rendimiento registrando el uso de CPU, las llamadas a funciones y el tiempo de ejecución.",
   "d": [
    "Escribir pruebas unitarias para funciones de JavaScript y crear perfiles de la ejecución.",
    "Pausar la ejecución y liberar recursos como memoria y CPU.",
    "Convertir el código JavaScript a código máquina para que corra más rápido."
   ]
  },
  {
   "q": "Al depurar, ¿qué es un \"watcher\" (expresión vigilada)?",
   "a": "Una herramienta para seguir el valor de las variables.",
   "d": [
    "Una herramienta para pausar la ejecución.",
    "Una función integrada para registrar errores.",
    "Un método de JavaScript para manejar excepciones."
   ]
  },
  {
   "q": "¿Cuándo debes usar `console.error()` en lugar de `console.log()`?",
   "a": "Para registrar mensajes de error.",
   "d": [
    "Para mostrar datos en tabla.",
    "Para registrar mensajes solo mientras depuras.",
    "Para registrar información sobre el navegador."
   ]
  },
  {
   "q": "¿Qué hace el constructor `Error()` en JavaScript?",
   "a": "Crea un objeto de error nuevo que se puede lanzar.",
   "d": [
    "Imprime mensajes de error en la consola.",
    "Ejecuta código en un entorno aislado.",
    "Termina el programa."
   ]
  },
  {
   "q": "¿Para qué sirve el método `console.dir()` en JavaScript?",
   "a": "Para mostrar una lista jerárquica e interactiva de las propiedades de un objeto de JavaScript.",
   "d": [
    "Para crear una carpeta aparte de registros para cada tipo de error.",
    "Para generar una representación visual de la consola y guardarla en un PDF.",
    "Para detener el programa y mostrar un error sobre el uso de memoria y CPU."
   ]
  }
 ],
 "quiz-javascript-regular-expressions": [
  {
   "q": "¿Cuál de las siguientes NO es una expresión regular válida?",
   "a": "```js\n\"hello, world!\"\n```",
   "d": [
    "```js\n/hello, world!/i\n```",
    "```js\nnew RegExp(\"hello, world!\")\n```",
    "```js\n/(?:^|\\s)hello[,]?\\sworld[!]?(?:$|\\s)/i\n```"
   ]
  },
  {
   "q": "¿Qué `RegExp` tiene el mismo patrón que la expresión regular `/f[o0]{2} b[a4@]r/i`?",
   "a": "```js\nnew RegExp(\"f[o0]{2} b[a4@]r\", \"i\")\n```",
   "d": [
    "```js\nnew RegExp(\"/f[o0]{2} b[a4@]r/\", \"i\")\n```",
    "```js\nnew RegExp(\"f[o0]{2} b[a4@]r\", \"g\")\n```",
    "```js\nnew RegExp(\"f[o0]{2} b[a4@]r\")\n```"
   ]
  },
  {
   "q": "¿Qué tipo de valor devuelve el método `test` de las expresiones regulares?",
   "a": "Un booleano que indica si la cadena coincide con la expresión regular.",
   "d": [
    "Un arreglo con las cadenas que coincidieron con la expresión regular.",
    "Un objeto con información sobre la (sub)cadena que coincidió.",
    "`null`; el método `test` solo revisa que la expresión regular sea válida."
   ]
  },
  {
   "q": "¿Qué hace el método `match` cuando recibe una expresión regular sin banderas?",
   "a": "Busca la primera coincidencia completa y devuelve un arreglo con esa coincidencia.",
   "d": [
    "Busca todas las cadenas que coinciden con la expresión regular y devuelve TODAS en un arreglo.",
    "Busca la primera coincidencia completa y devuelve el índice donde empieza.",
    "Busca la primera coincidencia completa y devuelve un booleano que indica si la encontró."
   ]
  },
  {
   "q": "¿Cuál es el mejor uso de `test`?",
   "a": "Revisar si una cadena coincide con la expresión regular.",
   "d": [
    "Verificar una expresión regular.",
    "Obtener información detallada de una coincidencia, como su longitud.",
    "Extraer todas las coincidencias de una cadena."
   ]
  },
  {
   "q": "¿Para qué se usa `replace`?",
   "a": "Para reemplazar una coincidencia por otra cadena.",
   "d": [
    "Para reemplazar la expresión regular actual por una nueva.",
    "Para reemplazar, dado un índice y una cadena, el carácter de ese índice por la cadena.",
    "Para quitar de una cadena todas las apariciones de una subcadena."
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre `match` y `matchAll`?",
   "a": "`match` devuelve un arreglo con las cadenas que coinciden, mientras que `matchAll` devuelve un iterador con todas las coincidencias encontradas.",
   "d": [
    "`match` siempre devuelve una cadena, mientras que `matchAll` siempre devuelve un arreglo de coincidencias.",
    "`match` devuelve un booleano que indica si hubo coincidencia, mientras que `matchAll` devuelve el número de coincidencias.",
    "`match` devuelve el índice de la primera coincidencia, mientras que `matchAll` devuelve un arreglo con los índices de todas."
   ]
  },
  {
   "q": "¿Cuál de los siguientes es el uso correcto de `replaceAll`?",
   "a": "```js\nfoo.replaceAll(/foobar/g, \"fizzbuzz\")\n```",
   "d": [
    "```js\nfoo.replaceAll(/foobar/, \"fizzbuzz\")\n```",
    "```js\nfoo.replaceAll(/foobar/i, \"fizzbuzz\")\n```",
    "```js\nfoo.replaceAll(/foobar/gi, /fizzbuzz/)\n```"
   ]
  },
  {
   "q": "¿Cuál de las siguientes clases de caracteres equivale a la expresión regular `/[a-zA-Z0-9_]/`?",
   "a": "`\\w`",
   "d": [
    "`\\d`",
    "`\\s`",
    "`\\n`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes clases de caracteres es la más adecuada para extraer los dígitos de un número de teléfono?",
   "a": "`\\d`",
   "d": [
    "`\\w`",
    "`\\s`",
    "`\\D`"
   ]
  },
  {
   "q": "¿Qué pasa cuando se usa una búsqueda anticipada (lookahead) `(?=)` en una expresión regular?",
   "a": "Revisa a la derecha de la posición actual que el subpatrón SÍ esté presente.",
   "d": [
    "Revisa a la izquierda de la posición actual que el subpatrón SÍ esté presente.",
    "Es un patrón alternativo que se usa cuando el patrón principal no coincide.",
    "Revisa a la derecha de la posición actual que el subpatrón NO esté presente."
   ]
  },
  {
   "q": "Al escribir una expresión regular, ¿dónde va una búsqueda hacia atrás (lookbehind) `(?<=)`?",
   "a": "A la izquierda del patrón principal de la expresión regular.",
   "d": [
    "En cualquier parte de la expresión regular.",
    "A la derecha del patrón principal de la expresión regular.",
    "Debe incluir el patrón principal de la expresión regular."
   ]
  },
  {
   "q": "¿Qué cuantificador coincide con el elemento anterior cero o una vez?",
   "a": "`?`",
   "d": [
    "`+`",
    "`*`",
    "`a{0,}`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes expresiones regulares solo acepta números entre 0 y 999,999?",
   "a": "`/^\\d{1,6}$/`",
   "d": [
    "`/^\\d{6}$/`",
    "`/^\\d{0, 999999}$/`",
    "`/^\\d+$/`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre la clase de caracteres personalizada (`[]`) es verdadera?",
   "a": "Define un conjunto propio de caracteres con los que coincidir.",
   "d": [
    "Es un conjunto de caracteres que se quitan de la coincidencia.",
    "Define un conjunto de caracteres sin tener que escapar ningún carácter especial.",
    "Representa un conjunto de caracteres en forma Unicode."
   ]
  },
  {
   "q": "¿Cuál de las siguientes clases de caracteres coincide correctamente con el alfabeto en mayúsculas?",
   "a": "`[A-Z]`",
   "d": [
    "`\\w`",
    "`[a-z]`",
    "`[AZ]`"
   ]
  },
  {
   "q": "¿Qué pasa cuando se usa un grupo de captura `(...)` en una expresión regular?",
   "a": "El grupo intenta coincidir con su subpatrón y continúa guardando el resultado en memoria.",
   "d": [
    "El grupo se evalúa de inmediato, sin importar dónde esté en la expresión regular.",
    "El grupo intenta coincidir con su subpatrón y continúa sin guardar el resultado.",
    "El grupo es un subpatrón con prioridad que termina en cuanto encuentra una coincidencia."
   ]
  },
  {
   "q": "¿Qué pasa cuando se usa un grupo sin captura `(?:...)` en una expresión regular?",
   "a": "El grupo intenta coincidir con su subpatrón y continúa sin guardar el resultado en memoria.",
   "d": [
    "El grupo intenta coincidir con su subpatrón y continúa guardando el resultado en memoria.",
    "El grupo termina en cuanto encuentra una coincidencia para su subpatrón.",
    "El grupo se considera opcional, así que solo se agrega al resultado si coincide."
   ]
  },
  {
   "q": "Con la siguiente expresión regular, ¿cuál de estas pruebas devuelve `true`?\n\n```js\nconst regex = /(cat)\\s+\\1/i;\n```",
   "a": "```js\nregex.test(\"cat   cat\");\n```",
   "d": [
    "```js\nregex.test(\"cat dog cat\");\n```",
    "```js\nregex.test(\"catcat\");\n```",
    "```js\nregex.test(\"cat\\s+cat\");\n```"
   ]
  },
  {
   "q": "¿Qué hace el comodín (`.`) en una expresión regular?",
   "a": "Coincide con cualquier carácter excepto el salto de línea.",
   "d": [
    "Coincide solo con espacios en blanco.",
    "Coincide con el inicio de la cadena.",
    "Coincide con un solo dígito."
   ]
  }
 ],
 "quiz-form-validation-with-javascript": [
  {
   "q": "¿Qué método revisa si el valor de un elemento `input` cumple sus reglas de validación?",
   "a": "`checkValidity()`",
   "d": [
    "`validateInput()`",
    "`isValid()`",
    "`checkValue()`"
   ]
  },
  {
   "q": "¿Qué pasa si el método `checkValidity()` encuentra un `input` no válido?",
   "a": "Devuelve `false` sin mostrarle ningún mensaje de error al usuario.",
   "d": [
    "El formulario se envía automáticamente.",
    "La página se recarga automáticamente.",
    "Se borra el valor del `input`."
   ]
  },
  {
   "q": "¿Qué método sirve para personalizar el mensaje que aparece cuando falla la validación?",
   "a": "`setCustomValidity()`",
   "d": [
    "`setErrorMessage()`",
    "`setValidationMessage()`",
    "`customMessage()`"
   ]
  },
  {
   "q": "¿Qué hace por defecto la validación con los campos obligatorios al enviar el formulario?",
   "a": "El navegador detiene el envío si hay campos obligatorios vacíos.",
   "d": [
    "El formulario se envía aunque haya campos obligatorios vacíos.",
    "El formulario se envía pero muestra una advertencia.",
    "El formulario borra los valores de los `input`."
   ]
  },
  {
   "q": "¿Qué acción NO hace que se revisen los errores de un formulario HTML?",
   "a": "Hacer clic en un botón de restablecer (reset).",
   "d": [
    "Cambiar el valor de un `input`.",
    "Enviar el formulario.",
    "Llamar a `reportValidity()`."
   ]
  },
  {
   "q": "¿Qué devuelve `checkValidity()` cuando todos los campos del formulario son válidos?",
   "a": "`true`",
   "d": [
    "`false`",
    "`undefined`",
    "`null`"
   ]
  },
  {
   "q": "¿Qué significa que `patternMismatch` sea `true`?",
   "a": "El valor no coincide con el atributo `pattern`.",
   "d": [
    "El campo está vacío.",
    "El valor es demasiado largo.",
    "El campo está deshabilitado."
   ]
  },
  {
   "q": "¿Qué pasa si se llama a `reportValidity()` y un campo no pasa la validación?",
   "a": "Se resalta el campo no válido y aparece un mensaje.",
   "d": [
    "El formulario se envía sin error.",
    "Se borran los valores de los `input`.",
    "El formulario se cierra de inmediato."
   ]
  },
  {
   "q": "¿Qué acción activa la validación integrada del navegador?",
   "a": "Enviar el formulario.",
   "d": [
    "Restablecer el formulario.",
    "Cambiar el valor de un `input`.",
    "Hacer clic en un enlace."
   ]
  },
  {
   "q": "¿Para qué sirve llamar a `checkValidity()` antes de enviar un formulario?",
   "a": "Para revisar que todos los elementos `input` cumplan sus restricciones.",
   "d": [
    "Para enviar el formulario automáticamente.",
    "Para recargar la página.",
    "Para borrar todos los campos `input`."
   ]
  },
  {
   "q": "¿Cuál es el propósito principal de `e.preventDefault()`?",
   "a": "Detener la acción predeterminada de un evento.",
   "d": [
    "Recargar el formulario.",
    "Borrar los datos del formulario.",
    "Restablecer los valores del formulario."
   ]
  },
  {
   "q": "¿Qué hace `e.preventDefault()` en el evento submit de un formulario?",
   "a": "Evita que el formulario se envíe.",
   "d": [
    "Envía el formulario.",
    "Borra todos los campos del formulario.",
    "Deshabilita el formulario temporalmente."
   ]
  },
  {
   "q": "¿En qué caso es más útil `e.preventDefault()`?",
   "a": "Al enviar un formulario sin que la página se recargue.",
   "d": [
    "Al manejar el clic de un botón que envía un formulario.",
    "Al cerrar un diálogo modal.",
    "Al abrir una página nueva."
   ]
  },
  {
   "q": "¿Qué pasa si olvidas llamar a `e.preventDefault()` en el evento submit de un formulario?",
   "a": "El formulario se envía y la página se recarga.",
   "d": [
    "Todos los campos regresan a sus valores predeterminados.",
    "El formulario no se envía.",
    "Se pierden los datos del formulario."
   ]
  },
  {
   "q": "¿Qué comportamiento predeterminado se puede evitar con `e.preventDefault()`?",
   "a": "El que provoca enviar un formulario.",
   "d": [
    "Editar un formulario.",
    "Dibujar el formulario.",
    "Recargar el formulario."
   ]
  },
  {
   "q": "¿Qué dispara el evento submit de un formulario?",
   "a": "Hacer clic en su botón de enviar o presionar <kbd>Enter</kbd>.",
   "d": [
    "Cambiar un campo de texto.",
    "Restablecer el formulario.",
    "Borrar la acción del formulario."
   ]
  },
  {
   "q": "¿Dónde se suele manejar el evento submit en JavaScript?",
   "a": "En el propio elemento del formulario.",
   "d": [
    "En un campo de texto.",
    "En cualquier campo del formulario.",
    "En un botón fuera del formulario."
   ]
  },
  {
   "q": "¿Qué hace por defecto el evento submit?",
   "a": "Envía los datos del formulario al servidor indicado en el atributo action.",
   "d": [
    "Valida el formulario pero no lo envía.",
    "Borra los campos del formulario.",
    "Cancela el envío del formulario."
   ]
  },
  {
   "q": "¿Qué evento debes escuchar para manejar los datos del formulario al enviarlo con JavaScript?",
   "a": "`\"submit\"`",
   "d": [
    "`\"input\"`",
    "`\"change\"`",
    "`\"focus\"`"
   ]
  },
  {
   "q": "¿Cuál es el valor predeterminado del atributo `method` de un formulario HTML?",
   "a": "`\"GET\"`",
   "d": [
    "`\"POST\"`",
    "`\"UPDATE\"`",
    "`\"PUT\"`"
   ]
  }
 ],
 "quiz-javascript-dates": [
  {
   "q": "¿Para qué se usa el objeto `Date` de JavaScript?",
   "a": "Para trabajar con fechas y horas.",
   "d": [
    "Para trabajar solo con fechas.",
    "Para trabajar solo con horas.",
    "Para trabajar solo con años bisiestos."
   ]
  },
  {
   "q": "¿Qué código crea una nueva instancia de `Date`?",
   "a": "`new Date()`",
   "d": [
    "`Date.new()`",
    "`Date.fetch()`",
    "`new.Date()`"
   ]
  },
  {
   "q": "¿Cómo funciona `Date.now()`?",
   "a": "Devuelve la hora actual en milisegundos desde el 1 de enero de 1970.",
   "d": [
    "Devuelve la hora actual en nanosegundos desde el 4 de julio de 1776.",
    "Devuelve la hora anterior en milisegundos desde el 1 de enero de 1974.",
    "Devuelve la fecha actual en minutos desde el 1 de enero de 1970."
   ]
  },
  {
   "q": "¿Qué método devuelve el año actual?",
   "a": "`getFullYear()`",
   "d": [
    "`getNewYear()`",
    "`getLastYear()`",
    "`getLeapYear()`"
   ]
  },
  {
   "q": "¿Qué método devuelve el mes actual como un entero que empieza en cero?",
   "a": "`getMonth()`",
   "d": [
    "`getCalendar()`",
    "`fetchMonth()`",
    "`get.Month()`"
   ]
  },
  {
   "q": "¿Qué método convierte una fecha en cadena?",
   "a": "`toString()`",
   "d": [
    "`getMonth()`",
    "`formatDate()`",
    "`toStingy()`"
   ]
  },
  {
   "q": "Si hoy es 12 de junio de 2022, ¿qué imprime `console.log(new Date().getFullYear());`?",
   "a": "`\"2022\"`",
   "d": [
    "`\"June 12th 2022\"`",
    "`\"2023\"`",
    "`\"06/12/2022\"`"
   ]
  },
  {
   "q": "¿Qué representa `fr-FR` en `date.toLocaleDateString(\"fr-FR\")`?",
   "a": "La configuración regional de Francia (francés).",
   "d": [
    "La configuración regional franco-canadiense.",
    "La configuración regional franco-italiana.",
    "La configuración regional franco-finlandesa."
   ]
  },
  {
   "q": "¿Qué imprime `console.log(new Date(\"2014-10-15\").getDate());`?",
   "a": "`15`",
   "d": [
    "`10`",
    "`2014`",
    "`2014-10-15`"
   ]
  },
  {
   "q": "¿En qué formato devuelve una fecha el método `toISOString()`?",
   "a": "En una cadena con formato ISO-8601.",
   "d": [
    "En una cadena con formato USA-863.",
    "En una cadena con formato MP3.",
    "En una cadena con formato UTC."
   ]
  },
  {
   "q": "¿Cómo se ve una fecha en formato ISO-8601?",
   "a": "YYYY-MM-DDTHH:mm:ss.sssZ",
   "d": [
    "DD-MM-YYYY",
    "DD-MM-YYTHH",
    "YYYY-MM-DDTHH:mm:ssZ"
   ]
  },
  {
   "q": "¿A qué mes corresponde `console.log(new Date(2003, 6, 27).getMonth());`?",
   "a": "Julio",
   "d": [
    "Junio",
    "Abril",
    "Enero"
   ]
  },
  {
   "q": "¿Cómo das formato a una fecha según la configuración regional o de forma más legible?",
   "a": "`.toLocaleDateString()`",
   "d": [
    "`.toLocaleDate()`",
    "`.toLocaleString()`",
    "`.toDateString()`"
   ]
  },
  {
   "q": "¿Qué configuración regional usa `toLocaleDateString()` si no se le pasa el parámetro `locales`?",
   "a": "La configuración regional del sistema del usuario.",
   "d": [
    "Inglés (Gran Bretaña).",
    "La más cercana a Estados Unidos.",
    "Francés (Francia)."
   ]
  },
  {
   "q": "¿Qué se asigna a `now` en el siguiente código?\n\n```js\nconst now = new Date();\n```",
   "a": "La fecha y hora actuales según el reloj de tu computadora.",
   "d": [
    "La hora actual en milisegundos desde el 1 de enero de 1990.",
    "La fecha actual en milisegundos menos la época Unix.",
    "La hora actual en nanosegundos desde el 1 de enero de 1990."
   ]
  },
  {
   "q": "¿Qué imprime `console.log(new Date(2003, 6, 27).getFullYear());`?",
   "a": "`2003`",
   "d": [
    "`\"27/6/2003\"`",
    "`27`",
    "`6`"
   ]
  },
  {
   "q": "¿Qué devuelve `getDate` cuando la fecha no es válida?",
   "a": "`NaN`",
   "d": [
    "`0`",
    "`null`",
    "`undefined`"
   ]
  },
  {
   "q": "Si estamos en octubre, ¿qué imprime `console.log(new Date().getMonth());`?",
   "a": "`9`",
   "d": [
    "`1`",
    "`3`",
    "`10`"
   ]
  },
  {
   "q": "¿Qué opción imprime `2021` con el siguiente objeto?\n\n```js\nconst d = new Date(\"2021-12-25\");\n```",
   "a": "`console.log(d.getFullYear())`",
   "d": [
    "`console.log(d.getTime())`",
    "`console.log(d.toUTCString())`",
    "`console.log(d.getDate())`"
   ]
  },
  {
   "q": "¿Qué opción imprime `\"2021-12-25T00:00:00.000Z\"` con el siguiente objeto?\n\n```js\nconst d = new Date(\"2021-12-25\");\n```",
   "a": "`console.log(d.toISOString())`",
   "d": [
    "`console.log(d.getFullYear())`",
    "`console.log(d.toUTCString())`",
    "`console.log(d.getTime())`"
   ]
  }
 ],
 "quiz-javascript-audio-and-video": [
  {
   "q": "¿Para qué sirve el constructor `Audio()` en JavaScript?",
   "a": "Para crear un nuevo elemento `audio`.",
   "d": [
    "Para crear un nuevo archivo de audio.",
    "Para reproducir un archivo de audio existente.",
    "Para modificar archivos de audio."
   ]
  },
  {
   "q": "¿Qué método inicia la reproducción de un elemento `audio` o `video`?",
   "a": "`play()`",
   "d": [
    "`start()`",
    "`begin()`",
    "`resume()`"
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre los métodos `pause()` y `play()` de los elementos multimedia?",
   "a": "`pause()` detiene la reproducción conservando la posición actual, mientras que `play()` la inicia.",
   "d": [
    "`pause()` devuelve una promesa y `play()` no.",
    "Después de `pause()` no se puede reanudar, mientras que `play()` puede empezar desde cualquier posición.",
    "`pause()` regresa automáticamente al inicio y `play()` empieza desde donde se pausó."
   ]
  },
  {
   "q": "¿Qué formato de audio es compatible con más navegadores?",
   "a": "`MP3`",
   "d": [
    "`FLAC`",
    "`OGG`",
    "`WAV`"
   ]
  },
  {
   "q": "¿Para qué sirve el elemento `source` dentro de un elemento `audio` o `video`?",
   "a": "Para indicar varias fuentes del medio en distintos formatos.",
   "d": [
    "Para indicar el volumen del medio.",
    "Para agregar subtítulos al medio.",
    "Para enlazar un procesador de audio externo."
   ]
  },
  {
   "q": "¿Cuáles son los dos tipos MIME posibles del formato MP4?",
   "a": "`audio/mp4` y `video/mp4`",
   "d": [
    "`mp4/audio` y `mp4/video`",
    "`audio/mpeg4` y `video/mpeg4`",
    "`mp4/mpeg` y `mp4/stream`"
   ]
  },
  {
   "q": "En audio y video, ¿qué hace un códec?",
   "a": "Convierte el medio entre formato analógico y digital.",
   "d": [
    "Sube el volumen del medio.",
    "Cambia el formato de archivo del medio.",
    "Cifra el medio para transmitirlo de forma segura."
   ]
  },
  {
   "q": "¿Qué API permite crear, procesar y analizar audio en aplicaciones web?",
   "a": "Web Audio API.",
   "d": [
    "Audio Processing API.",
    "Sound Manipulation API.",
    "Media Stream API."
   ]
  },
  {
   "q": "¿Para qué sirve el método `getUserMedia()`?",
   "a": "Para acceder a la cámara y/o el micrófono del usuario.",
   "d": [
    "Para autenticar usuarios con un servicio multimedia.",
    "Para obtener las preferencias de reproducción del usuario.",
    "Para descargar archivos multimedia al dispositivo del usuario."
   ]
  },
  {
   "q": "¿Qué propiedad de la interfaz `HTMLMediaElement` representa el tiempo de reproducción actual?",
   "a": "`currentTime`",
   "d": [
    "`time`",
    "`playbackPosition`",
    "`currentPosition`"
   ]
  },
  {
   "q": "¿Qué hace el siguiente fragmento de código?\n\n```javascript\nconst audio = new Audio('song.mp3');\naudio.loop = true;\n```",
   "a": "Hace que el audio se repita indefinidamente.",
   "d": [
    "Reproduce el archivo de audio una vez.",
    "Sube el volumen del audio.",
    "Pausa el audio después de una repetición."
   ]
  },
  {
   "q": "¿Qué significa MIME?",
   "a": "Multipurpose Internet Mail Extensions",
   "d": [
    "Multiple Internet Message Extensions",
    "Mail Internet Multimedia Extensions",
    "Multimedia Internet Mail Extensions"
   ]
  },
  {
   "q": "¿Para qué te sirve el método `canPlayType()`?",
   "a": "Para saber si es probable que el navegador pueda reproducir un formato de audio específico.",
   "d": [
    "Para saber si el navegador está reproduciendo audio en un formato específico.",
    "Para verificar si un archivo multimedia está en la caché del navegador y se puede reproducir.",
    "Para comprobar si un elemento de audio tiene controles y si el usuario tiene permiso para usarlos."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un evento válido de la API `HTMLMediaElement`?",
   "a": "`stopped`",
   "d": [
    "`waiting`",
    "`canplay`",
    "`ended`"
   ]
  },
  {
   "q": "¿Qué evento de `HTMLMediaElement` se dispara cuando la reproducción se detiene para cargar datos (buffering)?",
   "a": "`waiting`",
   "d": [
    "`stopped`",
    "`pause`",
    "`buffering`"
   ]
  },
  {
   "q": "¿Qué interfaz de la Web Audio API representa un grafo de procesamiento de audio?",
   "a": "`AudioContext`",
   "d": [
    "`AudioNode`",
    "`AudioBuffer`",
    "`AudioListener`"
   ]
  },
  {
   "q": "¿Para qué sirve la API Media Source Extensions?",
   "a": "Permite pasar directamente la imagen de la cámara web del usuario a un elemento de video",
   "d": [
    "Para agregar efectos visuales a un video.",
    "Para convertir entre distintos formatos multimedia.",
    "Para que JavaScript sincronice varias pistas de audio."
   ]
  },
  {
   "q": "¿Cuándo se dispara el evento `ended`?",
   "a": "Cuando se llega al final del medio.",
   "d": [
    "Cuando cambia la fuente del medio.",
    "Cuando se llama al método `pause()`.",
    "Cuando el medio se detiene manualmente."
   ]
  },
  {
   "q": "¿Cómo se usa la Screen Capture API?",
   "a": "Llamando al método `getDisplayMedia()`.",
   "d": [
    "Mediante la interfaz `window.screenCapture`",
    "Con la propiedad `navigator.capture`",
    "Con el método `captureScreen()`"
   ]
  },
  {
   "q": "¿Con qué se asocia el formato WMV?",
   "a": "Windows Media Player",
   "d": [
    "Wide Media Video",
    "World Media Video",
    "Web Media Player"
   ]
  }
 ],
 "quiz-javascript-maps-and-sets": [
  {
   "q": "¿Qué es un Set en JavaScript?",
   "a": "Una colección en la que cada valor solo puede aparecer una vez.",
   "d": [
    "Una estructura de datos que permite valores repetidos.",
    "Una estructura de datos que solo guarda cadenas y números.",
    "Una colección que no permite borrar sus elementos."
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos existe en Map pero no en Set?",
   "a": "`set()`",
   "d": [
    "`has()`",
    "`clear()`",
    "`values()`"
   ]
  },
  {
   "q": "¿Qué método se usa para agregar elementos a un Set?",
   "a": "`.add()`",
   "d": [
    "`.push()`",
    "`.append()`",
    "`.insert()`"
   ]
  },
  {
   "q": "¿Cómo revisas si un Set contiene cierto valor?",
   "a": "`.has()`",
   "d": [
    "`.contains()`",
    "`.hasValue()`",
    "`.find()`"
   ]
  },
  {
   "q": "¿Cuál de estos es un muy buen uso de un Set?",
   "a": "Eliminar los valores repetidos de un arreglo.",
   "d": [
    "Manejar pares clave-valor en una base de datos.",
    "Crear listas ordenadas de elementos.",
    "Guardar estructuras jerárquicas en el localStorage del navegador."
   ]
  },
  {
   "q": "¿Qué es un WeakSet en JavaScript?",
   "a": "Una colección parecida a Set que solo guarda objetos.",
   "d": [
    "Una colección parecida a Set que solo permite tipos primitivos.",
    "Una colección parecida a Set que permite valores repetidos.",
    "Una colección parecida a Set que no permite quitar valores."
   ]
  },
  {
   "q": "¿Cuál es una diferencia entre Set y WeakSet?",
   "a": "Un Set puede guardar cualquier tipo de valor, mientras que un WeakSet solo guarda objetos.",
   "d": [
    "Un WeakSet puede guardar cualquier tipo de valor, incluso números.",
    "Un Set no permite valores repetidos, pero un WeakSet sí.",
    "Un Set permite la recolección de basura y un WeakSet no."
   ]
  },
  {
   "q": "¿Qué es un Map en JavaScript?",
   "a": "Una colección de pares clave-valor de cualquier tipo.",
   "d": [
    "Una colección que solo permite valores únicos.",
    "Una colección que solo puede usar cadenas como claves.",
    "Una colección que no permite borrar sus elementos."
   ]
  },
  {
   "q": "¿Qué método se usa para agregar pares clave-valor a un Map?",
   "a": "`.set()`",
   "d": [
    "`.append()`",
    "`.add()`",
    "`.insert()`"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconst myMap = new Map();\nmyMap.set('a', 1);\nmyMap.set('a', 2);\nconsole.log(myMap.get('a'));\n```",
   "a": "`2`",
   "d": [
    "`1`",
    "`undefined`",
    "`null`"
   ]
  },
  {
   "q": "¿En qué se diferencia un Map de un objeto en JavaScript?",
   "a": "Un Map acepta claves de cualquier tipo, pero un objeto solo acepta cadenas y símbolos.",
   "d": [
    "Un Map solo acepta números como claves.",
    "Los objetos aceptan claves de cualquier tipo, mientras que los Map solo aceptan cadenas.",
    "Los Map no se pueden recorrer y los objetos sí."
   ]
  },
  {
   "q": "¿Cómo quitas un par clave-valor de un Map?",
   "a": "`.delete()`",
   "d": [
    "`.remove()`",
    "`.deleteKey()`",
    "`.erase()`"
   ]
  },
  {
   "q": "¿Qué devuelve la propiedad `size` de un Map?",
   "a": "El número de pares clave-valor del Map.",
   "d": [
    "El número de índices del Map.",
    "El número de valores únicos del Map.",
    "La memoria total que ocupa el Map."
   ]
  },
  {
   "q": "¿Qué es un WeakMap en JavaScript?",
   "a": "Una colección parecida a Map con referencias débiles a sus claves.",
   "d": [
    "Una colección parecida a Map que acepta valores primitivos como claves.",
    "Una colección parecida a Map que impide borrar elementos.",
    "Una colección parecida a Map que ordena sus claves automáticamente."
   ]
  },
  {
   "q": "¿Cuál es una diferencia entre Map y WeakMap?",
   "a": "Un Map se puede recorrer y un WeakMap no.",
   "d": [
    "Un Map solo acepta tipos primitivos como claves y un WeakMap solo objetos.",
    "Un Map permite la recolección de basura y un WeakMap no.",
    "Un WeakMap permite claves repetidas y un Map no."
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos NO existe en un WeakMap?",
   "a": "`.size()`",
   "d": [
    "`.has()`",
    "`.set()`",
    "`.delete()`"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconst set = new Set([1, 2, 3]);\nset.delete(2);\nconsole.log(set.has(2));\n```",
   "a": "`false`",
   "d": [
    "`true`",
    "`undefined`",
    "`2`"
   ]
  },
  {
   "q": "¿Cómo recorres los valores de un Set?",
   "a": "Con el método `.forEach()`.",
   "d": [
    "Con el método `.map()`.",
    "Con el método `.reduce()`.",
    "Con el método `.filter()`."
   ]
  },
  {
   "q": "¿Qué dos métodos de Set devuelven un `SetIterator` con los valores del Set?",
   "a": "`keys()` y `values()`",
   "d": [
    "`entries()` y `values()`",
    "`forEach()` y `values()`",
    "`has()` y `add()`"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nconst map = new Map([[\"a\", 1], [\"b\", 2]]);\nmap.clear();\nconsole.log(map.size);\n```",
   "a": "`0`",
   "d": [
    "`2`",
    "`1`",
    "`undefined`"
   ]
  }
 ],
 "quiz-local-storage-and-crud": [
  {
   "q": "En desarrollo web, ¿qué significa CRUD?",
   "a": "Create, Read, Update, Delete (crear, leer, actualizar, borrar).",
   "d": [
    "Create, Replace, Undo, Delete (crear, reemplazar, deshacer, borrar).",
    "Connect, Remove, Update, Display (conectar, quitar, actualizar, mostrar).",
    "Copy, Retrieve, Update, Delete (copiar, recuperar, actualizar, borrar)."
   ]
  },
  {
   "q": "¿Qué método HTTP se asocia normalmente con la operación Create en una API REST?",
   "a": "`POST`",
   "d": [
    "`GET`",
    "`PUT`",
    "`DELETE`"
   ]
  },
  {
   "q": "¿Qué operación CRUD se hace normalmente al modificar un registro existente de una base de datos?",
   "a": "Update (actualizar)",
   "d": [
    "Read (leer)",
    "Delete (borrar)",
    "Create (crear)"
   ]
  },
  {
   "q": "En la Web Storage API, ¿cuál es la diferencia principal entre localStorage y sessionStorage?",
   "a": "Los datos de localStorage se conservan hasta que se borran explícitamente, mientras que los de sessionStorage se borran al terminar la sesión de la página.",
   "d": [
    "localStorage guarda los datos en memoria y sessionStorage en disco.",
    "sessionStorage es más rápido que localStorage para leer datos.",
    "Los datos de localStorage solo duran una sesión, mientras que los de sessionStorage se conservan entre sesiones."
   ]
  },
  {
   "q": "¿Qué método se usa para guardar datos en localStorage?",
   "a": "`localStorage.setItem()`",
   "d": [
    "`localStorage.setData()`",
    "`localStorage.saveItem()`",
    "`localStorage.storeData()`"
   ]
  },
  {
   "q": "¿Cómo quitas un solo elemento de sessionStorage?",
   "a": "`sessionStorage.removeItem('key')`",
   "d": [
    "`sessionStorage.clearItem('key')`",
    "`sessionStorage.remove('key')`",
    "`sessionStorage.deleteItem('key')`"
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre `PUT` y `PATCH`?",
   "a": "`PUT` reemplaza el recurso completo, mientras que `PATCH` actualiza campos específicos.",
   "d": [
    "`PUT` modifica campos específicos, mientras que `PATCH` reemplaza el recurso completo.",
    "`PUT` solo agrega recursos nuevos, mientras que `PATCH` actualiza los existentes.",
    "`PUT` sirve para obtener datos y `PATCH` para enviarlos."
   ]
  },
  {
   "q": "¿Para qué sirve el almacenamiento en caché (Cache Storage)?",
   "a": "Para guardar recursos de red que se piden con frecuencia, lo que reduce los tiempos de carga y mejora el rendimiento.",
   "d": [
    "Para guardar de forma permanente y segura las credenciales del usuario en el navegador para autenticarse.",
    "Para guardar grandes volúmenes de datos estructurados en el navegador con un sistema de base de datos.",
    "Para seguir las sesiones y preferencias del usuario guardando pares clave-valor accesibles desde varios sitios web."
   ]
  },
  {
   "q": "En desarrollo web, ¿qué es una cookie?",
   "a": "Un pequeño dato que guarda el navegador del usuario.",
   "d": [
    "Un tipo de solicitud HTTP.",
    "Un fragmento de código que se ejecuta en el navegador.",
    "Una forma de guardar archivos grandes en un servidor."
   ]
  },
  {
   "q": "¿Cuál de los siguientes se usa para crear una cookie manualmente en JavaScript?",
   "a": "`document.cookie`",
   "d": [
    "`document.setCookie`",
    "`document.cookie.set`",
    "`document.createCookie`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes fragmentos borra correctamente una cookie llamada `username`?",
   "a": "`document.cookie = \"username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\";`",
   "d": [
    "`document.cookie.delete(\"username\");`",
    "`document.removeCookie(\"username\");`",
    "`cookie.delete(\"username\");`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre las cookies es falsa?",
   "a": "Las cookies solo las puede crear el servidor.",
   "d": [
    "Las cookies de sesión caducan al cerrar el navegador.",
    "JavaScript no puede leer las cookies HttpOnly.",
    "Las cookies Secure solo se envían por HTTPS."
   ]
  },
  {
   "q": "¿Qué es el fingerprinting (huella digital) del navegador?",
   "a": "Una forma de rastrear a los usuarios mediante atributos del navegador y del dispositivo.",
   "d": [
    "Una técnica para identificar usuarios por su dirección IP.",
    "Una forma de cifrado de datos.",
    "Una forma de guardar datos en la caché del navegador."
   ]
  },
  {
   "q": "¿Cuál es el riesgo principal de guardar contraseñas en localStorage?",
   "a": "localStorage no está cifrado y se puede leer fácilmente.",
   "d": [
    "Los datos de localStorage se borran al cerrar la pestaña.",
    "Los datos de localStorage se pierden al borrar las cookies.",
    "localStorage no funciona sin conexión."
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre el almacenamiento del lado del cliente es verdadera?",
   "a": "Permite que los sitios web guarden datos en el dispositivo del usuario.",
   "d": [
    "Guarda los datos como objetos en lugar de cadenas.",
    "Usa servicios en la nube para sincronizar los datos del usuario entre dispositivos.",
    "Es más seguro que el almacenamiento del lado del servidor."
   ]
  },
  {
   "q": "¿Cuál es la ventaja principal de usar IndexedDB en lugar de localStorage?",
   "a": "IndexedDB maneja más datos y consultas más complejas.",
   "d": [
    "IndexedDB no necesita el consentimiento del usuario para guardar datos.",
    "IndexedDB tiene una API más sencilla.",
    "IndexedDB funciona en todos los navegadores."
   ]
  },
  {
   "q": "¿Cuál de las siguientes es una forma válida de leer datos de un almacén de objetos (object store) en IndexedDB?",
   "a": "Usar `get()` sobre la referencia al almacén.",
   "d": [
    "Llamar a `retrieve()` sobre el almacén de objetos.",
    "Usar `query()` para leer registros específicos.",
    "Usar el método `fetch()`."
   ]
  },
  {
   "q": "¿Qué tipo de transacciones admite IndexedDB?",
   "a": "Transacciones de lectura y de escritura.",
   "d": [
    "Solo transacciones de lectura.",
    "Solo transacciones asíncronas.",
    "Solo transacciones síncronas."
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre el ciclo de vida de un Service Worker es verdadera?",
   "a": "Un Service Worker puede interceptar solicitudes de red una vez que se activa.",
   "d": [
    "Los Service Workers se ejecutan en el hilo principal de la aplicación web.",
    "Los Service Workers se pueden activar antes de instalarse.",
    "Los Service Workers solo funcionan mientras la aplicación web está abierta en el navegador."
   ]
  },
  {
   "q": "¿Qué afirmación describe mejor una característica clave de las Progressive Web Apps (PWA)?",
   "a": "Las PWA funcionan sin conexión gracias a los Service Workers.",
   "d": [
    "Las PWA solo se pueden instalar en dispositivos móviles.",
    "Las PWA necesitan forzosamente un servidor back-end.",
    "Las PWA solo se pueden abrir en ciertos navegadores."
   ]
  }
 ],
 "quiz-javascript-classes": [
  {
   "q": "¿Para qué sirve una clase en JavaScript?",
   "a": "Para crear plantillas reutilizables de objetos.",
   "d": [
    "Para definir solo propiedades, no métodos.",
    "Para definir solo variables estáticas.",
    "Para organizar solo datos primitivos."
   ]
  },
  {
   "q": "¿Cómo defines una clase en JavaScript?",
   "a": "Con la palabra clave `class`.",
   "d": [
    "Con la palabra clave `className`.",
    "Con la palabra clave `object`.",
    "Solo con la palabra clave `constructor`."
   ]
  },
  {
   "q": "¿Qué método de una clase se usa para inicializar sus propiedades?",
   "a": "`constructor`",
   "d": [
    "`static`",
    "`init`",
    "`define`"
   ]
  },
  {
   "q": "¿Qué representa `this` dentro del constructor de una clase?",
   "a": "Una instancia de la clase.",
   "d": [
    "El objeto global de la clase.",
    "La función misma.",
    "Una referencia indefinida."
   ]
  },
  {
   "q": "¿Cómo se comporta `this` en una función flecha dentro de un método de una clase?",
   "a": "Toma el valor de `this` del ámbito donde se define la función.",
   "d": [
    "Toma el valor de `this` de la función más cercana en otro ámbito.",
    "Se refiere a una instancia recién creada de la clase.",
    "Toma el valor de `this` del objeto global en modo estricto."
   ]
  },
  {
   "q": "¿Cuál es el propósito principal de la palabra clave `extends`?",
   "a": "Crear una subclase que hereda de una clase padre.",
   "d": [
    "Definir métodos estáticos en el constructor de la clase padre.",
    "Crear un método en una clase.",
    "Inicializar propiedades predeterminadas en la clase padre."
   ]
  },
  {
   "q": "¿Cuál de los siguientes ejemplos crea una clase `Car` que hereda de la clase `Vehicle`?",
   "a": "`class Car extends Vehicle {}`",
   "d": [
    "`class Car uses Vehicle {}`",
    "`class Car = Vehicle {}`",
    "`class Car inherits Vehicle {}`"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```javascript\nclass Animal {\n  speak() {\n    return \"Animal speaks\";\n  }\n}\n\nclass Dog extends Animal {\n  speak() {\n    return \"Dog barks\";\n  }\n}\n\nconst myDog = new Dog();\nconsole.log(myDog.speak());\n```",
   "a": "`Dog barks`",
   "d": [
    "`Animal speaks`",
    "Se lanza un error.",
    "`undefined`"
   ]
  },
  {
   "q": "¿Qué hace la palabra clave `super` en una subclase?",
   "a": "Llama al constructor o a los métodos de la clase padre.",
   "d": [
    "Crea una nueva instancia de la clase padre.",
    "Borra métodos y propiedades de la clase padre.",
    "Da acceso solo a los métodos estáticos de la clase padre."
   ]
  },
  {
   "q": "¿Cuál de las siguientes describe un método estático?",
   "a": "Un método que pertenece a la clase misma, no a sus instancias.",
   "d": [
    "Un método al que no se puede acceder dentro de la clase.",
    "Un método que solo se usa en funciones flecha.",
    "Un método propio de cada instancia de la clase."
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nclass Calculator {\n  static add(a, b) {\n    return a + b;\n  }\n}\n\nconsole.log(Calculator.add(3, 4));\n```",
   "a": "`7`",
   "d": [
    "Se lanza un error.",
    "`undefined`",
    "`NaN`"
   ]
  },
  {
   "q": "¿Cómo accedes a una propiedad estática de una clase en JavaScript?",
   "a": "Con `ClassName.propertyName`.",
   "d": [
    "Con `this.propertyName` dentro de un método.",
    "Con `instance.propertyName` después de crear una instancia.",
    "Con `super.propertyName` dentro de una subclase."
   ]
  },
  {
   "q": "¿En qué caso usarías un método estático en lugar de un método de instancia?",
   "a": "Cuando el método trabaja con datos que comparten todas las instancias de la clase.",
   "d": [
    "Cuando necesitas leer y modificar las propiedades de la instancia.",
    "Cuando el método se tiene que llamar sobre una instancia.",
    "Cuando el método no depende de datos de la instancia y trabaja con datos a nivel de clase."
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nclass MyClass {\n  sayHello() {\n    return \"Hello!\";\n  }\n}\n\nconsole.log(MyClass.sayHello());\n```",
   "a": "Lanza un error.",
   "d": [
    "`Hello!`",
    "`null`",
    "`undefined`"
   ]
  },
  {
   "q": "¿Qué palabra clave se usa para heredar propiedades y métodos de otra clase?",
   "a": "`extends`",
   "d": [
    "`import`",
    "`inherit`",
    "`static`"
   ]
  },
  {
   "q": "¿Qué imprime el siguiente código?\n\n```js\nclass Person {\n  static species = \"Human\";\n}\n\nconsole.log(Person.species);\n```",
   "a": "`Human`",
   "d": [
    "`undefined`",
    "`null`",
    "Se lanza un error."
   ]
  },
  {
   "q": "¿Cuál de las siguientes describe mejor la herencia?",
   "a": "Permite que una clase obtenga propiedades y métodos de otra clase.",
   "d": [
    "Permite que un método devuelva un objeto nuevo.",
    "Permite que una instancia defina sus propias propiedades.",
    "Permite convertir una propiedad estática en una no estática."
   ]
  },
  {
   "q": "¿Qué pasa si una subclase no define un constructor?",
   "a": "Se usa por defecto el constructor de la superclase.",
   "d": [
    "Se lanza un error.",
    "La subclase hereda el constructor de cualquier clase del código.",
    "La subclase no puede crear instancias."
   ]
  },
  {
   "q": "¿Qué representa `this` en el siguiente código?\n\n```js\nclass Animal {\n  constructor(name) {\n    this.name = name;\n  }\n}\n```",
   "a": "La instancia de `Animal`.",
   "d": [
    "El objeto global.",
    "La clase `Animal` misma.",
    "Una variable indefinida."
   ]
  },
  {
   "q": "¿Para qué se usan principalmente las propiedades estáticas?",
   "a": "Para guardar datos de la clase que comparten todas las instancias.",
   "d": [
    "Para definir propiedades predeterminadas de cada instancia.",
    "Para sobrescribir métodos en una subclase.",
    "Para definir datos propios de cada instancia."
   ]
  }
 ],
 "quiz-recursion": [
  {
   "q": "¿Qué es la recursión en programación?",
   "a": "Un proceso en el que una función se llama a sí misma.",
   "d": [
    "Una forma de ordenar arreglos.",
    "Un ciclo que nunca termina.",
    "Una función que devuelve `undefined`."
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un ejemplo de recursión?",
   "a": "```js\nfunction factorial(n) {\n  if (n === 0 || n === 1) {\n    return 1;\n  }\n  return n * factorial(n - 1);\n}\n```",
   "d": [
    "```js\nfunction factorial(n) {\n  let result = 1;\n\n  while (n > 0) {\n    result = result * n;\n    n--;\n  }\n\n  return result;\n}\n```",
    "```js\nfunction factorial(n) {\n  const arr = Array(n).fill().map((_, i) => i + 1);\n  return arr.reduce((acc, curr) => acc * curr, 1);\n}\n```",
    "```js\nfunction factorial(n) {\n  let result = 1;\n\n  for (let i = n; i > 0; i--) {\n    result *= i;\n  }\n\n  return result;\n}\n```"
   ]
  },
  {
   "q": "¿Qué devuelve la siguiente función?\n\n```js\nfunction sum(n) {\n  if (n === 0) return 0;\n  return n + sum(n - 1);\n}\nsum(3);\n```",
   "a": "6",
   "d": [
    "3",
    "0",
    "1"
   ]
  },
  {
   "q": "¿Cuántas veces se llama a la función `mystery`?\n\n```javascript\nfunction mystery(n) {\n  if (n <= 1) return 1;\n  return mystery(n - 2);\n}\nmystery(5);\n```",
   "a": "3",
   "d": [
    "2",
    "5",
    "4"
   ]
  },
  {
   "q": "¿Cuál de las siguientes afirmaciones sobre la recursión es verdadera?",
   "a": "Siempre debe tener un caso base.",
   "d": [
    "Nunca debe tener un caso base.",
    "Solo se debe usar para la sucesión de Fibonacci.",
    "Solo se debe usar para factoriales."
   ]
  },
  {
   "q": "¿Cuál de las siguientes opciones sería un caso base adecuado para este ejemplo?\n\n```js\nfunction countDownToZero(number) {\n  // Base case goes here.\n\n  console.log(number);\n  countDownToZero(number - 1);\n}\n```",
   "a": "```js\nif (number < 0) {\n  return;\n}\n```",
   "d": [
    "```js\nif (number > 0) {\n  return;\n}\n```",
    "```js\nif (number !== 0) {\n  return;\n}\n```",
    "```js\nif (number === 0) {\n  return;\n}\n```"
   ]
  },
  {
   "q": "¿Por qué la recursión debe tener un caso base?",
   "a": "Para que la función pueda salir de sus llamadas recursivas y no se cicle infinitamente.",
   "d": [
    "Para asegurar que la función siempre devuelva un valor.",
    "Para reducir el número de llamadas a la función.",
    "Para asegurar que las llamadas recursivas se ejecuten en orden y no se lance un `RecursionError`."
   ]
  },
  {
   "q": "¿Qué hace esta función recursiva?\n\n```js\nfunction repeatString(str) {\n  return str + repeatString(str);\n}\n```",
   "a": "Provoca un desbordamiento de pila (stack overflow).",
   "d": [
    "Devuelve la cadena dos veces.",
    "Devuelve `undefined`.",
    "Crea una cadena vacía."
   ]
  },
  {
   "q": "¿Qué es la pila de llamadas (call stack)?",
   "a": "Una estructura de datos que lleva el registro de las llamadas a funciones y su orden de ejecución.",
   "d": [
    "Una lista de las llamadas a funciones que ya se ejecutaron.",
    "Una lista de los valores que devolvió una función.",
    "Una función especial que llama a otra exactamente tres veces."
   ]
  },
  {
   "q": "¿Qué hace esta función recursiva?\n\n```js\nfunction changeString(str) {\n  if (str === \"\") return \"\";\n  return changeString(str.slice(1)) + str[0];\n}\n```",
   "a": "Invierte una cadena.",
   "d": [
    "Duplica una cadena.",
    "Quita las vocales.",
    "Quita los espacios."
   ]
  }
 ],
 "quiz-data-structures-js": [
  {
   "q": "En el análisis de algoritmos, ¿qué describe la notación Big O?",
   "a": "Cómo crece el tiempo o el espacio en relación con el tamaño de la entrada (una cota superior).",
   "d": [
    "El tiempo exacto de ejecución en segundos en una computadora específica.",
    "El porcentaje de líneas de código que se ejecutan.",
    "Qué tan legible es el código para otros desarrolladores."
   ]
  },
  {
   "q": "Al empezar un reto de algoritmos, ¿cuál es el mejor primer paso?",
   "a": "Aclarar el problema y sus restricciones con ejemplos y casos límite.",
   "d": [
    "Empezar a programar de inmediato para agarrar ritmo.",
    "Optimizar el rendimiento antes de entender el problema.",
    "Escribir pruebas unitarias solo después de terminar la solución."
   ]
  },
  {
   "q": "¿Cuál es la diferencia clave entre los arreglos dinámicos y los estáticos?",
   "a": "Los dinámicos pueden crecer o encogerse cambiando de tamaño; los estáticos tienen un tamaño fijo.",
   "d": [
    "Los dinámicos guardan valores de distintos tipos; los estáticos no.",
    "Los estáticos permiten valores repetidos; los dinámicos no.",
    "Los dinámicos son más rápidos que los estáticos en todas las operaciones."
   ]
  },
  {
   "q": "¿Cuál es la complejidad temporal de agregar un elemento al final de un arreglo dinámico cuando no hace falta cambiar su tamaño?",
   "a": "`O(1)`",
   "d": [
    "`O(n)`",
    "`O(log n)`",
    "`O(n log n)`"
   ]
  },
  {
   "q": "¿Por qué obtener el k-ésimo elemento por índice en una lista enlazada simple toma tiempo `O(n)`?",
   "a": "Hay que recorrer los nodos uno por uno desde la cabeza hasta el k-ésimo.",
   "d": [
    "Hay que cambiar el tamaño de la lista antes de cada acceso.",
    "El índice se pasa por una función hash y se busca en una tabla.",
    "Los nodos están contiguos en memoria, así que hay que desplazarlos."
   ]
  },
  {
   "q": "¿Qué tiene una lista doblemente enlazada que no tiene una lista enlazada simple?",
   "a": "Referencias al nodo siguiente y al anterior, lo que permite recorrerla hacia atrás.",
   "d": [
    "Acceso directo a cualquier índice en tiempo `O(1)`.",
    "Un búfer de arreglo integrado para recorrerla más rápido.",
    "Mantiene automáticamente su longitud como una constante."
   ]
  },
  {
   "q": "¿Cuál de las siguientes describe mejor una pila (stack)?",
   "a": "Último en entrar, primero en salir (`LIFO`), con `push` y `pop` en la cima.",
   "d": [
    "Primero en entrar, primero en salir (`FIFO`), quitando por el frente.",
    "Una estructura de la que se puede quitar cualquier elemento en tiempo `O(1)`.",
    "Un búfer circular con acceso directo en tiempo constante."
   ]
  },
  {
   "q": "¿Qué operación quita el elemento del frente de una cola (queue)?",
   "a": "`dequeue`",
   "d": [
    "`push`",
    "`pop`",
    "`peek`"
   ]
  },
  {
   "q": "En el diseño de algoritmos, ¿qué son los casos límite (edge cases)?",
   "a": "Entradas válidas y específicas en los límites de lo que el algoritmo debe manejar.",
   "d": [
    "Entradas que siempre provocan errores al ejecutar el programa.",
    "Entradas generadas al azar para medir el rendimiento de un algoritmo.",
    "Entradas no válidas que nunca se deben considerar en las pruebas."
   ]
  },
  {
   "q": "¿Qué es el nodo cabeza (head) de una lista enlazada simple?",
   "a": "El primer nodo de la lista, que normalmente es el único al que se accede directamente.",
   "d": [
    "El nodo que está a la mitad de la lista.",
    "El nodo con el valor más grande de la lista.",
    "El último nodo que se agregó a la lista."
   ]
  },
  {
   "q": "En un arreglo dinámico, ¿cuál es la complejidad temporal en el peor caso de insertar un elemento en el índice i (no al final)?",
   "a": "`O(n)`",
   "d": [
    "`O(1)`",
    "`O(log n)`",
    "`O(1)` amortizado"
   ]
  },
  {
   "q": "¿Cuál es la complejidad temporal de insertar un nodo nuevo en la cabeza de una lista enlazada simple?",
   "a": "`O(1)`",
   "d": [
    "`O(n)`",
    "`O(log n)`",
    "`O(n log n)`"
   ]
  },
  {
   "q": "¿Qué operación devuelve el elemento de la cima de una pila sin quitarlo?",
   "a": "`peek`",
   "d": [
    "`push`",
    "`pop`",
    "Insertar al fondo."
   ]
  },
  {
   "q": "¿Cuál de las siguientes describe mejor una cola (queue)?",
   "a": "Primero en entrar, primero en salir (`FIFO`), con `enqueue` al final y `dequeue` al frente.",
   "d": [
    "Último en entrar, primero en salir (`LIFO`), quitando por la cima.",
    "Acceso directo a cualquier índice en tiempo `O(1)`.",
    "Los elementos siempre se mantienen ordenados automáticamente."
   ]
  },
  {
   "q": "¿Cómo se llama una descripción de alto nivel de la lógica de un algoritmo que no depende del lenguaje?",
   "a": "Pseudocódigo",
   "d": [
    "Sintaxis",
    "Código máquina",
    "Depurador"
   ]
  },
  {
   "q": "¿Qué es algo que debes hacer para entender un problema?",
   "a": "Leer el enunciado varias veces.",
   "d": [
    "Empezar a programar de inmediato.",
    "Ignorar los casos límite.",
    "Saltar directo a la optimización."
   ]
  },
  {
   "q": "¿Qué dos componentes debes identificar al resolver un problema?",
   "a": "La entrada y la salida esperada.",
   "d": [
    "El lenguaje de programación y el IDE.",
    "Los nombres de las variables y otros identificadores.",
    "Los colores y el formato del código."
   ]
  },
  {
   "q": "¿Qué complejidad temporal crece más rápido que `O(n log n)` cuando n es grande?",
   "a": "`O(n^2)`",
   "d": [
    "`O(n)`",
    "`O(log n)`",
    "`O(1)`"
   ]
  },
  {
   "q": "Después de escribir una solución de fuerza bruta, ¿cuál es un buen siguiente paso?",
   "a": "Analizar su complejidad de tiempo y espacio y optimizar los cuellos de botella encontrados.",
   "d": [
    "Hacer microoptimizaciones de factores constantes antes de medir.",
    "Tirar las pruebas y reescribir la solución desde cero.",
    "No considerar los casos límite para que el código sea sencillo."
   ]
  },
  {
   "q": "¿Qué mide la complejidad espacial?",
   "a": "Cómo crece el uso de memoria en relación con el tamaño de la entrada.",
   "d": [
    "Cuántos núcleos de CPU usa un programa.",
    "La longitud de un programa en líneas de código.",
    "Cuánto tarda un programa en compilarse."
   ]
  }
 ],
 "quiz-searching-and-sorting-algorithms-js": [
  {
   "q": "¿Qué algoritmo de búsqueda recorre una lista revisando cada elemento desde el inicio hasta encontrar el que busca?",
   "a": "Búsqueda lineal",
   "d": [
    "Búsqueda por mezcla",
    "Búsqueda de burbuja",
    "Búsqueda binaria"
   ]
  },
  {
   "q": "¿Qué técnica divide un problema en subproblemas más pequeños?",
   "a": "Divide y vencerás",
   "d": [
    "Descompón y resuelve",
    "Divide y resuelve",
    "Descompón y vencerás"
   ]
  },
  {
   "q": "¿Cuál es la complejidad espacial del algoritmo de búsqueda lineal?",
   "a": "`O(1)`",
   "d": [
    "`O(n)`",
    "`O(log n)`",
    "`O(n²)`"
   ]
  },
  {
   "q": "Entre la búsqueda binaria y la lineal, ¿cuál es más adecuada para una lista grande?",
   "a": "La búsqueda binaria",
   "d": [
    "Ambas",
    "La búsqueda lineal",
    "Ninguna"
   ]
  },
  {
   "q": "¿Cuál es la complejidad espacial de la búsqueda binaria?",
   "a": "`O(1)`",
   "d": [
    "`O(log n)`",
    "`O(n)`",
    "`O(n log n)`"
   ]
  },
  {
   "q": "¿Qué devuelve el algoritmo de búsqueda binaria cuando encuentra el elemento buscado?",
   "a": "El índice del elemento buscado.",
   "d": [
    "El valor del elemento buscado.",
    "El tamaño de la lista en la que buscó.",
    "Un valor booleano del elemento."
   ]
  },
  {
   "q": "¿Qué devuelve el algoritmo de búsqueda lineal si no encuentra el elemento buscado?",
   "a": "`-1`",
   "d": [
    "`0`",
    "`null`",
    "`undefined`"
   ]
  },
  {
   "q": "¿Cómo funciona el algoritmo de ordenamiento por mezcla (merge sort)?",
   "a": "Divide la lista recursivamente en partes más pequeñas y luego las mezcla en orden.",
   "d": [
    "Busca un elemento revisando cada uno de los elementos.",
    "Arma una lista ordenada buscando una y otra vez el elemento más pequeño.",
    "Intercambia elementos adyacentes hasta que la lista queda ordenada."
   ]
  },
  {
   "q": "¿Qué condición se necesita para que funcione la búsqueda binaria?",
   "a": "La lista debe estar ordenada.",
   "d": [
    "La lista solo debe tener valores únicos.",
    "La lista debe tener un número par de elementos.",
    "La lista no debe tener números negativos."
   ]
  },
  {
   "q": "¿Qué enfoque de ciencias de la computación se usa para implementar el ordenamiento por mezcla?",
   "a": "Divide y vencerás",
   "d": [
    "Programación dinámica",
    "Algoritmo voraz",
    "Trazado"
   ]
  }
 ],
 "quiz-graph-and-trees-js": [
  {
   "q": "¿Qué es un grafo?",
   "a": "Una estructura de datos que representa las conexiones o relaciones entre objetos o entidades.",
   "d": [
    "Una estructura de datos lineal que sigue el principio último en entrar, primero en salir.",
    "Una estructura de datos que guarda varios valores del mismo tipo de forma contigua en memoria.",
    "Una estructura de datos lineal que sigue el principio primero en entrar, primero en salir."
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un escenario típico que se pueda representar con un grafo?",
   "a": "mediciones de temperatura a lo largo del tiempo",
   "d": [
    "redes sociales",
    "redes de transporte",
    "redes de comunicaciones"
   ]
  },
  {
   "q": "¿Qué término describe un objeto o entidad que forma parte de la red que representa un grafo?",
   "a": "Nodo",
   "d": [
    "Cookie",
    "Endpoint",
    "CPU"
   ]
  },
  {
   "q": "¿Qué término describe las conexiones entre los nodos de un grafo?",
   "a": "Aristas",
   "d": [
    "Compuertas",
    "Conectores",
    "Vértices"
   ]
  },
  {
   "q": "¿Qué es un grafo no dirigido?",
   "a": "Un grafo cuyas aristas no tienen una dirección específica.",
   "d": [
    "Un grafo cuyos nodos no son dirigidos pero sus aristas sí.",
    "Un grafo cuyas aristas tienen una dirección específica.",
    "Un grafo cuyos nodos y aristas se conectan en el punto medio."
   ]
  },
  {
   "q": "¿Cómo se llama un grafo en el que cada nodo tiene, además de sus datos, una etiqueta o identificador?",
   "a": "Grafo etiquetado por vértices",
   "d": [
    "Grafo etiquetado por versiones",
    "Grafo etiquetado virtual",
    "Grafo etiquetado vertical"
   ]
  },
  {
   "q": "¿Cómo se llama un grafo dirigido con al menos un ciclo?",
   "a": "Grafo cíclico",
   "d": [
    "Grafo ciclista",
    "Grafo circulante",
    "Grafo circular"
   ]
  },
  {
   "q": "¿Qué es un grafo ponderado?",
   "a": "Un tipo de grafo con aristas etiquetadas en el que las etiquetas son valores que se pueden comparar y usar en operaciones aritméticas.",
   "d": [
    "Un tipo de grafo con aristas etiquetadas que solo muestra la dirección de las conexiones entre nodos.",
    "Un tipo de grafo con aristas etiquetadas que asigna categorías, no valores numéricos, a las aristas.",
    "Un tipo de grafo con aristas etiquetadas que trata todos los pesos como iguales sin importar la etiqueta."
   ]
  },
  {
   "q": "¿Qué es un grafo dirigido acíclico?",
   "a": "Un grafo dirigido sin ciclos.",
   "d": [
    "Un grafo dirigido con un ciclo.",
    "Un grafo dirigido con tres ciclos.",
    "Un grafo dirigido con dos ciclos."
   ]
  },
  {
   "q": "¿Cómo se llama un grafo con dos o más grupos de nodos que no están unidos por ninguna arista?",
   "a": "Grafo disconexo",
   "d": [
    "Grafo desconectador",
    "Grafo desconectante",
    "Grafo de desconexión"
   ]
  },
  {
   "q": "¿Qué es el algoritmo de búsqueda en anchura (BFS)?",
   "a": "Un algoritmo que visita todos los nodos vecinos antes de pasar al siguiente nivel del grafo.",
   "d": [
    "Un algoritmo que visita dos nodos en una dirección antes de cambiar de dirección en el grafo.",
    "Un algoritmo que visita todos los nodos en una dirección antes de cambiar de dirección en el grafo.",
    "Un algoritmo que visita cuatro nodos a la vez antes de pasar al siguiente nivel del grafo."
   ]
  },
  {
   "q": "¿Cuál de los siguientes algoritmos sigue cada rama lo más profundo posible antes de retroceder?",
   "a": "Búsqueda en profundidad (Depth-First Search)",
   "d": [
    "Data-First Search",
    "Dock-First Search",
    "Daemon-First Search"
   ]
  },
  {
   "q": "¿Qué término representa una lista bidimensional en la que las filas y columnas son los vértices del grafo?",
   "a": "Matriz de adyacencia",
   "d": [
    "Matriz de arreglos",
    "Matriz de profundidad",
    "Matriz de vértices"
   ]
  },
  {
   "q": "¿Qué término representa un arreglo o diccionario que guarda los vecinos de cada nodo?",
   "a": "Lista de adyacencia",
   "d": [
    "Lista cíclica",
    "Lista de tuplas",
    "Lista de anchura"
   ]
  },
  {
   "q": "¿Qué debe cumplir un grafo para considerarse un árbol?",
   "a": "No puede tener lazos ni ciclos.",
   "d": [
    "Debe tener al menos un lazo o ciclo.",
    "Debe tener al menos dos lazos o ciclos.",
    "Debe tener tres lazos o ciclos."
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un tipo de árbol en el que cada nodo puede tener como máximo dos hijos?",
   "a": "Árbol binario",
   "d": [
    "Árbol de profundidad",
    "Árbol espacial",
    "Árbol lineal"
   ]
  },
  {
   "q": "¿Qué es un Trie?",
   "a": "Una estructura de datos de árbol que guarda un conjunto de cadenas.",
   "d": [
    "Una estructura de datos de árbol que guarda un conjunto de números.",
    "Una estructura de datos de árbol que guarda un conjunto de diccionarios.",
    "Una estructura de datos de árbol que guarda un conjunto de listas."
   ]
  },
  {
   "q": "¿En qué se diferencia una cola de prioridad de una cola normal?",
   "a": "Una cola de prioridad procesa los elementos según su prioridad.",
   "d": [
    "Una cola de prioridad quita los duplicados automáticamente antes de insertar.",
    "Una cola de prioridad siempre procesa los elementos en el orden en que se agregaron.",
    "Una cola de prioridad solo guarda elementos del mismo tipo de dato."
   ]
  },
  {
   "q": "¿Cuáles son los dos tipos de montículos (heaps)?",
   "a": "Montículo de máximos (max-heap) y de mínimos (min-heap)",
   "d": [
    "Montículo ancho y montículo alto",
    "Montículo horizontal y montículo vertical",
    "Montículo de anchura y montículo de profundidad"
   ]
  },
  {
   "q": "¿Cuál es la diferencia entre una cola estándar y una cola de prioridad?",
   "a": "En una cola estándar los elementos se procesan estrictamente en el orden en que se agregan (FIFO), mientras que una cola de prioridad los procesa según su prioridad y no solo por orden de llegada.",
   "d": [
    "En una cola estándar los elementos se procesan según su prioridad, mientras que una cola de prioridad los procesa estrictamente en el orden en que se agregan (FIFO).",
    "En una cola estándar los elementos repetidos se quitan automáticamente, mientras que una cola de prioridad permite repetidos.",
    "En una cola estándar se procesan según su prioridad, mientras que una cola de prioridad los procesa estrictamente en orden de llegada (FIFO)."
   ]
  }
 ],
 "quiz-dynamic-programming-js": [
  {
   "q": "¿Cuáles son las dos propiedades esenciales que debe tener un problema para que la programación dinámica sea una buena forma de resolverlo?",
   "a": "Subproblemas superpuestos y subestructura óptima",
   "d": [
    "Ejecución rápida y uso mínimo de memoria",
    "Capacidad de recursión y ciclos iterativos",
    "Procesamiento secuencial y cómputo en paralelo"
   ]
  },
  {
   "q": "¿Cuál es la diferencia principal entre la memoización y la tabulación en programación dinámica?",
   "a": "La memoización es un enfoque descendente (top-down) con recursión, mientras que la tabulación es ascendente (bottom-up) con iteración.",
   "d": [
    "La memoización usa tablas hash y la tabulación usa arreglos, lo que la hace más eficiente.",
    "La memoización es más rápida pero usa más memoria y ciclos de CPU que la tabulación.",
    "La memoización solo resuelve problemas más sencillos que la tabulación."
   ]
  },
  {
   "q": "¿Por qué las soluciones recursivas ingenuas a problemas de programación dinámica suelen tener complejidad exponencial?",
   "a": "Porque cada llamada recursiva se ramifica varias veces y los mismos subproblemas se calculan una y otra vez.",
   "d": [
    "Porque usan cantidades exponenciales de memoria para guardar variables.",
    "Porque necesitan ordenar los datos en tiempo exponencial.",
    "Porque deben revisar todas las permutaciones posibles de la entrada."
   ]
  },
  {
   "q": "En programación dinámica, ¿qué significa subestructura óptima?",
   "a": "Que la solución óptima se puede construir a partir de las soluciones óptimas de sus subproblemas.",
   "d": [
    "Que el algoritmo debe usar la estructura de datos más eficiente disponible.",
    "Que la solución debe minimizar a la vez la complejidad de tiempo y de espacio.",
    "Que el problema debe tener una única solución óptima."
   ]
  },
  {
   "q": "Con memoización, ¿qué pasa cuando se llama a una función con argumentos que ya se calcularon?",
   "a": "Se devuelve de inmediato el resultado guardado, sin volver a calcularlo.",
   "d": [
    "La función vuelve a calcular el resultado para asegurar que sea correcto.",
    "La función promedia el resultado viejo y el nuevo para tener más precisión.",
    "Se lanza un error porque no se permiten cálculos repetidos."
   ]
  },
  {
   "q": "¿Cuál es una ventaja clave de usar tabulación en lugar de memoización?",
   "a": "La tabulación evita el costo de la recursión y tiene una ejecución secuencial predecible.",
   "d": [
    "La tabulación siempre usa menos memoria que la memoización.",
    "La tabulación resuelve una clase más amplia de problemas.",
    "La tabulación siempre es más fácil de implementar y entender."
   ]
  },
  {
   "q": "En una solución ascendente (bottom-up) de programación dinámica, ¿por qué se inicializan primero los casos base?",
   "a": "Para tener los valores de partida sobre los que se construyen todos los subproblemas más grandes.",
   "d": [
    "Para reservar memoria para la estructura de datos de forma eficiente.",
    "Para evitar ciclos infinitos en el algoritmo.",
    "Para mejorar la complejidad temporal del algoritmo."
   ]
  },
  {
   "q": "¿Cómo cambia la programación dinámica la complejidad temporal de los problemas con subproblemas superpuestos?",
   "a": "De exponencial a polinomial, guardando y reutilizando las soluciones de los subproblemas.",
   "d": [
    "De polinomial a logarítmica, dividiendo el problema de forma eficiente.",
    "De cuadrática a lineal, optimizando la estructura de los ciclos.",
    "De lineal a constante, usando tablas hash."
   ]
  },
  {
   "q": "¿Qué sacrifica normalmente la programación dinámica para lograr una mejor complejidad temporal?",
   "a": "Usa espacio adicional para guardar resultados intermedios.",
   "d": [
    "Sacrifica la legibilidad del código a cambio de velocidad.",
    "Necesita algoritmos más complejos y difíciles de mantener.",
    "Limita el tamaño de los problemas que se pueden resolver."
   ]
  },
  {
   "q": "¿En qué caso la programación dinámica NO sería el enfoque adecuado?",
   "a": "Cuando los subproblemas son independientes y no se superponen.",
   "d": [
    "Cuando el problema pide encontrar una solución óptima.",
    "Cuando el problema se puede dividir en subproblemas más pequeños.",
    "Cuando hay que minimizar la complejidad espacial."
   ]
  }
 ],
 "quiz-javascript-functional-programming": [
  {
   "q": "¿Qué es una función pura?",
   "a": "Una función que siempre devuelve el mismo resultado para la misma entrada y no produce efectos secundarios.",
   "d": [
    "Una función que modifica variables globales y devuelve `undefined` o `null`.",
    "Una función que imprime un resultado en la consola.",
    "Una función que cambia su comportamiento según factores externos y devuelve `null`."
   ]
  },
  {
   "q": "En programación funcional, ¿qué es un efecto secundario?",
   "a": "Un cambio en el estado del programa que se puede observar fuera de la función.",
   "d": [
    "Un `TypeError` inesperado en tu código.",
    "Una función que tarda demasiado y hace que el programa falle.",
    "Una llamada recursiva que produce un ciclo infinito y hace que el programa falle."
   ]
  },
  {
   "q": "En programación funcional, ¿qué es el currying?",
   "a": "Transformar una función con varios argumentos en una secuencia de funciones que reciben un solo argumento cada una.",
   "d": [
    "Una técnica para diseñar pruebas que aseguran que tu código no tenga ningún error.",
    "Una forma más optimizada de escribir funciones recursivas para que corran el doble de rápido.",
    "El proceso de construir, diseñar y probar tu código para que cumpla los estándares de ECMAScript."
   ]
  },
  {
   "q": "¿Qué imprime la siguiente función pura?\n\n```js\nconst add = (a, b) => a + b;\nconsole.log(add(2, 5));\n```",
   "a": "`7`",
   "d": [
    "`3`",
    "`4`",
    "`undefined`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un ejemplo de currying?",
   "a": "```js\nfunction curriedAverage(a) {\n  return function(b) {\n    return function(c) {\n      return (a + b + c) / 3;\n    };\n  };\n}\n```",
   "d": [
    "```js\nconst curriedAverage = (a, b, c) => a + b + c / 3\n```",
    "```js\nconst curriedAverage = (a, b, c) => a + b + c\n```",
    "```js\nfunction curriedAverage(a) {\n  return a \n}\n\nfunction curried(c) {\n  return c\n}\n```"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un principio clave de la programación funcional?",
   "a": "Evitar efectos secundarios y usar datos inmutables.",
   "d": [
    "Modificar variables globales con frecuencia.",
    "Usar estructuras de datos mutables en todas partes.",
    "Dar prioridad a la herencia de la programación orientada a objetos."
   ]
  },
  {
   "q": "¿Qué es una función impura?",
   "a": "Una función con efectos secundarios.",
   "d": [
    "Una función que devuelve un objeto.",
    "Una función sin efectos secundarios.",
    "Una función que devuelve `null`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de llamar una función currificada?",
   "a": "```js\ncurriedAverage(2)(3)(4);\n```",
   "d": [
    "```js\ncurriedAverage(2 3 4);\n```",
    "```js\ncurriedAverage(2)==(3)==(4);\n```",
    "```js\ncurriedAverage(2)=>(3)=>(4);\n```"
   ]
  },
  {
   "q": "¿Cuál de los siguientes es un ejemplo de función impura?",
   "a": "```js\nlet total = 0;\nfunction addToTotal(value) {\n  total += value;\n  return total;\n}\n```",
   "d": [
    "```js\nfunction example(num) {\n  return num;\n}\n```",
    "```js\nfunction sum(num1, num2) {\n return num1 + num2\n}\n```",
    "```js\nfunction addToTotal(value) {\n  let total = 0;\n  total += value;\n  return total;\n}\n```"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un ejemplo de efecto secundario?",
   "a": "Devolver la suma de dos valores.",
   "d": [
    "Escribir en un archivo.",
    "Modificar una variable global.",
    "Hacer una llamada a una API."
   ]
  }
 ],
 "quiz-asynchronous-javascript": [
  {
   "q": "¿Qué es la programación asíncrona?",
   "a": "Una forma de ejecutar código de manera concurrente sin bloquear el hilo principal.",
   "d": [
    "Una forma de ejecutar código de manera secuencial.",
    "Una técnica para manejar los errores de tu código.",
    "Una forma de hacer solicitudes de red, normalmente para obtener o enviar datos al servidor."
   ]
  },
  {
   "q": "¿Qué es un hilo (thread)?",
   "a": "Una secuencia de instrucciones que se puede ejecutar de forma independiente del flujo principal del programa.",
   "d": [
    "Una función para obtener datos del servidor.",
    "Un programa que ejecuta código JavaScript en el navegador.",
    "Un tipo especial de función que se pasa como argumento a otra función."
   ]
  },
  {
   "q": "¿Para qué sirve la Fetch API en JavaScript?",
   "a": "Para hacer solicitudes de red a servidores.",
   "d": [
    "Para manejar callbacks asíncronos.",
    "Para crear y manejar cookies.",
    "Para generar contenido HTML dinámico."
   ]
  },
  {
   "q": "¿Qué método HTTP se usa para enviar datos a un servidor para que los procese?",
   "a": "`POST`",
   "d": [
    "`GET`",
    "`DELETE`",
    "`HEAD`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de obtener datos de una API?",
   "a": "```js\nfetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n```",
   "d": [
    "```js\nfetch('https://api.example.com/data')\n  .accept(response => response.json())\n  .accept(data => console.log(data))\n```",
    "```js\nfetch('https://api.example.com/data')\n  .allow(response => response.json())\n  .allow(data => console.log(data))\n```",
    "```js\nfetch('https://api.example.com/data')\n  .send(response => response.json())\n  .send(data => console.log(data))\n```"
   ]
  },
  {
   "q": "¿Qué es una promesa en JavaScript?",
   "a": "Un objeto que representa la finalización (o el fallo) futura de una operación asíncrona.",
   "d": [
    "Una forma de sincronizar varias operaciones al trabajar con la Fetch API.",
    "Un tipo especial de callback que debes usar en todas las funciones de orden superior.",
    "Una técnica para manejar errores al trabajar con la Fetch API."
   ]
  },
  {
   "q": "¿Qué te permite hacer el encadenamiento de promesas?",
   "a": "Ejecutar una secuencia de operaciones asíncronas, una después de otra.",
   "d": [
    "Ejecutar varias operaciones síncronas en paralelo.",
    "Manejar las operaciones síncronas de forma más eficiente.",
    "Reintentar automáticamente las operaciones que fallan."
   ]
  },
  {
   "q": "¿Qué método se usa para manejar el cumplimiento exitoso de una promesa?",
   "a": "`.then()`",
   "d": [
    "`.finally()`",
    "`.catch()`",
    "`.error()`"
   ]
  },
  {
   "q": "¿Qué método se usa para manejar errores en una cadena de promesas?",
   "a": "`.catch()`",
   "d": [
    "`.finally()`",
    "`.then()`",
    "`.error()`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes NO es un método HTTP válido?",
   "a": "`SEND`",
   "d": [
    "`PUT`",
    "`GET`",
    "`POST`"
   ]
  },
  {
   "q": "¿Cuál es la sintaxis correcta para crear una función asíncrona?",
   "a": "`async function myFunction() {}`",
   "d": [
    "`function myFunction() {}`",
    "`function async myFunction() {}`",
    "`async {} => ()`"
   ]
  },
  {
   "q": "¿Qué hace la palabra clave `await` dentro de una función asíncrona?",
   "a": "Pausa la ejecución de la función hasta que la promesa se resuelve.",
   "d": [
    "Crea una promesa nueva.",
    "Ejecuta el código de inmediato sin esperar y devuelve un objeto.",
    "Imprime el resultado de la promesa y devuelve `null`."
   ]
  },
  {
   "q": "¿Qué API permite que los sitios web pidan la ubicación del usuario?",
   "a": "Geolocation API",
   "d": [
    "Locator API",
    "Geo API",
    "Locate API"
   ]
  },
  {
   "q": "¿Qué atributo descarga el script de forma asíncrona pero espera a que se termine de analizar el documento HTML para ejecutarlo?",
   "a": "`defer`",
   "d": [
    "`asyncDefer`",
    "`deferred`",
    "`deferring`"
   ]
  },
  {
   "q": "¿Qué devuelve el siguiente código?\n\n```js\nfetch('https://api.example.com/data')\n```",
   "a": "Una `Promise` que se resuelve con un objeto `Response`.",
   "d": [
    "Un error que dice que los datos están dañados.",
    "Un error que dice que no se pueden obtener los datos.",
    "No devuelve nada y JavaScript pasa a la siguiente función del script."
   ]
  },
  {
   "q": "¿Cuál es el método HTTP predeterminado de la Fetch API?",
   "a": "`GET`",
   "d": [
    "`POST`",
    "`PUT`",
    "`DELETE`"
   ]
  },
  {
   "q": "¿Cuál de los siguientes métodos se usa para borrar recursos en el servidor?",
   "a": "`DELETE`",
   "d": [
    "`REMOVING`",
    "`REMOVE`",
    "`DELETING`"
   ]
  },
  {
   "q": "¿Cuál de las siguientes es la forma correcta de crear una promesa?",
   "a": "```js\nconst promise = new Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```",
   "d": [
    "```js\nconst promise = get Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```",
    "```js\nconst promise = set Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```",
    "```js\nconst promise = put Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```"
   ]
  },
  {
   "q": "¿Qué atributo le indica al navegador que descargue el script de forma asíncrona mientras sigue analizando el documento HTML?",
   "a": "`async`",
   "d": [
    "`resolve`",
    "`catch`",
    "`put`"
   ]
  },
  {
   "q": "¿Qué método de la Geolocation API se usa para obtener la posición actual del dispositivo?",
   "a": "`getCurrentPosition()`",
   "d": [
    "`getLocation()`",
    "`getPosition()`",
    "`getLatLong()`"
   ]
  }
 ]
};
