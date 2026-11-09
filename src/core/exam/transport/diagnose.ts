/**
 * «Probar conexión» de las salas por Internet: revisa el servidor de enlace (PeerJS) y si la red
 * deja pasar WebRTC con STUN (conexión directa) o TURN (retransmitida, necesaria detrás de
 * muchos firewalls escolares). Solo usa la red; no se conecta a ninguna sala.
 */
import { DEFAULT_ICE_SERVERS, describePeerError, peerAvailable, peerOptions } from './peer';
import type { IceServer, PeerNetwork } from './types';

export interface NetCheck {
  id: 'webrtc' | 'server' | 'stun' | 'turn';
  label: string;
  /** null = no se pudo probar */
  ok: boolean | null;
  detail: string;
}

const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T) => Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

/** Tipos de candidato que consigue la red con esos servidores (host, srflx = STUN, relay = TURN). */
export async function gatherCandidateTypes(iceServers: IceServer[], ms = 8000): Promise<Set<string>> {
  const types = new Set<string>();
  const pc = new RTCPeerConnection({ iceServers });
  try {
    pc.createDataChannel('prueba');
    const done = new Promise<void>((resolve) => {
      pc.onicecandidate = (e) => {
        if (!e.candidate) return resolve();
        const m = / typ (\w+)/.exec(e.candidate.candidate);
        if (m) types.add(m[1]);
      };
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') resolve();
      };
    });
    await pc.setLocalDescription(await pc.createOffer());
    await withTimeout(done, ms, undefined);
  } finally {
    pc.close();
  }
  return types;
}

async function checkServer(net?: PeerNetwork): Promise<NetCheck> {
  const label = net?.server?.host ? `Servidor de enlace (${net.server.host})` : 'Servidor de enlace (PeerJS)';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Peer } = require('peerjs');
    const peer = new Peer(peerOptions(net));
    const ok = await withTimeout(
      new Promise<NetCheck>((resolve) => {
        peer.once('open', () => resolve({ id: 'server', label, ok: true, detail: 'Responde: los alumnos pueden encontrar la sala.' }));
        peer.once('error', (err: any) => resolve({ id: 'server', label, ok: false, detail: describePeerError(err) }));
      }),
      10_000,
      { id: 'server', label, ok: false, detail: 'No respondió en 10 s. Revisa la conexión a Internet o si la red bloquea el sitio.' } as NetCheck,
    );
    peer.destroy();
    return ok;
  } catch (e: any) {
    return { id: 'server', label, ok: false, detail: e?.message ?? String(e) };
  }
}

export async function diagnoseInternet(net?: PeerNetwork): Promise<NetCheck[]> {
  if (!peerAvailable()) return [{ id: 'webrtc', label: 'WebRTC', ok: false, detail: 'Este navegador o plataforma no permite conexiones directas. Usa «Red del aula».' }];
  const custom = net?.iceServers?.length ? net.iceServers : null;
  const [server, types] = await Promise.all([checkServer(net), gatherCandidateTypes(custom ?? DEFAULT_ICE_SERVERS).catch(() => null)]);
  if (!types) return [server, { id: 'stun', label: 'WebRTC', ok: null, detail: 'No se pudo probar WebRTC en este dispositivo.' }];
  const stun: NetCheck = types.has('srflx')
    ? { id: 'stun', label: 'Conexión directa (STUN)', ok: true, detail: 'La red permite conexiones directas.' }
    : { id: 'stun', label: 'Conexión directa (STUN)', ok: false, detail: 'La red no permite conexiones directas: hará falta TURN.' };
  const turn: NetCheck = types.has('relay')
    ? { id: 'turn', label: custom ? 'Tus servidores TURN' : 'TURN público de PeerJS', ok: true, detail: 'Funciona: aunque la red bloquee lo directo, la sala se puede usar.' }
    : custom
      ? { id: 'turn', label: 'Tus servidores TURN', ok: false, detail: 'No respondieron. Revisa la dirección (turn: o turns:), el usuario, la contraseña y que el puerto esté abierto (443 suele pasar los firewalls).' }
      : {
          id: 'turn',
          label: 'TURN público de PeerJS',
          ok: false,
          detail: types.has('srflx') ? 'No respondió (no es grave si la conexión directa funciona).' : 'No respondió: en esta red probablemente los alumnos no podrán conectarse. Configura un servidor TURN propio o usa «Red del aula».',
        };
  return [server, stun, turn];
}
