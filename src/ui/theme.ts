import { Platform, useColorScheme } from 'react-native';
import { DARK_PALETTE, FlowPalette, LIGHT_PALETTE } from '../core/flowchart/svg';
import type { TokType } from '../core/editor/tokenizer';
import { useApp } from '../store/app';

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
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
  bg: '#f4f6fa',
  surface: '#ffffff',
  surfaceAlt: '#eef1f6',
  border: '#d9dee7',
  text: '#1d2433',
  textMuted: '#6b7487',
  primary: '#2f6fed',
  primaryText: '#ffffff',
  accent: '#7c4dff',
  danger: '#d64545',
  warning: '#c77800',
  success: '#1f9d55',
  info: '#2f6fed',
  execLine: 'rgba(255, 196, 0, 0.30)',
  errorLine: 'rgba(214, 69, 69, 0.12)',
  warnLine: 'rgba(199, 120, 0, 0.10)',
  bracket: 'rgba(47, 111, 237, 0.22)',
  gutter: '#eef1f6',
  gutterText: '#9aa3b5',
  selection: 'rgba(47, 111, 237, 0.30)',
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
  bg: '#14171c',
  surface: '#1b1f26',
  surfaceAlt: '#232831',
  border: '#2e3440',
  text: '#dfe5ee',
  textMuted: '#8b95a7',
  primary: '#5b8cff',
  primaryText: '#0b1020',
  accent: '#b388ff',
  danger: '#ff6b6b',
  warning: '#f0b44c',
  success: '#4cc38a',
  info: '#5b8cff',
  execLine: 'rgba(255, 196, 0, 0.22)',
  errorLine: 'rgba(255, 107, 107, 0.14)',
  warnLine: 'rgba(240, 180, 76, 0.10)',
  bracket: 'rgba(91, 140, 255, 0.30)',
  gutter: '#181c22',
  gutterText: '#5c6678',
  selection: 'rgba(91, 140, 255, 0.35)',
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
