/**
 * Examen bloqueado (solo web/escritorio): pantalla completa durante el examen y
 * bloqueo de lo que la página sí puede impedir (clic derecho, F12 y atajos de las
 * herramientas de desarrollo, ver código fuente, guardar, imprimir, copiar, zoom).
 *
 * Lo que el navegador no deja bloquear (salir de pantalla completa con Esc, cambiar
 * de pestaña o ventana, la tecla Impr Pant del sistema, herramientas abiertas desde
 * el menú) se detecta: el examen se oculta hasta que el alumno regresa y se avisa
 * al maestro.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { blockedShortcut } from '../../core/exam/lockdown';

const web = () => Platform.OS === 'web' && typeof document !== 'undefined' && typeof window !== 'undefined';

/** ¿El navegador permite poner la página en pantalla completa? (no en iPhone, por ejemplo) */
export function fullscreenSupported(): boolean {
  return web() && !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;
}

export function isFullscreen(): boolean {
  return web() && !!document.fullscreenElement;
}

/** Debe llamarse desde un toque o clic del alumno (el navegador lo exige). */
export async function enterFullscreen(): Promise<boolean> {
  if (!fullscreenSupported()) return false;
  if (isFullscreen()) return true;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
    return true;
  } catch {
    return false;
  }
}

export function exitFullscreen() {
  if (!isFullscreen()) return;
  document.exitFullscreen?.().catch(() => {});
}

/** Por qué se ocultó el examen. */
export type CoverReason = 'fullscreen' | 'away' | null;

function isEditable(el: EventTarget | null): boolean {
  const e = el as HTMLElement | null;
  return !!e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.isContentEditable);
}

/**
 * Activa el bloqueo mientras `active`. `onIncident` recibe una descripción para el maestro.
 * Devuelve si el examen debe ocultarse y cómo volver.
 */
export function useExamLockdown(active: boolean, onIncident: (detail: string) => void) {
  const [cover, setCover] = useState<CoverReason>(null);
  const [devtools, setDevtools] = useState(false);
  const incident = useRef(onIncident);
  useEffect(() => {
    incident.current = onIncident;
  });

  useEffect(() => {
    if (!active || !web()) return;
    const last: Record<string, number> = {};
    const report = (detail: string) => {
      // el mismo aviso como mucho cada 3 s (al dejar una tecla presionada, por ejemplo)
      const now = Date.now();
      if (now - (last[detail] ?? 0) < 3000) return;
      last[detail] = now;
      incident.current(detail);
    };
    const needFs = fullscreenSupported();
    const check = () => setCover(needFs && !isFullscreen() ? 'fullscreen' : !document.hasFocus() || document.visibilityState === 'hidden' ? 'away' : null);
    const first = setTimeout(check, 0);

    const onFs = () => {
      if (needFs && !isFullscreen()) report('Salió de pantalla completa');
      check();
    };
    const onKey = (e: KeyboardEvent) => {
      const why = blockedShortcut(e);
      if (!why) return;
      e.preventDefault();
      e.stopPropagation();
      if (why === 'zoom') return; // el examen tiene sus propios botones A− / A+
      report(why);
      if (e.key === 'PrintScreen') {
        // en Windows la captura queda en el portapapeles: se reemplaza
        navigator.clipboard?.writeText('').catch(() => {});
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // Impr Pant solo llega al soltarla en varios navegadores
      if (e.key !== 'PrintScreen') return;
      report('Presionó Impr Pant (captura de pantalla)');
      navigator.clipboard?.writeText('').catch(() => {});
    };
    const block = (e: Event) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => {
      // puede copiar dentro de su propio código, no el texto del examen
      if (isEditable(e.target)) return;
      e.preventDefault();
      report('Intentó copiar el texto del examen');
    };
    const onPrint = () => report('Intentó imprimir el examen');
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('contextmenu', block, true);
    document.addEventListener('dragstart', block, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCopy, true);
    window.addEventListener('beforeprint', onPrint);
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('blur', check);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);

    // al imprimir (desde el menú del navegador) no sale el examen
    const style = document.createElement('style');
    style.textContent = '@media print { body { display: none !important; } } body { -webkit-user-select: none; user-select: none; } textarea, input { -webkit-user-select: text; user-select: text; }';
    document.head.appendChild(style);

    // herramientas de desarrollo acopladas: en pantalla completa la página se encoge
    let devOpen = false;
    const probe = setInterval(() => {
      if (!isFullscreen()) return;
      const open = window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;
      if (open && !devOpen) report('Abrió las herramientas de desarrollo');
      devOpen = open;
      setDevtools(open);
    }, 1500);

    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('contextmenu', block, true);
      document.removeEventListener('dragstart', block, true);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('cut', onCopy, true);
      window.removeEventListener('beforeprint', onPrint);
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('blur', check);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
      style.remove();
      clearInterval(probe);
      clearTimeout(first);
      setDevtools(false);
    };
  }, [active]);

  const resume = useCallback(async () => {
    await enterFullscreen();
    window.focus?.();
    setCover(fullscreenSupported() && !isFullscreen() ? 'fullscreen' : null);
  }, []);

  return { cover: active ? cover : null, devtools: active && devtools, resume };
}
