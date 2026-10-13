/** Modo Maestro: diseñar exámenes, aplicarlos en una sala y revisar resultados. */
import React, { useEffect } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentPhase } from '../../core/exam/room';
import { useApp } from '../../store/app';
import { TeacherTab, useTeacher } from '../../store/teacher';
import { useTheme } from '../../ui/theme';
import { Button, Tab } from '../ui';
import { ScreenHeader } from '../exam/kit';
import BuilderTab from './BuilderTab';
import LibraryTab from './LibraryTab';
import ResultsTab from './ResultsTab';
import RoomTab from './RoomTab';

export default function TeacherScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const hydrated = useTeacher((s) => s.hydrated);
  const tab = useTeacher((s) => s.tab);
  const room = useTeacher((s) => s.room);
  const live = useTeacher((s) => s.live);
  const working = useTeacher((s) => (s.room ? Object.values(s.room.students).filter((x) => studentPhase(x, s.room!) === 'working').length : 0));

  useEffect(() => {
    useTeacher.getState().hydrate();
  }, []);

  const tabs: { id: TeacherTab; label: string; icon: any; badge?: number | string }[] = [
    { id: 'library', label: 'Mis exámenes', icon: 'documents-outline' },
    { id: 'editor', label: 'Editor', icon: 'create-outline' },
    { id: 'room', label: 'Sala en vivo', icon: 'radio-outline', badge: room && room.status !== 'closed' ? (live ? working || '●' : '!') : undefined },
    { id: 'results', label: 'Resultados', icon: 'bar-chart-outline' },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>
        <ScreenHeader
          icon="easel-outline"
          title="Modo Maestro"
          subtitle={room && live && room.status !== 'closed' ? `Sala ${room.code} abierta · ${Object.keys(room.students).length} alumno(s)` : 'Crea, aplica y califica exámenes de programación'}
          color={t.accent}
          right={<Button label="Volver al editor" icon="arrow-back" onPress={() => useApp.getState().setAppMode('ide')} />}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabs, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
          {tabs.map((x) => (
            <Tab key={x.id} label={x.label} icon={x.icon} active={tab === x.id} onPress={() => useTeacher.getState().setTab(x.id)} badge={x.badge} />
          ))}
        </ScrollView>
        <View style={{ flex: 1 }}>
          {!hydrated ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={t.primary} />
            </View>
          ) : tab === 'library' ? (
            <LibraryTab />
          ) : tab === 'editor' ? (
            <BuilderTab />
          ) : tab === 'room' ? (
            <RoomTab />
          ) : (
            <ResultsTab />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth },
});
