/**
 * Funciones y constantes que el programa del alumno usa para controlar el dron.
 * Los nombres siguen al juego original (move, harvest, can_harvest…) en camelCase de
 * JavaScript. El tema cambia los nombres de las constantes (Entities.Carrot ↔
 * Entities.Copper) y lo que se ve, pero las mecánicas son las mismas; en cualquier tema
 * se aceptan los nombres de ambos.
 */
import { makeGenNative } from '../interpreter/interpreter';
import type { InterpEvent } from '../interpreter/interpreter';
import { Dir, DIRS, EntityId, GroundId, ItemId, UNLOCKS, UnlockId, World } from './world';

export type GameTheme = 'farm' | 'mine';

interface ThemeNames {
  title: string;
  drone: string;
  entityKey: Record<EntityId, string>;
  itemKey: Record<ItemId, string>;
  groundKey: Record<GroundId, string>;
  unlockKey: Record<UnlockId, string>;
  /** Nombres en español para la interfaz. */
  entityLabel: Record<EntityId, string>;
  itemLabel: Record<ItemId, string>;
  groundLabel: Record<GroundId, string>;
  unlockLabel: Record<UnlockId, string>;
  entityEmoji: Record<EntityId, string>;
  itemEmoji: Record<ItemId, string>;
}

export const THEMES: Record<GameTheme, ThemeNames> = {
  farm: {
    title: 'Granja',
    drone: 'dron granjero',
    entityKey: { grass: 'Grass', bush: 'Bush', tree: 'Tree', carrot: 'Carrot', pumpkin: 'Pumpkin', dead_pumpkin: 'DeadPumpkin', sunflower: 'Sunflower', cactus: 'Cactus', hedge: 'Hedge', treasure: 'Treasure' },
    itemKey: { hay: 'Hay', wood: 'Wood', carrot: 'Carrot', pumpkin: 'Pumpkin', power: 'Power', cactus: 'Cactus', gold: 'Gold', water: 'Water', fertilizer: 'Fertilizer', weird_substance: 'WeirdSubstance' },
    groundKey: { grassland: 'Grassland', soil: 'Soil' },
    unlockKey: { expand: 'Expand', speed: 'Speed', trees: 'Trees', carrots: 'Carrots', watering: 'Watering', pumpkins: 'Pumpkins', sunflowers: 'Sunflowers', fertilizer: 'Fertilizer', cactus: 'Cactus', polyculture: 'Polyculture', mazes: 'Mazes' },
    entityLabel: { grass: 'Pasto', bush: 'Arbusto', tree: 'Árbol', carrot: 'Zanahoria', pumpkin: 'Calabaza', dead_pumpkin: 'Calabaza podrida', sunflower: 'Girasol', cactus: 'Cactus', hedge: 'Seto', treasure: 'Tesoro' },
    itemLabel: { hay: 'Heno', wood: 'Madera', carrot: 'Zanahorias', pumpkin: 'Calabazas', power: 'Energía', cactus: 'Cactus', gold: 'Oro', water: 'Agua', fertilizer: 'Fertilizante', weird_substance: 'Sustancia extraña' },
    groundLabel: { grassland: 'Pradera', soil: 'Tierra arada' },
    unlockLabel: { expand: 'Ampliar granja', speed: 'Velocidad', trees: 'Árboles', carrots: 'Zanahorias', watering: 'Riego', pumpkins: 'Calabazas', sunflowers: 'Girasoles', fertilizer: 'Fertilizante', cactus: 'Cactus', polyculture: 'Policultivo', mazes: 'Laberintos' },
    entityEmoji: { grass: '🌱', bush: '🌿', tree: '🌳', carrot: '🥕', pumpkin: '🎃', dead_pumpkin: '🥀', sunflower: '🌻', cactus: '🌵', hedge: '🌲', treasure: '💰' },
    itemEmoji: { hay: '🌾', wood: '🪵', carrot: '🥕', pumpkin: '🎃', power: '⚡', cactus: '🌵', gold: '🪙', water: '💧', fertilizer: '🧪', weird_substance: '🟣' },
  },
  mine: {
    title: 'Minería',
    drone: 'dron minero',
    entityKey: { grass: 'Stone', bush: 'Coal', tree: 'Iron', carrot: 'Copper', pumpkin: 'Geode', dead_pumpkin: 'BrokenGeode', sunflower: 'Crystal', cactus: 'Gem', hedge: 'Tunnel', treasure: 'Treasure' },
    itemKey: { hay: 'Gravel', wood: 'Coal', carrot: 'Copper', pumpkin: 'Geode', power: 'Energy', cactus: 'Gem', gold: 'Gold', water: 'Water', fertilizer: 'Catalyst', weird_substance: 'WeirdSubstance' },
    groundKey: { grassland: 'Rock', soil: 'Drilled' },
    unlockKey: { expand: 'Expand', speed: 'Speed', trees: 'Iron', carrots: 'Copper', watering: 'Cooling', pumpkins: 'Geodes', sunflowers: 'Crystals', fertilizer: 'Catalyst', cactus: 'Gems', polyculture: 'Alloys', mazes: 'Tunnels' },
    entityLabel: { grass: 'Piedra', bush: 'Carbón', tree: 'Hierro', carrot: 'Cobre', pumpkin: 'Geoda', dead_pumpkin: 'Geoda rota', sunflower: 'Cristal de energía', cactus: 'Gema', hedge: 'Túnel', treasure: 'Tesoro' },
    itemLabel: { hay: 'Grava', wood: 'Carbón', carrot: 'Cobre', pumpkin: 'Geodas', power: 'Energía', cactus: 'Gemas', gold: 'Oro', water: 'Refrigerante', fertilizer: 'Catalizador', weird_substance: 'Sustancia extraña' },
    groundLabel: { grassland: 'Roca', soil: 'Roca perforada' },
    unlockLabel: { expand: 'Ampliar mina', speed: 'Velocidad', trees: 'Hierro', carrots: 'Cobre', watering: 'Refrigeración', pumpkins: 'Geodas', sunflowers: 'Cristales', fertilizer: 'Catalizador', cactus: 'Gemas', polyculture: 'Aleaciones', mazes: 'Túneles' },
    entityEmoji: { grass: '🪨', bush: '⚫', tree: '🔩', carrot: '🟠', pumpkin: '🔮', dead_pumpkin: '💔', sunflower: '💎', cactus: '💠', hedge: '🧱', treasure: '💰' },
    itemEmoji: { hay: '🪨', wood: '⚫', carrot: '🟠', pumpkin: '🔮', power: '⚡', cactus: '💠', gold: '🪙', water: '❄️', fertilizer: '🧪', weird_substance: '🟣' },
  },
};

const invert = <K extends string>(m: Record<K, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, K>;

/** Cambia en un texto los nombres de las constantes al tema elegido (Entities.Carrot → Entities.Copper). */
export function themed(text: string, theme: GameTheme): string {
  if (theme === 'farm') return text;
  const f = THEMES.farm;
  const t = THEMES[theme];
  return text
    .replace(/Entities\.(\w+)/g, (m, k) => (invert(f.entityKey)[k] ? `Entities.${t.entityKey[invert(f.entityKey)[k]]}` : m))
    .replace(/Items\.(\w+)/g, (m, k) => (invert(f.itemKey)[k] ? `Items.${t.itemKey[invert(f.itemKey)[k]]}` : m))
    .replace(/Grounds\.(\w+)/g, (m, k) => (invert(f.groundKey)[k] ? `Grounds.${t.groundKey[invert(f.groundKey)[k]]}` : m))
    .replace(/Unlocks\.(\w+)/g, (m, k) => (invert(f.unlockKey)[k] ? `Unlocks.${t.unlockKey[invert(f.unlockKey)[k]]}` : m))
    // la historia: «tu granja» → «tu mina»
    .replace(/\bgranja\b/g, 'mina')
    .replace(/\bGranja\b/g, 'Mina');
}

export interface GameApiOptions {
  theme: GameTheme;
  /** Milisegundos de pausa después de cada acción (0 = sin animación). */
  delay(): number;
  /** Avisos del dron para la consola. */
  log(text: string): void;
  /** Después de cada acción (para revisar si se cumplió el objetivo). */
  /** Después de cada acción del dron (`name`: move, harvest, plant…; `ok`: si hizo algo). */
  onAction?(name: string, ok: boolean): void;
  /** A quién controla el programa: tu dron (por defecto) o el dron intruso hackeado. */
  actor?: 'main' | 'intruder';
}

/** Documentación de cada función (para el panel de ayuda). */
export type DocGroup = 'Acciones' | 'Sensores' | 'Granja libre' | 'Hackeo';

export const API_DOCS: { name: string; sig: string; doc: string; group: DocGroup }[] = [
  { name: 'move', sig: 'move(North | East | South | West)', doc: 'Mueve el dron una casilla. Al salir por un borde aparece del otro lado. Devuelve true si se movió.', group: 'Acciones' },
  { name: 'harvest', sig: 'harvest()', doc: 'Cosecha lo que hay bajo el dron. Si aún no está maduro, se pierde.', group: 'Acciones' },
  { name: 'plant', sig: 'plant(Entities.Bush)', doc: 'Planta en la casilla actual. Algunas plantas cuestan recursos y necesitan tierra arada.', group: 'Acciones' },
  { name: 'till', sig: 'till()', doc: 'Cambia el suelo: pradera ↔ tierra arada.', group: 'Acciones' },
  { name: 'useItem', sig: 'useItem(Items.Water, cantidad?)', doc: 'Usa un objeto en la casilla: agua (acelera el crecimiento), fertilizante o sustancia extraña (laberinto).', group: 'Acciones' },
  { name: 'swap', sig: 'swap(East)', doc: 'Intercambia lo que hay bajo el dron con la casilla vecina (no cruza los bordes).', group: 'Acciones' },
  { name: 'clear', sig: 'clear()', doc: 'Deja la granja como al inicio y regresa el dron a (0, 0).', group: 'Acciones' },
  { name: 'doAFlip', sig: 'doAFlip()', doc: 'El dron da una voltereta. No sirve para nada, pero es divertido.', group: 'Acciones' },
  { name: 'canHarvest', sig: 'canHarvest()', doc: 'true si lo que hay bajo el dron ya maduró.', group: 'Sensores' },
  { name: 'getEntityType', sig: 'getEntityType()', doc: 'Qué hay bajo el dron (por ejemplo Entities.Carrot) o null si está vacío.', group: 'Sensores' },
  { name: 'getGroundType', sig: 'getGroundType()', doc: 'Tipo de suelo bajo el dron (Grounds.Grassland o Grounds.Soil).', group: 'Sensores' },
  { name: 'getPosX', sig: 'getPosX()', doc: 'Columna del dron (0 a getWorldSize() - 1).', group: 'Sensores' },
  { name: 'getPosY', sig: 'getPosY()', doc: 'Fila del dron (0 abajo).', group: 'Sensores' },
  { name: 'getWorldSize', sig: 'getWorldSize()', doc: 'Lado de la granja (es cuadrada).', group: 'Sensores' },
  { name: 'numItems', sig: 'numItems(Items.Hay)', doc: 'Cuántos tienes de un recurso.', group: 'Sensores' },
  { name: 'getWater', sig: 'getWater()', doc: 'Nivel de agua de la casilla (0 a 1).', group: 'Sensores' },
  { name: 'measure', sig: 'measure(dirección?)', doc: 'Pétalos de un girasol, tamaño de un cactus o id de una calabaza. En un laberinto devuelve [x, y] del tesoro.', group: 'Sensores' },
  { name: 'canMove', sig: 'canMove(North)', doc: 'false si una pared del laberinto impide moverse en esa dirección.', group: 'Sensores' },
  { name: 'getCompanion', sig: 'getCompanion()', doc: 'Compañero que pide la planta: [tipo, x, y], o null.', group: 'Sensores' },
  { name: 'getTime', sig: 'getTime()', doc: 'Segundos de juego transcurridos.', group: 'Sensores' },
  { name: 'getTickCount', sig: 'getTickCount()', doc: 'Operaciones ejecutadas (cada instrucción cuesta 1 y cada acción 200).', group: 'Sensores' },
  { name: 'unlock', sig: 'unlock(Unlocks.Expand)', doc: 'Compra una mejora con tus recursos. Devuelve true si se pudo.', group: 'Granja libre' },
  { name: 'numUnlocked', sig: 'numUnlocked(Unlocks.Speed)', doc: 'Cuántas veces se ha comprado una mejora.', group: 'Granja libre' },
  { name: 'getCost', sig: 'getCost(Unlocks.Speed)', doc: 'Costo de la siguiente mejora, por ejemplo { Hay: 30 }, o null si ya está al máximo.', group: 'Granja libre' },
  { name: 'getIntruderPos', sig: 'getIntruderPos()', doc: 'Posición del dron intruso: [x, y].', group: 'Hackeo' },
  { name: 'hack', sig: 'hack()', doc: 'Hackea al dron intruso si estás en su casilla o en una vecina. Devuelve true si lo lograste.', group: 'Hackeo' },
  { name: 'getSerial', sig: 'getSerial()', doc: 'Número de serie del intruso (un texto, por ejemplo "DR-4821-X7").', group: 'Hackeo' },
  { name: 'shutdown', sig: 'shutdown(codigo)', doc: 'Apaga al intruso si el código (un número) es correcto.', group: 'Hackeo' },
];

/** Nombres predefinidos que el analizador del editor debe reconocer. */
export const GAME_GLOBAL_NAMES = new Set<string>([...API_DOCS.map((d) => d.name), ...DIRS, 'Entities', 'Items', 'Grounds', 'Unlocks']);

/** Construye las variables globales del juego para el intérprete. */
export function gameGlobals(world: World, opts: GameApiOptions): Record<string, any> {
  const names = THEMES[opts.theme];
  // valores visibles (según el tema) y aceptación de los nombres de cualquier tema
  const enumOf = <K extends string>(key: (t: ThemeNames) => Record<K, string>): { obj: Record<string, string>; toId: Map<string, K>; toValue: (k: K) => string } => {
    const obj: Record<string, string> = {};
    const toId = new Map<string, K>();
    const own = key(names);
    for (const t of Object.values(THEMES)) for (const [id, k] of Object.entries(key(t)) as [K, string][]) obj[k] = own[id];
    for (const [id, v] of Object.entries(own) as [K, string][]) toId.set(v, id);
    return { obj: Object.freeze(obj), toId, toValue: (k: K) => own[k] };
  };
  const E = enumOf((t) => t.entityKey);
  const I = enumOf((t) => t.itemKey);
  const G = enumOf((t) => t.groundKey);
  const U = enumOf((t) => t.unlockKey);

  const dir = (v: any, fn: string): Dir => {
    if (!DIRS.includes(v)) throw new TypeError(`${fn}() necesita una dirección: North, East, South o West`);
    return v;
  };
  const pick = <K extends string>(e: { toId: Map<string, K> }, v: any, fn: string, kind: string): K => {
    const id = e.toId.get(v);
    if (!id) throw new TypeError(`${fn}() necesita ${kind}${typeof v === 'string' ? ` (recibió "${v}")` : ''}`);
    return id;
  };
  const flush = () => {
    for (const w of world.takeWarnings()) opts.log(w);
  };
  // el programa controla a tu dron o, en las misiones de hackeo, al dron intruso
  const as = <T,>(f: () => T): T => (opts.actor === 'intruder' ? world.withIntruder(f) : f());
  /** Acción del dron: se ejecuta, avisa y (si hay animación) espera. */
  const act = (name: string, run: (args: any[]) => any) =>
    makeGenNative(name, function* (args): Generator<InterpEvent, any, any> {
      const result = as(() => run(args));
      flush();
      opts.onAction?.(name, result !== false);
      const ms = opts.delay();
      if (ms > 0) yield { type: 'wait', ms, quiet: true };
      return result;
    });
  const sense = <T,>(fn: (...args: any[]) => T) => (...args: any[]) => {
    const r = as(() => fn(...args));
    flush();
    return r;
  };

  return {
    North: 'North',
    East: 'East',
    South: 'South',
    West: 'West',
    Entities: E.obj,
    Items: I.obj,
    Grounds: G.obj,
    Unlocks: U.obj,
    move: act('move', ([d]) => world.move(dir(d, 'move'))),
    harvest: act('harvest', () => world.harvest()),
    plant: act('plant', ([e]) => world.plant(pick(E, e, 'plant', 'una planta, por ejemplo Entities.Bush'))),
    till: act('till', () => world.till()),
    swap: act('swap', ([d]) => world.swap(dir(d, 'swap'))),
    useItem: act('useItem', ([it, n]) => world.useItem(pick(I, it, 'useItem', 'un objeto, por ejemplo Items.Water'), n === undefined ? 1 : Number(n))),
    clear: act('clear', () => world.clear()),
    doAFlip: act('doAFlip', () => {
      world.addOps(200);
      world.sync();
      return undefined;
    }),
    canHarvest: sense(() => world.canHarvest()),
    canMove: sense((d: any) => world.canMove(dir(d, 'canMove'))),
    getEntityType: sense(() => {
      const t = world.getEntityType();
      return t === null ? null : E.toValue(t);
    }),
    getGroundType: sense(() => G.toValue(world.getGroundType())),
    getPosX: sense(() => (world.addOps(1), world.x)),
    getPosY: sense(() => (world.addOps(1), world.y)),
    getWorldSize: sense(() => (world.addOps(1), world.size)),
    numItems: sense((it: any) => (world.addOps(1), world.items[pick(I, it, 'numItems', 'un recurso, por ejemplo Items.Hay')])),
    getWater: sense(() => world.getWater()),
    measure: sense((d?: any) => world.measure(d === undefined ? undefined : dir(d, 'measure'))),
    getCompanion: sense(() => {
      const c = world.getCompanion();
      return c ? [E.toValue(c[0]), c[1], c[2]] : null;
    }),
    getTime: sense(() => (world.addOps(1), world.sync(), Math.round(world.time * 1000) / 1000)),
    getTickCount: sense(() => world.ops),
    unlock: sense((u: any) => world.unlock(pick(U, u, 'unlock', 'una mejora, por ejemplo Unlocks.Expand'))),
    numUnlocked: sense((u: any) => world.unlocks[pick(U, u, 'numUnlocked', 'una mejora, por ejemplo Unlocks.Speed')]),
    getIntruderPos: sense(() => world.getIntruderPos()),
    hack: act('hack', () => world.hack()),
    getSerial: sense(() => world.getSerial()),
    shutdown: act('shutdown', ([code]) => {
      if (typeof code !== 'number') throw new TypeError(`shutdown() necesita un número${typeof code === 'string' ? ': recibió el texto "' + code + '" (conviértelo con Number())' : ''}`);
      return world.shutdown(code);
    }),
    getCost: sense((u: any) => {
      const cost = world.unlockCost(pick(U, u, 'getCost', 'una mejora, por ejemplo Unlocks.Speed'));
      if (!cost) return null;
      return Object.fromEntries(Object.entries(cost).map(([k, v]) => [I.toValue(k as ItemId), v]));
    }),
  };
}

/** Mejoras con su nombre visible (para el panel de la granja libre). */
export function unlockList(theme: GameTheme): { id: UnlockId; label: string; key: string }[] {
  return (Object.keys(UNLOCKS) as UnlockId[]).map((id) => ({ id, label: THEMES[theme].unlockLabel[id], key: THEMES[theme].unlockKey[id] }));
}
