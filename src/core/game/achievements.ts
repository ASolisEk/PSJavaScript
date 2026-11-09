/** Logros del juego del dron (se calculan con las estrellas de cada nivel). */
import { HACK_MISSIONS, LEVELS } from './levels';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

type Progress = Record<string, { stars: number } | undefined>;

const build = () => LEVELS.filter((l) => !l.sandbox);
const done = (p: Progress, id: string) => (p[id]?.stars ?? 0) > 0;
const three = (p: Progress, id: string) => (p[id]?.stars ?? 0) >= 3;

const RULES: (Achievement & { test(p: Progress): boolean })[] = [
  { id: 'primer-vuelo', title: 'Primer vuelo', description: 'Completa tu primer nivel.', icon: 'paper-plane-outline', test: (p) => build().some((l) => done(p, l.id)) },
  { id: 'aprendiz', title: 'Aprendiz de dron', description: 'Completa la mitad de los niveles de construcción.', icon: 'school-outline', test: (p) => build().filter((l) => done(p, l.id)).length >= Math.ceil(build().length / 2) },
  { id: 'ciclos', title: 'Domador de ciclos', description: 'Completa «A recorrer la fila» y «Toda la granja».', icon: 'repeat-outline', test: (p) => done(p, 'recorrer-fila') && done(p, 'toda-la-granja') },
  { id: 'arreglos', title: 'Ordenado', description: 'Completa «Cactus ordenados» (ordenar un arreglo en la granja).', icon: 'swap-vertical-outline', test: (p) => done(p, 'cactus') },
  { id: 'programador', title: 'Programador completo', description: 'Completa los niveles de funciones, objetos y recursión.', icon: 'code-slash-outline', test: (p) => done(p, 'mis-funciones') && done(p, 'pedido-objeto') && done(p, 'recursion') },
  { id: 'maestro', title: 'Maestro del dron', description: 'Completa todos los niveles de construcción.', icon: 'ribbon-outline', test: (p) => build().every((l) => done(p, l.id)) },
  { id: 'perfeccionista', title: 'Perfeccionista', description: 'Consigue 3 estrellas en 5 niveles.', icon: 'star-outline', test: (p) => [...build(), ...HACK_MISSIONS].filter((l) => three(p, l.id)).length >= 5 },
  { id: 'estrella-total', title: 'Estrella total', description: '3 estrellas en todos los niveles de construcción.', icon: 'star', test: (p) => build().every((l) => three(p, l.id)) },
  { id: 'primera-defensa', title: 'Primera defensa', description: 'Completa tu primera misión de hackeo.', icon: 'shield-outline', test: (p) => HACK_MISSIONS.some((l) => done(p, l.id)) },
  { id: 'ciberguardian', title: 'Ciberguardián', description: 'Completa todas las misiones de hackeo.', icon: 'shield-checkmark-outline', test: (p) => HACK_MISSIONS.every((l) => done(p, l.id)) },
];

export const ACHIEVEMENTS: Achievement[] = RULES.map(({ test: _t, ...a }) => a);

/** Ids de los logros conseguidos con ese progreso. */
export function unlockedAchievements(p: Progress): string[] {
  return RULES.filter((r) => r.test(p)).map((r) => r.id);
}
