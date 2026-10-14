/** Elegir preguntas ya hechas (bancos incluidos o exámenes propios) para agregarlas al examen. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { bankSources, groupByTopic, matchesSearch, promptKey } from '../../core/exam/bank';
import { questionTypeInfo } from '../../core/exam/config';
import { plainText } from '../../core/exam/richText';
import type { ExamConfig, Question } from '../../core/exam/types';
import { useTeacher } from '../../store/teacher';
import { useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { Button, Chip } from '../ui';
import { IconName, Pill, TextField } from '../exam/kit';

export default function BankModal({ exam, onClose, onAdd }: { exam: ExamConfig; onClose(): void; onAdd(questions: Question[]): void }) {
  const t = useTheme();
  const exams = useTeacher((s) => s.exams);
  // los bancos se arman una sola vez al abrir (los de freeCodeCamp tienen cientos de preguntas)
  const sources = useMemo(() => bankSources(exams, exam.id), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [sourceId, setSourceId] = useState(sources[0].id);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<Map<string, Question>>(new Map());
  const source = sources.find((s) => s.id === sourceId) ?? sources[0];
  const existing = useMemo(() => new Set(exam.questions.map(promptKey)), [exam.questions]);
  const groups = useMemo(() => groupByTopic(source.questions.filter((q) => matchesSearch(q, search))), [source, search]);
  const searching = !!search.trim();

  const toggle = (qs: Question[], on: boolean) =>
    setPicked((prev) => {
      const next = new Map(prev);
      for (const q of qs) {
        if (existing.has(promptKey(q))) continue;
        if (on) next.set(q.id, q);
        else next.delete(q.id);
      }
      return next;
    });

  return (
    <ModalShell title="Agregar preguntas del banco" onClose={onClose} wide>
      <View style={[styles.bar, { borderBottomColor: t.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
          {sources.map((s) => (
            <Chip key={s.id} label={`${s.title} (${s.questions.length})`} active={s.id === sourceId} onPress={() => setSourceId(s.id)} />
          ))}
        </ScrollView>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 8 }}>{source.description}</Text>
        <TextField value={search} onChangeText={setSearch} placeholder="Buscar por palabra (p. ej. «map», «for», «objeto»)…" accessibilityLabel="Buscar preguntas" />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 10 }}>
        {groups.length === 0 ? <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 20 }}>Ninguna pregunta coincide con la búsqueda.</Text> : null}
        {groups.map((g) => {
          const free = g.questions.filter((q) => !existing.has(promptKey(q)));
          const n = free.filter((q) => picked.has(q.id)).length;
          const all = free.length > 0 && n === free.length;
          const expanded = searching || open[g.topic];
          return (
            <View key={g.topic} style={[styles.group, { borderColor: t.border, backgroundColor: t.surface }]}>
              <View style={styles.groupHead}>
                <CheckBox on={all} partial={n > 0 && !all} disabled={!free.length} label={`Elegir todo «${g.topic}»`} onPress={() => toggle(free, !all)} />
                <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => setOpen((o) => ({ ...o, [g.topic]: !expanded }))} accessibilityRole="button">
                  <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {g.topic}
                  </Text>
                  <Text style={{ color: n ? t.primary : t.textMuted, fontSize: 12, fontWeight: '700', marginHorizontal: 8 }}>{n ? `${n} de ${g.questions.length}` : `${g.questions.length} preguntas`}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={t.textMuted} />
                </Pressable>
              </View>
              {expanded
                ? g.questions.map((q) => {
                    const dup = existing.has(promptKey(q));
                    const on = picked.has(q.id);
                    const info = questionTypeInfo(q.type);
                    return (
                      <Pressable key={q.id} disabled={dup} onPress={() => toggle([q], !on)} style={[styles.row, { borderTopColor: t.border, backgroundColor: on ? t.primary + '10' : 'transparent', opacity: dup ? 0.55 : 1 }]}>
                        <CheckBox on={on || dup} disabled={dup} label={plainText(q.prompt)} onPress={() => toggle([q], !on)} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: t.text, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                            {plainText(q.prompt).trim() || '(sin enunciado)'}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <Ionicons name={info.icon as IconName} size={13} color={t.textMuted} />
                            <Text style={{ color: t.textMuted, fontSize: 11 }}>
                              {info.label} · {q.points} pts
                            </Text>
                            {dup ? <Pill text="Ya está en el examen" color={t.success} /> : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                : null}
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.foot, { borderTopColor: t.border }]}>
        <Text style={{ color: t.textMuted, fontSize: 13, flex: 1, minWidth: 180 }}>
          {picked.size ? `${picked.size} pregunta(s) seleccionada(s). Se agregan como copia: puedes editarlas sin cambiar el banco.` : 'Marca preguntas sueltas o un tema completo.'}
        </Text>
        {picked.size ? <Button label="Quitar selección" onPress={() => setPicked(new Map())} /> : null}
        <Button label={picked.size ? `Agregar ${picked.size} pregunta${picked.size === 1 ? '' : 's'}` : 'Agregar'} icon="add-circle-outline" kind="primary" disabled={!picked.size} onPress={() => onAdd([...picked.values()])} />
      </View>
    </ModalShell>
  );
}

function CheckBox({ on, partial, disabled, label, onPress }: { on: boolean; partial?: boolean; disabled?: boolean; label: string; onPress(): void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: partial ? 'mixed' : on, disabled }}
      accessibilityLabel={label}
      style={[styles.check, { borderColor: on || partial ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface, opacity: disabled && !on ? 0.4 : 1 }]}
    >
      {on ? <Ionicons name="checkmark" size={15} color="#fff" /> : partial ? <View style={{ width: 10, height: 2, backgroundColor: t.primary }} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexGrow: 0 },
  group: { borderWidth: 1, borderRadius: 10, marginBottom: 8, overflow: 'hidden' },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  check: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  foot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
