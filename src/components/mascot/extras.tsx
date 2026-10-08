/**
 * Estados extra de la mascota: mareado (posible ciclo infinito), acariciado y
 * el confeti de celebración al corregir un error.
 */
import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MONO } from '../../ui/theme';
import { easeIn, easeOut, ND, orbit, startNextFrame, to, useLoops, useValue, useValues, wait } from './anim';
import type { LayerProps } from './layers';
import { ERROR, IDLE, origin } from './sprites';

const fill = StyleSheet.absoluteFill;

/** Espiral de Arquímedes para los ojos mareados. */
function spiralPath(r: number, turns = 3) {
  const pts: string[] = [];
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * turns * 2 * Math.PI;
    const rr = (r * i) / steps;
    pts.push(`${(r + rr * Math.cos(th)).toFixed(2)},${(r + rr * Math.sin(th)).toFixed(2)}`);
  }
  return `M${pts.join(' L')}`;
}

/** Centros y radios de la parte blanca de los ojos en el sprite "confundido". */
const EYES = [
  { x: 149, y: 118, r: 20 },
  { x: 229, y: 104, r: 19 },
];

function DizzyLayerImpl({ active, s }: LayerProps) {
  const wobble = useValue(0);
  const spin = useValue(0);
  const tail = useValue(0);
  const stars = useValue(0);
  const drop = useValue(0);

  useLoops(
    active,
    () => [
      Animated.sequence([to(wobble, 1, 700), to(wobble, -1, 1400), to(wobble, 0, 700)]),
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: ND }),
      Animated.sequence([to(tail, 1, 1500), to(tail, 0, 1500)]),
      Animated.timing(stars, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: ND }),
      Animated.sequence([to(drop, 0, 0), wait(300), to(drop, 1, 900, easeIn), wait(700)]),
    ],
    () => [wobble, spin, tail, stars, drop].forEach((v) => v.setValue(0)),
  );

  const o = origin(ERROR);
  const w = ERROR.w * s;
  const h = ERROR.h * s;
  const path = orbit(78, 16, 24);
  // tres estrellas desfasadas sobre la misma órbita
  const starPos = [0, 1 / 3, 2 / 3].map((ph) => {
    const n = path.input.length - 1;
    const shift = Math.round(ph * n);
    const xs = path.xs.map((_, i) => path.xs[(i + shift) % n] * s);
    const ys = path.ys.map((_, i) => path.ys[(i + shift) % n] * s);
    return { xs, ys };
  });
  return (
    <View style={fill}>
      <Animated.View
        style={{
          position: 'absolute',
          left: o.left * s,
          top: o.top * s,
          transformOrigin: 'center bottom',
          transform: [
            { translateX: wobble.interpolate({ inputRange: [-1, 1], outputRange: [-6 * s, 6 * s] }) },
            { rotate: wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] }) },
          ],
        }}
      >
        <View style={{ width: w, height: h }}>
          <Animated.View
            style={[fill, { transformOrigin: `${ERROR.pivot[0] * s}px ${ERROR.pivot[1] * s}px`, transform: [{ rotate: tail.interpolate({ inputRange: [0, 1], outputRange: ['4deg', '14deg'] }) }] }]}
          >
            <Image source={ERROR.tail} style={{ width: w, height: h }} />
          </Animated.View>
          <Image source={ERROR.body} style={[fill, { width: w, height: h }]} />
          {EYES.map((e, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: (e.x - e.r) * s,
                top: (e.y - e.r) * s,
                width: e.r * 2 * s,
                height: e.r * 2 * s,
                transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: i ? ['360deg', '0deg'] : ['0deg', '360deg'] }) }],
              }}
            >
              <Svg width={e.r * 2 * s} height={e.r * 2 * s} viewBox={`0 0 ${e.r * 2} ${e.r * 2}`}>
                <Circle cx={e.r} cy={e.r} r={e.r} fill="#fdfdfd" />
                <Path d={spiralPath(e.r - 3)} transform="translate(3,3)" stroke="#3a2420" strokeWidth={2.6} fill="none" strokeLinecap="round" />
              </Svg>
            </Animated.View>
          ))}
          <Animated.View
            style={{
              position: 'absolute',
              left: ERROR.drop.x * s,
              top: ERROR.drop.y * s,
              opacity: drop.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-6 * s, 34 * s] }) }],
            }}
          >
            <Image source={ERROR.drop.src} style={{ width: ERROR.drop.w * s, height: ERROR.drop.h * s }} />
          </Animated.View>
        </View>
      </Animated.View>
      {starPos.map((p, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: (o.left + 190) * s,
            top: (o.top + 8) * s,
            fontSize: 30 * s,
            color: '#f6c344',
            textShadowColor: 'rgba(0,0,0,0.35)',
            textShadowRadius: 2,
            transform: [
              { translateX: stars.interpolate({ inputRange: path.input, outputRange: p.xs }) },
              { translateY: stars.interpolate({ inputRange: path.input, outputRange: p.ys }) },
              { rotate: stars.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
          }}
        >
          ★
        </Animated.Text>
      ))}
    </View>
  );
}

function PetLayerImpl({ active, s }: LayerProps) {
  const purr = useValue(0);
  const breathe = useValue(0);
  const tail = useValue(0);
  const hearts = useValues(4);

  useLoops(
    active,
    () => [
      Animated.sequence([to(purr, 1, 70, Easing.linear), to(purr, -1, 140, Easing.linear), to(purr, 0, 70, Easing.linear)]),
      Animated.sequence([to(breathe, 1, 700), to(breathe, 0, 700)]),
      Animated.sequence([to(tail, 1, 900), to(tail, 0, 900)]),
      ...hearts.map((v, i) => Animated.sequence([wait(i * 380), to(v, 1, 1300, Easing.out(Easing.quad)), to(v, 0, 0), wait((3 - i) * 380)])),
    ],
    () => [purr, breathe, tail, ...hearts].forEach((v) => v.setValue(0)),
  );

  const o = origin(IDLE);
  const w = IDLE.w * s;
  const h = IDLE.h * s;
  return (
    <View style={fill}>
      <Animated.View
        style={{
          position: 'absolute',
          left: o.left * s,
          top: o.top * s,
          transformOrigin: 'center bottom',
          transform: [
            { rotate: purr.interpolate({ inputRange: [-1, 1], outputRange: ['-1.4deg', '1.4deg'] }) },
            { scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.975, 1.015] }) },
            { scaleX: breathe.interpolate({ inputRange: [0, 1], outputRange: [1.015, 0.995] }) },
          ],
        }}
      >
        <View style={{ width: w, height: h }}>
          <Animated.View
            style={[fill, { transformOrigin: `${IDLE.pivot[0] * s}px ${IDLE.pivot[1] * s}px`, transform: [{ rotate: tail.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '12deg'] }) }] }]}
          >
            <Image source={IDLE.tail} style={{ width: w, height: h }} />
          </Animated.View>
          <Image source={IDLE.blink} style={[fill, { width: w, height: h }]} />
        </View>
      </Animated.View>
      {hearts.map((v, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: (o.left + 120 + (i % 2 ? 70 : -10)) * s,
            top: (o.top + 40) * s,
            fontSize: (34 - (i % 3) * 6) * s,
            color: '#ff6b8a',
            opacity: v.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 0.9, 0] }),
            transform: [
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -90 * s] }) },
              { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (i % 2 ? 12 : -12) * s, 0] }) },
              { scale: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.1, 0.9] }) },
            ],
          }}
        >
          ♥
        </Animated.Text>
      ))}
    </View>
  );
}

const CONFETTI_COLORS = ['#ff6b8a', '#f6c344', '#4cc38a', '#5b8cff', '#b388ff', '#ff9f43'];

/** Explosión de confeti (se monta con una `key` nueva cada vez). */
function ConfettiImpl({ size }: { size: number }) {
  const p = useValue(0);
  const [pieces] = useState(() =>
    Array.from({ length: 18 }, (_, i) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const speed = 0.55 + Math.random() * 0.6;
      return {
        vx: Math.cos(angle) * speed * size,
        vy: Math.sin(angle) * speed * size * 1.25,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
        w: 5 + Math.random() * 5,
      };
    }),
  );
  useEffect(() => startNextFrame(to(p, 1, 1500, Easing.linear)), [p]);
  const ts = [0, 0.2, 0.4, 0.6, 0.8, 1];
  return (
    <View pointerEvents="none" style={[fill, { alignItems: 'center', justifyContent: 'center' }]}>
      {pieces.map((c, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: c.w,
            height: c.round ? c.w : c.w * 0.55,
            borderRadius: c.round ? c.w / 2 : 1,
            backgroundColor: c.color,
            opacity: p.interpolate({ inputRange: [0, 0.05, 0.75, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: p.interpolate({ inputRange: ts, outputRange: ts.map((t) => c.vx * t) }) },
              // tiro parabólico: sube y cae por la "gravedad"
              { translateY: p.interpolate({ inputRange: ts, outputRange: ts.map((t) => c.vy * t + size * 1.4 * t * t) }) },
              { rotate: p.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${c.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}


// ───────────────────────────── esperando un dato ─────────────────────────────

/** Esperando que la persona escriba un dato: mira hacia abajo y mueve la cola con impaciencia. */
function WaitingLayerImpl({ active, s }: LayerProps) {
  const lean = useValue(0);
  const tap = useValue(0);
  const tail = useValue(0);
  const point = useValue(0);
  const dots = useValues(3);

  useLoops(
    active,
    () => [
      Animated.sequence([to(lean, 1, 900), to(lean, 0, 900)]),
      Animated.sequence([to(tap, 1, 80, easeOut), to(tap, 0, 120, easeIn), to(tap, 1, 80, easeOut), to(tap, 0, 120, easeIn), wait(700)]),
      Animated.sequence([to(tail, 1, 190), to(tail, 0, 190)]),
      Animated.sequence([to(point, 1, 380, easeOut), to(point, 0, 380, easeIn)]),
      ...dots.map((v, i) => Animated.sequence([wait(i * 180), to(v, 1, 220), to(v, 0, 220), wait((2 - i) * 180 + 300)])),
    ],
    () => [lean, tap, tail, point, ...dots].forEach((v) => v.setValue(0)),
  );

  const o = origin(IDLE);
  const w = IDLE.w * s;
  const h = IDLE.h * s;
  return (
    <View style={fill}>
      <Animated.View
        style={{
          position: 'absolute',
          left: o.left * s,
          top: o.top * s,
          transformOrigin: 'center bottom',
          transform: [
            { rotate: lean.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '5deg'] }) },
            { translateY: tap.interpolate({ inputRange: [0, 1], outputRange: [0, -4 * s] }) },
          ],
        }}
      >
        <View style={{ width: w, height: h }}>
          <Animated.View
            style={[fill, { transformOrigin: `${IDLE.pivot[0] * s}px ${IDLE.pivot[1] * s}px`, transform: [{ rotate: tail.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '10deg'] }) }] }]}
          >
            <Image source={IDLE.tail} style={{ width: w, height: h }} />
          </Animated.View>
          <Image source={IDLE.blinkHalf} style={[fill, { width: w, height: h }]} />
        </View>
      </Animated.View>
      {/* puntos suspensivos: "pensando en lo que vas a escribir" */}
      <View style={{ position: 'absolute', left: (o.left + 250) * s, top: (o.top - 6) * s, flexDirection: 'row' }}>
        {dots.map((v, i) => (
          <Animated.View
            key={i}
            style={{
              width: 12 * s,
              height: 12 * s,
              borderRadius: 6 * s,
              marginRight: 6 * s,
              backgroundColor: '#8b95a7',
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6 * s] }) }],
            }}
          />
        ))}
      </View>
      <Animated.Text
        style={{
          position: 'absolute',
          left: (o.left + 255) * s,
          top: (o.top + 215) * s,
          fontSize: 54 * s,
          transform: [{ translateY: point.interpolate({ inputRange: [0, 1], outputRange: [0, 14 * s] }) }],
        }}
      >
        👇
      </Animated.Text>
    </View>
  );
}

// ───────────────────────────── error de ejecución ─────────────────────────────

/** Estrellas girando alrededor de la cabeza (mareo o golpe). */
function Stars({ value, s, cx, cy, rx = 78, ry = 16, count = 3 }: { value: Animated.Value; s: number; cx: number; cy: number; rx?: number; ry?: number; count?: number }) {
  const path = orbit(rx, ry, 24);
  const n = path.input.length - 1;
  return (
    <>
      {Array.from({ length: count }, (_, k) => {
        const sh = Math.round((k / count) * n);
        return (
          <Animated.Text
            key={k}
            style={{
              position: 'absolute',
              left: cx * s,
              top: cy * s,
              fontSize: 30 * s,
              color: '#f6c344',
              textShadowColor: 'rgba(0,0,0,0.35)',
              textShadowRadius: 2,
              transform: [
                { translateX: value.interpolate({ inputRange: path.input, outputRange: path.xs.map((_, i) => path.xs[(i + sh) % n] * s) }) },
                { translateY: value.interpolate({ inputRange: path.input, outputRange: path.ys.map((_, i) => path.ys[(i + sh) % n] * s) }) },
                { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              ],
            }}
          >
            ★
          </Animated.Text>
        );
      })}
    </>
  );
}

/** Error de ejecución: se cae sentado, con estrellas; con `clones` (recursión sin fin) se multiplica. */
function CrashLayerImpl({ active, s, clones = false }: LayerProps & { clones?: boolean }) {
  const impact = useValue(0);
  const stars = useValue(0);
  const tail = useValue(0);
  const wob = useValue(0);
  const ghosts = useValues(3);
  const swirl = useValue(0);

  useEffect(() => {
    if (!active) return;
    impact.setValue(1);
    return startNextFrame(Animated.spring(impact, { toValue: 0, friction: 4, tension: 120, useNativeDriver: ND }));
  }, [active, impact]);

  useLoops(
    active,
    () => [
      Animated.timing(stars, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: ND }),
      Animated.sequence([to(tail, 1, 1800), to(tail, 0, 1800)]),
      Animated.sequence([to(wob, 1, 900), to(wob, -1, 1800), to(wob, 0, 900)]),
      ...ghosts.map((v, i) => Animated.sequence([wait(i * 260), to(v, 1, 380, easeOut), to(v, 0, 520, easeIn), wait((2 - i) * 260 + 200)])),
      Animated.timing(swirl, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: ND }),
    ],
    () => [stars, tail, wob, swirl, ...ghosts].forEach((v) => v.setValue(0)),
  );

  const o = origin(ERROR);
  const w = ERROR.w * s;
  const h = ERROR.h * s;
  return (
    <View style={fill}>
      {clones
        ? ghosts.map((v, i) => {
            const k = 0.78 - i * 0.16;
            return (
              <Animated.Image
                key={i}
                source={ERROR.body}
                style={{
                  position: 'absolute',
                  left: (o.left - 40 - i * 34) * s,
                  top: (o.top + ERROR.h * (1 - k) - 10 - i * 18) * s,
                  width: w * k,
                  height: h * k,
                  opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.6] }),
                  transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
                }}
              />
            );
          })
        : null}
      <Animated.View
        style={{
          position: 'absolute',
          left: o.left * s,
          top: o.top * s,
          transformOrigin: 'center bottom',
          transform: [
            // aplastado como si se hubiera sentado de golpe
            { scaleY: impact.interpolate({ inputRange: [0, 1], outputRange: [0.88, 0.7] }) },
            { scaleX: impact.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.2] }) },
            { rotate: wob.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] }) },
          ],
        }}
      >
        <View style={{ width: w, height: h }}>
          <Animated.View
            style={[fill, { transformOrigin: `${ERROR.pivot[0] * s}px ${ERROR.pivot[1] * s}px`, transform: [{ rotate: tail.interpolate({ inputRange: [0, 1], outputRange: ['30deg', '40deg'] }) }] }]}
          >
            <Image source={ERROR.tail} style={{ width: w, height: h }} />
          </Animated.View>
          <Image source={ERROR.body} style={[fill, { width: w, height: h }]} />
        </View>
      </Animated.View>
      <Stars value={stars} s={s} cx={o.left + 185} cy={o.top + 40} />
      <Animated.Text
        style={{
          position: 'absolute',
          left: (o.left + 210) * s,
          top: (o.top - 30) * s,
          fontSize: 58 * s,
          opacity: impact.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: impact.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.3] }) }],
        }}
      >
        💥
      </Animated.Text>
      {clones ? (
        <Animated.Text
          style={{
            position: 'absolute',
            left: (o.left - 10) * s,
            top: (o.top - 30) * s,
            fontSize: 50 * s,
            transform: [{ rotate: swirl.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }],
          }}
        >
          🌀
        </Animated.Text>
      ) : null}
    </View>
  );
}

// ───────────────────────────── punto de interrupción ─────────────────────────────

/** Pausa en un punto de interrupción: se congela y aparece un "!" sobre la cabeza. */
function AlertLayerImpl({ active, s }: LayerProps) {
  const pop = useValue(0);
  const pulse = useValue(0);
  useEffect(() => {
    if (!active) return;
    pop.setValue(0);
    return startNextFrame(Animated.spring(pop, { toValue: 1, friction: 4, tension: 140, useNativeDriver: ND }));
  }, [active, pop]);
  useLoops(
    active,
    () => [Animated.sequence([to(pulse, 1, 600), to(pulse, 0, 600)])],
    () => pulse.setValue(0),
  );
  const o = origin(IDLE);
  const w = IDLE.w * s;
  const h = IDLE.h * s;
  return (
    <View style={fill}>
      <Animated.View
        style={{
          position: 'absolute',
          left: o.left * s,
          top: o.top * s,
          transformOrigin: 'center bottom',
          // orejas paradas: un estirón vertical que se queda fijo (como estatua)
          transform: [{ scaleY: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }, { rotate: '-2deg' }],
        }}
      >
        <View style={{ width: w, height: h }}>
          <Image source={IDLE.tail} style={[fill, { width: w, height: h }]} />
          <Image source={IDLE.body} style={[fill, { width: w, height: h }]} />
        </View>
      </Animated.View>
      <Animated.Text
        style={{
          position: 'absolute',
          left: (o.left + 215) * s,
          top: (o.top - 62) * s,
          fontSize: 66 * s,
          transform: [
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          ],
        }}
      >
        ❗
      </Animated.Text>
    </View>
  );
}

// ───────────────────────────── efectos de reacción ─────────────────────────────

export type FxKind = 'notes' | 'hat' | 'alert' | 'suspicious' | 'sparkles' | 'think' | 'rewind' | 'fast' | 'angry' | 'yawn';
type FxMode = 'float' | 'pop' | 'drop' | 'twinkle' | 'slide';
interface FxItem {
  g: string;
  x: number;
  y: number;
  size: number;
  delay?: number;
  mode: FxMode;
}

const SPARKLES: FxItem[] = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * 2 * Math.PI;
  return { g: '✨', x: Math.cos(a) * 115, y: Math.sin(a) * 85 + 60, size: 32, delay: i * 0.08, mode: 'twinkle' as FxMode };
});

/** Posiciones relativas al centro de la cabeza (x positivo = hacia el frente). */
const FX: Record<FxKind, { dur: number; items: FxItem[] }> = {
  notes: {
    dur: 1700,
    items: [
      { g: '♪', x: -20, y: -70, size: 36, mode: 'float' },
      { g: '♫', x: 15, y: -78, size: 40, delay: 0.18, mode: 'float' },
      { g: '♪', x: 45, y: -62, size: 32, delay: 0.36, mode: 'float' },
    ],
  },
  hat: { dur: 2600, items: [{ g: '🎩', x: -8, y: -112, size: 64, mode: 'drop' }] },
  alert: { dur: 1600, items: [{ g: '‼️', x: 30, y: -115, size: 56, mode: 'pop' }] },
  suspicious: { dur: 2400, items: [{ g: '👀', x: 75, y: -95, size: 46, mode: 'pop' }] },
  sparkles: { dur: 1500, items: SPARKLES },
  think: { dur: 2600, items: [{ g: '💭', x: 80, y: -120, size: 60, mode: 'pop' }, { g: '🤔', x: 88, y: -116, size: 26, delay: 0.12, mode: 'pop' }] },
  rewind: { dur: 900, items: [{ g: '⏪', x: -100, y: -40, size: 48, mode: 'slide' }] },
  fast: {
    dur: 1400,
    items: [
      { g: '⚡', x: -80, y: -30, size: 42, mode: 'pop' },
      { g: '⚡', x: 85, y: -95, size: 50, delay: 0.15, mode: 'pop' },
      { g: '⚡', x: 105, y: 30, size: 38, delay: 0.3, mode: 'pop' },
    ],
  },
  angry: { dur: 1700, items: [{ g: '💢', x: 55, y: -100, size: 50, mode: 'pop' }] },
  yawn: { dur: 1900, items: [{ g: '🥱', x: 70, y: -95, size: 48, mode: 'pop' }] },
};

/** Efecto puntual (se monta con una `key` nueva cada vez). Coordenadas en unidades de la caja. */
function ReactionFxImpl({ kind, s, headX, headY, dir, color }: { kind: FxKind; s: number; headX: number; headY: number; dir: number; color: string }) {
  const p = useValue(0);
  const def = FX[kind];
  useEffect(() => startNextFrame(to(p, 1, def.dur, Easing.linear)), [p, def.dur]);
  return (
    <View pointerEvents="none" style={fill}>
      {def.items.map((it, i) => {
        const d = it.delay ?? 0;
        // progreso local del elemento (con su retraso) expresado directamente sobre p:
        // en web una interpolación encadenada no se actualiza durante la animación
        const q = {
          interpolate: ({ inputRange, outputRange }: { inputRange: number[]; outputRange: (number | string)[] }) =>
            p.interpolate({ inputRange: inputRange.map((x) => d + x * (1 - d)), outputRange: outputRange as any, extrapolate: 'clamp' }),
        };
        let style: any;
        switch (it.mode) {
          case 'float':
            style = {
              opacity: q.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: q.interpolate({ inputRange: [0, 1], outputRange: [0, -70 * s] }) },
                { translateX: q.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, 10 * s, -10 * s, 0] }) },
              ],
            };
            break;
          case 'pop':
            style = {
              opacity: q.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ scale: q.interpolate({ inputRange: [0, 0.12, 0.22, 0.85, 1], outputRange: [0, 1.3, 1, 1, 0.7] }) }],
            };
            break;
          case 'drop':
            style = {
              opacity: q.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateY: q.interpolate({ inputRange: [0, 0.18, 0.26, 0.32, 1], outputRange: [-80 * s, 0, -14 * s, 0, 0] }) }],
            };
            break;
          case 'twinkle':
            style = {
              opacity: q.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { scale: q.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1.25, 0] }) },
                { rotate: q.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '120deg'] }) },
              ],
            };
            break;
          case 'slide':
            style = {
              opacity: q.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateX: q.interpolate({ inputRange: [0, 1], outputRange: [0, -50 * dir * s] }) }],
            };
            break;
        }
        return (
          <Animated.Text
            key={i}
            style={[
              {
                position: 'absolute',
                left: (headX + it.x * dir - it.size / 2) * s,
                top: (headY + it.y - it.size / 2) * s,
                fontSize: it.size * s,
                color,
                fontWeight: '900',
              },
              style,
            ]}
          >
            {it.g}
          </Animated.Text>
        );
      })}
    </View>
  );
}

/** Burbujita que sale volando cuando el programa escribe en la consola. */
function OutputParticleImpl({ text, dx, dy, onDone, bg, border, color }: { text: string; dx: number; dy: number; onDone(): void; bg: string; border: string; color: string }) {
  const p = useValue(0);
  // se anima una sola vez; onDone puede cambiar de identidad entre renders
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => startNextFrame(to(p, 1, 950, Easing.out(Easing.cubic)), () => done.current()), [p]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        alignSelf: 'center',
        top: 0,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: bg,
        borderColor: border,
        opacity: p.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          { scale: p.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.5, 1, 0.85] }) },
        ],
      }}
    >
      <Text numberOfLines={1} style={{ color, fontSize: 11, fontFamily: MONO, maxWidth: 110 }}>
        › {text}
      </Text>
    </Animated.View>
  );
}

// Memorizados: un re-render del padre recrearía los nodos de interpolación
// y cortaría las animaciones en curso.
export const DizzyLayer = memo(DizzyLayerImpl);
export const PetLayer = memo(PetLayerImpl);
export const Confetti = memo(ConfettiImpl);
export const WaitingLayer = memo(WaitingLayerImpl);
export const CrashLayer = memo(CrashLayerImpl);
export const AlertLayer = memo(AlertLayerImpl);
export const ReactionFx = memo(ReactionFxImpl);
export const OutputParticle = memo(OutputParticleImpl, (a, b) => a.text === b.text && a.dx === b.dx && a.dy === b.dy && a.bg === b.bg && a.border === b.border && a.color === b.color);
