/** Elegir entre el modo Maestro y el modo Examen (alumno). */
import React from 'react';
import { ScrollView } from 'react-native';
import { Text } from '../../ui/text';
import { useApp } from '../../store/app';
import { useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { BigChoice } from './kit';

export default function ExamChooserModal() {
  const t = useTheme();
  const { setModal, setAppMode } = useApp.getState();
  return (
    <ModalShell title="Exámenes" onClose={() => setModal(null)}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 14 }}>¿Qué quieres hacer?</Text>
        <BigChoice
          icon="easel-outline"
          color={t.accent}
          title="Soy maestro"
          description="Diseña exámenes con distintos tipos de ejercicios, ábrelos en una sala con código, observa el avance de cada alumno y obtén el concentrado de calificaciones."
          onPress={() => setAppMode('teacher')}
        />
        <BigChoice
          icon="school-outline"
          color={t.success}
          title="Soy alumno"
          description="Entra con el código de la sala que te dio tu maestro, o practica por tu cuenta para la certificación JavaScript de freeCodeCamp."
          onPress={() => setAppMode('student')}
        />
      </ScrollView>
    </ModalShell>
  );
}
