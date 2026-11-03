/** Modo Maestro: diseñar exámenes, aplicarlos en una sala y revisar resultados. */
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentPhase } from '../../core/exam/room';
import { useApp } from '../../store/app';
import { AUTO_LOCK_MS, TeacherTab, useTeacher } from '../../store/teacher';
import { BORDER, useTheme } from '../../ui/theme';
import { BackToEditorButton, Button, Tab, useIsPhone } from '../ui';
import { Banner, ScreenHeader } from '../exam/kit';
import BuilderTab from './BuilderTab';
import LibraryTab from './LibraryTab';
import ResultsTab from './ResultsTab';
import RoomTab from './RoomTab';
import { LockScreen } from './Security';

export default function TeacherScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const phone = useIsPhone();
  const hydrated = useTeacher((s) => s.hydrated);
  const tab = useTeacher((s) => s.tab);
  const room = useTeacher((s) => s.room);
  const live = useTeacher((s) => s.live);
  const storageWarning = useTeacher((s) => s.storageWarning);
  const secured = useTeacher((s) => s.secured);
  const locked = useTeacher((s) => s.locked);
  const lastActivity = useRef(0);
  const working = useTeacher((s) => (s.room ? Object.values(s.room.students).filter((x) => studentPhase(x, s.room!) === 'working').length : 0));

  useEffect(() => {
    useTeacher.getState().hydrate();
  }, []);

  // con contraseña, se bloquea solo tras un rato sin actividad
  useEffect(() => {
    if (!secured || locked) return;
    lastActivity.current = Date.now();
    const touch = () => {
      lastActivity.current = Date.now();
    };
    const web = Platform.OS === 'web' && typeof document !== 'undefined';
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    if (web) events.forEach((e) => document.addEventListener(e, touch, { passive: true, capture: true }));
    const h = setInterval(() => {
      if (Date.now() - lastActivity.current > AUTO_LOCK_MS) useTeacher.getState().lock();
    }, 15_000);
    return () => {
      clearInterval(h);
      if (web) events.forEach((e) => document.removeEventListener(e, touch, { capture: true }));
    };
  }, [secured, locked]);

  const leave = () => {
    // al salir del modo Maestro protegido se bloquea
    useTeacher.getState().lock();
    useApp.getState().setAppMode('ide');
  };

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
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {secured && !locked ? <Button label={phone ? '' : 'Bloquear'} icon="lock-closed-outline" kind="ghost" onPress={() => useTeacher.getState().lock()} /> : null}
              <BackToEditorButton onPress={leave} />
            </View>
          }
        />
        {hydrated && locked ? null : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabs, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
          {tabs.map((x) => (
            <Tab key={x.id} label={x.label} icon={x.icon} active={tab === x.id} onPress={() => useTeacher.getState().setTab(x.id)} badge={x.badge} compact={phone} />
          ))}
        </ScrollView>
        )}
        {storageWarning ? (
          <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
            <Banner icon="warning-outline" color={t.warning} text={storageWarning} onClose={() => useTeacher.getState().dismissStorageWarning()} />
          </View>
        ) : null}
        <View
          style={{ flex: 1 }}
          onTouchStart={() => {
            lastActivity.current = Date.now();
          }}
        >
          {!hydrated ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={t.primary} />
            </View>
          ) : locked ? (
            <LockScreen />
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
  tabs: { flexGrow: 0, borderBottomWidth: BORDER },
});
