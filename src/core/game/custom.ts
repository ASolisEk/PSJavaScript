/**
 * Niveles creados por el maestro (o el alumno) con el editor: tablero dibujado a mano,
 * objetivo, código inicial y pistas. Se guardan en el dispositivo y se comparten como archivo.
 */
import { GameTheme, THEMES } from './api';
import type { GameLevel } from './levels';
import type { EntityId, GroundId, ItemId, UnlockId } from './world';

export const CUSTOM_FORMAT = 'psjavascript-nivel';
export const CUSTOM_PREFIX = 'custom:';

export type CustomGoal = { kind: 'items'; item: ItemId; amount: number } | { kind: 'plant'; entity: EntityId; amount: number };

export interface CustomLevelData {
  id: string;
  title: string;
  intro: string;
  size: number;
  /** Por columna (x) y fila (y): entidad y suelo de cada casilla. */
  entities: (EntityId | null)[][];
  grounds: GroundId[][];
  /** Las plantas empiezan maduras. */
  grown: boolean;
  goal: CustomGoal;
  starter: string;
  hints: string[];
  timeTarget?: number;
  /** Requisito para la segunda estrella: el código debe contener esta palabra (p. ej. «for»). */
  mustUse?: string;
  author?: string;
  updatedAt: number;
}

/** Plantas que se pueden dibujar en el tablero. */
export const PAINTABLE: (EntityId | null)[] = ['grass', 'bush', 'tree', 'carrot', 'pumpkin', 'sunflower', 'cactus', null];
export const GOAL_ITEMS: ItemId[] = ['hay', 'wood', 'carrot', 'pumpkin', 'power', 'cactus'];
export const GOAL_PLANTS: EntityId[] = ['grass', 'bush', 'tree', 'carrot', 'pumpkin', 'sunflower', 'cactus'];
const ALL_UNLOCKS: Partial<Record<UnlockId, number>> = { trees: 1, carrots: 1, watering: 1, pumpkins: 1, sunflowers: 1, fertilizer: 1, cactus: 1, polyculture: 1 };

export function blankCustomLevel(id: string, size = 5): CustomLevelData {
  return {
    id,
    title: 'Mi nivel',
    intro: 'Explica aquí qué debe hacer el dron y qué concepto se practica.',
    size,
    entities: Array.from({ length: size }, () => Array.from({ length: size }, () => 'grass' as EntityId)),
    grounds: Array.from({ length: size }, () => Array.from({ length: size }, () => 'grassland' as GroundId)),
    grown: true,
    goal: { kind: 'items', item: 'hay', amount: 10 },
    starter: '// Escribe aquí el programa del dron\n',
    hints: [],
    updatedAt: Date.now(),
  };
}

/** Cambia el tamaño conservando lo dibujado. */
export function resizeCustom(d: CustomLevelData, size: number): CustomLevelData {
  const n = Math.max(3, Math.min(10, Math.round(size)));
  const at = <T,>(grid: T[][], x: number, y: number, fallback: T) => grid[x]?.[y] ?? fallback;
  return {
    ...d,
    size: n,
    entities: Array.from({ length: n }, (_, x) => Array.from({ length: n }, (_, y) => at(d.entities, x, y, 'grass' as EntityId | null))),
    grounds: Array.from({ length: n }, (_, x) => Array.from({ length: n }, (_, y) => at(d.grounds, x, y, 'grassland' as GroundId))),
  };
}

/** Valida un nivel importado (archivo de otra persona); lanza un error en español si no sirve. */
export function parseCustomLevel(text: string, newId: string): CustomLevelData {
  let raw: any;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    throw new Error('El archivo no es un nivel válido (JSON).');
  }
  if (!raw || raw.format !== CUSTOM_FORMAT || typeof raw.level !== 'object') throw new Error('El archivo no es un nivel del juego del dron.');
  const l = raw.level;
  const size = Math.max(3, Math.min(10, Math.round(Number(l.size) || 5)));
  const base = resizeCustom({ ...blankCustomLevel(newId, size), entities: Array.isArray(l.entities) ? l.entities : [], grounds: Array.isArray(l.grounds) ? l.grounds : [] }, size);
  const okEntity = (e: unknown): e is EntityId | null => e === null || PAINTABLE.includes(e as EntityId);
  const goal: CustomGoal =
    l.goal?.kind === 'plant' && GOAL_PLANTS.includes(l.goal.entity)
      ? { kind: 'plant', entity: l.goal.entity, amount: Math.max(1, Math.min(200, Math.round(Number(l.goal.amount) || 1))) }
      : { kind: 'items', item: GOAL_ITEMS.includes(l.goal?.item) ? l.goal.item : 'hay', amount: Math.max(1, Math.min(100000, Math.round(Number(l.goal?.amount) || 10))) };
  return {
    ...base,
    title: String(l.title ?? 'Nivel').slice(0, 60) || 'Nivel',
    intro: String(l.intro ?? '').slice(0, 4000),
    entities: base.entities.map((col) => col.map((e) => (okEntity(e) ? e : 'grass'))),
    grounds: base.grounds.map((col) => col.map((g) => (g === 'soil' ? 'soil' : 'grassland'))),
    grown: l.grown !== false,
    goal,
    starter: String(l.starter ?? '').slice(0, 20000),
    hints: (Array.isArray(l.hints) ? l.hints : []).map((h: unknown) => String(h).slice(0, 500)).filter(Boolean).slice(0, 10),
    ...(Number(l.timeTarget) > 0 ? { timeTarget: Math.round(Number(l.timeTarget)) } : {}),
    ...(typeof l.mustUse === 'string' && l.mustUse.trim() ? { mustUse: l.mustUse.trim().slice(0, 40) } : {}),
    ...(typeof l.author === 'string' ? { author: l.author.slice(0, 80) } : {}),
    updatedAt: Date.now(),
  };
}

export function serializeCustomLevel(d: CustomLevelData): string {
  const { id: _id, updatedAt: _u, ...level } = d;
  return JSON.stringify({ format: CUSTOM_FORMAT, version: 1, level }, null, 2);
}

/** Convierte el nivel del editor en un nivel jugable. */
export function toGameLevel(d: CustomLevelData, theme: GameTheme = 'farm'): GameLevel {
  const names = THEMES[theme];
  const goalText =
    d.goal.kind === 'items'
      ? `Junta ${d.goal.amount} de ${names.itemLabel[d.goal.item].toLowerCase()}.`
      : `Ten ${d.goal.amount} de ${names.entityLabel[d.goal.entity].toLowerCase()} en la granja.`;
  return {
    id: CUSTOM_PREFIX + d.id,
    title: d.title || 'Mi nivel',
    concept: d.author ? `Nivel de ${d.author}` : 'Nivel personalizado',
    icon: 'brush-outline',
    intro: d.intro,
    goal: goalText,
    world: {
      size: d.size,
      seed: `custom-${d.id}`,
      items: { wood: 500, hay: 500, carrot: 200, pumpkin: 100, water: 50 },
      unlocks: ALL_UNLOCKS,
      fill: (x, y) => ({ ground: d.grounds[x]?.[y] ?? 'grassland', entity: d.entities[x]?.[y] ?? null, grown: d.grown }),
    },
    check: (w, label) => {
      if (d.goal.kind === 'items') {
        const have = Math.floor(w.items[d.goal.item]);
        return { done: have >= d.goal.amount, progress: `${Math.min(have, d.goal.amount)} / ${d.goal.amount} de ${label(d.goal.item)}`, ratio: Math.min(1, have / d.goal.amount) };
      }
      const have = w.count(d.goal.entity);
      return { done: have >= d.goal.amount, progress: `${Math.min(have, d.goal.amount)} / ${d.goal.amount} plantas`, ratio: Math.min(1, have / d.goal.amount) };
    },
    rules: d.mustUse ? [{ kind: 'contains', pattern: d.mustUse, message: `Usa «${d.mustUse}».` }] : undefined,
    timeTarget: d.timeTarget,
    starter: d.starter,
    hints: d.hints,
    solution: '',
  };
}
