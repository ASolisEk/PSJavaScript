/**
 * Calendario de fiestas para los vestuarios de la mascota (México y algunas
 * internacionales). Módulo puro: sin React, para poder probarlo.
 */

/** Color del pelaje: normal (naranja), oscuro (Halloween) o negro (Día de Muertos). */
export type Skin = 'normal' | 'dark' | 'black';

export type CostumeId =
  | 'anio-nuevo'
  | 'reyes'
  | 'san-valentin'
  | 'primavera'
  | 'dia-del-nino'
  | 'dia-de-las-madres'
  | 'dia-del-maestro'
  | 'programador'
  | 'independencia'
  | 'halloween'
  | 'muertos'
  | 'revolucion'
  | 'navidad';

type AmbientMode = 'fall' | 'rise' | 'fly';

export interface Costume {
  id: CostumeId;
  name: string;
  emoji: string;
  skin: Skin;
  /**
   * Día festivo [mes, día]. En automático el vestuario se pone un mes antes
   * (10 días antes si otra fiesta cae en el mismo mes) y se conserva 10 días
   * después. null = solo el día exacto (Día del Programador).
   */
  day: [number, number] | null;
  /** Saludo que dice al aparecer con el vestuario. */
  greeting: string;
  ambient: { items: string[]; mode: AmbientMode; text?: boolean };
}

export const COSTUMES: Costume[] = [
  {
    id: 'anio-nuevo',
    name: 'Año Nuevo',
    emoji: '🎉',
    skin: 'normal',
    day: [1, 1],
    greeting: '¡Feliz Año Nuevo! 🎉 Este año aprendemos a programar juntos.',
    ambient: { items: ['🎊', '✨', '🎉'], mode: 'rise' },
  },
  {
    id: 'reyes',
    name: 'Día de Reyes',
    emoji: '👑',
    skin: 'normal',
    day: [1, 6],
    greeting: '¡Feliz Día de Reyes! 👑 ¿Te tocó el muñequito en la rosca?',
    ambient: { items: ['✨', '⭐', '✨'], mode: 'rise' },
  },
  {
    id: 'san-valentin',
    name: 'San Valentín',
    emoji: '💘',
    skin: 'normal',
    day: [2, 14],
    greeting: '¡Feliz Día del Amor y la Amistad! 💘 Te quiero más que a un código sin errores.',
    ambient: { items: ['💕', '💗', '💘'], mode: 'rise' },
  },
  {
    id: 'primavera',
    name: 'Primavera',
    emoji: '🌸',
    skin: 'normal',
    day: [3, 21],
    greeting: '¡Llegó la primavera! 🌸 Buen momento para que florezcan tus programas.',
    ambient: { items: ['🦋', '🌸', '🦋'], mode: 'fly' },
  },
  {
    id: 'dia-del-nino',
    name: 'Día del Niño',
    emoji: '🎈',
    skin: 'normal',
    day: [4, 30],
    greeting: '¡Feliz Día del Niño y la Niña! 🎈 Programar también es jugar.',
    ambient: { items: ['🎈', '🪁', '🎈'], mode: 'rise' },
  },
  {
    id: 'dia-de-las-madres',
    name: 'Día de las Madres',
    emoji: '💐',
    skin: 'normal',
    day: [5, 10],
    greeting: '¡Feliz 10 de mayo! 💐 Un abrazo a todas las mamás.',
    ambient: { items: ['🌷', '💖', '🌹'], mode: 'rise' },
  },
  {
    id: 'dia-del-maestro',
    name: 'Día del Maestro',
    emoji: '🎓',
    skin: 'normal',
    day: [5, 15],
    greeting: '¡Feliz Día del Maestro! 🎓 Gracias a quienes nos enseñan a pensar.',
    ambient: { items: ['📚', '✏️', '🍎'], mode: 'rise' },
  },
  {
    id: 'programador',
    name: 'Día del Programador',
    emoji: '😎',
    skin: 'normal',
    // día 256 del año (13 de sept., o 12 en año bisiesto): solo ese día
    day: null,
    greeting: '¡Feliz Día del Programador! 😎 Hoy es el día 256 del año: 2⁸.',
    ambient: { items: ['{ }', '</>', '01'], mode: 'rise', text: true },
  },
  {
    id: 'independencia',
    name: 'Fiestas Patrias',
    emoji: '🇲🇽',
    skin: 'normal',
    day: [9, 16],
    greeting: '¡Viva México! 🇲🇽 Felices fiestas patrias.',
    ambient: { items: ['💚', '🤍', '❤️'], mode: 'rise' },
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    skin: 'dark',
    day: [10, 31],
    greeting: '¡Feliz Halloween! 🎃 Cuidado con los bugs fantasma… 👻',
    ambient: { items: ['🦇', '🎃', '🦇'], mode: 'fly' },
  },
  {
    id: 'muertos',
    name: 'Día de Muertos',
    emoji: '💀',
    skin: 'black',
    day: [11, 2],
    greeting: '¡Feliz Día de Muertos! 💀🌼 Hoy recordamos con cariño a quienes ya no están.',
    ambient: { items: ['🌼', '🏵️', '🌼'], mode: 'fall' },
  },
  {
    id: 'revolucion',
    name: 'Revolución Mexicana',
    emoji: '🤠',
    skin: 'normal',
    day: [11, 20],
    greeting: '¡Feliz aniversario de la Revolución! 🤠 ¡A revolucionar tu código!',
    ambient: { items: ['⭐', '🌵', '⭐'], mode: 'rise' },
  },
  {
    id: 'navidad',
    name: 'Navidad',
    emoji: '🎅',
    skin: 'normal',
    day: [12, 25],
    greeting: '¡Jo, jo, jo! 🎅 Feliz Navidad. Mi regalo: cero errores de sintaxis.',
    ambient: { items: ['❄️', '❄️', '⭐'], mode: 'fall' },
  },
];

const BY_ID = Object.fromEntries(COSTUMES.map((c) => [c.id, c])) as Record<CostumeId, Costume>;

/** Días que se conserva el vestuario después del día festivo. */
export const DAYS_AFTER = 10;
/** Anticipación cuando otra fiesta cae en el mismo mes. */
export const SHORT_LEAD_DAYS = 10;

const DAY_MS = 86_400_000;
/** Fecha local a mediodía (evita saltos por horario de verano). */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const startOfDay = (d: Date) => at(d.getFullYear(), d.getMonth() + 1, d.getDate());
const addDays = (d: Date, n: number) => at(d.getFullYear(), d.getMonth() + 1, d.getDate() + n);
const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);

/** Día 256 del año: 13 de septiembre (12 en año bisiesto). */
const programmersDay = (y: number) => at(y, 1, 256);

/** ¿Otra fiesta cae en el mismo mes que esta? */
function sharesMonth(c: Costume): boolean {
  return !!c.day && COSTUMES.some((o) => o !== c && o.day && o.day[0] === c.day![0]);
}

/** Periodo en que se usa el vestuario para la fiesta de un año dado. */
export function costumeWindow(c: Costume, year: number): { start: Date; day: Date; end: Date } {
  if (!c.day) {
    const day = programmersDay(year);
    return { start: day, day, end: day };
  }
  const day = at(year, c.day[0], c.day[1]);
  // un mes antes (mismo día del mes anterior; se ajusta si ese mes es más corto)
  const monthBefore = at(year, c.day[0] - 1, Math.min(c.day[1], new Date(year, c.day[0] - 1, 0).getDate()));
  const start = sharesMonth(c) ? addDays(day, -SHORT_LEAD_DAYS) : monthBefore;
  return { start, day, end: addDays(day, DAYS_AFTER) };
}

/**
 * Vestuario que corresponde a una fecha (o null si no hay fiesta cerca).
 * Si se enciman los periodos de dos fiestas gana la de fecha más cercana
 * (en empate, la que viene). El Día del Programador gana en su día.
 */
export function costumeForDate(d: Date): Costume | null {
  const today = startOfDay(d);
  let best: { c: Costume; dist: number; upcoming: boolean } | null = null;
  for (const c of COSTUMES) {
    for (const y of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
      const w = costumeWindow(c, y);
      if (today < w.start || today > w.end) continue;
      if (!c.day) return c;
      const delta = daysBetween(today, w.day);
      const cand = { c, dist: Math.abs(delta), upcoming: delta >= 0 };
      if (!best || cand.dist < best.dist || (cand.dist === best.dist && cand.upcoming && !best.upcoming)) best = cand;
    }
  }
  return best?.c ?? null;
}

/** Resuelve la preferencia ('auto', 'none' o un id) para una fecha. */
export function resolveCostume(setting: string | undefined, d: Date): Costume | null {
  if (!setting || setting === 'auto') return costumeForDate(d);
  if (setting === 'none') return null;
  return BY_ID[setting as CostumeId] ?? null;
}
