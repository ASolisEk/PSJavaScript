/**
 * Geometría de las figuras y exportación del diagrama a SVG (formato vectorial).
 */
import type { BoxEl, FLayout, ShapeKind } from './layout';
import { LH } from './layout';

export interface FlowPalette {
  background: string;
  stroke: string;
  text: string;
  muted: string;
  highlight: string;
  fills: Partial<Record<ShapeKind, string>>;
}

export const LIGHT_PALETTE: FlowPalette = {
  background: '#ffffff',
  stroke: '#4a5568',
  text: '#1a202c',
  muted: '#718096',
  highlight: '#f6ad55',
  fills: {
    process: '#ebf4ff',
    input: '#e6fffa',
    output: '#fefcbf',
    call: '#faf5ff',
    return: '#fed7e2',
    terminal: '#c6f6d5',
    jump: '#fed7d7',
    decision: '#fffaf0',
    connector: '#4a5568',
    frame: 'none',
    ns: '#ffffff',
    loop: '#ebf8ff',
  },
};

export const DARK_PALETTE: FlowPalette = {
  background: '#1a1d23',
  stroke: '#a0aec0',
  text: '#e2e8f0',
  muted: '#a0aec0',
  highlight: '#dd6b20',
  fills: {
    process: '#2a4365',
    input: '#234e52',
    output: '#5f5229',
    call: '#44337a',
    return: '#702459',
    terminal: '#22543d',
    jump: '#742a2a',
    decision: '#3c366b',
    connector: '#a0aec0',
    frame: 'none',
    ns: '#1a1d23',
    loop: '#2a4365',
  },
};

/** Ruta SVG (atributo d) de la figura de una caja. */
export function shapePath(b: BoxEl): string {
  const { x, y, w, h } = b;
  switch (b.shape) {
    case 'input':
    case 'output': {
      const s = 14;
      return `M${x + s},${y} L${x + w},${y} L${x + w - s},${y + h} L${x},${y + h} Z`;
    }
    case 'decision':
      return `M${x + w / 2},${y} L${x + w},${y + h / 2} L${x + w / 2},${y + h} L${x},${y + h / 2} Z`;
    case 'terminal':
    case 'return':
    case 'jump': {
      const r = Math.min(h / 2, 18);
      return `M${x + r},${y} L${x + w - r},${y} A${r},${r} 0 0 1 ${x + w - r},${y + h} L${x + r},${y + h} A${r},${r} 0 0 1 ${x + r},${y} Z`;
    }
    case 'connector': {
      const r = w / 2;
      return `M${x},${y + r} A${r},${r} 0 1 0 ${x + w},${y + r} A${r},${r} 0 1 0 ${x},${y + r} Z`;
    }
    default:
      return `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
  }
}

/** Líneas extra de la figura (barras laterales de "llamada a subproceso"). */
export function shapeExtras(b: BoxEl): number[][] {
  if (b.shape === 'call') return [[b.x + 9, b.y, b.x + 9, b.y + b.h], [b.x + b.w - 9, b.y, b.x + b.w - 9, b.y + b.h]];
  if (b.shape === 'input') return [];
  return [];
}

/** Posiciones de las líneas de texto dentro de una caja. */
export function textPositions(b: BoxEl): { x: number; y: number; text: string; anchor: 'start' | 'middle' }[] {
  const n = b.lines.length;
  const startY = b.y + b.h / 2 - (n * LH) / 2 + LH - 3.5;
  const left = b.align === 'left';
  return b.lines.map((text, i) => ({ x: left ? b.x + 8 : b.x + b.w / 2, y: startY + i * LH, text, anchor: left ? 'start' : 'middle' }));
}

export function arrowHead(pts: number[]): string | null {
  const n = pts.length;
  if (n < 4) return null;
  const x2 = pts[n - 2];
  const y2 = pts[n - 1];
  const x1 = pts[n - 4];
  const y1 = pts[n - 3];
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 7;
  const p1 = [x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)];
  const p2 = [x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)];
  return `M${x2},${y2} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} Z`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function toSVG(layout: FLayout, palette: FlowPalette = LIGHT_PALETTE, title = 'Diagrama'): string {
  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(layout.w)}" height="${Math.ceil(layout.h)}" viewBox="0 0 ${Math.ceil(layout.w)} ${Math.ceil(layout.h)}" font-family="Menlo, Consolas, monospace" font-size="12">`,
  );
  out.push(`<title>${esc(title)}</title>`);
  out.push(`<rect width="100%" height="100%" fill="${palette.background}"/>`);
  for (const el of layout.els) {
    if (el.t === 'box') {
      const fill = el.shape === 'connector' ? palette.stroke : palette.fills[el.shape] ?? 'none';
      out.push(`<path d="${shapePath(el)}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.2"${el.dashed ? ' stroke-dasharray="5,4"' : ''}/>`);
      for (const e of shapeExtras(el)) out.push(`<line x1="${e[0]}" y1="${e[1]}" x2="${e[2]}" y2="${e[3]}" stroke="${palette.stroke}"/>`);
      for (const t of textPositions(el)) out.push(`<text x="${t.x}" y="${t.y}" text-anchor="${t.anchor}" fill="${palette.text}">${esc(t.text)}</text>`);
    } else if (el.t === 'line') {
      const pts = [];
      for (let i = 0; i < el.pts.length; i += 2) pts.push(`${el.pts[i]},${el.pts[i + 1]}`);
      out.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="${palette.stroke}" stroke-width="1.2"${el.dashed ? ' stroke-dasharray="5,4"' : ''}/>`);
      if (el.arrow) {
        const h = arrowHead(el.pts);
        if (h) out.push(`<path d="${h}" fill="${palette.stroke}"/>`);
      }
    } else {
      out.push(
        `<text x="${el.x}" y="${el.y}" text-anchor="${el.anchor}" fill="${el.muted ? palette.muted : palette.text}"${el.bold ? ' font-weight="bold"' : ''}>${esc(el.text)}</text>`,
      );
    }
  }
  out.push('</svg>');
  return out.join('\n');
}
