import type { ExportResult } from './common';
import { toColoquial } from './coloquial';
import { toCpp } from './cpp';
import { toPseudocode } from './pseudocode';
import { toPython } from './python';
import { toJava } from './java';
import { toCSharp } from './csharp';

export type { ExportResult } from './common';

export interface ExportTarget {
  id: string;
  name: string;
  extension: string;
  run(code: string, programName: string): ExportResult;
}

export const EXPORT_TARGETS: ExportTarget[] = [
  { id: 'pseint', name: 'Pseudocódigo (PSeInt)', extension: 'psc', run: (c, n) => toPseudocode(c, n) },
  { id: 'python', name: 'Python 3', extension: 'py', run: (c) => toPython(c) },
  { id: 'cpp', name: 'C++', extension: 'cpp', run: (c) => toCpp(c) },
  { id: 'java', name: 'Java', extension: 'java', run: (c, n) => toJava(c, n) },
  { id: 'csharp', name: 'C#', extension: 'cs', run: (c, n) => toCSharp(c, n) },
  { id: 'coloquial', name: 'Lenguaje coloquial', extension: 'txt', run: (c) => toColoquial(c) },
];

export function exportCode(targetId: string, code: string, programName = 'programa'): ExportResult {
  const t = EXPORT_TARGETS.find((x) => x.id === targetId);
  if (!t) throw new Error(`Destino desconocido: ${targetId}`);
  try {
    return t.run(code, programName);
  } catch (e: any) {
    return { code: '', warnings: [`No se pudo convertir: ${e?.message ?? e}`] };
  }
}
