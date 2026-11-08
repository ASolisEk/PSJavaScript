/**
 * Programa del dron intruso que corre al mismo tiempo que el del alumno (por turnos):
 * cada vez que el dron del alumno hace una acción, el intruso avanza hasta hacer la suya.
 * Es JavaScript de verdad, ejecutado por el mismo intérprete, así que el alumno puede
 * leerlo para anticipar qué hará.
 */
import { G, Interpreter } from '../interpreter/interpreter';
import { getProfile } from '../profiles';
import { gameGlobals, GameTheme } from './api';
import type { World } from './world';

/** Instrucciones como máximo por turno (por si el intruso entra en un ciclo sin acciones). */
const MAX_STEPS_PER_TURN = 20_000;

export class IntruderProgram {
  private gen: G<void>;
  private acted = false;
  /** El programa falló (error de JavaScript del intruso). */
  error: string | null = null;

  constructor(
    private world: World,
    code: string,
    theme: GameTheme,
  ) {
    const globals = gameGlobals(world, {
      theme,
      actor: 'intruder',
      delay: () => 0,
      log: () => {},
      onAction: () => {
        this.acted = true;
      },
    });
    const interp = new Interpreter(code, { profile: getProfile('flexible'), io: { write: () => {}, clear: () => {} }, globals });
    this.gen = interp.run();
  }

  /** El intruso termina su programa o ya fue detenido. */
  get finished(): boolean {
    return !!this.world.intruder?.done || this.world.intruderStopped();
  }

  /** Avanza el programa del intruso hasta que haga una acción. */
  act() {
    if (this.finished || !this.world.intruder) return;
    this.acted = false;
    try {
      for (let i = 0; i < MAX_STEPS_PER_TURN && !this.acted; i++) {
        if (this.gen.next().done) {
          this.world.intruder.done = true;
          return;
        }
      }
    } catch (e: any) {
      this.error = e?.value?.message ?? e?.message ?? String(e);
      this.world.intruder.done = true;
    }
  }
}
