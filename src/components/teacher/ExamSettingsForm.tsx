/** Ajustes generales del examen (modo Maestro). */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { examTopics, questionsPerStudent, RESULTS_VISIBILITY, totalPoints, usesTopicPicks } from '../../core/exam/config';
import { ALWAYS_LOCKED } from '../../core/exam/protocol';
import type { ExamConfig } from '../../core/exam/types';
import { PROFILES } from '../../core/profiles';
import { useTheme } from '../../ui/theme';
import { Card, Field, NumberStepper, Pill, Segmented, TextField, Toggle } from '../exam/kit';

const DURATIONS = [0, 15, 30, 45, 60, 90, 120];

export default function ExamSettingsForm({ exam, onChange }: { exam: ExamConfig; onChange(e: ExamConfig): void }) {
  const t = useTheme();
  const up = (p: Partial<ExamConfig>) => onChange({ ...exam, ...p });
  const n = exam.questions.length;
  const per = questionsPerStudent(exam);
  const topics = examTopics(exam);
  const mode: 'all' | 'pick' | 'topic' = usesTopicPicks(exam) ? 'topic' : exam.pickCount ? 'pick' : 'all';
  const untagged = exam.questions.filter((q) => !q.topic?.trim()).length;
  return (
    <View>
      <Card>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Datos del examen</Text>
        <Field label="Título">
          <TextField value={exam.title} onChangeText={(title) => up({ title })} placeholder="Ej. Primer parcial: condicionales y ciclos" />
        </Field>
        <Field label="Instrucciones para el alumno" hint="Se muestran antes de comenzar.">
          <TextField value={exam.description} onChangeText={(description) => up({ description })} multiline minHeight={80} />
        </Field>
        <Field label="Maestro o materia (opcional)">
          <TextField value={exam.author} onChangeText={(author) => up({ author })} placeholder="Ej. Programación I · Prof. García" />
        </Field>
      </Card>

      <Card>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Tiempo y preguntas</Text>
        <Field label="Duración" hint={exam.durationMin ? `Cada alumno tiene ${exam.durationMin} minutos desde que presiona «Comenzar». Al terminarse, su examen se envía solo.` : 'Sin límite: el examen termina cuando el alumno lo envía o cuando cierras la sala.'}>
          <Segmented options={DURATIONS.map((d) => ({ id: d, label: d ? `${d} min` : 'Sin límite' }))} value={DURATIONS.includes(exam.durationMin) ? exam.durationMin : -1} onChange={(durationMin) => up({ durationMin })} />
          <View style={{ marginTop: 8 }}>
            <NumberStepper value={exam.durationMin} onChange={(durationMin) => up({ durationMin: Math.round(durationMin) })} min={0} max={600} step={5} suffix="minutos (personalizado)" />
          </View>
        </Field>
        <Field label="Preguntas por alumno" hint={mode === 'topic' ? `Cada alumno recibe ${per} preguntas: las indicadas de cada tema, elegidas al azar.` : exam.pickCount ? `Cada alumno recibe ${per} preguntas elegidas al azar de un banco de ${n}.` : `Todos reciben las ${n} preguntas.`}>
          <Segmented
            options={[
              { id: 'all', label: 'Todas' },
              { id: 'pick', label: 'Elegir al azar del banco' },
              ...(topics.length ? [{ id: 'topic' as const, label: 'Elegir por tema' }] : []),
            ]}
            value={mode}
            onChange={(v) =>
              up(
                v === 'topic'
                  ? { pickCount: 0, topicPicks: Object.fromEntries(topics.map((x) => [x.topic, exam.topicPicks[x.topic] || 1])) }
                  : { topicPicks: {}, pickCount: v === 'all' ? 0 : Math.max(1, Math.min(n || 1, Math.ceil(n * 0.7) || 1)) },
              )
            }
          />
          {mode === 'pick' ? (
            <View style={{ marginTop: 8 }}>
              <NumberStepper value={exam.pickCount} onChange={(pickCount) => up({ pickCount: Math.round(pickCount) })} min={1} max={Math.max(1, n)} suffix={`de ${n} preguntas`} />
            </View>
          ) : null}
          {mode === 'topic' ? (
            <View style={{ marginTop: 10 }}>
              {topics.map((x) => (
                <View key={x.topic} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
                  <Text style={{ color: t.text, fontSize: 13, flex: 1, minWidth: 160 }} numberOfLines={1}>
                    {x.topic}
                  </Text>
                  <NumberStepper value={exam.topicPicks[x.topic] ?? 0} onChange={(v) => up({ topicPicks: { ...exam.topicPicks, [x.topic]: Math.max(0, Math.round(v)) } })} min={0} max={x.count} suffix={`de ${x.count}`} />
                </View>
              ))}
              {untagged ? <Text style={{ color: t.warning, fontSize: 12, marginTop: 6 }}>{untagged} pregunta(s) sin tema no se usarán. Asígnales un tema al editarlas.</Text> : null}
            </View>
          ) : null}
        </Field>
        <Toggle icon="shuffle-outline" label="Mezclar el orden de las preguntas" description="Cada alumno las ve en un orden distinto." value={exam.shuffleQuestions} onChange={(shuffleQuestions) => up({ shuffleQuestions })} />
        <Toggle icon="swap-vertical-outline" label="Mezclar las opciones de respuesta" description="En opción múltiple, el orden de las opciones cambia por alumno." value={exam.shuffleOptions} onChange={(shuffleOptions) => up({ shuffleOptions })} />
      </Card>

      <Card>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Calificación</Text>
        <Field label="Escala">
          <Segmented
            options={[
              { id: 10, label: '0 a 10' },
              { id: 100, label: '0 a 100' },
            ]}
            value={exam.scale}
            onChange={(scale) => up({ scale })}
          />
        </Field>
        <Field label="Porcentaje mínimo para aprobar">
          <NumberStepper value={exam.passPercent} onChange={(passPercent) => up({ passPercent })} min={0} max={100} step={5} suffix={`% (${Math.round((exam.passPercent / 100) * exam.scale * 10) / 10} de ${exam.scale})`} />
        </Field>
        <Field label="Al enviar, el alumno ve…">
          <Segmented options={RESULTS_VISIBILITY.map((r) => ({ id: r.id, label: r.label }))} value={exam.showResults} onChange={(showResults) => up({ showResults })} />
          <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>{RESULTS_VISIBILITY.find((r) => r.id === exam.showResults)?.description}</Text>
        </Field>
        <Text style={{ color: t.textMuted, fontSize: 12 }}>Puntos totales del banco: {totalPoints(exam)}</Text>
      </Card>

      <Card>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Herramientas durante el examen</Text>
        <Field label="Perfil del lenguaje" hint="Reglas con que se ejecuta y califica el código.">
          <Segmented options={PROFILES.map((p) => ({ id: p.id, label: p.name }))} value={exam.profileId} onChange={(profileId) => up({ profileId })} />
        </Field>
        <Toggle icon="play-outline" label="Ejecutar y probar su código" description="El alumno puede correr su programa y probarlo con los casos de ejemplo." value={exam.allowRun} onChange={(allowRun) => up({ allowRun })} />
        <Toggle icon="bulb-outline" label="Autocompletado y ayuda del editor" description="Sugerencias mientras escribe y descripción de funciones." value={exam.allowAssist} onChange={(allowAssist) => up({ allowAssist })} />
        <Toggle icon="alert-circle-outline" label="Marcar errores de sintaxis mientras escribe" value={exam.showDiagnostics} onChange={(showDiagnostics) => up({ showDiagnostics })} />
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 13, marginTop: 14, marginBottom: 6 }}>Siempre desactivado en el examen</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {ALWAYS_LOCKED.map((x) => (
            <Pill key={x} icon="lock-closed-outline" text={x} color={t.textMuted} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Honestidad académica</Text>
        <Toggle icon="clipboard-outline" label="Bloquear pegar texto" description="Evita pegar código copiado de otro lugar (se te avisa si lo intentan)." value={exam.blockPaste} onChange={(blockPaste) => up({ blockPaste })} />
        <Toggle icon="eye-outline" label="Avisarme si salen de la ventana" description="Verás cuántas veces y cuánto tiempo estuvo fuera cada alumno." value={exam.trackFocus} onChange={(trackFocus) => up({ trackFocus })} />
      </Card>
    </View>
  );
}
