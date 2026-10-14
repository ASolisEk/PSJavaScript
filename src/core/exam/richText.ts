/**
 * Formato mínimo para enunciados y opciones (un subconjunto de Markdown):
 * bloques ```código```, `código en línea`, **negritas** y <kbd>teclas</kbd>.
 * Así se muestran igual que en freeCodeCamp y el maestro puede usarlo al escribir.
 */

export type InlinePart = { kind: 'text' | 'code' | 'bold'; text: string };
export type RichBlock = { kind: 'code'; code: string } | { kind: 'text'; parts: InlinePart[] };

/** Divide el texto en párrafos y bloques de código. */
export function parseRichText(src: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  const re = /^[ \t]*```[^\n]*\n([\s\S]*?)\n?[ \t]*```[ \t]*$/gm;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushText = (s: string) => {
    for (const para of s.split(/\n{2,}/)) {
      const text = para.replace(/^\n+|\n+$/g, '');
      if (text.trim()) blocks.push({ kind: 'text', parts: parseInline(text) });
    }
  };
  while ((m = re.exec(src))) {
    pushText(src.slice(last, m.index));
    blocks.push({ kind: 'code', code: dedent(m[1]) });
    last = m.index + m[0].length;
  }
  pushText(src.slice(last));
  return blocks;
}

/** Código en línea (`x` o `` x ``), negritas y <kbd>. */
export function parseInline(src: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /(`+)([\s\S]*?[^`])\1(?!`)|\*\*([^*]+)\*\*|<kbd>([\s\S]*?)<\/kbd>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const text = (s: string) => {
    if (!s) return;
    const prev = parts[parts.length - 1];
    if (prev?.kind === 'text') prev.text += s;
    else parts.push({ kind: 'text', text: s });
  };
  while ((m = re.exec(src))) {
    text(src.slice(last, m.index));
    if (m[1]) {
      // `` `x` `` → `x` (se quita un espacio a cada lado, como en Markdown)
      const code = m[2].length > 1 && m[2].startsWith(' ') && m[2].endsWith(' ') ? m[2].slice(1, -1) : m[2];
      parts.push({ kind: 'code', text: code });
    } else if (m[3] !== undefined) parts.push({ kind: 'bold', text: m[3] });
    else parts.push({ kind: 'code', text: m[4] });
    last = m.index + m[0].length;
  }
  text(src.slice(last));
  return parts;
}

/** Texto plano (para listas y vistas de una línea). */
export function plainText(src: string): string {
  return parseRichText(src)
    .map((b) => (b.kind === 'code' ? b.code : b.parts.map((p) => p.text).join('')))
    .join('\n');
}

function dedent(code: string): string {
  const lines = code.split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length));
  return Number.isFinite(indent) && indent > 0 ? lines.map((l) => l.slice(indent)).join('\n') : code;
}
