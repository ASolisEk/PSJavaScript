/**
 * Mascota guía: un gatito que reacciona al estado del programa y a la persona.
 *  - reposo: respira, mueve la cola, parpadea; se duerme tras un rato sin actividad
 *  - error (sintaxis o ejecución): tiembla, mira nervioso, "???", sudor y una mosca
 *  - ejecutando: corre tecleando, con destellos y símbolos de código
 *  - mareado: ojos en espiral y estrellas cuando parece haber un ciclo infinito
 *  - acariciado (mantener presionado): ronronea, corazones y vibración suave
 * Además: celebra con confeti al corregir un error, se puede arrastrar a
 * cualquier lugar (recuerda la posición) y al tocarlo muestra un menú de atajos.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useActiveFile, useApp } from '../store/app';
import { useTheme } from '../ui/theme';
import { easeOut, ND, to, useValue } from './mascot/anim';
import { Confetti, DizzyLayer, PetLayer } from './mascot/extras';
import { ErrorLayer, IdleLayer, RunningLayer } from './mascot/layers';
import { BOX } from './mascot/sprites';

type Mood = 'idle' | 'error' | 'running' | 'dizzy' | 'pet';
const MOODS: Mood[] = ['idle', 'error', 'running', 'dizzy', 'pet'];

const SLEEP_AFTER_MS = 45_000;
/** Pasos a partir de los cuales una ejecución rápida "marea" a la mascota. */
const DIZZY_STEPS = 150_000;
const HAPTICS = Platform.OS !== 'web';

const TIPS = [
  '¡Hola! Soy Michi 🐾 Tócame para ver atajos, mantén presionado para acariciarme o arrástrame.',
  'Toca un número de línea para poner un punto de interrupción.',
  'prompt() siempre devuelve texto: conviértelo con Number().',
  'En la pestaña Diagrama verás tu programa como diagrama de flujo.',
  'La prueba de escritorio muestra cómo cambian tus variables.',
  'Puedes exportar tu código a PSeInt, Python y más.',
  'Usa === para comparar: no convierte los tipos.',
];

function useProgram() {
  const status = useApp((s) => s.run?.status ?? 'idle');
  const runError = useApp((s) => s.run?.error ?? null);
  // solo cambia al terminar (evita re-render en cada paso)
  const finishedAt = useApp((s) => (s.run?.status === 'finished' ? s.run.stepCount : -1));
  const dizzy = useApp(
    (s) =>
      !!s.run &&
      ((s.run.status === 'running' && s.run.mode === 'run' && s.run.stepCount > DIZZY_STEPS) ||
        (s.run.status === 'paused' && !!s.run.notice && /ciclo infinito/i.test(s.run.notice))),
  );
  const diagnostics = useApp((s) => s.diagnostics);
  const staticError = diagnostics.find((d) => d.severity === 'error' && d.rule === 'syntax') ?? diagnostics.find((d) => d.severity === 'error');
  return { status, runError, finishedAt, dizzy, staticError };
}

function Card({ children, gap, side }: { children: React.ReactNode; gap: number; side: 'left' | 'right' }) {
  const t = useTheme();
  const v = useValue(0);
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 6, tension: 90, useNativeDriver: ND }).start();
  }, [v]);
  return (
    <Animated.View
      style={[
        styles.card,
        side === 'left' ? { marginLeft: 18 } : { marginRight: 18 },
        {
          marginBottom: gap,
          backgroundColor: t.surface,
          borderColor: t.border,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
          ],
        },
      ]}
    >
      {children}
      <View style={[styles.arrow, side === 'left' ? { left: 26 } : { right: 26 }, { borderTopColor: t.surface }]} />
    </Animated.View>
  );
}

function Bubble({ text, persist, onHide, gap, side }: { text: string; persist: boolean; onHide(): void; gap: number; side: 'left' | 'right' }) {
  const t = useTheme();
  useEffect(() => {
    if (persist) return;
    const id = setTimeout(onHide, 6500);
    return () => clearTimeout(id);
  }, [persist, onHide]);
  return (
    <View pointerEvents="none">
      <Card gap={gap} side={side}>
        <Text style={{ color: t.text, fontSize: 13, lineHeight: 18 }}>{text}</Text>
      </Card>
    </View>
  );
}

interface MenuItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color?: string;
  onPress(): void;
}

function Menu({ items, gap, side, onClose }: { items: MenuItem[]; gap: number; side: 'left' | 'right'; onClose(): void }) {
  const t = useTheme();
  useEffect(() => {
    const id = setTimeout(onClose, 9000);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <Card gap={gap} side={side}>
      <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>¿QUÉ HACEMOS? 🐾</Text>
      {items.map((it) => (
        <Pressable
          key={it.label}
          onPress={() => {
            it.onPress();
            onClose();
          }}
          style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? t.surfaceAlt : 'transparent' }]}
        >
          <Ionicons name={it.icon} size={16} color={it.color ?? t.primary} />
          <Text style={{ color: t.text, fontSize: 13, marginLeft: 8 }}>{it.label}</Text>
        </Pressable>
      ))}
    </Card>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function Mascot() {
  const t = useTheme();
  const enabled = useApp((s) => s.settings.mascot);
  const savedPos = useApp((s) => s.settings.mascotPos);
  const panel = useApp((s) => s.panel);
  const symbolBar = useApp((s) => s.settings.symbolBar);
  const runActive = useApp((s) => !!s.run && s.run.status !== 'idle');
  const { width } = useWindowDimensions();
  const file = useActiveFile();
  const { status, runError, finishedAt, dizzy, staticError } = useProgram();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [tip, setTip] = useState(0);
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);
  const [sleptOn, setSleptOn] = useState<string | null>(null);
  const [wake, setWake] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [petting, setPetting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [area, setArea] = useState({ w: 0, h: 0 });

  const wide = width >= 900;
  const size = wide ? 132 : 96;
  const s = size / BOX;
  // posición por defecto: sobre la barra de símbolos/ayuda del editor y la mini consola (móvil)
  const defaultBottom = wide ? 10 : panel === 'editor' ? (symbolBar ? 84 : 40) + (runActive ? 96 : 0) : 10;
  const right = savedPos && area.w ? clamp(savedPos.right, 4, area.w - size - 4) : 14;
  const bottom = savedPos && area.h ? clamp(savedPos.bottom, 4, area.h - size - 4) : defaultBottom;
  const side: 'left' | 'right' = area.w && area.w - right - size / 2 < area.w / 2 ? 'left' : 'right';

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // ── celebración al corregir un error (de análisis o de ejecución) ──
  const hasError = !!staticError || status === 'error';
  const [prevHasError, setPrevHasError] = useState(hasError);
  const [prevStatus, setPrevStatus] = useState(status);
  const [hadRunError, setHadRunError] = useState(false);
  const [fixCount, setFixCount] = useState(0);
  const [celebratedUpTo, setCelebratedUpTo] = useState(0);
  if (hasError !== prevHasError) {
    setPrevHasError(hasError);
    // error del análisis corregido al editar (no cuenta si solo empezó otra ejecución)
    if (prevHasError && !hasError && prevStatus === status) setFixCount((c) => c + 1);
  }
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === 'error') setHadRunError(true);
    else if (status === 'finished' && hadRunError) {
      setHadRunError(false);
      setFixCount((c) => c + 1);
    }
  }
  const celebrating = fixCount > celebratedUpTo;
  useEffect(() => {
    if (!fixCount) return;
    if (HAPTICS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const id = setTimeout(() => setCelebratedUpTo(fixCount), 4000);
    return () => clearTimeout(id);
  }, [fixCount]);

  const mood: Mood = petting ? 'pet' : dizzy ? 'dizzy' : status === 'running' || status === 'input' ? 'running' : hasError ? 'error' : 'idle';

  // ── dormir tras un rato sin actividad ──
  const activity = `${file?.code ?? ''}|${status}|${wake}`;
  const sleeping = mood === 'idle' && !celebrating && sleptOn === activity;
  useEffect(() => {
    if (mood !== 'idle') return;
    const id = setTimeout(() => setSleptOn(activity), SLEEP_AFTER_MS);
    return () => clearTimeout(id);
  }, [activity, mood]);

  // ── transición cruzada entre estados ──
  const vis = { idle: useValue(1), error: useValue(0), running: useValue(0), dizzy: useValue(0), pet: useValue(0) };
  useEffect(() => {
    Animated.parallel(
      MOODS.map((k) =>
        k === mood
          ? Animated.spring(vis[k], { toValue: 1, friction: 5, tension: 70, useNativeDriver: ND })
          : Animated.timing(vis[k], { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: ND }),
      ),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  // ── truco (salto con giro), levantar al arrastrar y aterrizaje ──
  const jump = useValue(0);
  const spin = useValue(0);
  const lift = useValue(0);
  const land = useValue(0);
  useEffect(() => {
    if (!fixCount || reduceMotion) return;
    spin.setValue(0);
    Animated.parallel([
      Animated.sequence([to(jump, 1, 260, easeOut), to(jump, 0, 600, Easing.bounce)]),
      Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: ND }),
    ]).start();
  }, [fixCount, reduceMotion, jump, spin]);

  const landBounce = useCallback(() => {
    land.setValue(1);
    Animated.spring(land, { toValue: 0, friction: 3, tension: 160, useNativeDriver: ND }).start();
  }, [land]);

  // ── acariciar: vibración suave mientras se mantiene presionado ──
  useEffect(() => {
    if (!petting || !HAPTICS) return;
    const id = setInterval(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}), 380);
    return () => clearInterval(id);
  }, [petting]);

  // ── arrastrar ──
  const pan = useState(() => new Animated.ValueXY())[0];
  // se recrea solo cuando cambia la geometría (nunca durante un arrastre)
  const responder = useMemo(() => {
    const finish = (dx: number, dy: number) => {
      const g = { right, bottom, w: area.w, h: area.h, size };
      const r = clamp(g.right - dx, 4, Math.max(4, g.w - g.size - 4));
      const b = clamp(g.bottom - dy, 4, Math.max(4, g.h - g.size - 4));
      useApp.getState().updateSettings({ mascotPos: { right: Math.round(r), bottom: Math.round(b) } });
      pan.setValue({ x: 0, y: 0 });
      setDragging(false);
      to(lift, 0, 160).start();
      land.setValue(1);
      Animated.spring(land, { toValue: 0, friction: 3, tension: 160, useNativeDriver: ND }).start();
      if (HAPTICS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    };
    const moved = (g: { dx: number; dy: number }) => Math.abs(g.dx) + Math.abs(g.dy) > 8;
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => moved(g),
      onMoveShouldSetPanResponder: (_, g) => moved(g),
      onPanResponderGrant: () => {
        setDragging(true);
        setMenuOpen(false);
        setPetting(false);
        to(lift, 1, 140).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => finish(g.dx, g.dy),
      onPanResponderTerminate: (_, g) => finish(g.dx, g.dy),
    });
  }, [right, bottom, area.w, area.h, size, pan, lift, land]);

  // ── mensajes ──
  const message = useMemo(() => {
    if (mood === 'pet') return 'Prrr… prrr… 💕';
    if (mood === 'dizzy') return 'Me mareo… 😵 ¿Un ciclo infinito? Revisa que la condición del ciclo llegue a ser falsa.';
    if (celebrating) return '¡Arreglado! 🎉 ¡Bien hecho!';
    if (mood === 'running') return status === 'input' ? 'Te espero: escribe el dato abajo 👇' : '¡Ejecutando tu código a toda velocidad! 🏃‍♂️';
    if (status === 'error' && runError)
      return runError.syntax
        ? `¡Miau! Error de sintaxis${runError.line ? ` en la línea ${runError.line}` : ''}: ${runError.message}`
        : `¡Ay! Algo falló${runError.line ? ` en la línea ${runError.line}` : ''}: ${runError.message}`;
    if (staticError) return `¡Miau! Revisa la línea ${staticError.line}: ${staticError.message}`;
    if (sleeping) return 'Zzz… (tócame para despertarme)';
    if (status === 'finished') return '¡Listo! El programa terminó sin errores 🎉';
    return TIPS[tip % TIPS.length];
  }, [mood, status, runError, staticError, sleeping, tip, celebrating]);

  const persist = mood === 'error' || mood === 'pet' || mood === 'dizzy' || status === 'input';
  const bubbleKey = `${message}#${tip}`;
  const hideBubble = useCallback(() => setHiddenKey(bubbleKey), [bubbleKey]);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const errLine = runError?.line ?? staticError?.line ?? null;
  const menuItems: MenuItem[] = useMemo(() => {
    const st = useApp.getState();
    const items: MenuItem[] = [];
    if (status === 'running' || status === 'input' || status === 'paused') items.push({ icon: 'stop', label: 'Detener', color: t.danger, onPress: () => st.stop() });
    else items.push({ icon: 'play', label: 'Ejecutar', color: t.success, onPress: () => st.runProgram('run') });
    if (hasError)
      items.push({
        icon: 'bug-outline',
        label: errLine ? `Explícame el error (línea ${errLine})` : 'Explícame el error',
        color: t.danger,
        onPress: () => {
          if (wide) {
            st.setSidePanel('problems');
            if (errLine) st.jumpToLine(errLine);
          } else st.setPanel('problems');
        },
      });
    items.push({
      icon: 'bulb-outline',
      label: 'Dame un consejo',
      color: t.warning,
      onPress: () => {
        setTip((x) => x + 1);
        setHiddenKey(null);
      },
    });
    if (savedPos) items.push({ icon: 'locate-outline', label: 'Volver a mi lugar', onPress: () => st.updateSettings({ mascotPos: null }) });
    items.push({
      icon: 'eye-off-outline',
      label: 'Ocultar a Michi',
      color: t.textMuted,
      onPress: () => {
        st.updateSettings({ mascot: false });
        st.setNotice('Michi se fue a dormir. Puedes volver a mostrarlo en Configuración → Mostrar mascota.');
      },
    });
    return items;
  }, [status, hasError, errLine, wide, savedPos, t]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setArea({ w, h });
  };

  if (!enabled) return null;

  const layer = (k: Mood, node: React.ReactNode) => (
    <Animated.View
      key={k}
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: vis[k].interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transformOrigin: 'center bottom',
          // mira hacia la izquierda (hacia el editor)
          transform: [{ scale: vis[k].interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }, { scaleX: -1 }],
        },
      ]}
    >
      {node}
    </Animated.View>
  );

  const label =
    mood === 'running' ? 'ejecutando' : mood === 'error' ? 'preocupado por un error' : mood === 'dizzy' ? 'mareado' : mood === 'pet' ? 'ronroneando' : sleeping ? 'dormido' : 'en reposo';
  const gap = Math.round(size * 0.2);
  const motion = !reduceMotion;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.block, { right, bottom, alignItems: side === 'left' ? 'flex-start' : 'flex-end', transform: pan.getTranslateTransform() }]}
        {...responder.panHandlers}
      >
        {dragging ? null : menuOpen ? (
          <Menu items={menuItems} gap={gap} side={side} onClose={closeMenu} />
        ) : hiddenKey !== bubbleKey ? (
          <Bubble key={bubbleKey} text={message} persist={persist} onHide={hideBubble} gap={gap} side={side} />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mascota ${label}`}
          accessibilityHint="Toca para ver atajos. Mantén presionado para acariciarla. Arrástrala para moverla."
          delayLongPress={380}
          onPress={() => {
            setWake((w) => w + 1);
            setMenuOpen((o) => !o);
            if (HAPTICS) Haptics.selectionAsync().catch(() => {});
          }}
          onLongPress={() => {
            setMenuOpen(false);
            setPetting(true);
            setWake((w) => w + 1);
            setHiddenKey(null);
          }}
          onPressOut={() => {
            if (petting) {
              setPetting(false);
              landBounce();
            }
          }}
          style={{ width: size, height: size, ...(Platform.OS === 'web' ? ({ cursor: dragging ? 'grabbing' : 'grab' } as object) : null) }}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transformOrigin: 'center bottom',
                transform: [
                  { translateY: jump.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.35] }) },
                  { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                  { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
                  { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) },
                  { scaleY: land.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.08, 1, 0.82] }) },
                  { scaleX: land.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.12] }) },
                ],
              },
            ]}
          >
            {layer('idle', <IdleLayer active={motion && mood === 'idle'} s={s} accent={t.primary} muted={t.textMuted} sleeping={sleeping} celebrate={finishedAt >= 0 ? `fin-${finishedAt}` : null} />)}
            {layer('error', <ErrorLayer active={motion && mood === 'error'} s={s} accent={t.primary} muted={t.textMuted} />)}
            {layer('running', <RunningLayer active={motion && mood === 'running'} s={s} accent={t.primary} muted={t.textMuted} />)}
            {layer('dizzy', <DizzyLayer active={motion && mood === 'dizzy'} s={s} accent={t.primary} muted={t.textMuted} />)}
            {layer('pet', <PetLayer active={motion && mood === 'pet'} s={s} accent={t.primary} muted={t.textMuted} />)}
          </Animated.View>
          {celebrating && motion ? <Confetti key={fixCount} size={size} /> : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { position: 'absolute', zIndex: 50 },
  card: {
    maxWidth: 260,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 6, borderRadius: 8 },
  arrow: {
    position: 'absolute',
    bottom: -9,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
