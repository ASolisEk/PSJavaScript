/**
 * Duelo de dos jugadores (defensa contra ataque).
 *
 * - Mismo dispositivo: cada jugador escribe su programa por turnos (sin que el otro mire) y
 *   después se ve el combate.
 * - En línea: uno crea la sala y comparte el código; cada quien programa en su dispositivo.
 *   Cuando los dos están listos se intercambian los programas y la semilla, y cada dispositivo
 *   simula la misma partida (el resultado es idéntico en los dos).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { randomId, roomCode } from '../core/exam/random';
import { ClientTransport, createClientTransport, createHostTransport, HostTransport, TransportSpec } from '../core/exam/transport';
import type { GameTheme } from '../core/game/api';
import { DUEL_STARTER, DuelResult, DuelRole } from '../core/game/duel';

const KEY = 'psjs.duel.v1';
const MAX_CODE = 20_000;

export type DuelMode = 'local' | 'online';
/**
 * menu: elegir modo · lobby: (en línea) esperando al rival · handoff: (mismo dispositivo) pasar
 * el equipo · code: escribir el programa · waiting: (en línea) listo, falta el rival ·
 * match: combate · result: quién ganó.
 */
export type DuelPhase = 'menu' | 'lobby' | 'handoff' | 'code' | 'waiting' | 'match' | 'result';
export type DuelNet = 'idle' | 'opening' | 'waiting' | 'connected' | 'lost';

/** Mensajes entre los dos dispositivos. */
type Msg =
  | { t: 'duel-hello'; name: string }
  | { t: 'duel-setup'; round: number; hostName: string; guestName: string; defender: 0 | 1; turns: number; theme: GameTheme; wins: [number, number]; ties: number }
  | { t: 'duel-ready'; round: number; ready: boolean }
  | { t: 'duel-start'; round: number; seed: string; code: string }
  | { t: 'duel-code'; round: number; code: string }
  | { t: 'duel-rematch'; swap: boolean }
  | { t: 'duel-full' }
  | { t: 'duel-bye' };

interface DuelState {
  hydrated: boolean;
  mode: DuelMode;
  phase: DuelPhase;
  /** Jugador 0 y jugador 1 (en línea: 0 es quien creó la sala). */
  names: [string, string];
  /** Nombres escritos en este dispositivo (se recuerdan para la próxima vez). */
  savedNames: [string, string];
  /** Quién defiende en esta ronda (el otro ataca). */
  defender: 0 | 1;
  turns: number;
  theme: GameTheme;
  round: number;
  seed: string;
  /** Programas de la ronda (en línea, el del rival llega al empezar el combate). */
  codes: Record<DuelRole, string>;
  /** Mismo dispositivo: qué programa se está escribiendo. */
  writing: DuelRole;
  /** Borradores de este dispositivo (lo último que se escribió para cada bando). */
  drafts: Record<DuelRole, string>;
  wins: [number, number];
  ties: number;
  result: DuelResult | null;
  // ── en línea ──
  /** Qué jugador soy en este dispositivo. */
  me: 0 | 1;
  room: string | null;
  transport: TransportSpec | null;
  net: DuelNet;
  netError: string | null;
  ready: boolean;
  rivalReady: boolean;

  hydrate(): Promise<void>;
  setTurns(turns: number): void;
  setDraft(role: DuelRole, code: string): void;
  /** Mismo dispositivo: empieza una serie. */
  startLocal(p: { names: [string, string]; defender: 0 | 1; turns: number; theme: GameTheme }): void;
  /** Mismo dispositivo: el jugador que recibe el equipo empieza a escribir. */
  takeDevice(): void;
  /** El programa del bando que escribe está listo. */
  submitCode(code: string): void;
  /** En línea: vuelvo a editar antes de que empiece el combate. */
  unready(): void;
  /** El combate terminó: se anota el resultado en la serie. */
  finish(result: DuelResult): void;
  /** Otra ronda (cambiando o no los papeles). */
  rematch(swap: boolean): void;
  /** En línea: crea la sala y espera al rival. */
  host(p: { name: string; defender: 0 | 1; turns: number; theme: GameTheme; transport: TransportSpec }): Promise<boolean>;
  /** En línea: entra a la sala del rival. */
  join(p: { name: string; code: string; transport: TransportSpec }): Promise<boolean>;
  /** Sale del duelo (cierra la sala). */
  leave(): void;
}

let hostT: HostTransport | null = null;
let clientT: ClientTransport | null = null;
/** Conexión del rival en la sala (solo el anfitrión). */
let rivalPeer: string | null = null;

const clean = (s: unknown, max: number) => (typeof s === 'string' ? s.slice(0, max) : '');
/** Papel del jugador `i` en esta ronda. */
export const roleOf = (i: 0 | 1, defender: 0 | 1): DuelRole => (i === defender ? 'defense' : 'attack');

export const useDuel = create<DuelState>((set, get) => {
  const persist = () => {
    const { drafts, savedNames, turns } = get();
    AsyncStorage.setItem(KEY, JSON.stringify({ drafts, names: savedNames, turns })).catch(() => {});
  };

  const send = (msg: Msg) => {
    try {
      if (hostT && rivalPeer) hostT.send(rivalPeer, msg);
      else clientT?.send(msg);
    } catch {
      /* se perdió la conexión: lo avisa el transporte */
    }
  };

  const closeNet = () => {
    hostT?.close();
    clientT?.close();
    hostT = null;
    clientT = null;
    rivalPeer = null;
  };

  /** Datos de la ronda para el invitado. */
  const sendSetup = () => {
    const s = get();
    send({ t: 'duel-setup', round: s.round, hostName: s.names[0], guestName: s.names[1], defender: s.defender, turns: s.turns, theme: s.theme, wins: s.wins, ties: s.ties });
  };

  /** Nueva ronda: cada quien vuelve a su editor. */
  const newRound = (defender: 0 | 1) => {
    const s = get();
    set({ round: s.round + 1, defender, phase: s.mode === 'local' ? 'handoff' : 'code', writing: 'defense', ready: false, rivalReady: false, result: null, codes: { defense: '', attack: '' } });
  };

  /** En línea, anfitrión: si los dos están listos, reparte la semilla y su programa. */
  const maybeStart = () => {
    const s = get();
    if (s.mode !== 'online' || s.me !== 0 || !s.ready || !s.rivalReady || s.phase === 'match') return;
    const seed = randomId('d');
    set({ seed });
    send({ t: 'duel-start', round: s.round, seed, code: s.codes[roleOf(0, s.defender)] });
  };

  const onMessage = (raw: unknown, peer?: string) => {
    const m = raw as Msg;
    if (!m || typeof m !== 'object' || typeof (m as any).t !== 'string') return;
    const s = get();
    switch (m.t) {
      case 'duel-hello': {
        if (!hostT || !peer) return;
        if (rivalPeer && rivalPeer !== peer) {
          hostT.send(peer, { t: 'duel-full' } satisfies Msg);
          return;
        }
        rivalPeer = peer;
        set({ names: [s.names[0], clean(m.name, 40) || 'Rival'], net: 'connected', netError: null, phase: s.phase === 'lobby' ? 'code' : s.phase, rivalReady: false });
        sendSetup();
        // si yo ya estaba listo, se lo vuelvo a decir (el rival se reconectó)
        if (get().ready) send({ t: 'duel-ready', round: get().round, ready: true });
        break;
      }
      case 'duel-setup': {
        if (hostT) return;
        const fresh = m.round !== s.round || s.phase === 'lobby';
        set({
          names: [clean(m.hostName, 40) || 'Rival', clean(m.guestName, 40) || s.names[1]],
          defender: m.defender === 1 ? 1 : 0,
          turns: Math.max(20, Math.min(400, Math.round(Number(m.turns) || 150))),
          theme: m.theme === 'mine' ? 'mine' : 'farm',
          round: Number(m.round) || 1,
          wins: [Number(m.wins?.[0]) || 0, Number(m.wins?.[1]) || 0],
          ties: Number(m.ties) || 0,
          net: 'connected',
          ...(fresh ? { phase: 'code' as const, ready: false, rivalReady: false, result: null, codes: { defense: '', attack: '' } } : {}),
        });
        break;
      }
      case 'duel-ready':
        if (m.round !== s.round) return;
        set({ rivalReady: !!m.ready });
        maybeStart();
        break;
      case 'duel-start': {
        // invitado: recibe la semilla y el programa del anfitrión, y responde con el suyo
        if (hostT || m.round !== s.round || !s.ready) return;
        const mine = roleOf(1, s.defender);
        const rival = roleOf(0, s.defender);
        send({ t: 'duel-code', round: s.round, code: s.codes[mine] });
        set({ seed: clean(m.seed, 60), codes: { ...s.codes, [rival]: clean(m.code, MAX_CODE) }, phase: 'match' });
        break;
      }
      case 'duel-code': {
        if (!hostT || m.round !== s.round || !s.ready) return;
        set({ codes: { ...s.codes, [roleOf(1, s.defender)]: clean(m.code, MAX_CODE) }, phase: 'match' });
        break;
      }
      case 'duel-rematch':
        // solo el anfitrión decide la ronda nueva (y se la manda al invitado)
        if (!hostT || s.phase !== 'result') return;
        newRound(m.swap ? ((1 - s.defender) as 0 | 1) : s.defender);
        sendSetup();
        break;
      case 'duel-full':
        closeNet();
        set({ net: 'idle', phase: 'menu', netError: 'Esa sala ya tiene dos jugadores.' });
        break;
      case 'duel-bye':
        rivalGone('Tu rival salió del duelo.');
        break;
    }
  };

  const rivalGone = (text: string) => {
    const s = get();
    if (s.mode !== 'online') return;
    if (hostT) {
      rivalPeer = null;
      // el anfitrión conserva la sala: el rival puede volver a entrar con el mismo código
      set({ net: 'waiting', netError: text, rivalReady: false, phase: s.phase === 'match' || s.phase === 'result' ? s.phase : 'lobby', ready: false });
    } else {
      set({ net: 'lost', netError: text, rivalReady: false });
    }
  };

  return {
    hydrated: false,
    mode: 'local',
    phase: 'menu',
    names: ['Jugador 1', 'Jugador 2'],
    savedNames: ['Jugador 1', 'Jugador 2'],
    defender: 0,
    turns: 150,
    theme: 'farm',
    round: 1,
    seed: '',
    codes: { defense: '', attack: '' },
    writing: 'defense',
    drafts: { ...DUEL_STARTER },
    wins: [0, 0],
    ties: 0,
    result: null,
    me: 0,
    room: null,
    transport: null,
    net: 'idle',
    netError: null,
    ready: false,
    rivalReady: false,

    async hydrate() {
      if (get().hydrated) return;
      try {
        const d = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}');
        set({
          drafts: { defense: clean(d.drafts?.defense, MAX_CODE) || DUEL_STARTER.defense, attack: clean(d.drafts?.attack, MAX_CODE) || DUEL_STARTER.attack },
          savedNames: [clean(d.names?.[0], 40) || 'Jugador 1', clean(d.names?.[1], 40) || 'Jugador 2'],
          turns: [80, 150, 250].includes(d.turns) ? d.turns : 150,
        });
      } catch {
        /* se empieza con los valores iniciales */
      }
      set({ hydrated: true });
    },

    setTurns(turns) {
      set({ turns });
      persist();
    },

    setDraft(role, code) {
      set({ drafts: { ...get().drafts, [role]: code.slice(0, MAX_CODE) } });
      persist();
    },

    startLocal({ names, defender, turns, theme }) {
      closeNet();
      set({ mode: 'local', names, savedNames: names, defender, turns, theme, round: 1, wins: [0, 0], ties: 0, phase: 'handoff', writing: 'defense', codes: { defense: '', attack: '' }, result: null, net: 'idle', netError: null, room: null });
      persist();
    },

    takeDevice() {
      if (get().phase === 'handoff') set({ phase: 'code' });
    },

    submitCode(code) {
      const s = get();
      const text = code.slice(0, MAX_CODE);
      if (s.mode === 'local') {
        const codes = { ...s.codes, [s.writing]: text };
        // primero escribe la defensa y luego el ataque; con los dos, empieza el combate
        if (s.writing === 'defense') set({ codes, writing: 'attack', phase: 'handoff' });
        else set({ codes, seed: randomId('d'), phase: 'match' });
        return;
      }
      set({ codes: { ...s.codes, [roleOf(s.me, s.defender)]: text }, ready: true, phase: 'waiting' });
      send({ t: 'duel-ready', round: s.round, ready: true });
      maybeStart();
    },

    unready() {
      const s = get();
      if (s.mode !== 'online' || s.phase !== 'waiting') return;
      set({ ready: false, phase: 'code' });
      send({ t: 'duel-ready', round: s.round, ready: false });
    },

    finish(result) {
      const s = get();
      if (s.phase !== 'match') return;
      const wins: [number, number] = [...s.wins];
      let ties = s.ties;
      if (result.winner === 'tie') ties++;
      else wins[result.winner === 'defense' ? s.defender : 1 - s.defender]++;
      set({ result, wins, ties, phase: 'result' });
    },

    rematch(swap) {
      const s = get();
      if (s.phase !== 'result') return;
      if (s.mode === 'online' && !hostT) {
        // el invitado se lo pide al anfitrión
        send({ t: 'duel-rematch', swap });
        return;
      }
      newRound(swap ? ((1 - s.defender) as 0 | 1) : s.defender);
      if (s.mode === 'online') sendSetup();
    },

    async host({ name, defender, turns, theme, transport }) {
      closeNet();
      set({ mode: 'online', me: 0, net: 'opening', netError: null, savedNames: [name || 'Jugador 1', get().savedNames[1]], names: [name || 'Jugador 1', 'Rival'], defender, turns, theme, round: 1, wins: [0, 0], ties: 0, result: null, ready: false, rivalReady: false, codes: { defense: '', attack: '' }, transport });
      persist();
      for (let i = 0; i < 3; i++) {
        const code = roomCode();
        const t = createHostTransport(transport);
        t.onPeerMessage = (peer, msg) => onMessage(msg, peer);
        t.onPeerLeave = (peer) => {
          if (peer === rivalPeer) rivalGone('Tu rival se desconectó. Puede volver a entrar con el mismo código.');
        };
        try {
          await t.open(code);
          hostT = t;
          set({ room: code, net: 'waiting', phase: 'lobby' });
          return true;
        } catch (e: any) {
          t.close();
          if (!/en uso|otra pestaña/.test(e?.message ?? '')) {
            set({ net: 'idle', netError: e?.message ?? String(e) });
            return false;
          }
        }
      }
      set({ net: 'idle', netError: 'No se pudo crear la sala. Intenta de nuevo.' });
      return false;
    },

    async join({ name, code, transport }) {
      closeNet();
      set({ mode: 'online', me: 1, net: 'opening', netError: null, savedNames: [get().savedNames[0], name || 'Jugador 2'], names: ['Rival', name || 'Jugador 2'], room: code, transport, round: 0, result: null, ready: false, rivalReady: false, codes: { defense: '', attack: '' } });
      persist();
      const t = createClientTransport(transport);
      t.onMessage = (msg) => onMessage(msg);
      t.onClose = () => {
        if (clientT === t) rivalGone('Se perdió la conexión con la sala.');
      };
      try {
        await t.connect(code);
      } catch (e: any) {
        t.close();
        set({ net: 'idle', netError: e?.message ?? String(e) });
        return false;
      }
      clientT = t;
      set({ net: 'connected', phase: 'lobby' });
      t.send({ t: 'duel-hello', name: name || 'Jugador 2' } satisfies Msg);
      return true;
    },

    leave() {
      if (get().mode === 'online') send({ t: 'duel-bye' });
      // deja salir el aviso antes de cerrar
      const h = hostT;
      const c = clientT;
      hostT = null;
      clientT = null;
      rivalPeer = null;
      setTimeout(() => {
        h?.close();
        c?.close();
      }, 200);
      set({ phase: 'menu', net: 'idle', netError: null, room: null, ready: false, rivalReady: false, result: null, codes: { defense: '', attack: '' }, round: 1, wins: [0, 0], ties: 0 });
    },
  };
});
