/**
 * Versión imprimible de un examen (para aplicarlo en papel): hoja de preguntas con espacio
 * para responder, hoja de respuestas para opción múltiple y, opcionalmente, la clave.
 * Cada versión es un `buildPaper` con su propia semilla (preguntas y opciones mezcladas).
 */
import { questionTypeInfo } from './config';
import { buildPaper } from './paper';
import { correctText, esc, richHtml } from './report';
import type { ExamConfig, PaperQuestion } from './types';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface PrintOptions {
  /** Cuántas versiones distintas (A, B, C…). */
  versions: number;
  /** Agrega la clave de respuestas al final de cada versión. */
  withKey: boolean;
}

const CSS = `
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111;margin:0;padding:24px;line-height:1.4;font-size:14px}
.page{max-width:820px;margin:0 auto}.version{break-after:page}.version:last-child{break-after:auto}
header{border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:12px}h1{font-size:20px;margin:0}
.fields{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin:10px 0}.fields div{border-bottom:1px solid #111;padding-top:18px;font-size:11px;color:#555}
.desc{color:#333;margin:6px 0}.q{margin:14px 0;break-inside:avoid}.qhead{font-weight:800}.pts{font-weight:400;color:#555;font-size:12px}
.prompt p{margin:4px 0}code{font-family:ui-monospace,Menlo,Consolas,monospace;background:#f1f1f1;padding:0 3px;border-radius:3px}
pre{white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;margin:6px 0}pre.code{background:#f4f4f4;border:1px solid #ddd;border-radius:6px;padding:8px}
img{max-width:100%;max-height:320px;display:block;margin:6px 0}
ol.opts{list-style:none;padding-left:4px;margin:6px 0}ol.opts li{margin:3px 0}.box{display:inline-block;width:14px;height:14px;border:1.5px solid #111;border-radius:50%;margin-right:8px;vertical-align:-2px}
.lines div{border-bottom:1px solid #999;height:26px}.code-lines div{border-bottom:1px dashed #bbb;height:22px}
.sheet table,.key table{border-collapse:collapse;width:100%;font-size:13px}.sheet td,.sheet th,.key td,.key th{border:1px solid #999;padding:4px 6px;text-align:left;vertical-align:top}
.key{break-before:page}.key pre{margin:0}.muted{color:#666}
@media print{body{padding:0}}
`;

function answerSpace(q: PaperQuestion): string {
  switch (q.type) {
    case 'single':
    case 'multiple':
      return `<ol class="opts">${(q.options ?? []).map((o, i) => `<li><span class="box"></span><b>${LETTERS[i]})</b> ${richHtml(o.text).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ol>${q.type === 'multiple' ? '<div class="muted">Marca todas las correctas.</div>' : ''}`;
    case 'truefalse':
      return '<ol class="opts"><li><span class="box"></span>Verdadero</li><li><span class="box"></span>Falso</li></ol>';
    case 'short':
    case 'numeric':
      return '<div class="lines"><div></div></div>';
    case 'output':
      return `${q.inputs?.length ? `<div class="muted">Datos de entrada: ${esc(q.inputs.join(', '))}</div>` : ''}<div class="muted">Escribe lo que se muestra en la consola:</div><div class="code-lines">${'<div></div>'.repeat(5)}</div>`;
    case 'code':
      return `${q.starter?.trim() ? `<pre class="code">${esc(q.starter)}</pre>` : ''}${(q.tests ?? []).map((t) => `<div class="muted">Ejemplo «${esc(t.name)}»: ${t.inputs.length ? `entrada ${esc(t.inputs.join(', '))} → ` : ''}${t.call ? `${esc(t.call)} → ` : ''}<code>${esc(t.expected)}</code></div>`).join('')}<div class="code-lines">${'<div></div>'.repeat(14)}</div>`;
    case 'order':
      return `<div class="muted">Numera las líneas en el orden correcto:</div><table class="sheet" style="width:100%"><tbody>${(q.lines ?? []).map((l) => `<tr><td style="width:40px"></td><td><pre>${esc(l.text)}</pre></td></tr>`).join('')}</tbody></table>`;
    case 'essay':
      return `<div class="lines">${'<div></div>'.repeat(8)}</div>`;
  }
}

/** HTML listo para imprimir o guardar como PDF. */
export function printableExamHtml(exam: ExamConfig, opts: PrintOptions): string {
  const n = Math.max(1, Math.min(6, Math.round(opts.versions)));
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const versions = Array.from({ length: n }, (_, v) => {
    const label = n > 1 ? `Versión ${LETTERS[v]}` : '';
    const { paper, key } = buildPaper(exam, `impreso-${v}`);
    const qs = paper.questions;
    const choice = qs.map((q, i) => ({ q, i })).filter(({ q }) => q.type === 'single' || q.type === 'multiple' || q.type === 'truefalse');
    const body = qs
      .map(
        (q, i) => `<div class="q"><div class="qhead">${i + 1}. <span class="pts">(${q.points} ${q.points === 1 ? 'punto' : 'puntos'} · ${esc(questionTypeInfo(q.type).label)})</span></div>
<div class="prompt">${richHtml(q.prompt)}</div>${q.image ? `<img src="${esc(q.image)}" alt="">` : ''}${q.code && q.type !== 'code' ? `<pre class="code">${esc(q.code)}</pre>` : ''}${answerSpace(q)}</div>`,
      )
      .join('');
    const sheet = choice.length
      ? `<div class="sheet"><h3>Hoja de respuestas</h3><table><thead><tr><th>Pregunta</th><th>Respuesta</th></tr></thead><tbody>${choice.map(({ q, i }) => `<tr><td>${i + 1}</td><td>${q.type === 'truefalse' ? 'V &nbsp; F' : (q.options ?? []).map((_, k) => LETTERS[k]).join(' &nbsp; ')}</td></tr>`).join('')}</tbody></table></div>`
      : '';
    const answerKey = opts.withKey
      ? `<div class="key"><h2>Clave de respuestas${label ? ` · ${label}` : ''}</h2><table><thead><tr><th>#</th><th>Respuesta</th></tr></thead><tbody>${qs
          .map((pq, i) => {
            const q = byId.get(pq.id)!;
            let ans = correctText(q);
            if (q.type === 'single' || q.type === 'multiple') {
              const letters = (pq.options ?? []).map((o, k) => (q.options.find((x) => x.id === o.id)?.correct ? LETTERS[k] : '')).filter(Boolean);
              ans = `${letters.join(', ')} — ${ans}`;
            }
            if (q.type === 'order') ans = (key.lineIds[q.id] ?? []).map((id) => (pq.lines ?? []).findIndex((l) => l.id === id) + 1).join(' → ') + `\n${ans}`;
            if (q.type === 'output') ans = '(ejecuta el programa para ver la salida)';
            return `<tr><td>${i + 1}</td><td><pre>${esc(ans)}</pre>${q.explanation ? `<div class="muted">${esc(q.explanation)}</div>` : ''}</td></tr>`;
          })
          .join('')}</tbody></table></div>`
      : '';
    return `<section class="version"><header><h1>${esc(exam.title)}${label ? ` <span class="pts">· ${label}</span>` : ''}</h1>${exam.author ? `<div class="muted">${esc(exam.author)}</div>` : ''}
<div class="fields"><div>Nombre</div><div>Grupo</div><div>Fecha</div></div>${exam.description ? `<div class="desc">${richHtml(exam.description)}</div>` : ''}
<div class="muted">${qs.length} preguntas · ${paper.totalPoints} puntos${exam.durationMin ? ` · ${exam.durationMin} minutos` : ''}</div></header>${body}${sheet}${answerKey}</section>`;
  });
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(exam.title)} (impreso)</title><style>${CSS}</style></head><body><div class="page">${versions.join('')}</div></body></html>`;
}
