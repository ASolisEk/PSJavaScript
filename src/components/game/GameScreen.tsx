/**
 * Juego del dron: niveles para practicar JavaScript programando un dron de granja o de
 * minería (inspirado en «The Farmer Was Replaced»). Usa el mismo intérprete y editor del IDE.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../ui/text';
import { analyze, Diagnostic, hasBlockingErrors } from '../../core/analyzer';
import { ruleSatisfied } from '../../core/exam/grading';
import { API_DOCS, GAME_GLOBAL_NAMES, gameGlobals, GameTheme, themed, THEMES, unlockList } from '../../core/game/api';
import { IntruderProgram } from '../../core/game/intruder';
import { GameLevel, getLevel, HACK_MISSIONS, LEVELS } from '../../core/game/levels';
import { EXPAND_SIZES, ItemId, PLANTABLE, World } from '../../core/game/world';
import { Runner, RunnerSnapshot } from '../../core/runner';
import { useApp, useProfile } from '../../store/app';
import { GameSpeed, SPEED_MS, useGame } from '../../store/game';
import { confirmDialog } from '../../ui/platform';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import CodeEditor from '../CodeEditor';
import RichText from '../exam/RichText';
import { BackToEditorButton, Banner, Button, Card, CodeBlock, IconName, Pill, ProgressBar, ScreenHeader, Segmented } from '../ui';
import WorldView from './WorldView';

const SPEEDS: { id: GameSpeed; label: string }[] = [
  { id: 'slow', label: 'Lento' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Rápido' },
  { id: 'instant', label: 'Al instante' },
];

function makeWorld(level: GameLevel): World {
  if (!level.sandbox) return new World(level.world);
  const { items, unlocks } = useGame.getState().sandbox;
  return new World({ ...level.world, size: EXPAND_SIZES[Math.min(unlocks.expand ?? 0, EXPAND_SIZES.length - 1)], items, unlocks });
}

export default function GameScreen() {
  const t = useTheme();
  const hydrated = useGame((s) => s.hydrated);
  useEffect(() => {
    useGame.getState().hydrate();
  }, []);
  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }
  return <GameInner />;
}

interface Done {
  stars: number;
  time: number;
  rulesOk: boolean;
}

function GameInner() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const theme = useGame((s) => s.theme);
  const speed = useGame((s) => s.speed);
  const levelId = useGame((s) => s.levelId);
  const codeMap = useGame((s) => s.code);
  const progress = useGame((s) => s.progress);
  const fontSize = useApp((s) => s.settings.fontSize);
  const profile = useProfile();
  const level = getLevel(levelId);
  const names = THEMES[theme];
  const starter = themed(level.starter, theme);
  const code = codeMap[level.id] ?? starter;
  const label = useCallback((i: ItemId) => THEMES[theme].itemLabel[i], [theme]);

  const [world, setWorld] = useState<World>(() => makeWorld(level));
  const [version, setVersion] = useState(0);
  const [run, setRun] = useState<RunnerSnapshot | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  /** Misión de hackeo fallida (mensaje). */
  const [failed, setFailed] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [diags, setDiags] = useState<Diagnostic[]>([]);
  const runner = useRef<Runner | null>(null);
  const speedRef = useRef(speed);
  const pendingRender = useRef(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => () => runner.current?.dispose(), []);

  // errores del editor (reconoce las funciones del dron)
  useEffect(() => {
    const h = setTimeout(() => {
      try {
        // en el juego el while (true) es lo normal: el programa se detiene al cumplir el objetivo
        setDiags(analyze(code, profile, GAME_GLOBAL_NAMES).filter((d) => d.rule !== 'infinite-loop'));
      } catch {
        setDiags([]);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [code, profile]);

  /** Redibuja la granja como mucho una vez por cuadro. */
  const bump = useCallback((w: World) => {
    if (pendingRender.current) return;
    pendingRender.current = true;
    requestAnimationFrame(() => {
      pendingRender.current = false;
      w.sync();
      setVersion((v) => v + 1);
    });
  }, []);

  const saveSandbox = useCallback(
    (w: World) => {
      if (level.sandbox) useGame.getState().saveSandbox({ items: { ...w.items }, unlocks: { ...w.unlocks } });
    },
    [level.sandbox],
  );

  const stop = () => runner.current?.stop();

  const reset = (lv: GameLevel = level) => {
    runner.current?.dispose();
    runner.current = null;
    setRun(null);
    setDone(null);
    setFailed(null);
    setWorld(makeWorld(lv));
  };

  const start = (mode: 'run' | 'step') => {
    const r0 = runner.current;
    if (r0 && mode === 'step' && r0.getStatus() === 'paused') return r0.stepOnce();
    if (r0 && r0.getStatus() === 'paused') return r0.resume('run');
    if (hasBlockingErrors(diags)) {
      setRun(null);
      return;
    }
    r0?.dispose();
    const w = makeWorld(level);
    setWorld(w);
    setDone(null);
    setFailed(null);
    let r: Runner;
    // misiones de hackeo: el intruso ejecuta su propio programa al mismo tiempo (por turnos)
    const intruder = level.intruderCode ? new IntruderProgram(w, themed(level.intruderCode, theme), theme) : null;
    let turns = 0;
    const checkGoal = (finished: boolean) => {
      if (level.sandbox || w.frozen) return;
      const c = level.check(w, label, { finished });
      if (!c.done) {
        if (c.failed) {
          w.frozen = true;
          setFailed(c.failed);
          r.halt('💥 Misión fallida');
        }
        return;
      }
      w.frozen = true;
      w.sync();
      const rulesOk = (level.rules ?? []).every((rule) => ruleSatisfied(code, rule));
      const fast = level.timeTarget ? w.time <= level.timeTarget : true;
      const stars = 1 + (rulesOk ? 1 : 0) + (rulesOk && fast ? 1 : 0);
      setDone({ stars, time: w.time, rulesOk });
      useGame.getState().complete(level.id, stars, w.time);
      r.halt(level.kind === 'hack' ? '🛡️ ¡Misión cumplida!' : '🎉 ¡Nivel completado!');
    };
    const globals = gameGlobals(w, {
      theme,
      // en «completar» y «corregir», el código del editor controla al dron intruso
      actor: level.patch ? 'intruder' : 'main',
      delay: () => SPEED_MS[speedRef.current],
      log: (text) => r.log('warn', `⚠ ${text}`),
      onAction: () => {
        if (intruder && ++turns % (level.intruderEvery ?? 1) === 0) {
          intruder.act();
          if (intruder.error) r.log('warn', `⚠ El programa del intruso falló: ${intruder.error}`);
        }
        bump(w);
        checkGoal(false);
      },
    });
    r = new Runner({
      code,
      profile,
      globals,
      onStep: () => w.addOps(1),
      realTime: true,
      trackDesktop: false,
      speed: 0,
      loopWarnEvery: 20_000_000,
      onUpdate: (snap) => {
        setRun(snap);
        bump(w);
        if (snap.status === 'finished') checkGoal(true);
        if (snap.status === 'finished' || snap.status === 'error' || snap.status === 'stopped') saveSandbox(w);
      },
    });
    runner.current = r;
    r.start(mode);
  };

  const selectLevel = (id: string) => {
    runner.current?.dispose();
    runner.current = null;
    useGame.getState().selectLevel(id);
    setHints(0);
    setShowIntro(true);
    reset(getLevel(id));
  };

  const setTheme = (th: GameTheme) => {
    runner.current?.stop();
    useGame.getState().setTheme(th);
  };

  const status = run?.status;
  const running = status === 'running' || status === 'paused' || status === 'input';
  const check = level.check(world, label, { finished: status === 'finished' });
  const blocking = hasBlockingErrors(diags);
  const hackMode = level.kind === 'hack';
  const list = hackMode ? HACK_MISSIONS : LEVELS;
  const idx = list.indexOf(level);
  const next = list[idx + 1];
  const unfinished = status === 'finished' && !done && !failed && !level.sandbox && !world.frozen;

  // ───────────────────────────── piezas ─────────────────────────────

  const levelBar = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.levelBar, { borderBottomColor: t.border, backgroundColor: t.surface }]} contentContainerStyle={{ padding: 8, gap: 6 }}>
      <Segmented
        options={[
          { id: 'build', label: 'Construir', icon: 'hammer-outline' },
          { id: 'hack', label: 'Hackeo', icon: 'bug-outline' },
        ]}
        value={hackMode ? 'hack' : 'build'}
        onChange={(m) => {
          const target = m === 'hack' ? HACK_MISSIONS : LEVELS;
          // al cambiar de modo se abre el primero sin terminar
          selectLevel((target.find((l) => !progress[l.id]?.stars) ?? target[0]).id);
        }}
      />
      {list.map((l, i) => {
        const on = l.id === level.id;
        const p = progress[l.id];
        return (
          <Pressable key={l.id} onPress={() => selectLevel(l.id)} style={[styles.levelChip, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary + '18' : t.surface }]} accessibilityLabel={`${hackMode ? 'Misión' : 'Nivel'} ${i + 1}: ${l.title}`}>
            <View style={[styles.levelNum, { backgroundColor: p?.stars ? t.primary : on ? t.primary + '30' : t.surfaceAlt }]}>
              {l.sandbox ? <Ionicons name="construct" size={13} color={p?.stars || on ? (p?.stars ? '#fff' : t.primary) : t.textMuted} /> : <Text style={{ color: p?.stars ? '#fff' : on ? t.primary : t.textMuted, fontWeight: '900', fontSize: 12 }}>{i + 1}</Text>}
            </View>
            <View>
              <Text style={{ color: on ? t.primary : t.text, fontWeight: '800', fontSize: 12 }} numberOfLines={1}>
                {l.title}
              </Text>
              {!l.sandbox ? (
                <Text style={{ color: t.warning, fontSize: 11, letterSpacing: 1 }}>
                  {'★'.repeat(p?.stars ?? 0)}
                  <Text style={{ color: t.border }}>{'★'.repeat(3 - (p?.stars ?? 0))}</Text>
                </Text>
              ) : (
                <Text style={{ color: t.textMuted, fontSize: 11 }}>sin límite</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const levelCard = (
    <Card style={{ marginBottom: 8 }}>
      <Pressable onPress={() => setShowIntro((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.levelIcon, { backgroundColor: t.primary + '1f' }]}>
          <Ionicons name={level.icon as IconName} size={20} color={t.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: hackMode ? t.danger : t.textMuted, fontSize: 11, fontWeight: '800' }}>
            {level.sandbox ? 'RETO LIBRE' : hackMode ? `MISIÓN ${idx + 1} DE ${HACK_MISSIONS.length} · ${(level.task ?? '').toUpperCase()}` : `NIVEL ${idx + 1} DE ${LEVELS.length - 1}`}
          </Text>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '900' }}>{level.title}</Text>
        </View>
        <Pill text={level.concept} icon="code-slash-outline" color={t.accent} />
        <Ionicons name={showIntro ? 'chevron-up' : 'chevron-down'} size={18} color={t.textMuted} />
      </Pressable>
      {showIntro ? (
        <View style={{ marginTop: 10 }}>
          <RichText text={themed(level.intro, theme)} style={{ color: t.text, fontSize: 14, lineHeight: 21 }} />
          {theme === 'mine' ? (
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
              <Text style={{ fontWeight: '800' }}>En la mina: </Text>
              {PLANTABLE.map((e) => `${THEMES.farm.entityEmoji[e]} ${THEMES.farm.entityLabel[e]} → ${names.entityEmoji[e]} ${names.entityLabel[e]}`).join(' · ')}
              {' · '}
              {(['hay', 'wood', 'power', 'water'] as ItemId[]).map((i) => `${THEMES.farm.itemLabel[i]} → ${names.itemLabel[i]}`).join(' · ')}
              {' · '}
              {`${THEMES.farm.groundLabel.grassland} → ${names.groundLabel.grassland} · ${THEMES.farm.groundLabel.soil} → ${names.groundLabel.soil}`}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.goal, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Ionicons name="flag-outline" size={15} color={t.primary} />
          <Text style={{ color: t.text, fontWeight: '800', flex: 1 }}>{themed(level.goal, theme)}</Text>
        </View>
        {!level.sandbox ? <ProgressBar value={check.ratio} color={check.done ? t.success : t.primary} /> : null}
        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>{check.progress.replace(/de (\w+)$/, (m, it) => `de ${THEMES[theme].itemLabel[it as ItemId] ?? it}`)}</Text>
        {level.rules?.length || level.timeTarget ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <Pill text="★ Cumplir el objetivo" color={t.warning} />
            {level.rules?.length ? <Pill text={`★ ${level.rules.map((r) => r.message).join(' ')}`} color={t.warning} /> : null}
            {level.timeTarget ? <Pill text={`★ En ${level.timeTarget} s de juego o menos`} color={t.warning} /> : null}
          </View>
        ) : null}
      </View>
      {level.hints.length ? (
        <View style={{ marginTop: 8 }}>
          {level.hints.slice(0, hints).map((h, i) => (
            <Banner key={i} icon="bulb-outline" color={t.accent} text={themed(h, theme)} />
          ))}
          {hints < level.hints.length ? <Button label={hints ? 'Otra pista' : 'Ver una pista'} icon="bulb-outline" kind="ghost" size="sm" onPress={() => setHints((h) => h + 1)} style={{ alignSelf: 'flex-start' }} /> : null}
        </View>
      ) : null}
    </Card>
  );

  const controls = (
    <View style={[styles.controls, { borderColor: t.border, backgroundColor: t.surface }]}>
      {running && status !== 'paused' ? (
        <Button label="Detener" icon="stop" kind="danger" onPress={stop} />
      ) : (
        <Button label={status === 'paused' ? 'Continuar' : 'Ejecutar'} icon="play" kind="primary" onPress={() => start('run')} disabled={blocking} />
      )}
      <Button label="Paso" icon="play-skip-forward-outline" onPress={() => start('step')} disabled={blocking || (running && status !== 'paused')} />
      <Button label="Reiniciar" icon="refresh" kind="ghost" onPress={() => reset()} />
      <View style={{ flex: 1 }} />
      <Segmented options={SPEEDS} value={speed} onChange={(s) => useGame.getState().setSpeed(s)} />
    </View>
  );

  const editor = (
    <View style={[styles.editor, { borderColor: level.patch ? t.danger : t.border }, wide ? { flex: 1 } : { height: 360 }]}>
      {level.patch ? (
        <View style={[styles.patchBar, { backgroundColor: t.danger }]}>
          <Ionicons name="bug-outline" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Estás editando el sistema del dron intruso: este código lo ejecuta él</Text>
        </View>
      ) : null}
      <CodeEditor
        code={code}
        onChange={(c) => useGame.getState().setCode(level.id, c === starter ? null : c)}
        breakpoints={[]}
        onToggleBreakpoint={() => {}}
        execLine={running ? run?.line ?? null : null}
        errorLine={status === 'error' ? run?.error?.line ?? null : null}
        diagnostics={diags}
        fontSize={fontSize}
        listenRequests={false}
      />
    </View>
  );

  const output = (run?.output ?? []).filter((l) => l.kind !== 'canvas').slice(-150);
  const consoleView = (
    <View style={[styles.console, { backgroundColor: t.terminal.bg }]}>
      <Text style={{ color: t.terminal.muted, fontSize: 11, fontWeight: '800', marginBottom: 4 }}>CONSOLA</Text>
      {output.length ? (
        output.map((l) => (
          <Text
            key={l.id}
            selectable
            style={{ fontFamily: MONO, fontSize: 12, lineHeight: 18, color: l.kind === 'error' ? t.terminal.error : l.kind === 'warn' ? t.terminal.warn : l.kind === 'system' ? t.terminal.muted : t.terminal.text }}
          >
            {l.text || ' '}
          </Text>
        ))
      ) : (
        <Text style={{ color: t.terminal.muted, fontFamily: MONO, fontSize: 12 }}>Usa console.log() para ver valores aquí.</Text>
      )}
      {run?.notice ? <Text style={{ color: t.terminal.warn, fontFamily: MONO, fontSize: 12 }}>{run.notice}</Text> : null}
      {run?.error?.hint ? <Text style={{ color: t.terminal.muted, fontSize: 12, marginTop: 4 }}>{run.error.hint.solutions?.[0] ?? ''}</Text> : null}
    </View>
  );

  const shownItems = (Object.keys(world.items) as ItemId[]).filter((i) => world.items[i] > 0);
  const stats = (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {shownItems.length ? (
          shownItems.map((i) => <Pill key={i} text={`${names.itemEmoji[i]} ${names.itemLabel[i]}: ${Math.floor(world.items[i])}`} color={t.primary} />)
        ) : (
          <Text style={{ color: t.textMuted, fontSize: 12 }}>Aún no tienes recursos.</Text>
        )}
      </View>
      <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 6 }}>
        Posición ({world.x}, {world.y}) · {names.groundLabel[world.cell().ground]}
        {world.cell().entity ? ` · ${names.entityLabel[world.cell().entity!.type]}${world.cell().entity!.progress < 1 ? ` (${Math.round(world.cell().entity!.progress * 100)} %)` : ''}` : ''} · Tiempo {world.time.toFixed(1)} s · {world.ops.toLocaleString()} operaciones
      </Text>
    </View>
  );

  const it = world.intruder;
  const intruderLine = it ? (
    <View style={[styles.intruderLine, { borderColor: it.hacked || it.shutdown ? t.success : t.danger }]}>
      <Ionicons name={it.hacked || it.shutdown ? 'shield-checkmark' : 'warning'} size={15} color={it.hacked || it.shutdown ? t.success : t.danger} />
      <Text style={{ color: t.text, fontSize: 12, marginLeft: 6, flex: 1 }}>
        Dron intruso en ({it.x}, {it.y}) · {it.hacked ? 'hackeado' : it.shutdown ? 'apagado' : it.done ? 'terminó su programa' : 'activo'} · destruyó {Object.values(world.stats.destroyed).reduce((a, n) => a + (n ?? 0), 0)} planta(s)
      </Text>
    </View>
  ) : null;

  const intruderProgram = level.intruderCode ? (
    <Card style={{ marginTop: 10 }} accent={t.danger}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name="radio-outline" size={16} color={t.danger} />
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, marginLeft: 6, flex: 1 }}>Programa del dron intruso</Text>
        <Pill text={level.intruderEvery && level.intruderEvery > 1 ? `1 acción por cada ${level.intruderEvery} tuyas` : '1 acción por cada tuya'} color={t.danger} />
      </View>
      <CodeBlock code={themed(level.intruderCode, theme)} />
    </Card>
  ) : null;

  const doneBanner = done ? (
    <Card accent={t.success} style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 30 }}>🎉</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '900' }}>{hackMode ? themed('¡Misión cumplida! Tu granja está a salvo', theme) : '¡Nivel completado!'}</Text>
          <Text style={{ color: t.warning, fontSize: 20, letterSpacing: 2 }}>
            {'★'.repeat(done.stars)}
            <Text style={{ color: t.border }}>{'★'.repeat(3 - done.stars)}</Text>
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>
            {done.time.toFixed(1)} s de juego
            {!done.rulesOk ? ' · Para más estrellas cumple los requisitos del código' : level.timeTarget && done.time > level.timeTarget ? ` · La tercera estrella es en ${level.timeTarget} s o menos` : ''}
          </Text>
        </View>
        {next ? <Button label={hackMode ? 'Siguiente misión' : 'Siguiente nivel'} icon="arrow-forward" kind="primary" onPress={() => selectLevel(next.id)} /> : null}
      </View>
    </Card>
  ) : failed ? (
    <Card accent={t.danger} style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 28 }}>💥</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '900' }}>Misión fallida</Text>
          <Text style={{ color: t.textMuted, fontSize: 13 }}>{failed}</Text>
        </View>
        <Button label="Reintentar" icon="refresh" onPress={() => reset()} />
      </View>
    </Card>
  ) : unfinished ? (
    <View style={{ marginTop: 10 }}>
      <Banner icon="information-circle-outline" color={t.warning} text="El programa terminó, pero todavía no se cumple el objetivo. Revisa tu lógica (o usa un ciclo para que el dron siga trabajando)." />
    </View>
  ) : null;

  const sandboxPanel = level.sandbox ? (
    <Card style={{ marginTop: 10 }}>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 6 }}>Mejoras</Text>
      {unlockList(theme).map((u) => {
        const cost = world.unlockCost(u.id);
        const lvl = world.unlocks[u.id];
        const can = !!cost && Object.entries(cost).every(([k, v]) => world.items[k as ItemId] >= (v as number));
        return (
          <View key={u.id} style={[styles.unlockRow, { borderBottomColor: t.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 13 }}>
                {u.label} <Text style={{ color: t.textMuted, fontFamily: MONO, fontSize: 11 }}>Unlocks.{u.key}</Text>
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 11 }}>
                {lvl ? `Nivel ${lvl}` : 'Sin comprar'}
                {cost ? ` · cuesta ${Object.entries(cost).map(([k, v]) => `${v} ${names.itemLabel[k as ItemId]}`).join(', ')}` : ' · al máximo'}
              </Text>
            </View>
            <Button
              label="Comprar"
              size="sm"
              kind={can ? 'primary' : 'default'}
              disabled={!can || running}
              onPress={() => {
                world.unlock(u.id);
                world.takeWarnings();
                saveSandbox(world);
                bump(world);
              }}
            />
          </View>
        );
      })}
      <Button
        label="Empezar de cero"
        icon="trash-outline"
        kind="ghost"
        size="sm"
        style={{ alignSelf: 'flex-start', marginTop: 6 }}
        onPress={async () => {
          if (!(await confirmDialog('¿Empezar de cero?', 'Se borrarán los recursos y mejoras de tu granja libre.', 'Borrar'))) return;
          useGame.getState().resetSandbox();
          reset();
        }}
      />
    </Card>
  ) : null;

  const docs = (
    <Card style={{ marginTop: 10 }}>
      <Pressable onPress={() => setShowDocs((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="book-outline" size={16} color={t.accent} />
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginLeft: 6, flex: 1 }}>Funciones del {names.drone}</Text>
        <Ionicons name={showDocs ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
      </Pressable>
      {showDocs ? (
        <View style={{ marginTop: 8 }}>
          {(['Acciones', 'Sensores', 'Granja libre', 'Hackeo'] as const).map((g) => (
            <View key={g} style={{ marginBottom: 8 }}>
              <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 4 }}>{g.toUpperCase()}</Text>
              {API_DOCS.filter((d) => d.group === g).map((d) => (
                <View key={d.name} style={{ marginBottom: 6 }}>
                  <Text style={{ color: t.syntax.func, fontFamily: MONO, fontSize: 12, fontWeight: '700' }}>{themed(d.sig, theme)}</Text>
                  <Text style={{ color: t.text, fontSize: 12, lineHeight: 17 }}>{d.doc}</Text>
                </View>
              ))}
            </View>
          ))}
          <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 4 }}>CONSTANTES</Text>
          <Text style={{ color: t.text, fontSize: 12, lineHeight: 19 }}>
            <Text style={{ fontFamily: MONO }}>North, East, South, West</Text>
            {'\n'}
            {PLANTABLE.concat(['dead_pumpkin', 'treasure']).map((e) => (
              <Text key={e}>
                {names.entityEmoji[e]} <Text style={{ fontFamily: MONO }}>Entities.{names.entityKey[e]}</Text>
                {'   '}
              </Text>
            ))}
            {'\n'}
            {(Object.keys(names.itemKey) as ItemId[]).map((i) => (
              <Text key={i}>
                {names.itemEmoji[i]} <Text style={{ fontFamily: MONO }}>Items.{names.itemKey[i]}</Text>
                {'   '}
              </Text>
            ))}
            {'\n'}
            <Text style={{ fontFamily: MONO }}>
              Grounds.{names.groundKey.grassland}, Grounds.{names.groundKey.soil}
            </Text>
          </Text>
        </View>
      ) : null}
    </Card>
  );

  const header = (
    <ScreenHeader
      icon="game-controller-outline"
      title={hackMode ? 'Juego del dron · Hackeo' : 'Juego del dron'}
      subtitle={`${names.title} · ${level.title}`}
      color={t.primary}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Segmented
            options={[
              { id: 'farm', label: wide ? 'Granja' : '🌾', icon: wide ? 'leaf-outline' : undefined },
              { id: 'mine', label: wide ? 'Minería' : '⛏️', icon: wide ? 'hammer-outline' : undefined },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as GameTheme)}
          />
          <BackToEditorButton
            onPress={() => {
              runner.current?.stop();
              useApp.getState().setAppMode('ide');
            }}
          />
        </View>
      }
    />
  );

  const farmSide = (
    <>
      <WorldView world={world} theme={theme} version={version} maxSize={wide ? 520 : 420} />
      {stats}
      {intruderLine}
      {doneBanner}
      {intruderProgram}
      {sandboxPanel}
      <View style={{ marginTop: 10 }}>{consoleView}</View>
      {docs}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {header}
      {levelBar}
      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1.1, minWidth: 0, padding: 12, paddingRight: 6 }}>
            <ScrollView style={{ flexGrow: 0, maxHeight: '45%' }}>{levelCard}</ScrollView>
            {controls}
            {editor}
          </View>
          <ScrollView style={{ flex: 1, borderLeftWidth: BORDER, borderLeftColor: t.border }} contentContainerStyle={{ padding: 12 }}>
            {farmSide}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {levelCard}
          <WorldView world={world} theme={theme} version={version} maxSize={420} />
          {stats}
          {intruderLine}
          {doneBanner}
          {intruderProgram}
          <View style={{ marginTop: 10 }}>{controls}</View>
          {editor}
          {sandboxPanel}
          <View style={{ marginTop: 10 }}>{consoleView}</View>
          {docs}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  levelBar: { flexGrow: 0, flexShrink: 0, borderBottomWidth: BORDER },
  levelChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: BORDER, borderRadius: RADIUS.md, paddingVertical: 6, paddingHorizontal: 10, maxWidth: 220 },
  levelNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  levelIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  goal: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10, marginTop: 10 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, borderWidth: BORDER, borderRadius: RADIUS.md, padding: 8, marginBottom: 8 },
  editor: { borderWidth: BORDER, borderRadius: RADIUS.md, overflow: 'hidden' },
  console: { borderRadius: RADIUS.md, padding: 10, minHeight: 80 },
  patchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5 },
  intruderLine: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
});

