/**
 * Simulación del juego del dron (inspirado en «The Farmer Was Replaced»): una cuadrícula
 * que da la vuelta en los bordes, un dron que se programa en JavaScript y plantas (o
 * minerales, en el tema de minería) que crecen con el tiempo del juego.
 *
 * Reglas tomadas del juego original (analizado con REA): el tiempo avanza por operaciones
 * (cada instrucción es 1 operación y cada acción del dron 200); el riego acelera el
 * crecimiento hasta 5× (factor 1 + 4·agua); las calabazas mueren con 20 % de probabilidad
 * al madurar y las maduras que forman un cuadrado se funden en una calabaza gigante que
 * rinde n²·mín(n, 6); los girasoles tienen de 7 a 15 pétalos y cosechar el de más pétalos
 * con 10 o más en la granja da 8× energía; los cactus (tamaño 0–9) ordenados respecto a sus
 * vecinos se cosechan juntos y rinden n²; cada planta pide un compañero cercano (policultivo,
 * 5×); y la sustancia extraña sobre un arbusto crea un laberinto con un tesoro.
 */
import { seededRandom } from '../exam/random';

export type Dir = 'North' | 'East' | 'South' | 'West';
export type EntityId = 'grass' | 'bush' | 'tree' | 'carrot' | 'pumpkin' | 'dead_pumpkin' | 'sunflower' | 'cactus' | 'hedge' | 'treasure';
export type GroundId = 'grassland' | 'soil';
export type ItemId = 'hay' | 'wood' | 'carrot' | 'pumpkin' | 'power' | 'cactus' | 'gold' | 'water' | 'fertilizer' | 'weird_substance';
export type UnlockId = 'expand' | 'speed' | 'carrots' | 'trees' | 'watering' | 'pumpkins' | 'sunflowers' | 'cactus' | 'fertilizer' | 'polyculture' | 'mazes';

/** Segundos de juego por operación a velocidad 1 (valor del juego original). */
export const OP_SECONDS = 0.0025;
/** Operaciones que cuesta cada acción del dron (moverse, cosechar, plantar…). */
export const ACTION_OPS = 200;

export const DIRS: Dir[] = ['North', 'East', 'South', 'West'];
const DELTA: Record<Dir, [number, number]> = { North: [0, 1], East: [1, 0], South: [0, -1], West: [-1, 0] };
/** Bits de paredes del laberinto. */
const WALL: Record<Dir, number> = { North: 1, East: 2, South: 4, West: 8 };
const OPPOSITE: Record<Dir, Dir> = { North: 'South', East: 'West', South: 'North', West: 'East' };

interface Species {
  /** Segundos promedio para madurar. */
  grow: number;
  /** Variación del tiempo de crecimiento (0.2 = ±20 %). */
  dev?: number;
  grounds: GroundId[];
  item: ItemId | null;
  amount: number;
  cost?: Partial<Record<ItemId, number>>;
  unlock?: UnlockId;
  /** Puede pedir un compañero (policultivo). */
  companion?: boolean;
}

export const SPECIES: Record<EntityId, Species> = {
  grass: { grow: 0.45, dev: 0.1, grounds: ['grassland', 'soil'], item: 'hay', amount: 1, companion: true },
  bush: { grow: 4, grounds: ['grassland', 'soil'], item: 'wood', amount: 1, companion: true },
  tree: { grow: 7, grounds: ['grassland', 'soil'], item: 'wood', amount: 5, unlock: 'trees', companion: true },
  carrot: { grow: 6, grounds: ['soil'], item: 'carrot', amount: 1, cost: { wood: 1, hay: 1 }, unlock: 'carrots', companion: true },
  pumpkin: { grow: 2, grounds: ['soil'], item: 'pumpkin', amount: 1, cost: { carrot: 1 }, unlock: 'pumpkins' },
  dead_pumpkin: { grow: 0, grounds: ['soil'], item: null, amount: 0 },
  sunflower: { grow: 5, grounds: ['soil'], item: 'power', amount: 1, cost: { carrot: 1 }, unlock: 'sunflowers' },
  cactus: { grow: 1, grounds: ['soil'], item: 'cactus', amount: 1, cost: { pumpkin: 1 }, unlock: 'cactus' },
  hedge: { grow: 0, grounds: ['grassland', 'soil'], item: null, amount: 0 },
  treasure: { grow: 0, grounds: ['grassland', 'soil'], item: 'gold', amount: 1 },
};

/** Lo que el alumno puede plantar con plant(). */
export const PLANTABLE: EntityId[] = ['grass', 'bush', 'tree', 'carrot', 'pumpkin', 'sunflower', 'cactus'];

/** Mejoras de la granja libre: costo del primer nivel y cuánto crece cada vez. */
export const UNLOCKS: Record<UnlockId, { max: number; cost: Partial<Record<ItemId, number>>; factor: number }> = {
  expand: { max: 6, cost: { hay: 20 }, factor: 2.5 },
  speed: { max: 5, cost: { hay: 30 }, factor: 3 },
  trees: { max: 1, cost: { wood: 30 }, factor: 1 },
  carrots: { max: 1, cost: { wood: 50, hay: 50 }, factor: 1 },
  watering: { max: 1, cost: { wood: 50 }, factor: 1 },
  pumpkins: { max: 1, cost: { carrot: 50 }, factor: 1 },
  sunflowers: { max: 1, cost: { carrot: 80 }, factor: 1 },
  fertilizer: { max: 1, cost: { pumpkin: 100 }, factor: 1 },
  cactus: { max: 1, cost: { pumpkin: 200, power: 50 }, factor: 1 },
  polyculture: { max: 1, cost: { carrot: 300, power: 100 }, factor: 1 },
  mazes: { max: 1, cost: { cactus: 300, power: 100 }, factor: 1 },
};
/** Tamaño de la granja según las ampliaciones. */
export const EXPAND_SIZES = [3, 4, 5, 6, 8, 10, 12];

export interface Plant {
  type: EntityId;
  /** Avance del crecimiento (0 = recién plantada, 1 = madura). */
  progress: number;
  /** Segundos para madurar (con la variación propia de cada planta). */
  growSeconds: number;
  /** Girasol: pétalos. Cactus: tamaño. */
  number?: number;
  /** Abonada con fertilizante: al cosecharla da sustancia extraña. */
  weird?: boolean;
  /** Calabaza: id de la calabaza gigante a la que pertenece. */
  group?: number;
  companion?: { type: EntityId; x: number; y: number };
}

export interface Cell {
  ground: GroundId;
  water: number;
  entity: Plant | null;
  /** Laberinto: paredes (bits North=1, East=2, South=4, West=8). */
  walls?: number;
}

export interface GameStats {
  harvested: Partial<Record<EntityId, number>>;
  /** Plantas cosechadas antes de madurar (se pierden). */
  wasted: number;
  /** Casillas distintas donde se cosechó algo. */
  harvestedCells: Set<string>;
  biggestPumpkin: number;
  sunflowerBonus: number;
  biggestCactusHarvest: number;
  companionBonus: number;
  treasures: number;
  actions: number;
  /** Lo que el dron intruso cosechó o arrancó (por tipo). */
  destroyed: Partial<Record<EntityId, number>>;
  intruderActions: number;
}

/** Dron intruso (modo hackeo). */
export interface Intruder {
  x: number;
  y: number;
  facing: Dir;
  /** Tu dron lo hackeó con hack(). */
  hacked: boolean;
  /** Se apagó con el código correcto (shutdown). */
  shutdown: boolean;
  /** Su programa terminó. */
  done: boolean;
  serial: string;
}

export interface WorldOptions {
  size: number;
  seed?: string;
  items?: Partial<Record<ItemId, number>>;
  unlocks?: Partial<Record<UnlockId, number>>;
  /** Contenido inicial de cada casilla (por defecto, pasto maduro sobre pradera). */
  fill?: (x: number, y: number) => { ground?: GroundId; entity?: EntityId | null; grown?: boolean };
  start?: { x: number; y: number };
  /** Hay un dron intruso en esta posición. */
  intruder?: { x: number; y: number };
  /** No se dibuja tu dron (misiones donde solo se controla al intruso). */
  hideMain?: boolean;
  /**
   * El intruso trabaja al mismo tiempo que tu dron: sus acciones no gastan tiempo extra.
   * Si es false (solo se ejecuta el programa del intruso), sus acciones avanzan el tiempo.
   */
  intruderParallel?: boolean;
}

export interface GroupInfo {
  x: number;
  y: number;
  size: number;
}

export class World {
  size: number;
  cells: Cell[][];
  x = 0;
  y = 0;
  items: Record<ItemId, number>;
  unlocks: Record<UnlockId, number>;
  /** Tiempo de juego en segundos. */
  time = 0;
  ops = 0;
  stats: GameStats = { harvested: {}, wasted: 0, harvestedCells: new Set(), biggestPumpkin: 0, sunflowerBonus: 0, biggestCactusHarvest: 0, companionBonus: 0, treasures: 0, actions: 0, destroyed: {}, intruderActions: 0 };
  intruder: Intruder | null = null;
  hideMain = false;
  intruderParallel = true;
  /** Quién está actuando ahora (las acciones del intruso se cuentan aparte). */
  private actor: 'main' | 'intruder' = 'main';
  /** Calabazas gigantes formadas (id → posición y tamaño). */
  groups = new Map<number, GroupInfo>();
  /** Posición del tesoro si hay un laberinto. */
  treasure: { x: number; y: number } | null = null;
  /** Avisos para mostrar en la consola (no detienen el programa). */
  warnings: string[] = [];
  /** Se incrementa con cada cambio (la vista lo usa para redibujarse). */
  version = 0;
  /** El nivel terminó: las acciones ya no cambian nada. */
  frozen = false;
  /** Dirección hacia la que mira el dron (solo para dibujarlo). */
  facing: Dir = 'East';
  private rand: () => number;
  private pendingOps = 0;
  private nextGroup = 1;
  private pumpkinsDirty = false;

  constructor(opts: WorldOptions) {
    this.size = opts.size;
    this.rand = seededRandom(opts.seed ?? 'psjs-dron');
    this.items = { hay: 0, wood: 0, carrot: 0, pumpkin: 0, power: 0, cactus: 0, gold: 0, water: 0, fertilizer: 0, weird_substance: 0, ...opts.items };
    this.unlocks = { expand: 0, speed: 0, trees: 0, carrots: 0, watering: 0, pumpkins: 0, sunflowers: 0, fertilizer: 0, cactus: 0, polyculture: 0, mazes: 0, ...opts.unlocks };
    this.cells = [];
    for (let x = 0; x < this.size; x++) {
      const col: Cell[] = [];
      for (let y = 0; y < this.size; y++) {
        const spec = opts.fill?.(x, y) ?? {};
        const ground = spec.ground ?? 'grassland';
        const type = spec.entity === undefined ? (ground === 'grassland' ? 'grass' : null) : spec.entity;
        col.push({ ground, water: 0, entity: null });
        if (type) col[y].entity = this.newPlant(type, spec.grown ?? true);
      }
      this.cells.push(col);
    }
    if (opts.start) {
      this.x = opts.start.x;
      this.y = opts.start.y;
    }
    if (opts.intruder) {
      // número de serie: letras y dígitos (en la misión de apagado se suman sus dígitos)
      const d = () => Math.floor(this.rand() * 10);
      const serial = `DR-${d()}${d()}${d()}${d()}-${'XKZQ'[Math.floor(this.rand() * 4)]}${d()}`;
      this.intruder = { x: opts.intruder.x, y: opts.intruder.y, facing: 'West', hacked: false, shutdown: false, done: false, serial };
    }
    this.hideMain = !!opts.hideMain;
    this.intruderParallel = opts.intruderParallel ?? true;
    this.pumpkinsDirty = true;
    this.mergePumpkins();
  }

  // ───────────────────────────── tiempo ─────────────────────────────

  /** Factor de velocidad del dron (mejoras de velocidad; la energía la duplica). */
  speedFactor(): number {
    return Math.pow(1.5, this.unlocks.speed) * (this.items.power > 0 ? 2 : 1);
  }

  /** Cuenta operaciones (cada instrucción es 1; se aplican al crecimiento cuando hace falta). */
  addOps(n: number) {
    this.pendingOps += n;
    this.ops += n;
  }

  /** Aplica el tiempo pendiente: las plantas crecen y el agua se evapora. */
  sync() {
    if (!this.pendingOps) return;
    const dt = (this.pendingOps * OP_SECONDS) / this.speedFactor();
    this.pendingOps = 0;
    this.time += dt;
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const c = this.cells[x][y];
        const p = c.entity;
        if (p && p.progress < 1 && p.growSeconds > 0) {
          const treeSlow = p.type === 'tree' ? 1 + this.neighbors(x, y).filter(([nx, ny]) => this.cells[nx][ny].entity?.type === 'tree').length : 1;
          p.progress = Math.min(1, p.progress + (dt * (1 + 4 * c.water)) / (p.growSeconds * treeSlow));
          if (p.progress >= 1) this.onGrown(x, y, p);
        }
        if (c.water > 0) c.water = Math.max(0, c.water - 0.01 * dt);
      }
    }
    this.mergePumpkins();
    this.version++;
  }

  /** Ejecuta `fn` como si fuera el dron intruso (mueve y actúa en su posición). */
  withIntruder<T>(fn: () => T): T {
    const it = this.intruder;
    if (!it) throw new Error('No hay un dron intruso en esta misión.');
    const mine = { x: this.x, y: this.y, facing: this.facing };
    this.x = it.x;
    this.y = it.y;
    this.facing = it.facing;
    this.actor = 'intruder';
    try {
      return fn();
    } finally {
      it.x = this.x;
      it.y = this.y;
      it.facing = this.facing;
      this.x = mine.x;
      this.y = mine.y;
      this.facing = mine.facing;
      this.actor = 'main';
    }
  }

  /** El intruso ya no puede actuar (hackeado o apagado). */
  intruderStopped(): boolean {
    return !!this.intruder && (this.intruder.hacked || this.intruder.shutdown);
  }

  /** Cuesta una acción del dron (200 operaciones). */
  private action() {
    if (this.actor === 'intruder') {
      this.stats.intruderActions++;
      // en paralelo, el tiempo ya lo cuenta tu dron
      if (this.intruderParallel) return;
      this.addOps(ACTION_OPS);
      this.sync();
      return;
    }
    this.addOps(ACTION_OPS);
    this.stats.actions++;
    this.sync();
  }

  // ───────────────────────────── utilidades ─────────────────────────────

  wrap(v: number): number {
    return ((v % this.size) + this.size) % this.size;
  }

  cell(x = this.x, y = this.y): Cell {
    return this.cells[this.wrap(x)][this.wrap(y)];
  }

  private neighbors(x: number, y: number): [number, number][] {
    return DIRS.map((d) => [this.wrap(x + DELTA[d][0]), this.wrap(y + DELTA[d][1])] as [number, number]);
  }

  private newPlant(type: EntityId, grown = false): Plant {
    const s = SPECIES[type];
    // cada planta tarda un poco distinto (±20 %), como en el original
    const dev = s.dev ?? 0.2;
    const p: Plant = { type, progress: grown || s.grow === 0 ? 1 : 0, growSeconds: s.grow * (1 - dev + 2 * dev * this.rand()) };
    if (type === 'sunflower') p.number = 7 + Math.floor(this.rand() * 9);
    if (type === 'cactus') p.number = Math.floor(this.rand() * 10);
    return p;
  }

  private onGrown(x: number, y: number, p: Plant) {
    if (p.type === 'pumpkin' && this.rand() < 0.2) {
      this.cells[x][y].entity = { type: 'dead_pumpkin', progress: 1, growSeconds: 0 };
      return;
    }
    if (p.type === 'pumpkin') this.pumpkinsDirty = true;
  }

  private warn(text: string) {
    this.warnings.push(text);
  }

  /** Quita la planta de una casilla (en la pradera vuelve a salir pasto). */
  private clearCell(x: number, y: number) {
    const c = this.cells[x][y];
    c.entity = c.ground === 'grassland' ? this.newPlant('grass') : null;
  }

  // ───────────────────────────── calabazas gigantes ─────────────────────────────

  /** Las calabazas maduras que forman un cuadrado se funden en una gigante. */
  private mergePumpkins() {
    if (!this.pumpkinsDirty) return;
    this.pumpkinsDirty = false;
    const n = this.size;
    const ok = (x: number, y: number) => {
      const e = this.cells[x][y].entity;
      return !!e && e.type === 'pumpkin' && e.progress >= 1;
    };
    // lado del mayor cuadrado de calabazas maduras con esquina inferior izquierda en (x, y)
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
    for (let x = n - 1; x >= 0; x--)
      for (let y = n - 1; y >= 0; y--) dp[x][y] = ok(x, y) ? 1 + Math.min(dp[x + 1][y], dp[x][y + 1], dp[x + 1][y + 1]) : 0;
    const taken = new Set<string>();
    const squares: GroupInfo[] = [];
    for (let size = n; size >= 2; size--) {
      for (let x = 0; x + size <= n; x++) {
        for (let y = 0; y + size <= n; y++) {
          if (dp[x][y] < size) continue;
          let free = true;
          for (let i = 0; i < size && free; i++) for (let j = 0; j < size && free; j++) if (taken.has(`${x + i},${y + j}`)) free = false;
          if (!free) continue;
          for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) taken.add(`${x + i},${y + j}`);
          squares.push({ x, y, size });
        }
      }
    }
    this.groups.clear();
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) if (this.cells[x][y].entity?.type === 'pumpkin') this.cells[x][y].entity!.group = undefined;
    for (const sq of squares) {
      const id = this.nextGroup++;
      this.groups.set(id, sq);
      for (let i = 0; i < sq.size; i++) for (let j = 0; j < sq.size; j++) this.cells[sq.x + i][sq.y + j].entity!.group = id;
    }
  }

  // ───────────────────────────── acciones del dron ─────────────────────────────

  /** Las acciones no hacen nada si el nivel terminó o si el intruso ya fue detenido. */
  private blocked(): boolean {
    return this.frozen || (this.actor === 'intruder' && this.intruderStopped());
  }

  move(dir: Dir): boolean {
    if (this.blocked()) return false;
    this.facing = dir;
    const ok = this.canMoveNow(dir);
    this.action();
    if (!ok) return false;
    this.x = this.wrap(this.x + DELTA[dir][0]);
    this.y = this.wrap(this.y + DELTA[dir][1]);
    this.version++;
    return true;
  }

  private canMoveNow(dir: Dir): boolean {
    const walls = this.cell().walls ?? 0;
    return !(walls & WALL[dir]);
  }

  canMove(dir: Dir): boolean {
    this.addOps(1);
    return this.canMoveNow(dir);
  }

  canHarvest(): boolean {
    this.addOps(1);
    this.sync();
    const e = this.cell().entity;
    return !!e && e.progress >= 1 && e.type !== 'dead_pumpkin' && e.type !== 'hedge';
  }

  harvest(): boolean {
    if (this.blocked()) return false;
    this.action();
    const x = this.x;
    const y = this.y;
    const c = this.cells[x][y];
    const e = c.entity;
    if (!e || e.type === 'hedge') return false;
    if (this.actor === 'intruder') this.stats.destroyed[e.type] = (this.stats.destroyed[e.type] ?? 0) + 1;
    if (e.progress < 1 || e.type === 'dead_pumpkin') {
      // cosechar antes de tiempo destruye la planta
      if (e.type !== 'dead_pumpkin') this.stats.wasted++;
      this.clearCell(x, y);
      this.version++;
      return true;
    }
    this.stats.harvested[e.type] = (this.stats.harvested[e.type] ?? 0) + 1;
    this.stats.harvestedCells.add(`${x},${y}`);
    if (e.type === 'treasure') {
      this.items.gold += this.size * this.size;
      this.stats.treasures++;
      this.removeMaze();
      this.version++;
      return true;
    }
    if (e.type === 'pumpkin') {
      const g = e.group ? this.groups.get(e.group) : undefined;
      const size = g?.size ?? 1;
      this.give('pumpkin', size * size * Math.min(size, 6), e.weird);
      this.stats.biggestPumpkin = Math.max(this.stats.biggestPumpkin, size);
      if (g) {
        for (let i = 0; i < g.size; i++) for (let j = 0; j < g.size; j++) this.clearCell(g.x + i, g.y + j);
        this.groups.delete(e.group!);
      } else this.clearCell(x, y);
      this.pumpkinsDirty = true;
      this.mergePumpkins();
      this.version++;
      return true;
    }
    if (e.type === 'cactus') {
      const region = this.sortedRegion(x, y);
      const n = region.length || 1;
      this.give('cactus', n * n, e.weird);
      this.stats.biggestCactusHarvest = Math.max(this.stats.biggestCactusHarvest, n);
      for (const [cx, cy] of region.length ? region : [[x, y]]) this.clearCell(cx, cy);
      this.version++;
      return true;
    }
    let amount = SPECIES[e.type].amount;
    if (e.type === 'sunflower') {
      const grown = this.allCells().filter(([cx, cy]) => {
        const s = this.cells[cx][cy].entity;
        return s?.type === 'sunflower' && s.progress >= 1;
      });
      const max = Math.max(...grown.map(([cx, cy]) => this.cells[cx][cy].entity!.number ?? 0));
      if (grown.length >= 10 && (e.number ?? 0) >= max) {
        amount *= 8;
        this.stats.sunflowerBonus++;
      }
    }
    if (e.companion && this.unlocks.polyculture) {
      const other = this.cell(e.companion.x, e.companion.y).entity;
      if (other && other.type === e.companion.type) {
        amount *= 5;
        this.stats.companionBonus++;
      }
    }
    if (SPECIES[e.type].item) this.give(SPECIES[e.type].item!, amount, e.weird);
    this.clearCell(x, y);
    this.version++;
    return true;
  }

  private give(item: ItemId, amount: number, weird?: boolean) {
    // lo que arranca el dron intruso se pierde: no llega a tu inventario
    if (this.actor === 'intruder') return;
    this.items[item] += amount;
    if (weird) this.items.weird_substance += Math.ceil(amount / 2);
  }

  plant(type: EntityId): boolean {
    if (this.blocked()) return false;
    const s = SPECIES[type];
    if (!PLANTABLE.includes(type)) {
      this.warn(`No se puede plantar «${type}».`);
      this.addOps(1);
      return false;
    }
    if (s.unlock && !this.unlocks[s.unlock]) throw new Error(`Aún no se desbloquea «${s.unlock}». Desbloquéalo antes de usar plant(Entities.${type}).`);
    this.action();
    const c = this.cell();
    if (c.entity && c.entity.type !== 'dead_pumpkin' && !(c.entity.type === 'grass' && type !== 'grass')) {
      this.warn('No hay espacio para plantar: primero cosecha lo que hay en la casilla.');
      return false;
    }
    if (!s.grounds.includes(c.ground)) {
      this.warn(`No se puede plantar ${type} en ${c.ground === 'grassland' ? 'la pradera' : 'la tierra arada'}: usa till() para cambiar el suelo.`);
      return false;
    }
    for (const [item, n] of Object.entries(s.cost ?? {}) as [ItemId, number][]) {
      if (this.items[item] < n) {
        this.warn(`No alcanza para plantar ${type}: necesitas ${n} de ${item}.`);
        return false;
      }
    }
    for (const [item, n] of Object.entries(s.cost ?? {}) as [ItemId, number][]) this.items[item] -= n;
    const p = this.newPlant(type);
    if (s.companion && this.unlocks.polyculture) p.companion = this.chooseCompanion();
    c.entity = p;
    if (type === 'pumpkin') this.pumpkinsDirty = true;
    this.version++;
    return true;
  }

  private chooseCompanion(): Plant['companion'] {
    const kinds: EntityId[] = ['grass', 'bush', 'tree', 'carrot'];
    for (;;) {
      const dx = Math.floor(this.rand() * 7) - 3;
      const dy = Math.floor(this.rand() * 7) - 3;
      if ((dx === 0 && dy === 0) || Math.abs(dx) + Math.abs(dy) > 3) continue;
      return { type: kinds[Math.floor(this.rand() * kinds.length)], x: this.wrap(this.x + dx), y: this.wrap(this.y + dy) };
    }
  }

  /** Cambia el suelo: pradera ↔ tierra arada (lo que haya encima se quita). */
  till() {
    if (this.blocked()) return;
    this.action();
    const c = this.cell();
    c.ground = c.ground === 'grassland' ? 'soil' : 'grassland';
    if (c.entity?.type === 'pumpkin') this.pumpkinsDirty = true;
    c.entity = c.ground === 'grassland' ? this.newPlant('grass') : null;
    this.mergePumpkins();
    this.version++;
  }

  /** Intercambia lo que hay bajo el dron con la casilla vecina (no da la vuelta en los bordes). */
  swap(dir: Dir): boolean {
    if (this.blocked()) return false;
    this.action();
    const nx = this.x + DELTA[dir][0];
    const ny = this.y + DELTA[dir][1];
    if (nx < 0 || ny < 0 || nx >= this.size || ny >= this.size) {
      this.warn('swap() no puede intercambiar a través del borde de la granja.');
      return false;
    }
    const a = this.cell();
    const b = this.cells[nx][ny];
    [a.entity, b.entity] = [b.entity, a.entity];
    this.pumpkinsDirty = true;
    this.mergePumpkins();
    this.version++;
    return true;
  }

  useItem(item: ItemId, times = 1): boolean {
    if (this.blocked()) return false;
    if (!Number.isInteger(times) || times < 1) throw new Error('useItem() necesita una cantidad entera mayor que 0.');
    if (item === 'water' && !this.unlocks.watering) throw new Error('Aún no se desbloquea el riego (watering).');
    if (item === 'fertilizer' && !this.unlocks.fertilizer) throw new Error('Aún no se desbloquea el fertilizante.');
    if (item === 'weird_substance' && !this.unlocks.mazes) throw new Error('Aún no se desbloquean los laberintos (mazes).');
    this.action();
    if (this.items[item] < times) {
      this.warn(`No tienes ${times} de ${item}.`);
      return false;
    }
    const c = this.cell();
    if (item === 'water') {
      this.items.water -= times;
      c.water = Math.min(1, c.water + 0.25 * times);
    } else if (item === 'fertilizer') {
      const e = c.entity;
      if (!e || e.progress >= 1) {
        this.warn('El fertilizante solo sirve sobre una planta que aún está creciendo.');
        return false;
      }
      this.items.fertilizer -= times;
      e.progress = Math.min(1, e.progress + (2 * times) / e.growSeconds);
      e.weird = true;
      if (e.progress >= 1) this.onGrown(this.x, this.y, e);
    } else if (item === 'weird_substance') {
      const e = c.entity;
      if (!e || e.type !== 'bush' || e.progress < 1) {
        this.warn('La sustancia extraña crea un laberinto solo sobre un arbusto maduro.');
        return false;
      }
      this.items.weird_substance -= times;
      this.createMaze();
    } else {
      this.warn(`No se puede usar ${item}.`);
      return false;
    }
    this.mergePumpkins();
    this.version++;
    return true;
  }

  // ───────────────────────────── sensores ─────────────────────────────

  getEntityType(): EntityId | null {
    this.addOps(1);
    this.sync();
    return this.cell().entity?.type ?? null;
  }

  getGroundType(): GroundId {
    this.addOps(1);
    return this.cell().ground;
  }

  getWater(): number {
    this.addOps(1);
    this.sync();
    return Math.round(this.cell().water * 1000) / 1000;
  }

  /** Pétalos (girasol), tamaño (cactus), id (calabaza) o la posición del tesoro en un laberinto. */
  measure(dir?: Dir): number | number[] | null {
    this.addOps(1);
    this.sync();
    if (this.treasure && !dir) return [this.treasure.x, this.treasure.y];
    const e = dir ? this.cell(this.x + DELTA[dir][0], this.y + DELTA[dir][1]).entity : this.cell().entity;
    if (!e) return null;
    if (e.type === 'sunflower' || e.type === 'cactus') return e.number ?? null;
    if (e.type === 'pumpkin') return e.group ?? 0;
    return null;
  }

  getCompanion(): [EntityId, number, number] | null {
    this.addOps(1);
    const c = this.cell().entity?.companion;
    return c ? [c.type, c.x, c.y] : null;
  }

  // ───────────────────────────── hackeo ─────────────────────────────

  getIntruderPos(): [number, number] | null {
    this.addOps(1);
    return this.intruder ? [this.intruder.x, this.intruder.y] : null;
  }

  /** Hackea al intruso si tu dron está en su casilla o en una vecina. */
  hack(): boolean {
    if (this.frozen) return false;
    this.action();
    const it = this.intruder;
    if (!it || it.hacked || it.shutdown) return false;
    const dx = Math.min(Math.abs(it.x - this.x), this.size - Math.abs(it.x - this.x));
    const dy = Math.min(Math.abs(it.y - this.y), this.size - Math.abs(it.y - this.y));
    if (dx + dy > 1) {
      this.warn(`El intruso está muy lejos para hackearlo: está en (${it.x}, ${it.y}).`);
      return false;
    }
    it.hacked = true;
    this.version++;
    return true;
  }

  getSerial(): string | null {
    this.addOps(1);
    return this.intruder?.serial ?? null;
  }

  /** Código de apagado: la suma de los dígitos del número de serie. */
  shutdownCode(): number {
    return [...(this.intruder?.serial ?? '')].filter((c) => c >= '0' && c <= '9').reduce((a, c) => a + Number(c), 0);
  }

  shutdown(code: number): boolean {
    if (this.frozen) return false;
    this.action();
    const it = this.intruder;
    if (!it || it.shutdown) return false;
    if (code !== this.shutdownCode()) {
      this.warn(`Código de apagado incorrecto (${code}).`);
      return false;
    }
    it.shutdown = true;
    this.version++;
    return true;
  }

  /** Cuántas casillas tienen cierta planta (madura o no). */
  count(type: EntityId): number {
    return this.allCells().filter(([x, y]) => this.cells[x][y].entity?.type === type).length;
  }

  /** Deja la granja como al inicio: todo pradera con pasto y el dron en (0, 0). */
  clear() {
    if (this.blocked()) return;
    this.action();
    for (const [x, y] of this.allCells()) {
      const c = this.cells[x][y];
      c.ground = 'grassland';
      c.water = 0;
      c.walls = undefined;
      c.entity = this.newPlant('grass');
    }
    this.treasure = null;
    this.groups.clear();
    this.x = 0;
    this.y = 0;
    this.version++;
  }

  allCells(): [number, number][] {
    const out: [number, number][] = [];
    for (let x = 0; x < this.size; x++) for (let y = 0; y < this.size; y++) out.push([x, y]);
    return out;
  }

  // ───────────────────────────── cactus ─────────────────────────────

  private isSortedCactus(x: number, y: number): boolean {
    const e = this.cells[x][y].entity;
    if (!e || e.type !== 'cactus' || e.progress < 1) return false;
    const v = e.number ?? 0;
    const at = (cx: number, cy: number) => {
      if (cx < 0 || cy < 0 || cx >= this.size || cy >= this.size) return null;
      const o = this.cells[cx][cy].entity;
      return o && o.type === 'cactus' && o.progress >= 1 ? (o.number ?? 0) : null;
    };
    const w = at(x - 1, y);
    const east = at(x + 1, y);
    const s = at(x, y - 1);
    const n = at(x, y + 1);
    return (w === null || w <= v) && (east === null || east >= v) && (s === null || s <= v) && (n === null || n >= v);
  }

  /** Región conectada de cactus maduros y ordenados que incluye (x, y); vacía si este no está ordenado. */
  private sortedRegion(x: number, y: number): [number, number][] {
    if (!this.isSortedCactus(x, y)) return [];
    const seen = new Set<string>([`${x},${y}`]);
    const stack: [number, number][] = [[x, y]];
    const out: [number, number][] = [];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      out.push([cx, cy]);
      for (const d of DIRS) {
        const nx = cx + DELTA[d][0];
        const ny = cy + DELTA[d][1];
        if (nx < 0 || ny < 0 || nx >= this.size || ny >= this.size || seen.has(`${nx},${ny}`)) continue;
        if (!this.isSortedCactus(nx, ny)) continue;
        seen.add(`${nx},${ny}`);
        stack.push([nx, ny]);
      }
    }
    return out;
  }

  // ───────────────────────────── laberinto ─────────────────────────────

  /** Laberinto perfecto en toda la granja (búsqueda en profundidad al azar) con un tesoro. */
  private createMaze() {
    const n = this.size;
    for (const [x, y] of this.allCells()) {
      this.cells[x][y].walls = 15;
      this.cells[x][y].entity = { type: 'hedge', progress: 1, growSeconds: 0 };
    }
    const seen = new Set<string>([`${this.x},${this.y}`]);
    const stack: [number, number][] = [[this.x, this.y]];
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const options = DIRS.filter((d) => {
        const nx = x + DELTA[d][0];
        const ny = y + DELTA[d][1];
        return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen.has(`${nx},${ny}`);
      });
      if (!options.length) {
        stack.pop();
        continue;
      }
      const d = options[Math.floor(this.rand() * options.length)];
      const nx = x + DELTA[d][0];
      const ny = y + DELTA[d][1];
      this.cells[x][y].walls! &= ~WALL[d];
      this.cells[nx][ny].walls! &= ~WALL[OPPOSITE[d]];
      seen.add(`${nx},${ny}`);
      stack.push([nx, ny]);
    }
    let tx = this.x;
    let ty = this.y;
    while (tx === this.x && ty === this.y && n > 1) {
      tx = Math.floor(this.rand() * n);
      ty = Math.floor(this.rand() * n);
    }
    this.cells[tx][ty].entity = { type: 'treasure', progress: 1, growSeconds: 0 };
    this.treasure = { x: tx, y: ty };
  }

  private removeMaze() {
    for (const [x, y] of this.allCells()) {
      const c = this.cells[x][y];
      c.walls = undefined;
      if (c.entity?.type === 'hedge' || c.entity?.type === 'treasure') this.clearCell(x, y);
    }
    this.treasure = null;
  }

  // ───────────────────────────── desbloqueos (granja libre) ─────────────────────────────

  unlockCost(id: UnlockId): Partial<Record<ItemId, number>> | null {
    const u = UNLOCKS[id];
    const level = this.unlocks[id];
    if (level >= u.max) return null;
    const out: Partial<Record<ItemId, number>> = {};
    for (const [item, n] of Object.entries(u.cost) as [ItemId, number][]) out[item] = Math.round(n * Math.pow(u.factor, level));
    return out;
  }

  unlock(id: UnlockId): boolean {
    const cost = this.unlockCost(id);
    if (!cost) {
      this.warn(`«${id}» ya está al máximo.`);
      return false;
    }
    for (const [item, n] of Object.entries(cost) as [ItemId, number][]) {
      if (this.items[item] < n) {
        this.warn(`Para desbloquear «${id}» necesitas ${n} de ${item}.`);
        return false;
      }
    }
    for (const [item, n] of Object.entries(cost) as [ItemId, number][]) this.items[item] -= n;
    this.unlocks[id]++;
    if (id === 'expand') this.resize(EXPAND_SIZES[Math.min(this.unlocks.expand, EXPAND_SIZES.length - 1)]);
    if (id === 'watering') this.items.water += 10;
    if (id === 'fertilizer') this.items.fertilizer += 10;
    if (id === 'mazes') this.items.weird_substance += 5;
    this.version++;
    return true;
  }

  /** Agranda la granja conservando lo plantado. */
  resize(size: number) {
    if (size <= this.size) return;
    for (let x = 0; x < size; x++) {
      if (!this.cells[x]) this.cells[x] = [];
      for (let y = 0; y < size; y++) if (!this.cells[x][y]) this.cells[x][y] = { ground: 'grassland', water: 0, entity: this.newPlant('grass', true) };
    }
    this.size = size;
    this.version++;
  }

  /** Avisos acumulados (y los borra). */
  takeWarnings(): string[] {
    const w = this.warnings;
    this.warnings = [];
    return w;
  }
}
