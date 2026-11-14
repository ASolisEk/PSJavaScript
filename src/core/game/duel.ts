/**
 * Duelo de dos jugadores. Cada quien escribe un programa en JavaScript:
 * - la DEFENSA controla al dron de la granja (modo normal): cosecha para sumar puntos y puede
 *   hackear al atacante para reiniciarlo;
 * - el ATAQUE controla al dron intruso (modo hackeo): roba las cosechas maduras y arranca brotes.
 *
 * Los dos programas corren por turnos en la misma granja: en cada turno actúa primero la
 * defensa y después el ataque (una acción cada uno), y pasa medio segundo de juego. Al
 * terminar los turnos gana quien tenga más puntos. Con la misma semilla y los mismos
 * programas el resultado es idéntico (así dos dispositivos simulan la misma partida).
 */
import { seededRandom } from '../exam/random';
import { FatalError, G, Interpreter, ThrowSignal } from '../interpreter/interpreter';
import { getProfile, Profile } from '../profiles';
import { gameGlobals, GameTheme } from './api';
import { DUEL_HACK_POINTS, DUEL_ITEM_VALUE, DuelScore, World, WorldOptions } from './world';

export type DuelRole = 'defense' | 'attack';
export type DuelWinner = DuelRole | 'tie';

/** Segundos de juego que pasan en cada turno (lo que dura una acción del dron). */
export const DUEL_TURN_SECONDS = 0.5;
/** Instrucciones como máximo por turno (un programa que «piensa» de más pierde el turno). */
const MAX_STEPS_PER_TURN = 20_000;
const MAX_OUTPUT = 60;

export const DUEL_LENGTHS = [
  { turns: 80, label: 'Corta', hint: '80 turnos' },
  { turns: 150, label: 'Normal', hint: '150 turnos' },
  { turns: 250, label: 'Larga', hint: '250 turnos' },
] as const;

export interface DuelConfig {
  /** Semilla de la partida (la misma en los dos dispositivos). */
  seed: string;
  turns: number;
  theme: GameTheme;
  size?: number;
}

/** Granja de un duelo: pasto maduro, arbustos al centro y cada dron en su esquina. */
export function duelWorld(cfg: DuelConfig): WorldOptions {
  const n = cfg.size ?? 6;
  return {
    size: n,
    seed: `duelo-${cfg.seed}`,
    duel: true,
    items: { wood: 30, hay: 30, water: 20 },
    unlocks: { trees: 1, carrots: 1, watering: 1 },
    start: { x: 0, y: 0 },
    intruder: { x: n - 1, y: n - 1 },
    // arbustos maduros en el centro (valen más que el pasto): hay algo que defender desde el primer turno
    fill: (x, y) => ({ ground: 'grassland', entity: x >= 2 && x <= n - 3 && y >= 2 && y <= n - 3 ? 'bush' : 'grass', grown: true }),
  };
}

/** Programa de un jugador: se ejecuta de acción en acción. */
export class DroneProgram {
  private gen: G<void> | null = null;
  private acted = false;
  /** Error que detuvo el programa (el dron se queda quieto el resto de la partida). */
  error: string | null = null;
  errorLine: number | null = null;
  /** El programa llegó a su fin. */
  done = false;
  /** Lo que escribió con console.log y los avisos del dron (lo más reciente). */
  output: string[] = [];
  /** Turnos en los que no hizo ninguna acción. */
  idle = 0;

  constructor(world: World, code: string, role: DuelRole, theme: GameTheme, seed: string, profile: Profile) {
    const globals = gameGlobals(world, {
      theme,
      actor: role === 'attack' ? 'intruder' : 'main',
      delay: () => 0,
      log: (text) => this.print(`⚠ ${text}`),
      onAction: () => {
        this.acted = true;
      },
    });
    try {
      const interp = new Interpreter(code, { profile, io: { write: (_kind, text) => this.print(text), clear: () => {} }, globals, random: seededRandom(`${seed}-${role}`) });
      this.gen = interp.run();
    } catch (e) {
      this.fail(e);
    }
  }

  private print(text: string) {
    this.output.push(String(text).slice(0, 300));
    if (this.output.length > MAX_OUTPUT) this.output.shift();
  }

  private fail(e: any) {
    const node = e?.node;
    this.errorLine = node?.loc?.start?.line ?? e?.loc?.line ?? null;
    const v = e instanceof ThrowSignal ? e.value : e;
    this.error = e instanceof FatalError ? e.message : v instanceof Error ? v.message : typeof v === 'string' ? v : (v?.message ?? String(v));
    this.gen = null;
  }

  /** ¿Puede seguir actuando? */
  get alive(): boolean {
    return !!this.gen && !this.done && !this.error;
  }

  /** Avanza el programa hasta que haga una acción. Devuelve true si actuó. */
  act(): boolean {
    if (!this.alive) return false;
    this.acted = false;
    try {
      for (let i = 0; i < MAX_STEPS_PER_TURN && !this.acted; i++) {
        if (this.gen!.next().done) {
          this.done = true;
          break;
        }
      }
    } catch (e) {
      this.fail(e);
    }
    if (!this.acted) this.idle++;
    return this.acted;
  }
}

export interface DuelEvent {
  turn: number;
  who: DuelRole;
  text: string;
  points: number;
}

export interface DuelResult {
  winner: DuelWinner;
  score: DuelScore;
  turns: number;
}

export class DuelMatch {
  world: World;
  turn = 0;
  finished = false;
  defense: DroneProgram;
  attack: DroneProgram;
  /** Bitácora del combate (hackeos, robos y errores). */
  events: DuelEvent[] = [];

  constructor(
    public cfg: DuelConfig,
    defenseCode: string,
    attackCode: string,
    profile: Profile = getProfile('flexible'),
  ) {
    this.world = new World(duelWorld(cfg));
    this.defense = new DroneProgram(this.world, defenseCode, 'defense', cfg.theme, cfg.seed, profile);
    this.attack = new DroneProgram(this.world, attackCode, 'attack', cfg.theme, cfg.seed, profile);
    for (const role of ['defense', 'attack'] as const) this.reportError(role);
  }

  private reported = new Set<DuelRole>();
  private reportError(role: DuelRole) {
    const p = role === 'defense' ? this.defense : this.attack;
    if (!p.error || this.reported.has(role)) return;
    this.reported.add(role);
    this.events.push({ turn: this.turn, who: role, text: `su programa se detuvo: ${p.error}${p.errorLine ? ` (línea ${p.errorLine})` : ''}`, points: 0 });
  }

  get score(): DuelScore {
    return this.world.duel!;
  }

  /** Juega un turno: defensa, ataque y pasa el tiempo. Devuelve false cuando la partida terminó. */
  step(): boolean {
    if (this.finished) return false;
    this.turn++;
    this.defense.act();
    this.reportError('defense');
    if (!this.world.intruder?.stun) this.attack.act();
    this.reportError('attack');
    for (const e of this.world.duelEvents) this.events.push({ turn: this.turn, ...e });
    this.world.duelEvents = [];
    this.world.tick(DUEL_TURN_SECONDS);
    // se acaba el tiempo, o ninguno de los dos programas puede seguir
    if (this.turn >= this.cfg.turns || (!this.defense.alive && !this.attack.alive)) this.finished = true;
    return !this.finished;
  }

  /** Juega hasta el final (para ver solo el resultado o en pruebas). */
  runAll(): DuelResult {
    while (this.step());
    return this.result();
  }

  result(): DuelResult {
    const s = this.score;
    return { winner: s.defense > s.attack ? 'defense' : s.attack > s.defense ? 'attack' : 'tie', score: { ...s }, turns: this.turn };
  }
}

/** Código inicial de cada bando: funciona tal cual, para que se pueda mejorar a partir de ahí. */
export const DUEL_STARTER: Record<DuelRole, string> = {
  defense: `// DEFENSA: tu dron cuida la granja. Sumas puntos al cosechar
// (heno 1, madera 2 por arbusto, zanahoria 4) y ${DUEL_HACK_POINTS} por cada hackeo.
// getRivalPos() te dice dónde está el atacante: [x, y].

while (true) {
  const [rx, ry] = getRivalPos();
  // ¿El atacante está junto a mí? ¡Hackéalo!
  const cerca = Math.abs(rx - getPosX()) + Math.abs(ry - getPosY()) <= 1;
  if (cerca) {
    hack();
  }
  if (canHarvest()) {
    harvest();
  }
  move(East);
  if (getPosX() === 0) {
    move(North);
  }
}
`,
  attack: `// ATAQUE: tu dron intruso roba la granja. Sumas los puntos de cada
// cosecha madura que te lleves (y 1 por cada brote que arranques).
// Si la defensa te hackea pierdes turnos: getRivalPos() te dice dónde está.

while (true) {
  if (canHarvest()) {
    harvest();
  }
  move(West);
  if (getPosX() === getWorldSize() - 1) {
    move(South);
  }
}
`,
};

/** Reglas del duelo, para mostrarlas a los jugadores. */
export function duelRules(turns: number): string[] {
  return [
    `La partida dura ${turns} turnos. En cada turno la defensa hace una acción y después el ataque hace una.`,
    `Defensa: suma al cosechar (heno ${DUEL_ITEM_VALUE.hay}, arbusto ${DUEL_ITEM_VALUE.wood}, árbol ${DUEL_ITEM_VALUE.wood * 5}, zanahoria ${DUEL_ITEM_VALUE.carrot}) y ${DUEL_HACK_POINTS} puntos por cada hack() al atacante.`,
    'Ataque: se lleva los puntos de cada cosecha madura que robe con harvest() y 1 punto por cada brote que arranque.',
    'Un hackeo manda al atacante a su esquina y lo deja 4 turnos sin actuar; al volver tiene 3 turnos de protección.',
    'hack() solo funciona si el atacante está en tu casilla o en una vecina. getRivalPos() devuelve [x, y] del otro dron.',
    'El atacante no puede plantar, regar ni usar objetos. Nadie puede usar clear() ni comprar mejoras.',
    'Al terminar gana quien tenga más puntos.',
  ];
}
