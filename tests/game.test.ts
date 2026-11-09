import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Runner } from '../src/core/runner';
import { getProfile } from '../src/core/profiles';
import { analyze, hasBlockingErrors } from '../src/core/analyzer';
import { ruleSatisfied } from '../src/core/exam/grading';
import { GAME_GLOBAL_NAMES, gameGlobals, GameTheme, THEMES, themed } from '../src/core/game/api';
import { IntruderProgram } from '../src/core/game/intruder';
import { ALL_LEVELS, GameLevel, HACK_MISSIONS, LEVELS } from '../src/core/game/levels';
import { World } from '../src/core/game/world';

const std = getProfile('estandar');

/** Ejecuta un programa en un nivel o misión, sin animación, hasta cumplirlo, fallar o terminar. */
function play(level: GameLevel, code: string, theme: GameTheme = 'farm', timeoutMs = 20000): Promise<{ world: World; runner: Runner; log: string[]; failed: string | null; completed: boolean }> {
  const world = new World(level.world);
  const log: string[] = [];
  const label = (i: any) => THEMES[theme].itemLabel[i as keyof typeof THEMES.farm.itemLabel];
  let runner: Runner;
  let failed: string | null = null;
  let completed = false;
  const intruder = level.intruderCode ? new IntruderProgram(world, themed(level.intruderCode, theme), theme) : null;
  let turns = 0;
  const check = (finished: boolean) => {
    if (world.frozen) return;
    const c = level.check(world, label, { finished });
    if (c.done) {
      completed = true;
      world.frozen = true;
      runner.halt('ok');
    } else if (c.failed) {
      failed = c.failed;
      world.frozen = true;
      runner.halt('fallida');
    }
  };
  const globals = gameGlobals(world, {
    theme,
    actor: level.patch ? 'intruder' : 'main',
    delay: () => 0,
    log: (t) => log.push(t),
    onAction: () => {
      if (intruder && ++turns % (level.intruderEvery ?? 1) === 0) intruder.act();
      check(false);
    },
  });
  runner = new Runner({ code, profile: std, globals, onStep: () => world.addOps(1), loopWarnEvery: 1e9, onUpdate: (snap) => snap.status === 'finished' && check(true) });
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    runner.start('run');
    const h = setInterval(() => {
      const st = runner.getStatus();
      if (st === 'finished' || st === 'error' || st === 'stopped') {
        clearInterval(h);
        resolve({ world, runner, log, failed, completed });
      } else if (Date.now() - t0 > timeoutMs) {
        clearInterval(h);
        runner.stop();
        reject(new Error(`${level.id}: no terminó (${level.check(world, label, { finished: false }).progress})`));
      }
    }, 5);
  });
}

for (const level of ALL_LEVELS.filter((l) => !l.sandbox)) {
  test(`juego: la solución completa «${level.title}»`, async () => {
    // el editor no marca las funciones del dron como «no definidas»
    assert.deepEqual(analyze(level.solution, std, GAME_GLOBAL_NAMES).filter((d) => d.severity === 'error').map((d) => d.message), []);
    for (const r of level.rules ?? []) assert.ok(ruleSatisfied(level.solution, r), `regla: ${r.message}`);
    for (const r of level.requires ?? []) assert.ok(r.test(level.solution), `requisito: ${r.message}`);
    const { runner, failed, completed, world } = await play(level, level.solution);
    const snap = runner.snapshot();
    assert.equal(snap.error, null, snap.error?.message);
    assert.equal(failed, null);
    assert.ok(completed, level.check(world, (i) => i, { finished: true }).progress);
  });
}

test('hackeo: una respuesta equivocada no cumple la misión', async () => {
  const cond = HACK_MISSIONS.find((m) => m.id === 'hack-condicion')!;
  // con === el intruso destruye justo las zanahorias
  const wrong = await play(cond, cond.solution.replace('!==', '==='));
  assert.equal(wrong.completed, false);
  assert.match(wrong.failed ?? '', /zanahorias/);
  // el código inicial (sin completar) cosecha todo, zanahorias incluidas
  const inicial = await play(cond, cond.starter);
  assert.equal(inicial.completed, false);

  const tipos = HACK_MISSIONS.find((m) => m.id === 'hack-tipos')!;
  const sinCorregir = await play(tipos, tipos.starter);
  assert.equal(sinCorregir.completed, false);
  assert.ok(sinCorregir.failed);

  // sin replantar, el intruso deja menos de 12 arbustos
  const defensa = HACK_MISSIONS.find((m) => m.id === 'hack-defensa')!;
  const quieto = await play(defensa, 'while (true) {\n  move(North);\n}\n');
  assert.equal(quieto.completed, false);
  assert.match(quieto.failed ?? '', /arbustos/);
});

test('hackeo: el intruso corre su propio programa y hack() solo funciona de cerca', () => {
  const w = new World({ size: 5, seed: 'h', intruder: { x: 3, y: 3 } });
  const it = new IntruderProgram(w, 'while (true) {\n  harvest();\n  move(West);\n}\n', 'farm');
  it.act();
  it.act();
  assert.equal(w.intruder!.x, 2);
  assert.equal(w.stats.destroyed.grass, 1);
  assert.equal(w.hack(), false);
  assert.match(w.takeWarnings()[0], /lejos/);
  w.x = 2;
  w.y = 2;
  assert.equal(w.hack(), true);
  it.act();
  assert.equal(w.intruder!.x, 2, 'hackeado ya no se mueve');
  // código de apagado: suma de los dígitos del número de serie
  const digits = [...w.intruder!.serial].filter((c) => /\d/.test(c)).reduce((a, c) => a + Number(c), 0);
  assert.equal(w.shutdownCode(), digits);
});

test('juego: el tema de minería acepta sus propios nombres y los de la granja', async () => {
  const level = LEVELS.find((l) => l.id === 'zanahorias')!;
  const code = themed(level.solution, 'mine');
  assert.ok(code.includes('Entities.Copper') && code.includes('Grounds.Drilled') && code.includes('Items.Copper'));
  const { world } = await play(level, code, 'mine');
  assert.ok(world.items.carrot >= 20);
  // getEntityType() devuelve el nombre del tema
  const w = new World({ size: 3, seed: 'x' });
  const g = gameGlobals(w, { theme: 'mine', delay: () => 0, log: () => {} });
  assert.equal(g.getEntityType(), 'Stone');
  assert.equal(g.Entities.Grass, 'Stone');
  assert.equal(g.Entities.Stone, 'Stone');
});

test('juego: reglas del original (pasto, mover con vuelta, cosechar antes de tiempo)', () => {
  const w = new World({ size: 3, seed: 'reglas', unlocks: { carrots: 1 }, items: { wood: 5, hay: 5 } });
  // el dron da la vuelta en los bordes
  w.move('West');
  assert.equal(w.x, 2);
  // una zanahoria solo se planta en tierra
  assert.equal(w.plant('carrot'), false);
  assert.match(w.takeWarnings()[0], /till/);
  w.till();
  assert.equal(w.plant('carrot'), true);
  assert.equal(w.items.wood, 4);
  // cosecharla antes de tiempo la pierde
  w.harvest();
  assert.equal(w.stats.wasted, 1);
  assert.equal(w.cell().entity, null);
  // cada acción cuesta 200 operaciones
  assert.equal(w.ops, 200 * 5);
});

test('juego: calabazas gigantes y cactus ordenados', () => {
  const w = new World({ size: 3, seed: 'calabazas', fill: () => ({ ground: 'soil', entity: 'pumpkin', grown: true }) });
  // 3×3 calabazas maduras forman una gigante: rinde 3·3·3
  w.harvest();
  assert.equal(w.items.pumpkin, 27);
  const c = new World({ size: 2, seed: 'cactus', fill: (x, y) => ({ ground: 'soil', entity: 'cactus', grown: true }) });
  const nums = [3, 5, 4, 7];
  c.cells[0][0].entity!.number = nums[0];
  c.cells[1][0].entity!.number = nums[1];
  c.cells[0][1].entity!.number = nums[2];
  c.cells[1][1].entity!.number = nums[3];
  c.harvest();
  assert.equal(c.items.cactus, 16);
});

test('requisitos de los niveles nuevos: funciones propias, objetos y recursión', () => {
  const lv = (id: string) => LEVELS.find((l) => l.id === id)!;
  const fn = lv('mis-funciones').requires![0];
  assert.equal(fn.test(lv('mis-funciones').starter), false, 'declarar sin llamar no cuenta');
  assert.ok(fn.test('function f() { harvest(); }\nf();'));
  const rec = lv('recursion').requires![0];
  assert.equal(rec.test('function f(n) { harvest(); }\nf(3);'), false, 'llamarla desde fuera no es recursión');
  assert.ok(rec.test('function f(n) { if (n === 0) return; f(n - 1); }\nf(3);'));
  const obj = lv('pedido-objeto').requires![0];
  assert.equal(obj.test(lv('pedido-objeto').starter), false);
  assert.ok(obj.test('for (const k of Object.keys(pedido)) {}'));
});

test('logros: se desbloquean con el progreso', async () => {
  const { unlockedAchievements, ACHIEVEMENTS } = await import('../src/core/game/achievements');
  assert.deepEqual(unlockedAchievements({}), []);
  assert.deepEqual(unlockedAchievements({ 'primer-vuelo': { stars: 1 } }), ['primer-vuelo']);
  const all: Record<string, { stars: number }> = {};
  for (const l of ALL_LEVELS) all[l.id] = { stars: 3 };
  assert.equal(unlockedAchievements(all).length, ACHIEVEMENTS.length);
  assert.ok(unlockedAchievements({ 'hack-condicion': { stars: 2 } }).includes('primera-defensa'));
});

test('niveles personalizados: se crean, se comparten y se juegan', async () => {
  const { blankCustomLevel, parseCustomLevel, serializeCustomLevel, toGameLevel, resizeCustom } = await import('../src/core/game/custom');
  const d = resizeCustom({ ...blankCustomLevel('n1', 4), title: 'Fila de arbustos', goal: { kind: 'items', item: 'wood', amount: 4 } }, 4);
  d.entities = d.entities.map((col) => col.map((_, y) => (y === 0 ? 'bush' : 'grass')));
  d.mustUse = 'for';
  const shared = serializeCustomLevel(d);
  const back = parseCustomLevel(shared, 'n2');
  assert.equal(back.id, 'n2');
  assert.equal(back.title, 'Fila de arbustos');
  assert.deepEqual(back.entities, d.entities);
  assert.throws(() => parseCustomLevel('{"x":1}', 'n3'), /nivel/);
  // valores peligrosos o inválidos se corrigen
  const bad = parseCustomLevel(JSON.stringify({ format: 'psjavascript-nivel', level: { size: 99, entities: [['dragón']], goal: { kind: 'items', item: 'oro?', amount: -5 } } }), 'n4');
  assert.equal(bad.size, 10);
  assert.equal(bad.entities[0][0], 'grass');
  assert.equal(bad.goal.kind === 'items' && bad.goal.item, 'hay');
  // se juega como cualquier nivel
  const level = toGameLevel(back);
  const r = await play(level, 'for (let i = 0; i < 4; i++) {\n  harvest();\n  move(East);\n}\n');
  assert.ok(r.completed, 'se cumple el objetivo');
  assert.ok(level.rules!.every((rule) => ruleSatisfied('for (;;) {}', rule)));
});
