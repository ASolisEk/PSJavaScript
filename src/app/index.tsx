import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import IDE from '../components/IDE';
import StudentScreen from '../components/exam/StudentScreen';
import TeacherScreen from '../components/teacher/TeacherScreen';
import { AppMode, useApp } from '../store/app';
import { hasActiveExam, useStudent } from '../store/student';
import { useTeacher } from '../store/teacher';
import { readExamLink, rememberedMode } from '../ui/examLink';

export default function Home() {
  const mode = useApp((s) => s.appMode);

  // Al abrir: retoma un examen en curso (alumno), entra con ?sala=CODIGO o vuelve a la sala abierta (maestro).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      useApp.getState().hydrate();
      const session = await useStudent.getState().hydrate();
      await useTeacher.getState().hydrate();
      if (cancelled) return;
      const { setAppMode } = useApp.getState();
      const teacher = useTeacher.getState();
      const roomOpen = !!teacher.room && teacher.room.status !== 'closed';
      // el modo de esta pestaña tiene prioridad (maestro y alumno pueden compartir navegador al probar)
      const remembered = rememberedMode();
      let next: AppMode = 'ide';
      if (readExamLink()) next = 'student';
      else if (remembered === 'teacher' || remembered === 'ide') next = remembered;
      else if (remembered === 'student') next = session ? 'student' : 'ide';
      else if (hasActiveExam(session)) next = 'student';
      else if (roomOpen) next = 'teacher';
      // la sala del maestro sigue funcionando aunque esté en el editor
      if (roomOpen && next !== 'student') {
        teacher.reopenRoom();
        if (next === 'teacher') teacher.setTab('room');
      }
      if (next !== 'ide') setAppMode(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // el maestro no debe cerrar la pestaña mientras su sala recibe exámenes (aunque esté en el editor)
  const roomLive = useTeacher((s) => s.live && !!s.room && s.room.status !== 'closed');
  useEffect(() => {
    if (Platform.OS !== 'web' || !roomLive) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    // evita que la pantalla se apague o el equipo se suspenda (la sala dejaría de recibir exámenes)
    let lock: any = null;
    let active = true;
    const acquire = () => {
      const wl = (navigator as any).wakeLock;
      if (!wl || document.visibilityState !== 'visible') return;
      wl.request('screen')
        .then((l: any) => {
          if (active) lock = l;
          else l.release?.();
        })
        .catch(() => {});
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      active = false;
      window.removeEventListener('beforeunload', h);
      document.removeEventListener('visibilitychange', acquire);
      lock?.release?.().catch?.(() => {});
    };
  }, [roomLive]);

  return (
    <>
      <Stack.Screen options={{ title: mode === 'teacher' ? 'PSJavaScript · Maestro' : mode === 'student' ? 'PSJavaScript · Examen' : 'PSJavaScript' }} />
      {mode === 'teacher' ? <TeacherScreen /> : mode === 'student' ? <StudentScreen /> : <IDE />}
    </>
  );
}
