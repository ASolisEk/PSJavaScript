/** Piezas comunes de las pantallas del alumno: contenedores, aviso de conexión y salida. */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useApp } from '../../../store/app';
import { useStudent } from '../../../store/student';
import { confirmDialog } from '../../../ui/platform';
import { BORDER, RADIUS, SCRIM, useTheme } from '../../../ui/theme';
import { Banner } from '../kit';
import { exitFullscreen } from '../lockdown';

export function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>{children}</View>;
}

export function Narrow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '100%', maxWidth: 620 }}>{children}</View>
    </ScrollView>
  );
}

// ───────────────────────────── esperando / instrucciones ─────────────────────────────

export function NetBanner() {
  const t = useTheme();
  const net = useStudent((s) => s.net);
  const detail = useStudent((s) => s.netDetail);
  if (net === 'online') return null;
  if (net === 'connecting') return <Banner icon="sync-outline" color={t.info} text={detail ?? 'Conectando con el maestro…'} />;
  return (
    <Banner
      icon="cloud-offline-outline"
      color={t.warning}
      text={`${detail ?? 'Sin conexión con el maestro.'} Puedes seguir respondiendo: tus respuestas se guardan y se enviarán al reconectar.`}
      action={{ label: 'Reintentar', onPress: () => useStudent.getState().retry() }}
    />
  );
}

/** Dónde presenta el alumno: la sala del maestro o su práctica individual. */
export function placeLabel(s: { code: string; transport: { kind: string } }): string {
  return s.transport.kind === 'practice' ? 'Práctica individual' : `Sala ${s.code}`;
}

export async function confirmLeave() {
  const practice = useStudent.getState().session?.transport.kind === 'practice';
  const ok = practice
    ? await confirmDialog('¿Salir de la práctica?', 'Se perderán las respuestas de este intento.', 'Salir')
    : await confirmDialog('¿Abandonar el examen?', 'Tu maestro verá que saliste. Si ya comenzaste, lo que no hayas enviado no se calificará.', 'Abandonar');
  if (!ok) return;
  exitFullscreen();
  useStudent.getState().leave();
  useApp.getState().setAppMode('ide');
}

export const styles = StyleSheet.create({
  teacherComment: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, marginTop: 6 },
  examHeaderNarrow: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: BORDER },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  examHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: BORDER, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  fontBox: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, marginRight: 4 },
  fontBtn: { paddingHorizontal: 8, height: 32, alignItems: 'center', justifyContent: 'center' },
  timer: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.lg, paddingHorizontal: 10, paddingVertical: 5 },
  side: { width: 210, padding: 14, borderRightWidth: BORDER },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navRow: { paddingHorizontal: 10, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  navBtn: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  flagDot: { position: 'absolute', top: -3, right: -3, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  footerNav: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 24 },
  overlay: { flex: 1, backgroundColor: SCRIM, alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 520, maxHeight: '90%', borderRadius: RADIUS.lg, borderWidth: BORDER, padding: 20 },
  topicRow: { flex: 1, borderWidth: BORDER, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 5 },
  topicFilter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: BORDER, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  practiceBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6 },
  topicBtn: { borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, flexGrow: 1, flexBasis: 160 },
  jump: { minWidth: 36, height: 32, borderWidth: BORDER, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cover: { alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
  watermark: { position: 'absolute', top: '-60%', left: '-60%', width: '220%', height: '220%', justifyContent: 'center', transform: [{ rotate: '-24deg' }] },
  sending: { backgroundColor: SCRIM, alignItems: 'center', justifyContent: 'center', padding: 20 },
});
