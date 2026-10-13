# PSJavaScript

Entorno para aprender a programar inspirado en [PSeInt](https://pseint.sourceforge.net/), pero usando **la sintaxis real de JavaScript**. Hecho con React Native + Expo para publicarse en **web, iOS, Android y escritorio** desde un mismo código, para estudiantes y de Código Abierto.

## Funcionalidades (equivalencia con PSeInt)

| PSeInt | PSJavaScript |
| --- | --- |
| Editor con coloreado de sintaxis | Editor con resaltado de JavaScript, números de línea, pareo de llaves |
| Autocompletado y ayudas emergentes | Sugerencias mientras se escribe + barra de ayuda con firma y descripción (incluye el equivalente PSeInt) |
| Plantillas de comandos / listados de funciones, operadores y variables | Modal **Insertar**: comandos (si, mientras, para…), funciones, operadores y variables del programa |
| Indentado inteligente | Sangría automática al presionar Enter, desindentado al cerrar `}`, botón **Formatear** |
| Múltiples algoritmos abiertos | Pestañas de archivos, guardado automático local, importar/descargar `.js` |
| Ejecutar | Intérprete propio con `prompt()`/`confirm()` como entrada y `console.log()` como salida |
| Ejecución paso a paso con velocidad ajustable | Paso a paso automático (6 velocidades), siguiente paso, pausa, detener |
| Puntos de interrupción | Tocar el número de línea; también la instrucción `debugger` |
| Deshacer ejecución / volver a un punto | **Paso anterior** y "volver a este paso" desde la prueba de escritorio (re-ejecución determinista con las mismas entradas y números aleatorios) |
| Inspección de variables y expresiones | Panel Variables por ámbito, pila de llamadas, expresiones vigiladas, resaltado de cambios |
| Prueba de escritorio automática | Tabla generada al ejecutar (columnas = variables o expresiones vigiladas), exportable a CSV |
| Modo que explica cada acción | Panel **Explicación** en lenguaje natural |
| Modificar datos de una ejecución y ver el efecto | Editar los datos ingresados y **re-ejecutar**; modo **ejecución en tiempo real** al editar el código |
| Errores de sintaxis en tiempo real y descripción detallada | Analizador estático mientras se escribe + errores de ejecución en español con causas y soluciones (y "¿quisiste decir…?"). El **detective de sintaxis** (`src/core/syntaxHelp.ts`) explica en lenguaje sencillo el error real: paréntesis/llaves/comillas sin cerrar (señalando dónde se abrieron), condiciones sin paréntesis, `for` con comas, comas u operadores faltantes, palabras mal escritas y hábitos de PSeInt (`Si…Entonces`, `:=`, `y`/`o`, `=<`) |
| Diagramas de flujo y Nassi-Shneiderman | Generados del código (programa y cada función/método), resaltan la instrucción en ejecución, exportan a **SVG** |
| Exportar a otros lenguajes | Pseudocódigo **PSeInt**, **Python 3**, **C++** y descripción en **lenguaje coloquial** |
| Perfiles configurables | Flexible, Estándar, Programación estructurada (tipos estrictos e índices verificados), Estricto y Personalizado |
| Ayuda integrada y ejemplos | Ayuda del entorno y del lenguaje (con tabla PSeInt ↔ JavaScript) y 21 ejemplos en 3 niveles |

JavaScript soportado: `let/const/var`, funciones (declaraciones, expresiones, flecha, recursión, closures, parámetros por defecto y rest), `if/else`, `switch`, `while`, `do…while`, `for`, `for…of`, `for…in`, etiquetas, `break/continue`, `try/catch/finally/throw`, arreglos y objetos (desestructuración, spread), plantillas de texto, encadenamiento opcional, `??`, clases (herencia, `super`, getters/setters, `static`, campos privados), `Math`, `JSON`, `Map`, `Set`, `Date`, métodos de texto y arreglos (los callbacks de `map/filter/reduce/sort…` también se ejecutan paso a paso) y `setTimeout/setInterval` con tiempo simulado. No soportado: `async/await`, promesas, generadores, módulos, DOM y red.

## Mascota

Michi, el gatito guía (`src/components/Mascot.tsx`), reacciona al estado del programa con animaciones por capas (cuerpo, cola, ojos y efectos) usando `Animated` con driver nativo:

- **Reposo**: respira, se balancea, mueve la cola, parpadea al azar y da saltitos; al terminar un programa celebra. Tras 45 s sin actividad se duerme (ojos cerrados y "Zzz"); se despierta al tocarlo o editar.
- **Error** (sintaxis o ejecución): tiembla, mira nervioso a los lados, "???" saltando, gota de sudor y una mosca dando vueltas.
- **Ejecutando**: corre tecleando, con destellos en las teclas, símbolos de código saliendo del teclado y líneas de velocidad.

- **Mareado**: si una ejecución supera muchos pasos (posible ciclo infinito) los ojos giran en espiral y orbitan estrellas.
- **Celebración**: al corregir un error da un salto con giro, lanza confeti y dice "¡Arreglado!".

Interacción: **tocarlo** abre un menú (Ejecutar/Detener, Explícame el error, Consejo, Volver a su lugar, Ocultar); **mantenerlo presionado** lo acaricia (ronronea, corazones y vibración suave en el teléfono con `expo-haptics`); **arrastrarlo** lo mueve a cualquier lugar y la posición se recuerda. Cada 2–5 minutos (al azar, solo en reposo) juega a las **escondidas**: avisa "¡Me escondo! 🙈", corre al borde más cercano y solo asoma la cola; vuelve solo a los 8–20 s, al tocar la cola ("¡Me encontraste!") o en cuanto escribes o cambia el programa. Si lo tocas mientras huye, se queda.

Los sprites (`assets/mascot/`) se generan desde `assets/mascot.jpg` con `scripts/generar_mascota.py` (quita el fondo blanco conservando el blanco de los ojos, separa la cola y crea los cuadros de parpadeo y mirada). Respeta la opción del sistema "reducir movimiento" y puede ocultarse en Configuración.

### Vestuarios de temporada

Michi se disfraza solo según la fecha (`src/core/holidays.ts`): se pone el vestuario **un mes antes** del día festivo y lo conserva **10 días después**. Si otra fiesta cae en el mismo mes, la anticipación se acorta a **10 días**. Cuando dos periodos se enciman gana la fiesta más cercana (en empate, la que viene). También se puede elegir en **Configuración → Vestuario de la mascota** o desde su menú ("Vestuario: …" recorre todos). Los accesorios son SVG que siguen las animaciones del cuerpo en todas las poses (`src/components/mascot/costumes.tsx`) y cada fiesta trae sus propias partículas:

| Fiesta | Día festivo | Periodo automático | Vestuario |
| --- | --- | --- | --- |
| Año Nuevo | 1 ene | 22 dic – 11 ene | Gorro de fiesta, confeti |
| Día de Reyes | 6 ene | 27 dic – 16 ene | Corona dorada con joyas |
| San Valentín | 14 feb | 14 ene – 24 feb | Alas de ángel que aletean, aureola y dije de corazón |
| Primavera | 21 mar | 21 feb – 31 mar | Corona de flores, mariposas |
| Día del Niño | 30 abr | 30 mar – 10 may | Gorra con hélice que gira, globos |
| Día de las Madres | 10 may | 30 abr – 20 may | Corona de rosas |
| Día del Maestro | 15 may | 5 – 25 may | Birrete con borla y lentes redondos |
| Fiestas Patrias | 16 sep | 16 ago – 26 sep | Sombrero charro tricolor, bigote y moño |
| Día del Programador | día 256 (13 sep) | solo ese día | Lentes pixelados, `{ }` y `</>` flotando |
| Halloween | 31 oct | 30 sep – 10 nov | **Gato oscuro** de ojos verdes, sombrero de bruja, murciélagos |
| Día de Muertos | 2 nov | 23 oct – 12 nov | **Gato negro** con calaverita pintada y corona de cempasúchil |
| Revolución | 20 nov | 10 – 30 nov | Sombrero de fieltro, bigote y paliacate |
| Navidad | 25 dic | 25 nov – 4 ene | Gorro de Santa (pompón que se balancea) y barba blanca, nieve |

Los colores oscuro y negro se generan con `scripts/vestuarios_mascota.py` (`assets/mascot/skins/`), que recolorea el pelaje conservando ojos, orejas, mejillas y teclado.

## Modo Maestro y Modo Examen

Botón **Examen** de la barra de herramientas → **Soy maestro** o **Soy alumno**.

### Modo Maestro (diseñar y aplicar)

- **Mis exámenes**: crear desde cero o a partir del examen de ejemplo, duplicar, eliminar, **exportar** la configuración (`.examen.json`) e **importarla** en otro equipo.
- **Editor** con 8 tipos de ejercicio:

  | Tipo | Cómo se califica |
  | --- | --- |
  | Opción múltiple | Una opción correcta |
  | Varias respuestas | Todas las correctas (puntos parciales opcionales: aciertos − errores) |
  | Verdadero o falso | Valor esperado |
  | Respuesta corta | Lista de respuestas aceptadas (ignora espacios, acentos y mayúsculas, salvo que se pida) |
  | Respuesta numérica | Valor con tolerancia ± |
  | ¿Qué imprime? | Se ejecuta el programa del maestro y se compara con lo que escribe el alumno |
  | Escribir un programa | Casos de prueba (datos para `prompt()` → salida esperada, o una **llamada** como `reverseString("hola")` → valor devuelto en JSON), visibles u **ocultos**, y requisitos («debe usar `for`», «no debe usar `sort`») |
  | Ordenar líneas | Problema de Parsons; puntos parciales por la secuencia correcta más larga |

  En las preguntas de programación el maestro escribe su **solución de referencia** (nunca se envía al alumno): **Calcular salidas con la solución** llena los casos y **Verificar solución** confirma que obtiene el 100 %. La comparación de salidas puede ser *flexible*, *exacta*, *solo números* o *contiene*.
- Cada pregunta puede tener un **tema**; los enunciados y opciones admiten `código en línea`, bloques con ```` ``` ```` y **negritas**.
- **Ajustes**: duración (o sin límite), banco de preguntas (cada alumno recibe *N* al azar, o *N* **por tema**), mezclar preguntas y opciones, escala 0–10 / 0–100, porcentaje aprobatorio, qué ve el alumno al enviar (nada, calificación, detalle o **todo con respuestas** para practicar; con temas, también su resultado por tema), perfil del lenguaje, permitir ejecutar/probar código, autocompletado, errores en tiempo real, **bloquear pegar** y **detectar salidas de la ventana**.
- **Vista previa**: presenta el examen como alumno (otra versión mezclada cada vez) y lo califica.
- **Sala en vivo**: al abrirla se genera un **código de 6 caracteres**, un enlace `?sala=CODIGO` y su **código QR**; **Proyectar** muestra el código y el QR en pantalla completa para el salón. **Aceptar alumnos nuevos** se puede apagar cuando ya entraron todos (los que están pueden reconectarse). Se marcan los **nombres repetidos** y la pantalla del maestro no se apaga mientras la sala está abierta. Se ve a cada alumno en tiempo real: conectado o no, avance (respondidas/total), pregunta actual, **qué está haciendo** (leyendo, escribiendo código, ejecutando, probando casos, inactivo, fuera de la ventana), tiempo restante, salidas de la ventana, intentos de pegar y calificación al entregar. Al tocar un alumno se ven sus respuestas en vivo (incluido su código), la bitácora de actividad y se pueden **ajustar puntos a mano**, darle más tiempo, recoger su examen, **reabrirlo** si lo envió por error (+10 min) o quitarlo de la sala. También: avisos a todos, +5 minutos a todos y **Cerrar examen** (recoge y califica lo pendiente).
- **Resultados (concentrado)**: alumnos, promedio, mediana, máxima, mínima, % de aprobados, tiempo promedio, distribución de calificaciones, **análisis por pregunta** (aciertos y dificultad; con un banco solo las preguntas que se usaron), **análisis por tema** y tabla por alumno (calificación, puntos, tiempo, respondidas, salidas, pegados, cómo entregó). Exporta a **CSV** (Excel) y respaldo **JSON**. Queda un historial de exámenes aplicados (guardado de forma compacta; si el dispositivo se queda sin espacio se borran los más antiguos y se avisa).

### Modo Examen (alumno)

- Entra con el **código**, su nombre y grupo/matrícula. Lee las instrucciones y el tiempo empieza al presionar **Comenzar**.
- Durante el examen **no existen** la ayuda, la mascota, insertar comandos, archivos/ejemplos ni exportar (el entorno normal no se monta). Las preguntas y opciones aparecen **en orden aleatorio** (distinto por alumno, generado con una semilla).
- Navegador de preguntas, «revisar después», editor con resaltado para programar, **Ejecutar** (también con **Ctrl+Enter**, con `prompt()`) y **Probar con los ejemplos**, si el maestro lo permite.
- Botones **A− / A+** para el tamaño de letra, indicador **guardado ✓ / guardando… / guardado en este dispositivo** y avisos cuando quedan **10, 5 y 1 minutos** (con vibración en el teléfono).
- **Enviar a calificar** muestra cuántas faltan; al agotarse el tiempo o cerrar el maestro, se envía solo. La calificación se calcula en el equipo del maestro (el alumno nunca recibe respuestas ni casos ocultos).
- Las respuestas se guardan en el dispositivo: si se recarga la página o se cae la red, el alumno vuelve a su examen y lo pendiente se reenvía al reconectar. El nombre del alumno no se guarda de forma permanente (computadoras compartidas).

### Certificación JavaScript de freeCodeCamp (simulacro y práctica)

Simulacro del examen de la certificación [JavaScript de freeCodeCamp](https://www.freecodecamp.org/learn/javascript-v9/) (currículo v9). Ese examen se presenta en la aplicación de exámenes de freeCodeCamp y sus preguntas no son públicas, así que el simulacro usa **los mismos temas y los mismos ejercicios** del currículo:

- **480 preguntas** de los 27 cuestionarios de cada módulo (variables, strings, números, condicionales, funciones, arreglos, objetos, ciclos, orden superior, DOM, accesibilidad, depuración, regex, formularios, fechas, audio/video, Map/Set, localStorage, clases, recursión, estructuras de datos, búsqueda y ordenamiento, grafos, programación dinámica, programación funcional y asíncrono). Se dejan **en inglés**, como en la certificación: una respuesta correcta y tres distractores.
- **35 laboratorios** del currículo que no necesitan el DOM ni la red (p. ej. *Reverse a String*, *Title Case Converter*, *Pig Latin*, *Bank Account Manager* y *Voting System*, dos de los proyectos de certificación). Se conserva el nombre de la función y cada prueba **llama a la función y compara lo que devuelve**, como las pruebas de freeCodeCamp; hay casos visibles y ocultos y requisitos como «no uses `.repeat()`».
- **Criterios**: cada alumno recibe **2 preguntas por tema y 3 laboratorios** (57), tiene **90 minutos** y aprueba con **90 %**, el mismo criterio de los cuestionarios de freeCodeCamp (18 de 20). Perfil del lenguaje *Flexible* (JavaScript tal cual).

En **Mis exámenes → Agregar simulacro y práctica** se crean dos configuraciones editables: el **Simulacro** (con tiempo, sin ayudas, bloqueo de pegar) y una **copia de Práctica** (sin tiempo, con ayudas y mostrando al final la respuesta correcta de cada pregunta y el resultado por tema). Los alumnos también pueden **practicar por su cuenta** desde **Soy alumno → Practicar por mi cuenta**, sin código de sala: simulacro completo, práctica sin tiempo o un solo tema (el cuestionario completo del módulo y sus laboratorios). La práctica corre en el propio dispositivo y se retoma si se recarga la página.

El banco se genera con `node scripts/importar-fcc-javascript.js` (descarga los cuestionarios del repositorio de freeCodeCamp y escribe `src/core/exam/certs/fccJavascriptQuizzes.ts`); los laboratorios están en `src/core/exam/certs/fccJavascriptLabs.ts` y `tests/certification.test.ts` comprueba que cada solución pasa sus pruebas. Contenido © freeCodeCamp.org, licencia CC BY-SA 4.0.

### Conexión de la sala

El equipo del maestro es el anfitrión: recibe, guarda y califica. Hay tres formas de conectarse:

- **Por Internet** (recomendado, sin instalar nada): WebRTC directo entre cada alumno y el maestro con [PeerJS](https://peerjs.com/); el servidor público de PeerJS solo los presenta. Funciona desde GitHub Pages y la versión de escritorio. Una escuela puede usar su propio servidor de enlace definiendo `window.__PSJS_PEER__ = { host, port, path, secure }`.
- **Red del aula** (sin Internet): en la computadora del maestro
  ```bash
  npm run export:web   # una vez, genera dist/
  npm run sala         # servidor del aula en el puerto 8787 (sin dependencias)
  ```
  El servidor muestra la dirección (`http://192.168.x.x:8787`) que abren maestro y alumnos en la misma red Wi-Fi; la conexión se configura sola. Opciones: `npm run sala -- --puerto 9000 --dir ./dist`.
- **Este dispositivo**: pestañas del mismo navegador (para probar un examen sin red).
- **Práctica individual**: el alumno practica solo; la sala corre dentro de su propia aplicación.

Código: `src/core/exam/` (tipos, generación del examen por alumno, calificación, protocolo, anfitrión, cliente, transportes y concentrado; probado en `tests/exam.test.ts` y `tests/certification.test.ts`), `src/core/exam/certs/` (certificación de freeCodeCamp), `src/store/teacher.ts`, `src/store/student.ts`, `src/store/practice.ts`, `src/components/teacher/`, `src/components/exam/` y `scripts/sala-servidor.js`.

## Arquitectura

```
src/
  app/                 Rutas de Expo Router (una sola pantalla)
  core/                Lógica pura en TypeScript (sin React Native, probada con node:test)
    interpreter/       Intérprete de JS basado en generadores sobre el AST de acorn
    runner.ts          Control de ejecución: modos, breakpoints, entradas, retroceso, prueba de escritorio
    analyzer.ts        Diagnósticos en tiempo real y reglas de perfil
    profiles.ts        Perfiles del lenguaje
    errors.ts          Mensajes en español, causas y soluciones
    flowchart/         Modelo de bloques, layout clásico y Nassi-Shneiderman, exportación SVG
    exporters/         PSeInt, Python, C++, lenguaje coloquial
    editor/            Tokenizador (resaltado), sangría y formato
    exam/              Modo Maestro / Examen: calificación, salas y transportes
    catalog.ts help.ts examples.ts
  components/          Editor, paneles, modales e IDE
  store/app.ts         Estado global (zustand) + persistencia (AsyncStorage)
  store/teacher.ts     Exámenes, sala activa e historial del maestro
  store/student.ts     Sesión del alumno (se retoma al recargar)
  ui/                  Tema claro/oscuro y utilidades de plataforma
tests/                 Pruebas del núcleo (incluye ejecutar el Python exportado y compilar el C++ exportado)
```

El intérprete recorre el AST con generadores: cada instrucción produce un evento `step` y cada `prompt()` un evento `input`, por eso se puede pausar en cualquier punto, inspeccionar el estado y responder lecturas sin bloquear la interfaz.

## Comandos

```bash
npm install
npm run web          # navegador
npm run ios          # simulador iOS (requiere Xcode) o Expo Go
npm run android      # emulador/dispositivo Android o Expo Go
npm test             # pruebas del núcleo (también corren en cada PR: .github/workflows/ci.yml)
npm run typecheck    # TypeScript (app y pruebas)
npx expo lint        # ESLint
npm run export:web   # sitio estático en dist/
npm run sala         # servidor del aula para exámenes sin Internet (sirve dist/)
npm run build:desktop # empaqueta la versión según tu sistema (GNU/Linux .AppImage, macOS .dmg o Windows .exe)
npm run build:desktop:linux # empaqueta específicamente para GNU/Linux (.AppImage / .deb)
npm run build:desktop:mac # empaqueta específicamente para macOS (.dmg)
npm run build:desktop:win # empaqueta específicamente para Windows (.exe)
```

### Generación de instaladores de escritorio

Asegúrate de tener instalado [Node.js](https://nodejs.org).

- **En GNU/Linux (.AppImage / .deb)**:
  ```bash
  npm run build:desktop:linux
  ```
  Esto generará el paquete portable `public/PSJavaScript.AppImage` (y opcionalmente `.deb`).
  Para ejecutar la versión portable:
  ```bash
  chmod +x public/PSJavaScript.AppImage
  ./public/PSJavaScript.AppImage
  ```
  O si generas el paquete Debian/Ubuntu:
  ```bash
  sudo dpkg -i public/PSJavaScript.deb
  ```

- **En macOS (.dmg)**:
  ```bash
  npm run build:desktop:mac
  ```
  Esto generará `public/PSJavaScript.dmg` con soporte nativo para Apple Silicon / Intel, iconos en alta definición (`.icns`), menú del sistema y soporte 100% offline para los iconos del editor.

- **En Windows (.exe)**:
  ```bash
  npm run build:desktop:win
  ```
  Esto generará el instalador `public/PSJavaScript-Setup.exe`.

Los comandos copian automáticamente el instalador a la carpeta `public/` y regeneran el sitio web para que los usuarios puedan descargarlo directamente desde los botones de la barra superior.

## Publicación multiplataforma

- **Web**: `npm run export:web` genera `dist/`, publicable en cualquier hosting estático.
- **Escritorio**: Usa `npm run build:desktop` para generar el empaquetado para GNU/Linux (`.AppImage` / `.deb`), macOS (`.dmg`) o Windows (`.exe`) automáticamente empleando Electron y `electron-builder`.
- **iOS y Android**: con EAS (`eas.json` incluido):
  ```bash
  npx eas-cli@latest build --platform android --profile preview   # APK de prueba
  npx eas-cli@latest build --platform ios --profile production
  ```
  Identificador de la app: `com.psjavascript.app` (cámbialo en `app.json` antes de publicar).

## Pendiente / ideas

- Editar el diagrama de flujo y regenerar el código (PSeInt lo permite).
- Más lenguajes de exportación (Java, C#, PHP…).
- Verificar el editor en dispositivos iOS/Android reales (la versión web está probada; los bundles nativos compilan).

## Autor y licencia

Creado por **Angel Solís Ek**. PSJavaScript es **código libre** bajo la [licencia MIT](LICENSE): cualquiera puede descargarlo, usarlo, estudiarlo, modificarlo y compartirlo, incluso con fines comerciales, conservando el aviso de copyright.

Descarga el código: <https://github.com/ASolisEk/PSJavaScript>
