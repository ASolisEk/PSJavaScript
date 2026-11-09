/**
 * Modo Examen (alumno). Sin ayuda, mascota, insertar ni archivos: solo el
 * examen. Se avisa al maestro si el alumno sale de la ventana o intenta pegar.
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudent } from '../../store/student';
import { useTheme } from '../../ui/theme';
import { Centered } from './student/shared';
import { JoinView } from './student/JoinView';
import { RejectedView, WaitingView } from './student/WaitingView';
import { ExamView } from './student/ExamView';
import { ResultView } from './student/ResultView';

export default function StudentScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const session = useStudent((s) => s.session);
  const hydrated = useStudent((s) => s.hydrated);

  useEffect(() => {
    useStudent
      .getState()
      .hydrate()
      .then(() => useStudent.getState().resume());
  }, []);

  let body: React.ReactNode;
  if (!hydrated) body = <Centered><ActivityIndicator color={t.primary} /></Centered>;
  else if (!session) body = <JoinView />;
  else if (session.phase === 'rejected') body = <RejectedView reason={session.rejectedReason ?? 'No fue posible entrar a la sala.'} />;
  else if (session.phase === 'submitted') body = <ResultView />;
  else if (session.phase === 'exam' && session.paper) body = <ExamView />;
  else body = <WaitingView />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>{body}</View>
    </KeyboardAvoidingView>
  );
}
