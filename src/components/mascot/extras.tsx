/**
 * Estados extra de la mascota: mareado (posible ciclo infinito), acariciado y
 * el confeti de celebración al corregir un error.
 */
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { easeIn, ND, orbit, to, useLoops, useValue, useValues, wait } from './anim';
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

export function DizzyLayer({ active, s }: LayerProps) {
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

export function PetLayer({ active, s }: LayerProps) {
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
export function Confetti({ size }: { size: number }) {
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
  useEffect(() => {
    to(p, 1, 1500, Easing.linear).start();
  }, [p]);
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

