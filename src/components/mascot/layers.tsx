/**
 * Una capa por estado de la mascota. Cada capa anima sus partes (cuerpo,
 * cola, ojos y efectos) solo mientras está activa.
 */
import React, { useEffect } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { MONO } from '../../ui/theme';
import { easeIn, easeOut, ND, orbit, to, useLoops, useValue, useValues, wait } from './anim';
import { Decoration, ERROR, IDLE, origin, RUNNING } from './sprites';

export interface LayerProps {
  active: boolean;
  /** Escala de píxeles del sprite a píxeles de pantalla. */
  s: number;
  accent: string;
  muted: string;
}

const fill = StyleSheet.absoluteFill;

/** Cuerpo + cola de un estado, con la cola girando sobre su base. */
function Cat({ sprite, s, tailAngle, children }: { sprite: { w: number; h: number; pivot: [number, number]; body: any; tail: any }; s: number; tailAngle: Animated.AnimatedInterpolation<string>; children?: React.ReactNode }) {
  const w = sprite.w * s;
  const h = sprite.h * s;
  return (
    <View style={{ width: w, height: h }}>
      <Animated.View style={[fill, { transformOrigin: `${sprite.pivot[0] * s}px ${sprite.pivot[1] * s}px`, transform: [{ rotate: tailAngle }] }]}>
        <Image source={sprite.tail} style={{ width: w, height: h }} />
      </Animated.View>
      <Image source={sprite.body} style={[fill, { width: w, height: h }]} />
      {children}
    </View>
  );
}

function Deco({ d, s, style }: { d: Decoration; s: number; style?: any }) {
  return (
    <Animated.View style={[{ position: 'absolute', left: d.x * s, top: d.y * s, width: d.w * s, height: d.h * s }, style]}>
      <Image source={d.src} style={{ width: d.w * s, height: d.h * s }} />
    </Animated.View>
  );
}

// ───────────────────────────── reposo ─────────────────────────────

export function IdleLayer({ active, s, muted, sleeping, celebrate }: LayerProps & { sleeping: boolean; celebrate: string | null }) {
  const breathe = useValue(0);
  const sway = useValue(0);
  const tail = useValue(0);
  const half = useValue(0);
  const closed = useValue(0);
  const hop = useValue(0);
  const z = useValues(3);

  // respiración, balanceo y cola (más lentos al dormir)
  useLoops(
    active,
    () => {
      const k = sleeping ? 1.8 : 1;
      return [
        Animated.sequence([to(breathe, 1, 1600 * k), to(breathe, 0, 1600 * k)]),
        Animated.sequence([to(sway, 1, 2400 * k), to(sway, -1, 4800 * k), to(sway, 0, 2400 * k)]),
        Animated.sequence([to(tail, 1, sleeping ? 2600 : 1250), to(tail, 0, sleeping ? 2600 : 1250)]),
      ];
    },
    () => [breathe, sway, tail].forEach((v) => v.setValue(0)),
    [sleeping],
  );

  // dormido: ojos cerrados y "Zzz" flotando
  useEffect(() => {
    if (!active) return;
    to(closed, sleeping ? 1 : 0, sleeping ? 500 : 160).start();
  }, [active, sleeping, closed]);
  useLoops(
    active && sleeping,
    () => z.map((v, i) => Animated.sequence([wait(i * 700), to(v, 1, 2100, Easing.out(Easing.sin)), to(v, 0, 0), wait((2 - i) * 700)])),
    () => z.forEach((v) => v.setValue(0)),
  );

  // parpadeo aleatorio (a veces doble)
  useEffect(() => {
    if (!active || sleeping) return;
    let timer: ReturnType<typeof setTimeout>;
    let running: Animated.CompositeAnimation | null = null;
    const blinkOnce = () =>
      Animated.sequence([to(half, 1, 55, easeIn), to(closed, 1, 45, easeIn), wait(70), to(closed, 0, 45, easeOut), to(half, 0, 70, easeOut)]);
    const schedule = () => {
      timer = setTimeout(() => {
        running = Math.random() < 0.25 ? Animated.sequence([blinkOnce(), wait(90), blinkOnce()]) : blinkOnce();
        running.start(() => schedule());
      }, 2200 + Math.random() * 3200);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      running?.stop();
      half.setValue(0);
    };
  }, [active, sleeping, half, closed]);

  // saltito: al terminar un programa y de vez en cuando
  useEffect(() => {
    if (!active || !celebrate) return;
    Animated.sequence([to(hop, 1, 170, easeOut), to(hop, 0, 520, Easing.bounce), to(hop, 0.6, 140, easeOut), to(hop, 0, 380, Easing.bounce)]).start();
  }, [active, celebrate, hop]);
  useEffect(() => {
    if (!active || sleeping) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        Animated.sequence([to(hop, 0.55, 160, easeOut), to(hop, 0, 420, Easing.bounce)]).start(() => schedule());
      }, 9000 + Math.random() * 9000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [active, sleeping, hop]);

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
            { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -26 * s] }) },
            { rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: ['-1.6deg', '1.6deg'] }) },
            { scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.028] }) },
            { scaleX: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.99] }) },
          ],
        }}
      >
        <Cat sprite={IDLE} s={s} tailAngle={tail.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '8deg'] })}>
          <Animated.Image source={IDLE.blinkHalf} style={[fill, { width: w, height: h, opacity: half }]} />
          <Animated.Image source={IDLE.blink} style={[fill, { width: w, height: h, opacity: closed }]} />
        </Cat>
      </Animated.View>
      {z.map((v, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: (o.left + 250) * s,
            top: (o.top + 10) * s,
            fontSize: (34 - i * 6) * s,
            fontWeight: '900',
            color: muted,
            opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 0.9, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 44 * s] }) },
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -70 * s] }) },
              { rotate: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-10deg', '8deg', '-6deg'] }) },
              // la mascota está volteada: el texto se voltea de nuevo para leerse bien
              { scaleX: -1 },
            ],
          }}
        >
          z
        </Animated.Text>
      ))}
    </View>
  );
}

// ───────────────────────────── error ─────────────────────────────

export function ErrorLayer({ active, s }: LayerProps) {
  const shake = useValue(0);
  const rock = useValue(0);
  const tail = useValue(0);
  const left = useValue(0);
  const right = useValue(0);
  const q = useValues(3);
  const drop = useValue(0);
  const sweat = useValue(0);
  const fly = useValue(0);
  const buzz = useValue(0);

  useLoops(
    active,
    () => [
      // temblor nervioso con pausas
      Animated.sequence([to(shake, 1, 45), to(shake, -1, 70), to(shake, 1, 70), to(shake, -1, 70), to(shake, 0, 45), wait(900)]),
      Animated.sequence([to(rock, 1, 1100), to(rock, -1, 1100)]),
      Animated.sequence([to(tail, 1, 260, easeOut), to(tail, 0, 300, easeIn)]),
      // mirada inquieta: centro → izquierda → centro → derecha
      Animated.sequence([wait(450), to(left, 1, 90), wait(700), to(left, 0, 90), wait(280), to(right, 1, 90), wait(600), to(right, 0, 90), wait(380)]),
      // signos de interrogación saltando escalonados
      ...q.map((v, i) => Animated.sequence([wait(i * 170), to(v, 1, 280, easeOut), to(v, 0, 460, Easing.bounce), wait(520 - i * 170)])),
      // gota que resbala y cae
      Animated.sequence([to(drop, 0, 0), wait(250), to(drop, 1, 950, easeIn), wait(350)]),
      Animated.sequence([to(sweat, 1, 420), to(sweat, 0, 420)]),
      // mosca dando vueltas y zumbando
      Animated.timing(fly, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: ND }),
      Animated.sequence([to(buzz, 1, 60, Easing.linear), to(buzz, -1, 120, Easing.linear), to(buzz, 0, 60, Easing.linear)]),
    ],
    () => [shake, rock, tail, left, right, drop, sweat, fly, buzz, ...q].forEach((v) => v.setValue(0)),
  );

  const o = origin(ERROR);
  const w = ERROR.w * s;
  const h = ERROR.h * s;
  const path = orbit(30, 20);
  return (
    <View style={fill}>
      <Animated.View
        style={{
          position: 'absolute',
          left: o.left * s,
          top: o.top * s,
          transformOrigin: 'center bottom',
          transform: [
            { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-3 * s, 3 * s] }) },
            { rotate: rock.interpolate({ inputRange: [-1, 1], outputRange: ['-2.2deg', '2.2deg'] }) },
          ],
        }}
      >
        <Cat sprite={ERROR} s={s} tailAngle={tail.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '6deg'] })}>
          <Animated.Image source={ERROR.lookLeft} style={[fill, { width: w, height: h, opacity: left }]} />
          <Animated.Image source={ERROR.lookRight} style={[fill, { width: w, height: h, opacity: right }]} />
          {ERROR.questions.map((d, i) => (
            <Deco
              key={i}
              d={d}
              s={s}
              style={{
                transform: [
                  { translateY: q[i].interpolate({ inputRange: [0, 1], outputRange: [0, -12 * s] }) },
                  { rotate: q[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', i % 2 ? '12deg' : '-12deg'] }) },
                  { scale: q[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
                ],
              }}
            />
          ))}
          <Deco
            d={ERROR.drop}
            s={s}
            style={{
              opacity: drop.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-6 * s, 34 * s] }) }],
            }}
          />
          <Deco
            d={ERROR.sweat}
            s={s}
            style={{
              opacity: sweat.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [{ scale: sweat.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.12] }) }],
            }}
          />
          <Deco
            d={ERROR.fly}
            s={s}
            style={{
              transform: [
                { translateX: fly.interpolate({ inputRange: path.input, outputRange: path.xs.map((x) => x * s) }) },
                { translateY: fly.interpolate({ inputRange: path.input, outputRange: path.ys.map((y) => y * s) }) },
                // mira hacia donde vuela
                { scaleX: fly.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [-1, -1, 1, 1] }) },
                { rotate: buzz.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] }) },
              ],
            }}
          />
        </Cat>
      </Animated.View>
    </View>
  );
}

// ───────────────────────────── ejecutando ─────────────────────────────

const CODE_BITS = ['{ }', ';', '=>', '01', '( )'];
const FLASH_KEYS = [0, 4, 9, 12, 15, 18, 6, 13];

export function RunningLayer({ active, s, accent, muted }: LayerProps) {
  const gallop = useValue(0);
  const tail = useValue(0);
  const keys = useValues(FLASH_KEYS.length);
  const bits = useValues(CODE_BITS.length);
  const lines = useValues(3);
  const dust = useValues(2);

  useLoops(
    active,
    () => [
      Animated.sequence([to(gallop, 1, 150, easeOut), to(gallop, 0, 150, easeIn)]),
      Animated.sequence([to(tail, 1, 150), to(tail, 0, 150)]),
      // teclas: cada una con su propio ritmo para que parezca escritura real
      ...keys.map((v, i) => Animated.sequence([wait(i * 83), to(v, 1, 60, Easing.linear), to(v, 0, 200, easeOut), wait(240 + (i % 3) * 110)])),
      ...bits.map((v, i) => Animated.sequence([wait(i * 360), to(v, 1, 1150, Easing.out(Easing.cubic)), to(v, 0, 0), wait((CODE_BITS.length - 1 - i) * 360 + 200)])),
      ...lines.map((v, i) => Animated.sequence([wait(i * 150), to(v, 1, 420, Easing.linear), to(v, 0, 0), wait((2 - i) * 150)])),
      ...dust.map((v, i) => Animated.sequence([wait(i * 300), to(v, 1, 560, easeOut), to(v, 0, 0), wait((1 - i) * 300 + 40)])),
    ],
    () => [gallop, tail, ...keys, ...bits, ...lines, ...dust].forEach((v) => v.setValue(0)),
  );

  const o = origin(RUNNING);
  return (
    <View style={fill}>
      {lines.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: (o.left - 6) * s,
            top: (o.top + 150 + i * 28) * s,
            width: (60 - i * 10) * s,
            height: Math.max(2, 5 * s),
            borderRadius: 3,
            backgroundColor: muted,
            opacity: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 0] }),
            transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [10 * s, -40 * s] }) }],
          }}
        />
      ))}
      {dust.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: (o.left + 20 + i * 30) * s,
            top: (o.top + 225 + i * 8) * s,
            width: 26 * s,
            height: 26 * s,
            borderRadius: 13 * s,
            backgroundColor: muted,
            opacity: v.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.35, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -26 * s] }) },
              { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] }) },
            ],
          }}
        />
      ))}
      <Animated.View
        style={{
          position: 'absolute',
          left: o.left * s,
          top: o.top * s,
          transformOrigin: 'center bottom',
          transform: [
            { translateY: gallop.interpolate({ inputRange: [0, 1], outputRange: [0, -9 * s] }) },
            { rotate: gallop.interpolate({ inputRange: [0, 1], outputRange: ['1.5deg', '-2.5deg'] }) },
            { scaleY: gallop.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.965, 1, 1.01] }) },
          ],
        }}
      >
        <Cat sprite={RUNNING} s={s} tailAngle={tail.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '10deg'] })}>
          {keys.map((v, i) => {
            const [kx, ky] = RUNNING.keys[FLASH_KEYS[i]];
            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  left: (kx - 7) * s,
                  top: (ky - 4) * s,
                  width: 14 * s,
                  height: 8 * s,
                  borderRadius: 2 * s,
                  backgroundColor: '#fffbe6',
                  opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.95] }),
                  transform: [{ rotate: '-24deg' }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }],
                }}
              />
            );
          })}
        </Cat>
      </Animated.View>
      {bits.map((v, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: (o.left + 225 + i * 6) * s,
            top: (o.top + 200) * s,
            fontSize: Math.max(9, 28 * s),
            fontWeight: '800',
            fontFamily: MONO,
            color: i % 2 ? accent : muted,
            opacity: v.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0, 1, 0.9, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, (30 + i * 14) * s] }) },
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -(90 + i * 10) * s] }) },
              { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.15] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', i % 2 ? '18deg' : '-14deg'] }) },
              { scaleX: -1 },
            ],
          }}
        >
          {CODE_BITS[i]}
        </Animated.Text>
      ))}
    </View>
  );
}
