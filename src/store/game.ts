/** Progreso del juego del dron: tema, nivel, código de cada nivel, estrellas y granja libre. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { GameTheme } from '../core/game/api';
import { ALL_LEVELS, LEVELS } from '../core/game/levels';
import { CUSTOM_PREFIX, CustomLevelData, parseCustomLevel } from '../core/game/custom';
import { randomId } from '../core/exam/random';
import type { ItemId, UnlockId } from '../core/game/world';

const KEY = 'psjs.game.v1';

export type GameSpeed = 'slow' | 'normal' | 'fast' | 'instant';
/** Pausa (ms) después de cada acción del dron. */
export const SPEED_MS: Record<GameSpeed, number> = { slow: 450, normal: 160, fast: 40, instant: 0 };

export interface LevelProgress {
  stars: number;
  /** Mejor tiempo de juego (segundos). */
  bestTime: number | null;
}

export interface SandboxState {
  items: Partial<Record<ItemId, number>>;
  unlocks: Partial<Record<UnlockId, number>>;
}

interface GameState {
  hydrated: boolean;
  theme: GameTheme;
  speed: GameSpeed;
  levelId: string;
  /** Código escrito por el alumno en cada nivel (si no lo ha cambiado, se usa el inicial). */
  code: Record<string, string>;
  progress: Record<string, LevelProgress>;
  sandbox: SandboxState;
  /** Niveles creados con el editor. */
  custom: CustomLevelData[];
  hydrate(): Promise<void>;
  saveCustom(level: CustomLevelData): void;
  deleteCustom(id: string): void;
  /** Importa un nivel compartido (archivo .json); devuelve el nivel creado. */
  importCustom(text: string): CustomLevelData;
  setTheme(theme: GameTheme): void;
  setSpeed(speed: GameSpeed): void;
  selectLevel(id: string): void;
  setCode(id: string, code: string | null): void;
  complete(id: string, stars: number, time: number): void;
  saveSandbox(s: SandboxState): void;
  resetSandbox(): void;
}

let saveTimer: any = null;

export const useGame = create<GameState>((set, get) => {
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const { theme, speed, levelId, code, progress, sandbox, custom } = get();
      AsyncStorage.setItem(KEY, JSON.stringify({ theme, speed, levelId, code, progress, sandbox, custom })).catch(() => {});
    }, 400);
  };
  return {
    hydrated: false,
    theme: 'farm',
    speed: 'normal',
    levelId: LEVELS[0].id,
    code: {},
    progress: {},
    sandbox: { items: {}, unlocks: {} },
    custom: [],

    async hydrate() {
      if (get().hydrated) return;
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const d = raw ? JSON.parse(raw) : {};
        const custom: CustomLevelData[] = Array.isArray(d.custom) ? d.custom.filter((c: any) => c && typeof c.id === 'string' && Array.isArray(c.entities)) : [];
        const known = ALL_LEVELS.some((l) => l.id === d.levelId) || (typeof d.levelId === 'string' && custom.some((c) => CUSTOM_PREFIX + c.id === d.levelId));
        set({
          custom,
          theme: d.theme === 'mine' ? 'mine' : 'farm',
          speed: d.speed in SPEED_MS ? d.speed : 'normal',
          levelId: known ? d.levelId : LEVELS[0].id,
          code: d.code && typeof d.code === 'object' ? d.code : {},
          progress: d.progress && typeof d.progress === 'object' ? d.progress : {},
          sandbox: d.sandbox?.items ? d.sandbox : { items: {}, unlocks: {} },
        });
      } catch {
        /* se empieza de cero */
      }
      set({ hydrated: true });
    },

    setTheme(theme) {
      set({ theme });
      persist();
    },
    setSpeed(speed) {
      set({ speed });
      persist();
    },
    selectLevel(levelId) {
      set({ levelId });
      persist();
    },
    setCode(id, code) {
      const next = { ...get().code };
      if (code === null) delete next[id];
      else next[id] = code;
      set({ code: next });
      persist();
    },
    complete(id, stars, time) {
      const prev = get().progress[id];
      const best = prev?.bestTime == null ? time : Math.min(prev.bestTime, time);
      set({ progress: { ...get().progress, [id]: { stars: Math.max(prev?.stars ?? 0, stars), bestTime: Math.round(best * 10) / 10 } } });
      persist();
    },
    saveSandbox(sandbox) {
      set({ sandbox });
      persist();
    },
    resetSandbox() {
      set({ sandbox: { items: {}, unlocks: {} } });
      persist();
    },
    saveCustom(level) {
      const d = { ...level, updatedAt: Date.now() };
      const list = get().custom;
      set({ custom: list.some((c) => c.id === d.id) ? list.map((c) => (c.id === d.id ? d : c)) : [d, ...list] });
      persist();
    },
    deleteCustom(id) {
      set({ custom: get().custom.filter((c) => c.id !== id), levelId: get().levelId === CUSTOM_PREFIX + id ? LEVELS[0].id : get().levelId });
      persist();
    },
    importCustom(text) {
      const d = parseCustomLevel(text, randomId('nivel'));
      set({ custom: [d, ...get().custom] });
      persist();
      return d;
    },
  };
});

// Acceso para depuración en la consola del navegador (solo desarrollo).
if (__DEV__ && typeof window !== 'undefined') Object.assign(window as any, { __psjsGame: useGame, __psjsGameLevels: ALL_LEVELS });
