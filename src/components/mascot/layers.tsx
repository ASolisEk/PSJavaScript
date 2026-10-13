/**
 * Una capa por estado de la mascota. Cada capa anima sus partes (cuerpo,
 * cola, ojos y efectos) solo mientras está activa.
 */
import React, { memo, useEffect } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { MONO } from '../../ui/theme';
import { easeIn, easeOut, ND, orbit, to, useLoops, useValue, useValues, wait } from './anim';
import { Outfit, Pose, useSprites } from './costumes';
import { Decoration, ERROR, origin } from './sprites';

export interface LayerProps {
  active: boolean;
  /** Escala de píxeles del sprite a píxeles de pantalla. */
  s: number;
  accent: string;
  muted: string;
  /** Orientación (-1 izquierda, 1 derecha): los textos la aplican de nuevo para leerse al derecho. */
  face?: Animated.Value;
}

const fill = StyleSheet.absoluteFill;

/** Cuerpo + cola de un estado, con la cola girando sobre su base. */
function Cat({
  sprite,
  s,
  tailAngle,
  pose,
  active,
  children,
}: {
  sprite: { w: number; h: number; pivot: [number, number]; body: any; tail: any };
  s: number;
  tailAngle: Animated.AnimatedInterpolation<string>;
  pose: Pose;
  active: boolean;
  children?: React.ReactNode;
}) {
  const w = sprite.w * s;
  const h = sprite.h * s;
  return (
    <View style={{ width: w, height: h }}>
      <Outfit pose={pose} part="back" s={s} w={sprite.w} h={sprite.h} active={active} />
      <Animated.View style={[fill, { transformOrigin: `${sprite.pivot[0] * s}px ${sprite.pivot[1] * s}px`, transform: [{ rotate: tailAngle }] }]}>
        <Image source={sprite.tail} style={{ width: w, height: h }} />
      </Animated.View>
      <Image source={sprite.body} style={[fill, { width: w, height: h }]} />
      {children}
      <Outfit pose={pose} part="front" s={s} w={sprite.w} h={sprite.h} active={active} />
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

function IdleLayerImpl({
  active,
  s,
  muted,
  face,
  sleeping,
  celebrate,
  squint = false,
  stretchKey = 0,
  chase = false,
}: LayerProps & { sleeping: boolean; celebrate: string | null; squint?: boolean; stretchKey?: number; chase?: boolean }) {
  const { IDLE } = useSprites();
  const stretch = useValue(0);
  const flyT = useValue(0);
  const lunge = useValue(0);
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

  // ojos entrecerrados (sospecha)
  useEffect(() => {
    if (!active || sleeping) return;
    to(half, squint ? 1 : 0, 160).start();
  }, [active, sleeping, squint, half]);

  // estirarse al despertar
  useEffect(() => {
    if (!active || !stretchKey) return;
    Animated.sequence([to(stretch, 1, 550, easeOut), wait(380), to(stretch, 0, 520)]).start();
  }, [active, stretchKey, stretch]);

  // de vez en cuando aparece una mosca y le lanza un zarpazo
  useEffect(() => {
    if (!active || sleeping || !chase) return;
    let timer: ReturnType<typeof setTimeout>;
    let anim: Animated.CompositeAnimation | null = null;
    const schedule = (ms: number) => {
      timer = setTimeout(() => {
        flyT.setValue(0);
        anim = Animated.parallel([
          Animated.timing(flyT, { toValue: 1, duration: 3400, easing: Easing.linear, useNativeDriver: ND }),
          Animated.sequence([wait(1750), to(lunge, 1, 150, easeOut), to(lunge, 0, 420, easeIn)]),
        ]);
        anim.start(() => schedule(22000 + Math.random() * 18000));
      }, ms);
    };
    schedule(8000 + Math.random() * 8000);
    return () => {
      clearTimeout(timer);
      anim?.stop();
      flyT.setValue(0);
      lunge.setValue(0);
    };
  }, [active, sleeping, chase, flyT, lunge]);

  // parpadeo aleatorio (a veces doble)
  useEffect(() => {
    if (!active || sleeping || squint) return;
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
  }, [active, sleeping, squint, half, closed]);

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
            { translateX: lunge.interpolate({ inputRange: [0, 1], outputRange: [0, 22 * s] }) },
            { rotate: lunge.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] }) },
            { rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: ['-1.6deg', '1.6deg'] }) },
            { scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.028] }) },
            { scaleX: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.99] }) },
            { scaleX: stretch.interpolate({ inputRange: [0, 1], outputRange: [1, 1.17] }) },
            { scaleY: stretch.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) },
          ],
        }}
      >
        <Cat sprite={IDLE} s={s} pose="idle" active={active} tailAngle={tail.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '8deg'] })}>
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
              // el texto se voltea igual que la mascota para leerse al derecho
              { scaleX: face ?? -1 },
            ],
          }}
        >
          z
        </Animated.Text>
      ))}
      <Animated.View
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          left: (o.left - ERROR.fly.w / 2) * s,
          top: (o.top - ERROR.fly.h / 2) * s,
          opacity: flyT.interpolate({ inputRange: [0, 0.03, 0.95, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: flyT.interpolate({ inputRange: CHASE.t, outputRange: CHASE.x.map((x) => x * s) }) },
            { translateY: flyT.interpolate({ inputRange: CHASE.t, outputRange: CHASE.y.map((y) => y * s) }) },
            { scaleX: flyT.interpolate({ inputRange: [0, 0.4, 0.41, 0.6, 0.61, 1], outputRange: [-1, -1, 1, 1, -1, -1] }) },
          ],
        }}
      >
        <Image source={ERROR.fly.src} style={{ width: ERROR.fly.w * s, height: ERROR.fly.h * s }} />
      </Animated.View>
    </View>
  );
}

/** Recorrido de la mosca que persigue en reposo (coordenadas del sprite, frente = derecha). */
const CHASE = {
  t: [0, 0.15, 0.3, 0.45, 0.52, 0.58, 0.75, 1],
  x: [400, 330, 280, 310, 290, 330, 370, 420],
  y: [-40, 5, 45, 80, 100, 50, -15, -80],
};

// ───────────────────────────── error ─────────────────────────────

function ErrorLayerImpl({ active, s, intense = false, search = false }: LayerProps & { intense?: boolean; search?: boolean }) {
  const { ERROR } = useSprites();
  const rain = useValues(3);
  const scan = useValue(0);
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
      Animated.sequence([to(shake, 1, 45), to(shake, -1, 70), to(shake, 1, 70), to(shake, -1, 70), to(shake, 0, 45), wait(intense ? 250 : 900)]),
      // lluvia de la nube (muchos errores) y lupa buscando (variable no definida)
      ...rain.map((v, i) => Animated.sequence([wait(i * 210), to(v, 1, 520, easeIn), to(v, 0, 0), wait((2 - i) * 210)])),
      Animated.sequence([to(scan, 1, 700), to(scan, -1, 1400), to(scan, 0, 700)]),
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
    () => [shake, rock, tail, left, right, drop, sweat, fly, buzz, scan, ...q, ...rain].forEach((v) => v.setValue(0)),
    [intense],
  );

  const amp = intense ? 7 : 3;
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
            { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-amp * s, amp * s] }) },
            { rotate: rock.interpolate({ inputRange: [-1, 1], outputRange: ['-2.2deg', '2.2deg'] }) },
          ],
        }}
      >
        <Cat sprite={ERROR} s={s} pose="error" active={active} tailAngle={tail.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '6deg'] })}>
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
          {intense
            ? EXTRA_FLIES.map((f, i) => {
                const p = orbit(f.rx, f.ry);
                const n = p.input.length - 1;
                const sh = Math.round(f.phase * n);
                return (
                  <Deco
                    key={`f${i}`}
                    d={{ ...ERROR.fly, x: f.x, y: f.y, w: ERROR.fly.w * f.k, h: ERROR.fly.h * f.k }}
                    s={s}
                    style={{
                      transform: [
                        { translateX: fly.interpolate({ inputRange: p.input, outputRange: p.xs.map((_, j) => p.xs[(j + sh) % n] * s) }) },
                        { translateY: fly.interpolate({ inputRange: p.input, outputRange: p.ys.map((_, j) => p.ys[(j + sh) % n] * s) }) },
                        { rotate: buzz.interpolate({ inputRange: [-1, 1], outputRange: ['8deg', '-8deg'] }) },
                      ],
                    }}
                  />
                );
              })
            : null}
          {intense ? (
            <View style={{ position: 'absolute', left: 60 * s, top: -112 * s, pointerEvents: 'none' }}>
              <Animated.Text style={{ fontSize: 64 * s, transform: [{ translateX: rock.interpolate({ inputRange: [-1, 1], outputRange: [-6 * s, 6 * s] }) }] }}>☁️</Animated.Text>
              {rain.map((v, i) => (
                <Animated.View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: (18 + i * 16) * s,
                    top: 58 * s,
                    width: Math.max(1.5, 3.5 * s),
                    height: 14 * s,
                    borderRadius: 2,
                    backgroundColor: '#5fa8ff',
                    opacity: v.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 46 * s] }) }],
                  }}
                />
              ))}
            </View>
          ) : null}
          {search ? (
            <Animated.Text
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                left: 205 * s,
                top: 175 * s,
                fontSize: 54 * s,
                transform: [
                  { translateX: scan.interpolate({ inputRange: [-1, 1], outputRange: [-22 * s, 22 * s] }) },
                  { rotate: scan.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '10deg'] }) },
                ],
              }}
            >
              🔍
            </Animated.Text>
          ) : null}
        </Cat>
      </Animated.View>
    </View>
  );
}

/** Moscas extra cuando hay muchos errores. */
const EXTRA_FLIES = [
  { x: 20, y: 20, rx: 26, ry: 16, phase: 0.4, k: 0.75 },
  { x: 150, y: -60, rx: 34, ry: 12, phase: 0.75, k: 0.6 },
];

// ───────────────────────────── ejecutando ─────────────────────────────

const CODE_BITS = ['{ }', ';', '=>', '01', '( )'];
const FLASH_KEYS = [0, 4, 9, 12, 15, 18, 6, 13];

function RunningLayerImpl({ active, s, accent, muted, face }: LayerProps) {
  const { RUNNING } = useSprites();
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
        <Cat sprite={RUNNING} s={s} pose="running" active={active} tailAngle={tail.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '10deg'] })}>
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
              { scaleX: face ?? -1 },
            ],
          }}
        >
          {CODE_BITS[i]}
        </Animated.Text>
      ))}
    </View>
  );
}

// Memorizados: un re-render del padre recrearía los nodos de interpolación
// y cortaría las animaciones en curso.
export const IdleLayer = memo(IdleLayerImpl);
export const ErrorLayer = memo(ErrorLayerImpl);
export const RunningLayer = memo(RunningLayerImpl);
