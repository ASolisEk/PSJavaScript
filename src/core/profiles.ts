/**
 * Perfiles de configuración del lenguaje (equivalente a los perfiles de PSeInt).
 * Cada perfil activa reglas del analizador estático y del intérprete.
 */

export interface Profile {
  id: string;
  name: string;
  description: string;
  /** Asignar a una variable no declarada crea una global (si es false, es un error). */
  allowImplicitGlobals: boolean;
  /** Prohíbe `var` (usar let/const). */
  forbidVar: boolean;
  /** Exige ';' al final de cada instrucción. */
  requireSemicolons: boolean;
  /** Exige === y !== en lugar de == y !=. */
  strictEquality: boolean;
  /** Exige llaves { } en if/else/ciclos. */
  requireBraces: boolean;
  /** Error en tiempo de ejecución al mezclar tipos (ej. "5" * 2). */
  strictTypes: boolean;
  /** Advierte sobre variables declaradas que no se usan. */
  warnUnused: boolean;
  /** Sugiere const cuando una variable let nunca se reasigna. */
  preferConst: boolean;
  /** Solo programación estructurada: sin clases, flechas, desestructuración ni spread. */
  onlyBasicFeatures: boolean;
  /** Exige nombres en camelCase. */
  requireCamelCase: boolean;
  /** Máxima profundidad de llamadas (recursión). */
  maxCallDepth: number;
}

export type ProfileFlags = Omit<Profile, 'id' | 'name' | 'description'>;

const base: ProfileFlags = {
  allowImplicitGlobals: false,
  forbidVar: false,
  requireSemicolons: true,
  strictEquality: false,
  requireBraces: false,
  strictTypes: false,
  warnUnused: true,
  preferConst: false,
  onlyBasicFeatures: false,
  requireCamelCase: false,
  maxCallDepth: 200,
};

export const PROFILES: Profile[] = [
  {
    id: 'flexible',
    name: 'Flexible',
    description: 'JavaScript tal cual lo acepta el navegador. Permite variables globales implícitas y conversiones automáticas.',
    ...base,
    allowImplicitGlobals: true,
    warnUnused: false,
    requireSemicolons: false,
  },
  {
    id: 'estandar',
    name: 'Estándar (recomendado)',
    description: 'Exige punto y coma al final de cada instrucción, declarar variables y advierte sobre malas prácticas comunes.',
    ...base,
    strictEquality: true,
    forbidVar: true,
    requireSemicolons: true,
  },
  {
    id: 'estructurado',
    name: 'Programación estructurada',
    description: 'Para cursos introductorios: solo variables, condicionales, ciclos, funciones y arreglos. Tipos estrictos como en PSeInt.',
    ...base,
    forbidVar: true,
    strictEquality: true,
    requireBraces: true,
    requireSemicolons: true,
    strictTypes: true,
    onlyBasicFeatures: true,
  },
  {
    id: 'estricto',
    name: 'Estricto',
    description: 'Todas las reglas: punto y coma, llaves, ===, const preferido, camelCase y tipos estrictos.',
    ...base,
    forbidVar: true,
    strictEquality: true,
    requireBraces: true,
    requireSemicolons: true,
    strictTypes: true,
    preferConst: true,
    requireCamelCase: true,
  },
];

export const DEFAULT_PROFILE_ID = 'estandar';

export function getProfile(id: string, custom?: Partial<ProfileFlags>): Profile {
  if (id === 'personalizado') {
    return { ...base, ...custom, id, name: 'Personalizado', description: 'Configuración definida por el usuario.' };
  }
  return PROFILES.find((p) => p.id === id) ?? PROFILES.find((p) => p.id === DEFAULT_PROFILE_ID)!;
}

export const FLAG_LABELS: Record<keyof ProfileFlags, string> = {
  allowImplicitGlobals: 'Permitir variables sin declarar (globales implícitas)',
  forbidVar: 'Prohibir var (usar let/const)',
  requireSemicolons: 'Exigir ; al final de cada instrucción',
  strictEquality: 'Exigir === y !==',
  requireBraces: 'Exigir llaves { } en estructuras de control',
  strictTypes: 'Tipos estrictos (no mezclar texto y número)',
  warnUnused: 'Advertir variables sin usar',
  preferConst: 'Sugerir const si no se reasigna',
  onlyBasicFeatures: 'Solo estructuras básicas (sin clases, flechas, etc.)',
  requireCamelCase: 'Exigir nombres camelCase',
  maxCallDepth: 'Profundidad máxima de recursión',
};
