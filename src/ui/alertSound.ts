/** Avisos sonoros cortos para el maestro (solo web; en el teléfono no suenan). */
let ctx: AudioContext | null = null;
const KEY = 'psjs.teacher.alertSounds';

export type AlertKind = 'ask' | 'away' | 'offline' | 'submit';

export function alertSoundsEnabled(): boolean {
  try {
    return typeof localStorage === 'undefined' || localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function setAlertSounds(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* sin almacenamiento: solo dura esta sesión */
  }
}

export function playAlert(kind: AlertKind) {
  if (typeof window === 'undefined') return;
  const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return;
  try {
    ctx ??= new AC() as AudioContext;
    const a = ctx;
    if (a.state === 'suspended') a.resume().catch(() => {});
    const notes: Record<AlertKind, [number, number][]> = {
      ask: [[660, 0], [880, 0.14]],
      away: [[520, 0], [520, 0.18]],
      offline: [[440, 0], [330, 0.16]],
      submit: [[784, 0]],
    };
    for (const [f, at] of notes[kind]) {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t0 = a.currentTime + at;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g).connect(a.destination);
      o.start(t0);
      o.stop(t0 + 0.18);
    }
  } catch {
    /* sin audio */
  }
}
