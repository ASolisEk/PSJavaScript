/**
 * Instaladores publicados en GitHub Releases: qué archivo corresponde a cada sistema,
 * cuál recomendar según el equipo del visitante y los datos de la última versión
 * (tamaño, fecha y huella SHA-256) para la página de descargas.
 */
import { GITHUB_API_LATEST, GITHUB_RELEASES_URL, latestDownloadUrl } from './updater';

export type DownloadId = 'win' | 'mac' | 'mac-intel' | 'linux' | 'android';

export interface DownloadTarget {
  id: DownloadId;
  /** Nombre fijo del archivo en cada versión publicada. */
  file: string;
  label: string;
  /** Detalle: arquitectura o formato. */
  detail: string;
  icon: 'logo-windows' | 'logo-apple' | 'logo-tux' | 'logo-android';
  color: string;
  dark: string;
  /** Pasos para instalar (los instaladores no están firmados por una tienda). */
  steps: string[];
}

export const DOWNLOAD_TARGETS: DownloadTarget[] = [
  {
    id: 'win',
    file: 'PSJavaScript-Setup.exe',
    label: 'Windows',
    detail: 'Windows 10 u 11 · 64 bits',
    icon: 'logo-windows',
    color: '#0078d4',
    dark: '#4cc2ff',
    steps: [
      'Abre PSJavaScript-Setup.exe.',
      'Si aparece «Windows protegió su PC», elige «Más información» → «Ejecutar de todas formas» (el instalador no tiene certificado comercial).',
      'Al terminar, abre PSJavaScript desde el menú Inicio o el acceso directo del escritorio.',
    ],
  },
  {
    id: 'mac',
    file: 'PSJavaScript.dmg',
    label: 'macOS',
    detail: 'Apple Silicon (M1, M2, M3, M4…)',
    icon: 'logo-apple',
    color: '#1d1d1f',
    dark: '#f5f5f7',
    steps: [
      'Abre PSJavaScript.dmg y arrastra PSJavaScript a la carpeta Aplicaciones.',
      'La primera vez, haz clic derecho sobre la app → «Abrir» → «Abrir» (no está firmada por Apple). Si no aparece la opción, ve a Configuración del Sistema → Privacidad y seguridad → «Abrir de todos modos».',
    ],
  },
  {
    id: 'mac-intel',
    file: 'PSJavaScript-Intel.dmg',
    label: 'macOS Intel',
    detail: 'Mac con procesador Intel',
    icon: 'logo-apple',
    color: '#1d1d1f',
    dark: '#f5f5f7',
    steps: [
      'Abre PSJavaScript-Intel.dmg y arrastra PSJavaScript a la carpeta Aplicaciones.',
      'La primera vez, haz clic derecho sobre la app → «Abrir» → «Abrir» (no está firmada por Apple).',
    ],
  },
  {
    id: 'linux',
    file: 'PSJavaScript.AppImage',
    label: 'Linux',
    detail: 'AppImage · 64 bits',
    icon: 'logo-tux',
    color: '#b8860b',
    dark: '#fcc624',
    steps: ['Dale permiso de ejecución: chmod +x PSJavaScript.AppImage', 'Ábrelo con doble clic o con ./PSJavaScript.AppImage'],
  },
  {
    id: 'android',
    file: 'PSJavaScript.apk',
    label: 'Android',
    detail: 'Android 7 o más reciente',
    icon: 'logo-android',
    color: '#1f9d55',
    dark: '#3ddc84',
    steps: [
      'Descarga el archivo en el teléfono y ábrelo desde Descargas.',
      'Si lo pide, permite «Instalar apps desconocidas» para tu navegador o administrador de archivos.',
      'Toca «Instalar». Las versiones nuevas se instalan encima sin perder tus archivos.',
    ],
  },
];

export const targetById = (id: DownloadId) => DOWNLOAD_TARGETS.find((d) => d.id === id)!;

/**
 * Instalador recomendado para el equipo del visitante. `arch` viene de
 * navigator.userAgentData (si el navegador lo da); sin ella, un Mac se supone Apple Silicon.
 */
export function detectTarget(ua: string, platform = '', arch?: string): DownloadId | null {
  const s = `${ua} ${platform}`.toLowerCase();
  if (/android/.test(s)) return 'android';
  if (/iphone|ipad|ipod/.test(s)) return null;
  if (/mac/.test(s)) return arch === 'x86' || arch === 'x64' || arch === 'x86_64' ? 'mac-intel' : 'mac';
  if (/win/.test(s)) return 'win';
  if (/linux|x11|cros/.test(s)) return 'linux';
  return null;
}

/** Instalador recomendado en este navegador (o null en iPhone/iPad o si no se reconoce). */
export async function detectBrowserTarget(): Promise<DownloadId | null> {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as any;
  let arch: string | undefined;
  try {
    const hi = await nav.userAgentData?.getHighEntropyValues?.(['architecture']);
    arch = hi?.architecture;
  } catch {
    /* el navegador no da la arquitectura */
  }
  return detectTarget(nav.userAgent ?? '', nav.userAgentData?.platform ?? nav.platform ?? '', arch);
}

export interface ReleaseAsset {
  name: string;
  url: string;
  size: number;
  /** Huella SHA-256 que calcula GitHub (si la da). */
  sha256?: string;
  downloads?: number;
}

export interface LatestRelease {
  version: string;
  tag: string;
  publishedAt: string | null;
  url: string;
  notes: string;
  assets: Record<string, ReleaseAsset>;
}

/** Convierte la respuesta de la API de GitHub en los datos que usa la página. */
export function parseRelease(data: any): LatestRelease | null {
  if (!data || typeof data !== 'object' || typeof data.tag_name !== 'string') return null;
  const assets: Record<string, ReleaseAsset> = {};
  for (const a of Array.isArray(data.assets) ? data.assets : []) {
    if (!a?.name || !a.browser_download_url) continue;
    const digest = typeof a.digest === 'string' && a.digest.startsWith('sha256:') ? a.digest.slice(7) : undefined;
    assets[a.name] = { name: a.name, url: a.browser_download_url, size: Number(a.size) || 0, ...(digest ? { sha256: digest } : {}), ...(typeof a.download_count === 'number' ? { downloads: a.download_count } : {}) };
  }
  return {
    version: data.tag_name.replace(/^v/, ''),
    tag: data.tag_name,
    publishedAt: data.published_at ?? null,
    url: data.html_url ?? GITHUB_RELEASES_URL,
    notes: typeof data.body === 'string' ? data.body : '',
    assets,
  };
}

const CACHE_KEY = 'psjs.latest-release.v2';
const CACHE_MS = 30 * 60_000;
let memo: { at: number; value: LatestRelease | null } | null = null;

/** Última versión publicada (se guarda 30 min para no gastar el límite de la API de GitHub). */
export async function fetchLatestRelease(force = false): Promise<LatestRelease | null> {
  const now = Date.now();
  if (!force && memo && now - memo.at < CACHE_MS) return memo.value;
  if (!force) {
    try {
      const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(CACHE_KEY) : null;
      const cached = raw ? JSON.parse(raw) : null;
      if (cached && now - cached.at < CACHE_MS) {
        memo = cached;
        return cached.value;
      }
    } catch {
      /* sin almacenamiento */
    }
  }
  let value: LatestRelease | null = null;
  try {
    const res = await fetch(GITHUB_API_LATEST, { headers: { Accept: 'application/vnd.github+json' } });
    if (res.ok) value = parseRelease(await res.json());
  } catch {
    /* sin red */
  }
  memo = { at: now, value };
  try {
    if (value && typeof sessionStorage !== 'undefined') sessionStorage.setItem(CACHE_KEY, JSON.stringify(memo));
  } catch {
    /* sin almacenamiento */
  }
  return value;
}

/** Enlace del instalador: el de la versión publicada o la descarga directa de la última. */
export function downloadUrl(target: DownloadTarget, release: LatestRelease | null): string {
  return release?.assets[target.file]?.url ?? latestDownloadUrl(target.file);
}

/** ¿La última versión trae este instalador? (null = aún no se sabe). */
export function isAvailable(target: DownloadTarget, release: LatestRelease | null): boolean | null {
  if (!release) return null;
  return !!release.assets[target.file];
}

export function formatSize(bytes: number): string {
  if (!bytes) return '';
  const mb = bytes / 1048576;
  return mb >= 1 ? `${mb.toFixed(mb >= 100 ? 0 : 1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
