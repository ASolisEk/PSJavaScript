/** Guía rápida del modo Examen (para el maestro o para el alumno). */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../ui/text';
import { STUDENT_GUIDE, TEACHER_GUIDE } from '../../core/guides';
import { BORDER, RADIUS, useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import type { IconName } from '../ui';
import RichText from './RichText';

export default function GuideModal({ who, onClose }: { who: 'teacher' | 'student'; onClose(): void }) {
  const t = useTheme();
  const sections = who === 'teacher' ? TEACHER_GUIDE : STUDENT_GUIDE;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ModalShell title={who === 'teacher' ? 'Guía rápida del maestro' : 'Guía rápida del alumno'} onClose={onClose} wide={who === 'teacher'}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {sections.map((s, i) => (
          <View key={s.title} style={{ borderWidth: BORDER, borderColor: open === i ? t.accent : t.border, borderRadius: RADIUS.md, overflow: 'hidden' }}>
            <Pressable onPress={() => setOpen(open === i ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }} accessibilityRole="button" accessibilityState={{ expanded: open === i }}>
              <Ionicons name={s.icon as IconName} size={18} color={t.accent} />
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, flex: 1 }}>{s.title}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
            </Pressable>
            {open === i ? (
              <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                <RichText text={s.body} style={{ color: t.text, fontSize: 14, lineHeight: 21 }} />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </ModalShell>
  );
}
