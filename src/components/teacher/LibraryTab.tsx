/** Mis exámenes: crear, importar, exportar, duplicar y aplicar. */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { examFileName, hasExamErrors, questionsPerStudent, questionTypeInfo, serializeExam, totalPoints } from '../../core/exam/config';
import { Certification, CERTIFICATIONS } from '../../core/exam/certs';
import type { ExamConfig } from '../../core/exam/types';
import { useTeacher } from '../../store/teacher';
import { confirmDialog, pickTextFileWeb, saveTextFile } from '../../ui/platform';
import { BORDER, RADIUS, SCRIM, useTheme } from '../../ui/theme';
import { Button, Heading } from '../ui';
import { Banner, Card, IconName, Pill, TextField } from '../exam/kit';

export default function LibraryTab() {
  const t = useTheme();
  const exams = useTeacher((s) => s.exams);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const st = useTeacher.getState();

  const importFile = async () => {
    if (Platform.OS !== 'web') return setImporting(true);
    const f = await pickTextFileWeb('.json,application/json');
    if (!f) return;
    try {
      const e = st.importExam(f.text);
      setMsg({ ok: true, text: `Se importó «${e.title}» con ${e.questions.length} preguntas.` });
    } catch (err: any) {
      setMsg({ ok: false, text: `No se pudo importar ${f.name}: ${err?.message ?? err}` });
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 1000 }}>
        <Card style={{ backgroundColor: t.primary + '0d' }} accent={t.primary}>
          <Heading style={{ marginBottom: 10 }}>Exámenes en 3 pasos</Heading>
          <View style={styles.steps}>
            <Step n={1} icon="create-outline" title="Diseña" text="Elige preguntas del banco, pega una lista en texto o escríbelas: opción múltiple, código, ordenar líneas y más." />
            <Step n={2} icon="radio-outline" title="Aplica" text="Abre una sala y comparte el código. Cada alumno recibe las preguntas en otro orden." />
            <Step n={3} icon="bar-chart-outline" title="Revisa" text="Sigue el avance en vivo y al cerrar obtén el concentrado de calificaciones." />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <Button label="Nuevo examen" icon="add" kind="primary" onPress={() => st.newExam()} />
            <Button label="Usar examen de ejemplo" icon="sparkles-outline" onPress={() => st.newExam(true)} />
            <Button label="Importar configuración" icon="cloud-upload-outline" onPress={importFile} />
          </View>
        </Card>

        {CERTIFICATIONS.map((c) => (
          <CertCard key={c.id} cert={c} onAdded={(text) => setMsg({ ok: true, text })} />
        ))}

        {msg ? <Banner icon={msg.ok ? 'checkmark-circle' : 'alert-circle'} color={msg.ok ? t.success : t.danger} text={msg.text} onClose={() => setMsg(null)} /> : null}

        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginVertical: 10 }}>Mis exámenes ({exams.length})</Text>
        {exams.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Ionicons name="documents-outline" size={40} color={t.border} />
            <Text style={{ color: t.textMuted, marginTop: 8, textAlign: 'center' }}>Aún no tienes exámenes. Crea uno nuevo o prueba con el de ejemplo.</Text>
          </Card>
        ) : null}
        <View style={styles.grid}>
          {exams.map((e) => (
            <ExamCard key={e.id} e={e} />
          ))}
        </View>
      </View>
      {importing ? (
        <ImportDialog
          onClose={() => setImporting(false)}
          onImported={(e) => {
            setImporting(false);
            setMsg({ ok: true, text: `Se importó «${e.title}» con ${e.questions.length} preguntas.` });
          }}
        />
      ) : null}
    </ScrollView>
  );
}

/** Simulacro y copia de práctica de una certificación incluida. */
function CertCard({ cert, onAdded }: { cert: Certification; onAdded(text: string): void }) {
  const t = useTheme();
  return (
    <Card accent={t.success}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Ionicons name="ribbon-outline" size={24} color={t.success} />
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', flex: 1 }}>{cert.title}</Text>
      </View>
      <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 19 }}>
        {cert.teacherSummary()} También se crea una copia de práctica sin tiempo que muestra las respuestas correctas. Los alumnos pueden practicar por su cuenta desde «Soy alumno».
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <Button
          label="Agregar simulacro y práctica"
          icon="add-circle-outline"
          kind="primary"
          onPress={() => {
            const [sim, pra] = useTeacher.getState().addCertification(cert.id);
            onAdded(`Se agregaron «${sim.title}» y «${pra.title}» (${sim.questions.length} preguntas en el banco). Revisa sus ajustes antes de aplicarlos.`);
          }}
        />
      </View>
    </Card>
  );
}

function Step({ n, icon, title, text }: { n: number; icon: IconName; title: string; text: string }) {
  const t = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.stepIcon, { backgroundColor: t.primary }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: '800' }}>
          {n}. {title}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 18 }}>{text}</Text>
      </View>
    </View>
  );
}

function ExamCard({ e }: { e: ExamConfig }) {
  const t = useTheme();
  const st = useTeacher.getState();
  const bad = hasExamErrors(e);
  const types = [...new Set(e.questions.map((q) => q.type))];
  return (
    <Card style={styles.examCard}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }} numberOfLines={2}>
            {e.title}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>
            {e.author ? `${e.author} · ` : ''}modificado {new Date(e.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        {bad ? <Pill icon="alert-circle" text="Incompleto" color={t.danger} /> : <Pill icon="checkmark-circle" text="Listo" color={t.success} />}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 }}>
        <Pill icon="help-circle-outline" text={`${e.questions.length} preguntas${questionsPerStudent(e) < e.questions.length ? ` (${questionsPerStudent(e)} por alumno)` : ''}`} color={t.primary} />
        <Pill icon="star-outline" text={`${totalPoints(e)} pts`} color={t.accent} />
        <Pill icon="time-outline" text={e.durationMin ? `${e.durationMin} min` : 'Sin límite'} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {types.map((ty) => (
          <Ionicons key={ty} name={questionTypeInfo(ty).icon as IconName} size={16} color={t.textMuted} accessibilityLabel={questionTypeInfo(ty).label} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Button label="Editar" icon="create-outline" onPress={() => st.edit(e.id)} />
        <Button
          label="Aplicar"
          icon="rocket-outline"
          kind="primary"
          disabled={bad}
          onPress={() => {
            useTeacher.setState({ editingId: e.id, tab: 'room', openError: null });
          }}
        />
        <Button label="Exportar" icon="download-outline" onPress={() => saveTextFile(examFileName(e), serializeExam(e), 'application/json')} />
        <Button label="Duplicar" icon="copy-outline" onPress={() => st.duplicateExam(e.id)} />
        <Button
          label="Eliminar"
          icon="trash-outline"
          kind="danger"
          onPress={async () => {
            if (await confirmDialog('¿Eliminar el examen?', `«${e.title}» se borrará de este dispositivo. Exporta una copia si la necesitas.`, 'Eliminar')) st.deleteExam(e.id);
          }}
        />
      </View>
    </Card>
  );
}

function ImportDialog({ onClose, onImported }: { onClose(): void; onImported(e: ExamConfig): void }) {
  const t = useTheme();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 17, marginBottom: 8 }}>Importar configuración</Text>
          <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 8 }}>Pega aquí el contenido del archivo .examen.json.</Text>
          <TextField value={text} onChangeText={setText} mono multiline minHeight={180} />
          {error ? <Banner icon="alert-circle" color={t.danger} text={error} /> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <Button label="Cancelar" onPress={onClose} />
            <Button
              label="Importar"
              icon="cloud-upload-outline"
              kind="primary"
              disabled={!text.trim()}
              onPress={() => {
                try {
                  onImported(useTeacher.getState().importExam(text));
                } catch (e: any) {
                  setError(e?.message ?? String(e));
                }
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', flexBasis: 260, flexGrow: 1, gap: 10 },
  stepIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  examCard: { flexBasis: 420, flexGrow: 1, marginHorizontal: 6 },
  overlay: { flex: 1, backgroundColor: SCRIM, alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 620, borderRadius: RADIUS.lg, borderWidth: BORDER, padding: 18 },
});
