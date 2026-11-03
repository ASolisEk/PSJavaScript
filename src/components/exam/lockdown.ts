/**
 * Examen bloqueado.
 *
 * Web: pantalla completa durante el examen (con el teclado capturado donde el
 * navegador lo permite: Esc hay que mantenerlo presionado y en Windows Alt+Tab y la
 * tecla Windows no salen del examen) y bloqueo de lo que la página sí puede impedir
 * (clic derecho, F12 y atajos de las herramientas de desarrollo, ver código fuente,
 * guardar, imprimir, copiar, seleccionar el texto, zoom).
 *
 * App de escritorio: además, las capturas y grabaciones de pantalla salen en negro y
 * la ventana queda en modo quiosco, siempre al frente (en macOS se desactiva Cmd+Tab).
 *
 * Android/iOS: se impiden las capturas y grabaciones de pantalla (y el examen no se ve
 * en «Recientes»), el botón Atrás no saca del examen y salir de la app lo oculta.
 *
 * Lo que no se puede bloquear (salir de pantalla completa, cambiar de pestaña, ventana
 * o app, la tecla Impr Pant del sistema, herramientas abiertas desde el menú) se
 * detecta: el examen se oculta hasta que el alumno regresa y se avisa al maestro.
 */
import { NavigationBar } from 'expo-navigation-bar';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Platform, StatusBar } from 'react-native';
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

/** Captura del teclado en pantalla completa (Chrome/Edge): Esc, Alt+Tab y la tecla Windows llegan a la página. */
function lockKeyboard() {
  (navigator as any).keyboard?.lock?.()?.catch?.(() => {});
}

/**
 * App de escritorio (Electron): pide a la ventana protección contra capturas y modo
 * quiosco. En el navegador estas rutas no existen y no pasa nada.
 */
async function desktopExamLock(on: boolean) {
  try {
    if (on) {
      const info = await fetch('/api/desktop/info').then((r) => (r.ok ? r.json() : null));
      if (!info?.isElectron) return;
    }
    await fetch('/api/desktop/exam-lock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on }), keepalive: true });
  } catch {
    /* no es la app de escritorio */
  }
}

const CAPTURE_KEY = 'examen';

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
    if (isFullscreen()) lockKeyboard();
    desktopExamLock(true);

    const onFs = () => {
      if (isFullscreen()) lockKeyboard();
      else if (needFs) report('Salió de pantalla completa');
      check();
    };
    const onKey = (e: KeyboardEvent) => {
      // con el teclado capturado, Esc llega a la página: no saca de pantalla completa
      if (e.key === 'Escape' && isFullscreen()) e.preventDefault();
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
    // El navegador no deja impedir que se salga de pantalla completa (Esc mantenido, F11, menú),
    // pero sí volver a entrar con un gesto del alumno: cualquier clic o tecla la recupera.
    const regain = () => {
      if (needFs && !isFullscreen()) enterFullscreen().then(() => setTimeout(check, 50));
    };
    const block = (e: Event) => e.preventDefault();
    // seleccionar el texto del examen (sí se puede dentro del propio código)
    const onSelect = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
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
    document.addEventListener('pointerdown', regain, true);
    document.addEventListener('keydown', regain, true);
    window.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('contextmenu', block, true);
    document.addEventListener('dragstart', block, true);
    document.addEventListener('selectstart', onSelect, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCopy, true);
    window.addEventListener('beforeprint', onPrint);
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('blur', check);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);

    // al imprimir (desde el menú del navegador) no sale el examen
    const style = document.createElement('style');
    style.textContent =
      '@media print { body { display: none !important; } } body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; } textarea, input { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }';
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
      document.removeEventListener('pointerdown', regain, true);
      document.removeEventListener('keydown', regain, true);
      window.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('contextmenu', block, true);
      document.removeEventListener('dragstart', block, true);
      document.removeEventListener('selectstart', onSelect, true);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('cut', onCopy, true);
      window.removeEventListener('beforeprint', onPrint);
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('blur', check);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
      style.remove();
      (navigator as any).keyboard?.unlock?.();
      desktopExamLock(false);
      clearInterval(probe);
      clearTimeout(first);
      setDevtools(false);
    };
  }, [active]);

  // Android/iOS
  useEffect(() => {
    if (!active || Platform.OS === 'web') return;
    // sin capturas ni grabaciones de pantalla, y en blanco en «Recientes»
    ScreenCapture.preventScreenCaptureAsync(CAPTURE_KEY).catch(() => {});
    // pantalla completa: sin barra de estado ni barra de navegación (se asoman solo al deslizar)
    const immersive = (on: boolean) => {
      StatusBar.setHidden(on, 'fade');
      if (Platform.OS === 'android') {
        try {
          NavigationBar.setHidden(on);
        } catch {
          /* versión de Android sin soporte */
        }
      }
    };
    immersive(true);
    let left = false;
    const app = AppState.addEventListener('change', (state) => {
      if (state !== 'active') left = true;
      else {
        // al volver a la app, el sistema puede mostrar de nuevo las barras
        immersive(true);
        if (left) {
          left = false;
          setCover('away');
        }
      }
    });
    // el botón Atrás no saca del examen
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    // iOS no deja impedir las capturas de pantalla: se avisa al maestro
    const shot = Platform.OS === 'ios' ? ScreenCapture.addScreenshotListener(() => incident.current('Tomó una captura de pantalla')) : null;
    return () => {
      immersive(false);
      ScreenCapture.allowScreenCaptureAsync(CAPTURE_KEY).catch(() => {});
      app.remove();
      back.remove();
      shot?.remove();
    };
  }, [active]);

  const resume = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setCover(null);
      return;
    }
    await enterFullscreen();
    window.focus?.();
    setCover(fullscreenSupported() && !isFullscreen() ? 'fullscreen' : null);
  }, []);

  return { cover: active ? cover : null, devtools: active && devtools, resume };
}
