/** Elección del transporte de la sala según la plataforma. */
import { BroadcastClient, BroadcastHost, broadcastAvailable } from './broadcast';
import { PeerClient, PeerHost, peerAvailable } from './peer';
import { defaultRelayUrl, normalizeRelayUrl, RelayClient, RelayHost } from './relay';
import { ClientTransport, HostTransport, TransportError, TransportKind, TransportSpec } from './types';

export * from './types';
export { defaultRelayUrl, normalizeRelayUrl } from './relay';

export interface TransportOption {
  kind: Exclude<TransportKind, 'memory'>;
  label: string;
  description: string;
  icon: string;
  available: boolean;
}

export function transportOptions(): TransportOption[] {
  return [
    {
      kind: 'internet',
      label: 'Por Internet',
      description: 'Los alumnos entran desde cualquier lugar con el código. No hay que instalar nada.',
      icon: 'globe-outline',
      available: peerAvailable(),
    },
    {
      kind: 'lan',
      label: 'Red del aula',
      description: 'Sin Internet: el maestro ejecuta «npm run sala» y todos se conectan a la misma red (Wi-Fi).',
      icon: 'wifi-outline',
      available: typeof WebSocket !== 'undefined',
    },
    {
      kind: 'device',
      label: 'Este dispositivo',
      description: 'Para probar: abre el examen de alumno en otra pestaña de este mismo navegador.',
      icon: 'browsers-outline',
      available: broadcastAvailable(),
    },
  ];
}

/** Transporte recomendado para esta plataforma. */
export function defaultTransport(): TransportSpec {
  const relay = defaultRelayUrl();
  if (relay) return { kind: 'lan', url: relay };
  if (peerAvailable()) return { kind: 'internet' };
  return { kind: 'lan', url: '' };
}

function relayUrl(spec: TransportSpec): string {
  const url = normalizeRelayUrl(spec.url ?? '');
  if (!url) throw new TransportError('Escribe la dirección del servidor del aula (por ejemplo 192.168.1.10:8787).');
  return url;
}

export function createHostTransport(spec: TransportSpec): HostTransport {
  switch (spec.kind) {
    case 'internet':
      return new PeerHost();
    case 'lan':
      return new RelayHost(relayUrl(spec));
    case 'device':
      return new BroadcastHost();
  }
  throw new TransportError('Tipo de conexión no disponible.');
}

export function createClientTransport(spec: TransportSpec): ClientTransport {
  switch (spec.kind) {
    case 'internet':
      return new PeerClient();
    case 'lan':
      return new RelayClient(relayUrl(spec));
    case 'device':
      return new BroadcastClient();
  }
  throw new TransportError('Tipo de conexión no disponible.');
}

export function transportLabel(spec: TransportSpec): string {
  if (spec.kind === 'internet') return 'Internet';
  if (spec.kind === 'lan') return `Red del aula (${normalizeRelayUrl(spec.url ?? '')})`;
  if (spec.kind === 'device') return 'Este dispositivo';
  return 'Memoria';
}
