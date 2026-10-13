/**
 * Mascota guía: un gatito que reacciona al programa y a la persona.
 *
 * Estados (capas con transición cruzada):
 *  - reposo · error de análisis · ejecutando · esperando un dato · error de
 *    ejecución (cae sentado; con recursión infinita se "clona") · punto de
 *    interrupción · mareado (ciclo infinito) · acariciado
 *
 * Reacciones puntuales:
 *  - al escribir: rebota al ritmo de las teclas, se inclina hacia el editor,
 *    mira hacia donde escribes, se emociona si tecleas rápido y reacciona a
 *    palabras clave (while (true), console.log, class), pegados y formato
 *  - en ejecución: asiente en cada paso, piensa en los if, "rebobina" al
 *    retroceder, lanza burbujas por cada salida y celebra si fue rapidísimo
 *  - errores: muchos errores = nube y más moscas; variable no definida = lupa
 *  - interacción: tocar (menú), doble toque (voltereta), muchos toques (se
 *    enoja), mantener (caricias), arrastrar y lanzar (rebota en los bordes),
 *    minimizar (solo asoma la cola), se estira al despertar y caza moscas
 *  - a ratos (al azar, en reposo) corre a esconderse en el borde y solo asoma
 *    la cola; vuelve solo, al tocarla o en cuanto pasa algo en el programa
 *
 * Vestuarios de temporada (ver mascot/costumes.tsx): se viste solo según la
 * fecha (Halloween, Día de Muertos, Navidad, fiestas patrias…) o con el
 * vestuario elegido en Configuración o en su menú.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
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
import { easeIn, easeOut, ND, startNextFrame, to, useValue, wait } from './mascot/anim';
import { Ambient, COSTUMES, CostumeProvider, FaceProvider, resolveCostume, useSprites } from './mascot/costumes';
import { AlertLayer, Confetti, CrashLayer, DizzyLayer, FxKind, OutputParticle, PetLayer, ReactionFx, WaitingLayer } from './mascot/extras';
import { ErrorLayer, IdleLayer, RunningLayer } from './mascot/layers';
import { BOX } from './mascot/sprites';

type Mood = 'idle' | 'error' | 'running' | 'dizzy' | 'pet' | 'waiting' | 'crash' | 'alert';
const MOODS: Mood[] = ['idle', 'error', 'running', 'dizzy', 'pet', 'waiting', 'crash', 'alert'];

const SLEEP_AFTER_MS = 45_000;
/** Cada cuánto (al azar, en reposo) se esconde en el borde y cuánto tarda en volver. */
const HIDE_EVERY_MS: [number, number] = [120_000, 300_000];
const HIDE_FOR_MS: [number, number] = [8_000, 20_000];
const between = ([a, b]: [number, number]) => a + Math.random() * (b - a);
/** Pasos a partir de los cuales una ejecución rápida "marea" a la mascota. */
const DIZZY_STEPS = 150_000;
const HAPTICS = Platform.OS !== 'web';
const FX_MS: Record<FxKind, number> = {
  notes: 2200,
  hat: 2800,
  alert: 3200,
  suspicious: 2600,
  sparkles: 2000,
  think: 2600,
  rewind: 1200,
  fast: 2600,
  angry: 2200,
  yawn: 2200,
};

const TIPS = [
  '¡Hola! 🐾 Tócame una vez para ver más o mantenme presionado para acariciarme o moverme.',
  'Toca un número de línea para poner un punto de interrupción.',
  'prompt() siempre devuelve texto: conviértelo con Number().',
  'En la pestaña Diagrama verás tu programa como diagrama de flujo.',
  'La prueba de escritorio muestra cómo cambian tus variables.',
  'Puedes exportar tu código a PSeInt, Python y más.',
  'Usa === para comparar: no convierte los tipos.',
  'Toca dos veces rápido y verás una voltereta',
  'A veces me escondo en el borde ¡Toca mi cola para encontrarme!',
];

function useProgram() {
  const status = useApp((s) => s.run?.status ?? 'idle');
  const mode = useApp((s) => s.run?.mode ?? 'run');
  const runError = useApp((s) => s.run?.error ?? null);
  const notice = useApp((s) => s.run?.notice ?? null);
  const line = useApp((s) => s.run?.line ?? null);
  const elapsedMs = useApp((s) => s.run?.elapsedMs ?? null);
  // solo cambian en momentos puntuales (evita re-render en cada paso)
  const finishedAt = useApp((s) => (s.run?.status === 'finished' ? s.run.stepCount : -1));
  const pausedStep = useApp((s) => (s.run?.status === 'paused' ? s.run.stepCount : -1));
  const outCount = useApp((s) => s.run?.output.length ?? 0);
  const runSeq = useApp((s) => s.runSeq);
  // última línea escrita por el programa (ignora los avisos del sistema)
  const lastOut = useApp((s) => {
    const o = s.run?.output ?? [];
    for (let i = o.length - 1; i >= Math.max(0, o.length - 4); i--) if (o[i].kind !== 'system') return o[i].text;
    return '';
  });
  const dizzy = useApp(
    (s) =>
      !!s.run &&
      ((s.run.status === 'running' && s.run.mode === 'run' && s.run.stepCount > DIZZY_STEPS) ||
        (s.run.status === 'paused' && !!s.run.notice && /ciclo infinito/i.test(s.run.notice))),
  );
  const diagnostics = useApp((s) => s.diagnostics);
  const errors = diagnostics.filter((d) => d.severity === 'error');
  const staticError = errors.find((d) => d.rule === 'syntax') ?? errors[0];
  return { status, mode, runError, notice, line, elapsedMs, finishedAt, pausedStep, outCount, runSeq, lastOut, dizzy, staticError, errorCount: errors.length };
}

/** Texto insertado y cantidad borrada entre dos versiones del código. */
function diffText(a: string, b: string) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let q = 0;
  while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
  return { at: p, inserted: b.slice(p, b.length - q), removed: a.length - p - q };
}

const lineAt = (code: string, pos: number) => {
  const start = code.lastIndexOf('\n', pos - 1) + 1;
  const end = code.indexOf('\n', pos);
  return code.slice(start, end < 0 ? code.length : end);
};

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
    <View style={{ pointerEvents: 'none' }}>
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

/** Mascota minimizada o escondida: solo asoma la cola por el borde. */
function PeekingTail({ onPress, edge, label }: { onPress(): void; edge: 'left' | 'right'; label: string }) {
  const { IDLE } = useSprites();
  const wag = useValue(0);
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([to(wag, 1, 520), to(wag, -1, 1040), to(wag, 0, 520), wait(600)]));
    a.start();
    return () => a.stop();
  }, [wag]);
  const s = 0.42;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.peek, edge === 'left' && { transform: [{ scaleX: -1 }] }]}>
      <Animated.View
        style={{
          width: 88 * s,
          height: 170 * s,
          overflow: 'hidden',
          transformOrigin: 'center bottom',
          transform: [{ rotate: wag.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '12deg'] }) }],
        }}
      >
        <Image source={IDLE.tail} style={{ width: IDLE.w * s, height: IDLE.h * s, marginTop: -40 * s }} />
      </Animated.View>
    </Pressable>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function Mascot() {
  const t = useTheme();
  const enabled = useApp((s) => s.settings.mascot);
  const savedPos = useApp((s) => s.settings.mascotPos);
  const panel = useApp((s) => s.panel);
  const symbolBar = useApp((s) => s.settings.symbolBar);
  const editorRequest = useApp((s) => s.editorRequest);
  const runActive = useApp((s) => !!s.run && s.run.status !== 'idle');
  const costumeSetting = useApp((s) => s.settings.mascotCostume);
  const { width } = useWindowDimensions();
  const file = useActiveFile();
  const code = file?.code ?? '';
  const fileId = file?.id ?? '';
  const p = useProgram();
  const { status, runError, staticError } = p;

  const [reduceMotion, setReduceMotion] = useState(false);
  const [tip, setTip] = useState(0);
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);
  const [sleptOn, setSleptOn] = useState<string | null>(null);
  const [wake, setWake] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [petting, setPetting] = useState(false);
  const [dragging, setDragging] = useState(false);
  // 'manual': desde el menú (vuelve al tocar la cola) · 'auto': se escondió jugando
  const [minimized, setMinimized] = useState<false | 'manual' | 'auto'>(false);
  const [sneaking, setSneaking] = useState(false);
  const [hideEdge, setHideEdge] = useState<'left' | 'right'>('right');
  const [returnNonce, setReturnNonce] = useState(0);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [fx, setFx] = useState<{ kind: FxKind; msg?: string; n: number } | null>(null);
  const [keyNonce, setKeyNonce] = useState(0);
  const [nodNonce, setNodNonce] = useState(0);
  const [slideNonce, setSlideNonce] = useState(0);
  const [stretchKey, setStretchKey] = useState(0);
  const [particles, setParticles] = useState<{ id: number; text: string }[]>([]);
  const [particleId, setParticleId] = useState(0);
  // fecha actual para el vestuario automático (se revisa cada hora)
  const [today, setToday] = useState(() => new Date());
  const costume = useMemo(() => resolveCostume(costumeSetting, today), [costumeSetting, today]);
  const [shownCostume, setShownCostume] = useState(costume?.id ?? null);
  const [costumeNonce, setCostumeNonce] = useState(0);
  const tips = useMemo(() => (costume ? [costume.greeting, ...TIPS] : TIPS), [costume]);

  const react = (kind: FxKind, msg?: string) => setFx((f) => ({ kind, msg, n: (f?.n ?? 0) + 1 }));

  // al cambiar de vestuario: saluda y da una voltereta
  if ((costume?.id ?? null) !== shownCostume) {
    setShownCostume(costume?.id ?? null);
    setWake((w) => w + 1);
    setTip(0);
    setHiddenKey(null);
    if (costume) {
      react('sparkles', costume.greeting);
      setCostumeNonce((n) => n + 1);
    }
  }

  const wide = width >= 900;
  const size = wide ? 132 : 96;
  const s = size / BOX;
  // posición por defecto: sobre la barra de símbolos/ayuda del editor y la mini consola (móvil)
  const defaultBottom = wide ? 10 : panel === 'editor' ? (symbolBar ? 84 : 40) + (runActive ? 96 : 0) : 10;
  const right = savedPos && area.w ? clamp(savedPos.right, 4, area.w - size - 4) : 14;
  const bottom = savedPos && area.h ? clamp(savedPos.bottom, 4, area.h - size - 4) : defaultBottom;
  const centerX = area.w - right - size / 2;
  const side: 'left' | 'right' = area.w && centerX < area.w / 2 ? 'left' : 'right';
  // mira hacia el editor (a la izquierda salvo que lo hayas puesto a la izquierda del editor)
  const editorX = wide ? area.w * 0.27 : area.w / 2;
  const faceLeft = !area.w || !(wide || panel === 'editor') || editorX <= centerX;
  const dir = faceLeft ? -1 : 1;

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setToday((d) => (d.toDateString() === now.toDateString() ? d : now));
    }, 3_600_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => { });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // ── detección de eventos (patrón "estado anterior" durante el render) ──
  const isRuntimeError = status === 'error' && !!runError && !runError.syntax;
  const hasError = !!staticError || status === 'error';
  const breakpoint = status === 'paused' && !!p.notice && p.notice.startsWith('Punto de interrupción');
  const currentLineText = p.line ? (code.split('\n')[p.line - 1] ?? '') : '';
  const thinking = status === 'paused' && !breakpoint && /^\s*(\}?\s*else\b|if\s*\(|switch\s*\(|case\b|while\s*\(|for\s*\()/.test(currentLineText);

  const [prev, setPrev] = useState({
    code,
    fileId,
    req: editorRequest?.nonce ?? 0,
    skipNext: false,
    hasError,
    status,
    hadRunError: false,
    pausedStep: p.pausedStep,
    finishedAt: p.finishedAt,
    outCount: p.outCount,
    runSeq: p.runSeq,
    sleeping: false,
  });
  const [fixCount, setFixCount] = useState(0);
  const [celebratedUpTo, setCelebratedUpTo] = useState(0);

  const mood: Mood = petting
    ? 'pet'
    : p.dizzy
      ? 'dizzy'
      : isRuntimeError
        ? 'crash'
        : status === 'input'
          ? 'waiting'
          : status === 'running'
            ? 'running'
            : breakpoint
              ? 'alert'
              : hasError
                ? 'error'
                : 'idle';

  const activity = `${code}|${status}|${wake}`;
  const celebrating = fixCount > celebratedUpTo;
  const sleeping = mood === 'idle' && !celebrating && sleptOn === activity;

  if (
    prev.code !== code ||
    prev.fileId !== fileId ||
    prev.req !== (editorRequest?.nonce ?? 0) ||
    prev.hasError !== hasError ||
    prev.status !== status ||
    prev.pausedStep !== p.pausedStep ||
    prev.finishedAt !== p.finishedAt ||
    prev.outCount !== p.outCount ||
    prev.runSeq !== p.runSeq ||
    prev.sleeping !== sleeping
  ) {
    const next = { ...prev, code, fileId, req: editorRequest?.nonce ?? 0, hasError, status, pausedStep: p.pausedStep, finishedAt: p.finishedAt, outCount: p.outCount, runSeq: p.runSeq, sleeping };
    // formato / inserción desde el menú: no son "pegados sospechosos"
    if (next.req !== prev.req && editorRequest) {
      next.skipNext = true;
      if (editorRequest.kind === 'replaceAll') react('sparkles', '¡Qué ordenado! ✨');
    }
    if (code !== prev.code && fileId === prev.fileId) {
      if (next.skipNext) next.skipNext = false;
      else {
        const d = diffText(prev.code, code);
        if (d.inserted.length > 40) react('suspicious', '¿De dónde salió todo ese código? 👀 Asegúrate de entenderlo.');
        else if (d.inserted.length || d.removed) {
          setKeyNonce((k) => k + 1);
          const nowLine = lineAt(code, d.at);
          const oldLine = lineAt(prev.code, Math.min(d.at, prev.code.length));
          const added = (re: RegExp) => re.test(nowLine) && !re.test(oldLine);
          if (added(/while\s*\(\s*true\s*\)/)) react('alert', '¡Cuidado! while (true) necesita un break para terminar 👀');
          else if (added(/console\.log\s*\(/)) react('notes', '♪ ¡Vamos a mostrar algo en la consola!');
          else if (added(/\bclass\s+[A-Za-z_$]/)) react('hat', '¡Una clase! 🎩 Qué elegante.');
        }
      }
    }
    // error corregido (al editar) o programa que ahora termina bien
    if (prev.hasError && !hasError && prev.status === status) setFixCount((c) => c + 1);
    if (status !== prev.status) {
      if (status === 'error') next.hadRunError = true;
      else if (status === 'finished' && prev.hadRunError) {
        next.hadRunError = false;
        setFixCount((c) => c + 1);
      }
    }
    // paso a paso: asiente o "rebobina"
    if (p.pausedStep >= 0 && p.pausedStep !== prev.pausedStep && !breakpoint) {
      if (prev.pausedStep >= 0 && p.pausedStep < prev.pausedStep) {
        react('rewind');
        setSlideNonce((n) => n + 1);
      } else setNodNonce((n) => n + 1);
    }
    // terminó rapidísimo
    if (p.finishedAt > 0 && prev.finishedAt < 0 && p.mode === 'run' && p.elapsedMs !== null && p.elapsedMs < 1000 && !prev.hadRunError)
      react('fast', `⚡ ¡Rapidísimo! Terminó en ${p.elapsedMs} ms.`);
    // burbujas de salida (máx. 4 a la vez)
    const newOutput = p.runSeq !== prev.runSeq ? p.outCount > 0 : p.outCount > prev.outCount;
    if (newOutput && p.lastOut && particles.length < 4) {
      setParticles((arr) => [...arr, { id: particleId + 1, text: p.lastOut.slice(0, 14) }]);
      setParticleId((n) => n + 1);
    }
    // se estira al despertar
    if (prev.sleeping && !sleeping) {
      setStretchKey((k) => k + 1);
      react('yawn', '¡Aaah! 🥱 ¡Ya desperté!');
    }
    setPrev(next);
  }

  // cada burbuja de salida vive ~1 s (respaldo por si su animación no termina)
  useEffect(() => {
    if (!particles.length) return;
    const id = setTimeout(() => setParticles((arr) => arr.slice(1)), 1100);
    return () => clearTimeout(id);
  }, [particles]);

  // limpiar la reacción actual
  useEffect(() => {
    if (!fx) return;
    const id = setTimeout(() => setFx(null), FX_MS[fx.kind]);
    return () => clearTimeout(id);
  }, [fx]);

  // celebración al corregir
  useEffect(() => {
    if (!fixCount) return;
    if (HAPTICS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    const id = setTimeout(() => setCelebratedUpTo(fixCount), 4000);
    return () => clearTimeout(id);
  }, [fixCount]);

  // dormir tras un rato sin actividad
  useEffect(() => {
    if (mood !== 'idle') return;
    const id = setTimeout(() => setSleptOn(activity), SLEEP_AFTER_MS);
    return () => clearTimeout(id);
  }, [activity, mood]);

  // ── valores animados del contenedor ──
  const vis = {
    idle: useValue(1),
    error: useValue(0),
    running: useValue(0),
    dizzy: useValue(0),
    pet: useValue(0),
    waiting: useValue(0),
    crash: useValue(0),
    alert: useValue(0),
  };
  const face = useValue(-1);
  const jump = useValue(0);
  const spin = useValue(0);
  const lift = useValue(0);
  const land = useValue(0);
  const bob = useValue(0);
  const lean = useValue(0);
  const nod = useValue(0);
  const slide = useValue(0);
  const escape = useValue(0);
  const pan = useState(() => new Animated.ValueXY())[0];
  const sneakAnim = useRef<Animated.CompositeAnimation | null>(null);
  const hideSnapshot = useRef('');
  const keyTimes = useRef<number[]>([]);
  const lastExcited = useRef(0);
  const taps = useRef<number[]>([]);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // girar hacia el editor (pasa por 0: parece que se da la vuelta)
  useEffect(() => {
    Animated.timing(face, { toValue: faceLeft ? -1 : 1, duration: 320, easing: Easing.inOut(Easing.cubic), useNativeDriver: ND }).start();
  }, [faceLeft, face]);

  const trick = useCallback(
    (height = 1) => {
      spin.setValue(0);
      Animated.parallel([
        Animated.sequence([to(jump, height, 260, easeOut), to(jump, 0, 600, Easing.bounce)]),
        Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: ND }),
      ]).start();
    },
    [jump, spin],
  );

  useEffect(() => {
    if (!fixCount || reduceMotion) return;
    trick();
  }, [fixCount, reduceMotion, trick]);

  useEffect(() => {
    if (!costumeNonce || reduceMotion) return;
    trick(0.9);
  }, [costumeNonce, reduceMotion, trick]);

  // al teclear: rebote, inclinación hacia el editor y emoción si tecleas rápido
  useEffect(() => {
    if (!keyNonce || reduceMotion) return;
    Animated.sequence([to(bob, 1, 60, easeOut), to(bob, 0, 140, easeIn)]).start();
    to(lean, 1, 160).start();
    const id = setTimeout(() => to(lean, 0, 500).start(), 1200);
    const now = Date.now();
    keyTimes.current = [...keyTimes.current.filter((x) => now - x < 2000), now];
    let excite: ReturnType<typeof setTimeout> | null = null;
    if (keyTimes.current.length >= 14 && now - lastExcited.current > 6000) {
      lastExcited.current = now;
      Animated.sequence([to(jump, 0.35, 120, easeOut), to(jump, 0, 300, Easing.bounce)]).start();
      excite = setTimeout(() => setFx((f) => ({ kind: 'sparkles', msg: '¡Uy, qué rápido escribes! ✨', n: (f?.n ?? 0) + 1 })), 0);
    }
    return () => {
      clearTimeout(id);
      if (excite) clearTimeout(excite);
    };
  }, [keyNonce, reduceMotion, bob, lean, jump]);

  // asentir en cada paso
  useEffect(() => {
    if (!nodNonce || reduceMotion) return;
    Animated.sequence([to(nod, 1, 130, easeOut), to(nod, 0, 240, easeIn)]).start();
  }, [nodNonce, reduceMotion, nod]);

  // "rebobinar" al retroceder un paso
  useEffect(() => {
    if (!slideNonce || reduceMotion) return;
    slide.setValue(1);
    Animated.spring(slide, { toValue: 0, friction: 5, tension: 90, useNativeDriver: ND }).start();
  }, [slideNonce, reduceMotion, slide]);

  const landBounce = useCallback(() => {
    land.setValue(1);
    Animated.spring(land, { toValue: 0, friction: 3, tension: 160, useNativeDriver: ND }).start();
  }, [land]);

  // acariciar: vibración suave mientras se mantiene presionado
  useEffect(() => {
    if (!petting || !HAPTICS) return;
    const id = setInterval(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => { }), 380);
    return () => clearInterval(id);
  }, [petting]);

  // ── arrastrar y lanzar ──
  const responder = useMemo(() => {
    const commit = (r: number, b: number) => {
      useApp.getState().updateSettings({ mascotPos: { right: Math.round(r), bottom: Math.round(b) } });
      pan.setValue({ x: 0, y: 0 });
      setDragging(false);
      to(lift, 0, 160).start();
      land.setValue(1);
      Animated.spring(land, { toValue: 0, friction: 3, tension: 160, useNativeDriver: ND }).start();
      if (HAPTICS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    };
    const finish = (dx: number, dy: number, vx: number, vy: number) => {
      const maxR = Math.max(4, area.w - size - 4);
      const maxB = Math.max(4, area.h - size - 4);
      const r0 = right - dx;
      const b0 = bottom - dy;
      if (Math.hypot(vx, vy) < 0.8) return commit(clamp(r0, 4, maxR), clamp(b0, 4, maxB));
      // lanzado: sigue por inercia y rebota en los bordes
      const k = 260;
      let r = r0 - vx * k;
      let b = b0 - vy * k;
      const wallR = clamp(r, 4, maxR);
      const wallB = clamp(b, 4, maxB);
      if (r !== wallR) r = clamp(wallR + (wallR - r) * 0.35, 4, maxR);
      if (b !== wallB) b = clamp(wallB + (wallB - b) * 0.35, 4, maxB);
      const toPan = (rr: number, bb: number) => ({ x: right - rr, y: bottom - bb });
      spin.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pan, { toValue: toPan(wallR, wallB), duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(pan, { toValue: toPan(r, b), duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]),
        Animated.timing(spin, { toValue: vx > 0 ? 1 : -1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: ND }),
      ]).start(() => {
        spin.setValue(0);
        commit(r, b);
      });
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
      onPanResponderRelease: (_, g) => finish(g.dx, g.dy, g.vx, g.vy),
      onPanResponderTerminate: (_, g) => finish(g.dx, g.dy, 0, 0),
    });
  }, [right, bottom, area.w, area.h, size, pan, lift, land, spin]);

  // ── escondidas: corre al borde más cercano y solo asoma la cola ──
  const hops = (n: number) => Animated.sequence(Array.from({ length: n }, () => Animated.sequence([to(jump, 0.2, 120, easeOut), to(jump, 0, 120, easeIn)])));
  const turn = (toValue: number) => Animated.timing(face, { toValue, duration: 260, easing: Easing.inOut(Easing.cubic), useNativeDriver: ND });

  const sneakAway = () => {
    const edge = side;
    hideSnapshot.current = code;
    setHideEdge(edge);
    setSneaking(true);
    setMenuOpen(false);
    setHiddenKey(null);
    escape.setValue(0);
    const anim = Animated.sequence([
      wait(1500),
      turn(edge === 'right' ? 1 : -1),
      Animated.sequence([to(land, 1, 140, easeOut), to(land, 0, 120, easeIn)]),
      Animated.parallel([Animated.timing(escape, { toValue: 1, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: false }), hops(4)]),
    ]);
    sneakAnim.current = anim;
    anim.start(({ finished }) => {
      if (sneakAnim.current !== anim) return;
      sneakAnim.current = null;
      if (!finished) return;
      setSneaking(false);
      setMinimized('auto');
    });
  };

  /** Interrumpe la huida (lo tocaron o pasó algo): vuelve a su lugar. */
  const cancelSneak = (msg?: string) => {
    sneakAnim.current?.stop();
    sneakAnim.current = null;
    setSneaking(false);
    Animated.spring(escape, { toValue: 0, friction: 6, tension: 80, useNativeDriver: false }).start();
    turn(faceLeft ? -1 : 1).start();
    if (msg) react('sparkles', msg);
  };

  /** Sale del escondite (la animación de regreso corre al montarse de nuevo). */
  const comeBack = (msg?: string) => {
    setMinimized(false);
    setWake((w) => w + 1);
    escape.setValue(1);
    face.setValue(hideEdge === 'right' ? -1 : 1);
    setReturnNonce((n) => n + 1);
    if (msg) react('sparkles', msg);
  };

  const canHide = !reduceMotion && enabled && !minimized && !sneaking && mood === 'idle' && !sleeping && !menuOpen && !dragging && !petting && !fx && !celebrating && area.w > 0;
  useEffect(() => {
    if (!canHide) return;
    const id = setTimeout(sneakAway, between(HIDE_EVERY_MS));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canHide, activity]);

  // si escribes o cambia el programa mientras huye, se queda
  useEffect(() => {
    if (!sneaking || (code === hideSnapshot.current && mood === 'idle')) return;
    const id = setTimeout(() => cancelSneak(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sneaking, code, mood]);

  // escondido: vuelve solo tras un rato, o enseguida si escribes o cambia el programa
  useEffect(() => {
    if (minimized !== 'auto') return;
    const now = code !== hideSnapshot.current || mood !== 'idle';
    const id = setTimeout(() => comeBack(now ? undefined : '¡Aquí estoy! 😸 ¿Me extrañaste?'), now ? 0 : between(HIDE_FOR_MS));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized, code, mood]);

  // regreso: entra a saltitos desde el borde y voltea hacia el editor
  useEffect(() => {
    if (!returnNonce) return;
    return startNextFrame(
      Animated.sequence([
        Animated.parallel([Animated.timing(escape, { toValue: 0, duration: 850, easing: Easing.out(Easing.quad), useNativeDriver: false }), hops(4)]),
        turn(faceLeft ? -1 : 1),
      ]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnNonce]);

  // ── toques: simple (menú), doble (voltereta), muchos (se enoja) ──
  const onTap = () => {
    setWake((w) => w + 1);
    if (sneaking) {
      cancelSneak('¡Me atrapaste! 😹 Está bien, me quedo.');
      return;
    }
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 2500), now];
    if (taps.current.length >= 6) {
      taps.current = [];
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      setMenuOpen(false);
      react('angry', '¡Ffff! 😾 Déjame un ratito…');
      if (!reduceMotion) Animated.sequence([to(slide, 1.6, 220, easeOut), wait(1100), to(slide, 0, 500)]).start();
      if (HAPTICS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
      return;
    }
    if (tapTimer.current) {
      // doble toque
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      setMenuOpen(false);
      if (!reduceMotion) trick(1.35);
      if (HAPTICS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      setMenuOpen((o) => !o);
      if (HAPTICS) Haptics.selectionAsync().catch(() => { });
    }, 260);
  };

  // ── mensajes ──
  const errLine = runError?.line ?? staticError?.line ?? null;
  const isUndefined =
    (!!staticError && (staticError.rule === 'undefined' || staticError.rule === 'undeclared')) ||
    (!!runError && (runError.code === 'undefined-var' || runError.code === 'undeclared-assign'));
  const stackOverflow = isRuntimeError && runError?.code === 'stack-overflow';
  const many = p.errorCount >= 3;

  const message = useMemo(() => {
    if (sneaking) return '¡Me escondo! 🙈 A ver si me encuentras…';
    if (mood === 'pet') return 'Prrr… prrr… 💕';
    if (mood === 'dizzy') return 'Me mareo… 😵 ¿Un ciclo infinito? Revisa que la condición del ciclo llegue a ser falsa.';
    if (fx?.msg) return fx.msg;
    if (celebrating) return '¡Arreglado! 🎉 ¡Bien hecho!';
    if (mood === 'crash' && runError) {
      if (stackOverflow) return `¡Me estoy clonando sin fin! 🌀 Recursión sin caso base${errLine ? ` (línea ${errLine})` : ''}.`;
      return `¡Auch! 💥 Error de ejecución${errLine ? ` en la línea ${errLine}` : ''}: ${isUndefined ? '🔍 ' : ''}${runError.message}`;
    }
    if (mood === 'waiting') return 'Te espero: escribe el dato abajo 👇';
    if (mood === 'running') return '¡Ejecutando tu código a toda velocidad! 🏃‍♂️';
    if (mood === 'alert') return `¡Alto! ✋ Punto de interrupción en la línea ${p.line}. Revisa tus variables.`;
    if (thinking) return 'Mmm… 🤔 ¿Se cumplirá la condición? Avanza un paso para verlo.';
    // errores de sintaxis: el título corto y una invitación a ver la explicación completa
    if (status === 'error' && runError?.syntax)
      return runError.title
        ? `¡Miau! Línea ${errLine}: ${runError.title}. Tócame → "Explícame el error" 🐾`
        : `¡Miau! Error de sintaxis${errLine ? ` en la línea ${errLine}` : ''}: ${runError.message}`;
    if (staticError)
      return `${many ? `¡Son ${p.errorCount} errores! Empecemos por uno: ` : '¡Miau! '}${isUndefined ? '🔍 ' : ''}Línea ${staticError.line}: ${staticError.title ? `${staticError.title}. Tócame → "Explícame el error" 🐾` : staticError.message
        }`;
    if (sleeping) return 'Zzz… (tócame para despertarme)';
    if (status === 'finished') return '¡Listo! El programa terminó sin errores 🎉';
    return tips[tip % tips.length];
  }, [sneaking, mood, fx, celebrating, runError, stackOverflow, errLine, isUndefined, p.line, p.errorCount, thinking, status, staticError, many, sleeping, tip, tips]);

  const persist = ['error', 'crash', 'pet', 'dizzy', 'waiting', 'alert'].includes(mood) || thinking || !!fx || sneaking;
  const bubbleKey = `${message}#${tip}`;
  const hideBubble = useCallback(() => setHiddenKey(bubbleKey), [bubbleKey]);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const removeParticle = useCallback((id: number) => setParticles((arr) => arr.filter((x) => x.id !== id)), []);

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
    // probar los vestuarios: ninguno → cada fiesta → ninguno…
    const order = ['none', ...COSTUMES.map((c) => c.id)];
    const next = order[(order.indexOf(costume?.id ?? 'none') + 1) % order.length];
    const nextCostume = COSTUMES.find((c) => c.id === next);
    items.push({
      icon: 'shirt-outline',
      label: nextCostume ? `Vestuario: ${nextCostume.emoji} ${nextCostume.name}` : 'Quitar vestuario',
      color: t.primary,
      onPress: () => st.updateSettings({ mascotCostume: next }),
    });
    if (savedPos) items.push({ icon: 'locate-outline', label: 'Volver a mi lugar', onPress: () => st.updateSettings({ mascotPos: null }) });
    items.push({ icon: 'chevron-forward-circle-outline', label: 'Minimizar (esconderme en el borde)', color: t.textMuted, onPress: () => setMinimized('manual') });
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
  }, [status, hasError, errLine, wide, savedPos, t, costume]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setArea({ w, h });
  };

  if (!enabled) return null;

  if (minimized) {
    return (
      <CostumeProvider value={costume}>
        <View style={styles.minOverlay} onLayout={onLayout}>
          <View style={[styles.minBlock, { bottom: bottom + 10 }, minimized === 'auto' && hideEdge === 'left' ? { left: 0 } : { right: 0 }]}>
            <PeekingTail
              edge={minimized === 'auto' ? hideEdge : 'right'}
              label={minimized === 'auto' ? 'Encontrar a Michi' : 'Mostrar a Michi'}
              onPress={() => {
                if (minimized === 'auto') {
                  if (HAPTICS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
                  comeBack('¡Me encontraste! 😸');
                  return;
                }
                setMinimized(false);
                setWake((w) => w + 1);
                vis[mood].setValue(0);
                Animated.spring(vis[mood], { toValue: 1, friction: 4, tension: 80, useNativeDriver: ND }).start();
              }}
            />
          </View>
        </View>
      </CostumeProvider>
    );
  }

  const motion = !reduceMotion;
  const lp = { s, accent: t.primary, muted: t.textMuted, face };
  const layer = (k: Mood, node: React.ReactNode) => (
    <Animated.View
      key={k}
      style={[
        StyleSheet.absoluteFill,
        {
          pointerEvents: 'none',
          opacity: vis[k].interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transformOrigin: 'center bottom',
          transform: [{ scale: vis[k].interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }, { scaleX: face }],
        },
      ]}
    >
      {node}
    </Animated.View>
  );

  const labels: Record<Mood, string> = {
    idle: sleeping ? 'dormida' : 'en reposo',
    error: 'preocupada por un error',
    running: 'ejecutando',
    dizzy: 'mareada',
    pet: 'ronroneando',
    waiting: 'esperando un dato',
    crash: 'golpeada por un error de ejecución',
    alert: 'alerta en un punto de interrupción',
  };
  const gap = Math.round(size * 0.2);
  // distancia hasta salir por el borde al esconderse
  const escapeX = hideEdge === 'right' ? right + size + 16 : -(area.w - right + 16);
  const headX = faceLeft ? 120 : 210;
  const particleDx = wide && centerX < area.w * 0.535 ? size * 1.3 : 0;
  const particleDy = !wide && panel === 'editor' && runActive ? size * 0.9 : -size * 1.1;
  const fxKind: FxKind | null = fx?.kind ?? (thinking ? 'think' : null);
  const fxKey = fx ? `fx${fx.n}` : thinking ? `think${p.pausedStep}` : '';

  return (
    <CostumeProvider value={costume}>
      {/* recorta al salir corriendo por el borde (sin barras de desplazamiento) */}
      <View style={styles.overlay} onLayout={onLayout}>
        <Animated.View
          style={[
            styles.block,
            {
              right,
              bottom,
              alignItems: side === 'left' ? 'flex-start' : 'flex-end',
              transform: [...pan.getTranslateTransform(), { translateX: escape.interpolate({ inputRange: [0, 1], outputRange: [0, escapeX] }) }],
            },
          ]}
          {...responder.panHandlers}
        >
          {dragging ? null : menuOpen ? (
            <Menu items={menuItems} gap={gap} side={side} onClose={closeMenu} />
          ) : hiddenKey !== bubbleKey ? (
            <Bubble key={bubbleKey} text={message} persist={persist} onHide={hideBubble} gap={gap} side={side} />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mascota ${labels[mood]}`}
            accessibilityHint="Toca para ver atajos, toca dos veces para una voltereta, mantén presionado para acariciarla y arrástrala o lánzala para moverla."
            delayLongPress={380}
            onPress={onTap}
            onLongPress={() => {
              if (tapTimer.current) clearTimeout(tapTimer.current);
              tapTimer.current = null;
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
                    { translateY: jump.interpolate({ inputRange: [0, 2], outputRange: [0, -size * 0.7] }) },
                    { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.04] }) },
                    { translateX: slide.interpolate({ inputRange: [0, 2], outputRange: [0, -dir * size * 0.5] }) },
                    { rotate: spin.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] }) },
                    { rotate: lean.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${dir * 5}deg`] }) },
                    { rotate: nod.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${dir * 7}deg`] }) },
                    { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
                    { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) },
                    { scaleY: land.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.08, 1, 0.82] }) },
                    { scaleX: land.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.12] }) },
                    { scaleY: bob.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
                  ],
                },
              ]}
            >
              <FaceProvider value={face}>
                {layer(
                  'idle',
                  <IdleLayer
                    active={motion && mood === 'idle'}
                    {...lp}
                    sleeping={sleeping}
                    celebrate={p.finishedAt >= 0 ? `fin-${p.finishedAt}` : null}
                    squint={fx?.kind === 'suspicious' || fx?.kind === 'angry'}
                    stretchKey={stretchKey}
                    chase={!fx && !celebrating && !menuOpen}
                  />,
                )}
                {layer('error', <ErrorLayer active={motion && mood === 'error'} {...lp} intense={many} search={isUndefined} />)}
                {layer('running', <RunningLayer active={motion && mood === 'running'} {...lp} />)}
                {layer('waiting', <WaitingLayer active={motion && mood === 'waiting'} {...lp} />)}
                {layer('crash', <CrashLayer active={motion && mood === 'crash'} {...lp} clones={stackOverflow} />)}
                {layer('alert', <AlertLayer active={mood === 'alert'} {...lp} />)}
                {layer('dizzy', <DizzyLayer active={motion && mood === 'dizzy'} {...lp} />)}
                {layer('pet', <PetLayer active={motion && mood === 'pet'} {...lp} />)}
              </FaceProvider>
            </Animated.View>
            {motion ? <Ambient size={size} active={(mood === 'idle' && !sleeping) || mood === 'pet' || mood === 'waiting'} color={t.primary} /> : null}
            {motion && fxKind ? <ReactionFx key={fxKey} kind={fxKind} s={s} headX={headX} headY={105} dir={dir} color={t.text} /> : null}
            {celebrating && motion ? <Confetti key={fixCount} size={size} /> : null}
          </Pressable>
          {motion
            ? particles.map((pt) => (
              <View key={pt.id} style={[styles.particles, { bottom: size * 0.6, pointerEvents: 'none' }]}>
                <OutputParticle
                  text={pt.text}
                  dx={particleDx}
                  dy={particleDy}
                  bg={t.surface}
                  border={t.primary}
                  color={t.text}
                  onDone={() => removeParticle(pt.id)}
                />
              </View>
            ))
            : null}
        </Animated.View>
      </View>
    </CostumeProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'box-none',
  },
  minOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  minBlock: {
    position: 'absolute',
    pointerEvents: 'box-none',
  },
  block: {
    position: 'absolute',
    zIndex: 50,
    pointerEvents: 'box-none',
  },
  clip: { overflow: 'hidden' },
  card: {
    maxWidth: 260,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      },
    }),
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
  particles: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  peek: { paddingLeft: 4, paddingTop: 6 },
});
