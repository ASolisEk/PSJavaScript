/**
 * Ilustración del dron (vista desde arriba) con hélices que giran, flotación suave y un
 * ojo-cámara que apunta hacia donde mira. El dibujo base mira al Este y se rota según
 * `facing`. Estilo plano del proyecto: contorno grueso, sin degradados.
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { GameTheme } from '../../core/game/api';
import type { Dir } from '../../core/game/world';
import { ND, to, useLoops, useValue } from '../mascot/anim';

export type DroneKind = 'main' | 'intruder';
/** active: trabajando · hacked: reprogramado por el alumno · off: apagado. */
export type DroneState = 'active' | 'hacked' | 'off';

const ANGLE: Record<Dir, number> = { East: 0, South: 90, West: 180, North: -90 };
/** Centros de los rotores en el dibujo de 100×100. */
const ROTORS: [number, number][] = [
  [22, 22],
  [78, 22],
  [22, 78],
  [78, 78],
];
const INK = '#1d2b33';
const LAMP = '#ffd84d';

export interface DronePalette {
  body: string;
  arm: string;
  rotor: string;
}

function palette(kind: DroneKind, state: DroneState, accent: string, danger: string, success: string): DronePalette {
  if (kind === 'main') return { body: accent, arm: '#5a6b75', rotor: 'rgba(255,255,255,0.6)' };
  if (state === 'hacked') return { body: success, arm: '#3f6b2a', rotor: 'rgba(255,255,255,0.55)' };
  if (state === 'off') return { body: '#9aa5ad', arm: '#5f6a72', rotor: 'rgba(255,255,255,0.4)' };
  return { body: danger, arm: '#7a2a2a', rotor: 'rgba(255,140,140,0.45)' };
}

/** Rotación por el camino más corto (de Oeste a Norte gira 90°, no 270°). */
function useFacing(facing: Dir) {
  const rot = useValue(ANGLE[facing]);
  const angle = useRef(ANGLE[facing]);
  useEffect(() => {
    const target = ANGLE[facing];
    let delta = (((target - angle.current) % 360) + 540) % 360 - 180;
    if (delta === -180) delta = 180;
    if (!delta) return;
    angle.current += delta;
    Animated.timing(rot, { toValue: angle.current, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: ND }).start();
  }, [facing, rot]);
  return rot.interpolate({ inputRange: [-3600, 3600], outputRange: ['-3600deg', '3600deg'] });
}

function Drone({ size, kind, state = 'active', theme, facing, accent, danger, success }: { size: number; kind: DroneKind; state?: DroneState; theme: GameTheme; facing: Dir; accent: string; danger: string; success: string }) {
  const spin = useValue(0);
  const bob = useValue(0);
  const flying = state !== 'off';
  useLoops(
    flying,
    () => [Animated.timing(spin, { toValue: 1, duration: kind === 'intruder' ? 220 : 300, easing: Easing.linear, useNativeDriver: ND }), Animated.sequence([to(bob, 1, 750), to(bob, 0, 750)])],
    () => {
      spin.setValue(0);
      bob.setValue(0);
    },
    [kind],
  );
  const rotate = useFacing(facing);
  // los rotores en diagonal giran en sentidos opuestos, como en un cuadricóptero real
  const blade = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const bladeRev = spin.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '-315deg'] });
  const lift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.045] });
  const shadow = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });
  const p = palette(kind, state, accent, danger, success);
  const r = size * 0.15;

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {/* sombra plana sobre el suelo (no flota) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: shadow }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Ellipse cx={54} cy={58} rx={34} ry={30} fill="#000" opacity={flying ? 0.13 : 0.2} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: lift }, { rotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* luz de la lámpara (mina) */}
          {kind === 'main' && theme === 'mine' ? <Polygon points="72,45 72,55 100,68 100,32" fill={LAMP} opacity={0.32} /> : null}
          {/* brazos con contorno */}
          <G strokeLinecap="round">
            {ROTORS.map(([x, y], i) => (
              <Line key={`o${i}`} x1={50} y1={50} x2={x} y2={y} stroke={INK} strokeWidth={11} />
            ))}
            {ROTORS.map(([x, y], i) => (
              <Line key={`a${i}`} x1={50} y1={50} x2={x} y2={y} stroke={p.arm} strokeWidth={6} />
            ))}
          </G>
          {/* discos de los rotores */}
          {ROTORS.map(([x, y], i) => (
            <G key={`r${i}`}>
              <Circle cx={x} cy={y} r={15} fill={p.rotor} stroke={INK} strokeWidth={2.5} />
              <Circle cx={x} cy={y} r={3.5} fill={INK} />
            </G>
          ))}
          {kind === 'main' ? <MainBody body={p.body} theme={theme} /> : <IntruderBody body={p.body} state={state} />}
        </Svg>
        {/* hélices */}
        {ROTORS.map(([x, y], i) => (
          <Animated.View
            key={`b${i}`}
            style={{ position: 'absolute', left: (x / 100) * size - r, top: (y / 100) * size - r, width: r * 2, height: r * 2, transform: [{ rotate: i === 0 || i === 3 ? blade : bladeRev }] }}
          >
            <Svg width={r * 2} height={r * 2} viewBox="0 0 30 30">
              <Ellipse cx={15} cy={6.5} rx={3.2} ry={6.5} fill={INK} opacity={0.78} />
              <Ellipse cx={15} cy={23.5} rx={3.2} ry={6.5} fill={INK} opacity={0.78} />
            </Svg>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

/** Dron del alumno: cuerpo redondeado, ojo-cámara al frente y tanque según el tema. */
function MainBody({ body, theme }: { body: string; theme: GameTheme }) {
  return (
    <G>
      <Rect x={29} y={34} width={44} height={32} rx={14} fill={body} stroke={INK} strokeWidth={3} />
      <Rect x={35} y={38} width={16} height={5} rx={2.5} fill="#fff" opacity={0.4} />
      {theme === 'farm' ? (
        <G>
          {/* tanque de semillas con una hoja */}
          <Rect x={34} y={44} width={14} height={14} rx={3.5} fill="#58cc02" stroke={INK} strokeWidth={2} />
          <Path d="M37.5 55 C38 49.5 42 47 45.5 47.5 C45 52.5 41.5 55.5 37.5 55 Z" fill="#fff" />
        </G>
      ) : (
        <G>
          {/* depósito de mineral con una gema */}
          <Rect x={34} y={44} width={14} height={14} rx={3.5} fill="#8b95a3" stroke={INK} strokeWidth={2} />
          <Polygon points="41,46.5 45.5,51 41,56.5 36.5,51" fill="#b07cff" stroke={INK} strokeWidth={1.2} />
          <Rect x={71} y={45} width={5} height={10} rx={2} fill={LAMP} stroke={INK} strokeWidth={1.5} />
        </G>
      )}
      {/* ojo-cámara mirando al frente */}
      <Circle cx={62} cy={50} r={9} fill="#fff" stroke={INK} strokeWidth={2.5} />
      <Circle cx={65} cy={50} r={4.6} fill={INK} />
      <Circle cx={66.6} cy={48.2} r={1.6} fill="#fff" />
    </G>
  );
}

/** Dron intruso: cuerpo angular, visor oscuro y antena. Cambia según su estado. */
function IntruderBody({ body, state }: { body: string; state: DroneState }) {
  return (
    <G>
      {/* antena trasera */}
      <Line x1={31} y1={50} x2={20} y2={50} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={19} cy={50} r={4} fill={state === 'active' ? LAMP : state === 'hacked' ? '#fff' : '#5f6a72'} stroke={INK} strokeWidth={2} />
      <Polygon points="29,50 38,33 64,33 75,50 64,67 38,67" fill={body} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Polygon points="38,38 50,38 46,43 36,43" fill="#fff" opacity={0.35} />
      {/* visor */}
      <Rect x={53} y={41} width={17} height={18} rx={5} fill={INK} />
      {state === 'active' ? (
        <G>
          <Circle cx={63} cy={51} r={4.2} fill={LAMP} />
          {/* ceño fruncido */}
          <Path d="M52 37 L71 43" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          {/* dientes de sierra */}
          <Polygon points="38,62 42,67 46,62 50,67 54,62" fill="#fff" opacity={0.85} />
        </G>
      ) : state === 'hacked' ? (
        <G>
          <Path d="M57 52 Q61.5 45 66 52" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Path d="M38 50 L44 56 L53 44" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ) : (
        <G>
          <Line x1={57} y1={50} x2={66} y2={50} stroke="#cfd6db" strokeWidth={2.6} strokeLinecap="round" />
          {/* botón de apagado */}
          <Path d="M43 45 A6 6 0 1 0 49 45" stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Line x1={46} y1={42} x2={46} y2={49} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
        </G>
      )}
    </G>
  );
}

export default memo(Drone);
