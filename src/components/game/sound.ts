/**
 * Efectos de sonido del juego, sintetizados con WebAudio (sin archivos de audio). Son cortos
 * y suaves; se pueden apagar desde el juego. En teléfonos (sin WebAudio) no suenan.
 */
type Kind = 'move' | 'harvest' | 'plant' | 'till' | 'water' | 'blocked' | 'win' | 'fail' | 'hack' | 'error';

let ctx: AudioContext | null = null;
let last = 0;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx!.state === 'suspended') ctx!.resume().catch(() => {});
  return ctx;
}

function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.06, slideTo?: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(a.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

/** Toca un efecto. Los movimientos muy seguidos (velocidad «instante») se omiten. */
export function playSound(kind: Kind) {
  const a = audio();
  if (!a) return;
  const now = a.currentTime;
  const t = performance.now();
  if ((kind === 'move' || kind === 'till' || kind === 'water') && t - last < 70) return;
  last = t;
  switch (kind) {
    case 'move':
      return tone(a, 520, now, 0.05, 'triangle', 0.03);
    case 'till':
      return tone(a, 180, now, 0.08, 'square', 0.025, 120);
    case 'water':
      return tone(a, 900, now, 0.12, 'sine', 0.04, 500);
    case 'plant':
      return tone(a, 440, now, 0.09, 'triangle', 0.05, 660);
    case 'harvest':
      tone(a, 660, now, 0.07, 'triangle', 0.05);
      return tone(a, 990, now + 0.06, 0.09, 'triangle', 0.05);
    case 'blocked':
      return tone(a, 140, now, 0.12, 'sawtooth', 0.03);
    case 'hack':
      tone(a, 300, now, 0.08, 'square', 0.03, 900);
      return tone(a, 1200, now + 0.08, 0.1, 'square', 0.025, 600);
    case 'error':
      return tone(a, 220, now, 0.2, 'sawtooth', 0.04, 110);
    case 'fail':
      tone(a, 330, now, 0.15, 'sawtooth', 0.04);
      return tone(a, 196, now + 0.15, 0.3, 'sawtooth', 0.04);
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(a, f, now + i * 0.1, 0.18, 'triangle', 0.06));
  }
}

/** Sonido de una acción del dron. */
export function actionSound(name: string, ok: boolean) {
  if (!ok) return playSound('blocked');
  const map: Record<string, Kind> = { move: 'move', harvest: 'harvest', plant: 'plant', till: 'till', useItem: 'water', hack: 'hack', shutdown: 'hack', swap: 'move' };
  const k = map[name];
  if (k) playSound(k);
}
