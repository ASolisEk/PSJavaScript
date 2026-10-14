/**
 * Banco de preguntas de la certificación «JavaScript» de freeCodeCamp
 * (currículo v9): los cuestionarios de cada módulo, sin traducir.
 *
 * ARCHIVO GENERADO por scripts/importar-fcc-javascript.js — no lo edites a mano.
 * Fuente: https://www.freecodecamp.org/learn/javascript-v9/
 * Contenido © freeCodeCamp.org, licencia CC BY-SA 4.0.
 * 27 cuestionarios, 480 preguntas.
 */

export interface FccQuizQuestion {
  /** Enunciado (Markdown). */
  q: string;
  /** Respuesta correcta. */
  a: string;
  /** Respuestas incorrectas. */
  d: string[];
}

export interface FccQuiz {
  block: string;
  module: string;
  title: string;
  /** Tema en español (se usa para elegir preguntas por tema). */
  topic: string;
  /** Aciertos mínimos para aprobar el cuestionario original: [aciertos, preguntas]. */
  passing: [number, number];
  questions: FccQuizQuestion[];
}

export const FCC_JAVASCRIPT_QUIZZES: FccQuiz[] = [
 {
  "block": "quiz-javascript-variables-and-data-types",
  "module": "javascript-variables-and-strings",
  "title": "JavaScript Variables and Data Types Quiz",
  "topic": "Variables y tipos de datos",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which of the following best describes JavaScript?",
    "a": "A programming language used for web development.",
    "d": [
     "A markup language used to design websites.",
     "A server-side programming language.",
     "A database management system."
    ]
   },
   {
    "q": "Which of the following is NOT a JavaScript data type?",
    "a": "`Double`",
    "d": [
     "`Number`",
     "`Undefined`",
     "`Object`"
    ]
   },
   {
    "q": "Which of the following is NOT a valid JavaScript variable declaration?",
    "a": "`public Int x;`",
    "d": [
     "`const x = 0;`",
     "`let x;`",
     "`var x;`"
    ]
   },
   {
    "q": "Which of the following is a common naming convention for variables in JavaScript?",
    "a": "Camel case.",
    "d": [
     "JavaScript case.",
     "Lightning case.",
     "Giraffe case."
    ]
   },
   {
    "q": "What is the difference between `let` and `const` variable declarations in JavaScript?",
    "a": "`const` cannot be re-assigned or re-declared. `let` can be re-assigned, but not re-declared.",
    "d": [
     "`const` cannot be re-assigned nor re-declared. `let` can be re-assigned and re-declared.",
     "`const` can be re-assigned and re-declared. `let` cannot be re-assigned nor re-declared.",
     "`const` can be re-assigned but not re-declared. `let` can be re-declared, but not re-assigned."
    ]
   },
   {
    "q": "Why are strings considered immutable in JavaScript?",
    "a": "Once a string is created, you cannot change its characters directly.",
    "d": [
     "You cannot create strings using variables.",
     "Strings can only be created using literals.",
     "You can change strings, but only through global variables."
    ]
   },
   {
    "q": "How would you print out the string `Hello, world!` in the console in JavaScript?",
    "a": "`console.log(\"Hello, world!\");`",
    "d": [
     "`print(\"Hello, world!\")`",
     "`alert(\"Hello, world\");`",
     "`System.out.println(\"Hello, world!\");`"
    ]
   },
   {
    "q": "What does the code below do?\n\n```js\nlet hello = \"Hello\";\nhello += \" world\";\nconsole.log(hello);\n```",
    "a": "Combines the current value of `hello` with the string `\" world\"`, reassigns it to `hello`, and prints it to the console.",
    "d": [
     "Reassigns `\" world\"` to the variable `hello`, and prints it out in the console.",
     "Prints out the number of characters in `Hello world` in the console.",
     "Combines `\"Hello\"` and `\" world\"` into a new string and prints it, but the value of `hello` remains `\"Hello\"`."
    ]
   },
   {
    "q": "Which JavaScript character is used to mark the end of a statement?",
    "a": "`;`",
    "d": [
     "`:`",
     "`,`",
     "`.`"
    ]
   },
   {
    "q": "Which of the following is a valid single line comment syntax in JavaScript?",
    "a": "`// This is a single line comment`",
    "d": [
     "`# This is a single line comment`",
     "`-- This is a single line comment`",
     "`/* This is a single line comment */`"
    ]
   },
   {
    "q": "Dynamic typing in JavaScript means that:",
    "a": "JavaScript infers the type based on the value assigned to the variable.",
    "d": [
     "You need to declare the data type of a variable before using it.",
     "You cannot assign a value of one data type to a variable of a different type.",
     "JavaScript performs type checking before execution, meaning type related errors will be thrown before the code is run."
    ]
   },
   {
    "q": "Which of the following prints out the type of the variable `x` in the console?",
    "a": "`console.log(typeof x);`",
    "d": [
     "`console.log(x.type);`",
     "`console.log(typeOf(x));`",
     "`console.log(isNaN(x));`"
    ]
   },
   {
    "q": "What will be the output of `console.log(typeof null);`?",
    "a": "`\"object\"`",
    "d": [
     "`\"undefined\"`",
     "`\"null\"`",
     "`\"NaN\"`"
    ]
   },
   {
    "q": "Which of the following is a valid multi-line comment in JavaScript?",
    "a": "```js\n/*\nThis is a\nmulti-line\ncomment\n*/\n```",
    "d": [
     "```js\n// This is a\n// multi-line\n// comment\n```",
     "```py\n'''\nThis is a\nmulti-line\ncomment\n'''\n```",
     "```html\n<!--\nThis is a\nmulti-line\ncomment\n-->\n```"
    ]
   },
   {
    "q": "Which of the following declares a variable in JavaScript that cannot be changed?",
    "a": "`const x = 0;`",
    "d": [
     "`var x = 0;`",
     "`let x = 0;`",
     "`final x = 0;`"
    ]
   },
   {
    "q": "Which of the following is a valid variable name in JavaScript?",
    "a": "`$number`",
    "d": [
     "`tart@n`",
     "`4cats`",
     "`!!dogs`"
    ]
   },
   {
    "q": "Which of the following is NOT a valid string concatenation method in JavaScript?",
    "a": "`console.log(string1 string2);`",
    "d": [
     "`console.log(string1 + \" \" + string2);`",
     "`console.log(\"string1 \" + string2);`",
     "`console.log(string1.concat(\" \", string2));`"
    ]
   },
   {
    "q": "Which of the following variable names uses camel case correctly?",
    "a": "`aLongVariableName`",
    "d": [
     "`a_long_variable_name`",
     "`alongvariableName`",
     "`ALongVariableName`"
    ]
   },
   {
    "q": "Why is it beneficial to use semicolons explicitly even though JavaScript has Automatic Semicolon Insertion?",
    "a": "To improve code readability and reliability.",
    "d": [
     "To increase the execution speed of the code.",
     "To maintain consistency with other programming languages.",
     "To allow for better debugging and error tracing."
    ]
   },
   {
    "q": "Which of the following is NOT a JavaScript data type?",
    "a": "`Float`",
    "d": [
     "`Symbol`",
     "`Boolean`",
     "`Null`"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-strings",
  "module": "javascript-variables-and-strings",
  "title": "JavaScript Strings Quiz",
  "topic": "Cadenas de texto",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is the return value for the `includes()` method?",
    "a": "If the substring is found within the string, the method returns `true`. Otherwise, it returns `false`.",
    "d": [
     "If the substring is found within the string, the method returns the string. Otherwise, it returns `undefined`.",
     "If the substring is found within the string, the method returns `true`. Otherwise, it returns an empty string.",
     "If the substring is found within the string, the method returns the string. Otherwise, it returns `null`."
    ]
   },
   {
    "q": "Which option demonstrates string interpolation?",
    "a": "`` `Hello, ${user}!` ``",
    "d": [
     "`\"Hello, \" + user + \"!\"`",
     "`\"Hello, $user!\"`",
     "`` `Hello, {user}!` ``"
    ]
   },
   {
    "q": "Which of the following options is the newline character?",
    "a": "`\\n`",
    "d": [
     "`\\newline`",
     "`\\new`",
     "`\\line`"
    ]
   },
   {
    "q": "Which of the following statements is correct about strings?",
    "a": "Strings are immutable.",
    "d": [
     "Strings are mutable and can be changed after they are created.",
     "Strings are non primitive data types.",
     "Strings can only be created using single quotes."
    ]
   },
   {
    "q": "What does ASCII stand for?",
    "a": "American Standard Code for Information Interchange",
    "d": [
     "American Standard Code for Internet Information",
     "Advanced Systematic Code for Internal Interchange",
     "Automatic Standard Code for Internal Information"
    ]
   },
   {
    "q": "Which of the following methods extracts a portion of a string and returns a new string?",
    "a": "`slice()`",
    "d": [
     "`trim()`",
     "`indexOf()`",
     "`prompt()`"
    ]
   },
   {
    "q": "What is the purpose of the `prompt()` method?",
    "a": "It displays a dialog box that waits for the user input.",
    "d": [
     "It displays a message in the console.",
     "It displays an alert box with a message.",
     "It displays a confirmation box with a message."
    ]
   },
   {
    "q": "Which of the following is the correct way to access the third character of a string?",
    "a": "```js\nconst developer = \"Jessica\";\ndeveloper[2];\n```",
    "d": [
     "```js\nconst developer = \"Jessica\";\ndeveloper[3];\n```",
     "```js\nconst developer = \"Jessica\";\ndeveloper[-1];\n```",
     "```js\nconst developer = \"Jessica\";\ndeveloper[0];\n```"
    ]
   },
   {
    "q": "How can you obtain the ASCII value of the first character in the string `\"hello\"`?",
    "a": "`\"hello\".charCodeAt(0)`",
    "d": [
     "`\"hello\".charCode(0)`",
     "`\"hello\".codeAt(0)`",
     "`\"hello\".getCharIndex(0)`"
    ]
   },
   {
    "q": "Which method can you use to obtain the character corresponding to an ASCII value?",
    "a": "`fromCharCode()`",
    "d": [
     "`toASCII()`",
     "`toChar()`",
     "`toCode()`"
    ]
   },
   {
    "q": "Which of the following `indexOf` examples will log `-1` to the console?",
    "a": "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"c\"));\n```",
    "d": [
     "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"e\"));\n```",
     "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"f\"));\n```",
     "```js\nconst organization = \"freeCodeCamp\";\nconsole.log(organization.indexOf(\"C\"));\n```"
    ]
   },
   {
    "q": "How can you check if the string `\"JavaScript\"` contains `\"Script\"`?",
    "a": "`\"JavaScript\".includes(\"Script\")`",
    "d": [
     "`\"JavaScript\".has(\"Script\")`",
     "`\"JavaScript\".contains(\"Script\")`",
     "`\"JavaScript\".exists(\"Script\")`"
    ]
   },
   {
    "q": "Which of the following extracts the substring `\"Script\"` from the string `\"JavaScript\"`?",
    "a": "`\"JavaScript\".slice(4)`",
    "d": [
     "`\"JavaScript\".find(5)`",
     "`\"JavaScript\".extract(4)`",
     "`\"JavaScript\".cut(5)`"
    ]
   },
   {
    "q": "How do you convert the string `\"JavaScript\"` to uppercase?",
    "a": "`\"JavaScript\".toUpperCase()`",
    "d": [
     "`\"JavaScript\".upper()`",
     "`\"JavaScript\".toUpper()`",
     "`\"JavaScript\".convertUpper()`"
    ]
   },
   {
    "q": "How do you convert the string `\"JavaScript\"` to lowercase?",
    "a": "`\"JavaScript\".toLowerCase()`",
    "d": [
     "`\"JavaScript\".lower()`",
     "`\"JavaScript\".toLower()`",
     "`\"JavaScript\".convertLower()`"
    ]
   },
   {
    "q": "Which of the following will replace `\"dogs\"` with `\"cats\"` in the string `\"I love dogs\"`.",
    "a": "`\"I love dogs\".replace(\"dogs\", \"cats\")`",
    "d": [
     "`\"I love dogs\".slice(\"dogs\", \"cats\")`",
     "`\"I love dogs\".replaceWith(\"dogs\", \"cats\")`",
     "`\"I love dogs\".find(\"dogs\", \"cats\")`"
    ]
   },
   {
    "q": "Which method is used to repeat a string a specified number of times?",
    "a": "`repeat()`",
    "d": [
     "`times()`",
     "`repeatTimes()`",
     "`repeatNumber()`"
    ]
   },
   {
    "q": "What will the following code return: `\"abc\".repeat(3)`?",
    "a": "`\"abcabcabc\"`",
    "d": [
     "`\"abcabc\"`",
     "`\"abcabcabcabc\"`",
     "It will throw an error."
    ]
   },
   {
    "q": "Which method will remove whitespace from the beginning and end of a string?",
    "a": "`trim()`",
    "d": [
     "`strip()`",
     "`removeWhitespace()`",
     "`trimWhitespace()`"
    ]
   },
   {
    "q": "Which of the following is the correct syntax for escaping quotes?",
    "a": "```js\n\"She said, \\\"Hello!\\\"\"\n```",
    "d": [
     "```js\n\"She said, ?\"Hello!?\"\"\n```",
     "```js\n\"She said, .\"Hello!.\"\"\n```",
     "```js\n\"She said, //\"Hello!//\"\"\n```"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-math",
  "module": "javascript-booleans-and-numbers",
  "title": "JavaScript Math Quiz",
  "topic": "Números y operadores",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What does `NaN` stand for?",
    "a": "`Not a Number`",
    "d": [
     "`Numeric and Number`",
     "`Not a Null`",
     "`Null and Number`"
    ]
   },
   {
    "q": "Which of the following is NOT an arithmetic operator in JavaScript?",
    "a": "`??`",
    "d": [
     "`*`",
     "`+`",
     "`-`"
    ]
   },
   {
    "q": "What happens if you try to divide by zero in JavaScript?",
    "a": "JavaScript will output `Infinity`",
    "d": [
     "JavaScript will output 0.",
     "Nothing will happen.",
     "JavaScript will throw an error."
    ]
   },
   {
    "q": "Which of the following is the correct use of the exponentiation operator?",
    "a": "`2**3`",
    "d": [
     "`2*3`",
     "`2#3`",
     "`2%3`"
    ]
   },
   {
    "q": "Which operator should you use when decrementing a variable in JavaScript?",
    "a": "`--`",
    "d": [
     "`++`",
     "`//`",
     "`**`"
    ]
   },
   {
    "q": "Which of the following is NOT a bitwise operator?",
    "a": "`>`",
    "d": [
     "`&`",
     "`|`",
     "`^`"
    ]
   },
   {
    "q": "Which of the following is the correct compound operator for getting the remainder?",
    "a": "`%=`",
    "d": [
     "`//=`",
     "`\\=`",
     "`%%=`"
    ]
   },
   {
    "q": "What is the difference between the `==` and `===` operators?",
    "a": "The `==` operator only compares values whereas the `===` operator compares values and types.",
    "d": [
     "There is no difference. The comparison result will always have the same result.",
     "The `==` operator is used to check if the data type is the same while the `===` is used to check if the value is equal.",
     "The `==` operator can only be used with primitive types while the `===` operator is only used for objects."
    ]
   },
   {
    "q": "What is the unary plus operator (`+`) used for?",
    "a": "It is used to convert its operand into a number.",
    "d": [
     "It is used to decrement a value by one.",
     "It is used to get the remainder from an operation.",
     "It is used to invert the binary representation of a number."
    ]
   },
   {
    "q": "Which of the following `Math` methods rounds a value to the nearest whole integer?",
    "a": "`Math.round()`",
    "d": [
     "`Math.trunc()`",
     "`Math.max()`",
     "`Math.min()`"
    ]
   },
   {
    "q": "What does the `Math.sqrt()` method do?",
    "a": "This method returns the square root of a number.",
    "d": [
     "This method returns a random floating point number.",
     "This method returns the absolute value for a number.",
     "This method returns the cube of a number."
    ]
   },
   {
    "q": "Which of the following is NOT a valid method for the `Math` object?",
    "a": "`Math.extend()`",
    "d": [
     "`Math.ceil()`",
     "`Math.pow()`",
     "`Math.abs()`"
    ]
   },
   {
    "q": "Which of the following will return `false`?",
    "a": "`isNaN(7)`",
    "d": [
     "`isNaN(\"Matt\")`",
     "`isNaN()`",
     "`isNaN(undefined)`"
    ]
   },
   {
    "q": "What does the `parseFloat()` method do?",
    "a": "It parses a string argument and returns a floating-point number.",
    "d": [
     "It parses a string argument and performs a bitwise operation on it.",
     "It parses a string argument and returns `false`.",
     "It parses a string argument and returns an integer."
    ]
   },
   {
    "q": "What will be logged to the console?\n\n```js\nlet num = 5;\nconsole.log(++num);\n```",
    "a": "`6`",
    "d": [
     "`error`",
     "`null`",
     "`5`"
    ]
   },
   {
    "q": "What would be the output for the following code?\n\n```js\nconsole.log(5 == '5');\n```",
    "a": "`true`",
    "d": [
     "`undefined`",
     "`false`",
     "`null`"
    ]
   },
   {
    "q": "What is operator precedence?",
    "a": "Operator precedence determines the order in which operations are evaluated in an expression.",
    "d": [
     "Operator precedence is used to check if the value on the left is less than the one on the right.",
     "Operator precedence is used to raise a variable to the power of the specified number and reassigns the result to the variable.",
     "Operator precedence is used to increase the value by one."
    ]
   },
   {
    "q": "Which of the following is NOT a comparison operator?",
    "a": "`!>`",
    "d": [
     "`>`",
     "`>=`",
     "`<`"
    ]
   },
   {
    "q": "What does the unary negation operator (`-`) do?",
    "a": "It negates the operand.",
    "d": [
     "It flips the boolean value of its operand.",
     "It decreases the value by one.",
     "It increases the value by one."
    ]
   },
   {
    "q": "Which of the following is an example of using the nullish coalescing operator?",
    "a": "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme ?? 'light';\n```",
    "d": [
     "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme () 'light';\n```",
     "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme ** 'light';\n```",
     "```js\nconst userSettings = {\n theme: null,\n volume: 0,\n notifications: false,\n};\n\nuserSettings.theme \\\\ 'light';\n```"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-comparisons-and-conditionals",
  "module": "javascript-booleans-and-numbers",
  "title": "JavaScript Comparisons and Conditionals Quiz",
  "topic": "Comparaciones y condicionales",
  "passing": [
   9,
   10
  ],
  "questions": [
   {
    "q": "What's the result of the expression `undefined > 0`?",
    "a": "`false`",
    "d": [
     "`true`",
     "`undefined`",
     "`null`"
    ]
   },
   {
    "q": "Which logical operation does `||` represent?",
    "a": "OR",
    "d": [
     "XOR",
     "AND",
     "NOT"
    ]
   },
   {
    "q": "What's the output of the following code?\n\n```js\nconsole.log(5 === 2 + 3 || 4 == 2);\n```",
    "a": "`true`",
    "d": [
     "`undefined`",
     "`false`",
     "An error is raised."
    ]
   },
   {
    "q": "What is a truthy and falsy value?",
    "a": "A value that is considered `true` or `false` when encountered in a Boolean context.",
    "d": [
     "A value that's both `true` and `false`.",
     "A value that changes depending on context.",
     "A value that functions differently than `true` or `false` value."
    ]
   },
   {
    "q": "What's logged to the console from the code below?\n\n```js\nif (1) {\n  console.log(\"True!\");\n}\n```",
    "a": "`True!`",
    "d": [
     "`false`",
     "Nothing gets printed to the console.",
     "An error is raised."
    ]
   },
   {
    "q": "What's the difference between `undefined` and `null`?",
    "a": "Variables without a value are `undefined`, while `null` represents an intentional absence of an object value.",
    "d": [
     "`null` and `undefined` point to an out-of-range memory location and are inaccessible.",
     "`null` is the implicit value assigned to variables and it can not be changed, while `undefined` is the explicit value assigned to variables.",
     "`null` is a global property, `undefined` is not."
    ]
   },
   {
    "q": "What happens when you don't include `break` while implementing a `switch` statement?",
    "a": "The code continues to evaluate the following `case` statements, even after finding a match.",
    "d": [
     "The `switch` statement will stop abruptly.",
     "The `switch` statement will throw an error after previous statement.",
     "The `switch` statement will exit after the first match."
    ]
   },
   {
    "q": "What is printed to the console from the code below?\n\n```js\nconst a = 2;\nif (1 == \"1\") {\n  let b = 3;\n  console.log(a + b);\n}\nconsole.log(b);\n```",
    "a": "`5`, and then an error is raised.",
    "d": [
     "An error is raised.",
     "```js\n5\n3\n```",
     "```js\n5\nundefined\n```"
    ]
   },
   {
    "q": "What will be the output of the following JavaScript code?\n\n```js\nlet vehicle = \"car\";\n\nswitch (vehicle) {\n  case \"bike\":\n    console.log(\"Bikes are two-wheelers.\");\n    break;\n  case \"car\":\n    console.log(\"Some cars are 4x4.\");\n  case \"truck\":\n    console.log(\"Trucks can carry heavy loads.\");\n    break;\n  default:\n    console.log(\"Unknown vehicle.\");\n}\n```",
    "a": "```md\nSome cars are 4x4.\nTrucks can carry heavy loads.\n```",
    "d": [
     "```md\nSome cars are 4x4.\n```",
     "```md\nSome cars are 4x4.\nTrucks can carry heavy loads.\nUnknown vehicle.\n```",
     "```md\nUnknown vehicle.\n```"
    ]
   },
   {
    "q": "What is printed to the console with code below?  \n\n```js\nlet x = 5;\nif (x > 1 && x < 10) {\n  console.log(\"x is between 1 and 10\");\n} else {\n  console.log(\"x is not between 1 and 10\");\n}\n```",
    "a": "`x is between 1 and 10`",
    "d": [
     "An error is raised.",
     "Nothing is printed.",
     "`x is not between 1 and 10`"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-functions",
  "module": "javascript-functions",
  "title": "JavaScript Functions Quiz",
  "topic": "Funciones",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which of the following is the correct way to declare a function in JavaScript?",
    "a": "```js\nfunction greet() {\n  console.log(\"Hello there!\");\n}\n```",
    "d": [
     "```js\nfunc greet() {\n  console.log(\"Hello there!\");\n}\n```",
     "```js\ndefineFunction greet() {\n  console.log(\"Hello there!\");\n}\n```",
     "```js\ndef greet() {\n  console.log(\"Hello there!\");\n}\n```"
    ]
   },
   {
    "q": "What happens when you call (or execute) a function?",
    "a": "The code inside the function will run and a value will be returned.",
    "d": [
     "The code inside the function will run and `null` will always be returned.",
     "Nothing will happen when you call a function.",
     "A `TypeError` will be thrown and the program will crash."
    ]
   },
   {
    "q": "Which of the following is the correct way to call a function?",
    "a": "```js\nexampleFunction();\n```",
    "d": [
     "```js\nexampleFunction;\n```",
     "```js\nexampleFunction>>;\n```",
     "```js\n()exampleFunction();\n```"
    ]
   },
   {
    "q": "What is the role of the `return` keyword?",
    "a": "The `return` keyword returns a value from the function.",
    "d": [
     "The `return` keyword will execute the function.",
     "The `return` keyword will throw a type error.",
     "The `return` keyword serves no purpose in functions."
    ]
   },
   {
    "q": "Which of the following is a valid function expression?",
    "a": "```js\nconst getSum = function(x, y) {\n    return x + y;\n};\n```",
    "d": [
     "```js\nexpression function getSum(x, y) {\n    return x + y;\n};\n```",
     "```js\ngetSum: function(x, y) {\n    return x + y;\n};\n```",
     "```js\nfunction = getSum(x, y) {\n    return x + y;\n};\n```"
    ]
   },
   {
    "q": "What are function arguments?",
    "a": "Real values passed to a function when it is called.",
    "d": [
     "Values that represents the absence of a value.",
     "Special values that act similar to anonymous functions.",
     "Placeholder values used inside of the function."
    ]
   },
   {
    "q": "What are function parameters?",
    "a": "Values listed inside the function definition.",
    "d": [
     "Floating point values used inside of the function.",
     "Values passed to a function when it is called.",
     "Values that represent the intentional absence of the value."
    ]
   },
   {
    "q": "What will be logged to the console?\n\n```js\nconst calculateTotal = (amount, taxRate = 0.05) => {\n  return amount + (amount * taxRate);\n};\n\nconsole.log(calculateTotal(100));\n```",
    "a": "`105`",
    "d": [
     "`10`",
     "`undefined`",
     "`1`"
    ]
   },
   {
    "q": "Which of the following is the correct syntax for an arrow function?",
    "a": "```js\nconst sum = (num1, num2) => num1 + num2;\n```",
    "d": [
     "```js\nconst sum <<>> (num1, num2) => num1 + num2;\n```",
     "```js\nconst sum === (num1, num2) === num1 + num2;\n```",
     "```js\nconst sum >=> (num1, num2) => num1 + num2;\n```"
    ]
   },
   {
    "q": "What will be result for the following code?\n\n```js\nfunction greet() {\n  const developer = \"Jessica\";\n  console.log(\"Hello there!\");\n}\n\nconsole.log(developer);\n```",
    "a": "You will get a reference error because `developer` is not defined globally.",
    "d": [
     "Nothing will happen and the code will run normally.",
     "The string `\"Hello there!\"` will be logged to the console.",
     "The string `\"Hello!\"` will be logged to the console."
    ]
   },
   {
    "q": "When can you omit a set of parentheses around a parameter list for an arrow function?",
    "a": "You should only omit the parentheses when you only have one parameter.",
    "d": [
     "You should always omit the parentheses around a parameter list.",
     "You are never supposed to omit the parentheses for an arrow function.",
     "You should only omit the parentheses when you are working with multiple parameters."
    ]
   },
   {
    "q": "When can you omit the curly braces and `return` keyword for an arrow function?",
    "a": "When the function body consists of a single expression.",
    "d": [
     "You should always omit the curly braces and `return` keyword.",
     "You should never omit the curly braces and `return` keyword.",
     "When the function body has multiple lines of code."
    ]
   },
   {
    "q": "What will the following function return?\n\n```js\nfunction exampleFunction() {\n  return \"Hello\";\n  return \"World!\";\n}\n```",
    "a": "`\"Hello\"`",
    "d": [
     "`\"World!\"`",
     "`\"Hello World!\"`",
     "`undefined`"
    ]
   },
   {
    "q": "Which of the following is the correct way to use default parameters?",
    "a": "```js\nfunction sum(num1, num2 = 12) {\n  return num1 + num2;\n}\n```",
    "d": [
     "```js\nfunction sum(num1, num2 <<>> 12) {\n  return num1 + num2;\n}\n```",
     "```js\nfunction sum(num1, num2 === 12) {\n  return num1 + num2;\n}\n```",
     "```js\nfunction sum(num1, num2 >> 12) {\n  return num1 + num2;\n}\n```"
    ]
   },
   {
    "q": "What will be the result for the following code?\n\n```js\nconst developer = \"Jessica\";\n\nfunction greet() {\n  console.log(\"Hello, \" + developer);\n}\n\ngreet();\n```",
    "a": "The string `\"Hello, Jessica\"` will be logged to the console.",
    "d": [
     "The string `\"Hello, developer\"` will be logged to the console.",
     "An error message will display in the console.",
     "Nothing will display in the console."
    ]
   },
   {
    "q": "What happens if you try to remove the curly braces for a regular function?",
    "a": "You will get a syntax error.",
    "d": [
     "An alert box will display on the page with an error.",
     "The program will crash and not start again.",
     "Nothing will happen."
    ]
   },
   {
    "q": "What will be the result for the following code?\n\n```js\nconst sum = (num1, num2) => num1 + num2;\nconsole.log(sum(0, 0) + 10);\n```",
    "a": "The number `10` will be logged to the console.",
    "d": [
     "An error message will display in the console.",
     "The number `0` will be logged to the console.",
     "Nothing will be logged to the console."
    ]
   },
   {
    "q": "What will be the output for the following code?\n\n```js\nconst exampleFunction = (param1, param2) => param1 + param2;\nconsole.log(exampleFunction(3, \"Something\"));\n```",
    "a": "`\"3Something\"`",
    "d": [
     "`null`",
     "`undefined`",
     "`3 + \"Something\"`"
    ]
   },
   {
    "q": "What will be the result for the following code?\n\n```js\nconst sum = (num1, num2) => num1 + num2;\nconsole.log(sum(0, 0) + num2);\n```",
    "a": "An error message saying `num2` is not defined.",
    "d": [
     "An error message saying `num1` is not defined.",
     "The number `0` will be displayed in the console.",
     "`undefined` will be displayed in the console."
    ]
   },
   {
    "q": "What will be the output for the following code?\n\n```js\nconst divideTwoNumbers = (num1, num2) => num1 / num2;\nconsole.log(divideTwoNumbers(3, 0));\n```",
    "a": "`Infinity`",
    "d": [
     "`Error`",
     "`0`",
     "`null`"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-arrays",
  "module": "javascript-arrays",
  "title": "JavaScript Arrays Quiz",
  "topic": "Arreglos",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What will be the output for the following code?\n\n```js\nconst numbers = [1, 2, 3];\nconsole.log(numbers[10]);\n```",
    "a": "`undefined`",
    "d": [
     "`[1, 2, 3]`",
     "`null`",
     "`10`"
    ]
   },
   {
    "q": "Which of the following is the correct way to access the string `\"Jessica\"` from the `developers` array?",
    "a": "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[0]\n```",
    "d": [
     "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[1]\n```",
     "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[2]\n```",
     "```js\nconst developers = [\"Jessica\", \"Naomi\", \"Tom\"];\ndevelopers[-1]\n```"
    ]
   },
   {
    "q": "What value will be assigned to the `index` variable?\n\n```js\nconst numbers = [10, 20, 30, 40];\nconst index = numbers.indexOf(20);\nconsole.log(index);\n```",
    "a": "1",
    "d": [
     "2",
     "3",
     "-1"
    ]
   },
   {
    "q": "What does the rest syntax do?",
    "a": "It captures the remaining elements of an array into a new array.",
    "d": [
     "It is used to divide a string into an array of substrings.",
     "It is used to add or remove elements from any position in an array.",
     "It is used to add elements to the end of the array and will return the new length."
    ]
   },
   {
    "q": "What is array destructuring?",
    "a": "It is used to extract values from arrays and assign them to variables in a more concise and readable way.",
    "d": [
     "It is used to concatenate all of the elements of an array into a single string.",
     "It is used to check if an array contains a specific value.",
     "It is used to remove the last element from an array and will return that removed element."
    ]
   },
   {
    "q": "What value will be assigned to the `arr2` variable?\n\n```js\nconst arr1 = [1, 2, 3];\nconst arr2 = [...arr1, 4, 5];\nconsole.log(arr2);\n```",
    "a": "`[1, 2, 3, 4, 5]`",
    "d": [
     "`[4, 5, 1, 2, 3]`",
     "`[1, 2, [3, 4, 5]]`",
     "`[1, 2, 3]`"
    ]
   },
   {
    "q": "What will this code log to the console?\n\n```js\nconst colors = [\"red\", \"blue\", \"green\", \"yellow\"];\ncolors.splice(1, 2, \"purple\");\nconsole.log(colors);\n```",
    "a": "`[\"red\", \"purple\", \"yellow\"]`",
    "d": [
     "`[\"red\", \"blue\", \"green\", \"yellow\"]`",
     "`[\"red\", \"blue\", \"yellow\"]`",
     "`[\"red\", \"yellow\"]`"
    ]
   },
   {
    "q": "What value will be assigned to the `slicedArr` variable?\n\n```js\nconst arr = [\"apple\", \"banana\", \"cherry\", \"date\"];\nconst slicedArr = arr.slice(1, 3);\nconsole.log(slicedArr);\n```",
    "a": "`[\"banana\", \"cherry\"]`",
    "d": [
     "`[\"apple\", \"banana\"]`",
     "`[\"cherry\", \"date\"]`",
     "`[\"apple\", \"cherry\"]`"
    ]
   },
   {
    "q": "Which method returns the first index of a given element in an array?",
    "a": "`indexOf()`",
    "d": [
     "`firstIndex()`",
     "`lastIndex()`",
     "`searchIndex()`"
    ]
   },
   {
    "q": "Which method is used to remove the first element from an array and returns that removed element?",
    "a": "`shift()`",
    "d": [
     "`pop()`",
     "`slice()`",
     "`splice()`"
    ]
   },
   {
    "q": "What does the `concat()` method do?",
    "a": "Merges two arrays into a new array.",
    "d": [
     "Joins array elements into a string.",
     "Adds an element to the beginning of an array.",
     "Removes an element from the array."
    ]
   },
   {
    "q": "What will be the output of this code?\n\n```js\nconst fruits = [\"apple\", \"banana\", \"cherry\", \"apple\", \"orange\"];\n\nfruits.splice(0, 1);\n\nconsole.log(fruits);\n```",
    "a": "`[\"banana\", \"cherry\", \"apple\", \"orange\"]`",
    "d": [
     "`[\"apple\", \"banana\", \"cherry\", \"apple\", \"orange\"]`",
     "`[\"apple\", \"banana\", \"cherry\"]`",
     "`[\"cherry\", 'apple']`"
    ]
   },
   {
    "q": "What does the `includes()` method do?",
    "a": "It is used to check if an array contains a specific value.",
    "d": [
     "It is used to divide a string into an array of substrings.",
     "It is used to concatenate all of the elements of an array into a single string.",
     "It is used to add or remove elements from any position in an array."
    ]
   },
   {
    "q": "Which of the following methods is used to reverse an array in place?",
    "a": "`reverse()`",
    "d": [
     "`reversed()`",
     "`reverseArr()`",
     "`reversing()`"
    ]
   },
   {
    "q": "What is a two dimensional array?",
    "a": "An array of arrays.",
    "d": [
     "An array that only contains object literals.",
     "An array of fixed length.",
     "An array of floating point numbers."
    ]
   },
   {
    "q": "Which of the following is true about the `indexOf()` method in arrays?",
    "a": "It returns `-1` if the element is not found.",
    "d": [
     "It always returns the last occurrence of the element.",
     "It throws an error if the element is not found.",
     "It requires the array to be sorted."
    ]
   },
   {
    "q": "Which of the following is NOT an array method?",
    "a": "`trim()`",
    "d": [
     "`includes()`",
     "`pop()`",
     "`push()`"
    ]
   },
   {
    "q": "What will be the output for the following code?\n\n```js\nconst arr = [\"o\", \"l\", \"l\", \"e\", \"h\"];\nconsole.log(arr.join(\"\"));\n```",
    "a": "`\"olleh\"`",
    "d": [
     "`[\"o\", \"l\", \"l\", \"e\", \"h\"]`",
     "`\"hello\"`",
     "`undefined`"
    ]
   },
   {
    "q": "What will be the result of using the `shift()` method on an empty array?",
    "a": "`undefined`",
    "d": [
     "`TypeError`",
     "`[]`",
     "`null`"
    ]
   },
   {
    "q": "Which method will return a new array without changing the original array?",
    "a": "`slice()`",
    "d": [
     "`shift()`",
     "`pop()`",
     "`push()`"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-objects",
  "module": "javascript-objects",
  "title": "JavaScript Objects Quiz",
  "topic": "Objetos",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which of the following does NOT describe an object in JavaScript?",
    "a": "A primitive data type.",
    "d": [
     "A collection of key-value pairs.",
     "A container for properties and methods.",
     "A non-primitive data type."
    ]
   },
   {
    "q": "Which of the following object definitions is invalid?",
    "a": "`const product = { color: blue };`",
    "d": [
     "`const book = { \"pages\": 255 };`",
     "`const car = { year: 2025 };`",
     "`const person = { \"name\": \"nora\" };`"
    ]
   },
   {
    "q": "How can you access the `job` property of this `person` object?\n\n```js\nlet person = { job: \"Software Developer\" };\n```",
    "a": "`person.job`",
    "d": [
     "`person -> job`",
     "`person#job`",
     "`person[job]`"
    ]
   },
   {
    "q": "How can you access the `street` property of the `person` object below?\n\n```js\nconst person = {\n  address: {\n    street: \"sample-street\"\n  }\n};\n```",
    "a": "`person[\"address\"][\"street\"]`",
    "d": [
     "`person -> address -> street`",
     "`person#address#street`",
     "`person[address.street]`"
    ]
   },
   {
    "q": "Which of these property keys can only be accessed using bracket notation?",
    "a": "A property key that is dynamic.",
    "d": [
     "A property key that is known and static.",
     "A property key that is nested within multiple levels of an object.",
     "A property key that might not exist in the object."
    ]
   },
   {
    "q": "Which of the following correctly uses destructuring to access the `name` property of the `person` object below?\n\n```js\nconst person = { name: \"John\" }\n```",
    "a": "`const { name } = person;`",
    "d": [
     "`const name = person.name;`",
     "`const name = person[\"name\"];`",
     "`const { ...name } = person;`"
    ]
   },
   {
    "q": "Which of the following correctly uses destructuring to access the `flour` property of the `recipe` object below?\n\n```js\nconst recipe = {\n  ingredients: {\n    flour: \"2 cups\",\n    sugar: \"1 cup\"\n  }\n};\n```",
    "a": "`const { ingredients: { flour } } = recipe;`",
    "d": [
     "`const flour = recipe.ingredients.flour;`",
     "`const flour = recipe[\"ingredients\"][\"flour\"];`",
     "`const { ingredients: flour } = recipe;`"
    ]
   },
   {
    "q": "How can you assign a default value to a property key when using destructuring in JavaScript?",
    "a": "`const { key = \"defaultValue\" } = object;`",
    "d": [
     "`const key = object.key && \"defaultValue\";`",
     "`const key = object.key || \"defaultValue\";`",
     "`const { key: \"defaultValue\" } = object;`"
    ]
   },
   {
    "q": "How can you check if a `car` object has a `year` property?",
    "a": "`car.hasOwnProperty(\"year\");`",
    "d": [
     "`year.hasProperty(\"car\");`",
     "`car.hasProperty(\"year\");`",
     "`car.hasOwnProperty(year);`"
    ]
   },
   {
    "q": "What is an object method?",
    "a": "A function associated with an object.",
    "d": [
     "A string associated with an object.",
     "An array associated with an object.",
     "A number associated with an object."
    ]
   },
   {
    "q": "How can you call the `add` method of this `calculator` object to add the numbers `10` and `7`?\n\n```js\nconst calculator = {\n  add: function(a, b) {\n    return a + b;\n  }\n};\n```",
    "a": "`calculator.add(10, 7);`",
    "d": [
     "`calculator#add(10, 7);`",
     "`calculator.call(add(10, 7));`",
     "`add.calculator(10, 7);`"
    ]
   },
   {
    "q": "Which operator removes a property from an object?",
    "a": "`delete`",
    "d": [
     "`remove`",
     "`erase`",
     "`discard`"
    ]
   },
   {
    "q": "How can you check if a `score` property exists in a `player` object?",
    "a": "`\"score\" in player`",
    "d": [
     "`player in \"score\"`",
     "`player in score`",
     "`score in player`"
    ]
   },
   {
    "q": "How can you create a new empty object in JavaScript?",
    "a": "`new Object()`",
    "d": [
     "`object() new`",
     "`new object()`",
     "`Object() new`"
    ]
   },
   {
    "q": "What is the correct syntax for using optional chaining in JavaScript?",
    "a": "`object?.key`",
    "d": [
     "`object?key`",
     "`object.[\"key\"]`",
     "`object.?key`"
    ]
   },
   {
    "q": "What is optional chaining used for in JavaScript?",
    "a": "Used to safely access properties of an object that might be `null` or `undefined`.",
    "d": [
     "Used to define variables with default values.",
     "Used to define optional methods within an object that may or may not be called.",
     "Used to write more concise code by chaining multiple method calls together in a single statement."
    ]
   },
   {
    "q": "What method is used to convert a JavaScript object into a JSON string?",
    "a": "`JSON.stringify()`",
    "d": [
     "`Stringify.toJSON()`",
     "`JSON.toObject()`",
     "`Object.toJSON()`"
    ]
   },
   {
    "q": "What method converts a JSON string back into a JavaScript object?",
    "a": "`JSON.parse()`",
    "d": [
     "`JSON.toObject()`",
     "`JSON.convert()`",
     "`JSON.object()`"
    ]
   },
   {
    "q": "Which one of these options accesses the `color` property of a `toy` object using bracket notation?",
    "a": "`toy[\"color\"]`",
    "d": [
     "`toy.color`",
     "`toy[color]`",
     "`color[toy]`"
    ]
   },
   {
    "q": "How can you access the `home` phone of this `learner` object in JavaScript using dot notation?\n\n```js\nconst learner = {\n  name: \"Nora\",\n  age: 45,\n  contact: {\n    email: \"nora@email.com\",\n    phone: {\n      home: \"123-456-7890\",\n      work: \"098-765-4321\"\n    }\n  }\n};\n```",
    "a": "`learner.contact.phone.home`",
    "d": [
     "`learner.name.phone.home`",
     "`learner.email.work`",
     "`learner.contact.home`"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-loops",
  "module": "javascript-loops",
  "title": "JavaScript Loops Quiz",
  "topic": "Ciclos",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which of the following best describes iteration?",
    "a": "It is the process of repeating a set of instructions multiple times.",
    "d": [
     "It is the process of writing code repeatedly until it works correctly.",
     "It is a technique for storing data in consecutive memory locations.",
     "It is the process of sending signals between components to establish a connection."
    ]
   },
   {
    "q": "What technique is used for iterations in programming?",
    "a": "Looping",
    "d": [
     "Recursion",
     "Conditionals",
     "Compilation"
    ]
   },
   {
    "q": "Which of the following is an iterable object?",
    "a": "String",
    "d": [
     "Undefined",
     "Number",
     "Boolean"
    ]
   },
   {
    "q": "Which of the following is not a type of loop supported in JavaScript?",
    "a": "`if...else` loop.",
    "d": [
     "`for` loop.",
     "`while` loop.",
     "`for...in` loop."
    ]
   },
   {
    "q": "What is the correct order of the `for` loop declaration?",
    "a": "```javascript\nfor (initialization; condition; increment/decrement) {\n  statement;\n}\n```",
    "d": [
     "```javascript\nfor (condition; increment/decrement; initialization) {\n  statement;\n}\n```",
     "```javascript\nfor (increment/decrement; condition; initialization) {\n  statement;\n}\n```",
     "```javascript\nfor (initialization; increment/decrement; condition) {\n  statement;\n}\n```"
    ]
   },
   {
    "q": "Which loop executes the code block once, before checking if the condition is true, and will continue working as long as the condition remains true?",
    "a": "`do...while` loop.",
    "d": [
     "`while` loop.",
     "`for...of` loop.",
     "`for...in` loop."
    ]
   },
   {
    "q": "Which of the following will loop over the values of an iterable object?",
    "a": "`for...of` loop.",
    "d": [
     "`for...in` loop.",
     "`for` loop.",
     "`do...while` loop."
    ]
   },
   {
    "q": "Which of the following best defines an infinite loop?",
    "a": "A loop whose termination condition is never met or is absent.",
    "d": [
     "A loop that runs until the condition becomes false.",
     "A loop that runs once and then is terminated.",
     "A loop that automatically stops after a fixed number of iterations."
    ]
   },
   {
    "q": "How many times will the following loop run?  \n\n```js\nfor (let i = 2; i < 10; i+=2) {  \n  console.log(i);  \n}\n```",
    "a": "4",
    "d": [
     "5",
     "9",
     "10"
    ]
   },
   {
    "q": "Which loop is the best for iterating objects?",
    "a": "`for...in` loop.",
    "d": [
     "`for...of` loop.",
     "`do...while` loop.",
     "`for` loop."
    ]
   },
   {
    "q": "What is the difference between the `for...in` loop and the `for...of` loop?",
    "a": "`for...in` loop iterates over property names (keys), while the `for...of` loop iterates over property values.",
    "d": [
     "`for...in` loop iterates over property values, while the `for...of` loop iterates over property names (keys).",
     "`for...in` loops create new properties, while `for...of` loops modify existing properties.",
     "`for...in` loops can only be used with strings, while the `for...of` loops can be used with both strings and numbers."
    ]
   },
   {
    "q": "Which of these would cause an infinite loop?",
    "a": "A loop condition that always returns true.",
    "d": [
     "Initialization of variable.",
     "A loop condition that eventually gives false.",
     "Increment/decrement logic."
    ]
   },
   {
    "q": "What statement can be used to break out of a loop completely?",
    "a": "The `break` statement.",
    "d": [
     "The `continue` statement.",
     "The `label` statement.",
     "The `skip` statement."
    ]
   },
   {
    "q": "Which statement can be used to skip the current iteration and move to the next iteration?",
    "a": "The `continue` statement.",
    "d": [
     "The `break` statement.",
     "The `label` statement.",
     "The `return` statement."
    ]
   },
   {
    "q": "What is printed to the console with the following code?\n\n```js\nfor (let i = 0; i < 25; i += 2) {\n  if (i % 5 === 0) {\n    continue;\n  }\n  if (i % 13 === 0) {\n    break;\n  }\n  console.log(i);\n}\n```",
    "a": "`2`, `4`, `6`, `8`, `12`, `14`, `16`, `18`, `22`, `24`",
    "d": [
     "`0`, `2`, `4`, `6`, `8`, `12`, `14`, `16`, `18`, `22`, `24`",
     "`0`, `2`, `4`, `6`, `8`, `12`",
     "`2`, `4`, `6`, `8`, `12`"
    ]
   },
   {
    "q": "What would the following code print to the console??\n\n```javascript\nfor (let i = 1; i < 6; i++) {\n  if (i === 4) break;\n  console.log(i);\n}\n```",
    "a": "`1`, `2`, `3`",
    "d": [
     "`1`, `2`, `3`, `4`, `5`, `6`",
     "`1`, `2`, `3`, `4`, `5`",
     "`1`, `2`, `3`, `4`"
    ]
   },
   {
    "q": "What will be printed to the console with the code below?\n\n```javascript\nconst shoppingList = { tomatoes: 4, apples: 10 };\nfor (const item in shoppingList) {\n  console.log(item);\n}\n```",
    "a": "`tomatoes`, `apples`",
    "d": [
     "`tomatoes - 4`, `apples - 10`",
     "`4`, `10`",
     "`tomatoes:4`, `apples:10`"
    ]
   },
   {
    "q": "What will be the console output of the code below?\n\n```javascript\nfor (let i = 2; i <= 13; i++) {\n  if (i % 2 === 0) continue;\n  console.log(i);\n}\n```",
    "a": "`3`, `5`, `7`, `9`, `11`, `13`",
    "d": [
     "`2`, `4`, `6`, `8`, `10`, `12`",
     "`1`, `3`, `5`, `7`, `9`, `11`, `13`",
     "`1`, `3`, `5`, `7`, `9`, `11`"
    ]
   },
   {
    "q": "What would be printed to the console with the code below?\n\n```javascript\nconst fruits = [\"Mango\", \"Pineapple\", \"Oranges\"];\nfor (const fruit of fruits) {\n  console.log(fruit);\n}\n```",
    "a": "`Mango`, `Pineapple`, `Oranges`",
    "d": [
     "`0`, `1`, `2`",
     "`Pineapple`, `Oranges`, `Mango`",
     "`Oranges`, `Pineapple`, `Mango`"
    ]
   },
   {
    "q": "How many times will the code below output the string `in the loop`?\n\n```javascript\nlet x = 0\nwhile (x < 5) {\n  console.log(\"in the loop\");\n}\n```",
    "a": "Infinite times",
    "d": [
     "3 times",
     "4 times",
     "5 times"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-fundamentals",
  "module": "review-javascript-fundamentals",
  "title": "JavaScript Fundamentals Quiz",
  "topic": "Repaso de fundamentos",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which one of these will create a String object?",
    "a": "```js\nnew String(\"Hello World\");\n```",
    "d": [
     "```js\nString({ \"Hello World\" });\n```",
     "```js\nString(\"Hello World\");\n```",
     "```js\n\"Hello World\".toString();\n```"
    ]
   },
   {
    "q": "How can you convert a String object into a string literal?",
    "a": "With the `.toString()` method.",
    "d": [
     "With the `String()` constructor.",
     "With the `.stringify()` method.",
     "Enclose the `String` object in double quotes."
    ]
   },
   {
    "q": "Why can you use methods like `.length`, `.repeat()`, `.concat()`, and `.slice()` on a string primitive in JavaScript?",
    "a": "JavaScript temporarily wraps the string primitive in a String object.",
    "d": [
     "Those methods exist natively on string primitives.",
     "String primitives are stored as objects internally.",
     "JavaScript temporarily converts the string primitive to an array."
    ]
   },
   {
    "q": "What will the following code log to the console?\n\n```js\nlet stringArray = [8, 9, 10].toString();\nconsole.log(stringArray);\n```",
    "a": "`\"8,9,10\"`",
    "d": [
     "`[8,9,10]`",
     "`[\"8\", \"9\", \"10\"]`",
     "`\"8\", \"9\", \"10\"`"
    ]
   },
   {
    "q": "Which of the following returns a `Number` object from the string `\"123\"`?",
    "a": "`new Number(\"123\")`",
    "d": [
     "`Object(\"123\")`",
     "`\"123\".toNumber()`",
     "`Number(\"123\")`"
    ]
   },
   {
    "q": "What will `Number(true)` and `Number(false)` return, respectively?",
    "a": "`1` and `0`",
    "d": [
     "`undefined` and `undefined`",
     "`NaN` and `NaN`",
     "`true` and `false`"
    ]
   },
   {
    "q": "What will `Number(undefined)` and `Number(null)` return, respectively?",
    "a": "`NaN` and `0`",
    "d": [
     "`NaN` and `NaN`",
     "`0` and `0`",
     "`undefined` and `null`"
    ]
   },
   {
    "q": "Which of the following is the best name for a boolean variable that checks if a user is allowed to do something on your website?",
    "a": "`hasPermission`",
    "d": [
     "`getPermission`",
     "`handlePermission`",
     "`permission`"
    ]
   },
   {
    "q": "Which of the following is the best name for a function that runs when a user submits a form?",
    "a": "`handleSubmit`",
    "d": [
     "`hasSubmitted`",
     "`formSubmit`",
     "`didSubmit`"
    ]
   },
   {
    "q": "What is a sparse array?",
    "a": "An array where one or more indices are not assigned a value.",
    "d": [
     "An array where one or more indices have a value of `null`.",
     "An array where one or more indices have a value of `undefined`.",
     "An array where one or more indices have a value of an empty object literal."
    ]
   },
   {
    "q": "In which of the following examples will `arr` NOT be a sparse array?",
    "a": "```js\nconst arr = Array.from({ length: 5 });\n```",
    "d": [
     "```js\nconst arr = new Array(5);\n```",
     "```js\nconst arr = [1, 2, 3];\narr[4] = 4;\n```",
     "```js\nconst arr = [1, 2, 3, , 5];\n```"
    ]
   },
   {
    "q": "What is the primary purpose of a linter?",
    "a": "To detect potential errors and issues in code.",
    "d": [
     "To format code automatically.",
     "To optimize code for performance.",
     "To create documentation for code."
    ]
   },
   {
    "q": "What is a benefit of using a formatter in a codebase?",
    "a": "They ensure a consistent code style.",
    "d": [
     "They allow developers to compile code more efficiently.",
     "They convert code to a specific programming language.",
     "They detect logical errors."
    ]
   },
   {
    "q": "In JavaScript, who or what is typically responsible for allocating memory to variables?",
    "a": "The runtime engine.",
    "d": [
     "The developer.",
     "The operating system.",
     "The server."
    ]
   },
   {
    "q": "What will be logged to the console in the following code?\n\n```js\nfunction trackTotal(initialValue) {\n  let total = initialValue;\n  return function(increment) {\n    total += increment;\n    return total;\n  };\n}\n\nlet track = trackTotal(1);\nconsole.log(track(2));\nconsole.log(track(3));\n```",
    "a": "```js\n3\n6\n```",
    "d": [
     "```js\n2\n5\n```",
     "```js\n2\n3\n```",
     "```js\n5\n6\n```"
    ]
   },
   {
    "q": "What is hoisting in JavaScript?",
    "a": "The process of moving variable declarations to the top of their scope.",
    "d": [
     "Raising errors to the top of the code.",
     "The process of creating new variables.",
     "Automatically moving `var` declarations to the top of the block."
    ]
   },
   {
    "q": "Why is using the `var` keyword considered bad practice in modern JavaScript?",
    "a": "They're accessible outside their block.",
    "d": [
     "They're slower than `let` and `const`.",
     "They cause syntax errors.",
     "They don't allow type checking."
    ]
   },
   {
    "q": "What is the purpose of modules in JavaScript?",
    "a": "To organize code into reusable units.",
    "d": [
     "To improve code performance.",
     "To make code more difficult to understand.",
     "To create new programming languages."
    ]
   },
   {
    "q": "How do you add an `app.js` script as a module in an HTML document?",
    "a": "```html\n<script type=\"module\" src=\"app.js\"></script>\n```",
    "d": [
     "```html\n<script type=\"module/javascript\" src=\"app.js\"></script>\n```",
     "```html\n<script src=\"app.js\"></script>\n```",
     "```html\n<script src=\"app.js\" module></script>\n```"
    ]
   },
   {
    "q": "Which of the following examples exports the `calculateSum` function from a `utils.js` module and properly imports and uses it in an `app.js` file?",
    "a": "```js\n// utils.js\nexport function calculateSum(a, b) {\n  return a + b;\n}\n\n// app.js\nimport { calculateSum } from './utils.js';\nconsole.log(calculateSum(2, 3));\n```",
    "d": [
     "```js\n// utils.js\nexport default function calculateSum(a, b) {\n  return a + b;\n}\n\n// app.js\nimport { calculateSum } from './utils.js';\nconsole.log(calculateSum(2, 3));\n```",
     "```js\n// utils.js\nexport function calculateSum(a, b) {\n  return a + b;\n}\n\n// app.js\nimport calculateSum from './utils.js';\nconsole.log(calculateSum(2, 3));\n```",
     "```js\n// utils.js\nfunction calculateSum(a, b) {\n  return a + b;\n}\n\nexport default calculateSum;\n\n// app.js\nimport * as utils from './utils.js';\nconsole.log(utils.calculateSum(2, 3));\n```"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-higher-order-functions",
  "module": "higher-order-functions-and-callbacks",
  "title": "JavaScript Higher Order Functions Quiz",
  "topic": "Funciones de orden superior",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which of the following statements about JavaScript higher-order functions is NOT true?",
    "a": "All functions in JavaScript, including those that do not take or return other functions, can be classified as higher-order functions.",
    "d": [
     "Higher-order functions can greatly enhance code readability and maintainability by enabling functional programming techniques.",
     "Higher-order functions like map, filter, and reduce are powerful tools for array manipulation, but they are not unique to functional programming.",
     "Higher-order functions may introduce complexity in understanding code, but they can also lead to more expressive and concise solutions."
    ]
   },
   {
    "q": "What is a factory function in the context of higher order functions?",
    "a": "A function that returns a new function based on specific parameters",
    "d": [
     "A function that creates new variables.",
     "A function that only works with strings.",
     "A function that automatically generates code comments."
    ]
   },
   {
    "q": "After code execution, what will be the value of `forEachRes` and `mapRes`?\n\n```js\nconst numbers = [1, 1, 1, 1, 1];\nlet sum = 0;\nconst forEachRes = numbers.forEach(num => {\n  return (sum += num);\n});\nconst mapRes = numbers.map(num => {\n  return (sum += num);\n});\n```",
    "a": "`forEachRes` is `undefined` and `mapRes` is `[6,7,8,9,10]`",
    "d": [
     "`forEachRes` is `undefined` and `mapRes` is `[1,2,3,4,5]`",
     "`forEachRes` is `0` and `mapRes` is `[1,2,3,4,5]`",
     "`forEachRes` is `5` and `mapRes` is `[1,2,3,4,5]`"
    ]
   },
   {
    "q": "What is the result of this code?\n\n```js\n[, undefined, 'a', 'b', { 20: 5 }].sort();\n```",
    "a": "```js\n[{ '20': 5 }, 'a', 'b', undefined, empty]\n```",
    "d": [
     "Unsupported elements for an array to be sorted, hence error.",
     "Callback not supplied, hence error.",
     "```js\n[empty, 'a', 'b', undefined, { '20': 5 }]\n```"
    ]
   },
   {
    "q": "Which of the following describes a callback function in JavaScript?",
    "a": "A function passed as an argument to another function, to be executed by that function's logic.",
    "d": [
     "A function that is called immediately upon declaration.",
     "A function that is invoked with a specific context.",
     "A function that returns another function."
    ]
   },
   {
    "q": "What is the result of using `reduce()` on an array?",
    "a": "It varies depending on the accumulator's initial value and the callback function.",
    "d": [
     "A boolean indicating whether any elements meet a condition.",
     "An array with all elements reduced by specified callback function.",
     "An array of booleans."
    ]
   },
   {
    "q": "How does the `sort()` method behave if no compare function is provided in numerical sorting?",
    "a": "It sorts the array as strings based on UTF-16 code units.",
    "d": [
     "It fills the empty slots with `null`.",
     "It returns an array of special characters.",
     "It sorts the array in reverse order."
    ]
   },
   {
    "q": "What is the purpose of the `some()` method in JavaScript?",
    "a": "To determine if any elements in an array pass a specified test.",
    "d": [
     "To create a new array with the results of a function applied to each element.",
     "To iterate through an array without producing a result.",
     "To reduce an array to a single value based on a callback function."
    ]
   },
   {
    "q": "Which of the following is a valid example of method chaining?",
    "a": "```js\nstr.toLowerCase().trim().replace(' ', '_');\n```",
    "d": [
     "```js\nMath.random();\n```",
     "```js\narray.push(1).pop();\n```",
     "```js\nconsole.log('Hello');\n```"
    ]
   },
   {
    "q": "What is the output of the following code?\n\n```js\nlet numbers = [2, 4, 8, 10];\n\nnumbers.forEach(function(number) {\n    console.log(number % 2);\n});\n```",
    "a": "`0 0 0 0`",
    "d": [
     "`2 4 8 10`",
     "`null null null null`",
     "`1 2 4 5`"
    ]
   },
   {
    "q": "Which of the following is a benefit of method chaining?",
    "a": "It promotes simplified syntax and more readable code by allowing multiple operations in a single expression.",
    "d": [
     "It inherently optimizes performance by reducing the execution time of functions.",
     "It eliminates the need for temporary variables, but may increase memory usage in some cases.",
     "It allows for error handling and debugging to be more straightforward."
    ]
   },
   {
    "q": "How can you sort an array of objects by a specific property using the `sort` method?",
    "a": "Use a compare function that compares the property values.",
    "d": [
     "The `sort` method cannot sort objects.",
     "Use the `reverse` method after sorting.",
     "Convert the objects to strings and sort them."
    ]
   },
   {
    "q": "In method chaining, what is a common practice to enhance clarity and debugging?",
    "a": "Break long chains into multiple steps.",
    "d": [
     "Use fewer methods in the chain.",
     "Avoid chaining methods that return only primitive values.",
     "Use only built-in methods."
    ]
   },
   {
    "q": "What is a potential downside of using method chaining excessively in your code?",
    "a": "It can make the code harder to debug.",
    "d": [
     "It makes the code run slower.",
     "It prevents the use of comments.",
     "It makes the file size larger."
    ]
   },
   {
    "q": "Which method would you use to determine if all elements in an array are strings?",
    "a": "`every()`",
    "d": [
     "`some()`",
     "`everyInstance()`",
     "`filter()`"
    ]
   },
   {
    "q": "What will be the value of `originalArray` after the following code is run?\n\n```js\nconst originalArray = [{ id: 1 }, { id: 2 }, { id: 3 }];\nconst filteredArray = originalArray.filter(item => item.id > 1);\nfilteredArray[0].id = 4;\n```",
    "a": "`[{ id: 1 }, { id: 4 }, { id: 3 }]`",
    "d": [
     "`[{ id: 1 }, { id: 2 }, { id: 3 }]`",
     "`[{ id: 1 }]`",
     "`[{ id: 4 }, { id: 2 }, { id: 3 }]`"
    ]
   },
   {
    "q": "What will be the value of `shortWords` after the following code is run?\n\n```js\nconst words = ['apple', 'banana', 'pear', 'kiwi'];\nconst shortWords = words.filter(word => word.length <= 5);\n```",
    "a": "`['apple', 'pear', 'kiwi']`",
    "d": [
     "`[]`",
     "`['pear', 'kiwi']`",
     "`['apple', 'banana']`"
    ]
   },
   {
    "q": "What is the purpose of providing an initial value as an argument to the `reduce()` method?",
    "a": "To define the starting value for the accumulator.",
    "d": [
     "To set the length of the array.",
     "To limit the number of iterations.",
     "To specify the return type of the function."
    ]
   },
   {
    "q": "Can the `map` method be used on objects that are not arrays?",
    "a": "No, it is specifically designed for arrays.",
    "d": [
     "Yes, it can be used on any object.",
     "Yes, but only on objects with numeric properties.",
     "It depends on the JavaScript version."
    ]
   },
   {
    "q": "What is the primary purpose of the `map` method in JavaScript?",
    "a": "To create a new array containing the results of calling a provided function on each element in the starting array.",
    "d": [
     "To sort an array and return a new array while maintaining the original order.",
     "To filter elements from an array and remove or add elements based on a condition.",
     "To find a specific element in an array and return its index along with the element."
    ]
   }
  ]
 },
 {
  "block": "quiz-dom-manipulation-and-click-event-with-javascript",
  "module": "dom-manipulation-and-events",
  "title": "DOM Manipulation and Click Events with JavaScript Quiz",
  "topic": "DOM y eventos",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is the Document Object Model?",
    "a": "A programming interface that lets you interact with HTML documents.",
    "d": [
     "A programming language used to interact with an HTML page.",
     "A set of objects that contain only floating point numbers.",
     "A set of JavaScript classes representing HTML elements."
    ]
   },
   {
    "q": "What does API stand for?",
    "a": "Application Programming Interface",
    "d": [
     "Additional Programming Interface",
     "Adding Programming Interface",
     "Another Programming Interface"
    ]
   },
   {
    "q": "How can you use JavaScript to find all HTML anchors with missing hyperlinks?",
    "a": "```js\ndocument.querySelectorAll(\"a:not([href])\");\n```",
    "d": [
     "```js\ndocument.querySelectorAll(\"link![href]\");\n```",
     "```js\ndocument.querySelectorAll(\"link:not([href])\");\n```",
     "```js\ndocument.querySelectorAll(\"a![href]\");\n```"
    ]
   },
   {
    "q": "What does the `textContent` property do?",
    "a": "It returns the plain text content of an element.",
    "d": [
     "It removes text content from all HTML elements.",
     "It removes text content from your JavaScript file.",
     "It adds text to all arrays and objects in your JavaScript file."
    ]
   },
   {
    "q": "What does the `innerHTML` property do?",
    "a": "It is a property of the `Element` used to set or update parts of the HTML markup.",
    "d": [
     "It is a property of the `Element` used to get all text content for an HTML element.",
     "It is a property of the `Element` used to add annotations to your HTML.",
     "It is a property of the `Element` used to trigger events in your HTML."
    ]
   },
   {
    "q": "Which of the following will add a valid event listener?",
    "a": "```js\nbtn.addEventListener(\"click\", () => alert(\"You clicked the button\"));\n```",
    "d": [
     "```js\nbtn.addEventListener(\"accept\", () => alert(\"You clicked the button\"));\n```",
     "```js\nbtn.addEventListener(\"allow\", () => alert(\"You clicked the button\"));\n```",
     "```js\nbtn.addEventListener(\"trigger\", () => alert(\"You clicked the button\"));\n```"
    ]
   },
   {
    "q": "Which of the following is NOT a valid method of the `document` object?",
    "a": "`addElementToDOM()`",
    "d": [
     "`getElementById()`",
     "`querySelector()`",
     "`createElement()`"
    ]
   },
   {
    "q": "Which of the following will set the `class` attribute to `my-class`?",
    "a": "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"class\", \"my-class\");\n```",
    "d": [
     "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"set\", \"class\");\n```",
     "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"remove\", \"my-class\");\n```",
     "```js\nconst para = document.getElementById(\"para\");\npara.setAttribute(\"add\", \"class\");\n```"
    ]
   },
   {
    "q": "What is the `Event` object?",
    "a": "It is a payload that triggers when a user interacts with your web page in some way.",
    "d": [
     "It is a special object used to remove events from your JavaScript project.",
     "It is used to automatically add events to your JavaScript projects.",
     "It is a special object used when working with arrays."
    ]
   },
   {
    "q": "Which of the following is a method used to remove an event listener that was previously added to an element using the `addEventListener()` method?",
    "a": "`removeEventListener()`",
    "d": [
     "`removalOfEventListener()`",
     "`removedEventListener()`",
     "`removingEventListener()`"
    ]
   },
   {
    "q": "What are inline event handlers?",
    "a": "Special attributes on an HTML element that are used to execute JavaScript code when an event occurs.",
    "d": [
     "Special attributes on an HTML element that are used to cancel all events.",
     "Special attributes on an HTML element used only to trigger form submissions in your JavaScript code.",
     "Special attributes on an HTML element used to remove events."
    ]
   },
   {
    "q": "What are the two main categories for web APIs?",
    "a": "Browser APIs and third-party APIs.",
    "d": [
     "Java APIs and third-party APIs.",
     "Browser APIs and Rust APIs.",
     "System APIs and third-party APIs."
    ]
   },
   {
    "q": "Which event is triggered when all of the HTML page's elements have been parsed by the browser?",
    "a": "`DOMContentLoaded`",
    "d": [
     "`load`",
     "`DOMLoaded`",
     "`HTMLContentLoaded`"
    ]
   },
   {
    "q": "Which of the following is a property that represents the inline style of an element?",
    "a": "`style`",
    "d": [
     "`content`",
     "`event`",
     "`load`"
    ]
   },
   {
    "q": "Which of the following is the correct way to use an inline event handler?",
    "a": "`<button onclick=\"validate()\">Validate</button>`",
    "d": [
     "`<button eventclick=\"validate()\">Validate</button>`",
     "`<button click=\"validate()\">Validate</button>`",
     "`<button clickevent=\"validate()\">Validate</button>`"
    ]
   },
   {
    "q": "Which of the following methods is used to delay an action for a specified time?",
    "a": "`setTimeout()`",
    "d": [
     "`setInterval()`",
     "`delay()`",
     "`sleep()`"
    ]
   },
   {
    "q": "Which of the following can be used to create and control animations directly inside JavaScript?",
    "a": "Web Animations API",
    "d": [
     "Allow Animations API",
     "Control Animations API",
     "Create Animations API"
    ]
   },
   {
    "q": "What does the Canvas API do?",
    "a": "It is used to manipulate graphics via your JavaScript file.",
    "d": [
     "It is used to animate graphics in your CSS file.",
     "It is used to only remove graphics from your JavaScript file.",
     "It is used to remove graphics from your HTML file."
    ]
   },
   {
    "q": "What is event delegation?",
    "a": "The process of listening to events that have bubbled up to a parent.",
    "d": [
     "The process of listening to events when an event is canceled.",
     "The process of listening to events when a click event occurs.",
     "The process of listening to events when a change event occurs."
    ]
   },
   {
    "q": "Which of the following is NOT a method you can use when working with dialogs and modals?",
    "a": "`removeModal()`",
    "d": [
     "`show()`",
     "`close()`",
     "`showModal()`"
    ]
   }
  ]
 },
 {
  "block": "quiz-js-a11y",
  "module": "js-a11y",
  "title": "JavaScript and Accessibility Quiz",
  "topic": "JavaScript y accesibilidad",
  "passing": [
   9,
   10
  ],
  "questions": [
   {
    "q": "Which attribute is used for accessibility purposes to indicate if a control is expanded or collapsed?",
    "a": "`aria-expanded`",
    "d": [
     "`aria-controlled`",
     "`aria-controls`",
     "`aria-expands`"
    ]
   },
   {
    "q": "Which two attributes can be used in combination with `aria-expanded` to establish a programmatic connection between the controlling element and the element it controls?",
    "a": "`aria-controls` and `aria-owns`",
    "d": [
     "`aria-labelledBy` and `aria-owns`",
     "`aria-controls` and `aria-label`",
     "`aria-live` and `aria-owns`"
    ]
   },
   {
    "q": "Which of the following attributes creates a live region on your page which can be used to notify screen reader users of dynamic content changes in the live region as they occur?",
    "a": "`aria-live`",
    "d": [
     "`aria-live-regions`",
     "`aria-lives`",
     "`aria-live-region`"
    ]
   },
   {
    "q": "Which of the following `div` elements will be disabled only to people using assistive technologies, such as screen readers?",
    "a": "```html\n<div role=\"button\" tabindex=\"-1\" aria-disabled=\"true\">Edit</div>\n```",
    "d": [
     "```html\n<div role=\"button\" tabindex=\"-1\" aria-disables=\"true\">Edit</div>\n```",
     "```html\n<div role=\"button\" tabindex=\"-1\" aria-disabling=\"true\">Edit</div>\n```",
     "```html\n<div role=\"button\" tabindex=\"-1\" aria-disable=\"true\">Edit</div>\n```"
    ]
   },
   {
    "q": "Which of the following is a valid use of the `aria-expanded` attribute?",
    "a": "```html\n<button aria-expanded=\"true\">Menu</button>\n```",
    "d": [
     "```html\n<button aria-expanded=\"expand\">Menu</button>\n```",
     "```html\n<button aria-expanded=\"allow\">Menu</button>\n```",
     "```html\n<button aria-expanded=\"set\">Menu</button>\n```"
    ]
   },
   {
    "q": "Which attribute is used to create a programmatic relationship between a controlling element and the element it affects on the page?",
    "a": "`aria-controls`",
    "d": [
     "`aria-set`",
     "`aria-region`",
     "`aria-expanded`"
    ]
   },
   {
    "q": "Which of the following is NOT a common use case for live regions?",
    "a": "Messages that are displayed before an action has been taken (such as a confirmation dialog).",
    "d": [
     "Messages that are displayed after an action has been taken (such as an error message or confirmation).",
     "Content that updates periodically (such as a ticker, marquee, or countdown timer).",
     "General status messages (such as updates about a process)."
    ]
   },
   {
    "q": "Which of the following examples is the correct way to indicate which tab is currently selected?",
    "a": "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-selected=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-selected=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-selected=\"false\">Tab 3</button>\n</div>\n```",
    "d": [
     "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-selecting=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-selecting=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-selecting=\"false\">Tab 3</button>\n</div>\n```",
     "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-select=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-select=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-select=\"false\">Tab 3</button>\n</div>\n```",
     "```html\n<div role=\"tablist\">\n  <button role=\"tab\" aria-selects=\"true\">Tab 1</button>\n  <button role=\"tab\" aria-selects=\"false\">Tab 2</button>\n  <button role=\"tab\" aria-selects=\"false\">Tab 3</button>\n</div>\n```"
    ]
   },
   {
    "q": "Which of the following is NOT a valid value for the `aria-live` attribute?",
    "a": "`on`",
    "d": [
     "`off`",
     "`polite`",
     "`assertive`"
    ]
   },
   {
    "q": "Which of the following `aria-live` attribute values means that the update is very important and has the highest priority?",
    "a": "`assertive`",
    "d": [
     "`now`",
     "`immediate`",
     "`urgent`"
    ]
   }
  ]
 },
 {
  "block": "quiz-debugging-javascript",
  "module": "debugging-javascript",
  "title": "Debugging JavaScript Quiz",
  "topic": "Depuración",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What type of error occurs when a variable is used before it is defined?",
    "a": "`ReferenceError`",
    "d": [
     "`SyntaxError`",
     "`LogicalError`",
     "`RangeError`"
    ]
   },
   {
    "q": "Which JavaScript statement can be used to intentionally pause the execution of your code for debugging purposes?",
    "a": "`debugger`",
    "d": [
     "`try...catch`",
     "`console.log()`",
     "`alert()`"
    ]
   },
   {
    "q": "Which console method can be used to display data as a table?",
    "a": "`console.table()`",
    "d": [
     "`console.log()`",
     "`console.warn()`",
     "`console.error()`"
    ]
   },
   {
    "q": "How can you inspect network requests in Chrome developer tools?",
    "a": "By using the \"Network\" tab.",
    "d": [
     "By using the \"Network Links\" tab.",
     "By using the \"Console\" tab.",
     "By using the \"Sources\" tab."
    ]
   },
   {
    "q": "What is the correct syntax for using `try...catch` in JavaScript?",
    "a": "`try { ... } catch(error) { ... }`",
    "d": [
     "`try { ... } else { ... }`",
     "`try { ... } stack(catch) { ... }`",
     "`try { ... } error { ... }`"
    ]
   },
   {
    "q": "Which of the following is an example of a `SyntaxError`?",
    "a": "Missing a comma between elements of an array.",
    "d": [
     "Using a variable before it is declared.",
     "Using a variable twice in the same scope.",
     "Using a variable that is out of scope."
    ]
   },
   {
    "q": "What is the purpose of breakpoints in JavaScript debugging?",
    "a": "Pause execution at a specific point.",
    "d": [
     "Automatically correct code mistakes.",
     "Prevent code from being executed.",
     "Log messages to the console."
    ]
   },
   {
    "q": "What happens when the `throw` statement is executed?",
    "a": "An exception is thrown and the `catch` block (if present) is executed.",
    "d": [
     "The program terminates immediately, ignoring all remaining code.",
     "The throw statement logs an error to the console but does not stop execution.",
     "It pauses code execution until resumed by disabling breakpoints."
    ]
   },
   {
    "q": "Which method would you use to inspect variables or expressions during debugging in developer tools?",
    "a": "`console.log()`",
    "d": [
     "`inspect()`",
     "`trace()`",
     "`console.error()`"
    ]
   },
   {
    "q": "What type of error will occur when the following code is executed?\n\n```js\nfunction example() {\n  console.log(a);\n  let a = 5;\n}\n\nexample();\n```",
    "a": "`ReferenceError`",
    "d": [
     "`FunctionError`",
     "`SyntaxError`",
     "Stack overflow error"
    ]
   },
   {
    "q": "Which tool is commonly used to step through code line by line during debugging?",
    "a": "Breakpoints in Developer Tools.",
    "d": [
     "`console.log()`",
     "`alert()`",
     "`throw` statement."
    ]
   },
   {
    "q": "What type of error occurs when attempting to access a property of `undefined`?",
    "a": "`TypeError`",
    "d": [
     "`SyntaxError`",
     "`LogicalError`",
     "`RangeError`"
    ]
   },
   {
    "q": "What does the `finally` block do in a `try...catch` statement?",
    "a": "Always executes, regardless of errors.",
    "d": [
     "Only executes if there's an error.",
     "Skips execution if `catch` is triggered.",
     "Exits the code block immediately."
    ]
   },
   {
    "q": "What would be the result of running the following code?\n\n```js\nconst arr = [];\narr.length = -1; \n```",
    "a": "The code will throw a `RangeError`.",
    "d": [
     "The code will throw a `SyntaxError`.",
     "The code will log an empty array to the console.",
     "The code will throw an out of memory error."
    ]
   },
   {
    "q": "Which of the following answers is true about the `debugger` statement in JavaScript?",
    "a": "The `debugger` statement is ignored when the developer tools are not open.",
    "d": [
     "The `debugger` statement is always ignored by the browser.",
     "The `debugger` statement sends an error report to the server.",
     "The `debugger` statement always reloads the page and clears the console."
    ]
   },
   {
    "q": "What is the primary purpose of \"profiling\" in JavaScript?",
    "a": "To identify performance bottlenecks by recording CPU usage, function calls, and execution time.",
    "d": [
     "To write unit tests for JavaScript functions and create profiles of code execution.",
     "To pause code execution and release the captured resources like memory and CPU.",
     "To convert JavaScript code into machine code for faster execution."
    ]
   },
   {
    "q": "What is a \"watcher\" in the context of debugging?",
    "a": "A tool for monitoring the value of variables.",
    "d": [
     "A tool for pausing code execution.",
     "A built-in function for logging errors.",
     "A JavaScript method for handling exceptions."
    ]
   },
   {
    "q": "When should you use `console.error()` instead of `console.log()`?",
    "a": "To log error messages.",
    "d": [
     "To display table data.",
     "To log messages only during debugging.",
     "To log information about the browser."
    ]
   },
   {
    "q": "What does the `Error()` constructor do in JavaScript?",
    "a": "Creates a new error object that can be thrown.",
    "d": [
     "Logs error messages to the console.",
     "Runs code in a sandbox.",
     "Terminates the program."
    ]
   },
   {
    "q": "What is the purpose of the `console.dir()` method in JavaScript?",
    "a": "To output a hierarchical, interactive list of properties for a specified JavaScript object.",
    "d": [
     "To create a separate directory for log files for individual error type.",
     "To generate a visual representation of the console output and save it in a pdf file.",
     "To stop the program execution and display an error message related to memory and CPU usage."
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-regular-expressions",
  "module": "basic-regex",
  "title": "JavaScript Regular Expressions Quiz",
  "topic": "Expresiones regulares",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which of the following is NOT a valid regular expression?",
    "a": "```js\n\"hello, world!\"\n```",
    "d": [
     "```js\n/hello, world!/i\n```",
     "```js\nnew RegExp(\"hello, world!\")\n```",
     "```js\n/(?:^|\\s)hello[,]?\\sworld[!]?(?:$|\\s)/i\n```"
    ]
   },
   {
    "q": "Which `RegExp` contains the same pattern as the regular expression `/f[o0]{2} b[a4@]r/i`?",
    "a": "```js\nnew RegExp(\"f[o0]{2} b[a4@]r\", \"i\")\n```",
    "d": [
     "```js\nnew RegExp(\"/f[o0]{2} b[a4@]r/\", \"i\")\n```",
     "```js\nnew RegExp(\"f[o0]{2} b[a4@]r\", \"g\")\n```",
     "```js\nnew RegExp(\"f[o0]{2} b[a4@]r\")\n```"
    ]
   },
   {
    "q": "What is the return type for the regular expression method `test`?",
    "a": "A boolean indicating whether the string matches the regular expression.",
    "d": [
     "An array of strings that matched the regular expression.",
     "An object containing information about the (sub)string the regular expression matched.",
     "`null`, the method `test` only validates if the given regular expression is valid."
    ]
   },
   {
    "q": "What does the `match` method do when passed a regular expression without any flags?",
    "a": "It searches for the first full match, and returns an array containing that first match.",
    "d": [
     "It searches for any strings that match the given regular expression, and returns ALL matches as an array.",
     "It searches for the first full match, and returns the starting index of that match.",
     "It searches for the first full match, and returns a boolean indicating whether or not a match was found."
    ]
   },
   {
    "q": "Which is the best use case for `test`?",
    "a": "To check if a given string matches the regular expression.",
    "d": [
     "For verifying a given regular expression.",
     "For getting detailed information about a string match, such as the length of the matched string.",
     "To extract all matches from a given string."
    ]
   },
   {
    "q": "What is the purpose of using `replace`?",
    "a": "To replace a matched string with a given replacement string.",
    "d": [
     "To replace the current regular expression with a new regular expression.",
     "When given an index and a string, to replace the character at the specified index with the string provided.",
     "To remove all instances of a matched substring from a string."
    ]
   },
   {
    "q": "What is the difference between `match` and `matchAll`?",
    "a": "`match` returns an array of strings that match, while `matchAll` returns an iterator object of all matches found.",
    "d": [
     "`match` always returns a string, while `matchAll` always returns an array of matches.",
     "`match` returns a boolean indicating whether a match is found, while `matchAll` returns a number representing the amount of matches found.",
     "`match` returns a number indicating the starting index of the first match found, while `matchAll` returns an array of numbers containing indices where a match was found."
    ]
   },
   {
    "q": "Which of the following is the correct use of `replaceAll`?",
    "a": "```js\nfoo.replaceAll(/foobar/g, \"fizzbuzz\")\n```",
    "d": [
     "```js\nfoo.replaceAll(/foobar/, \"fizzbuzz\")\n```",
     "```js\nfoo.replaceAll(/foobar/i, \"fizzbuzz\")\n```",
     "```js\nfoo.replaceAll(/foobar/gi, /fizzbuzz/)\n```"
    ]
   },
   {
    "q": "Which of the following character classes is equivalent to the regular expression `/[a-zA-Z0-9_]/`?",
    "a": "`\\w`",
    "d": [
     "`\\d`",
     "`\\s`",
     "`\\n`"
    ]
   },
   {
    "q": "Which of the following character classes is most appropriate for extracting digits from a phone number?",
    "a": "`\\d`",
    "d": [
     "`\\w`",
     "`\\s`",
     "`\\D`"
    ]
   },
   {
    "q": "What happens when a lookahead `(?=)` is used in a regular expression?",
    "a": "A lookahead asserts to the right of the string, verifying that the sub-pattern IS present.",
    "d": [
     "The lookahead will assert to the left of the string, verifying that the sub-pattern IS present.",
     "A lookahead is an alternate regular expression pattern used when the main pattern fails to match.",
     "The lookahead will assert to the right of the string, verifying that the sub-pattern IS NOT present."
    ]
   },
   {
    "q": "When making a regular expression, where should a lookbehind `(?<=)` be placed?",
    "a": "The lookbehind should be placed to the left of the main pattern of the regular expression.",
    "d": [
     "The lookbehind can be placed anywhere in the regular expression.",
     "The lookbehind should be placed to the right of the main pattern of the regular expression.",
     "The lookbehind should include the main pattern of the regular expression."
    ]
   },
   {
    "q": "Which quantifier matches the preceding element zero or one times?",
    "a": "`?`",
    "d": [
     "`+`",
     "`*`",
     "`a{0,}`"
    ]
   },
   {
    "q": "Which of the following regular expressions only allows numbers between 0 and 999,999?",
    "a": "`/^\\d{1,6}$/`",
    "d": [
     "`/^\\d{6}$/`",
     "`/^\\d{0, 999999}$/`",
     "`/^\\d+$/`"
    ]
   },
   {
    "q": "Which of the following statements is true about the custom character class (`[]`)?",
    "a": "It can define a custom set of characters to match.",
    "d": [
     "It's a set of characters to be removed from the match.",
     "It can define a set of characters to match without the need to escape any special characters.",
     "It represents a set of characters in Unicode form."
    ]
   },
   {
    "q": "Which of the following character classes correctly matches the uppercase alphabet?",
    "a": "`[A-Z]`",
    "d": [
     "`\\w`",
     "`[a-z]`",
     "`[AZ]`"
    ]
   },
   {
    "q": "What happens when a capturing group `(...)` is used in a regular expression?",
    "a": "The capturing group attempts to match using the given subpattern, and continues with the result in memory.",
    "d": [
     "The capturing group is immediately evaluated, regardless of where it is located in the regular expression.",
     "The capturing group attempts to match using the given subpattern, and continues without memorizing the result.",
     "The capturing group is a prioritized subpattern, which will immediately return when a match is found for the subpattern."
    ]
   },
   {
    "q": "What happens when a non-capturing group `(?:...)` is used in a regular expression?",
    "a": "The non-capturing group attempts to match using the given subpattern, and continues without keeping the result in memory.",
    "d": [
     "The non-capturing group attempts to match using the given subpattern, and continues with the result in memory.",
     "The non-capturing group immediately terminates when it finds a match for the given subpattern.",
     "The non-capturing group is considered an optional match, so only a successful match is added on the result."
    ]
   },
   {
    "q": "Given the following regular expression, which of these tests will return `true`?\n\n```js\nconst regex = /(cat)\\s+\\1/i;\n```",
    "a": "```js\nregex.test(\"cat   cat\");\n```",
    "d": [
     "```js\nregex.test(\"cat dog cat\");\n```",
     "```js\nregex.test(\"catcat\");\n```",
     "```js\nregex.test(\"cat\\s+cat\");\n```"
    ]
   },
   {
    "q": "What does the wildcard character class (`.`) do in a regular expression?",
    "a": "It matches any single character except a newline.",
    "d": [
     "It matches only whitespace characters.",
     "It matches the start of a string.",
     "It matches a single digit."
    ]
   }
  ]
 },
 {
  "block": "quiz-form-validation-with-javascript",
  "module": "form-validation",
  "title": "Form Validation with JavaScript Quiz",
  "topic": "Validación de formularios",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "Which method is used to check if an `input` element's value satisfies the validation rules?",
    "a": "`checkValidity()`",
    "d": [
     "`validateInput()`",
     "`isValid()`",
     "`checkValue()`"
    ]
   },
   {
    "q": "What happens if the `checkValidity()` method finds an invalid `input`?",
    "a": "It returns `false` without displaying any error message to the user.",
    "d": [
     "The form is automatically submitted.",
     "The page refreshes automatically.",
     "The `input` value is cleared."
    ]
   },
   {
    "q": "Which method is used to customize the message shown during validation failure?",
    "a": "`setCustomValidity()`",
    "d": [
     "`setErrorMessage()`",
     "`setValidationMessage()`",
     "`customMessage()`"
    ]
   },
   {
    "q": "What is the default validation behavior for required fields when the form is submitted?",
    "a": "The browser stops the form submission if required fields are empty.",
    "d": [
     "The form is submitted even if required fields are empty.",
     "The form submits but gives a warning.",
     "The form resets the `input` values."
    ]
   },
   {
    "q": "Which action does not cause an HTML form to be checked for errors?",
    "a": "Clicking a reset button.",
    "d": [
     "Changing the `input` value.",
     "Submitting the form.",
     "Calling `reportValidity()`."
    ]
   },
   {
    "q": "What does `checkValidity()` return when all form inputs are valid?",
    "a": "`true`",
    "d": [
     "`false`",
     "`undefined`",
     "`null`"
    ]
   },
   {
    "q": "What does it mean when `patternMismatch` is `true`?",
    "a": "The value does not match the `pattern` attribute.",
    "d": [
     "The field is empty.",
     "The value is too long.",
     "The field is disabled."
    ]
   },
   {
    "q": "What happens if `reportValidity()` is called, but a field fails validation?",
    "a": "The invalid field is highlighted and a message appears.",
    "d": [
     "The form submits without error.",
     "The `input` values are cleared.",
     "The form closes immediately."
    ]
   },
   {
    "q": "Which action triggers the browser's built-in form validation?",
    "a": "Submitting the form manually.",
    "d": [
     "Resetting the form.",
     "Changing an `input` value.",
     "Clicking an anchor tag."
    ]
   },
   {
    "q": "What is the purpose of calling `checkValidity()` before submitting a form?",
    "a": "To check if all `input` elements meet their specified constraints.",
    "d": [
     "To automatically submit the form.",
     "To reload the page.",
     "To clear all `input` fields."
    ]
   },
   {
    "q": "What is the main purpose of `e.preventDefault()`?",
    "a": "To stop the default action of an event.",
    "d": [
     "To reload the form.",
     "To clear form data.",
     "To reset the form values."
    ]
   },
   {
    "q": "When used on a form's submit event, what does `e.preventDefault()` do?",
    "a": "It prevents the form from being submitted.",
    "d": [
     "It submits the form.",
     "It clears all form fields.",
     "It disables the form temporarily."
    ]
   },
   {
    "q": "In which scenario is `e.preventDefault()` most useful?",
    "a": "When submitting a form and preventing a page reload.",
    "d": [
     "When handling a button click that submits a form.",
     "When closing a modal dialog.",
     "When opening a new page."
    ]
   },
   {
    "q": "What happens if you forget to call `e.preventDefault()` on a form submit event?",
    "a": "The form submits and refreshes the page.",
    "d": [
     "All the input fields are set to their default values.",
     "The form does not submit.",
     "The form data is lost."
    ]
   },
   {
    "q": "Which default behavior can be prevented using `e.preventDefault()`?",
    "a": "The default behavior caused by submitting a form.",
    "d": [
     "Editing a form.",
     "Rendering the form.",
     "Reloading the form."
    ]
   },
   {
    "q": "What triggers the form's submit event?",
    "a": "When a form's submit button is clicked or <kbd>Enter</kbd> is pressed.",
    "d": [
     "When an input field changes.",
     "When the form is reset.",
     "When the form's action is cleared."
    ]
   },
   {
    "q": "Where do you usually handle the submit event in JavaScript?",
    "a": "On the form element itself.",
    "d": [
     "On a text input element.",
     "On any field in the form.",
     "On a button element outside the form."
    ]
   },
   {
    "q": "What does the submit event do by default?",
    "a": "It sends form data to the server specified in the form's action.",
    "d": [
     "It validates the form but doesn't submit it.",
     "It clears the form fields.",
     "It cancels form submission."
    ]
   },
   {
    "q": "Which event should you listen for to handle form data when the form is submitted in JavaScript?",
    "a": "`\"submit\"`",
    "d": [
     "`\"input\"`",
     "`\"change\"`",
     "`\"focus\"`"
    ]
   },
   {
    "q": "What is the default value of the `method` attribute in an HTML form?",
    "a": "`\"GET\"`",
    "d": [
     "`\"POST\"`",
     "`\"UPDATE\"`",
     "`\"PUT\"`"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-dates",
  "module": "javascript-dates",
  "title": "JavaScript Dates Quiz",
  "topic": "Fechas",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is the JavaScript `Date` object used for?",
    "a": "Work with both dates and time.",
    "d": [
     "Work with just dates only.",
     "Work with just time only.",
     "Work with just leap years."
    ]
   },
   {
    "q": "Which code creates a new `Date` object instance?",
    "a": "`new Date()`",
    "d": [
     "`Date.new()`",
     "`Date.fetch()`",
     "`new.Date()`"
    ]
   },
   {
    "q": "How does `Date.now()` work?",
    "a": "It returns the current time in milliseconds since January 1, 1970.",
    "d": [
     "It returns the current time in nanoseconds since July 4, 1776.",
     "It returns the previous time in milliseconds since January 1, 1974.",
     "It returns the current date in minutes since January 1, 1970."
    ]
   },
   {
    "q": "Which method returns the current year?",
    "a": "`getFullYear()`",
    "d": [
     "`getNewYear()`",
     "`getLastYear()`",
     "`getLeapYear()`"
    ]
   },
   {
    "q": "Which method returns the current month, as a zero-indexed integer?",
    "a": "`getMonth()`",
    "d": [
     "`getCalendar()`",
     "`fetchMonth()`",
     "`get.Month()`"
    ]
   },
   {
    "q": "Which method formats a date as a string?",
    "a": "`toString()`",
    "d": [
     "`getMonth()`",
     "`formatDate()`",
     "`toStingy()`"
    ]
   },
   {
    "q": "What would the result of `console.log(new Date().getFullYear());` be, if it is June 12th 2022?",
    "a": "`\"2022\"`",
    "d": [
     "`\"June 12th 2022\"`",
     "`\"2023\"`",
     "`\"06/12/2022\"`"
    ]
   },
   {
    "q": "What does `fr-FR` in `date.toLocaleDateString(\"fr-FR\")` represent?",
    "a": "A French locale.",
    "d": [
     "A French-Canadian locale.",
     "A French-Italian locale.",
     "A French-Finnish locale."
    ]
   },
   {
    "q": "What is the output of `console.log(new Date(\"2014-10-15\").getDate());`?",
    "a": "`15`",
    "d": [
     "`10`",
     "`2014`",
     "`2014-10-15`"
    ]
   },
   {
    "q": "In which format does the `toISOString()` method return a date?",
    "a": "An ISO-8601 string format.",
    "d": [
     "A USA-863 string format.",
     "An MP3 string format.",
     "A UTC string format."
    ]
   },
   {
    "q": "What should an ISO-8601 date format look like?",
    "a": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "d": [
     "DD-MM-YYYY",
     "DD-MM-YYTHH",
     "YYYY-MM-DDTHH:mm:ssZ"
    ]
   },
   {
    "q": "What is the corresponding month for `console.log(new Date(2003, 6, 27).getMonth());`?",
    "a": "July",
    "d": [
     "June",
     "April",
     "January"
    ]
   },
   {
    "q": "How would you format a date to a locale-specific string or a more readable format?",
    "a": "`.toLocaleDateString()`",
    "d": [
     "`.toLocaleDate()`",
     "`.toLocaleString()`",
     "`.toDateString()`"
    ]
   },
   {
    "q": "What is the default locale used by the `toLocaleDateString()` method if no `locales` parameter is provided?",
    "a": "The user's system locale.",
    "d": [
     "English (Great Britain).",
     "The locale closest to United States.",
     "French (France)."
    ]
   },
   {
    "q": "What gets assigned to `now` in the code below?\n\n```js\nconst now = new Date();\n```",
    "a": "The current date and time based on your computer system's clock.",
    "d": [
     "The current time in milliseconds since January 1, 1990.",
     "The current date in milliseconds minus the Unix epoch.",
     "The current time in nanoseconds since January 1, 1990."
    ]
   },
   {
    "q": "What is the output of `console.log(new Date(2003, 6, 27).getFullYear());`?",
    "a": "`2003`",
    "d": [
     "`\"27/6/2003\"`",
     "`27`",
     "`6`"
    ]
   },
   {
    "q": "What does `getDate` return when the date is invalid?",
    "a": "`NaN`",
    "d": [
     "`0`",
     "`null`",
     "`undefined`"
    ]
   },
   {
    "q": "If we are in the month of October, what will `console.log(new Date().getMonth());` output?",
    "a": "`9`",
    "d": [
     "`1`",
     "`3`",
     "`10`"
    ]
   },
   {
    "q": "Which option will output `2021` for the following object?\n\n```js\nconst d = new Date(\"2021-12-25\");\n```",
    "a": "`console.log(d.getFullYear())`",
    "d": [
     "`console.log(d.getTime())`",
     "`console.log(d.toUTCString())`",
     "`console.log(d.getDate())`"
    ]
   },
   {
    "q": "Which option will output `\"2021-12-25T00:00:00.000Z\"` for the following object?\n\n```js\nconst d = new Date(\"2021-12-25\");\n```",
    "a": "`console.log(d.toISOString())`",
    "d": [
     "`console.log(d.getFullYear())`",
     "`console.log(d.toUTCString())`",
     "`console.log(d.getTime())`"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-audio-and-video",
  "module": "audio-and-video-events",
  "title": "JavaScript Audio and Video Quiz",
  "topic": "Audio y video",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is the purpose of the `Audio()` constructor in JavaScript?",
    "a": "Create a new `audio` element.",
    "d": [
     "Create a new audio file.",
     "Play an existing audio file.",
     "Modify audio files."
    ]
   },
   {
    "q": "Which method is used to begin playback of an `audio` or `video` element?",
    "a": "`play()`",
    "d": [
     "`start()`",
     "`begin()`",
     "`resume()`"
    ]
   },
   {
    "q": "What is the difference between `pause()` and `play()` methods for media elements?",
    "a": "`pause()` stops playback but maintains the current position while `play()` starts playback.",
    "d": [
     "`pause()` returns a Promise while `play()` does not.",
     "`pause()` cannot be resumed while `play()` can start from any position.",
     "`pause()` automatically resets to the beginning while `play()` starts from where the audio was paused."
    ]
   },
   {
    "q": "Which audio format has the widest browser support?",
    "a": "`MP3`",
    "d": [
     "`FLAC`",
     "`OGG`",
     "`WAV`"
    ]
   },
   {
    "q": "What is the purpose of the `source` element within an `audio` or `video` element?",
    "a": "Specify multiple media sources for different formats.",
    "d": [
     "Specify the volume of the media.",
     "Add subtitles to the media.",
     "Link to an external audio processor."
    ]
   },
   {
    "q": "What are the two possible MIME types an MP4 format can have?",
    "a": "`audio/mp4` and `video/mp4`",
    "d": [
     "`mp4/audio` and `mp4/video`",
     "`audio/mpeg4` and `video/mpeg4`",
     "`mp4/mpeg` and `mp4/stream`"
    ]
   },
   {
    "q": "What does a codec do in the context of audio and video?",
    "a": "Converts media between analogue and digital formats.",
    "d": [
     "Increases the volume of the media.",
     "Changes the file format of the media.",
     "Encrypts the media for secure transmission."
    ]
   },
   {
    "q": "Which API provides a way to create, process, and analyze audio in web applications?",
    "a": "Web Audio API.",
    "d": [
     "Audio Processing API.",
     "Sound Manipulation API.",
     "Media Stream API."
    ]
   },
   {
    "q": "What is the purpose of the `getUserMedia()` method?",
    "a": "Access the user's camera and/or microphone.",
    "d": [
     "Authenticate users with a media service.",
     "Retrieve user preferences for media playback.",
     "Download media files to the user's device."
    ]
   },
   {
    "q": "Which property of the `HTMLMediaElement` interface represents the current playback time?",
    "a": "`currentTime`",
    "d": [
     "`time`",
     "`playbackPosition`",
     "`currentPosition`"
    ]
   },
   {
    "q": "What does the following code snippet do?\n\n```javascript\nconst audio = new Audio('song.mp3');\naudio.loop = true;\n```",
    "a": "Sets the audio to repeat indefinitely.",
    "d": [
     "Plays the audio file once.",
     "Increases the volume of the audio.",
     "Pauses the audio after one loop."
    ]
   },
   {
    "q": "What is the full meaning of MIME?",
    "a": "Multipurpose Internet Mail Extensions",
    "d": [
     "Multiple Internet Message Extensions",
     "Mail Internet Multimedia Extensions",
     "Multimedia Internet Mail Extensions"
    ]
   },
   {
    "q": "What does the `canPlayType()` method help you do?",
    "a": "Determine if a browser is likely to be able to play your specific audio format.",
    "d": [
     "Check if audio is currently playing in the browser in a specific format.",
     "Verify if a media file exists in the browser's cache and accessible for playback.",
     "Test if an audio element has controls enabled and whether the user has appropriate permissions to interact with it."
    ]
   },
   {
    "q": "Which of the following is NOT a valid event of the `HTMLMediaElement` API?",
    "a": "`stopped`",
    "d": [
     "`waiting`",
     "`canplay`",
     "`ended`"
    ]
   },
   {
    "q": "What `HTMLMediaElement` event fires when playback is paused due to data buffering?",
    "a": "`waiting`",
    "d": [
     "`stopped`",
     "`pause`",
     "`buffering`"
    ]
   },
   {
    "q": "Which Web Audio API interface is used to represent an audio-processing graph?",
    "a": "`AudioContext`",
    "d": [
     "`AudioNode`",
     "`AudioBuffer`",
     "`AudioListener`"
    ]
   },
   {
    "q": "What is the purpose of the Media Source Extensions API?",
    "a": "It lets you directly pass a user's webcam feed to a video element",
    "d": [
     "Add visual effects to video.",
     "Convert between different media formats.",
     "Enable JavaScript to synchronize multiple audio tracks."
    ]
   },
   {
    "q": "When is the `ended` event fired?",
    "a": "When the end of the media has been reached.",
    "d": [
     "When the media source is changed.",
     "When the `pause()` method is called.",
     "When the media is manually stopped."
    ]
   },
   {
    "q": "How is the Screen Capture API exposed?",
    "a": "By calling the `getDisplayMedia()` method.",
    "d": [
     "Through the `window.screenCapture` interface",
     "By using the `navigator.capture` property",
     "By using the `captureScreen()` method"
    ]
   },
   {
    "q": "What is the WMV format associated with?",
    "a": "Windows Media Player",
    "d": [
     "Wide Media Video",
     "World Media Video",
     "Web Media Player"
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-maps-and-sets",
  "module": "maps-and-sets",
  "title": "JavaScript Maps and Sets Quiz",
  "topic": "Map y Set",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is a Set in JavaScript?",
    "a": "A collection in which a value can only occur once.",
    "d": [
     "A data structure that allows duplicate values.",
     "A data structure that only stores strings and numbers.",
     "A collection that does not allow deletion of its elements."
    ]
   },
   {
    "q": "Which of the following methods is available in Maps but not in Sets?",
    "a": "`set()`",
    "d": [
     "`has()`",
     "`clear()`",
     "`values()`"
    ]
   },
   {
    "q": "What method is used to add elements to a Set?",
    "a": "`.add()`",
    "d": [
     "`.push()`",
     "`.append()`",
     "`.insert()`"
    ]
   },
   {
    "q": "How do you check if a Set contains a certain value?",
    "a": "`.has()`",
    "d": [
     "`.contains()`",
     "`.hasValue()`",
     "`.find()`"
    ]
   },
   {
    "q": "Which of these is a great use case for Sets?",
    "a": "Eliminating duplicates from an array.",
    "d": [
     "Managing key-value pairs in a database.",
     "Creating ordered lists of items.",
     "Storing hierarchical data structures in the browser local storage."
    ]
   },
   {
    "q": "What is a WeakSet in JavaScript?",
    "a": "A Set-like collection that only stores objects.",
    "d": [
     "A Set-like collection that only allows primitive data types.",
     "A Set-like collection that allows duplicate values.",
     "A Set-like collection that prevents values from being removed."
    ]
   },
   {
    "q": "What is one difference between a Set and a WeakSet?",
    "a": "A Set can hold any type of value, while a WeakSet only holds objects.",
    "d": [
     "A WeakSet can store any type of value, including numbers.",
     "A Set does not allow duplicate values, but a WeakSet does.",
     "A Set allows garbage collection, whereas a WeakSet does not."
    ]
   },
   {
    "q": "What is a Map in JavaScript?",
    "a": "A collection of key-value pairs of any type.",
    "d": [
     "A collection that only allows unique values.",
     "A collection that can only use strings as keys.",
     "A collection that does not allow deletion of its items."
    ]
   },
   {
    "q": "What method is used to insert key-value pairs into a Map?",
    "a": "`.set()`",
    "d": [
     "`.append()`",
     "`.add()`",
     "`.insert()`"
    ]
   },
   {
    "q": "What will the following code output?\n\n```js\nconst myMap = new Map();\nmyMap.set('a', 1);\nmyMap.set('a', 2);\nconsole.log(myMap.get('a'));\n```",
    "a": "`2`",
    "d": [
     "`1`",
     "`undefined`",
     "`null`"
    ]
   },
   {
    "q": "How does a Map differ from an Object in JavaScript?",
    "a": "Maps allow any type of key, but Objects only allow strings and symbols.",
    "d": [
     "A Map only allows numbers as keys.",
     "Objects allow any type as keys, while Maps only allow strings.",
     "Maps do not support iteration, while Objects do."
    ]
   },
   {
    "q": "How can you remove a key-value pair from a Map?",
    "a": "`.delete()`",
    "d": [
     "`.remove()`",
     "`.deleteKey()`",
     "`.erase()`"
    ]
   },
   {
    "q": "What does the `size` property of a Map return?",
    "a": "The number of key-value pairs in the Map.",
    "d": [
     "The number of indexes in the Map.",
     "The number of unique values in the Map.",
     "The total memory used by the Map."
    ]
   },
   {
    "q": "What is a WeakMap in JavaScript?",
    "a": "A Map-like collection with weak references to the keys.",
    "d": [
     "A Map-like collection that allows primitive values as keys.",
     "A Map-like collection that blocks the deletion of items.",
     "A Map-like collection that automatically sorts its keys."
    ]
   },
   {
    "q": "What is one difference between a Map and a WeakMap?",
    "a": "A Map is iterable, whereas a WeakMap is not.",
    "d": [
     "A Map allows only primitive types as keys, whereas a WeakMap only allows objects.",
     "A Map allows garbage collection, whereas a WeakMap does not.",
     "A WeakMap allows duplicate keys, whereas a Map does not."
    ]
   },
   {
    "q": "Which of the following methods does NOT exist on a WeakMap?",
    "a": "`.size()`",
    "d": [
     "`.has()`",
     "`.set()`",
     "`.delete()`"
    ]
   },
   {
    "q": "What will be the output of the following code?\n\n```js\nconst set = new Set([1, 2, 3]);\nset.delete(2);\nconsole.log(set.has(2));\n```",
    "a": "`false`",
    "d": [
     "`true`",
     "`undefined`",
     "`2`"
    ]
   },
   {
    "q": "How can you iterate over the values in a Set?",
    "a": "By using the `.forEach()` method.",
    "d": [
     "By using the `.map()` method.",
     "By using the `.reduce()` method.",
     "By using the `.filter()` method."
    ]
   },
   {
    "q": "Which two methods of Sets return a `SetIterator` that contains the values of a certain Set?",
    "a": "`keys()` and `values()`",
    "d": [
     "`entries()` and `values()`",
     "`forEach()` and `values()`",
     "`has()` and `add()`"
    ]
   },
   {
    "q": "What will be the output of the following code?\n\n```js\nconst map = new Map([[\"a\", 1], [\"b\", 2]]);\nmap.clear();\nconsole.log(map.size);\n```",
    "a": "`0`",
    "d": [
     "`2`",
     "`1`",
     "`undefined`"
    ]
   }
  ]
 },
 {
  "block": "quiz-local-storage-and-crud",
  "module": "localstorage-and-crud-operations",
  "title": "Local Storage and CRUD Quiz",
  "topic": "localStorage y CRUD",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What does CRUD stand for in the context of web development?",
    "a": "Create, Read, Update, Delete.",
    "d": [
     "Create, Replace, Undo, Delete.",
     "Connect, Remove, Update, Display.",
     "Copy, Retrieve, Update, Delete."
    ]
   },
   {
    "q": "Which HTTP method is commonly associated with the Create operation in a RESTful API?",
    "a": "`POST`",
    "d": [
     "`GET`",
     "`PUT`",
     "`DELETE`"
    ]
   },
   {
    "q": "Which of the following CRUD operations is typically performed when modifying an existing record in a database?",
    "a": "Update",
    "d": [
     "Read",
     "Delete",
     "Create"
    ]
   },
   {
    "q": "What is the main difference between localStorage and sessionStorage in the Web Storage API?",
    "a": "localStorage data persists until explicitly deleted, while sessionStorage data is cleared when the page session ends.",
    "d": [
     "localStorage stores data in memory, while sessionStorage stores data on the disk.",
     "sessionStorage is faster than localStorage for retrieving data.",
     "localStorage data is only available during a session, while sessionStorage persists across sessions."
    ]
   },
   {
    "q": "Which method is used to store data in localStorage?",
    "a": "`localStorage.setItem()`",
    "d": [
     "`localStorage.setData()`",
     "`localStorage.saveItem()`",
     "`localStorage.storeData()`"
    ]
   },
   {
    "q": "How can you remove a single item from sessionStorage?",
    "a": "`sessionStorage.removeItem('key')`",
    "d": [
     "`sessionStorage.clearItem('key')`",
     "`sessionStorage.remove('key')`",
     "`sessionStorage.deleteItem('key')`"
    ]
   },
   {
    "q": "What is the difference between `PUT` and `PATCH`?",
    "a": "`PUT` replaces the entire resource, while `PATCH` updates specific fields.",
    "d": [
     "`PUT` modifies specific fields, while `PATCH` replaces the entire resource.",
     "`PUT` only adds new resources, while `PATCH` updates existing ones.",
     "`PUT` is used for retrieving data, while `PATCH` is used for sending data."
    ]
   },
   {
    "q": "What is the cache storage used for?",
    "a": "Cache storage is used to store frequently requested network resources, reducing load times and improving performance.",
    "d": [
     "Cache storage is used to permanently store user credentials securely in the browser for authentication purposes.",
     "Cache storage is used to store large volumes of structured data in the browser using a database system.",
     "Cache storage is used to track user sessions and preferences by storing key-value pairs accessible across multiple websites."
    ]
   },
   {
    "q": "What is a cookie in the context of web development?",
    "a": "A small piece of data stored by the user's web browser.",
    "d": [
     "A type of HTTP request.",
     "A piece of code that runs in the browser.",
     "A method to store large files on a server."
    ]
   },
   {
    "q": "Which of the following methods is used to manually set a cookie in JavaScript?",
    "a": "`document.cookie`",
    "d": [
     "`document.setCookie`",
     "`document.cookie.set`",
     "`document.createCookie`"
    ]
   },
   {
    "q": "Which of the following code snippets correctly deletes a cookie named `username`?",
    "a": "`document.cookie = \"username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\";`",
    "d": [
     "`document.cookie.delete(\"username\");`",
     "`document.removeCookie(\"username\");`",
     "`cookie.delete(\"username\");`"
    ]
   },
   {
    "q": "Which of the following statements about cookies is false?",
    "a": "Cookies can only be set by the server.",
    "d": [
     "Session cookies expire when the browser is closed.",
     "HttpOnly cookies cannot be accessed by JavaScript.",
     "Secure cookies are only transmitted over HTTPS."
    ]
   },
   {
    "q": "What is browser fingerprinting?",
    "a": "A way of tracking users through browser and device attributes.",
    "d": [
     "A technique used in identifying users based on their IP address.",
     "A form of data encryption.",
     "A method of storing data in the browser's cache."
    ]
   },
   {
    "q": "What is a primary risk associated with storing passwords in local storage?",
    "a": "Local storage is not encrypted and can be accessed easily.",
    "d": [
     "Local storage data is deleted once you close the browser tab.",
     "Local storage data is lost once you delete cookies.",
     "Local storage doesn't work offline."
    ]
   },
   {
    "q": "What of the following statements is true about client-side storage?",
    "a": "Client-side storage allows websites to store data on a user's device.",
    "d": [
     "Client-side storage uses objects instead of strings to store data.",
     "Client-side storage uses cloud services to sync user data across multiple devices.",
     "Client-side storage is more secure than server-side storage."
    ]
   },
   {
    "q": "What is the primary benefit of using IndexedDB over localStorage?",
    "a": "IndexedDB can handle larger amounts of data and more complex queries.",
    "d": [
     "IndexedDB does not require user consent for data storage.",
     "IndexedDB has a simpler API.",
     "IndexedDB is supported in all web browsers."
    ]
   },
   {
    "q": "Which of the following is a valid way to retrieve data from an object store in IndexedDB?",
    "a": "Using `get()` on the store reference.",
    "d": [
     "Calling `retrieve()` on the object store.",
     "Using `query()` to access specific records.",
     "Using `fetch()` method."
    ]
   },
   {
    "q": "What type of transactions does IndexedDB support?",
    "a": "Read and write transactions.",
    "d": [
     "Read transactions only.",
     "Asynchronous transactions only.",
     "Synchronous transactions only."
    ]
   },
   {
    "q": "Which of the following is true about the lifecycle of a Service Worker?",
    "a": "A Service Worker can intercept network requests after it has been activated.",
    "d": [
     "Service Workers run in the main thread of the web application.",
     "Service Workers can be activated before they are installed.",
     "Service Workers can only run when the web application is open in the browser."
    ]
   },
   {
    "q": "Which statement best describes a key feature of Progressive Web Apps (PWAs)?",
    "a": "PWAs provide offline functionality through Service Workers.",
    "d": [
     "PWAs can only be installed on mobile devices.",
     "PWAs are required to have a back-end server.",
     "PWAs can only be accessed through specific browsers."
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-classes",
  "module": "classes-and-the-this-keyword",
  "title": "JavaScript Classes Quiz",
  "topic": "Clases y this",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is the purpose of a class in JavaScript?",
    "a": "To create reusable blueprints for objects.",
    "d": [
     "To define only properties, not methods.",
     "To define static variables only.",
     "To organize only primitive data."
    ]
   },
   {
    "q": "How do you define a class in JavaScript?",
    "a": "Using the `class` keyword.",
    "d": [
     "Using the `className` keyword.",
     "Using the `object` keyword.",
     "Using the `constructor` keyword only."
    ]
   },
   {
    "q": "Which method is used in a class to initialize properties?",
    "a": "`constructor`",
    "d": [
     "`static`",
     "`init`",
     "`define`"
    ]
   },
   {
    "q": "What does `this` represent inside a class constructor?",
    "a": "An instance of the class.",
    "d": [
     "The global class object.",
     "The function itself.",
     "An undefined reference."
    ]
   },
   {
    "q": "Which of the following describes how `this` behaves in an arrow function inside a class method?",
    "a": "It inherits the value of `this` from the enclosing scope where it is defined.",
    "d": [
     "It inherits the value of `this` from the nearest function in a different scope.",
     "It refers to a newly created instance of the class.",
     "It inherits the value of `this` from the global object in strict mode."
    ]
   },
   {
    "q": "What is the primary purpose of the `extends` keyword?",
    "a": "To create a subclass that inherits from a parent class.",
    "d": [
     "To define static methods in a parent class constructor.",
     "To create a method in a class.",
     "To initialize default properties in the parent class."
    ]
   },
   {
    "q": "Which of the following is an example of how to create a `Car` class that inherits from a `Vehicle` class?",
    "a": "`class Car extends Vehicle {}`",
    "d": [
     "`class Car uses Vehicle {}`",
     "`class Car = Vehicle {}`",
     "`class Car inherits Vehicle {}`"
    ]
   },
   {
    "q": "What is the output of the following code?\n\n```javascript\nclass Animal {\n  speak() {\n    return \"Animal speaks\";\n  }\n}\n\nclass Dog extends Animal {\n  speak() {\n    return \"Dog barks\";\n  }\n}\n\nconst myDog = new Dog();\nconsole.log(myDog.speak());\n```",
    "a": "`Dog barks`",
    "d": [
     "`Animal speaks`",
     "An error is raised.",
     "`undefined`"
    ]
   },
   {
    "q": "What is the function of the `super` keyword in a subclass?",
    "a": "To call the constructor or methods of the parent class.",
    "d": [
     "To define a new instance of the parent class.",
     "To delete methods and properties from the parent class.",
     "To access only the static methods of the parent class."
    ]
   },
   {
    "q": "Which of the following describes a static method?",
    "a": "A method that belongs to the class itself, not to any instance.",
    "d": [
     "A method that is inaccessible inside the class itself.",
     "A method that is used only in arrow functions.",
     "A method that is unique to each instance of a class."
    ]
   },
   {
    "q": "What will the following code output?\n\n```js\nclass Calculator {\n  static add(a, b) {\n    return a + b;\n  }\n}\n\nconsole.log(Calculator.add(3, 4));\n```",
    "a": "`7`",
    "d": [
     "An error is raised.",
     "`undefined`",
     "`NaN`"
    ]
   },
   {
    "q": "How would you access a static property in JavaScript class?",
    "a": "By using `ClassName.propertyName`.",
    "d": [
     "By using `this.propertyName` within a method.",
     "By using `instance.propertyName` after creating an instance.",
     "By using `super.propertyName` within a subclass."
    ]
   },
   {
    "q": "In which scenario would you use a static method over an instance method?",
    "a": "When the method operates on data that is shared by all instances of the class.",
    "d": [
     "When you need to access and modify the instance's properties.",
     "When the method needs to be called on an object instance.",
     "When the method doesn't rely on instance-specific data and operates on class-level data."
    ]
   },
   {
    "q": "What will the following code output?\n\n```js\nclass MyClass {\n  sayHello() {\n    return \"Hello!\";\n  }\n}\n\nconsole.log(MyClass.sayHello());\n```",
    "a": "It throws an error.",
    "d": [
     "`Hello!`",
     "`null`",
     "`undefined`"
    ]
   },
   {
    "q": "What keyword is used to inherit properties and methods from another class?",
    "a": "`extends`",
    "d": [
     "`import`",
     "`inherit`",
     "`static`"
    ]
   },
   {
    "q": "What is printed by the following code?\n\n```js\nclass Person {\n  static species = \"Human\";\n}\n\nconsole.log(Person.species);\n```",
    "a": "`Human`",
    "d": [
     "`undefined`",
     "`null`",
     "An error is raised."
    ]
   },
   {
    "q": "Which of the following best describes inheritance?",
    "a": "It allows a class to acquire properties and methods from another class.",
    "d": [
     "It allows a method to return a new object.",
     "It allows an instance to define its own properties.",
     "It allows a static property to be converted into a non-static property."
    ]
   },
   {
    "q": "What happens if a constructor is not defined in a subclass?",
    "a": "The superclass's constructor will be used by default.",
    "d": [
     "An error will be thrown.",
     "The subclass will inherit the constructor from any class in the code.",
     "The subclass cannot create new instances."
    ]
   },
   {
    "q": "What does `this` represent in the following code?\n\n```js\nclass Animal {\n  constructor(name) {\n    this.name = name;\n  }\n}\n```",
    "a": "The instance of `Animal`.",
    "d": [
     "The global object.",
     "The `Animal` class itself.",
     "An undefined variable."
    ]
   },
   {
    "q": "What is the primary use of static properties?",
    "a": "To store class-wide data shared across instances.",
    "d": [
     "To define default properties for each class instance.",
     "To override methods in a subclass.",
     "To define instance-specific data."
    ]
   }
  ]
 },
 {
  "block": "quiz-recursion",
  "module": "recursion",
  "title": "Recursion Quiz",
  "topic": "Recursión",
  "passing": [
   9,
   10
  ],
  "questions": [
   {
    "q": "What is recursion in programming?",
    "a": "A process in which a function calls itself.",
    "d": [
     "A method of sorting arrays.",
     "A loop that never ends.",
     "A function that returns `undefined`."
    ]
   },
   {
    "q": "Which of the following is an example of recursion?",
    "a": "```js\nfunction factorial(n) {\n  if (n === 0 || n === 1) {\n    return 1;\n  }\n  return n * factorial(n - 1);\n}\n```",
    "d": [
     "```js\nfunction factorial(n) {\n  let result = 1;\n\n  while (n > 0) {\n    result = result * n;\n    n--;\n  }\n\n  return result;\n}\n```",
     "```js\nfunction factorial(n) {\n  const arr = Array(n).fill().map((_, i) => i + 1);\n  return arr.reduce((acc, curr) => acc * curr, 1);\n}\n```",
     "```js\nfunction factorial(n) {\n  let result = 1;\n\n  for (let i = n; i > 0; i--) {\n    result *= i;\n  }\n\n  return result;\n}\n```"
    ]
   },
   {
    "q": "What will the following function return?\n\n```js\nfunction sum(n) {\n  if (n === 0) return 0;\n  return n + sum(n - 1);\n}\nsum(3);\n```",
    "a": "6",
    "d": [
     "3",
     "0",
     "1"
    ]
   },
   {
    "q": "How many times will the `mystery` function be called?\n\n```javascript\nfunction mystery(n) {\n  if (n <= 1) return 1;\n  return mystery(n - 2);\n}\nmystery(5);\n```",
    "a": "3",
    "d": [
     "2",
     "5",
     "4"
    ]
   },
   {
    "q": "Which of the following is true about recursion?",
    "a": "It should always have a base case.",
    "d": [
     "It should never have a base case.",
     "It should only be used for the Fibonacci sequence.",
     "It should only be used for factorials."
    ]
   },
   {
    "q": "Which of the following options would be an appropriate base case for the given example?\n\n```js\nfunction countDownToZero(number) {\n  // Base case goes here.\n\n  console.log(number);\n  countDownToZero(number - 1);\n}\n```",
    "a": "```js\nif (number < 0) {\n  return;\n}\n```",
    "d": [
     "```js\nif (number > 0) {\n  return;\n}\n```",
     "```js\nif (number !== 0) {\n  return;\n}\n```",
     "```js\nif (number === 0) {\n  return;\n}\n```"
    ]
   },
   {
    "q": "Why must recursion have a base case?",
    "a": "To provide a way for the function to break out of its recursive calls and prevent infinite loops.",
    "d": [
     "To ensure the function always has a return value.",
     "To reduce the number of function calls.",
     "To ensure all recursive calls are executed in the correct order and a `RecursionError` is not thrown."
    ]
   },
   {
    "q": "What will this recursive function do?\n\n```js\nfunction repeatString(str) {\n  return str + repeatString(str);\n}\n```",
    "a": "Cause a stack overflow.",
    "d": [
     "Return the string twice.",
     "Return `undefined`.",
     "Create an empty string."
    ]
   },
   {
    "q": "What is a call stack?",
    "a": "A data structure that keeps track of function calls and their execution order.",
    "d": [
     "A list of function calls that have been executed.",
     "A list of values that were returned by a function.",
     "A special function used to call a function exactly three times."
    ]
   },
   {
    "q": "What does this recursive function do?\n\n```js\nfunction changeString(str) {\n  if (str === \"\") return \"\";\n  return changeString(str.slice(1)) + str[0];\n}\n```",
    "a": "Reverses a string.",
    "d": [
     "Duplicates a string.",
     "Removes vowels.",
     "Removes spaces."
    ]
   }
  ]
 },
 {
  "block": "quiz-data-structures-js",
  "module": "data-structures",
  "title": "Data Structures Quiz",
  "topic": "Estructuras de datos",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What does Big O notation describe in algorithm analysis?",
    "a": "How the time or space grows relative to input size (an upper bound).",
    "d": [
     "The exact runtime in seconds for a specific computer.",
     "The percentage of code lines executed during a run.",
     "How readable the code is to other developers."
    ]
   },
   {
    "q": "When starting an algorithmic challenge, what is the best first step?",
    "a": "Clarify the problem and constraints with examples and edge cases.",
    "d": [
     "Begin coding immediately to gain momentum.",
     "Optimize for performance before you understand the problem.",
     "Write unit tests only after finishing the solution."
    ]
   },
   {
    "q": "What is the key difference between dynamic arrays and static arrays?",
    "a": "Dynamic arrays can grow or shrink by resizing; static arrays have a fixed size.",
    "d": [
     "Dynamic arrays store values of different types; static arrays cannot.",
     "Static arrays allow duplicate values; dynamic arrays do not.",
     "Dynamic arrays are faster than static arrays for every operation."
    ]
   },
   {
    "q": "What is the time complexity of appending an element to the end of a dynamic array when no resizing is needed?",
    "a": "`O(1)`",
    "d": [
     "`O(n)`",
     "`O(log n)`",
     "`O(n log n)`"
    ]
   },
   {
    "q": "Why does accessing the k-th element by index in a singly linked list take `O(n)` time?",
    "a": "You must traverse from the head node to the k-th node one by one.",
    "d": [
     "The list must be resized before any access.",
     "The index is hashed and looked up in a table.",
     "Nodes are stored contiguously, so shifting is required."
    ]
   },
   {
    "q": "Which feature does a doubly linked list have that a singly linked list does not?",
    "a": "Pointers to both next and previous nodes enabling backward traversal.",
    "d": [
     "Random access to any index in `O(1)` time.",
     "A built-in array buffer for faster iteration.",
     "Automatic maintenance of the list length as a constant."
    ]
   },
   {
    "q": "Which of the following best describes a stack?",
    "a": "Last In, First Out (`LIFO`) with `push` and `pop` at the top.",
    "d": [
     "First In, First Out (`FIFO`) with removals at the front.",
     "A structure where any element can be removed in `O(1)` time.",
     "A circular buffer with constant-time random access."
    ]
   },
   {
    "q": "Which operation removes the element at the front of a queue?",
    "a": "`dequeue`",
    "d": [
     "`push`",
     "`pop`",
     "`peek`"
    ]
   },
   {
    "q": "What are edge cases in algorithm design?",
    "a": "Specific, valid inputs at the boundaries of what an algorithm should handle.",
    "d": [
     "Inputs that always cause runtime errors during program execution.",
     "Inputs generated randomly to measure an algorithm's performance.",
     "Invalid inputs that should never be considered during testing."
    ]
   },
   {
    "q": "What is the head node in a singly linked list?",
    "a": "The first node in the list, usually the only directly accessible node.",
    "d": [
     "The node located in the middle of the list.",
     "The node with the largest value in the list.",
     "The most recently added node in the list."
    ]
   },
   {
    "q": "In a dynamic array, what is the worst-case time complexity of inserting an element at index i (not at the end)?",
    "a": "`O(n)`",
    "d": [
     "`O(1)`",
     "`O(log n)`",
     "`O(1)` amortized"
    ]
   },
   {
    "q": "What is the time complexity of inserting a new node at the head of a singly linked list?",
    "a": "`O(1)`",
    "d": [
     "`O(n)`",
     "`O(log n)`",
     "`O(n log n)`"
    ]
   },
   {
    "q": "Which operation returns the top element of a stack without removing it?",
    "a": "`peek`",
    "d": [
     "`push`",
     "`pop`",
     "Insert at bottom."
    ]
   },
   {
    "q": "Which of the following best describes a queue?",
    "a": "First In, First Out (`FIFO`) with `enqueue` at the back and `dequeue` at the front.",
    "d": [
     "Last In, First Out (`LIFO`) with removals at the top.",
     "Random access to any index in `O(1)` time.",
     "Elements are always kept in sorted order automatically."
    ]
   },
   {
    "q": "What is a high-level description of algorithm logic that is language-independent called?",
    "a": "Pseudocode",
    "d": [
     "Syntax",
     "Machine code",
     "Debugger"
    ]
   },
   {
    "q": "What is one of the things you should do to understand a problem?",
    "a": "Read the problem statement multiple times.",
    "d": [
     "Start coding immediately.",
     "Ignore edge cases.",
     "Skip directly to optimization."
    ]
   },
   {
    "q": "Which two components should you identify when solving a problem?",
    "a": "The input and the expected output.",
    "d": [
     "The programming language and the IDE.",
     "The variable names and other identifiers.",
     "The color scheme and code formatting."
    ]
   },
   {
    "q": "Which time complexity grows faster than `O(n log n)` as n becomes large?",
    "a": "`O(n^2)`",
    "d": [
     "`O(n)`",
     "`O(log n)`",
     "`O(1)`"
    ]
   },
   {
    "q": "After implementing a brute-force solution, what is a good next step?",
    "a": "Analyze its time/space complexity and optimize identified bottlenecks.",
    "d": [
     "Micro-optimize constant factors before measuring.",
     "Discard tests and rewrite the solution from scratch.",
     "Avoid considering edge cases to keep the code simple."
    ]
   },
   {
    "q": "What does space complexity measure?",
    "a": "How memory usage grows relative to input size.",
    "d": [
     "How many CPU cores a program uses.",
     "The length of a program in lines of code.",
     "How long a program takes to compile."
    ]
   }
  ]
 },
 {
  "block": "quiz-searching-and-sorting-algorithms-js",
  "module": "algorithms",
  "title": "Searching and Sorting Algorithms Quiz",
  "topic": "Búsqueda y ordenamiento",
  "passing": [
   9,
   10
  ],
  "questions": [
   {
    "q": "Which search algorithm iterates through a list of items, checking each item from the beginning until the target item is found?",
    "a": "Linear search",
    "d": [
     "Merge search",
     "Bubble search",
     "Binary search"
    ]
   },
   {
    "q": "Which technique is used to break down a problem into smaller sub-problems?",
    "a": "Divide-and-conquer",
    "d": [
     "Break-down-and-solve",
     "Divide-and-solve",
     "Break-down-and-conquer"
    ]
   },
   {
    "q": "What is the space complexity of the linear search algorithm?",
    "a": "`O(1)`",
    "d": [
     "`O(n)`",
     "`O(log n)`",
     "`O(n²)`"
    ]
   },
   {
    "q": "Which is more suitable for a larger list of items between binary search and linear search?",
    "a": "Binary search",
    "d": [
     "Both",
     "Linear search",
     "None"
    ]
   },
   {
    "q": "What is the space complexity of binary search?",
    "a": "`O(1)`",
    "d": [
     "`O(log n)`",
     "`O(n)`",
     "`O(n log n)`"
    ]
   },
   {
    "q": "What does the binary search algorithm return when it finds the target item?",
    "a": "The index of the target item.",
    "d": [
     "The value of the target item.",
     "The size of the list searched.",
     "A boolean value of the target."
    ]
   },
   {
    "q": "What does the linear search algorithm return if it doesn't find the target item?",
    "a": "`-1`",
    "d": [
     "`0`",
     "`null`",
     "`undefined`"
    ]
   },
   {
    "q": "How does the merge sort algorithm work?",
    "a": "It recursively splits the list into smaller items, then merges them in sorted order.",
    "d": [
     "It searches for an element by checking each item one by one.",
     "It builds a sorted list by repeatedly finding the smallest element.",
     "It swaps adjacent elements until the list is sorted."
    ]
   },
   {
    "q": "What is the condition for a binary search to work?",
    "a": "The list must be sorted.",
    "d": [
     "The list must contain only unique values.",
     "The list must have an even number of elements.",
     "The list must contain no negative numbers."
    ]
   },
   {
    "q": "Which computer science approach is used to implement the merge sort algorithm?",
    "a": "Divide-and-conquer",
    "d": [
     "Dynamic programming",
     "Greedy algorithm",
     "Tracing"
    ]
   }
  ]
 },
 {
  "block": "quiz-graph-and-trees-js",
  "module": "graphs-and-trees",
  "title": "Graphs and Trees Quiz",
  "topic": "Grafos y árboles",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is a graph?",
    "a": "A data structure used to represent the connections or relationships between objects or entities.",
    "d": [
     "A linear data structure that follows the Last-In, First-Out principle.",
     "A data structure that stores multiple values of the same type that are contiguous in memory.",
     "A linear data structure that follows the First-In, First-Out principle."
    ]
   },
   {
    "q": "Which of the following is NOT a typical scenario that can be represented using a graph?",
    "a": "temperature measurement over time",
    "d": [
     "social networks",
     "transportation networks",
     "communications networks"
    ]
   },
   {
    "q": "Which of the following terms describes an object or entity that is part of the network depicted by a graph?",
    "a": "Node",
    "d": [
     "Cookie",
     "Endpoint",
     "CPU"
    ]
   },
   {
    "q": "Which of the following terms describes the connections between nodes in a graph?",
    "a": "Edges",
    "d": [
     "Gates",
     "Connectors",
     "Vertices"
    ]
   },
   {
    "q": "What is an undirected graph?",
    "a": "A graph where the edges don't have a specific direction.",
    "d": [
     "A graph where the nodes are undirected but the edges are directed.",
     "A graph where the edges have a specific direction.",
     "A graph where the nodes and edges connect at the midpoint."
    ]
   },
   {
    "q": "Which of the following refers to a graph in which each node is associated with a label or identifier in addition to its data?",
    "a": "Vertex labeled graph",
    "d": [
     "Version labeled graph",
     "Virtual labeled graph",
     "Vertical labeled graph"
    ]
   },
   {
    "q": "Which of the following refers to a directed graph with at least one cycle?",
    "a": "Cyclic graph",
    "d": [
     "Cycling graph",
     "Circulating graph",
     "Circular graph"
    ]
   },
   {
    "q": "What is a weighted graph?",
    "a": "A specific type of edge labeled graph in which the labels on the edges represent values that can be compared and used to perform arithmetic operations.",
    "d": [
     "A specific type of edge labeled graph that shows only the direction of connections between nodes.",
     "A specific type of edge labeled graph that assigns categories instead of numerical values to edges.",
     "A specific type of edge labeled graph that treats all edge weights as equal regardless of label."
    ]
   },
   {
    "q": "What is a directed acyclic graph?",
    "a": "A directed graph with no cycles.",
    "d": [
     "A directed graph with one cycle.",
     "A directed graph with three cycles.",
     "A directed graph with two cycles."
    ]
   },
   {
    "q": "Which of the following refers to a graph with two or more groups of nodes that are not connected by any edges?",
    "a": "Disconnected graph",
    "d": [
     "Disconnect graph",
     "Disconnecting graph",
     "Disconnection graph"
    ]
   },
   {
    "q": "What is the Breadth-first search algorithm?",
    "a": "An algorithm that visits all neighboring nodes before moving to the next level in the graph.",
    "d": [
     "An algorithm that visits two nodes in one direction before moving another direction in the graph.",
     "An algorithm that visits all nodes in one direction before moving another direction in the graph.",
     "An algorithm that visits four nodes at a time before moving to the next level in the graph."
    ]
   },
   {
    "q": "Which of the following algorithms will follow each branch as deep as possible before it backtracks?",
    "a": "Depth-First Search",
    "d": [
     "Data-First Search",
     "Dock-First Search",
     "Daemon-First Search"
    ]
   },
   {
    "q": "Which of the following terms represents a two-dimensional list in which the rows and columns represent the graph's vertices?",
    "a": "Adjacency matrix",
    "d": [
     "Array matrix",
     "Depth matrix",
     "Vertex matrix"
    ]
   },
   {
    "q": "Which of the following terms represents an array or dictionary that stores all the neighbors of each node?",
    "a": "Adjacency list",
    "d": [
     "Cyclic list",
     "Tuple list",
     "Breadth list"
    ]
   },
   {
    "q": "What must be true for a graph to be classified as a tree?",
    "a": "It cannot have loops or cycles.",
    "d": [
     "It must have at least one loop or cycle.",
     "It must have at least two loops or cycles.",
     "It must have three loops or cycles."
    ]
   },
   {
    "q": "Which of the following is a type of tree in which each node can have at most two child nodes?",
    "a": "Binary tree",
    "d": [
     "Depth tree",
     "Spatial tree",
     "Linear tree"
    ]
   },
   {
    "q": "What is a Trie?",
    "a": "A tree data structure used to store a set of strings.",
    "d": [
     "A tree data structure used to store a set of numbers.",
     "A tree data structure used to store a set of dictionaries.",
     "A tree data structure used to store a set of lists."
    ]
   },
   {
    "q": "How does the priority queue data structure differ from a regular queue data structure?",
    "a": "A priority queue processes elements based on their priority.",
    "d": [
     "A priority queue automatically removes duplicates before insertion.",
     "A priority queue always processes elements in the order they were added.",
     "A priority queue only stores elements of the same data type."
    ]
   },
   {
    "q": "What are the two types of heaps?",
    "a": "Max-heap and Min-heap",
    "d": [
     "Wide-heap and Tall-heap",
     "Horizontal-heap and Vertical-heap",
     "Breadth-heap and Depth-heap"
    ]
   },
   {
    "q": "What is the difference between a standard queue and a priority queue?",
    "a": "In a standard queue, elements are processed strictly in the order they are added (FIFO), while a priority queue processes elements based on their priority rather than just insertion order.",
    "d": [
     "Elements are processed based on their priority in a standard queue, while a priority queue processes elements strictly in the order they are added (FIFO).",
     "In a standard queue, duplicate elements are automatically removed, while a priority queue allows duplicates.",
     "In a standard queue, elements are processed based on their priority, while a priority queue processes elements strictly in the order they are added (FIFO)."
    ]
   }
  ]
 },
 {
  "block": "quiz-dynamic-programming-js",
  "module": "dynamic-programming",
  "title": "Dynamic Programming Quiz",
  "topic": "Programación dinámica",
  "passing": [
   9,
   10
  ],
  "questions": [
   {
    "q": "What are the two essential properties that must be present in a problem for dynamic programming to be an effective solution approach?",
    "a": "Overlapping subproblems and optimal substructure",
    "d": [
     "Fast execution time and minimal memory usage",
     "Recursion capability and iterative loops",
     "Sequential processing and parallel computation"
    ]
   },
   {
    "q": "What is the primary difference between the memoization and tabulation approaches in dynamic programming?",
    "a": "Memoization is a top-down approach using recursion, while tabulation is a bottom-up approach using iteration.",
    "d": [
     "Memoization uses hash tables while tabulation uses arrays, making it more efficient.",
     "Memoization is faster but uses more memory and CPU cycles than tabulation.",
     "Memoization can only solve simpler problems than tabulation."
    ]
   },
   {
    "q": "Why do naive recursive solutions to dynamic programming problems typically have exponential time complexity?",
    "a": "Because each recursive call branches multiple times, causing the same subproblems to be recalculated repeatedly.",
    "d": [
     "Because they use exponential amounts of memory to store variables.",
     "Because they require sorting data in exponential time.",
     "Because they must check all possible permutations of the input."
    ]
   },
   {
    "q": "What does optimal substructure mean in the context of dynamic programming?",
    "a": "The optimal solution can be constructed from optimal solutions to its subproblems.",
    "d": [
     "The algorithm must use the most efficient data structure available.",
     "The solution must minimize both time and space complexity simultaneously.",
     "The problem must have a unique, single optimal solution."
    ]
   },
   {
    "q": "When implementing memoization, what happens when a function is called with arguments that have already been computed?",
    "a": "The cached result is returned immediately without recomputation.",
    "d": [
     "The function recalculates the result to ensure accuracy.",
     "The function averages the old and new results for better precision.",
     "An error is thrown because duplicate calculations are not allowed."
    ]
   },
   {
    "q": "What is a key advantage of using tabulation instead of memoization?",
    "a": "Tabulation avoids recursion overhead and provides predictable sequential execution.",
    "d": [
     "Tabulation always requires less memory than memoization.",
     "Tabulation can solve a broader class of problems.",
     "Tabulation is always easier to implement and understand."
    ]
   },
   {
    "q": "In a bottom-up dynamic programming solution, why are base cases initialized first?",
    "a": "To provide foundational values upon which all larger subproblems are built.",
    "d": [
     "To allocate memory for the data structure efficiently.",
     "To prevent infinite loops in the algorithm.",
     "To improve the time complexity of the algorithm."
    ]
   },
   {
    "q": "How does dynamic programming transform the time complexity of problems that exhibit overlapping subproblems?",
    "a": "From exponential to polynomial by storing and reusing subproblem solutions.",
    "d": [
     "From polynomial to logarithmic by dividing the problem efficiently.",
     "From quadratic to linear by optimizing loop structures.",
     "From linear to constant by using hash tables."
    ]
   },
   {
    "q": "What trade-off does dynamic programming typically make to achieve better time complexity?",
    "a": "It uses additional space to store intermediate results.",
    "d": [
     "It sacrifices code readability for faster execution.",
     "It requires more complex algorithms that are harder to maintain.",
     "It limits the size of problems that can be solved."
    ]
   },
   {
    "q": "In which scenario would dynamic programming NOT be the appropriate algorithmic approach?",
    "a": "When subproblems are independent and don't overlap.",
    "d": [
     "When the problem requires finding an optimal solution.",
     "When the problem can be broken into smaller subproblems.",
     "When space complexity must be minimized."
    ]
   }
  ]
 },
 {
  "block": "quiz-javascript-functional-programming",
  "module": "functional-programming",
  "title": "JavaScript Functional Programming Quiz",
  "topic": "Programación funcional",
  "passing": [
   9,
   10
  ],
  "questions": [
   {
    "q": "What is a pure function?",
    "a": "A function that always returns the same output for the same input and produces no side effects.",
    "d": [
     "A function that modifies global variables and returns either `undefined` or `null`.",
     "A function that logs an output to the console.",
     "A function that changes its behavior based on external factors and returns `null`."
    ]
   },
   {
    "q": "What is a side effect in functional programming?",
    "a": "A change to the state of the program that are observable outside the function.",
    "d": [
     "An unexpected `TypeError` in your code.",
     "A function that takes too long to execute and crashes the program.",
     "A recursive function call that produces an infinite loop and crashes the program."
    ]
   },
   {
    "q": "What is currying in functional programming?",
    "a": "The process of transforming a function with multiple arguments into a sequence of functions, each with a single argument.",
    "d": [
     "A technique for designing tests to help you ensure your code is 100% error free.",
     "A more optimized way to write recursive functions so they run twice as fast as other functions.",
     "The process of building, designing and testing your code to ensure that it meets the standards laid out by ECMAScript."
    ]
   },
   {
    "q": "What will be the output for the following pure function?\n\n```js\nconst add = (a, b) => a + b;\nconsole.log(add(2, 5));\n```",
    "a": "`7`",
    "d": [
     "`3`",
     "`4`",
     "`undefined`"
    ]
   },
   {
    "q": "Which of the following is an example of currying?",
    "a": "```js\nfunction curriedAverage(a) {\n  return function(b) {\n    return function(c) {\n      return (a + b + c) / 3;\n    };\n  };\n}\n```",
    "d": [
     "```js\nconst curriedAverage = (a, b, c) => a + b + c / 3\n```",
     "```js\nconst curriedAverage = (a, b, c) => a + b + c\n```",
     "```js\nfunction curriedAverage(a) {\n  return a \n}\n\nfunction curried(c) {\n  return c\n}\n```"
    ]
   },
   {
    "q": "Which of the following is a key principle of functional programming?",
    "a": "Avoiding side effects and using immutable data.",
    "d": [
     "Modifying global variables frequently.",
     "Using mutable data structures extensively.",
     "Emphasizing object-oriented inheritance."
    ]
   },
   {
    "q": "What is an impure function?",
    "a": "A function with side effects.",
    "d": [
     "A function that returns an object.",
     "A function without side effects.",
     "A function that returns `null`"
    ]
   },
   {
    "q": "Which of the following is the correct way to call a curried function?",
    "a": "```js\ncurriedAverage(2)(3)(4);\n```",
    "d": [
     "```js\ncurriedAverage(2 3 4);\n```",
     "```js\ncurriedAverage(2)==(3)==(4);\n```",
     "```js\ncurriedAverage(2)=>(3)=>(4);\n```"
    ]
   },
   {
    "q": "Which of the following is an example of an impure function?",
    "a": "```js\nlet total = 0;\nfunction addToTotal(value) {\n  total += value;\n  return total;\n}\n```",
    "d": [
     "```js\nfunction example(num) {\n  return num;\n}\n```",
     "```js\nfunction sum(num1, num2) {\n return num1 + num2\n}\n```",
     "```js\nfunction addToTotal(value) {\n  let total = 0;\n  total += value;\n  return total;\n}\n```"
    ]
   },
   {
    "q": "Which of the following is NOT an example of a side effect?",
    "a": "Returning the sum of two values.",
    "d": [
     "Writing to a file.",
     "Modifying a global variable.",
     "Making an API call."
    ]
   }
  ]
 },
 {
  "block": "quiz-asynchronous-javascript",
  "module": "asynchronous-javascript",
  "title": "Asynchronous JavaScript Quiz",
  "topic": "JavaScript asíncrono",
  "passing": [
   18,
   20
  ],
  "questions": [
   {
    "q": "What is asynchronous programming?",
    "a": "A method to execute code concurrently without blocking the main thread.",
    "d": [
     "A method for executing code sequentially.",
     "A technique to handle errors in your code.",
     "A way to make network requests, typically to retrieve or send data to the server."
    ]
   },
   {
    "q": "What is a thread?",
    "a": "A sequence of instructions that can be executed independently of the main program flow.",
    "d": [
     "A function used to retrieve data from the server.",
     "A program that executes JavaScript code in a web browser.",
     "A special type of function that is passed as an argument to another function."
    ]
   },
   {
    "q": "What is the purpose of the Fetch API in JavaScript?",
    "a": "To make network requests to servers.",
    "d": [
     "To manage asynchronous callbacks.",
     "To create and manage cookies.",
     "To render dynamic HTML content."
    ]
   },
   {
    "q": "Which HTTP method is used to send data to a server for processing?",
    "a": "`POST`",
    "d": [
     "`GET`",
     "`DELETE`",
     "`HEAD`"
    ]
   },
   {
    "q": "Which of the following is the correct way to fetch data from an API?",
    "a": "```js\nfetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n```",
    "d": [
     "```js\nfetch('https://api.example.com/data')\n  .accept(response => response.json())\n  .accept(data => console.log(data))\n```",
     "```js\nfetch('https://api.example.com/data')\n  .allow(response => response.json())\n  .allow(data => console.log(data))\n```",
     "```js\nfetch('https://api.example.com/data')\n  .send(response => response.json())\n  .send(data => console.log(data))\n```"
    ]
   },
   {
    "q": "What is a promise in JavaScript?",
    "a": "An object that represents the eventual completion (or failure) of an asynchronous operation.",
    "d": [
     "A way to synchronize multiple operations when working with the Fetch API.",
     "A special type of callback function that you must use in all higher order functions.",
     "A technique used to handle errors when you work with the Fetch API."
    ]
   },
   {
    "q": "What does promise chaining allow you to do?",
    "a": "Allows you to perform a sequence of asynchronous operations one after the other.",
    "d": [
     "Allows you to execute multiple synchronous operations in parallel.",
     "Allows you to handle synchronous operations more efficiently.",
     "Allows you to retry failed operations automatically."
    ]
   },
   {
    "q": "Which method is used to handle a successful completion of a promise?",
    "a": "`.then()`",
    "d": [
     "`.finally()`",
     "`.catch()`",
     "`.error()`"
    ]
   },
   {
    "q": "Which method is used to handle errors in a promise chain?",
    "a": "`.catch()`",
    "d": [
     "`.finally()`",
     "`.then()`",
     "`.error()`"
    ]
   },
   {
    "q": "Which of the following is NOT a valid HTTP method?",
    "a": "`SEND`",
    "d": [
     "`PUT`",
     "`GET`",
     "`POST`"
    ]
   },
   {
    "q": "Which of the following is the correct syntax for creating an async function?",
    "a": "`async function myFunction() {}`",
    "d": [
     "`function myFunction() {}`",
     "`function async myFunction() {}`",
     "`async {} => ()`"
    ]
   },
   {
    "q": "What does the `await` keyword do in an async function?",
    "a": "It pauses the execution of the function until the promise is resolved.",
    "d": [
     "It creates a new promise.",
     "It executes code immediately without waiting and returns an object.",
     "It logs the result of the promise and returns `null`."
    ]
   },
   {
    "q": "Which of the following APIs is used to provide a way for websites to request the user's location?",
    "a": "Geolocation API",
    "d": [
     "Locator API",
     "Geo API",
     "Locate API"
    ]
   },
   {
    "q": "Which of the following attributes downloads the script asynchronously but waits for the HTML document to be fully parsed before running the script?",
    "a": "`defer`",
    "d": [
     "`asyncDefer`",
     "`deferred`",
     "`deferring`"
    ]
   },
   {
    "q": "What will the following code return?\n\n```js\nfetch('https://api.example.com/data')\n```",
    "a": "A `Promise` that resolves to a `Response` object.",
    "d": [
     "An error saying that the data is corrupted.",
     "An error saying that the data cannot be fetched.",
     "Nothing will be returned and JavaScript will move to the next function in the script."
    ]
   },
   {
    "q": "What is the default HTTP method for the Fetch API?",
    "a": "`GET`",
    "d": [
     "`POST`",
     "`PUT`",
     "`DELETE`"
    ]
   },
   {
    "q": "Which of the following methods is used to delete resources on the server?",
    "a": "`DELETE`",
    "d": [
     "`REMOVING`",
     "`REMOVE`",
     "`DELETING`"
    ]
   },
   {
    "q": "Which of the following is the correct way to create a promise?",
    "a": "```js\nconst promise = new Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```",
    "d": [
     "```js\nconst promise = get Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```",
     "```js\nconst promise = set Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```",
     "```js\nconst promise = put Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Data received successfully');\n  }, 2000);\n});\n```"
    ]
   },
   {
    "q": "Which of the following attributes tells the browser to download the script file asynchronously while continuing to parse the HTML document?",
    "a": "`async`",
    "d": [
     "`resolve`",
     "`catch`",
     "`put`"
    ]
   },
   {
    "q": "Which method of the Geolocation API is used to get the current position of a device?",
    "a": "`getCurrentPosition()`",
    "d": [
     "`getLocation()`",
     "`getPosition()`",
     "`getLatLong()`"
    ]
   }
  ]
 }
];
