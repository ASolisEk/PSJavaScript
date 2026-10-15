/**
 * Gestor de actualizaciones: detecta si existe una versión más reciente
 * en GitHub, valida la plataforma actual (para no molestar en navegador web),
 * muestra el aviso correspondiente y gestiona la descarga e instalación.
 */

export const CURRENT_VERSION = '1.0.1';
let configuredPlatformOS: string = 'web';
let urlOpener: ((url: string) => Promise<unknown> | unknown) | null = null;

/** Configura los parámetros de plataforma desde el runtime de Expo/React Native */
export function configureUpdater(opts: {
  version?: string;
  platformOS?: string;
  urlOpener?: (url: string) => Promise<unknown> | unknown;
}) {
  if (opts.platformOS) configuredPlatformOS = opts.platformOS;
  if (opts.urlOpener) urlOpener = opts.urlOpener;
}

export async function openExternalUrl(url: string): Promise<void> {
  if (urlOpener) {
    try {
      await urlOpener(url);
      return;
    } catch {}
  }
  if (typeof window !== 'undefined' && window.open) {
    window.open(url, '_blank');
  }
}

export const REPO_OWNER = 'ASolisEk';
export const REPO_NAME = 'PSJavaScript';
export const GITHUB_API_LATEST = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
export const GITHUB_RAW_PKG = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json`;
export const GITHUB_RELEASES_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;

export type PlatformType = 'web' | 'electron-linux' | 'electron-win' | 'electron-mac' | 'android' | 'ios';

export interface ReleaseInfo {
  version: string;
  name: string;
  notes: string;
  publishedAt?: string;
  releaseUrl: string;
  downloadUrl: string;
  assetName: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  release?: ReleaseInfo;
  platform: PlatformType;
  platformLabel: string;
  isNonWeb: boolean;
}

export interface DownloadProgress {
  status: 'idle' | 'downloading' | 'installing' | 'completed' | 'error';
  percent: number;
  received: number;
  total: number;
  filename?: string;
  error?: string;
  path?: string;
}

let detectedDesktop: PlatformType | null = null;

/** Detecta si estamos en Electron mediante el endpoint local /api/desktop/info */
export async function detectDesktopEnvironment(): Promise<PlatformType | null> {
  if (detectedDesktop) return detectedDesktop;
  if (configuredPlatformOS === 'android' || configuredPlatformOS === 'ios') return null;

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/desktop/info');
      if (res.ok) {
        const info = await res.json();
        if (info?.isElectron) {
          const plat: PlatformType =
            info.platform === 'darwin'
              ? 'electron-mac'
              : info.platform === 'win32'
              ? 'electron-win'
              : 'electron-linux';
          detectedDesktop = plat;
          return plat;
        }
      }
    } catch {}
  }
  return null;
}

/** Detecta el entorno de ejecución actual (incluyendo Electron bajo web). */
export function getPlatformType(): PlatformType {
  if (detectedDesktop) return detectedDesktop;
  if (configuredPlatformOS === 'android') return 'android';
  if (configuredPlatformOS === 'ios') return 'ios';

  if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
    const ua = window.navigator.userAgent || '';
    if (ua.includes('Electron')) {
      const p = (window.navigator.platform || '').toLowerCase();
      if (p.includes('linux')) return 'electron-linux';
      if (p.includes('win')) return 'electron-win';
      if (p.includes('mac')) return 'electron-mac';
      return 'electron-linux';
    }
    return 'web';
  }

  if (typeof process !== 'undefined' && process.platform) {
    if (process.platform === 'win32') return 'electron-win';
    if (process.platform === 'darwin') return 'electron-mac';
    if (process.platform === 'linux') return 'electron-linux';
  }

  return 'web';
}

/** Retorna true si no estamos ejecutándonos en un navegador web estándar. */
export function isNonWeb(): boolean {
  return getPlatformType() !== 'web';
}

/** Etiqueta descriptiva y amigable de la plataforma. */
export function getPlatformLabel(type: PlatformType = getPlatformType()): string {
  switch (type) {
    case 'electron-linux':
      return 'Escritorio (Linux)';
    case 'electron-win':
      return 'Escritorio (Windows)';
    case 'electron-mac':
      return 'Escritorio (macOS)';
    case 'android':
      return 'Móvil (Android)';
    case 'ios':
      return 'Móvil (iOS)';
    case 'web':
    default:
      return 'Navegador Web';
  }
}

/** Compara dos versiones semver simples (ej. '1.0.0' vs '1.0.1'). Retorna true si latest es mayor que current. */
export function isNewerVersion(current: string, latest: string): boolean {
  const clean = (v: string) =>
    v
      .replace(/^v/i, '')
      .trim()
      .split('.')
      .map((part) => {
        const num = parseInt(part, 10);
        return isNaN(num) ? 0 : num;
      });

  const cParts = clean(current);
  const lParts = clean(latest);
  const maxLen = Math.max(cParts.length, lParts.length, 3);

  for (let i = 0; i < maxLen; i++) {
    const c = cParts[i] ?? 0;
    const l = lParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

/** Encuentra el instalador más adecuado según los assets disponibles de GitHub y la plataforma */
export function findBestAsset(
  assets: any[],
  platform: PlatformType | 'linux' | 'windows' | 'mac' | 'android' | 'ios'
): { name: string; browser_download_url: string; size?: number } | undefined {
  if (!assets || !assets.length) return undefined;
  let targetPattern: RegExp;

  if (platform === 'electron-linux' || platform === 'linux') {
    targetPattern = /\.(AppImage|deb|rpm|tar\.gz)$/i;
  } else if (platform === 'electron-win' || platform === 'windows') {
    targetPattern = /\.(exe|msi)$/i;
  } else if (platform === 'electron-mac' || platform === 'mac') {
    targetPattern = /\.(dmg|pkg|zip)$/i;
  } else if (platform === 'android') {
    targetPattern = /\.apk$/i;
  } else {
    return undefined;
  }

  return assets.find((a: any) => targetPattern.test(a?.name || ''));
}

/** Resuelve el asset adecuado a descargar según la plataforma */
function resolveDownloadAsset(platform: PlatformType, assets: any[] = []): { downloadUrl: string; assetName: string } {
  const found = findBestAsset(assets, platform);
  if (found) {
    return { downloadUrl: found.browser_download_url, assetName: found.name };
  }

  // Fallback si no hay release binaria específica
  let fallbackName = 'PSJavaScript-update';
  if (platform === 'electron-linux') fallbackName = 'PSJavaScript-Linux.AppImage';
  else if (platform === 'electron-win') fallbackName = 'PSJavaScript-Windows-Setup.exe';
  else if (platform === 'electron-mac') fallbackName = 'PSJavaScript-Mac.dmg';
  else if (platform === 'android') fallbackName = 'PSJavaScript.apk';

  return {
    downloadUrl: GITHUB_RELEASES_URL,
    assetName: fallbackName,
  };
}

/**
 * Consulta la versión más reciente en GitHub.
 * Si allowWebCheck es false y estamos en web pura, no busca para no incurrir en peticiones innecesarias.
 */
export async function checkForUpdate(options: { allowWebCheck?: boolean } = {}): Promise<UpdateCheckResult> {
  if (getPlatformType() === 'web') {
    await detectDesktopEnvironment();
  }
  const platform = getPlatformType();
  const nonWeb = isNonWeb();

  if (!nonWeb && !options.allowWebCheck) {
    return {
      hasUpdate: false,
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
      platform,
      platformLabel: getPlatformLabel(platform),
      isNonWeb: false,
    };
  }

  // 1. Intentar consultar la API de GitHub Releases
  try {
    const res = await fetch(GITHUB_API_LATEST, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (res.ok) {
      const data = await res.json();
      const tagName = data.tag_name || data.name || '';
      const latestVer = tagName.replace(/^v/i, '').trim();
      const hasUpdate = isNewerVersion(CURRENT_VERSION, latestVer);
      const asset = resolveDownloadAsset(platform, data.assets || []);

      const release: ReleaseInfo = {
        version: latestVer,
        name: data.name || `Versión ${latestVer}`,
        notes: data.body || 'Correcciones de errores y mejoras de rendimiento.',
        publishedAt: data.published_at,
        releaseUrl: data.html_url || GITHUB_RELEASES_URL,
        downloadUrl: asset.downloadUrl,
        assetName: asset.assetName,
      };

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion: latestVer,
        release,
        platform,
        platformLabel: getPlatformLabel(platform),
        isNonWeb: nonWeb,
      };
    }
  } catch {
    // Si la API falla (ej. rate limit o sin red), intentar fallback a package.json
  }

  // 2. Fallback a raw package.json en GitHub
  try {
    const res = await fetch(GITHUB_RAW_PKG);
    if (res.ok) {
      const pkg = await res.json();
      const latestVer = (pkg.version || '').trim();
      const hasUpdate = isNewerVersion(CURRENT_VERSION, latestVer);
      const asset = resolveDownloadAsset(platform, []);

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion: latestVer,
        release: {
          version: latestVer,
          name: `Versión ${latestVer}`,
          notes: 'Nueva versión disponible en el repositorio.',
          releaseUrl: GITHUB_RELEASES_URL,
          downloadUrl: asset.downloadUrl,
          assetName: asset.assetName,
        },
        platform,
        platformLabel: getPlatformLabel(platform),
        isNonWeb: nonWeb,
      };
    }
  } catch {}

  return {
    hasUpdate: false,
    currentVersion: CURRENT_VERSION,
    latestVersion: CURRENT_VERSION,
    platform,
    platformLabel: getPlatformLabel(platform),
    isNonWeb: nonWeb,
  };
}

/**
 * Descarga e instala la actualización:
 * En Electron: envía la petición al backend local (Express en localhost:48291), que descarga el binario,
 * le da permisos de ejecución y lo lanza reemplazando la app actual.
 * En Móvil / Web: abre el enlace oficial de descarga del binario / APK.
 */
export async function downloadAndInstall(
  release: ReleaseInfo,
  onProgress?: (progress: DownloadProgress) => void
): Promise<{ success: boolean; error?: string }> {
  const platform = getPlatformType();

  // Caso 1: Aplicación de escritorio (Electron con servidor Express local activo)
  if (platform.startsWith('electron-')) {
    try {
      const res = await fetch('/api/desktop/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: release.downloadUrl,
          filename: release.assetName,
        }),
      });

      if (res.ok) {
        // Monitorear progreso de la descarga en el backend
        let completed = false;
        while (!completed) {
          await new Promise((r) => setTimeout(r, 450));
          try {
            const pRes = await fetch('/api/desktop/download-progress');
            if (pRes.ok) {
              const data: DownloadProgress = await pRes.json();
              onProgress?.(data);
              if (data.status === 'completed') {
                return { success: true };
              }
              if (data.status === 'error') {
                return { success: false, error: data.error || 'Error al descargar archivo' };
              }
            }
          } catch {}
        }
        return { success: true };
      }
    } catch {
      // Si el endpoint local no respondió, caer al fallback de apertura de URL
    }
  }

  // Caso 2: Plataformas móviles o fallback general
  try {
    await openExternalUrl(release.downloadUrl);
    onProgress?.({
      status: 'completed',
      percent: 100,
      received: 100,
      total: 100,
      filename: release.assetName,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'No se pudo abrir el enlace de descarga' };
  }
}
