/** Atajos de teclado que el examen bloqueado impide (ver components/exam/lockdown.ts). */

/** Atajo bloqueado → descripción para el maestro (o null si se permite). */
export function blockedShortcut(e: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): string | null {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const mod = e.ctrlKey || e.metaKey;
  if (key === 'F12') return 'Intentó abrir las herramientas de desarrollo (F12)';
  if (mod && e.shiftKey && ['i', 'j', 'c', 'k', 'e', 'm'].includes(key)) return 'Intentó abrir las herramientas de desarrollo';
  if (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(key)) return 'Intentó abrir las herramientas de desarrollo';
  if (mod && e.shiftKey && key === 's') return 'Intentó tomar una captura de pantalla';
  if (mod && key === 'u') return 'Intentó ver el código de la página';
  if (mod && key === 'p') return 'Intentó imprimir el examen';
  if (mod && key === 's') return 'Intentó guardar la página';
  if (mod && ['t', 'n', 'w'].includes(key)) return 'Intentó abrir o cerrar una pestaña o ventana';
  if (key === 'PrintScreen') return 'Presionó Impr Pant (captura de pantalla)';
  if (key === 'F11') return 'Intentó salir de pantalla completa';
  if (mod && ['+', '-', '=', '0'].includes(key)) return 'zoom';
  return null;
}
