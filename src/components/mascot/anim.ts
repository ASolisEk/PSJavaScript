/** Utilidades de animación para la mascota (Animated de React Native). */
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';

/** En web no existe el driver nativo; se anima en JS. */
export const ND = Platform.OS !== 'web';

/** Valor animado estable (sin leer refs durante el render). */
export function useValue(initial = 0): Animated.Value {
  return useState(() => new Animated.Value(initial))[0];
}

export const ease = Easing.inOut(Easing.sin);
export const easeOut = Easing.out(Easing.quad);
export const easeIn = Easing.in(Easing.quad);

export function to(v: Animated.Value, toValue: number, duration: number, easing = ease) {
  return Animated.timing(v, { toValue, duration, easing, useNativeDriver: ND });
}

export const wait = (ms: number) => Animated.delay(ms);

/** Varios valores animados estables. */
export function useValues(n: number, initial = 0): Animated.Value[] {
  return useState(() => Array.from({ length: n }, () => new Animated.Value(initial)))[0];
}

/**
 * Ejecuta las animaciones en bucle mientras `active` sea verdadero y las
 * detiene (volviendo los valores a su reposo) cuando deja de serlo.
 * `build` debe ser estable o depender solo de `deps`.
 */
export function useLoops(active: boolean, build: () => Animated.CompositeAnimation[], reset: () => void, deps: unknown[] = []) {
  useEffect(() => {
    if (!active) return;
    const anims = build().map((a) => Animated.loop(a));
    anims.forEach((a) => a.start());
    return () => {
      anims.forEach((a) => a.stop());
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}

/** Puntos de una elipse para recorridos circulares (p. ej. la mosca). */
export function orbit(rx: number, ry: number, steps = 16) {
  const input: number[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    input.push(t);
    xs.push(rx * Math.cos(2 * Math.PI * t) - rx);
    ys.push(ry * Math.sin(2 * Math.PI * t));
  }
  return { input, xs, ys };
}
