/**
 * Registro de errores de la aplicación (no los del programa del alumno): se guardan solo en
 * memoria y nunca se envían solos. Desde Ajustes, el usuario puede revisarlos y abrir un
 * reporte en GitHub con el texto ya escrito, que él mismo revisa y decide enviar.
 */
export interface AppError {
  at: number;
  message: string;
  stack?: string;
  where: string;
}

const MAX = 20;
const errors: AppError[] = [];
const listeners = new Set<() => void>();

export function recordError(e: unknown, where: string) {
  const err = e as any;
  const message = String(err?.message ?? err ?? 'Error desconocido').slice(0, 500);
  // el mismo error repetido muchas veces solo se guarda una vez seguida
  if (errors.length && errors[errors.length - 1].message === message) return;
  errors.push({ at: Date.now(), message, stack: typeof err?.stack === 'string' ? err.stack.split('\n').slice(0, 8).join('\n').slice(0, 1500) : undefined, where });
  if (errors.length > MAX) errors.shift();
  listeners.forEach((l) => l());
}

export function recentErrors(): AppError[] {
  return [...errors];
}

export function onErrorsChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let installed = false;

/** Escucha los errores no atrapados (web y teléfono). Se llama una vez al iniciar. */
export function installErrorLog() {
  if (installed) return;
  installed = true;
  const g = globalThis as any;
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('error', (e: any) => recordError(e?.error ?? e?.message, 'ventana'));
    window.addEventListener('unhandledrejection', (e: any) => recordError(e?.reason, 'promesa'));
  }
  const EU = g.ErrorUtils;
  if (EU?.getGlobalHandler && EU?.setGlobalHandler) {
    const prev = EU.getGlobalHandler();
    EU.setGlobalHandler((error: unknown, fatal?: boolean) => {
      recordError(error, fatal ? 'fatal' : 'app');
      prev?.(error, fatal);
    });
  }
}

/** Enlace para abrir un reporte en GitHub con la información ya escrita (el usuario lo revisa antes de enviar). */
export function issueUrl(p: { what: string; version: string; platform: string; errors: AppError[] }): string {
  const lines = [
    '**¿Qué pasó?**',
    p.what.trim() || '(describe qué estabas haciendo y qué esperabas que pasara)',
    '',
    `**Versión:** ${p.version} · **Plataforma:** ${p.platform}`,
  ];
  if (p.errors.length) {
    lines.push('', '**Errores recientes de la aplicación:**', '```');
    for (const e of p.errors.slice(-5)) lines.push(`[${new Date(e.at).toISOString()}] (${e.where}) ${e.message}`, ...(e.stack ? [e.stack] : []), '');
    lines.push('```');
  }
  const body = lines.join('\n').slice(0, 6000);
  const title = `Problema: ${p.what.trim().split('\n')[0].slice(0, 60) || 'reporte desde la aplicación'}`;
  return `https://github.com/ASolisEk/PSJavaScript/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=reporte`;
}
