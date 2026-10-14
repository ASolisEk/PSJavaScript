/** Constructor de exámenes: ajustes generales y lista de preguntas. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { cloneQuestion, createQuestion, examFileName, examTopics, questionsPerStudent, questionTypeInfo, QUESTION_TYPES, serializeExam, totalPoints, validateExam } from '../../core/exam/config';
import type { ExamConfig, Question, QuestionType } from '../../core/exam/types';
import { plainText } from '../../core/exam/richText';
import { useTeacher } from '../../store/teacher';
import { confirmDialog, saveTextFile } from '../../ui/platform';
import { useTheme } from '../../ui/theme';
import { Button } from '../ui';
import { Banner, IconName, Pill } from '../exam/kit';
import ExamSettingsForm from './ExamSettingsForm';
import PreviewModal from './PreviewModal';
import QuestionEditor from './QuestionEditor';

type Sel = 'settings' | 'add' | string;

export default function BuilderTab() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const editingId = useTeacher((s) => s.editingId);
  const exam = useTeacher((s) => s.exams.find((e) => e.id === s.editingId) ?? null);
  const [sel, setSel] = useState<Sel | null>(wide ? 'settings' : null);
  const [preview, setPreview] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const issues = useMemo(() => (exam ? validateExam(exam) : []), [exam]);
  const topics = useMemo(() => (exam ? examTopics(exam) : []), [exam]);

  if (!exam || !editingId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="create-outline" size={40} color={t.border} />
        <Text style={{ color: t.textMuted, marginTop: 10, textAlign: 'center' }}>Elige un examen en «Mis exámenes» o crea uno nuevo.</Text>
        <Button label="Nuevo examen" icon="add" kind="primary" onPress={() => useTeacher.getState().newExam()} style={{ marginTop: 14 }} />
      </View>
    );
  }

  const save = (e: ExamConfig) => useTeacher.getState().saveExam(e);
  const setQuestions = (questions: Question[]) => save({ ...exam, questions });
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  const addQuestion = (type: QuestionType) => {
    const q = { ...createQuestion(type), ...(topic ? { topic } : {}) };
    setQuestions([...exam.questions, q]);
    setSel(q.id);
  };

  const selected = sel && sel !== 'settings' && sel !== 'add' ? exam.questions.find((q) => q.id === sel) : undefined;
  const selIndex = selected ? exam.questions.indexOf(selected) : -1;

  const list = (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <ListItem icon="settings-outline" title="Ajustes del examen" subtitle={`${exam.durationMin ? `${exam.durationMin} min` : 'Sin límite'} · escala ${exam.scale}`} active={sel === 'settings'} onPress={() => setSel('settings')} />
      <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginTop: 12, marginBottom: 6 }}>
        PREGUNTAS ({exam.questions.length}) · {totalPoints(exam)} PTS
      </Text>
      {topics.length > 1 ? (
        <View style={styles.chips}>
          {[{ topic: null as string | null, count: exam.questions.length }, ...topics].map((x) => {
            const on = topic === x.topic;
            return (
              <Pressable key={x.topic ?? '*'} onPress={() => setTopic(x.topic)} style={[styles.chip, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary + '18' : t.surface }]}>
                <Text style={{ color: on ? t.primary : t.textMuted, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                  {x.topic ?? 'Todos'} ({x.count})
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {exam.questions.map((q, i) => {
        if (topic && q.topic !== topic && sel !== q.id) return null;
        const info = questionTypeInfo(q.type);
        const qIssues = issues.filter((x) => x.questionId === q.id);
        const bad = qIssues.some((x) => x.severity === 'error');
        return (
          <ListItem
            key={q.id}
            icon={info.icon as IconName}
            number={i + 1}
            title={plainText(q.prompt).trim() || '(sin enunciado)'}
            subtitle={`${info.label} · ${q.points} pts${q.topic && !topic ? ` · ${q.topic}` : ''}`}
            active={sel === q.id}
            warn={bad ? 'error' : qIssues.length ? 'warning' : undefined}
            onPress={() => setSel(q.id)}
          />
        );
      })}
      <Pressable onPress={() => setSel('add')} style={[styles.addBtn, { borderColor: t.primary, backgroundColor: sel === 'add' ? t.primary + '14' : 'transparent' }]}>
        <Ionicons name="add-circle-outline" size={18} color={t.primary} />
        <Text style={{ color: t.primary, fontWeight: '800', marginLeft: 6 }}>Agregar pregunta</Text>
      </Pressable>
    </ScrollView>
  );

  const editor =
    sel === 'settings' ? (
      <ExamSettingsForm exam={exam} onChange={save} />
    ) : sel === 'add' ? (
      <View>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>¿Qué tipo de pregunta quieres agregar?</Text>
        <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 12 }}>Puedes cambiar el texto y los puntos después.</Text>
        <View style={styles.typeGrid}>
          {QUESTION_TYPES.map((qt) => (
            <Pressable key={qt.type} onPress={() => addQuestion(qt.type)} style={({ pressed }) => [styles.typeCard, { borderColor: t.border, backgroundColor: pressed ? t.surfaceAlt : t.surface }]}>
              <View style={[styles.typeIcon, { backgroundColor: (qt.usesCode ? t.accent : t.primary) + '1f' }]}>
                <Ionicons name={qt.icon as IconName} size={22} color={qt.usesCode ? t.accent : t.primary} />
              </View>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 14 }}>{qt.label}</Text>
              <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 }}>{qt.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    ) : selected ? (
      <QuestionEditor
        key={selected.id}
        q={selected}
        index={selIndex}
        count={exam.questions.length}
        profileId={exam.profileId}
        issues={issues.filter((x) => x.questionId === selected.id)}
        onChange={(nq) => setQuestions(exam.questions.map((x) => (x.id === nq.id ? nq : x)))}
        onMove={(d) => {
          const qs = [...exam.questions];
          const j = selIndex + d;
          if (j < 0 || j >= qs.length) return;
          [qs[selIndex], qs[j]] = [qs[j], qs[selIndex]];
          setQuestions(qs);
        }}
        onDuplicate={() => {
          const c = cloneQuestion(selected);
          const qs = [...exam.questions];
          qs.splice(selIndex + 1, 0, c);
          setQuestions(qs);
          setSel(c.id);
        }}
        onDelete={async () => {
          if (!(await confirmDialog('¿Eliminar la pregunta?', 'Esta acción no se puede deshacer.', 'Eliminar'))) return;
          const qs = exam.questions.filter((x) => x.id !== selected.id);
          setQuestions(qs);
          setSel(qs[Math.min(selIndex, qs.length - 1)]?.id ?? 'add');
        }}
      />
    ) : null;

  const top = (
    <View style={[styles.top, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
      {!wide && sel ? <Button label="Preguntas" icon="chevron-back" onPress={() => setSel(null)} style={{ marginRight: 8 }} /> : null}
      <View style={{ flex: 1, minWidth: 160 }}>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
          {exam.title || 'Examen sin título'}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 12 }}>
          {questionsPerStudent(exam)} preguntas por alumno · se guarda automáticamente
        </Text>
      </View>
      <Pressable onPress={() => setShowIssues((v) => !v)} style={{ marginRight: 8 }}>
        {errors.length ? <Pill icon="alert-circle" color={t.danger} text={`${errors.length} por corregir`} /> : warnings.length ? <Pill icon="warning-outline" color={t.warning} text={`${warnings.length} avisos`} /> : <Pill icon="checkmark-circle" color={t.success} text="Listo para aplicar" />}
      </Pressable>
      <Button label="Vista previa" icon="eye-outline" onPress={() => setPreview(true)} disabled={!exam.questions.length} style={{ marginRight: 6 }} />
      <Button label="Exportar" icon="download-outline" onPress={() => saveTextFile(examFileName(exam), serializeExam(exam), 'application/json')} style={{ marginRight: 6 }} />
      <Button
        label="Aplicar examen"
        icon="rocket-outline"
        kind="primary"
        disabled={!!errors.length}
        onPress={() => {
          useTeacher.setState({ tab: 'room', openError: null });
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {top}
      {showIssues && issues.length ? (
        <View style={{ padding: 12, paddingBottom: 0 }}>
          {issues.map((i, k) => (
            <Banner
              key={k}
              icon={i.severity === 'error' ? 'alert-circle' : 'warning-outline'}
              color={i.severity === 'error' ? t.danger : t.warning}
              text={i.message}
              action={i.questionId ? { label: 'Ir', onPress: () => setSel(i.questionId!) } : undefined}
            />
          ))}
        </View>
      ) : null}
      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ width: 320, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: t.border, backgroundColor: t.surface }}>{list}</View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <View style={{ maxWidth: 860, width: '100%', alignSelf: 'center' }}>{editor}</View>
          </ScrollView>
        </View>
      ) : sel ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {editor}
        </ScrollView>
      ) : (
        list
      )}
      {preview ? <PreviewModal exam={exam} onClose={() => setPreview(false)} /> : null}
    </View>
  );
}

function ListItem({ icon, title, subtitle, active, onPress, number, warn }: { icon: IconName; title: string; subtitle: string; active: boolean; onPress(): void; number?: number; warn?: 'error' | 'warning' }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary + '12' : pressed ? t.surfaceAlt : t.surface }]}>
      <View style={[styles.itemIcon, { backgroundColor: t.surfaceAlt }]}>
        {number ? <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '800', position: 'absolute', top: 1, left: 3 }}>{number}</Text> : null}
        <Ionicons name={icon} size={17} color={active ? t.primary : t.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {warn ? <Ionicons name={warn === 'error' ? 'alert-circle' : 'warning-outline'} size={16} color={warn === 'error' ? t.danger : t.warning} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  item: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 8, marginBottom: 6 },
  itemIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 200 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, padding: 12, marginTop: 6 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { flexBasis: 220, flexGrow: 1, borderWidth: 1, borderRadius: 12, padding: 14 },
  typeIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
