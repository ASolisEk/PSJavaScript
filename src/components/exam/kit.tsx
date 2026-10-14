/**
 * Componentes del modo Maestro y del modo Examen. Los visuales viven en el
 * sistema de diseño común (components/ui.tsx); aquí se reexportan junto con
 * utilidades de formato de tiempo.
 */
export { Banner, BigChoice, Card, CodeBlock, Field, NumberStepper, Pill, ProgressBar, ScreenHeader, Segmented, Stat, TextField, Toggle } from '../ui';
export type { IconName } from '../ui';

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatSince(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
