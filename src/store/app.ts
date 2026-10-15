/**
 * Estado global de la aplicación: archivos, configuración, ejecución y
 * diagnósticos. El ejecutor (Runner) vive fuera del estado para no
 * provocar renderizados innecesarios.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { analyze, Diagnostic, hasBlockingErrors } from '../core/analyzer';
import { EXAMPLES, NEW_FILE_TEMPLATE } from '../core/examples';
import { DEFAULT_PROFILE_ID, getProfile, Profile, ProfileFlags } from '../core/profiles';
import { InputValue, Runner, RunMode, RunnerSnapshot } from '../core/runner';
import type { UpdateCheckResult } from '../core/updater';
import { rememberMode } from '../ui/examLink';

export interface FileDoc {
  id: string;
  name: string;
  code: string;
  breakpoints: number[];
  updatedAt: number;
}

export type PanelId = 'editor' | 'console' | 'variables' | 'desktop' | 'diagram' | 'explain' | 'problems';
export type ModalId = null | 'files' | 'export' | 'settings' | 'help' | 'insert' | 'update' | 'exam';
/** Pantalla activa: el entorno normal, el modo Maestro o el modo Examen (alumno). */
export type AppMode = 'ide' | 'teacher' | 'student';

export interface Settings {
  profileId: string;
  customFlags: Partial<ProfileFlags>;
  speed: number;
  explain: boolean;
  realtime: boolean;
  fontSize: number;
  theme: 'system' | 'light' | 'dark';
  diagramMode: 'classic' | 'nassi';
  diagramComments: boolean;
  showFunctions: boolean;
  mascot: boolean;
  /** Posición elegida al arrastrar la mascota (distancia a la esquina inferior derecha). */
  mascotPos: { right: number; bottom: number } | null;
  /** Vestuario de la mascota: 'auto' (según la fecha), 'none' o el id de un vestuario. */
  mascotCostume: string;
  /** Personaje de la mascota: Michi el gato o Capi el capibara. */
  mascotCharacter: 'gato' | 'capibara';
  /** Teléfono en vertical: panel bajo el código abierto o no y parte del alto que ocupa el código. */
  mobilePane: { open: boolean; share: number };
}

const DEFAULT_SETTINGS: Settings = {
  profileId: DEFAULT_PROFILE_ID,
  customFlags: {},
  speed: 400,
  explain: true,
  realtime: false,
  fontSize: 14,
  theme: 'system',
  diagramMode: 'classic',
  diagramComments: true,
  showFunctions: false,
  mascot: true,
  mascotPos: null,
  mascotCostume: 'auto',
  mascotCharacter: 'gato',
  mobilePane: { open: true, share: 0.6 },
};

/** Reparto móvil guardado, corregido si viene de una versión anterior o incompleto. */
function sanePane(p: Partial<Settings['mobilePane']> | undefined): Settings['mobilePane'] {
  const d = DEFAULT_SETTINGS.mobilePane;
  const share = typeof p?.share === 'number' && p.share >= 0.2 && p.share <= 0.9 ? p.share : d.share;
  return { open: typeof p?.open === 'boolean' ? p.open : d.open, share };
}

export const SPEEDS = [1200, 700, 400, 200, 80, 20];

interface EditorRequest {
  nonce: number;
  kind: 'jump' | 'insert' | 'replaceAll';
  line?: number;
  text?: string;
}

interface AppState {
  hydrated: boolean;
  files: FileDoc[];
  openIds: string[];
  activeId: string;
  settings: Settings;
  watches: string[];
  run: RunnerSnapshot | null;
  /** Se incrementa con cada ejecución nueva. */
  runSeq: number;
  diagnostics: Diagnostic[];
  panel: PanelId;
  sidePanel: PanelId;
  modal: ModalId;
  editorRequest: EditorRequest | null;
  notice: string | null;
  updateInfo: UpdateCheckResult | null;
  setUpdateInfo(info: UpdateCheckResult | null): void;
  appMode: AppMode;
  setAppMode(mode: AppMode): void;

  hydrate(): Promise<void>;
  activeFile(): FileDoc;
  profile(): Profile;
  setCode(code: string): void;
  newFile(code?: string, name?: string): void;
  openExample(id: string): void;
  openFile(id: string): void;
  closeTab(id: string): void;
  renameFile(id: string, name: string): void;
  deleteFile(id: string): void;
  duplicateFile(id: string): void;
  toggleBreakpoint(line: number): void;
  setBreakpoints(lines: number[]): void;
  updateSettings(p: Partial<Settings>): void;
  setPanel(p: PanelId): void;
  setSidePanel(p: PanelId): void;
  setModal(m: ModalId): void;
  jumpToLine(line: number): void;
  insertSnippet(text: string): void;
  replaceCode(text: string): void;
  setWatches(w: string[]): void;
  setNotice(n: string | null): void;

  runProgram(mode: RunMode): void;
  stepOnce(): void;
  stepBack(): void;
  pause(): void;
  stop(): void;
  provideInput(v: InputValue): void;
  rerunWithInputs(inputs: InputValue[], mode?: RunMode): void;
  seek(step: number): void;
  clearConsole(): void;
}

let runner: Runner | null = null;
let nonce = 0;
let runCounter = 0;
let saveTimer: any = null;
let realtimeTimer: any = null;
let analyzeTimer: any = null;
let lastInputs: InputValue[] = [];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const STORAGE_KEY = 'psjs.state.v1';

function initialFile(): FileDoc {
  const ex = EXAMPLES.find((e) => e.id === 'suma')!;
  return { id: uid(), name: 'bienvenida.js', code: `// ¡Bienvenido a PSJavaScript!\n// Presiona ▶ para ejecutar o ⏭ para ir paso a paso.\n\n${ex.code}`, breakpoints: [], updatedAt: Date.now() };
}

export const useApp = create<AppState>((set, get) => {
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const { files, openIds, activeId, settings, watches } = get();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ files, openIds, activeId, settings, watches })).catch(() => {});
    }, 400);
  };

  const reanalyze = () => {
    const f = get().activeFile();
    let diagnostics: Diagnostic[] = [];
    try {
      diagnostics = analyze(f.code, get().profile());
    } catch {
      diagnostics = [];
    }
    set({ diagnostics });
  };

  const updateFile = (id: string, patch: Partial<FileDoc>) => {
    set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f)) }));
    persist();
  };

  const disposeRunner = () => {
    runner?.dispose();
    runner = null;
  };

  /** Teléfono: al mostrar una sección se abre el panel bajo el código si estaba cerrado. */
  const openPane = () => {
    const s = get();
    if (!s.settings.mobilePane.open) s.updateSettings({ mobilePane: { ...s.settings.mobilePane, open: true } });
  };

  const createRunner = (mode: RunMode, replayInputs?: InputValue[]): boolean => {
    const s = get();
    const f = s.activeFile();
    const profile = s.profile();
    const diags = analyze(f.code, profile);
    set({ diagnostics: diags });
    if (hasBlockingErrors(diags)) {
      const first = diags.find((d) => d.severity === 'error')!;
      set({ notice: `Corrige los errores antes de ejecutar (línea ${first.line}: ${first.message})`, sidePanel: 'problems' });
      if (s.panel !== 'editor') set({ panel: 'problems' });
      openPane();
      return false;
    }
    disposeRunner();
    const seq = ++runCounter;
    runner = new Runner({
      code: f.code,
      profile,
      breakpoints: new Set(f.breakpoints),
      watches: s.watches,
      explain: s.settings.explain,
      speed: s.settings.speed,
      replayInputs,
      trackDesktop: true,
      onUpdate: (snap) => {
        if (snap.status === 'finished' || snap.status === 'error' || snap.status === 'stopped') lastInputs = snap.inputs;
        // runSeq cambia junto con la primera instantánea de cada ejecución
        set({ run: snap, runSeq: seq });
      },
    });
    set({ notice: null });
    runner.start(mode);
    return true;
  };

  return {
    hydrated: false,
    files: [],
    openIds: [],
    activeId: '',
    settings: DEFAULT_SETTINGS,
    watches: [],
    run: null,
    runSeq: 0,
    diagnostics: [],
    panel: 'editor',
    sidePanel: 'console',
    modal: null,
    editorRequest: null,
    notice: null,
    updateInfo: null,
    appMode: 'ide',

    setAppMode(appMode) {
      // al salir del IDE se detiene cualquier ejecución en curso
      if (appMode !== 'ide') runner?.stop();
      rememberMode(appMode);
      set({ appMode, modal: null });
    },

    async hydrate() {
      if (get().hydrated) return;
      let data: any = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (data?.files?.length) {
        const files: FileDoc[] = data.files;
        const openIds = (data.openIds as string[]).filter((id) => files.some((f) => f.id === id));
        const activeId = files.some((f) => f.id === data.activeId) ? data.activeId : files[0].id;
        set({
          files,
          openIds: openIds.length ? openIds : [activeId],
          activeId,
          settings: { ...DEFAULT_SETTINGS, ...data.settings, mobilePane: sanePane(data.settings?.mobilePane) },
          watches: data.watches ?? [],
          hydrated: true,
        });
      } else {
        const f = initialFile();
        set({ files: [f], openIds: [f.id], activeId: f.id, hydrated: true });
      }
      reanalyze();
    },

    activeFile() {
      const s = get();
      return s.files.find((f) => f.id === s.activeId) ?? s.files[0] ?? { id: '', name: '', code: '', breakpoints: [], updatedAt: 0 };
    },

    profile() {
      const s = get().settings;
      return getProfile(s.profileId, s.customFlags);
    },

    setCode(code) {
      const f = get().activeFile();
      if (f.code === code) return;
      // desplaza los puntos de interrupción si se agregan o quitan líneas
      const oldLines = f.code.split('\n').length;
      const newLines = code.split('\n').length;
      let breakpoints = f.breakpoints;
      if (oldLines !== newLines && breakpoints.length) {
        let p = 0;
        while (p < f.code.length && p < code.length && f.code[p] === code[p]) p++;
        const changeLine = f.code.slice(0, p).split('\n').length;
        const delta = newLines - oldLines;
        breakpoints = breakpoints.map((b) => (b > changeLine ? b + delta : b)).filter((b) => b >= 1 && b <= newLines);
      }
      updateFile(f.id, { code, breakpoints });
      const run = get().run;
      if (get().settings.realtime) {
        clearTimeout(realtimeTimer);
        realtimeTimer = setTimeout(() => {
          try {
            if (!hasBlockingErrors(analyze(get().activeFile().code, get().profile()))) createRunner('run', lastInputs);
          } catch {
            /* sintaxis incompleta */
          }
        }, 700);
      } else if (run && (run.status === 'running' || run.status === 'paused' || run.status === 'input')) {
        runner?.stop();
        set({ notice: 'Se detuvo la ejecución porque el código cambió' });
      }
      clearTimeout(analyzeTimer);
      analyzeTimer = setTimeout(reanalyze, 300);
    },

    newFile(code = NEW_FILE_TEMPLATE, name) {
      const existing = new Set(get().files.map((f) => f.name));
      let n = 1;
      let fname = name ?? 'programa.js';
      while (existing.has(fname)) fname = (name ?? 'programa').replace(/\.js$/, '') + `${++n}.js`;
      const f: FileDoc = { id: uid(), name: fname, code, breakpoints: [], updatedAt: Date.now() };
      disposeRunner();
      set((s) => ({ files: [...s.files, f], openIds: [...s.openIds, f.id], activeId: f.id, run: null, modal: null, panel: 'editor' }));
      lastInputs = [];
      persist();
      reanalyze();
    },

    openExample(id) {
      const ex = EXAMPLES.find((e) => e.id === id);
      if (!ex) return;
      get().newFile(`// ${ex.title}\n// ${ex.description}\n\n${ex.code}`, `${ex.id}.js`);
    },

    openFile(id) {
      if (id === get().activeId) {
        set({ modal: null });
        return;
      }
      disposeRunner();
      lastInputs = [];
      set((s) => ({ activeId: id, openIds: s.openIds.includes(id) ? s.openIds : [...s.openIds, id], run: null, modal: null }));
      persist();
      reanalyze();
    },

    closeTab(id) {
      const s = get();
      const openIds = s.openIds.filter((x) => x !== id);
      if (!openIds.length) {
        const f = s.files.find((x) => x.id !== id) ?? null;
        if (!f) return;
        openIds.push(f.id);
      }
      const activeId = s.activeId === id ? openIds[Math.max(0, s.openIds.indexOf(id) - 1)] ?? openIds[0] : s.activeId;
      if (activeId !== s.activeId) {
        disposeRunner();
        set({ run: null });
      }
      set({ openIds, activeId });
      persist();
      reanalyze();
    },

    renameFile(id, name) {
      const clean = name.trim() || 'programa.js';
      updateFile(id, { name: /\.\w+$/.test(clean) ? clean : `${clean}.js` });
    },

    deleteFile(id) {
      const s = get();
      if (s.files.length === 1) {
        updateFile(id, { code: '', breakpoints: [] });
        return;
      }
      const files = s.files.filter((f) => f.id !== id);
      let openIds = s.openIds.filter((x) => x !== id);
      if (!openIds.length) openIds = [files[0].id];
      const activeId = s.activeId === id ? openIds[0] : s.activeId;
      if (activeId !== s.activeId) disposeRunner();
      set({ files, openIds, activeId, ...(activeId !== s.activeId ? { run: null } : {}) });
      persist();
      reanalyze();
    },

    duplicateFile(id) {
      const f = get().files.find((x) => x.id === id);
      if (f) get().newFile(f.code, f.name.replace(/\.js$/, '') + '-copia.js');
    },

    toggleBreakpoint(line) {
      const f = get().activeFile();
      const set_ = new Set(f.breakpoints);
      if (set_.has(line)) set_.delete(line);
      else set_.add(line);
      const breakpoints = [...set_].sort((a, b) => a - b);
      updateFile(f.id, { breakpoints });
      runner?.setBreakpoints(new Set(breakpoints));
    },

    setBreakpoints(lines) {
      const f = get().activeFile();
      updateFile(f.id, { breakpoints: lines });
      runner?.setBreakpoints(new Set(lines));
    },

    updateSettings(p) {
      set((s) => ({ settings: { ...s.settings, ...p } }));
      if (p.speed !== undefined) runner?.setSpeed(p.speed);
      if (p.profileId !== undefined || p.customFlags !== undefined) reanalyze();
      persist();
    },

    setPanel(panel) {
      set({ panel });
    },
    setSidePanel(sidePanel) {
      set({ sidePanel });
      openPane();
    },
    setModal(modal) {
      set({ modal });
    },
    jumpToLine(line) {
      set((s) => ({ editorRequest: { nonce: ++nonce, kind: 'jump', line }, panel: s.panel === 'editor' ? s.panel : 'editor' }));
    },
    insertSnippet(text) {
      set({ editorRequest: { nonce: ++nonce, kind: 'insert', text }, modal: null, panel: 'editor' });
    },
    replaceCode(text) {
      set({ editorRequest: { nonce: ++nonce, kind: 'replaceAll', text } });
    },
    setWatches(watches) {
      set({ watches });
      runner?.setWatches(watches);
      persist();
    },
    setNotice(notice) {
      set({ notice });
    },
    setUpdateInfo(updateInfo) {
      set({ updateInfo });
    },

    runProgram(mode) {
      // al ejecutar completo, mostrar la consola para ver el resultado
      // (en paso a paso se queda en el editor para seguir la línea resaltada)
      const showConsole = () => {
        if (mode !== 'run') return;
        set({ sidePanel: 'console', panel: 'console' });
        openPane();
      };
      const st = runner?.getStatus();
      if (runner && st === 'paused') {
        runner.resume(mode);
        showConsole();
        return;
      }
      if (runner && (st === 'running' || st === 'input') && mode === 'run') {
        showConsole();
        return;
      }
      if (createRunner(mode)) showConsole();
    },
    stepOnce() {
      const st = runner?.getStatus();
      if (runner && st === 'paused') runner.stepOnce();
      else if (runner && st === 'running') runner.pause();
      else if (!runner || st === 'finished' || st === 'error' || st === 'stopped' || st === 'idle') createRunner('step');
    },
    stepBack() {
      const st = runner?.getStatus();
      if (runner && (st === 'paused' || st === 'finished' || st === 'error' || st === 'input')) runner.stepBack();
    },
    pause() {
      runner?.pause();
    },
    stop() {
      runner?.stop();
    },
    provideInput(v) {
      runner?.provideInput(v);
    },
    rerunWithInputs(inputs, mode = 'run') {
      createRunner(mode, inputs);
    },
    seek(step) {
      runner?.seek(step);
    },
    clearConsole() {
      const run = get().run;
      if (run) set({ run: { ...run, output: [] } });
    },
  };
});

/** Perfil activo (memorizado para no crear objetos nuevos en cada render). */
export function useProfile(): Profile {
  const id = useApp((s) => s.settings.profileId);
  const flags = useApp((s) => s.settings.customFlags);
  return useMemo(() => getProfile(id, flags), [id, flags]);
}

/** Archivo activo. */
export function useActiveFile(): FileDoc | undefined {
  const files = useApp((s) => s.files);
  const activeId = useApp((s) => s.activeId);
  return useMemo(() => files.find((f) => f.id === activeId) ?? files[0], [files, activeId]);
}

// Acceso para depuración en la consola del navegador (solo desarrollo).
if (__DEV__ && typeof window !== 'undefined') (window as any).__psjs = useApp;
