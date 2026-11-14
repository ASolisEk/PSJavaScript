/** Duelo de dos jugadores: defensa (dron de la granja) contra ataque (dron intruso). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUEL_STARTER, DuelConfig, DuelMatch } from '../src/core/game/duel';
import { DUEL_HACK_POINTS, DUEL_STUN_TURNS } from '../src/core/game/world';

const cfg = (p: Partial<DuelConfig> = {}): DuelConfig => ({ seed: 'prueba', turns: 80, theme: 'farm', ...p });
const QUIETO = 'while (true) { doAFlip(); }';

test('duelo: los programas iniciales juegan una partida completa y hay marcador', () => {
  const m = new DuelMatch(cfg(), DUEL_STARTER.defense, DUEL_STARTER.attack);
  const r = m.runAll();
  assert.equal(r.turns, 80);
  assert.equal(m.defense.error, null);
  assert.equal(m.attack.error, null);
  assert.ok(r.score.defense > 0, 'la defensa cosechó');
  assert.ok(r.score.attack > 0, 'el ataque robó');
  assert.equal(r.score.defense, r.score.harvested + r.score.hacks * DUEL_HACK_POINTS);
  assert.equal(r.score.attack, r.score.stolen + r.score.sprouts);
  assert.equal(r.winner, r.score.defense > r.score.attack ? 'defense' : r.score.attack > r.score.defense ? 'attack' : 'tie');
});

test('duelo: la misma semilla y los mismos programas dan el mismo resultado (aunque usen azar)', () => {
  const azar = `const dirs = [North, East, South, West];
while (true) {
  if (canHarvest()) harvest();
  move(dirs[Math.floor(Math.random() * 4)]);
}`;
  const a = new DuelMatch(cfg({ seed: 's1' }), azar, azar).runAll();
  const b = new DuelMatch(cfg({ seed: 's1' }), azar, azar).runAll();
  assert.deepEqual(a, b);
  const c = new DuelMatch(cfg({ seed: 's2' }), azar, azar).runAll();
  assert.notDeepEqual(a.score, c.score, 'otra semilla, otra partida');
});

test('duelo: el hackeo da puntos, manda al atacante a su esquina y lo deja sin actuar', () => {
  // la defensa persigue; el atacante camina hacia ella sin fijarse
  const cazador = `while (true) {
  const [rx, ry] = getRivalPos();
  const n = getWorldSize();
  const dx = (rx - getPosX() + n) % n;
  const dy = (ry - getPosY() + n) % n;
  if ((dx === 0 || dx === 1 || dx === n - 1) && (dy === 0 || dy === 1 || dy === n - 1) && Math.min(dx, n - dx) + Math.min(dy, n - dy) <= 1) {
    if (hack()) console.log("hackeado");
    else doAFlip();
  } else if (dx !== 0) move(dx <= n / 2 ? East : West);
  else move(dy <= n / 2 ? North : South);
}`;
  const m = new DuelMatch(cfg({ turns: 40 }), cazador, QUIETO);
  let stunnedAt = -1;
  while (m.step()) {
    if (stunnedAt < 0 && m.world.intruder!.stun) {
      stunnedAt = m.turn;
      // vuelve a su base y pierde turnos
      assert.deepEqual([m.world.intruder!.x, m.world.intruder!.y], [5, 5]);
      assert.equal(m.world.intruder!.stun, DUEL_STUN_TURNS - 1, 'ya pasó un turno');
    }
  }
  assert.ok(stunnedAt > 0, 'lo alcanzó');
  assert.ok(m.score.hacks >= 1);
  assert.equal(m.score.defense, m.score.harvested + m.score.hacks * DUEL_HACK_POINTS);
  assert.ok(m.defense.output.includes('hackeado'));
  assert.ok(m.events.some((e) => e.who === 'defense' && /hackeó/.test(e.text) && e.points === DUEL_HACK_POINTS));
  // mientras se reinicia no actúa: sus acciones son menos que los turnos
  assert.ok(m.world.stats.intruderActions <= 40 - DUEL_STUN_TURNS + 1);
});

test('duelo: el atacante no puede plantar, regar, reiniciar ni hackear', () => {
  const tramposo = `plant(Entities.Tree);
useItem(Items.Water);
clear();
console.log(hack());
while (true) { doAFlip(); }`;
  const m = new DuelMatch(cfg({ turns: 12 }), QUIETO, tramposo);
  m.runAll();
  assert.equal(m.world.count('tree'), 0);
  assert.equal(m.world.items.water, 20);
  assert.equal(m.world.count('bush'), 4, 'la granja sigue igual');
  assert.ok(m.attack.output.includes('false'));
  assert.equal(m.score.attack, 0);
});

test('duelo: un programa con error se detiene y la partida sigue; si los dos terminan, acaba antes', () => {
  const roto = 'move(East);\nnoExiste();';
  const m = new DuelMatch(cfg({ turns: 30 }), roto, DUEL_STARTER.attack);
  const r = m.runAll();
  assert.ok(m.defense.error);
  assert.equal(m.defense.errorLine, 2);
  assert.equal(r.turns, 30, 'el ataque siguió jugando');
  assert.ok(m.events.some((e) => e.who === 'defense' && /se detuvo/.test(e.text)));

  const sintaxis = new DuelMatch(cfg(), 'while (', QUIETO);
  assert.ok(sintaxis.defense.error, 'error de sintaxis');
  assert.equal(sintaxis.defense.alive, false);

  const corto = new DuelMatch(cfg({ turns: 200 }), 'harvest();', 'move(West);').runAll();
  assert.ok(corto.turns < 10, 'los dos programas terminaron');
});

test('duelo: robar una cosecha madura da sus puntos al ataque y no a la defensa', () => {
  // el atacante va al arbusto del centro (2 puntos); la defensa no hace nada
  const ladron = `move(West); move(West); move(South); move(South);
harvest();
while (true) { doAFlip(); }`;
  const m = new DuelMatch(cfg({ turns: 10 }), QUIETO, ladron);
  m.runAll();
  assert.equal(m.score.stolen, 2);
  assert.equal(m.score.attack, 2);
  assert.equal(m.score.defense, 0);
  assert.equal(m.world.items.wood, 30, 'lo robado no llega al inventario');
  assert.ok(m.events.some((e) => e.who === 'attack' && e.points === 2));
});
