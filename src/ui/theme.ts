import { Platform, useColorScheme } from 'react-native';
import { DARK_PALETTE, FlowPalette, LIGHT_PALETTE } from '../core/flowchart/svg';
import type { TokType } from '../core/editor/tokenizer';
import { useApp } from '../store/app';

/**
 * Sistema de diseño de PSJavaScript (estilo "cuaderno de cuentos": lienzo
 * blanco, un verde de progreso, un azul para lo interactivo, tipografía
 * redondeada, componentes con bordes gruesos y esquinas redondeadas, sin
 * sombras ni degradados). Todos los módulos toman de aquí colores, radios,
 * bordes, espaciado y tipografía.
 */
export interface Theme {
  dark: boolean;
  /** Lienzo de la página. */
  bg: string;
  /** Tarjetas, paneles y barras. */
  surface: string;
  /** Fondos secundarios: campos, filas alternas, botones neutros. */
  surfaceAlt: string;
  /** Bordes de tarjetas y separadores. */
  border: string;
  /** Bordes de botones y etiquetas delineados. */
  borderStrong: string;
  /** Texto principal (Charcoal). */
  text: string;
  /** Texto secundario (Pencil Gray). */
  textMuted: string;
  /** Texto deshabilitado o de poco énfasis (Faded Gray). */
  textFaint: string;
  /** Verde de progreso: acciones principales, títulos y estados correctos. */
  primary: string;
  /** Verde presionado / borde inferior de botones verdes. */
  primaryDark: string;
  /** Lavado verde suave para resaltar. */
  primarySoft: string;
  primaryText: string;
  /** Azul interactivo: enlaces, selección y acciones secundarias. */
  accent: string;
  accentDark: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  info: string;
  /** Fondo de globos de ayuda (Night Ink). */
  ink: string;
  /** Consola tipo terminal. */
  terminal: { bg: string; text: string; muted: string; error: string; warn: string; input: string; prompt: string };
  execLine: string;
  errorLine: string;
  warnLine: string;
  bracket: string;
  gutter: string;
  gutterText: string;
  selection: string;
  syntax: Record<TokType, string>;
  flow: FlowPalette;
}

const light: Theme = {
  dark: false,
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f7f7f7',
  border: '#e5e5e5',
  borderStrong: '#afafaf',
  text: '#4b4b4b',
  textMuted: '#777777',
  textFaint: '#afafaf',
  primary: '#58cc02',
  primaryDark: '#58a700',
  primarySoft: '#d7ffb8',
  primaryText: '#ffffff',
  accent: '#1cb0f6',
  accentDark: '#1899d6',
  accentSoft: '#ddf4ff',
  danger: '#ff4b4b',
  dangerSoft: '#ffdfe0',
  warning: '#ff9600',
  warningSoft: '#fff1dc',
  success: '#58cc02',
  info: '#1cb0f6',
  ink: '#000437',
  terminal: { bg: '#131f24', text: '#f1f7fb', muted: '#8aa0aa', error: '#ff7676', warn: '#ffc800', input: '#89e219', prompt: '#49c0f8' },
  execLine: 'rgba(255, 200, 0, 0.30)',
  errorLine: 'rgba(255, 75, 75, 0.12)',
  warnLine: 'rgba(255, 150, 0, 0.12)',
  bracket: 'rgba(28, 176, 246, 0.22)',
  gutter: '#f7f7f7',
  gutterText: '#afafaf',
  selection: 'rgba(28, 176, 246, 0.28)',
  syntax: {
    keyword: '#8b2fc9',
    string: '#0f8a5f',
    template: '#0f8a5f',
    number: '#c45f00',
    comment: '#608b4e',
    ident: '#1d2433',
    builtin: '#2f6fed',
    func: '#0b7fa6',
    operator: '#5a6375',
    punct: '#5a6375',
    space: '#1d2433',
    regex: '#c2185b',
    property: '#20756b',
    constant: '#c62828',
  },
  flow: LIGHT_PALETTE,
};

const dark: Theme = {
  dark: true,
  bg: '#131f24',
  surface: '#131f24',
  surfaceAlt: '#202f36',
  border: '#37464f',
  borderStrong: '#52656d',
  text: '#f1f7fb',
  textMuted: '#a3b6bf',
  textFaint: '#52656d',
  primary: '#58cc02',
  primaryDark: '#58a700',
  primarySoft: 'rgba(88, 204, 2, 0.18)',
  primaryText: '#ffffff',
  accent: '#49c0f8',
  accentDark: '#1cb0f6',
  accentSoft: 'rgba(28, 176, 246, 0.18)',
  danger: '#ff6b6b',
  dangerSoft: 'rgba(255, 75, 75, 0.18)',
  warning: '#ffb020',
  warningSoft: 'rgba(255, 150, 0, 0.18)',
  success: '#79d634',
  info: '#49c0f8',
  ink: '#000437',
  terminal: { bg: '#0d171b', text: '#f1f7fb', muted: '#7f949e', error: '#ff7676', warn: '#ffc800', input: '#89e219', prompt: '#49c0f8' },
  execLine: 'rgba(255, 200, 0, 0.22)',
  errorLine: 'rgba(255, 107, 107, 0.16)',
  warnLine: 'rgba(255, 176, 32, 0.12)',
  bracket: 'rgba(73, 192, 248, 0.30)',
  gutter: '#18262d',
  gutterText: '#52656d',
  selection: 'rgba(73, 192, 248, 0.32)',
  syntax: {
    keyword: '#c792ea',
    string: '#a5d68a',
    template: '#a5d68a',
    number: '#f7a26b',
    comment: '#608b4e',
    ident: '#dfe5ee',
    builtin: '#82aaff',
    func: '#6fd3e3',
    operator: '#a9b4c7',
    punct: '#a9b4c7',
    space: '#dfe5ee',
    regex: '#ff8fb1',
    property: '#7fdbca',
    constant: '#ff8a80',
  },
  flow: DARK_PALETTE,
};

/** Radios: controles 12 (botones, campos, etiquetas), superficies 16 (tarjetas, modales). */
export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** Grosor de borde de todos los componentes ("estampa" sobre el papel). */
export const BORDER = 2;

/** Velo detrás de diálogos (tinta de la marca). */
export const SCRIM = 'rgba(0, 4, 55, 0.4)';

/** Escala de espaciado (base 4 px). */
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Tipografía redondeada (Nunito en web; fuente del sistema en móvil). */
export const FONT = Platform.select({
  web: 'Nunito, "Nunito Sans", ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  default: undefined,
}) as string | undefined;

/** Escala tipográfica de la interfaz (adaptada a una herramienta de trabajo). */
export const TYPE = {
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  bodySm: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 21 },
  subheading: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  heading: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  display: { fontSize: 30, fontWeight: '900', lineHeight: 36, letterSpacing: -0.6 },
} as const;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const pref = useApp((s) => s.settings.theme);
  const isDark = pref === 'system' ? scheme === 'dark' : pref === 'dark';
  return isDark ? dark : light;
}

export const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
}) as string;
