/**
 * Juego del dron: niveles para practicar JavaScript programando un dron de granja o de
 * minería (inspirado en «The Farmer Was Replaced»). Usa el mismo intérprete y editor del IDE.
 *
 * Distribución:
 * - Pantalla ancha: a la izquierda la meta, la misión (pestañas) y el editor con su barra de
 *   herramientas; a la derecha el tablero (ocupa todo el alto disponible) y la consola.
 * - Pantalla angosta: la meta arriba, pestañas Granja / Código / Misión y la barra de
 *   ejecución fija abajo.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { SPEED_MS, useGame } from '../../store/game';
import { confirmDialog, pickTextFile, saveTextFile } from '../../ui/platform';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import CodeEditor from '../CodeEditor';
import RichText from '../exam/RichText';
import { BackToEditorButton, Banner, Button, CodeBlock, IconButton, IconName, Pill, ProgressBar, ScreenHeader, Segmented, Tab, tint, Tooltip } from '../ui';
import { EntitySprite, ItemIcon } from './art';
import WorldView from './WorldView';
import { SpeedPicker, Stars, TrophiesModal, UnlockIcon } from './parts';
import { actionSound, playSound } from './sound';
import { ACHIEVEMENTS, unlockedAchievements } from '../../core/game/achievements';
import { blankCustomLevel, CUSTOM_PREFIX, CustomLevelData, serializeCustomLevel, toGameLevel } from '../../core/game/custom';
import { randomId } from '../../core/exam/random';
import LevelEditor from './LevelEditor';

type MissionTab = 'mission' | 'hints' | 'intruder' | 'docs';
type Pane = 'world' | 'code' | 'mission';
type BottomTab = 'console' | 'upgrades';

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
  /** Logros que se acaban de conseguir. */
  fresh: string[];
}

function GameInner() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const roomy = width >= 1280;
  const theme = useGame((s) => s.theme);
  const speed = useGame((s) => s.speed);
  const levelId = useGame((s) => s.levelId);
  const codeMap = useGame((s) => s.code);
  const progress = useGame((s) => s.progress);
  const fontSize = useApp((s) => s.settings.fontSize);
  const sounds = useApp((s) => s.settings.gameSounds);
  const soundRef = useRef(sounds);
  useEffect(() => {
    soundRef.current = sounds;
  }, [sounds]);
  const profile = useProfile();
  const custom = useGame((s) => s.custom);
  const customData = levelId.startsWith(CUSTOM_PREFIX) ? custom.find((c) => CUSTOM_PREFIX + c.id === levelId) : undefined;
  const level = useMemo(() => (customData ? toGameLevel(customData, theme) : getLevel(levelId)), [customData, levelId, theme]);
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
  /** El alumno cerró la tarjeta de resultado para ver el tablero. */
  const [resultHidden, setResultHidden] = useState(false);
  const [hints, setHints] = useState(0);
  const [missionTab, setMissionTab] = useState<MissionTab>('mission');
  const [missionOpen, setMissionOpen] = useState(true);
  const [pane, setPane] = useState<Pane>('mission');
  const [bottomTab, setBottomTab] = useState<BottomTab>('console');
  const [showDocs, setShowDocs] = useState(false);
  const [showTrophies, setShowTrophies] = useState(false);
  /** Nivel que se edita en el editor (nuevo o existente). */
  const [editing, setEditing] = useState<CustomLevelData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [diags, setDiags] = useState<Diagnostic[]>([]);
  const runner = useRef<Runner | null>(null);
  const speedRef = useRef(speed);
  const pendingRender = useRef(false);
  const levelBarRef = useRef<ScrollView>(null);
  const chipX = useRef<Record<string, number>>({});
  const consoleRef = useRef<ScrollView>(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => () => runner.current?.dispose(), []);

  // la barra de niveles muestra el nivel actual
  useEffect(() => {
    const h = setTimeout(() => {
      const x = chipX.current[level.id];
      if (x !== undefined) levelBarRef.current?.scrollTo({ x: Math.max(0, x - 140), animated: true });
    }, 80);
    return () => clearTimeout(h);
  }, [level.id]);

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
    setResultHidden(false);
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
    setResultHidden(false);
    setBottomTab('console');
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
          if (soundRef.current) playSound('fail');
          setFailed(c.failed);
          r.halt('💥 Misión fallida');
        }
        return;
      }
      w.frozen = true;
      w.sync();
      const rulesOk = (level.rules ?? []).every((rule) => ruleSatisfied(code, rule)) && (level.requires ?? []).every((r) => r.test(code));
      const fast = level.timeTarget ? w.time <= level.timeTarget : true;
      const stars = 1 + (rulesOk ? 1 : 0) + (rulesOk && fast ? 1 : 0);
      const before = unlockedAchievements(useGame.getState().progress);
      useGame.getState().complete(level.id, stars, w.time);
      const fresh = unlockedAchievements(useGame.getState().progress).filter((id) => !before.includes(id));
      setDone({ stars, time: w.time, rulesOk, fresh });
      if (soundRef.current) playSound('win');
      r.halt(level.kind === 'hack' ? '🛡️ ¡Misión cumplida!' : '🎉 ¡Nivel completado!');
    };
    const globals = gameGlobals(w, {
      theme,
      // en «completar» y «corregir», el código del editor controla al dron intruso
      actor: level.patch ? 'intruder' : 'main',
      delay: () => SPEED_MS[speedRef.current],
      log: (text) => r.log('warn', `⚠ ${text}`),
      onAction: (name, ok) => {
        if (soundRef.current && SPEED_MS[speedRef.current] > 0) actionSound(name, ok);
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
        if (snap.status === 'error' && soundRef.current) playSound('error');
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
    setMissionTab('mission');
    setMissionOpen(true);
    setPane('mission');
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
  const errorCount = diags.filter((d) => d.severity === 'error').length;
  const hackMode = level.kind === 'hack';
  const customMode = !!customData;
  const tone = hackMode ? t.danger : customMode ? t.accent : t.primary;
  const customLevels = useMemo(() => custom.map((c) => toGameLevel(c, theme)), [custom, theme]);
  const list = customMode ? customLevels : hackMode ? HACK_MISSIONS : LEVELS;
  const idx = list.findIndex((l) => l.id === level.id);
  const next = list[idx + 1];
  const unfinished = status === 'finished' && !done && !failed && !level.sandbox && !world.frozen;
  const earned = progress[level.id]?.stars ?? 0;
  const scored = list.filter((l) => !l.sandbox);
  const totalStars = scored.reduce((a, l) => a + (progress[l.id]?.stars ?? 0), 0);
  const progressText = check.progress.replace(/de (\w+)$/, (m, it) => `de ${THEMES[theme].itemLabel[it as ItemId] ?? it}`);

  // ───────────────────────────── encabezado y niveles ─────────────────────────────

  const header = (
    <ScreenHeader
      icon={hackMode ? 'bug-outline' : 'game-controller-outline'}
      title={wide ? (hackMode ? 'Juego del dron · Hackeo' : 'Juego del dron') : hackMode ? 'Hackeo' : 'Juego'}
      subtitle={`${names.title} · ★ ${totalStars} de ${scored.length * 3}`}
      color={tone}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <IconButton icon="trophy-outline" label="Logros" tooltip={`Logros: ${unlockedAchievements(progress).length} de ${ACHIEVEMENTS.length}`} onPress={() => setShowTrophies(true)} />
          <IconButton
            icon={sounds ? 'volume-high-outline' : 'volume-mute-outline'}
            label={sounds ? 'Silenciar el juego' : 'Activar sonidos'}
            tooltip={sounds ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
            onPress={() => useApp.getState().updateSettings({ gameSounds: !sounds })}
          />
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

  const levelBar = (
    <ScrollView
      ref={levelBarRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.levelBar, { borderBottomColor: t.border, backgroundColor: t.surface }]}
      contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8, gap: 6, alignItems: 'center' }}
    >
      <Segmented
        options={[
          { id: 'build', label: 'Construir', icon: 'hammer-outline' },
          { id: 'hack', label: 'Hackeo', icon: 'bug-outline' },
          { id: 'custom', label: wide ? 'Mis niveles' : 'Míos', icon: 'brush-outline' },
        ]}
        value={customMode ? 'custom' : hackMode ? 'hack' : 'build'}
        onChange={(m) => {
          if (m === 'custom') {
            // sin niveles propios todavía: se abre el editor
            if (customLevels.length) selectLevel(customLevels[0].id);
            else setEditing(blankCustomLevel(randomId('nivel')));
            return;
          }
          const target = m === 'hack' ? HACK_MISSIONS : LEVELS;
          // al cambiar de modo se abre el primero sin terminar
          selectLevel((target.find((l) => !progress[l.id]?.stars) ?? target[0]).id);
        }}
      />
      <View style={[styles.barDivider, { backgroundColor: t.border }]} />
      {list.map((l, i) => {
        const on = l.id === level.id;
        const p = progress[l.id];
        const c = hackMode ? t.danger : t.primary;
        return (
          <Pressable
            key={l.id}
            onLayout={(e) => {
              chipX.current[l.id] = e.nativeEvent.layout.x;
            }}
            onPress={() => selectLevel(l.id)}
            style={({ pressed }) => [styles.levelChip, { borderColor: on ? c : t.border, backgroundColor: on ? tint(c, 0.1) : pressed ? t.surfaceAlt : t.surface }]}
            accessibilityLabel={`${hackMode ? 'Misión' : 'Nivel'} ${i + 1}: ${l.title}`}
            accessibilityState={{ selected: on }}
          >
            <View style={[styles.levelNum, { backgroundColor: p?.stars ? c : on ? tint(c, 0.2) : t.surfaceAlt }]}>
              {p?.stars ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : l.sandbox ? (
                <Ionicons name="construct" size={12} color={on ? c : t.textMuted} />
              ) : (
                <Text style={{ color: on ? c : t.textMuted, fontWeight: '900', fontSize: 12 }}>{i + 1}</Text>
              )}
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={{ color: on ? c : t.text, fontWeight: '800', fontSize: 12 }} numberOfLines={1}>
                {l.title}
              </Text>
              {!l.sandbox ? <Stars n={p?.stars ?? 0} size={11} /> : <Text style={{ color: t.textMuted, fontSize: 11 }}>sin límite</Text>}
            </View>
          </Pressable>
        );
      })}
      {customMode ? (
        <>
          <Button label="Crear nivel" icon="add" size="sm" onPress={() => setEditing(blankCustomLevel(randomId('nivel')))} />
          <Button
            label="Importar"
            icon="cloud-upload-outline"
            size="sm"
            kind="ghost"
            onPress={async () => {
              setImportError(null);
              try {
                const f = await pickTextFile('.json');
                if (f) selectLevel(CUSTOM_PREFIX + useGame.getState().importCustom(f.text).id);
              } catch (e: any) {
                setImportError(e?.message ?? String(e));
              }
            }}
          />
        </>
      ) : null}
    </ScrollView>
  );

  // ───────────────────────────── meta y misión ─────────────────────────────

  const starRules =
    level.rules?.length || level.requires?.length || level.timeTarget ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <Pill text="★ Cumplir el objetivo" color={t.warning} />
        {level.rules?.length || level.requires?.length ? <Pill text={`★ ${[...(level.rules ?? []), ...(level.requires ?? [])].map((r) => r.message).join(' ')}`} color={t.warning} /> : null}
        {level.timeTarget ? <Pill text={`★ En ${level.timeTarget} s de juego o menos`} color={t.warning} /> : null}
      </View>
    ) : null;

  const kicker = customMode ? `NIVEL PERSONALIZADO ${idx + 1} DE ${customLevels.length}` : level.sandbox ? 'RETO LIBRE' : hackMode ? `MISIÓN ${idx + 1} DE ${HACK_MISSIONS.length} · ${(level.task ?? '').toUpperCase()}` : `NIVEL ${idx + 1} DE ${LEVELS.length - 1}`;

  const goalStrip = (
    <View style={[styles.goalStrip, { borderColor: hackMode ? tint(t.danger, 0.45) : t.border, backgroundColor: t.surface }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[styles.levelIcon, { backgroundColor: tint(tone, 0.14) }]}>
          <Ionicons name={level.icon as IconName} size={wide ? 20 : 18} color={tone} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: hackMode ? t.danger : t.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }} numberOfLines={1}>
            {kicker}
          </Text>
          <Text style={{ color: t.text, fontSize: wide ? 17 : 15, fontWeight: '900' }} numberOfLines={1}>
            {level.title}
          </Text>
        </View>
        {wide ? <Pill text={level.concept} icon="code-slash-outline" color={t.accent} /> : null}
        {!level.sandbox ? <Stars n={earned} size={wide ? 16 : 14} /> : null}
      </View>
      <View style={[styles.goalRow, { backgroundColor: t.surfaceAlt }]}>
        <Ionicons name={check.done ? 'checkmark-circle' : 'flag'} size={15} color={check.done ? t.success : tone} />
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 13, flex: 1, marginLeft: 6 }} numberOfLines={wide ? 2 : 3}>
          {themed(level.goal, theme)}
        </Text>
        {!level.sandbox ? (
          <Text style={{ color: check.done ? t.success : t.textMuted, fontSize: 12, fontWeight: '800', marginLeft: 8 }} numberOfLines={1}>
            {progressText}
          </Text>
        ) : null}
      </View>
      {!level.sandbox ? <ProgressBar value={check.ratio} color={check.done ? t.success : tone} height={6} style={{ marginTop: 6 }} /> : null}
      {wide ? starRules : null}
    </View>
  );

  const mineGlossary =
    theme === 'mine' ? (
      <View style={[styles.glossary, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
        <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 6 }}>EQUIVALENCIAS EN LA MINA</Text>
        <View style={styles.chipGrid}>
          {PLANTABLE.map((e) => (
            <View key={e} style={[styles.pairChip, { borderColor: t.border, backgroundColor: t.surface }]}>
              <EntitySprite type={e} theme="farm" size={20} />
              <Text style={[styles.pairText, { color: t.textMuted }]}>{THEMES.farm.entityLabel[e]}</Text>
              <Ionicons name="arrow-forward" size={11} color={t.textFaint} />
              <EntitySprite type={e} theme="mine" size={20} />
              <Text style={[styles.pairText, { color: t.text, fontWeight: '800' }]}>{names.entityLabel[e]}</Text>
            </View>
          ))}
          {(['hay', 'wood', 'power', 'water', 'fertilizer'] as ItemId[]).map((i) => (
            <View key={i} style={[styles.pairChip, { borderColor: t.border, backgroundColor: t.surface }]}>
              <ItemIcon item={i} theme="farm" size={18} />
              <Text style={[styles.pairText, { color: t.textMuted }]}>{THEMES.farm.itemLabel[i]}</Text>
              <Ionicons name="arrow-forward" size={11} color={t.textFaint} />
              <ItemIcon item={i} theme="mine" size={18} />
              <Text style={[styles.pairText, { color: t.text, fontWeight: '800' }]}>{names.itemLabel[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 6 }}>
          {`${THEMES.farm.groundLabel.grassland} → ${names.groundLabel.grassland} · ${THEMES.farm.groundLabel.soil} → ${names.groundLabel.soil}`}
        </Text>
      </View>
    ) : null;

  const customActions = customData ? (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      <Button label="Editar nivel" icon="create-outline" size="sm" onPress={() => setEditing(customData)} />
      <Button label="Compartir (archivo)" icon="share-outline" size="sm" onPress={() => saveTextFile(`nivel-${customData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dron'}.json`, serializeCustomLevel(customData), 'application/json')} />
      <Button
        label="Eliminar"
        icon="trash-outline"
        size="sm"
        kind="ghost"
        onPress={async () => {
          if (await confirmDialog('¿Eliminar el nivel?', `«${customData.title}» se borrará de este dispositivo. Compártelo antes si quieres conservarlo.`, 'Eliminar')) useGame.getState().deleteCustom(customData.id);
        }}
      />
    </View>
  ) : null;

  const missionBody = (
    <View>
      {customActions}
      {importError ? <Banner icon="alert-circle" color={t.danger} text={importError} onClose={() => setImportError(null)} /> : null}
      <RichText text={themed(level.intro, theme)} style={{ color: t.text, fontSize: 14, lineHeight: 21 }} />
      {mineGlossary}
    </View>
  );

  const hintsBody = level.hints.length ? (
    <View style={{ gap: 6 }}>
      {level.hints.slice(0, hints).map((h, i) => (
        <Banner key={i} icon="bulb-outline" color={t.accent} text={themed(h, theme)} />
      ))}
      {hints < level.hints.length ? (
        <Button label={hints ? `Otra pista (${level.hints.length - hints})` : `Ver una pista (${level.hints.length})`} icon="bulb-outline" kind="default" size="sm" onPress={() => setHints((h) => h + 1)} style={{ alignSelf: 'flex-start' }} />
      ) : (
        <Text style={{ color: t.textMuted, fontSize: 12 }}>Ya viste todas las pistas de este nivel.</Text>
      )}
    </View>
  ) : (
    <Text style={{ color: t.textMuted, fontSize: 13 }}>Este nivel no tiene pistas: ¡experimenta!</Text>
  );

  const intruderBody = level.intruderCode ? (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <Text style={{ color: t.text, fontSize: 13, flex: 1, minWidth: 180 }}>Lee su programa para anticipar qué hará. Es JavaScript de verdad.</Text>
        <Pill text={level.intruderEvery && level.intruderEvery > 1 ? `1 acción por cada ${level.intruderEvery} tuyas` : '1 acción por cada tuya'} icon="time-outline" color={t.danger} />
      </View>
      <CodeBlock code={themed(level.intruderCode, theme)} />
    </View>
  ) : null;

  const docsBody = (
    <View>
      {(['Acciones', 'Sensores', 'Granja libre', 'Hackeo'] as const).map((g) => (
        <View key={g} style={{ marginBottom: 10 }}>
          <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 4 }}>{g.toUpperCase()}</Text>
          {API_DOCS.filter((d) => d.group === g).map((d) => (
            <View key={d.name} style={[styles.docRow, { borderLeftColor: tint(t.accent, 0.5) }]}>
              <Text style={{ color: t.syntax.func, fontFamily: MONO, fontSize: 12, fontWeight: '700' }}>{themed(d.sig, theme)}</Text>
              <Text style={{ color: t.text, fontSize: 12, lineHeight: 17 }}>{d.doc}</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 4 }}>CONSTANTES</Text>
      <Text style={{ color: t.text, fontSize: 12, fontFamily: MONO, marginBottom: 6 }}>North, East, South, West</Text>
      <Text style={[styles.catalogLabel, { color: t.textMuted }]}>Entities ({theme === 'farm' ? 'plantas' : 'minerales'})</Text>
      <View style={styles.chipGrid}>
        {PLANTABLE.concat(['dead_pumpkin', 'treasure']).map((e) => (
          <View key={e} style={[styles.pairChip, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
            <EntitySprite type={e} theme={theme} size={22} />
            <View>
              <Text style={{ color: t.syntax.property, fontFamily: MONO, fontSize: 11, fontWeight: '700' }}>Entities.{names.entityKey[e]}</Text>
              <Text style={{ color: t.textMuted, fontSize: 10 }}>{names.entityLabel[e]}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.catalogLabel, { color: t.textMuted }]}>Items (recursos)</Text>
      <View style={styles.chipGrid}>
        {(Object.keys(names.itemKey) as ItemId[]).map((i) => (
          <View key={i} style={[styles.pairChip, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
            <ItemIcon item={i} theme={theme} size={20} />
            <View>
              <Text style={{ color: t.syntax.property, fontFamily: MONO, fontSize: 11, fontWeight: '700' }}>Items.{names.itemKey[i]}</Text>
              <Text style={{ color: t.textMuted, fontSize: 10 }}>{names.itemLabel[i]}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.catalogLabel, { color: t.textMuted }]}>Grounds (suelos)</Text>
      <Text style={{ color: t.text, fontSize: 12, fontFamily: MONO }}>
        Grounds.{names.groundKey.grassland} ({names.groundLabel.grassland}), Grounds.{names.groundKey.soil} ({names.groundLabel.soil})
      </Text>
    </View>
  );

  const missionTabs: { id: MissionTab; label: string; icon: IconName }[] = [
    { id: 'mission', label: hackMode ? 'Misión' : 'Lección', icon: 'document-text-outline' },
    { id: 'hints', label: 'Pistas', icon: 'bulb-outline' },
    ...(level.intruderCode ? [{ id: 'intruder' as const, label: 'Intruso', icon: 'radio-outline' as IconName }] : []),
    { id: 'docs', label: 'Funciones', icon: 'book-outline' },
  ];
  const tab = missionTabs.some((m) => m.id === missionTab) ? missionTab : 'mission';

  const missionPanel = (
    <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface }, missionOpen ? { maxHeight: '42%' } : null]}>
      <View style={[styles.tabRow, { borderBottomColor: missionOpen ? t.border : 'transparent' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {missionTabs.map((m) => (
            <Tab
              key={m.id}
              label={m.label}
              icon={m.icon}
              active={missionOpen && tab === m.id}
              compact={!roomy}
              onPress={() => {
                if (missionOpen && tab === m.id) setMissionOpen(false);
                else {
                  setMissionTab(m.id);
                  setMissionOpen(true);
                }
              }}
            />
          ))}
        </ScrollView>
        <IconButton icon={missionOpen ? 'chevron-up' : 'chevron-down'} label={missionOpen ? 'Ocultar explicación' : 'Mostrar explicación'} tooltip={missionOpen ? 'Ocultar (más espacio para el código)' : 'Mostrar la explicación'} onPress={() => setMissionOpen((v) => !v)} size={18} />
      </View>
      {missionOpen ? (
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ padding: 14 }}>
          {tab === 'mission' ? missionBody : tab === 'hints' ? hintsBody : tab === 'intruder' ? intruderBody : docsBody}
        </ScrollView>
      ) : null}
    </View>
  );

  // ───────────────────────────── ejecución y editor ─────────────────────────────

  const runButton =
    running && status !== 'paused' ? (
      <Button label="Detener" icon="stop" kind="danger" onPress={stop} />
    ) : (
      <Button
        label={status === 'paused' ? 'Continuar' : 'Ejecutar'}
        icon="play"
        kind="primary"
        disabled={blocking}
        onPress={() => {
          start('run');
          if (!wide) setPane('world');
        }}
      />
    );
  const stepDisabled = blocking || (running && status !== 'paused');
  const errorPill = blocking ? (
    <Pressable onPress={() => !wide && setPane('code')} accessibilityRole="button" accessibilityLabel="Hay errores en el código">
      <Pill text={wide ? `${errorCount || 1} error${errorCount === 1 ? '' : 'es'} en el código` : `${errorCount || 1}`} icon="alert-circle" color={t.danger} />
    </Pressable>
  ) : null;

  const toolbar = (
    <View style={[styles.toolbar, wide ? { borderBottomColor: t.border, borderBottomWidth: BORDER, backgroundColor: t.surface } : null]}>
      {runButton}
      {roomy ? (
        <Button label="Paso" icon="play-skip-forward-outline" onPress={() => start('step')} disabled={stepDisabled} />
      ) : (
        <IconButton icon="play-skip-forward-outline" label="Paso a paso" tooltip="Paso a paso: una instrucción a la vez" onPress={() => start('step')} disabled={stepDisabled} />
      )}
      <IconButton icon="refresh" label="Reiniciar" tooltip={level.sandbox ? 'Reiniciar el programa' : 'Reiniciar el nivel'} onPress={() => reset()} />
      {errorPill}
      <View style={{ flex: 1 }} />
      <SpeedPicker value={speed} onChange={(s) => useGame.getState().setSpeed(s)} cycle={!wide} />
    </View>
  );

  const patchBar = level.patch ? (
    <View style={[styles.patchBar, { backgroundColor: t.danger }]}>
      <Ionicons name="bug-outline" size={14} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 6, flex: 1 }}>Estás editando el sistema del dron intruso: este código lo ejecuta él</Text>
    </View>
  ) : null;

  const editor = (
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
  );

  // ───────────────────────────── tablero ─────────────────────────────

  const shownItems = (Object.keys(world.items) as ItemId[]).filter((i) => world.items[i] > 0);
  const here = world.cell();
  const it = world.intruder;
  const itSafe = !!it && (it.hacked || it.shutdown);
  const destroyed = Object.values(world.stats.destroyed).reduce((a: number, n) => a + (n ?? 0), 0);

  const invChips = shownItems.length ? (
    shownItems.map((i) => (
      <Tooltip key={i} text={names.itemLabel[i]}>
        <View style={[styles.invChip, { borderColor: t.border, backgroundColor: t.surfaceAlt }]} accessibilityLabel={`${names.itemLabel[i]}: ${Math.floor(world.items[i])}`}>
          <ItemIcon item={i} theme={theme} size={18} />
          <Text style={{ color: t.text, fontWeight: '900', fontSize: 13, marginLeft: 5 }}>{Math.floor(world.items[i]).toLocaleString()}</Text>
        </View>
      </Tooltip>
    ))
  ) : (
    <Text style={{ color: t.textMuted, fontSize: 12, paddingVertical: 4 }}>Inventario vacío: cosecha para conseguir recursos.</Text>
  );
  const meta = (
    <View style={[styles.hudMeta, wide ? null : { paddingTop: 0 }]}>
      <Ionicons name="time-outline" size={13} color={t.textMuted} />
      <Text style={[styles.hudMetaText, { color: t.textMuted }]}>{world.time.toFixed(1)} s</Text>
      <Ionicons name="hardware-chip-outline" size={13} color={t.textMuted} style={{ marginLeft: 8 }} />
      <Text style={[styles.hudMetaText, { color: t.textMuted }]}>{world.ops.toLocaleString()} ops</Text>
    </View>
  );
  // en pantalla angosta el inventario es una sola fila que se desliza
  const hud = wide ? (
    <View style={styles.hud}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, minWidth: 0 }}>{invChips}</View>
      {meta}
    </View>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {invChips}
    </ScrollView>
  );

  const statusLine = (
    <View style={styles.statusLine}>
      <View style={[styles.posChip, { backgroundColor: tint(t.accent, 0.12), borderColor: tint(t.accent, 0.4) }]}>
        <Ionicons name="navigate" size={12} color={t.accent} />
        <Text style={{ color: t.accentDark, fontFamily: MONO, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
          ({world.x}, {world.y})
        </Text>
      </View>
      <Text style={{ color: t.textMuted, fontSize: 12, flex: 1, minWidth: 120 }} numberOfLines={1}>
        {names.groundLabel[here.ground]}
        {here.entity
          ? ` · ${names.entityLabel[here.entity.type]}${here.entity.progress < 1 ? ` (${Math.round(here.entity.progress * 100)} %)` : here.entity.type === 'hedge' || here.entity.type === 'dead_pumpkin' ? '' : ' · lista'}`
          : ' · vacía'}
        {here.water > 0.05 ? ` · agua ${Math.round(here.water * 100)} %` : ''}
      </Text>
      {wide ? null : meta}
      {running && run?.line ? (
        <View style={[styles.lineChip, { borderColor: tint(t.warning, 0.5), backgroundColor: tint(t.warning, 0.12) }]} accessibilityLabel={`Ejecutando la línea ${run.line}`}>
          <Ionicons name="play" size={11} color={t.warning} />
          <Text style={{ color: t.text, fontFamily: MONO, fontSize: 12, marginLeft: 4, maxWidth: 260 }} numberOfLines={1}>
            {run.line}: {code.split('\n')[run.line - 1]?.trim()}
          </Text>
        </View>
      ) : null}
      {it ? (
        <Pill
          icon={itSafe ? 'shield-checkmark' : 'warning'}
          color={itSafe ? t.success : t.danger}
          text={`Intruso ${it.hacked ? 'hackeado' : it.shutdown ? 'apagado' : it.done ? 'sin programa' : 'activo'} en (${it.x}, ${it.y}) · destruyó ${destroyed}`}
        />
      ) : null}
      {(done || failed) && resultHidden ? <Button label="Resultado" icon="trophy-outline" size="sm" kind="default" onPress={() => setResultHidden(false)} /> : null}
    </View>
  );

  const resultOverlay =
    (done || failed) && !resultHidden ? (
      <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: tint(t.surface, 0.78) }]}>
        <View style={[styles.resultCard, { backgroundColor: t.surface, borderColor: done ? t.success : t.danger }]}>
          <Text style={{ fontSize: 42, lineHeight: 50 }}>{done ? (hackMode ? '🛡️' : '🎉') : '💥'}</Text>
          <Text style={{ color: t.text, fontSize: 19, fontWeight: '900', textAlign: 'center' }}>{done ? (hackMode ? themed('¡Misión cumplida! Tu granja está a salvo', theme) : '¡Nivel completado!') : 'Misión fallida'}</Text>
          {done ? <Stars n={done.stars} size={32} /> : null}
          {done?.fresh.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {done.fresh.map((id) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id)!;
                return <Pill key={id} icon={a.icon as IconName} text={`¡Logro: ${a.title}!`} color={t.warning} solid />;
              })}
            </View>
          ) : null}
          <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {done
              ? `${done.time.toFixed(1)} s de juego${!done.rulesOk ? ' · Para más estrellas cumple los requisitos del código' : level.timeTarget && done.time > level.timeTarget ? ` · La tercera estrella es en ${level.timeTarget} s o menos` : ''}`
              : failed}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 }}>
            {done && next ? <Button label={hackMode ? 'Siguiente misión' : 'Siguiente nivel'} icon="arrow-forward" kind="primary" onPress={() => selectLevel(next.id)} /> : null}
            <Button label={failed ? 'Reintentar' : 'Repetir'} icon="refresh" kind={failed ? 'primary' : 'default'} onPress={() => reset()} />
            <Button label="Ver tablero" icon="eye-outline" kind="ghost" onPress={() => setResultHidden(true)} />
          </View>
        </View>
      </View>
    ) : null;

  const stage = (
    <View style={[styles.stage, { borderColor: t.border, backgroundColor: t.surface }, wide ? { flex: 1 } : null]}>
      {hud}
      <WorldView world={world} theme={theme} version={version} fill={wide} maxSize={wide ? 640 : 460} />
      {statusLine}
      {resultOverlay}
    </View>
  );

  // ───────────────────────────── consola y mejoras ─────────────────────────────

  const output = (run?.output ?? []).filter((l) => l.kind !== 'canvas').slice(-150);
  const consoleBody = (
    <ScrollView
      ref={consoleRef}
      style={[styles.console, { backgroundColor: t.terminal.bg }, wide ? { flex: 1 } : { minHeight: 110, maxHeight: 260 }]}
      contentContainerStyle={{ padding: 10 }}
      onContentSizeChange={() => consoleRef.current?.scrollToEnd({ animated: false })}
    >
      {unfinished ? (
        <Text style={{ color: t.terminal.warn, fontSize: 12, marginBottom: 6, lineHeight: 18 }}>
          ⓘ El programa terminó, pero todavía no se cumple el objetivo. Revisa tu lógica (o usa un ciclo para que el dron siga trabajando).
        </Text>
      ) : null}
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
    </ScrollView>
  );

  const upgradesBody = level.sandbox ? (
    <View>
      {unlockList(theme).map((u) => {
        const cost = world.unlockCost(u.id);
        const lvl = world.unlocks[u.id];
        const can = !!cost && Object.entries(cost).every(([k, v]) => world.items[k as ItemId] >= (v as number));
        return (
          <View key={u.id} style={[styles.unlockRow, { borderBottomColor: t.border }]}>
            <View style={[styles.unlockIcon, { backgroundColor: t.surfaceAlt, borderColor: lvl ? tint(t.primary, 0.5) : t.border }]}>
              <UnlockIcon id={u.id} theme={theme} color={t.accentDark} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 13 }}>
                {u.label} <Text style={{ color: t.textMuted, fontFamily: MONO, fontSize: 11 }}>Unlocks.{u.key}</Text>
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                <Text style={{ color: lvl ? t.primaryDark : t.textMuted, fontSize: 11, fontWeight: '700' }}>{lvl ? `Nivel ${lvl}` : 'Sin comprar'}</Text>
                {cost ? (
                  Object.entries(cost).map(([k, v]) => {
                    const enough = world.items[k as ItemId] >= (v as number);
                    return (
                      <View key={k} style={[styles.costChip, { borderColor: enough ? tint(t.primary, 0.45) : tint(t.danger, 0.4), backgroundColor: enough ? tint(t.primary, 0.08) : tint(t.danger, 0.06) }]} accessibilityLabel={`Cuesta ${v} de ${names.itemLabel[k as ItemId]}`}>
                        <ItemIcon item={k as ItemId} theme={theme} size={14} />
                        <Text style={{ color: t.text, fontSize: 11, fontWeight: '800', marginLeft: 3 }}>{(v as number).toLocaleString()}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ color: t.textMuted, fontSize: 11 }}>· al máximo</Text>
                )}
              </View>
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
    </View>
  ) : null;

  const bottomPanel = (
    <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface, height: level.sandbox ? 210 : 170 }]}>
      <View style={[styles.tabRow, { borderBottomColor: t.border }]}>
        <Tab label="Consola" icon="terminal-outline" active={bottomTab === 'console'} onPress={() => setBottomTab('console')} badge={status === 'error' ? '!' : undefined} />
        {level.sandbox ? <Tab label="Mejoras" icon="trending-up-outline" active={bottomTab === 'upgrades'} onPress={() => setBottomTab('upgrades')} /> : null}
      </View>
      {bottomTab === 'upgrades' && level.sandbox ? <ScrollView contentContainerStyle={{ padding: 12 }}>{upgradesBody}</ScrollView> : consoleBody}
    </View>
  );

  const levelEditor = editing ? (
    <LevelEditor
      initial={editing}
      theme={theme}
      onClose={() => setEditing(null)}
      onSave={(d) => {
        useGame.getState().saveCustom(d);
        setEditing(null);
        // si es el nivel abierto, se vuelve a cargar con los cambios
        if (level.id === CUSTOM_PREFIX + d.id) reset(toGameLevel(d, theme));
        else selectLevel(CUSTOM_PREFIX + d.id);
      }}
    />
  ) : null;

  // ───────────────────────────── distribución ─────────────────────────────

  if (wide) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {header}
        {levelBar}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={[styles.column, { flex: 1.05, paddingRight: 6 }]}>
            {goalStrip}
            {missionPanel}
            <View style={[styles.panel, { flex: 1, borderColor: level.patch ? t.danger : t.border, backgroundColor: t.surface }]}>
              {toolbar}
              {patchBar}
              {editor}
            </View>
          </View>
          <View style={[styles.column, { flex: 1, paddingLeft: 6 }]}>
            {stage}
            {bottomPanel}
          </View>
        </View>
      {showTrophies ? <TrophiesModal progress={progress} onClose={() => setShowTrophies(false)} /> : null}
      {levelEditor}
      </View>
    );
  }

  const paneTabs: { id: Pane; label: string; icon: IconName; badge?: number | string }[] = [
    { id: 'world', label: names.title, icon: theme === 'farm' ? 'leaf-outline' : 'diamond-outline', badge: done || failed ? (done ? '★' : '!') : undefined },
    { id: 'code', label: 'Código', icon: 'code-slash-outline', badge: blocking ? errorCount || 1 : undefined },
    { id: 'mission', label: hackMode ? 'Misión' : 'Lección', icon: 'document-text-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {header}
      {levelBar}
      <View style={{ paddingHorizontal: 10, paddingTop: 8 }}>{goalStrip}</View>
      <View style={[styles.paneTabs, { borderBottomColor: t.border }]}>
        {paneTabs.map((p) => (
          <View key={p.id} style={{ flex: 1, alignItems: 'center' }}>
            <Tab label={p.label} icon={p.icon} active={pane === p.id} onPress={() => setPane(p.id)} badge={p.badge} />
          </View>
        ))}
      </View>
      {pane === 'world' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10, gap: 10, paddingBottom: 20 }}>
          {stage}
          <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface }]}>
            <View style={[styles.tabRow, { borderBottomColor: t.border }]}>
              <Tab label="Consola" icon="terminal-outline" active onPress={() => {}} />
            </View>
            {consoleBody}
          </View>
          {level.sandbox ? (
            <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface, padding: 12 }]}>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 6 }}>Mejoras</Text>
              {upgradesBody}
            </View>
          ) : null}
        </ScrollView>
      ) : pane === 'code' ? (
        <View style={{ flex: 1, padding: 10 }}>
          <View style={[styles.panel, { flex: 1, borderColor: level.patch ? t.danger : t.border, backgroundColor: t.surface }]}>
            {patchBar}
            {editor}
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 14, paddingBottom: 24 }}>
          <View>
            <Pill text={level.concept} icon="code-slash-outline" color={t.accent} />
            <View style={{ marginTop: 10 }}>{missionBody}</View>
            {starRules}
          </View>
          {level.intruderCode ? (
            <View>
              <Text style={[styles.sectionLabel, { color: t.danger }]}>PROGRAMA DEL DRON INTRUSO</Text>
              {intruderBody}
            </View>
          ) : null}
          <View>
            <Text style={[styles.sectionLabel, { color: t.textMuted }]}>PISTAS</Text>
            {hintsBody}
          </View>
          <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Pressable onPress={() => setShowDocs((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }} accessibilityRole="button">
              <Ionicons name="book-outline" size={16} color={t.accent} />
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, marginLeft: 6, flex: 1 }}>Funciones del {names.drone}</Text>
              <Ionicons name={showDocs ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
            </Pressable>
            {showDocs ? <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>{docsBody}</View> : null}
          </View>
          <Button label="Escribir el código" icon="code-slash-outline" kind="primary" onPress={() => setPane('code')} style={{ alignSelf: 'stretch' }} />
        </ScrollView>
      )}
      <View style={[styles.bottomBar, { borderTopColor: t.border, backgroundColor: t.surface, paddingBottom: insets.bottom + 8 }]}>{toolbar}</View>
      {showTrophies ? <TrophiesModal progress={progress} onClose={() => setShowTrophies(false)} /> : null}
      {levelEditor}
    </View>
  );
}

const styles = StyleSheet.create({
  levelBar: { flexGrow: 0, flexShrink: 0, borderBottomWidth: BORDER },
  barDivider: { width: 2, height: 28, borderRadius: 1, marginHorizontal: 2 },
  levelChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: BORDER, borderRadius: RADIUS.md, paddingVertical: 5, paddingHorizontal: 9, maxWidth: 210 },
  levelNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  levelIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  column: { minWidth: 0, padding: 12, gap: 10 },
  goalStrip: { borderWidth: BORDER, borderRadius: RADIUS.lg, padding: 12 },
  goalRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 7, marginTop: 10 },
  panel: { borderWidth: BORDER, borderRadius: RADIUS.lg, overflow: 'hidden' },
  tabRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: BORDER, paddingHorizontal: 4, flexShrink: 0 },
  glossary: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10, marginTop: 10 },
  docRow: { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 8 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, flexShrink: 0 },
  patchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  stage: { borderWidth: BORDER, borderRadius: RADIUS.lg, padding: 10, gap: 8, overflow: 'hidden' },
  hud: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  hudMeta: { flexDirection: 'row', alignItems: 'center', paddingTop: 5 },
  hudMetaText: { fontSize: 12, fontWeight: '700', marginLeft: 3, fontFamily: MONO },
  invChip: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.pill, paddingHorizontal: 9, paddingVertical: 2 },
  statusLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  lineChip: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  posChip: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  overlay: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  resultCard: { borderWidth: BORDER, borderRadius: RADIUS.lg, padding: 20, alignItems: 'center', gap: 6, maxWidth: 380, width: '100%' },
  console: {},
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  unlockIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, borderWidth: BORDER, alignItems: 'center', justifyContent: 'center' },
  costChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: RADIUS.pill, paddingHorizontal: 6, paddingVertical: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pairChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 3 },
  pairText: { fontSize: 11 },
  catalogLabel: { fontSize: 11, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  paneTabs: { flexDirection: 'row', borderBottomWidth: BORDER, marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  bottomBar: { borderTopWidth: BORDER, paddingTop: 0 },
});
