/** Servidores TURN y de enlace que el maestro configuró (se usan por omisión en sus salas nuevas). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { PeerNetwork, sanitizePeerNetwork } from '../core/exam/transport';

const KEY = 'psjs.net.v1';

interface NetworkState {
  hydrated: boolean;
  net: PeerNetwork | null;
  hydrate(): Promise<void>;
  setNet(net: PeerNetwork | null): void;
}

export const useNetwork = create<NetworkState>((set, get) => ({
  hydrated: false,
  net: null,
  async hydrate() {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ net: raw ? sanitizePeerNetwork(JSON.parse(raw)) : null });
    } catch {
      /* sin configuración */
    }
    set({ hydrated: true });
  },
  setNet(net) {
    const clean = sanitizePeerNetwork(net);
    set({ net: clean });
    (clean ? AsyncStorage.setItem(KEY, JSON.stringify(clean)) : AsyncStorage.removeItem(KEY)).catch(() => {});
  },
}));
