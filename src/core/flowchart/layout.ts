/**
 * Distribución geométrica de diagramas:
 *  - Diagrama de flujo clásico (layoutClassic)
 *  - Diagrama de Nassi-Shneiderman / estructograma (layoutNassi)
 * Produce una lista de elementos simples (cajas, líneas, textos) que pueden
 * dibujarse con react-native-svg o exportarse a SVG.
 */
import type { FBlock, FlowDiagram, OpShape } from './model';

export type ShapeKind = OpShape | 'decision' | 'connector' | 'frame' | 'ns' | 'loop';

export interface BoxEl {
  t: 'box';
  shape: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  line: number;
  align?: 'center' | 'left';
  dashed?: boolean;
}
export interface LineEl {
  t: 'line';
  pts: number[];
  arrow?: boolean;
  dashed?: boolean;
}
export interface TextEl {
  t: 'text';
  x: number;
  y: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
  muted?: boolean;
  bold?: boolean;
}
export type FEl = BoxEl | LineEl | TextEl;
export interface FLayout {
  w: number;
  h: number;
  els: FEl[];
}

export const CW = 7.2; // ancho de carácter (monoespaciado 12px)
export const LH = 15; // alto de línea
const VG = 26;
const HG = 34;
const MAX_CHARS = 32;

export function wrapText(text: string, max = MAX_CHARS, maxLines = 4): string[] {
  const out: string[] = [];
  let rest = text;
  while (rest.length > max && out.length < maxLines - 1) {
    let cut = -1;
    for (let i = Math.min(max, rest.length - 1); i > max * 0.4; i--) {
      if (rest[i] === ' ') {
        cut = i;
        break;
      }
      if ('(,+'.includes(rest[i - 1]) && cut < 0) cut = i;
    }
    if (cut < 0) cut = max;
    out.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest.length > max) rest = rest.slice(0, max - 1) + '…';
  out.push(rest);
  return out;
}

const textW = (lines: string[]) => Math.max(...lines.map((l) => l.length)) * CW;

// ───────────────────────────── diagrama clásico ─────────────────────────────

interface Piece {
  l: number;
  r: number;
  h: number;
  draw(cx: number, y: number, out: FEl[]): void;
}

const EMPTY: Piece = { l: 0, r: 0, h: 0, draw() {} };

function opPiece(shape: OpShape, text: string, line: number): Piece {
  const lines = wrapText(text);
  const skew = shape === 'input' || shape === 'output' ? 22 : 0;
  const pad = shape === 'call' ? 36 : shape === 'terminal' || shape === 'return' ? 32 : 24;
  const w = Math.max(shape === 'terminal' ? 90 : 100, textW(lines) + pad + skew);
  const h = lines.length * LH + 16;
  return {
    l: w / 2,
    r: w / 2,
    h,
    draw(cx, y, out) {
      out.push({ t: 'box', shape, x: cx - w / 2, y, w, h, lines, line });
    },
  };
}

function diamondDims(text: string) {
  const lines = wrapText(text, 26, 3);
  const w = Math.max(110, textW(lines) * 1.45 + 40);
  const h = Math.max(54, lines.length * LH * 1.6 + 26);
  return { lines, w, h };
}

function arrow(out: FEl[], pts: number[], dashed = false) {
  out.push({ t: 'line', pts, arrow: true, dashed });
}
function seg(out: FEl[], pts: number[]) {
  out.push({ t: 'line', pts });
}
function label(out: FEl[], x: number, y: number, text: string, anchor: TextEl['anchor'] = 'start') {
  out.push({ t: 'text', x, y, text, anchor, muted: true });
}

function seqPiece(items: Piece[]): Piece {
  const ps = items.filter((p) => p.h > 0);
  if (!ps.length) return EMPTY;
  const h = ps.reduce((s, p) => s + p.h, 0) + VG * (ps.length - 1);
  return {
    l: Math.max(...ps.map((p) => p.l)),
    r: Math.max(...ps.map((p) => p.r)),
    h,
    draw(cx, y, out) {
      let cy = y;
      ps.forEach((p, i) => {
        if (i > 0) {
          arrow(out, [cx, cy, cx, cy + VG]);
          cy += VG;
        }
        p.draw(cx, cy, out);
        cy += p.h;
      });
    },
  };
}

function ifPiece(cond: string, line: number, yes: Piece, no: Piece, yesLabel = 'Sí', noLabel = 'No'): Piece {
  const d = diamondDims(cond);
  const yx = Math.max(d.w / 2, yes.l + HG / 2);
  const nx = Math.max(d.w / 2, no.r + HG / 2);
  const bodyGap = 22;
  const bh = Math.max(yes.h, no.h);
  const h = d.h + bodyGap + bh + VG;
  return {
    l: Math.max(d.w / 2, nx + no.l),
    r: Math.max(d.w / 2, yx + yes.r),
    h,
    draw(cx, y, out) {
      out.push({ t: 'box', shape: 'decision', x: cx - d.w / 2, y, w: d.w, h: d.h, lines: d.lines, line });
      const my = y + d.h / 2;
      const top = y + d.h + bodyGap;
      const mergeY = top + bh + VG / 2;
      // rama Sí (derecha)
      if (yes.h > 0) {
        arrow(out, [cx + d.w / 2, my, cx + yx, my, cx + yx, top]);
        yes.draw(cx + yx, top, out);
        seg(out, [cx + yx, top + yes.h, cx + yx, mergeY, cx, mergeY]);
      } else seg(out, [cx + d.w / 2, my, cx + yx, my, cx + yx, mergeY, cx, mergeY]);
      label(out, cx + d.w / 2 + 4, my - 5, yesLabel);
      // rama No (izquierda)
      if (no.h > 0) {
        arrow(out, [cx - d.w / 2, my, cx - nx, my, cx - nx, top]);
        no.draw(cx - nx, top, out);
        seg(out, [cx - nx, top + no.h, cx - nx, mergeY, cx, mergeY]);
      } else seg(out, [cx - d.w / 2, my, cx - nx, my, cx - nx, mergeY, cx, mergeY]);
      label(out, cx - d.w / 2 - 4, my - 5, noLabel, 'end');
      out.push({ t: 'box', shape: 'connector', x: cx - 4, y: mergeY - 4, w: 8, h: 8, lines: [], line: 0 });
      seg(out, [cx, mergeY, cx, y + h]);
    },
  };
}

function whilePiece(cond: string, line: number, body: Piece, yesLabel = 'Sí', noLabel = 'No'): Piece {
  const d = diamondDims(cond);
  const TM = 16;
  const side = 22;
  const l = Math.max(d.w / 2, body.l) + side;
  const r = Math.max(d.w / 2, body.r) + side;
  const h = TM + d.h + VG + body.h + 14 + VG;
  return {
    l,
    r,
    h,
    draw(cx, y, out) {
      const dy = y + TM;
      seg(out, [cx, y, cx, dy]);
      out.push({ t: 'box', shape: 'decision', x: cx - d.w / 2, y: dy, w: d.w, h: d.h, lines: d.lines, line });
      const bodyTop = dy + d.h + VG;
      arrow(out, [cx, dy + d.h, cx, bodyTop]);
      label(out, cx + 5, dy + d.h + 14, yesLabel);
      body.draw(cx, bodyTop, out);
      const back = bodyTop + body.h + 14;
      // retorno al inicio del ciclo
      arrow(out, [cx, bodyTop + body.h, cx, back, cx - l, back, cx - l, y + TM / 2, cx, y + TM / 2]);
      // salida (falso)
      const my = dy + d.h / 2;
      const exitY = back + VG / 2 + 4;
      seg(out, [cx + d.w / 2, my, cx + r, my, cx + r, exitY, cx, exitY]);
      label(out, cx + d.w / 2 + 4, my - 5, noLabel);
      seg(out, [cx, exitY, cx, y + h]);
    },
  };
}

function doWhilePiece(cond: string, line: number, body: Piece): Piece {
  const d = diamondDims(cond);
  const TM = 16;
  const side = 22;
  const l = Math.max(d.w / 2, body.l) + side;
  const r = Math.max(d.w / 2, body.r);
  const h = TM + body.h + VG + d.h + VG / 2;
  return {
    l,
    r,
    h,
    draw(cx, y, out) {
      seg(out, [cx, y, cx, y + TM]);
      body.draw(cx, y + TM, out);
      const dy = y + TM + body.h + VG;
      arrow(out, [cx, y + TM + body.h, cx, dy]);
      out.push({ t: 'box', shape: 'decision', x: cx - d.w / 2, y: dy, w: d.w, h: d.h, lines: d.lines, line });
      const my = dy + d.h / 2;
      arrow(out, [cx - d.w / 2, my, cx - l, my, cx - l, y + TM / 2, cx, y + TM / 2]);
      label(out, cx - d.w / 2 - 4, my - 5, 'Sí', 'end');
      seg(out, [cx, dy + d.h, cx, y + h]);
      label(out, cx + 5, dy + d.h + 12, 'No');
    },
  };
}

function switchPiece(expr: string, line: number, cases: { label: string; body: Piece }[]): Piece {
  const d = diamondDims(expr);
  if (!cases.length) return opPiece('process', `switch (${expr})`, line);
  const axes: number[] = [];
  cases.forEach((c, i) => {
    if (i === 0) axes.push(0);
    else axes.push(axes[i - 1] + cases[i - 1].body.r + HG + c.body.l + 0 * i);
  });
  // ancho mínimo por etiqueta
  for (let i = 1; i < cases.length; i++) {
    const need = (cases[i - 1].label.length + cases[i].label.length) * CW * 0.5 + 24;
    if (axes[i] - axes[i - 1] < need) {
      const delta = need - (axes[i] - axes[i - 1]);
      for (let j = i; j < axes.length; j++) axes[j] += delta;
    }
  }
  const minX = axes[0] - Math.max(cases[0].body.l, 30);
  const last = cases.length - 1;
  const maxX = axes[last] + Math.max(cases[last].body.r, 30);
  const shift = -(minX + maxX) / 2;
  const ax = axes.map((a) => a + shift);
  const busGap = 14;
  const labelGap = 24;
  const bh = Math.max(...cases.map((c) => c.body.h));
  const h = d.h + busGap + labelGap + bh + VG;
  return {
    l: Math.max(d.w / 2, -(minX + shift)),
    r: Math.max(d.w / 2, maxX + shift),
    h,
    draw(cx, y, out) {
      out.push({ t: 'box', shape: 'decision', x: cx - d.w / 2, y, w: d.w, h: d.h, lines: d.lines, line });
      const busY = y + d.h + busGap;
      seg(out, [cx, y + d.h, cx, busY]);
      seg(out, [cx + ax[0], busY, cx + ax[last], busY]);
      const top = busY + labelGap;
      const mergeY = top + bh + VG / 2;
      cases.forEach((c, i) => {
        const x = cx + ax[i];
        label(out, x + 4, busY + 15, c.label.length > 18 ? c.label.slice(0, 17) + '…' : c.label);
        if (c.body.h > 0) {
          arrow(out, [x, busY, x, top]);
          c.body.draw(x, top, out);
          seg(out, [x, top + c.body.h, x, mergeY]);
        } else seg(out, [x, busY, x, mergeY]);
      });
      seg(out, [cx + ax[0], mergeY, cx + ax[last], mergeY]);
      out.push({ t: 'box', shape: 'connector', x: cx - 4, y: mergeY - 4, w: 8, h: 8, lines: [], line: 0 });
      seg(out, [cx, mergeY, cx, y + h]);
    },
  };
}

function framePiece(title: string, inner: Piece, line: number, dashed: boolean): Piece {
  const pad = 14;
  const head = 20;
  const l = Math.max(inner.l, 50) + pad;
  const r = Math.max(inner.r, 50) + pad;
  const h = head + 8 + Math.max(inner.h, 10) + pad;
  return {
    l,
    r,
    h,
    draw(cx, y, out) {
      out.push({ t: 'box', shape: 'frame', x: cx - l, y, w: l + r, h, lines: [], line, dashed });
      out.push({ t: 'text', x: cx - l + 8, y: y + 14, text: title, anchor: 'start', bold: true, muted: true });
      seg(out, [cx, y, cx, y + head + 8]);
      inner.draw(cx, y + head + 8, out);
      seg(out, [cx, y + head + 8 + inner.h, cx, y + h]);
    },
  };
}

function classicPiece(b: FBlock): Piece {
  switch (b.k) {
    case 'seq':
      return seqPiece(b.items.map(classicPiece));
    case 'op':
      return opPiece(b.shape, b.text, b.line);
    case 'if':
      return ifPiece(b.cond, b.line, classicPiece(b.yes), b.no ? classicPiece(b.no) : EMPTY);
    case 'while':
      return whilePiece(b.cond, b.line, classicPiece(b.body));
    case 'dowhile':
      return doWhilePiece(b.cond, b.line, classicPiece(b.body));
    case 'for': {
      const loop = whilePiece(b.cond, b.line, seqPiece([classicPiece(b.body), b.update ? opPiece('process', b.update, b.line) : EMPTY]));
      return seqPiece([b.init ? opPiece('process', b.init, b.line) : EMPTY, loop]);
    }
    case 'forof':
      return whilePiece(
        `${b.variable} ${b.of ? 'de' : 'en'} ${b.iterable}`,
        b.line,
        classicPiece(b.body),
        b.of ? 'siguiente' : 'siguiente clave',
        'fin',
      );
    case 'switch':
      return switchPiece(b.expr, b.line, b.cases.map((c) => ({ label: c.label, body: classicPiece(c.body) })));
    case 'try': {
      const parts: Piece[] = [framePiece('try', classicPiece(b.body), b.line, false)];
      if (b.handler) parts.push(framePiece(`catch${b.param ? ` (${b.param})` : ''} — si ocurre un error`, classicPiece(b.handler), b.line, true));
      if (b.finalizer) parts.push(framePiece('finally', classicPiece(b.finalizer), b.line, false));
      return seqPiece(parts);
    }
  }
}

export function layoutClassic(d: FlowDiagram): FLayout {
  const p = classicPiece(d.body);
  const M = 24;
  const els: FEl[] = [];
  p.draw(M + p.l, M, els);
  return { w: p.l + p.r + 2 * M, h: p.h + 2 * M, els };
}

// ───────────────────────────── Nassi-Shneiderman ─────────────────────────────

const NS_PAD = 8;
const NS_INDENT = 22;

function nsLines(text: string) {
  return wrapText(text, 40, 3);
}
function nsOpText(b: { shape: OpShape; text: string }) {
  return b.shape === 'output' ? `Mostrar: ${b.text}` : b.text;
}
function nsRowH(lines: string[]) {
  return lines.length * LH + 12;
}

function nsHeaderText(b: FBlock): string {
  switch (b.k) {
    case 'while':
      return `mientras (${b.cond})`;
    case 'for':
      return `for (${b.init}; ${b.cond}; ${b.update})`;
    case 'forof':
      return `para cada ${b.variable} ${b.of ? 'de' : 'en'} ${b.iterable}`;
    case 'dowhile':
      return `mientras (${b.cond})`;
    default:
      return '';
  }
}

function nsMinW(b: FBlock): number {
  switch (b.k) {
    case 'seq':
      return b.items.length ? Math.max(...b.items.map(nsMinW)) : 60;
    case 'op':
      return textW(nsLines(nsOpText(b))) + NS_PAD * 2;
    case 'if':
      return Math.max(textW(nsLines(b.cond)) + 60, nsMinW(b.yes) + (b.no ? nsMinW(b.no) : 50));
    case 'while':
    case 'for':
    case 'forof':
    case 'dowhile':
      return Math.max(textW(nsLines(nsHeaderText(b))) + NS_PAD * 2, NS_INDENT + nsMinW(b.body));
    case 'switch':
      return Math.max(textW(nsLines(b.expr)) + 60, b.cases.reduce((s, c) => s + Math.max(nsMinW(c.body), c.label.length * CW + 16), 0));
    case 'try':
      return Math.max(120, NS_INDENT + nsMinW(b.body), b.handler ? NS_INDENT + nsMinW(b.handler) : 0, b.finalizer ? NS_INDENT + nsMinW(b.finalizer) : 0);
  }
}

function nsH(b: FBlock): number {
  switch (b.k) {
    case 'seq':
      return b.items.length ? b.items.reduce((s, x) => s + nsH(x), 0) : 24;
    case 'op':
      return nsRowH(nsLines(nsOpText(b)));
    case 'if':
      return nsRowH(nsLines(b.cond)) + 16 + Math.max(nsH(b.yes), b.no ? nsH(b.no) : 24);
    case 'while':
    case 'for':
    case 'forof':
    case 'dowhile':
      return nsRowH(nsLines(nsHeaderText(b))) + nsH(b.body);
    case 'switch':
      return nsRowH(nsLines(b.expr)) + 18 + Math.max(...b.cases.map((c) => nsH(c.body)), 24);
    case 'try':
      return 24 + nsH(b.body) + (b.handler ? 24 + nsH(b.handler) : 0) + (b.finalizer ? 24 + nsH(b.finalizer) : 0);
  }
}

function nsRender(b: FBlock, x: number, y: number, w: number, out: FEl[], hOverride?: number): number {
  const h = hOverride ?? nsH(b);
  switch (b.k) {
    case 'seq': {
      if (!b.items.length) {
        out.push({ t: 'box', shape: 'ns', x, y, w, h, lines: ['∅'], line: 0, align: 'center' });
        return h;
      }
      let cy = y;
      b.items.forEach((it, i) => {
        const ih = nsH(it);
        const last = i === b.items.length - 1;
        nsRender(it, x, cy, w, out, last ? h - (cy - y) : ih);
        cy += ih;
      });
      return h;
    }
    case 'op':
      out.push({ t: 'box', shape: 'ns', x, y, w, h, lines: nsLines(nsOpText(b)), line: b.line, align: 'left' });
      return h;
    case 'if': {
      const lines = nsLines(b.cond);
      const hh = nsRowH(lines) + 16;
      const wy = nsMinW(b.yes);
      const wn = b.no ? nsMinW(b.no) : 50;
      const split = x + w * (wy / (wy + wn));
      out.push({ t: 'box', shape: 'ns', x, y, w, h: hh, lines: [], line: b.line });
      out.push({ t: 'line', pts: [x, y, split, y + hh] });
      out.push({ t: 'line', pts: [x + w, y, split, y + hh] });
      lines.forEach((l, i) => out.push({ t: 'text', x: split, y: y + 15 + i * LH, text: l, anchor: 'middle' }));
      out.push({ t: 'text', x: x + 6, y: y + hh - 5, text: 'V', anchor: 'start', bold: true, muted: true });
      out.push({ t: 'text', x: x + w - 6, y: y + hh - 5, text: 'F', anchor: 'end', bold: true, muted: true });
      const bodyH = h - hh;
      nsRender(b.yes, x, y + hh, split - x, out, bodyH);
      if (b.no) nsRender(b.no, split, y + hh, x + w - split, out, bodyH);
      else out.push({ t: 'box', shape: 'ns', x: split, y: y + hh, w: x + w - split, h: bodyH, lines: ['∅'], line: 0, align: 'center' });
      return h;
    }
    case 'while':
    case 'for':
    case 'forof': {
      const lines = nsLines(nsHeaderText(b));
      const hh = nsRowH(lines);
      out.push({ t: 'box', shape: 'ns', x, y, w, h, lines: [], line: b.line });
      out.push({ t: 'box', shape: 'loop', x, y, w, h: hh, lines, line: b.line, align: 'left' });
      nsRender(b.body, x + NS_INDENT, y + hh, w - NS_INDENT, out, h - hh);
      return h;
    }
    case 'dowhile': {
      const lines = nsLines(nsHeaderText(b));
      const hh = nsRowH(lines);
      out.push({ t: 'box', shape: 'ns', x, y, w, h, lines: [], line: b.line });
      nsRender(b.body, x + NS_INDENT, y, w - NS_INDENT, out, h - hh);
      out.push({ t: 'box', shape: 'loop', x, y: y + h - hh, w, h: hh, lines, line: b.line, align: 'left' });
      return h;
    }
    case 'switch': {
      const lines = nsLines(b.expr);
      const hh = nsRowH(lines) + 18;
      out.push({ t: 'box', shape: 'ns', x, y, w, h: hh, lines: [], line: b.line });
      const mins = b.cases.map((c) => Math.max(nsMinW(c.body), c.label.length * CW + 16));
      const total = mins.reduce((s, m) => s + m, 0) || 1;
      let cx = x;
      const lastX = x + w - (mins[mins.length - 1] / total) * w;
      out.push({ t: 'line', pts: [x, y, lastX, y + hh] });
      out.push({ t: 'line', pts: [x + w, y, lastX, y + hh] });
      lines.forEach((l, i) => out.push({ t: 'text', x: lastX, y: y + 15 + i * LH, text: l, anchor: 'middle' }));
      b.cases.forEach((c, i) => {
        const cw = (mins[i] / total) * w;
        out.push({ t: 'text', x: cx + cw / 2, y: y + hh - 4, text: c.label.length > 16 ? c.label.slice(0, 15) + '…' : c.label, anchor: 'middle', bold: true, muted: true });
        nsRender(c.body, cx, y + hh, cw, out, h - hh);
        cx += cw;
      });
      return h;
    }
    case 'try': {
      let cy = y;
      const section = (title: string, body: FBlock) => {
        const bh = nsH(body);
        out.push({ t: 'box', shape: 'ns', x, y: cy, w, h: 24 + bh, lines: [], line: b.line });
        out.push({ t: 'text', x: x + 6, y: cy + 16, text: title, anchor: 'start', bold: true, muted: true });
        nsRender(body, x + NS_INDENT, cy + 24, w - NS_INDENT, out, bh);
        cy += 24 + bh;
      };
      section('try', b.body);
      if (b.handler) section(`catch${b.param ? ` (${b.param})` : ''}`, b.handler);
      if (b.finalizer) section('finally', b.finalizer);
      return h;
    }
  }
}

export function layoutNassi(d: FlowDiagram): FLayout {
  const M = 20;
  // Sin terminales de inicio/fin: se dibuja un título
  const items = d.body.k === 'seq' ? d.body.items.filter((b) => !(b.k === 'op' && b.shape === 'terminal')) : [d.body];
  const inner: FBlock = items.length === 1 && items[0].k === 'seq' ? items[0] : { k: 'seq', items };
  const title = d.body.k === 'seq' && d.body.items[0]?.k === 'op' ? (d.body.items[0] as any).text : d.name;
  const w = Math.max(240, nsMinW(inner), title.length * CW + 20);
  const h = nsH(inner);
  const els: FEl[] = [];
  els.push({ t: 'text', x: M, y: M + 12, text: d.kind === 'main' ? 'Programa principal' : title, anchor: 'start', bold: true });
  nsRender(inner, M, M + 22, w, els);
  return { w: w + 2 * M, h: h + 2 * M + 22, els };
}
