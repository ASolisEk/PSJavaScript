/**
 * Niveles del juego del dron. Cada uno practica un concepto de JavaScript con las
 * mecánicas del juego: tipos de datos, operadores, condicionales, ciclos y arreglos.
 * El último es la granja libre: todo desbloqueable y sin objetivo fijo, para probar
 * la lógica propia.
 */
import type { CodeRule } from '../exam/types';
import { EntityId, GroundId, ItemId, UnlockId, World, WorldOptions } from './world';

export interface LevelCheck {
  done: boolean;
  /** La misión ya no se puede cumplir (mensaje para el alumno). */
  failed?: string;
  /** Texto del avance, por ejemplo «12 / 20 de Heno». */
  progress: string;
  /** 0 a 1, para la barra. */
  ratio: number;
}

export interface GameLevel {
  id: string;
  title: string;
  /** Concepto de JavaScript que se practica. */
  concept: string;
  icon: string;
  /** Explicación (admite `código` y bloques ```). */
  intro: string;
  goal: string;
  world: WorldOptions;
  /** `finished`: el programa del alumno ya terminó (algunas misiones se revisan al final). */
  check(w: World, label: (item: ItemId) => string, ctx: { finished: boolean }): LevelCheck;
  /** Nivel de construcción (por defecto) o misión de hackeo. */
  kind?: 'build' | 'hack';
  /** Tipo de reto de hackeo: completar o corregir el código del intruso, o dar instrucciones a tu dron. */
  task?: 'completar' | 'corregir' | 'instrucciones';
  /** El código del alumno controla al dron intruso (te conectaste a su sistema). */
  patch?: boolean;
  /** Programa del intruso que corre al mismo tiempo que el del alumno. */
  intruderCode?: string;
  /** El intruso actúa una vez por cada tantas acciones de tu dron (1 = igual de rápido). */
  intruderEvery?: number;
  /** Requisitos del código (como en los exámenes). */
  rules?: Omit<CodeRule, 'id'>[];
  /** Requisitos que no se pueden expresar como «contiene» (p. ej. una función recursiva). */
  requires?: { message: string; test(code: string): boolean }[];
  /** Segundos de juego para la tercera estrella. */
  timeTarget?: number;
  starter: string;
  hints: string[];
  /** Solución de referencia (pruebas automáticas). */
  solution: string;
  /** Granja libre: sin objetivo; se guardan recursos y mejoras. */
  sandbox?: boolean;
}

const items = (w: World, item: ItemId, goal: number, label: (i: ItemId) => string): LevelCheck => {
  const n = Math.floor(w.items[item]);
  return { done: n >= goal, progress: `${Math.min(n, goal)} / ${goal} de ${label(item)}`, ratio: Math.min(1, n / goal) };
};

const ALL_UNLOCKS: Partial<Record<UnlockId, number>> = { trees: 1, carrots: 1, watering: 1, pumpkins: 1, sunflowers: 1, fertilizer: 1, cactus: 1, polyculture: 1, mazes: 1 };

/** Función de navegación que se da hecha en los niveles con arreglos (camino más corto, la granja da la vuelta). */
export const GO_TO = `// Lleva el dron a la casilla (x, y) por el camino más corto
function irA(x, y) {
  const n = getWorldSize();
  while (getPosX() !== x) {
    const derecha = (x - getPosX() + n) % n;
    move(derecha <= n / 2 ? East : West);
  }
  while (getPosY() !== y) {
    const arriba = (y - getPosY() + n) % n;
    move(arriba <= n / 2 ? North : South);
  }
}
`;

const fillAll = (entity: EntityId | null, ground: GroundId = 'grassland', grown = true) => () => ({ ground, entity, grown });

/** Funciones declaradas en el código (`function nombre(…) { … }`) con su cuerpo. */
export function declaredFunctions(code: string): { name: string; body: string; rest: string }[] {
  const out: { name: string; body: string; rest: string }[] = [];
  const re = /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    let depth = 1;
    let i = re.lastIndex;
    for (; i < code.length && depth; i++) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') depth--;
    }
    out.push({ name: m[1], body: code.slice(re.lastIndex, i - 1), rest: code.slice(0, m.index) + code.slice(i) });
  }
  return out;
}

const calls = (name: string, text: string) => (text.match(new RegExp(`(^|[^\\w$.])${name.replace(/\$/g, '\\$')}\\s*\\(`, 'g')) ?? []).length;

/** Declara una función propia y la usa. */
const usesOwnFunction = (code: string) => declaredFunctions(code).some((f) => f.name !== 'irA' && calls(f.name, f.rest) >= 1);
/** Alguna función se llama a sí misma. */
const usesRecursion = (code: string) => declaredFunctions(code).some((f) => calls(f.name, f.body) >= 1);

export const LEVELS: GameLevel[] = [
  {
    id: 'primer-vuelo',
    title: 'Tu primer dron',
    concept: 'Llamar funciones',
    icon: 'rocket-outline',
    intro:
      'Tu dron no hace nada hasta que le das instrucciones. Cada instrucción es una **llamada a una función**: su nombre seguido de paréntesis.\n\nEl dron está sobre pasto maduro. Para cosecharlo escribe:\n```js\nharvest();\n```\nPresiona **Ejecutar** y mira cómo cambia tu inventario.',
    goal: 'Consigue 1 de heno.',
    world: { size: 3, seed: 'nivel-1' },
    check: (w, l) => items(w, 'hay', 1, l),
    starter: '// Escribe aquí la instrucción para cosechar\n',
    hints: ['La función para cosechar es harvest().', 'No olvides los paréntesis y el punto y coma: harvest();'],
    solution: 'harvest();\n',
  },
  {
    id: 'repetir',
    title: 'Repite la cosecha',
    concept: 'Ciclo for',
    icon: 'repeat-outline',
    intro:
      'El pasto vuelve a crecer en cuanto lo cosechas. En lugar de escribir `harvest();` diez veces, usa un **ciclo for**: repite un bloque un número fijo de veces.\n```js\nfor (let i = 0; i < 3; i++) {\n  console.log("vuelta " + i);\n}\n```\n`i` es un **número** que empieza en 0 y aumenta en 1 en cada vuelta mientras `i < 3`.',
    goal: 'Consigue 10 de heno usando un ciclo for.',
    world: { size: 3, seed: 'nivel-2' },
    check: (w, l) => items(w, 'hay', 10, l),
    rules: [{ kind: 'contains', pattern: 'for', message: 'Usa un ciclo for.' }],
    starter: '// Cosecha 10 veces con un ciclo for\n',
    hints: ['Escribe el ciclo: for (let i = 0; i < 10; i++) { ... }', 'Dentro de las llaves va harvest();'],
    solution: 'for (let i = 0; i < 10; i++) {\n  harvest();\n}\n',
  },
  {
    id: 'recorrer-fila',
    title: 'A recorrer la fila',
    concept: 'Ciclo while y comparaciones',
    icon: 'arrow-forward-outline',
    intro:
      '`move(East)` mueve el dron una casilla a la derecha; al salir por el borde aparece del otro lado. Las direcciones son `North`, `East`, `South` y `West`.\n\nUn **ciclo while** repite mientras una condición sea verdadera. `numItems(Items.Hay)` devuelve un **número**, y `<` lo compara:\n```js\nwhile (numItems(Items.Hay) < 20) {\n  // cosecha y avanza\n}\n```',
    goal: 'Consigue 20 de heno cosechando y moviéndote con un ciclo while.',
    world: { size: 4, seed: 'nivel-3' },
    check: (w, l) => items(w, 'hay', 20, l),
    rules: [
      { kind: 'contains', pattern: 'while', message: 'Usa un ciclo while.' },
      { kind: 'contains', pattern: 'move', message: 'Mueve el dron con move().' },
    ],
    timeTarget: 25,
    starter: '// Repite mientras tengas menos de 20 de heno\n',
    hints: ['La condición es numItems(Items.Hay) < 20.', 'Dentro del ciclo: harvest(); y luego move(East);'],
    solution: 'while (numItems(Items.Hay) < 20) {\n  harvest();\n  move(East);\n}\n',
  },
  {
    id: 'toda-la-granja',
    title: 'Toda la granja',
    concept: 'Ciclos anidados',
    icon: 'grid-outline',
    intro:
      'Para recorrer una cuadrícula se usan **dos ciclos, uno dentro del otro**: el de afuera avanza por las columnas y el de adentro por las filas.\n```js\nconst n = getWorldSize();\nfor (let x = 0; x < n; x++) {\n  for (let y = 0; y < n; y++) {\n    // casilla (x, y)\n    move(North);\n  }\n  move(East);\n}\n```',
    goal: 'Cosecha en las 25 casillas de la granja.',
    world: { size: 5, seed: 'nivel-4' },
    check: (w) => {
      const n = w.stats.harvestedCells.size;
      return { done: n >= 25, progress: `${n} / 25 casillas cosechadas`, ratio: n / 25 };
    },
    rules: [{ kind: 'contains', pattern: 'for', message: 'Usa ciclos for.' }],
    timeTarget: 35,
    starter: 'const n = getWorldSize();\n\n// Recorre todas las casillas con dos ciclos y cosecha en cada una\n',
    hints: ['Dentro del ciclo de adentro: harvest(); move(North);', 'Al terminar el ciclo de adentro: move(East);'],
    solution: 'const n = getWorldSize();\nfor (let x = 0; x < n; x++) {\n  for (let y = 0; y < n; y++) {\n    harvest();\n    move(North);\n  }\n  move(East);\n}\n',
  },
  {
    id: 'esta-listo',
    title: '¿Ya está listo?',
    concept: 'Condicionales: if',
    icon: 'help-circle-outline',
    intro:
      'Los arbustos tardan unos segundos en crecer. Si los cosechas antes de tiempo, **se pierden**. `canHarvest()` devuelve un **booleano**: `true` si ya maduró y `false` si no.\n\nCon **if** el dron decide:\n```js\nif (canHarvest()) {\n  harvest();\n  plant(Entities.Bush);\n}\n```\nDespués de cosechar un arbusto hay que volver a plantarlo.',
    goal: 'Consigue 16 de madera sin perder ninguna planta.',
    world: { size: 4, seed: 'nivel-5', fill: fillAll('bush', 'grassland', false) },
    check: (w, l) => {
      const c = items(w, 'wood', 16, l);
      if (w.stats.wasted) return { ...c, done: false, progress: `${c.progress} · perdiste ${w.stats.wasted} planta(s)` };
      return c;
    },
    rules: [{ kind: 'contains', pattern: 'if', message: 'Decide con if.' }],
    timeTarget: 40,
    starter: '// Recorre la granja una y otra vez; cosecha solo lo que esté listo\nwhile (numItems(Items.Wood) < 16) {\n  \n  move(North);\n}\n',
    hints: ['Antes de harvest() pregunta if (canHarvest()).', 'Después de cosechar, vuelve a plantar: plant(Entities.Bush);', 'Para recorrer las 16 casillas: cuando getPosY() sea 0 después de moverte al norte, muévete también al este.'],
    solution:
      'while (numItems(Items.Wood) < 16) {\n  if (canHarvest()) {\n    harvest();\n    plant(Entities.Bush);\n  }\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
  },
  {
    id: 'que-hay-aqui',
    title: '¿Qué hay aquí?',
    concept: 'Tipos de datos: texto y comparación',
    icon: 'search-outline',
    intro:
      'La granja tiene pasto, arbustos y árboles revueltos. `getEntityType()` devuelve un **texto** con lo que hay bajo el dron, que puedes comparar con `===` o `!==`:\n```js\nconst tipo = getEntityType();\nconsole.log(typeof tipo, tipo);\nif (tipo === Entities.Tree) { ... }\n```\nAquí solo queremos madera: **no coseches pasto**.',
    goal: 'Consigue 40 de madera sin cosechar pasto.',
    world: {
      size: 5,
      seed: 'nivel-6',
      unlocks: { trees: 1 },
      fill: (x, y) => ({ entity: (x * 7 + y * 3) % 5 === 0 ? 'tree' : (x + y * 2) % 3 === 0 ? 'bush' : 'grass', grown: true }),
    },
    check: (w, l) => {
      const c = items(w, 'wood', 40, l);
      const grass = w.stats.harvested.grass ?? 0;
      if (grass) return { ...c, done: false, progress: `${c.progress} · cosechaste ${grass} pasto(s)` };
      return c;
    },
    rules: [{ kind: 'contains', pattern: 'getEntityType', message: 'Revisa qué hay con getEntityType().' }],
    timeTarget: 45,
    starter: 'while (numItems(Items.Wood) < 40) {\n  const tipo = getEntityType();\n  // ¿Es pasto? ¿Está listo?\n\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
    hints: ['Cosecha solo si tipo !== Entities.Grass y canHarvest().', 'Une las dos condiciones con &&.', 'Vuelve a plantar lo mismo que cosechaste: plant(tipo);'],
    solution:
      'while (numItems(Items.Wood) < 40) {\n  const tipo = getEntityType();\n  if (tipo !== Entities.Grass && canHarvest()) {\n    harvest();\n    plant(tipo);\n  }\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
  },
  {
    id: 'tablero',
    title: 'Árboles en tablero',
    concept: 'Operadores aritméticos: + y %',
    icon: 'apps-outline',
    intro:
      'Los árboles dan 5 de madera, pero **crecen más lento si tienen árboles al lado**. La solución: plantarlos como un tablero de ajedrez.\n\nUna casilla es «negra» si `(x + y) % 2 === 0`. El operador `%` da el **residuo** de la división: los números pares dejan residuo 0.\n```js\nconst x = getPosX();\nconst y = getPosY();\nif ((x + y) % 2 === 0) { ... } else { ... }\n```',
    goal: 'Consigue 150 de madera.',
    world: { size: 6, seed: 'nivel-7', unlocks: { trees: 1 } },
    check: (w, l) => items(w, 'wood', 150, l),
    rules: [{ kind: 'contains', pattern: '%', message: 'Usa el operador % para el tablero.' }],
    timeTarget: 160,
    starter: 'while (numItems(Items.Wood) < 150) {\n  const x = getPosX();\n  const y = getPosY();\n  // Cosecha si está listo y planta árbol o arbusto según (x + y) % 2\n\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
    hints: ['Si canHarvest() → harvest().', 'Si la casilla está vacía o tiene pasto, planta: árbol en las casillas pares y arbusto en las impares.', 'getEntityType() === Entities.Grass te dice si aún hay pasto.'],
    solution:
      'while (numItems(Items.Wood) < 150) {\n  const x = getPosX();\n  const y = getPosY();\n  const tipo = getEntityType();\n  if (tipo === Entities.Grass || tipo === null) {\n    plant((x + y) % 2 === 0 ? Entities.Tree : Entities.Bush);\n  } else if (canHarvest()) {\n    harvest();\n    plant((x + y) % 2 === 0 ? Entities.Tree : Entities.Bush);\n  }\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
  },
  {
    id: 'zanahorias',
    title: 'Tierra para zanahorias',
    concept: 'Condicionales con if / else',
    icon: 'leaf-outline',
    intro:
      'Las zanahorias solo crecen en **tierra arada**. `till()` cambia el suelo entre pradera y tierra, y `getGroundType()` dice cuál hay. Cada zanahoria cuesta 1 de madera y 1 de heno.\n```js\nif (getGroundType() !== Grounds.Soil) {\n  till();\n}\n```\nCuidado: llamar `till()` sobre tierra la vuelve pradera otra vez.',
    goal: 'Consigue 20 zanahorias.',
    world: { size: 4, seed: 'nivel-8', items: { wood: 40, hay: 40 }, unlocks: { carrots: 1 } },
    check: (w, l) => items(w, 'carrot', 20, l),
    rules: [{ kind: 'contains', pattern: 'getGroundType', message: 'Revisa el suelo con getGroundType().' }],
    timeTarget: 75,
    starter: 'while (numItems(Items.Carrot) < 20) {\n  // 1. Si el suelo no es tierra, ára con till()\n  // 2. Si la zanahoria está lista, cosecha\n  // 3. Si la casilla está vacía, planta una zanahoria\n\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
    hints: ['Compara getGroundType() con Grounds.Soil.', 'La casilla está vacía cuando getEntityType() === null.', 'Para plantar: plant(Entities.Carrot);'],
    solution:
      'while (numItems(Items.Carrot) < 20) {\n  if (getGroundType() !== Grounds.Soil) {\n    till();\n  }\n  if (canHarvest()) {\n    harvest();\n  }\n  if (getEntityType() === null) {\n    plant(Entities.Carrot);\n  }\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
  },
  {
    id: 'riego',
    title: 'Riego inteligente',
    concept: 'Operadores lógicos y decimales',
    icon: 'water-outline',
    intro:
      'El agua hace crecer las plantas hasta 5 veces más rápido. `getWater()` devuelve un **número decimal** entre 0 y 1. Riega solo si hace falta **y** si te queda agua:\n```js\nif (getWater() < 0.5 && numItems(Items.Water) > 0) {\n  useItem(Items.Water);\n}\n```\n`&&` (y) necesita que las dos condiciones sean verdaderas; `||` (o) basta con una.',
    goal: 'Consigue 30 zanahorias.',
    world: { size: 4, seed: 'nivel-9', items: { wood: 60, hay: 60, water: 60 }, unlocks: { carrots: 1, watering: 1 }, fill: fillAll(null, 'soil') },
    check: (w, l) => items(w, 'carrot', 30, l),
    rules: [{ kind: 'contains', pattern: '&&', message: 'Combina condiciones con &&.' }],
    timeTarget: 110,
    starter: 'while (numItems(Items.Carrot) < 30) {\n  // Riega si hace falta, cosecha si está listo y vuelve a plantar\n\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
    hints: ['Usa la condición del ejemplo para regar.', 'Después: if (canHarvest()) harvest(); y si la casilla quedó vacía, plant(Entities.Carrot);'],
    solution:
      'while (numItems(Items.Carrot) < 30) {\n  if (getWater() < 0.5 && numItems(Items.Water) > 0) {\n    useItem(Items.Water);\n  }\n  if (canHarvest()) {\n    harvest();\n  }\n  if (getEntityType() === null) {\n    plant(Entities.Carrot);\n  }\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
  },
  {
    id: 'calabaza-gigante',
    title: 'Calabaza gigante',
    concept: 'Arreglos: lista de pendientes',
    icon: 'list-outline',
    intro:
      'Las calabazas maduras que forman un cuadrado **se funden en una calabaza gigante**: una de 4×4 rinde 4·4·4 = 64. Pero el 20 % se pudre al madurar y hay que replantarla.\n\nUn **arreglo** guarda una lista. Aquí te sirve para recordar qué casillas faltan:\n```js\nlet pendientes = [];\npendientes.push([x, y]);      // agregar\nconst [px, py] = pendientes[0]; // leer\npendientes.length              // cuántos hay\n```',
    goal: 'Cosecha una calabaza gigante de 4×4.',
    world: { size: 4, seed: 'nivel-10', items: { carrot: 80 }, unlocks: { pumpkins: 1 }, fill: fillAll(null, 'soil') },
    check: (w) => ({ done: w.stats.biggestPumpkin >= 4, progress: `Mayor calabaza cosechada: ${w.stats.biggestPumpkin}×${w.stats.biggestPumpkin}`, ratio: Math.min(1, w.stats.biggestPumpkin / 4) }),
    rules: [{ kind: 'contains', pattern: 'push', message: 'Guarda posiciones en un arreglo con push.' }],
    timeTarget: 50,
    starter: GO_TO + '\nconst n = getWorldSize();\nlet pendientes = [];\n// 1. Planta calabazas en todas las casillas y guarda cada posición en pendientes\n// 2. Mientras haya pendientes: ve a cada una; si maduró, quítala de la lista;\n//    si está podrida o vacía, vuelve a plantar\n// 3. Cosecha la calabaza gigante\n',
    hints: [
      'Recorre con dos for y en cada casilla: plant(Entities.Pumpkin); pendientes.push([x, y]);',
      'Usa una lista nueva en cada vuelta: let siguen = []; y al final pendientes = siguen;',
      'Una calabaza podrida es getEntityType() === Entities.DeadPumpkin.',
    ],
    solution:
      GO_TO +
      '\nconst n = getWorldSize();\nlet pendientes = [];\nfor (let x = 0; x < n; x++) {\n  for (let y = 0; y < n; y++) {\n    irA(x, y);\n    plant(Entities.Pumpkin);\n    pendientes.push([x, y]);\n  }\n}\nwhile (pendientes.length > 0) {\n  let siguen = [];\n  for (const [x, y] of pendientes) {\n    irA(x, y);\n    const tipo = getEntityType();\n    if (tipo === Entities.DeadPumpkin || tipo === null) {\n      plant(Entities.Pumpkin);\n      siguen.push([x, y]);\n    } else if (!canHarvest()) {\n      siguen.push([x, y]);\n    }\n  }\n  pendientes = siguen;\n}\nharvest();\n',
  },
  {
    id: 'girasoles',
    title: 'El girasol más grande',
    concept: 'Arreglos: buscar el máximo',
    icon: 'sunny-outline',
    intro:
      'Si hay 10 girasoles o más y cosechas **el que tiene más pétalos**, da 8 veces más energía. `measure()` devuelve los pétalos (un número de 7 a 15).\n\nGuarda cada girasol en un arreglo y ordénalo de mayor a menor:\n```js\nflores.push([measure(), x, y]);\nflores.sort((a, b) => b[0] - a[0]);\n```\nAsí `flores[0]` es el de más pétalos.',
    goal: 'Consigue 40 de energía.',
    world: { size: 4, seed: 'nivel-11', items: { carrot: 120 }, unlocks: { sunflowers: 1 }, fill: fillAll(null, 'soil') },
    check: (w, l) => items(w, 'power', 40, l),
    rules: [{ kind: 'contains', pattern: 'measure', message: 'Mide los pétalos con measure().' }],
    timeTarget: 50,
    starter: GO_TO + '\nconst n = getWorldSize();\n// 1. Planta girasoles en todas las casillas\n// 2. Espera a que maduren y mide cada uno: flores.push([measure(), x, y])\n// 3. Ordena de mayor a menor y cosecha en ese orden (y vuelve a plantar)\n',
    hints: ['Para esperar: while (!canHarvest()) { } antes de medir cada uno.', 'Recorre el arreglo ordenado con for (const [petalos, x, y] of flores).', 'Repite todo con un while hasta tener 40 de energía.'],
    solution:
      GO_TO +
      '\nconst n = getWorldSize();\nfor (let x = 0; x < n; x++) {\n  for (let y = 0; y < n; y++) {\n    irA(x, y);\n    plant(Entities.Sunflower);\n  }\n}\nwhile (numItems(Items.Power) < 40) {\n  let flores = [];\n  for (let x = 0; x < n; x++) {\n    for (let y = 0; y < n; y++) {\n      irA(x, y);\n      while (!canHarvest()) {\n      }\n      flores.push([measure(), x, y]);\n    }\n  }\n  flores.sort((a, b) => b[0] - a[0]);\n  for (const [petalos, x, y] of flores) {\n    irA(x, y);\n    harvest();\n    plant(Entities.Sunflower);\n  }\n}\n',
  },
  {
    id: 'cactus',
    title: 'Cactus ordenados',
    concept: 'Arreglos y ordenamiento',
    icon: 'swap-horizontal-outline',
    intro:
      'Cada cactus tiene un tamaño de 0 a 9 (`measure()`). Si cada uno es menor o igual que su vecino de la derecha y que el de arriba, al cosechar uno **se cosechan todos los ordenados** y rinden n²: ¡16 cactus dan 256!\n\n`swap(East)` intercambia el cactus bajo el dron con el de la derecha. Es el **ordenamiento de burbuja** que se hace con arreglos:\n```js\nif (measure() > measure(East)) {\n  swap(East);\n}\n```',
    goal: 'Consigue 200 cactus.',
    world: { size: 4, seed: 'nivel-12', items: { pumpkin: 80 }, unlocks: { cactus: 1 }, fill: fillAll(null, 'soil') },
    check: (w, l) => items(w, 'cactus', 200, l),
    rules: [{ kind: 'contains', pattern: 'swap', message: 'Ordena con swap().' }],
    timeTarget: 130,
    starter: GO_TO + '\nconst n = getWorldSize();\n// 1. Planta cactus en todas las casillas\n// 2. Ordena cada fila con burbuja: compara measure() con measure(East)\n// 3. Ordena cada columna igual, comparando con measure(North)\n// 4. Cosecha un cactus\n',
    hints: [
      'Para una fila: repite n veces un recorrido de x = 0 a n - 2 comparando y haciendo swap(East).',
      'Las columnas son iguales con y, North y swap(North).',
      'Espera a que maduren antes de cosechar: while (!canHarvest()) { }',
    ],
    solution:
      GO_TO +
      '\nconst n = getWorldSize();\nfor (let x = 0; x < n; x++) {\n  for (let y = 0; y < n; y++) {\n    irA(x, y);\n    plant(Entities.Cactus);\n  }\n}\nfor (let y = 0; y < n; y++) {\n  for (let vuelta = 0; vuelta < n; vuelta++) {\n    for (let x = 0; x < n - 1; x++) {\n      irA(x, y);\n      if (measure() > measure(East)) {\n        swap(East);\n      }\n    }\n  }\n}\nfor (let x = 0; x < n; x++) {\n  for (let vuelta = 0; vuelta < n; vuelta++) {\n    for (let y = 0; y < n - 1; y++) {\n      irA(x, y);\n      if (measure() > measure(North)) {\n        swap(North);\n      }\n    }\n  }\n}\nirA(0, 0);\nwhile (!canHarvest()) {\n}\nharvest();\n',
  },
  {
    id: 'laberinto',
    title: 'El laberinto del tesoro',
    concept: 'Arreglos de direcciones y módulo',
    icon: 'git-merge-outline',
    intro:
      'Usar sustancia extraña sobre un arbusto maduro crea un **laberinto** con un tesoro. Las paredes no dejan pasar: `move()` devuelve `false` si chocas.\n\nUn truco clásico: **sigue la pared con la mano derecha**. Guarda las direcciones en un arreglo y gira con `%`:\n```js\nconst dirs = [North, East, South, West];\nlet d = 0;\nd = (d + 1) % 4;   // girar a la derecha\nd = (d + 3) % 4;   // girar a la izquierda\n```',
    goal: 'Encuentra el tesoro y cosecha el oro.',
    world: { size: 6, seed: 'nivel-13', items: { weird_substance: 5 }, unlocks: { mazes: 1 }, fill: (x, y) => ({ entity: x === 0 && y === 0 ? 'bush' : 'grass', grown: true }) },
    check: (w, l) => ({ done: w.stats.treasures >= 1, progress: w.stats.treasures ? `¡Tesoro encontrado! ${w.items.gold} de ${l('gold')}` : 'Aún no encuentras el tesoro', ratio: w.stats.treasures ? 1 : 0 }),
    rules: [{ kind: 'contains', pattern: '%', message: 'Gira con el operador %.' }],
    timeTarget: 30,
    starter: 'useItem(Items.WeirdSubstance);\nconst dirs = [North, East, South, West];\nlet d = 0;\n// Repite hasta estar sobre el tesoro: intenta girar a la derecha y avanzar;\n// si no puedes, gira a la izquierda\n',
    hints: [
      'La condición del ciclo: while (getEntityType() !== Entities.Treasure).',
      'Primero d = (d + 1) % 4; luego mientras !canMove(dirs[d]) gira a la izquierda: d = (d + 3) % 4;',
      'Cuando puedas: move(dirs[d]); y al terminar el ciclo: harvest();',
    ],
    solution:
      'useItem(Items.WeirdSubstance);\nconst dirs = [North, East, South, West];\nlet d = 0;\nwhile (getEntityType() !== Entities.Treasure) {\n  d = (d + 1) % 4;\n  while (!canMove(dirs[d])) {\n    d = (d + 3) % 4;\n  }\n  move(dirs[d]);\n}\nharvest();\n',
  },
  {
    id: 'policultivo',
    title: 'Policultivo',
    concept: 'Arreglos y desestructuración',
    icon: 'people-outline',
    intro:
      'Cada planta tiene un **compañero** favorito. `getCompanion()` devuelve un arreglo `[tipo, x, y]`: si plantas ese tipo en esa casilla, la cosecha rinde 5 veces más.\n\nLa **desestructuración** saca los valores de un arreglo en variables:\n```js\nconst [tipo, cx, cy] = getCompanion();\n```',
    goal: 'Haz 8 cosechas con compañero.',
    world: { size: 6, seed: 'nivel-14', items: { wood: 50, hay: 50 }, unlocks: { trees: 1, carrots: 1, polyculture: 1 } },
    check: (w) => ({ done: w.stats.companionBonus >= 8, progress: `${w.stats.companionBonus} / 8 cosechas con compañero`, ratio: Math.min(1, w.stats.companionBonus / 8) }),
    rules: [{ kind: 'contains', pattern: 'getCompanion', message: 'Usa getCompanion().' }],
    timeTarget: 60,
    starter: GO_TO + '\n// Planta un arbusto, pregunta por su compañero y plántalo donde lo pide.\n// Luego regresa, espera a que madure y cosecha.\n',
    hints: [
      'Para plantar el compañero en pradera basta plant(tipo), salvo las zanahorias: necesitan tierra (till()).',
      'Si la casilla del compañero ya tiene algo maduro, cosecha antes de plantar.',
      'Repite con un while hasta tener 8 cosechas con compañero.',
    ],
    solution:
      GO_TO +
      '\nlet x = 0;\nwhile (true) {\n  irA(x, 0);\n  if (getEntityType() !== Entities.Grass) {\n    harvest();\n  }\n  plant(Entities.Bush);\n  const [tipo, cx, cy] = getCompanion();\n  irA(cx, cy);\n  if (getEntityType() !== Entities.Grass) {\n    harvest();\n  }\n  if (tipo === Entities.Carrot && getGroundType() !== Grounds.Soil) {\n    till();\n  }\n  if (tipo === Entities.Grass && getGroundType() === Grounds.Soil) {\n    till();\n  }\n  if (tipo !== Entities.Grass) {\n    plant(tipo);\n  }\n  irA(x, 0);\n  while (!canHarvest()) {\n  }\n  harvest();\n  x = (x + 1) % getWorldSize();\n}\n',
  },
  {
    id: 'mis-funciones',
    title: 'Tus propias funciones',
    concept: 'Declarar y llamar funciones',
    icon: 'construct-outline',
    intro:
      'Una **función** agrupa instrucciones con un nombre para usarlas cuantas veces quieras. Se declara una vez y se **llama** escribiendo su nombre con paréntesis:\n```js\nfunction cosecharFila() {\n  // instrucciones…\n}\ncosecharFila();\n```\nTambién puede recibir **parámetros**: `function avanzar(pasos) { … }`.',
    goal: 'Junta 25 de heno.',
    world: { size: 5, seed: 'nivel-funciones' },
    check: (w, label) => items(w, 'hay', 25, label),
    rules: [{ kind: 'contains', pattern: 'function', message: 'Declara una función.' }],
    requires: [{ message: 'Llama a tu función (no basta con declararla).', test: usesOwnFunction }],
    timeTarget: 20,
    starter: '// Completa la función para que coseche una fila completa\nfunction cosecharFila() {\n  \n}\n\n// Llama a tu función una vez por fila (y sube a la siguiente)\n',
    hints: [
      'Dentro de la función: un for que se repita getWorldSize() veces, con harvest() y move(East).',
      'Fuera de la función: otro for que llame a cosecharFila() y después haga move(North).',
    ],
    solution:
      'function cosecharFila() {\n  for (let i = 0; i < getWorldSize(); i++) {\n    harvest();\n    move(East);\n  }\n}\n\nfor (let y = 0; y < getWorldSize(); y++) {\n  cosecharFila();\n  move(North);\n}\n',
  },
  {
    id: 'pedido-objeto',
    title: 'El pedido del cliente',
    concept: 'Objetos (clave: valor) y for…in',
    icon: 'receipt-outline',
    intro:
      'Un **objeto** guarda datos con nombre: cada **clave** tiene un **valor**.\n```js\nconst pedido = { [Entities.Carrot]: 4, [Entities.Bush]: 6 };\npedido[Entities.Carrot]; // 4\n```\nCon `for (const tipo in pedido)` recorres todas sus claves.',
    goal: 'Planta exactamente lo que pide el cliente: 4 zanahorias, 6 arbustos, 3 árboles y 3 girasoles.',
    world: { size: 4, seed: 'nivel-objetos', items: { wood: 200, hay: 200, carrot: 50 }, unlocks: { carrots: 1, trees: 1, sunflowers: 1 }, fill: fillAll(null, 'soil') },
    check: (w) => {
      const want: [EntityId, number][] = [
        ['carrot', 4],
        ['bush', 6],
        ['tree', 3],
        ['sunflower', 3],
      ];
      const ok = want.filter(([e, n]) => w.count(e) === n).length;
      const placed = want.reduce((a, [e, n]) => a + Math.min(n, w.count(e)), 0);
      return { done: ok === want.length, progress: `${placed} / 16 plantas como en el pedido`, ratio: placed / 16 };
    },
    rules: [{ kind: 'contains', pattern: 'pedido', message: 'Usa el objeto pedido.' }],
    requires: [{ message: 'Recorre el objeto con for…in (o Object.keys / Object.entries).', test: (c) => /for\s*\(\s*(const|let|var)\s+[\w$]+\s+in\s+/.test(c) || /Object\.(keys|entries)\s*\(/.test(c) }],
    timeTarget: 25,
    starter:
      '// El pedido: cuántas plantas de cada tipo quiere el cliente\nconst pedido = {\n  [Entities.Carrot]: 4,\n  [Entities.Bush]: 6,\n  [Entities.Tree]: 3,\n  [Entities.Sunflower]: 3,\n};\n\n// Recorre el pedido y planta cada tipo las veces que indica\n',
    hints: [
      'for (const tipo in pedido) { … } te da cada tipo; pedido[tipo] es cuántas plantar.',
      'Después de plantar avanza con move(East); cuando completes la fila sube con move(North).',
      'Lleva la cuenta de la columna en una variable para saber cuándo subir.',
    ],
    solution:
      'const pedido = {\n  [Entities.Carrot]: 4,\n  [Entities.Bush]: 6,\n  [Entities.Tree]: 3,\n  [Entities.Sunflower]: 3,\n};\nlet x = 0;\nfor (const tipo in pedido) {\n  for (let i = 0; i < pedido[tipo]; i++) {\n    plant(tipo);\n    move(East);\n    x++;\n    if (x === getWorldSize()) {\n      x = 0;\n      move(North);\n    }\n  }\n}\n',
  },
  {
    id: 'recursion',
    title: 'Cosecha recursiva',
    concept: 'Recursión',
    icon: 'git-merge-outline',
    intro:
      'Una función **recursiva** se llama a sí misma con un problema más pequeño, hasta llegar a un **caso base** que la detiene:\n```js\nfunction cuentaAtras(n) {\n  if (n === 0) return;   // caso base\n  console.log(n);\n  cuentaAtras(n - 1);    // llamada recursiva\n}\n```',
    goal: 'Cosecha los 6 arbustos de la primera fila (6 de madera) con una función recursiva.',
    world: { size: 6, seed: 'nivel-recursion', fill: (x, y) => ({ ground: 'grassland', entity: y === 0 ? 'bush' : 'grass', grown: true }) },
    check: (w, label) => items(w, 'wood', 6, label),
    requires: [{ message: 'Usa una función que se llame a sí misma.', test: usesRecursion }],
    timeTarget: 10,
    starter: '// cosechar(n): cosecha n casillas hacia el Este, una por llamada\nfunction cosechar(n) {\n  // 1. caso base: si n es 0, termina\n  // 2. cosecha y avanza\n  // 3. llama a cosechar con n - 1\n}\n\ncosechar(6);\n',
    hints: ['El caso base es if (n === 0) return;', 'Después de harvest() y move(East), llama a cosechar(n - 1).'],
    solution: 'function cosechar(n) {\n  if (n === 0) return;\n  harvest();\n  move(East);\n  cosechar(n - 1);\n}\n\ncosechar(6);\n',
  },
  {
    id: 'granja-libre',
    title: 'Granja libre',
    concept: 'Crea tu propia lógica',
    icon: 'construct-outline',
    intro:
      'Aquí no hay objetivo fijo: **empiezas con una granja de 3×3 y solo pasto**, como en el juego original. Junta recursos y compra mejoras con `unlock()` (o desde el panel): ampliar la granja, velocidad, árboles, zanahorias, riego, calabazas, girasoles, cactus, policultivo y laberintos.\n\nTus recursos y mejoras se guardan. Combina todo lo aprendido: funciones, arreglos, ciclos y condicionales.\n```js\nif (numItems(Items.Hay) >= 20) {\n  unlock(Unlocks.Expand);\n}\n```',
    goal: 'Haz crecer tu granja tanto como quieras.',
    world: { size: 3, seed: 'granja-libre' },
    check: (w) => {
      const total = Object.values(w.unlocks).reduce((a, b) => a + b, 0);
      return { done: false, progress: `${total} mejoras compradas`, ratio: Math.min(1, total / 22) };
    },
    sandbox: true,
    starter:
      '// Tu granja. Prueba tu propia lógica: cosecha, planta y compra mejoras.\nconst n = getWorldSize();\nwhile (true) {\n  for (let x = 0; x < n; x++) {\n    for (let y = 0; y < n; y++) {\n      if (canHarvest()) {\n        harvest();\n      }\n      move(North);\n    }\n    move(East);\n  }\n  if (numItems(Items.Hay) >= 20) {\n    unlock(Unlocks.Expand);\n  }\n}\n',
    hints: ['getCost(Unlocks.Expand) dice cuánto cuesta la siguiente mejora.', 'numUnlocked(Unlocks.Speed) dice cuántas mejoras de velocidad tienes.'],
    solution: 'for (let i = 0; i < 20; i++) {\n  harvest();\n  move(North);\n}\nunlock(Unlocks.Expand);\n',
  },
];


// ───────────────────────────── modo hackeo ─────────────────────────────

const destroyedCrops = (w: World) => Object.entries(w.stats.destroyed).filter(([k]) => k !== 'grass').reduce((a, [, n]) => a + (n ?? 0), 0);

/** Pide que el programa del alumno haya terminado antes de dar la misión por buena. */
const atEnd = (finished: boolean, ok: boolean, progress: string, failed?: string): LevelCheck =>
  ok && finished ? { done: true, progress, ratio: 1 } : { done: false, progress, ratio: ok ? 0.9 : 0, failed: finished && !ok ? failed : undefined };

const STORY = '🚨 **¡Un dron intruso entró a tu granja y está destruyendo lo que construiste!** ';

export const HACK_MISSIONS: GameLevel[] = [
  {
    id: 'hack-condicion',
    kind: 'hack',
    task: 'completar',
    patch: true,
    title: 'Conexión al intruso',
    concept: 'Condicionales: completar',
    icon: 'shield-half-outline',
    intro:
      STORY +
      'Lograste conectarte a su sistema: el código del editor es **su programa**. Recorre la fila y cosecha todo lo que encuentra, incluidas tus zanahorias.\n\nCompleta la condición del `if` para que **solo coseche lo que no sea zanahoria**:\n```js\nif (getEntityType() !== Entities.Carrot) { ... }\n```',
    goal: 'El intruso termina su recorrido sin destruir ninguna zanahoria.',
    world: {
      size: 4,
      seed: 'hack-1',
      unlocks: { carrots: 1 },
      intruder: { x: 0, y: 0 },
      hideMain: true,
      intruderParallel: false,
      fill: (x, y) => (y === 0 && x % 2 === 1 ? { ground: 'soil', entity: 'carrot', grown: true } : { entity: 'grass', grown: true }),
    },
    check: (w, _l, { finished }) => {
      const carrots = w.stats.destroyed.carrot ?? 0;
      return atEnd(finished, carrots === 0 && (w.stats.destroyed.grass ?? 0) >= 2, carrots ? `Destruyó ${carrots} zanahoria(s)` : 'Ninguna zanahoria destruida', 'El intruso destruyó tus zanahorias: revisa la condición.');
    },
    rules: [{ kind: 'contains', pattern: '!==', message: 'Usa el operador !== (distinto).' }],
    starter:
      '// 🔓 Sistema del dron intruso\n// Recorre la fila y cosecha TODO. Completa la condición\n// para que NO coseche las zanahorias.\nfor (let i = 0; i < 8; i++) {\n  if (getEntityType() /* ??? */) {\n    harvest();\n  }\n  move(East);\n}\n',
    hints: ['Compara getEntityType() con Entities.Carrot.', 'El operador «distinto de» es !==.'],
    solution: 'for (let i = 0; i < 8; i++) {\n  if (getEntityType() !== Entities.Carrot) {\n    harvest();\n  }\n  move(East);\n}\n',
  },
  {
    id: 'hack-bucle',
    kind: 'hack',
    task: 'corregir',
    patch: true,
    title: 'Bucle sin fin',
    concept: 'Ciclos: corregir',
    icon: 'infinite-outline',
    intro:
      STORY +
      'Su programa tiene un `while (true)`: **nunca se detiene** y cosecha las plantas aunque no estén maduras (se pierden).\n\nCorrige su código:\n1. Que el ciclo termine después de **6 vueltas** (usa la variable `vueltas`).\n2. Que **solo coseche lo que ya maduró** (`canHarvest()`).',
    goal: 'El programa del intruso termina y no pierde ninguna planta.',
    world: {
      size: 4,
      seed: 'hack-2',
      intruder: { x: 0, y: 0 },
      hideMain: true,
      intruderParallel: false,
      fill: (x, y) => ({ entity: 'bush', grown: (x + y) % 2 === 0 }),
    },
    check: (w, _l, { finished }) =>
      atEnd(finished, w.stats.wasted === 0 && (w.stats.destroyed.bush ?? 0) >= 1, w.stats.wasted ? `Se perdieron ${w.stats.wasted} planta(s)` : finished ? 'Terminó sin perder plantas' : 'El intruso sigue trabajando…', w.stats.wasted ? 'Se perdieron plantas: cosecha solo si canHarvest().' : 'El intruso no cosechó nada.'),
    rules: [
      { kind: 'contains', pattern: 'canHarvest', message: 'Revisa con canHarvest().' },
      { kind: 'notContains', pattern: 'true', message: 'Sin while (true).' },
    ],
    starter: '// 🔓 Sistema del dron intruso (con errores)\nlet vueltas = 0;\nwhile (true) {\n  harvest();\n  move(North);\n  vueltas++;\n}\n',
    hints: ['Cambia true por una comparación con vueltas.', 'Pon harvest() dentro de un if (canHarvest()) { ... }.'],
    solution: 'let vueltas = 0;\nwhile (vueltas < 6) {\n  if (canHarvest()) {\n    harvest();\n  }\n  move(North);\n  vueltas++;\n}\n',
  },
  {
    id: 'hack-tipos',
    kind: 'hack',
    task: 'corregir',
    patch: true,
    title: '¿Texto o número?',
    concept: 'Tipos de datos: corregir',
    icon: 'text-outline',
    intro:
      STORY +
      'El intruso recibe sus órdenes como **texto**: `const modo = "3";`. El modo 3 es «proteger» (regar los árboles), pero compara con un **número** (`modo === 3`), así que nunca entra y se pone a destruir.\n\n`"3" === 3` es `false` porque son tipos distintos. Corrige la comparación: convierte el texto con `Number(modo)` o compara con `"3"`.',
    goal: 'El intruso riega los 4 árboles sin destruir ninguno.',
    world: {
      size: 4,
      seed: 'hack-3',
      items: { water: 10 },
      unlocks: { trees: 1, watering: 1 },
      intruder: { x: 0, y: 0 },
      hideMain: true,
      intruderParallel: false,
      fill: (x, y) => ({ entity: y === 0 ? 'tree' : 'grass', grown: true }),
    },
    check: (w, _l, { finished }) => {
      const watered = w.allCells().filter(([x, y]) => w.cells[x][y].water > 0).length;
      const lost = destroyedCrops(w);
      return atEnd(finished, lost === 0 && watered >= 4, `${watered} / 4 árboles regados${lost ? ` · destruyó ${lost}` : ''}`, 'El intruso entró al modo destruir: revisa el tipo de dato de modo.');
    },
    rules: [{ kind: 'contains', pattern: 'modo', message: 'Corrige la comparación de modo.' }],
    starter:
      '// 🔓 Sistema del dron intruso\nconst modo = "3"; // la central manda el modo como TEXTO (3 = proteger)\nif (modo === 3) {\n  for (let i = 0; i < 4; i++) {\n    useItem(Items.Water);\n    move(East);\n  }\n} else {\n  for (let i = 0; i < 4; i++) {\n    harvest();\n    move(East);\n  }\n}\n',
    hints: ['typeof modo es "string" y typeof 3 es "number".', 'Prueba con Number(modo) === 3.'],
    solution: 'const modo = "3";\nif (Number(modo) === 3) {\n  for (let i = 0; i < 4; i++) {\n    useItem(Items.Water);\n    move(East);\n  }\n} else {\n  for (let i = 0; i < 4; i++) {\n    harvest();\n    move(East);\n  }\n}\n',
  },
  {
    id: 'hack-operadores',
    kind: 'hack',
    task: 'completar',
    patch: true,
    title: 'Patrón de ataque',
    concept: 'Operadores: completar',
    icon: 'calculator-outline',
    intro:
      STORY +
      'Tu granja es un tablero: árboles en las casillas pares y arbustos en las impares. Reprograma al intruso para que **pode solo los arbustos** (y los vuelva a plantar), sin tocar los árboles.\n\nUna casilla es impar si `(x + y) % 2 === 1`.',
    goal: 'El intruso poda los 18 arbustos sin tocar ningún árbol.',
    world: {
      size: 6,
      seed: 'hack-4',
      unlocks: { trees: 1 },
      intruder: { x: 0, y: 0 },
      hideMain: true,
      intruderParallel: false,
      fill: (x, y) => ({ entity: (x + y) % 2 === 0 ? 'tree' : 'bush', grown: true }),
    },
    check: (w, _l, { finished }) => {
      const trees = w.stats.destroyed.tree ?? 0;
      const bushes = w.stats.destroyed.bush ?? 0;
      return atEnd(finished, trees === 0 && bushes >= 18, `${bushes} / 18 arbustos podados${trees ? ` · tocó ${trees} árbol(es)` : ''}`, trees ? 'El intruso tocó árboles: revisa la operación.' : 'Faltaron arbustos por podar.');
    },
    rules: [{ kind: 'contains', pattern: '%', message: 'Usa el operador %.' }],
    starter:
      '// 🔓 Sistema del dron intruso\nconst n = getWorldSize();\nfor (let x = 0; x < n; x++) {\n  for (let y = 0; y < n; y++) {\n    if (/* ??? */) {\n      harvest();\n      plant(Entities.Bush);\n    }\n    move(North);\n  }\n  move(East);\n}\n',
    hints: ['x y y son la posición del dron en cada vuelta.', 'Suma x + y y calcula el residuo entre 2.'],
    solution: 'const n = getWorldSize();\nfor (let x = 0; x < n; x++) {\n  for (let y = 0; y < n; y++) {\n    if ((x + y) % 2 === 1) {\n      harvest();\n      plant(Entities.Bush);\n    }\n    move(North);\n  }\n  move(East);\n}\n',
  },
  {
    id: 'hack-lista',
    kind: 'hack',
    task: 'completar',
    patch: true,
    title: 'Lista de objetivos',
    concept: 'Arreglos: filtrar',
    icon: 'filter-outline',
    intro:
      STORY +
      'La central le mandó al intruso un **arreglo** con las casillas que debe destruir, pero tres son tus zanahorias (`protegidas`).\n\nCompleta el `filter` para quedarte solo con los objetivos que **no** están protegidos:\n```js\nprotegidas.some(([px, py]) => px === x && py === y)\n```\ndevuelve `true` si (x, y) está en la lista de protegidas.',
    goal: 'El intruso ataca sus objetivos sin destruir tus zanahorias.',
    world: {
      size: 4,
      seed: 'hack-5',
      unlocks: { carrots: 1 },
      intruder: { x: 0, y: 0 },
      hideMain: true,
      intruderParallel: false,
      fill: (x, y) => ((x === 1 && y === 2) || (x === 3 && y === 3) || (x === 2 && y === 2) ? { ground: 'soil', entity: 'carrot', grown: true } : { entity: 'grass', grown: true }),
    },
    check: (w, _l, { finished }) => {
      const carrots = w.stats.destroyed.carrot ?? 0;
      const hits = Object.values(w.stats.destroyed).reduce((a, n) => a + (n ?? 0), 0);
      return atEnd(finished, carrots === 0 && hits >= 3, `${hits - carrots} objetivo(s) atacado(s)${carrots ? ` · destruyó ${carrots} zanahoria(s)` : ''}`, carrots ? 'Destruyó tus zanahorias: revisa el filtro.' : 'El intruso no atacó sus objetivos.');
    },
    rules: [{ kind: 'contains', pattern: 'protegidas', message: 'Usa el arreglo protegidas en el filtro.' }],
    starter:
      GO_TO +
      '\n// 🔓 Sistema del dron intruso\nconst objetivos = [[0, 0], [1, 2], [2, 1], [3, 3], [0, 3], [2, 2]];\nconst protegidas = [[1, 2], [3, 3], [2, 2]];\nconst seguros = objetivos.filter(([x, y]) => /* ??? */);\nfor (const [x, y] of seguros) {\n  irA(x, y);\n  harvest();\n}\n',
    hints: ['El filtro debe devolver true para lo que SÍ se ataca.', 'Niega el some con !: !protegidas.some(...)'],
    solution:
      GO_TO +
      '\nconst objetivos = [[0, 0], [1, 2], [2, 1], [3, 3], [0, 3], [2, 2]];\nconst protegidas = [[1, 2], [3, 3], [2, 2]];\nconst seguros = objetivos.filter(([x, y]) => !protegidas.some(([px, py]) => px === x && py === y));\nfor (const [x, y] of seguros) {\n  irA(x, y);\n  harvest();\n}\n',
  },
  {
    id: 'hack-defensa',
    kind: 'hack',
    task: 'instrucciones',
    intruderCode:
      '// Programa del dron intruso: recorre la granja arrancando arbustos\nfor (let ronda = 0; ronda < 2; ronda++) {\n  for (let i = 0; i < 16; i++) {\n    harvest();\n    move(North);\n    if (getPosY() === 0) {\n      move(East);\n    }\n  }\n}\n',
    intruderEvery: 1,
    title: 'Defiende tu cosecha',
    concept: 'Ciclos y condicionales: instrucciones',
    icon: 'shield-checkmark-outline',
    intro:
      STORY +
      'Esta vez no puedes entrar a su sistema, pero **puedes leer su programa** (abajo). Mientras él arranca arbustos, programa a **tu dron** para que recorra la granja y **vuelva a plantar** donde falte un arbusto.\n\nEl intruso hace una acción cada vez que tu dron hace una.',
    goal: 'Cuando el intruso termine, quedan al menos 10 arbustos.',
    world: { size: 4, seed: 'hack-6', intruder: { x: 2, y: 2 }, fill: () => ({ entity: 'bush', grown: true }) },
    check: (w) => {
      const n = w.count('bush');
      if (!w.intruder?.done) return { done: false, progress: `${n} arbustos en pie · el intruso sigue atacando`, ratio: Math.min(1, n / 10) };
      return n >= 10 ? { done: true, progress: `${n} arbustos en pie`, ratio: 1 } : { done: false, progress: `${n} arbustos en pie`, ratio: n / 10, failed: `El intruso terminó y solo quedan ${n} arbustos. Haz que tu dron replante más rápido.` };
    },
    rules: [{ kind: 'contains', pattern: 'if', message: 'Decide con if dónde plantar.' }],
    starter: '// Programa de TU dron: recorre la granja y replanta los arbustos que falten\nwhile (true) {\n  \n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
    hints: ['Si getEntityType() no es Entities.Bush, planta un arbusto.', 'plant(Entities.Bush) funciona aunque haya pasto.'],
    solution: 'while (true) {\n  if (getEntityType() !== Entities.Bush) {\n    plant(Entities.Bush);\n  }\n  move(North);\n  if (getPosY() === 0) {\n    move(East);\n  }\n}\n',
  },
  {
    id: 'hack-rastreo',
    kind: 'hack',
    task: 'instrucciones',
    intruderCode:
      '// Programa del dron intruso: sigue una ruta destruyendo todo\nconst ruta = [East, East, North, West, North, East, South, South];\nlet i = 0;\nwhile (true) {\n  harvest();\n  move(ruta[i % ruta.length]);\n  i++;\n}\n',
    intruderEvery: 2,
    title: 'Rastrea al intruso',
    concept: 'Arreglos y ciclos: instrucciones',
    icon: 'locate-outline',
    intro:
      STORY +
      'Para hackearlo necesitas estar **en su casilla o junto a él** y llamar `hack()`. `getIntruderPos()` devuelve su posición en un arreglo `[x, y]`:\n```js\nconst [ix, iy] = getIntruderPos();\n```\nEn cada vuelta: si ya lo alcanzaste, hackéalo; si no, da **un paso** hacia él (se sigue moviendo).',
    goal: 'Alcanza al dron intruso y hackéalo.',
    world: { size: 6, seed: 'hack-7', unlocks: { trees: 1 }, intruder: { x: 4, y: 4 }, fill: (x, y) => ({ entity: (x + y) % 3 === 0 ? 'tree' : 'bush', grown: true }) },
    check: (w) => ({ done: !!w.intruder?.hacked, progress: w.intruder?.hacked ? '¡Intruso hackeado!' : `El intruso está en (${w.intruder?.x}, ${w.intruder?.y})`, ratio: w.intruder?.hacked ? 1 : 0 }),
    rules: [{ kind: 'contains', pattern: 'getIntruderPos', message: 'Rastréalo con getIntruderPos().' }],
    starter: '// Programa de TU dron: alcanza al intruso y hackéalo\nwhile (true) {\n  const [ix, iy] = getIntruderPos();\n  // ¿Ya estás en su casilla? → hack();\n  // Si no, da un paso hacia él (primero en x, luego en y)\n}\n',
    hints: ['Compara getPosX() con ix: si es menor, move(East); si es mayor, move(West).', 'Cuando las x sean iguales, haz lo mismo con y (North / South).', 'Cuando estés en (ix, iy), llama hack().'],
    solution:
      'while (true) {\n  const [ix, iy] = getIntruderPos();\n  if (getPosX() === ix && getPosY() === iy) {\n    hack();\n  } else if (getPosX() !== ix) {\n    move(getPosX() < ix ? East : West);\n  } else {\n    move(getPosY() < iy ? North : South);\n  }\n}\n',
  },
  {
    id: 'hack-apagado',
    kind: 'hack',
    task: 'instrucciones',
    intruderCode:
      '// Programa del dron intruso: arranca lo que encuentra, sin parar\nwhile (true) {\n  harvest();\n  move(West);\n  if (getPosX() === 0) {\n    move(South);\n  }\n}\n',
    intruderEvery: 3,
    title: 'Código de apagado',
    concept: 'Texto, ciclos y operadores',
    icon: 'power-outline',
    intro:
      STORY +
      'Descubriste que el intruso se apaga con un código: **la suma de los dígitos de su número de serie**. `getSerial()` devuelve un **texto** como `"DR-4821-X7"` (código 4+8+2+1+7 = 22).\n\nRecorre el texto con un ciclo, quédate solo con los dígitos, conviértelos con `Number()` y súmalos. Luego llama `shutdown(suma)`.\n```js\nfor (const c of serie) { ... }\nif (c >= "0" && c <= "9") { ... }\n```',
    goal: 'Apaga al dron intruso con el código correcto.',
    world: { size: 5, seed: 'hack-8', intruder: { x: 4, y: 4 }, fill: () => ({ entity: 'bush', grown: true }) },
    check: (w) => ({ done: !!w.intruder?.shutdown, progress: w.intruder?.shutdown ? '¡Intruso apagado!' : 'El intruso sigue encendido', ratio: w.intruder?.shutdown ? 1 : 0 }),
    rules: [
      { kind: 'contains', pattern: 'for', message: 'Recorre el texto con un ciclo.' },
      { kind: 'contains', pattern: 'Number', message: 'Convierte cada dígito con Number().' },
    ],
    starter: '// Programa de TU dron: calcula el código de apagado\nconst serie = getSerial();\nconsole.log("Número de serie:", serie);\nlet suma = 0;\n// Suma los dígitos de serie\n\nshutdown(suma);\n',
    hints: ['for (const c of serie) recorre cada carácter del texto.', 'Un carácter es dígito si c >= "0" && c <= "9".', 'suma += Number(c);'],
    solution: 'const serie = getSerial();\nlet suma = 0;\nfor (const c of serie) {\n  if (c >= "0" && c <= "9") {\n    suma += Number(c);\n  }\n}\nshutdown(suma);\n',
  },
];

/** Niveles de construcción y misiones de hackeo. */
export const ALL_LEVELS: GameLevel[] = [...LEVELS, ...HACK_MISSIONS];

export const ALL_GAME_UNLOCKS = ALL_UNLOCKS;

export function getLevel(id: string): GameLevel {
  return ALL_LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}
