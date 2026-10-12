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
| Errores de sintaxis en tiempo real y descripción detallada | Analizador estático mientras se escribe + errores de ejecución en español con causas y soluciones (y "¿quisiste decir…?") |
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

Interacción: **tocarlo** abre un menú (Ejecutar/Detener, Explícame el error, Consejo, Volver a su lugar, Ocultar); **mantenerlo presionado** lo acaricia (ronronea, corazones y vibración suave en el teléfono con `expo-haptics`); **arrastrarlo** lo mueve a cualquier lugar y la posición se recuerda.

Los sprites (`assets/mascot/`) se generan desde `assets/mascot.jpg` con `scripts/generar_mascota.py` (quita el fondo blanco conservando el blanco de los ojos, separa la cola y crea los cuadros de parpadeo y mirada). Respeta la opción del sistema "reducir movimiento" y puede ocultarse en Configuración.

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
    catalog.ts help.ts examples.ts
  components/          Editor, paneles, modales e IDE
  store/app.ts         Estado global (zustand) + persistencia (AsyncStorage)
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
npm test             # pruebas del núcleo
npm run typecheck    # TypeScript (app y pruebas)
npx expo lint        # ESLint
npm run export:web   # sitio estático en dist/
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
