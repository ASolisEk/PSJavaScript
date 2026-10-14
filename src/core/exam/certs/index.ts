/**
 * Certificaciones incluidas: cada una aporta un simulacro, una copia de práctica
 * y prácticas individuales (completas o por tema) para el alumno.
 */
import type { ExamConfig } from '../types';
import * as fcc from './fccJavascript';
import { FCC_JAVASCRIPT_LABS } from './fccJavascriptLabs';
import * as webdev from './webdevJavascript';
import { WEBDEV_JAVASCRIPT_EXERCISES } from './webdevJavascriptBank';

export interface PracticeOption {
  key: string;
  title: string;
  description: string;
}

export interface Certification {
  id: string;
  /** Nombre corto para elegir entre certificaciones (p. ej. «freeCodeCamp»). */
  short: string;
  title: string;
  url: string;
  /** Explicación para el maestro en «Mis exámenes». */
  teacherSummary(): string;
  /** Explicación para el alumno en «Practicar por mi cuenta». */
  studentSummary: string;
  /** Simulacro con condiciones de examen y su copia de práctica. */
  exams(): [ExamConfig, ExamConfig];
  practiceOptions(): { full: PracticeOption[]; topics: PracticeOption[] };
  practiceExam(key: string): ExamConfig;
}

export const CERTIFICATIONS: Certification[] = [
  {
    id: 'fcc',
    short: 'freeCodeCamp',
    title: 'Certificación JavaScript de freeCodeCamp',
    url: fcc.FCC_JAVASCRIPT_URL,
    teacherSummary() {
      const topics = fcc.fccJavascriptTopics();
      const questions = topics.reduce((s, x) => s + x.questions, 0);
      const per = topics.length * fcc.SIMULACRO.perTopic + fcc.SIMULACRO.labs;
      return (
        `Simulacro con los ${topics.length} temas del currículo JavaScript v9: ${questions} preguntas de sus cuestionarios (traducidas al español) y ${FCC_JAVASCRIPT_LABS.length} laboratorios de programación. ` +
        `Cada alumno recibe ${fcc.SIMULACRO.perTopic} preguntas por tema y ${fcc.SIMULACRO.labs} laboratorios (${per} en total), tiene ${fcc.SIMULACRO.durationMin} minutos y aprueba con ${fcc.FCC_PASS_PERCENT} %, como los cuestionarios de freeCodeCamp.`
      );
    },
    studentSummary: 'Prepárate para la certificación «JavaScript» de freeCodeCamp con las preguntas de sus cuestionarios (traducidas al español) y sus laboratorios.',
    exams: () => [fcc.fccJavascriptSimulacro(), fcc.fccJavascriptPractica()],
    practiceOptions: fcc.practiceOptions,
    practiceExam: fcc.practiceExam,
  },
  {
    id: 'webdev',
    short: 'web.dev',
    title: 'Curso Learn JavaScript de web.dev',
    url: webdev.WEBDEV_JAVASCRIPT_URL,
    teacherSummary() {
      const topics = webdev.webdevJavascriptTopics();
      const questions = topics.reduce((s, x) => s + x.questions, 0);
      const s = webdev.WEBDEV_SIMULACRO;
      return (
        `Simulacro con las ${topics.length} lecciones del curso (de tipos de datos a clases): ${questions} preguntas en español sobre sus definiciones y ejemplos de código, y ${WEBDEV_JAVASCRIPT_EXERCISES.length} ejercicios de programación. ` +
        `Cada alumno recibe ${s.perTopic} preguntas por lección y ${s.exercises} ejercicios (${topics.length * s.perTopic + s.exercises} en total), tiene ${s.durationMin} minutos y aprueba con ${webdev.WEBDEV_PASS_PERCENT} %.`
      );
    },
    studentSummary: 'Repasa el curso «Learn JavaScript» de web.dev lección por lección: definiciones, ejemplos de código y ejercicios, todo en español.',
    exams: () => [webdev.webdevJavascriptSimulacro(), webdev.webdevJavascriptPractica()],
    practiceOptions: webdev.webdevPracticeOptions,
    practiceExam: webdev.webdevPracticeExam,
  },
];

export function getCertification(id: string): Certification {
  const c = CERTIFICATIONS.find((x) => x.id === id);
  if (!c) throw new Error(`Certificación desconocida: ${id}`);
  return c;
}

/** Clave de una práctica individual: «certificación/práctica» (p. ej. «webdev/tema:Clases»). */
export function practiceKey(certId: string, key: string): string {
  return `${certId}/${key}`;
}

/** Configuración de una práctica individual. Las claves sin certificación son de freeCodeCamp (prácticas guardadas antes). */
export function practiceExam(key: string): ExamConfig {
  const slash = key.indexOf('/');
  const known = slash > 0 && CERTIFICATIONS.some((c) => c.id === key.slice(0, slash));
  return known ? getCertification(key.slice(0, slash)).practiceExam(key.slice(slash + 1)) : getCertification('fcc').practiceExam(key);
}
