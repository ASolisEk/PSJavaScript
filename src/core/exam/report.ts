/**
 * Cruce de preguntas y respuestas de una sala: qué pregunta le tocó a cada alumno,
 * qué respondió, cuál era la respuesta correcta y cómo se calificó. Se usa en la
 * vista del maestro, en el CSV de respuestas y en el reporte detallado (HTML).
 */
import { questionTypeInfo } from './config';
import { parseRichText, plainText } from './richText';
import { answeredCount, RoomState, StudentRecord } from './room';
import { summarizeRoom } from './summary';
import type { AnswerValue, PaperKey, Question, QuestionResult, QuestionStatus, TestResult } from './types';

export const STATUS_LABEL: Record<QuestionStatus, string> = { correct: 'Correcta', partial: 'Parcial', wrong: 'Incorrecta', blank: 'Sin responder' };

const empty = (a: AnswerValue | undefined) => a === undefined || a === null || (typeof a === 'string' && !a.trim()) || (Array.isArray(a) && !a.length);

/** Líneas que acomodó el alumno en una pregunta de ordenar (en su orden). */
export function orderedLines(q: Extract<Question, { type: 'order' }>, a: AnswerValue | undefined, key: PaperKey | null): string[] {
  const ids = key?.lineIds[q.id] ?? [];
  return (Array.isArray(a) ? a : []).map((id) => q.lines[ids.indexOf(id)] ?? '?');
}

/** Respuesta del alumno en texto ('' si no respondió). */
export function answerText(q: Question, a: AnswerValue | undefined, key: PaperKey | null): string {
  if (empty(a)) return '';
  switch (q.type) {
    case 'single':
      return plainText(q.options.find((o) => o.id === a)?.text ?? String(a));
    case 'multiple':
      return (Array.isArray(a) ? a : [String(a)]).map((id) => plainText(q.options.find((o) => o.id === id)?.text ?? id)).join(' | ');
    case 'truefalse':
      return a === true || a === 'true' ? 'Verdadero' : 'Falso';
    case 'order':
      return orderedLines(q, a, key).join('\n');
    default:
      return String(a);
  }
}

/**
 * Respuesta correcta en texto. En «¿Qué imprime?» es la salida real del programa (viene
 * en el resultado); en programación, la solución de referencia del maestro.
 */
export function correctText(q: Question, r?: QuestionResult): string {
  switch (q.type) {
    case 'single':
    case 'multiple':
      return q.options.filter((o) => o.correct && o.text.trim()).map((o) => plainText(o.text)).join(' | ');
    case 'truefalse':
      return q.answer ? 'Verdadero' : 'Falso';
    case 'short':
      return q.answers.filter((x) => x.trim()).join(' / ');
    case 'numeric':
      return `${q.answer}${q.tolerance ? ` ± ${q.tolerance}` : ''}`;
    case 'output':
      return r?.tests?.[0]?.expected ?? '';
    case 'code':
      return q.solution;
    case 'order':
      return q.lines.join('\n');
  }
}

/** Enunciado completo en texto, con el código de apoyo si lo hay. */
export function questionText(q: Question): string {
  return [plainText(q.prompt).trim(), (q.code ?? '').trim()].filter(Boolean).join('\n\n');
}

/** Resumen de los casos de prueba y requisitos (programación). */
export function testsSummary(r?: QuestionResult): string {
  if (!r?.tests?.length && !r?.rules?.length) return '';
  const parts: string[] = [];
  if (r.tests?.length) parts.push(`Casos: ${r.tests.filter((x) => x.passed).length}/${r.tests.length}`);
  if (r.rules?.length) parts.push(`Requisitos: ${r.rules.filter((x) => x.passed).length}/${r.rules.length}`);
  const failed = [...(r.tests ?? []).filter((x) => !x.passed).map((x) => `✗ ${x.name}${x.error ? `: ${x.error}` : ''}`), ...(r.rules ?? []).filter((x) => !x.passed).map((x) => `✗ ${x.message}`)];
  return [parts.join(' · '), ...failed].join('\n');
}

export interface AnswerRow {
  studentId: string;
  name: string;
  group: string;
  /** Posición de la pregunta en el examen del alumno (1, 2, …). */
  position: number;
  question: Question;
  answer: string;
  correct: string;
  result?: QuestionResult;
  /** Etiqueta del resultado (o «Sin calificar» si aún no entrega). */
  status: string;
}

/** Una fila por alumno y pregunta que le tocó, en el orden en que la vio. */
export function answerRows(room: RoomState, students?: StudentRecord[]): AnswerRow[] {
  const byId = new Map(room.exam.questions.map((q) => [q.id, q]));
  const list = students ?? Object.values(room.students).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const rows: AnswerRow[] = [];
  for (const s of list) {
    (s.key?.questionIds ?? []).forEach((id, i) => {
      const q = byId.get(id);
      if (!q) return;
      const result = s.result?.questions.find((x) => x.questionId === id);
      const a = s.answers[id];
      rows.push({
        studentId: s.id,
        name: s.name,
        group: s.group,
        position: i + 1,
        question: q,
        answer: answerText(q, a, s.key),
        correct: correctText(q, result),
        result,
        status: result ? STATUS_LABEL[result.status] : empty(a) ? 'Sin responder' : 'Sin calificar',
      });
    });
  }
  return rows;
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV de respuestas: una fila por alumno × pregunta (se abre en Excel / Hojas de cálculo). */
export function answersCsv(room: RoomState): string {
  const header = ['Alumno', 'Grupo', 'Núm.', 'Tema', 'Tipo', 'Pregunta', 'Respuesta del alumno', 'Respuesta correcta', 'Puntos', 'Máximo', 'Resultado', 'Casos y requisitos', 'Retroalimentación'];
  const lines = [header.map(csvCell).join(',')];
  for (const r of answerRows(room)) {
    lines.push(
      [
        r.name,
        r.group,
        r.position,
        r.question.topic ?? '',
        questionTypeInfo(r.question.type).label,
        questionText(r.question),
        r.answer,
        r.correct,
        r.result ? r.result.score : '',
        r.result ? r.result.max : r.question.points,
        r.status,
        testsSummary(r.result),
        r.result ? plainText(r.result.feedback) : '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return '﻿' + lines.join('\r\n');
}

/** Nombre del respaldo de una sala («respaldo-ABC123-parcial-2-2026-11-08.json»). */
export function backupFileName(r: RoomState): string {
  const title = r.exam.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `respaldo-${r.code}-${title || 'examen'}-${new Date(r.openedAt).toISOString().slice(0, 10)}.json`;
}

// ───────────────────────────── reporte en texto (TXT) ─────────────────────────────

const RULE = '═'.repeat(72);
const THIN = '─'.repeat(72);
/** Sangría para bloques de varias líneas. */
const indent = (text: string, pad = '    ') =>
  text
    .replace(/\s+$/, '')
    .split('\n')
    .map((l) => (l.trim() ? pad + l : ''))
    .join('\n');

/** Enunciado en texto: párrafos tal cual y bloques de código con sangría. */
function promptTxt(src: string): string {
  return parseRichText(src)
    .map((b) => (b.kind === 'code' ? indent(b.code, '      ') : '  ' + b.parts.map((p) => (p.kind === 'code' ? `\`${p.text}\`` : p.text)).join('')))
    .join('\n');
}

/** Opciones con lo que eligió el alumno ([x]) y las correctas (✓). */
function optionsTxt(q: Extract<Question, { type: 'single' | 'multiple' }>, a: AnswerValue | undefined): string {
  const chosen = new Set(Array.isArray(a) ? a : a ? [String(a)] : []);
  return q.options
    .filter((o) => o.text.trim())
    .map((o, i) => {
      const mine = chosen.has(o.id);
      const tags = [o.correct ? 'correcta' : '', mine ? 'eligió' : ''].filter(Boolean).join(', ');
      return `    ${mine ? '[x]' : '[ ]'} ${String.fromCharCode(97 + i)}) ${plainText(o.text)}${o.correct ? '  ✓' : ''}${tags ? `  (${tags})` : ''}`;
    })
    .join('\n');
}

function testsTxt(r?: QuestionResult): string {
  const out: string[] = [];
  for (const x of r?.tests ?? []) {
    out.push(`    ${x.passed ? '✓' : '✗'} ${x.name}${x.hidden ? ' (oculto)' : ''}`);
    const data = (x.inputs ?? []).join(', ') || x.call || '';
    if (data) out.push(`        Datos: ${data}`);
    if (!x.passed) {
      if (x.expected !== undefined) out.push(`        Esperado: ${x.expected.replace(/\n/g, ' ⏎ ')}`);
      out.push(`        Obtuvo:   ${(x.error ?? x.actual ?? '').replace(/\n/g, ' ⏎ ') || '(sin salida)'}`);
    }
  }
  for (const x of r?.rules ?? []) out.push(`    ${x.passed ? '✓' : '✗'} Requisito: ${x.message}`);
  return out.join('\n');
}

function questionTxt(row: AnswerRow, s: StudentRecord): string {
  const q = row.question;
  const res = row.result;
  const points = res ? `${res.score}/${res.max} pts${res.manual ? ' (ajustada por el maestro)' : ''}` : `${q.points} pts`;
  const lines = [`PREGUNTA ${row.position} · ${questionTypeInfo(q.type).label}${q.topic ? ` · Tema: ${q.topic}` : ''} · ${points} · ${row.status.toUpperCase()}`, '', promptTxt(q.prompt)];
  if (q.code?.trim()) lines.push('', '  Código:', indent(q.code, '      '));
  if (q.type === 'output' && q.inputs.length) lines.push('', `  Datos para prompt(): ${q.inputs.join(', ')}`);
  lines.push('');
  if (q.type === 'single' || q.type === 'multiple') {
    lines.push('  Opciones ([x] = eligió el alumno, ✓ = correcta):', optionsTxt(q, s.answers[q.id]));
    if (!row.answer) lines.push('  (El alumno no eligió ninguna opción)');
  } else if (q.type === 'order') {
    const mine = orderedLines(q, s.answers[q.id], s.key);
    lines.push('  Orden del alumno:', mine.length ? mine.map((l, i) => `    ${i + 1}. ${l}`).join('\n') : '    (sin responder)');
    lines.push('', '  Orden correcto:', q.lines.map((l, i) => `    ${i + 1}. ${l}`).join('\n'));
  } else if (q.type === 'code') {
    const untouched = !row.answer.trim() || row.answer.trim() === q.starter.trim();
    lines.push(`  Código del alumno${untouched && row.answer.trim() ? ' (sin cambios: es el código inicial)' : ''}:`, row.answer.trim() ? indent(row.answer, '      ') : '    (sin responder)');
    const tests = testsTxt(res);
    if (tests) lines.push('', `  Casos de prueba y requisitos${testsSummary(res) ? ` (${testsSummary(res).split('\n')[0]})` : ''}:`, tests);
    lines.push('', '  Solución de referencia:', indent(q.solution, '      '));
  } else {
    const block = (text: string) => (text.includes('\n') || q.type === 'output' ? indent(text, '      ') : `    ${text}`);
    lines.push('  Respuesta del alumno:', row.answer ? block(row.answer) : '    (sin responder)');
    lines.push('  Respuesta correcta:', row.correct ? block(row.correct) : '    —');
  }
  const feedback = res ? plainText(res.feedback).trim() : '';
  if (feedback) lines.push('', feedback.includes('\n') ? `  Retroalimentación:\n${indent(feedback)}` : `  Retroalimentación: ${feedback}`);
  return lines.join('\n');
}

function studentTxt(room: RoomState, s: StudentRecord, rows: AnswerRow[], n: number, total: number): string {
  const r = s.result;
  const facts = [
    `Calificación: ${r ? `${r.grade}/${r.scale} (${r.percent} %) · ${r.passed ? 'APROBADO' : 'NO APROBADO'}` : 'Sin calificar (no ha entregado)'}`,
    `Puntos: ${r ? `${r.score}/${r.max}` : '—'} · Respondidas: ${answeredCount(s, room)}/${rows.length}`,
    `Comenzó: ${s.startedAt ? fmtTime(s.startedAt) : '—'} · Entregó: ${s.submittedAt ? fmtTime(s.submittedAt) : '—'} · Tardó: ${s.startedAt && s.submittedAt ? fmtMin(s.submittedAt - s.startedAt) : '—'}`,
    `Salidas de la ventana: ${s.focusLost ? `${s.focusLost} (${fmtMin(s.awayMs)} fuera)` : 0} · Intentos de pegar: ${s.pasteBlocked} · Incidentes de bloqueo: ${s.lockdown ?? 0}`,
    `Ejecuciones: ${s.runs} · Pruebas con ejemplos: ${s.tests}`,
  ];
  const head = [RULE, `ALUMNO ${n} DE ${total}: ${s.name}${s.group ? ` · Grupo ${s.group}` : ''}`, ...facts, RULE].join('\n');
  const body = rows.length ? rows.map((x) => questionTxt(x, s)).join(`\n\n${THIN}\n\n`) : '(Aún no comienza el examen: no tiene preguntas asignadas.)';
  return `${head}\n\n${body}`;
}

/**
 * Preguntas y respuestas en texto plano (se abre en cualquier editor o el Bloc de notas):
 * datos de la sala, resumen por alumno y, de cada alumno, cada pregunta que le tocó con el
 * enunciado, su respuesta, la respuesta correcta, los puntos y los casos de prueba.
 */
export function answersTxt(room: RoomState, studentIds?: string[]): string {
  const sum = summarizeRoom(room);
  const students = Object.values(room.students)
    .filter((s) => !studentIds || studentIds.includes(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const rows = answerRows(room, students);
  const date = new Date(room.openedAt);
  const header = [
    RULE,
    `EXAMEN: ${room.exam.title}`,
    `Sala ${room.code} · ${date.toLocaleDateString('es-MX')} ${fmtTime(room.openedAt)} · escala ${room.exam.scale}, aprueba con ${room.exam.passPercent} %`,
    `Alumnos: ${sum.students} (${sum.submitted} entregaron) · Promedio: ${sum.average === null ? '—' : `${sum.average}/${sum.scale}`} · Aprobados: ${sum.passRate === null ? '—' : `${sum.passRate} %`} · Tiempo promedio: ${sum.avgMinutes === null ? '—' : `${sum.avgMinutes} min`}`,
    room.status !== 'closed' ? 'AVISO: el examen seguía en curso al exportar; los resultados son provisionales.' : '',
    `Exportado: ${new Date().toLocaleString('es-MX')}`,
    RULE,
  ].filter(Boolean);
  const pad = (v: unknown, w: number) => {
    const s = String(v ?? '—');
    return s.length >= w ? s.slice(0, w - 1) + '…' : s + ' '.repeat(w - s.length);
  };
  const summary = students.length
    ? [
        'RESUMEN',
        `  ${pad('#', 4)}${pad('Alumno', 30)}${pad('Grupo', 10)}${pad('Calif.', 9)}${pad('%', 6)}${pad('Respondidas', 13)}Tiempo`,
        ...sum.rows
          .filter((x) => students.some((s) => s.id === x.id))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
          .map((x, i) => `  ${pad(i + 1, 4)}${pad(x.name, 30)}${pad(x.group || '—', 10)}${pad(x.grade ?? '—', 9)}${pad(x.percent ?? '—', 6)}${pad(`${x.answered}/${x.questions}`, 13)}${x.minutes === null ? '—' : `${x.minutes} min`}`),
      ].join('\n')
    : 'Aún no hay alumnos en esta sala.';
  const body = students.map((s, i) => studentTxt(room, s, rows.filter((x) => x.studentId === s.id), i + 1, students.length));
  // BOM y saltos de línea de Windows: se ven bien también en el Bloc de notas
  return '﻿' + [header.join('\n'), summary, ...body].join('\n\n\n').replace(/\n/g, '\r\n') + '\r\n';
}

/**
 * Calificaciones para subir a otra plataforma (Moodle, Classroom, hoja de la escuela): una fila
 * por alumno con su identificador (grupo o matrícula), calificación y porcentaje. Pensado para
 * «Importar calificaciones» de Moodle (se empareja por la columna de matrícula o nombre).
 */
export function gradesCsv(room: RoomState): string {
  const sum = summarizeRoom(room);
  const header = ['Nombre', 'Matrícula o grupo', 'Calificación', `Escala`, 'Porcentaje', 'Puntos', 'Entregó'];
  const rows = [...sum.rows]
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((r) => [r.name, r.group, r.grade ?? '', sum.scale, r.percent ?? '', r.score === null ? '' : `${r.score}/${r.max}`, r.submitted ? 'Sí' : 'No']);
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

// ───────────────────────────── reporte HTML ─────────────────────────────

const esc =(s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Enunciado con formato (`código`, **negritas**, bloques ```) en HTML. */
function richHtml(src: string): string {
  return parseRichText(src)
    .map((b) =>
      b.kind === 'code'
        ? `<pre class="code">${esc(b.code)}</pre>`
        : `<p>${b.parts.map((p) => (p.kind === 'code' ? `<code>${esc(p.text)}</code>` : p.kind === 'bold' ? `<b>${esc(p.text)}</b>` : esc(p.text))).join('')}</p>`,
    )
    .join('');
}

const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtMin = (ms: number) => {
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return m ? `${m} min ${s} s` : `${s} s`;
};

function testsHtml(tests: TestResult[]): string {
  const rows = tests
    .map(
      (x) =>
        `<tr class="${x.passed ? 'ok' : 'bad'}"><td>${x.passed ? '✓' : '✗'} ${esc(x.name)}${x.hidden ? ' <span class="muted">(oculto)</span>' : ''}</td><td><pre>${esc((x.inputs ?? []).join('\n') || (x.call ?? ''))}</pre></td><td><pre>${esc(x.expected ?? '')}</pre></td><td><pre>${esc(x.error ? x.error : x.actual ?? '')}</pre></td></tr>`,
    )
    .join('');
  return `<table class="tests"><thead><tr><th>Caso</th><th>Datos</th><th>Esperado</th><th>Obtuvo</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function optionsHtml(q: Extract<Question, { type: 'single' | 'multiple' }>, a: AnswerValue | undefined): string {
  const chosen = new Set(Array.isArray(a) ? a : a ? [String(a)] : []);
  return `<ul class="opts">${q.options
    .filter((o) => o.text.trim())
    .map((o) => {
      const mine = chosen.has(o.id);
      const cls = o.correct ? 'right' : mine ? 'wrong' : '';
      return `<li class="${cls}">${mine ? '◉' : '○'} ${esc(plainText(o.text))}${o.correct ? ' <span class="tag">correcta</span>' : ''}${mine ? ' <span class="tag mine">eligió</span>' : ''}</li>`;
    })
    .join('')}</ul>`;
}

function questionHtml(r: AnswerRow, s: StudentRecord): string {
  const q = r.question;
  const res = r.result;
  const cls = res ? res.status : r.status === 'Sin responder' ? 'blank' : 'pending';
  const head = `<div class="qhead"><b>P${r.position}</b> · ${esc(questionTypeInfo(q.type).label)}${q.topic ? ` · ${esc(q.topic)}` : ''}<span class="score">${res ? `${res.score}/${res.max}${res.manual ? ' (ajustada)' : ''}` : `${q.points} pts`} · ${esc(r.status)}</span></div>`;
  const code = q.type === 'output' || q.code ? `<pre class="code">${esc((q.code ?? '').replace(/\s+$/, ''))}</pre>` : '';
  const inputs = q.type === 'output' && q.inputs.length ? `<p class="muted">Datos para prompt(): ${esc(q.inputs.join(', '))}</p>` : '';
  let body = '';
  if (q.type === 'single' || q.type === 'multiple') body = optionsHtml(q, s.answers[q.id]);
  else if (q.type === 'code') {
    body =
      `<div class="label">Código del alumno</div><pre class="code">${esc(r.answer || '(sin responder)')}</pre>` +
      (res?.tests?.length ? testsHtml(res.tests) : '') +
      (res?.rules?.length ? `<ul class="rules">${res.rules.map((x) => `<li class="${x.passed ? 'right' : 'wrong'}">${x.passed ? '✓' : '✗'} ${esc(x.message)}</li>`).join('')}</ul>` : '') +
      `<details><summary>Código inicial y solución de referencia</summary><div class="label">Código inicial</div><pre class="code">${esc(q.starter)}</pre><div class="label">Solución de referencia</div><pre class="code">${esc(q.solution)}</pre></details>`;
  } else {
    const mono = q.type === 'output' || q.type === 'order';
    body =
      `<div class="pair"><div><div class="label">Respuesta del alumno</div>${mono ? `<pre>${esc(r.answer || '(sin responder)')}</pre>` : `<p>${esc(r.answer || '(sin responder)')}</p>`}</div>` +
      `<div><div class="label">Respuesta correcta</div>${mono ? `<pre>${esc(r.correct)}</pre>` : `<p>${esc(r.correct)}</p>`}</div></div>`;
  }
  return `<section class="q ${cls}">${head}<div class="prompt">${richHtml(q.prompt)}</div>${code}${inputs}${body}</section>`;
}

function studentHtml(room: RoomState, s: StudentRecord, rows: AnswerRow[]): string {
  const r = s.result;
  const facts = [
    ['Calificación', r ? `${r.grade}/${r.scale} (${r.percent} %)` : 'Sin calificar'],
    ['Puntos', r ? `${r.score}/${r.max}` : '—'],
    ['Comenzó', s.startedAt ? fmtTime(s.startedAt) : '—'],
    ['Tardó', s.startedAt && s.submittedAt ? fmtMin(s.submittedAt - s.startedAt) : '—'],
    ['Respondidas', `${rows.filter((x) => x.answer).length}/${rows.length}`],
    ['Ejecuciones', String(s.runs)],
    ['Pruebas con ejemplos', String(s.tests)],
    ['Salidas de la ventana', s.focusLost ? `${s.focusLost} (${fmtMin(s.awayMs)} fuera)` : '0'],
    ['Intentos de pegar', String(s.pasteBlocked)],
    ['Incidentes de bloqueo', String(s.lockdown ?? 0)],
  ];
  const events = s.events.length
    ? `<details><summary>Actividad (${s.events.length} eventos)</summary><table class="log">${s.events.map((e) => `<tr><td>${fmtTime(e.at)}</td><td>${esc(e.text)}</td></tr>`).join('')}</table></details>`
    : '';
  return `<article class="student"><h2>${esc(s.name)}${s.group ? ` <span class="muted">· ${esc(s.group)}</span>` : ''}${r ? ` <span class="badge ${r.passed ? 'pass' : 'fail'}">${r.passed ? 'Aprobado' : 'No aprobado'}</span>` : ''}</h2><div class="facts">${facts
    .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
    .join('')}</div>${events}${rows.map((x) => questionHtml(x, s)).join('')}</article>`;
}

const CSS = `
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2933;margin:0;padding:24px;background:#f6f7f9;line-height:1.45}
h1{margin:0 0 4px}h2{margin:0 0 10px;font-size:20px}.muted{color:#6b7785;font-weight:400}
.top,.student{background:#fff;border:2px solid #e3e7eb;border-radius:14px;padding:18px;margin:0 auto 18px;max-width:1000px}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.stats div,.facts div{background:#f6f7f9;border-radius:10px;padding:8px 12px}
.stats span,.facts span{display:block;font-size:11px;color:#6b7785;text-transform:uppercase;font-weight:700}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #e3e7eb;padding:6px 8px;text-align:left;vertical-align:top}th{color:#6b7785;font-size:11px;text-transform:uppercase}
.summary a{color:#1c7ed6;text-decoration:none;font-weight:700}
.q{border:2px solid #e3e7eb;border-left-width:6px;border-radius:12px;padding:12px;margin:10px 0;break-inside:avoid}
.q.correct{border-left-color:#58cc02}.q.partial{border-left-color:#f59f00}.q.wrong{border-left-color:#e03131}.q.blank,.q.pending{border-left-color:#adb5bd}
.qhead{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px}.score{margin-left:auto;font-weight:800}
.prompt p{margin:4px 0}code{background:#f1f3f5;border-radius:4px;padding:0 4px;font-family:ui-monospace,Menlo,Consolas,monospace}
pre{white-space:pre-wrap;word-break:break-word;margin:4px 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}
pre.code{background:#f1f3f5;border-radius:8px;padding:8px 10px}
.label{font-size:11px;font-weight:800;color:#6b7785;text-transform:uppercase;margin-top:8px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pair pre,.pair p{background:#f6f7f9;border-radius:8px;padding:6px 10px;margin:4px 0}
.opts,.rules{list-style:none;padding:0;margin:6px 0}.opts li,.rules li{padding:3px 8px;border-radius:6px;margin:2px 0}
.right{background:#e6f9d8}.wrong{background:#ffe3e3}.tag{font-size:11px;font-weight:800;color:#2b8a3e}.tag.mine{color:#1c7ed6}
.tests tr.ok td:first-child{color:#2b8a3e}.tests tr.bad td:first-child{color:#c92a2a}.tests pre{margin:0}
.badge{font-size:12px;border-radius:999px;padding:2px 10px;vertical-align:middle}.pass{background:#e6f9d8;color:#2b8a3e}.fail{background:#ffe3e3;color:#c92a2a}
details{margin:8px 0}summary{cursor:pointer;color:#1c7ed6;font-weight:700}.log td:first-child{white-space:nowrap;color:#6b7785;width:90px}
@media print{body{background:#fff;padding:0}.top,.student{border:none;padding:0}.student{break-before:page}details{display:block}details>summary{display:none}details>*{display:block}}
@media (max-width:640px){.pair{grid-template-columns:1fr}body{padding:10px}}
`;

/**
 * Reporte detallado e imprimible: concentrado y, por alumno, cada pregunta que le tocó con
 * su respuesta, la respuesta correcta, los casos de prueba y su actividad.
 */
export function roomReportHtml(room: RoomState, studentIds?: string[]): string {
  const sum = summarizeRoom(room);
  const students = Object.values(room.students)
    .filter((s) => !studentIds || studentIds.includes(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const rows = answerRows(room, students);
  const date = new Date(room.openedAt);
  const stats = [
    ['Alumnos', `${sum.students} (${sum.submitted} entregaron)`],
    ['Promedio', sum.average === null ? '—' : `${sum.average}/${sum.scale}`],
    ['Aprobados', sum.passRate === null ? '—' : `${sum.passRate} %`],
    ['Tiempo promedio', sum.avgMinutes === null ? '—' : `${sum.avgMinutes} min`],
  ];
  const table = students.length > 1 || !studentIds
    ? `<table class="summary"><thead><tr><th>Alumno</th><th>Grupo</th><th>Calif.</th><th>%</th><th>Respondidas</th><th>Tiempo</th><th>Salidas</th><th>Ejecuciones</th></tr></thead><tbody>${sum.rows
        .filter((x) => students.some((s) => s.id === x.id))
        .map(
          (x) =>
            `<tr><td><a href="#a-${esc(x.id)}">${esc(x.name)}</a></td><td>${esc(x.group || '—')}</td><td><b>${x.grade ?? '—'}</b></td><td>${x.percent ?? '—'}</td><td>${x.answered}/${x.questions}</td><td>${x.minutes === null ? '—' : `${x.minutes} min`}</td><td>${x.focusLost}</td><td>${x.runs}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '';
  const body = students.map((s) => `<div id="a-${esc(s.id)}">${studentHtml(room, s, rows.filter((x) => x.studentId === s.id))}</div>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(room.exam.title)} · reporte</title><style>${CSS}</style></head><body>
<div class="top"><h1>${esc(room.exam.title)}</h1><div class="muted">Sala ${esc(room.code)} · ${esc(date.toLocaleDateString('es-MX'))} ${esc(fmtTime(room.openedAt))} · escala ${room.exam.scale}, aprueba con ${room.exam.passPercent} %</div>
<div class="stats">${stats.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>${table}</div>
${body}
</body></html>`;
}
