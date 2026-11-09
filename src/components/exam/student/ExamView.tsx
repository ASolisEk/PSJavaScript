/** El examen: preguntas, tiempo, guardado, examen bloqueado (pantalla completa, foco, pegar) y entrega. */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../../ui/text';
import { isAnswered } from '../../../core/exam/paper';
import type { Activity, PaperQuestion } from '../../../core/exam/types';
import { idleMs, serverNow, useStudent } from '../../../store/student';
import { BORDER, MONO, useTheme } from '../../../ui/theme';
import { Button, Heading } from '../../ui';
import { Banner, Card, formatDuration, IconName, Pill, ProgressBar } from '../kit';
import { useExamLockdown } from '../lockdown';
import QuestionView from '../QuestionView';

import { NetBanner, styles } from './shared';

// ───────────────────────────── el examen ─────────────────────────────

export function useExamGuards(trackFocus: boolean, blockPaste: boolean, onPasteBlocked: () => void) {
  const away = useRef<number | null>(null);
  useEffect(() => {
    const st = useStudent.getState();
    const leaveWindow = () => {
      if (away.current !== null) return;
      away.current = Date.now();
      st.setActivity('away');
      st.report('blur');
    };
    const backToWindow = () => {
      if (away.current === null) return;
      const ms = Date.now() - away.current;
      away.current = null;
      st.setActivity('reading');
      st.report('focus', undefined, ms);
    };
    const cleanups: (() => void)[] = [];
    if (trackFocus) {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const vis = () => (document.visibilityState === 'hidden' ? leaveWindow() : backToWindow());
        document.addEventListener('visibilitychange', vis);
        window.addEventListener('blur', leaveWindow);
        window.addEventListener('focus', backToWindow);
        cleanups.push(() => {
          document.removeEventListener('visibilitychange', vis);
          window.removeEventListener('blur', leaveWindow);
          window.removeEventListener('focus', backToWindow);
        });
      } else {
        const sub = AppState.addEventListener('change', (s) => (s === 'active' ? backToWindow() : leaveWindow()));
        cleanups.push(() => sub.remove());
      }
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (blockPaste) {
        const stop = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          st.report('paste');
          onPasteBlocked();
        };
        document.addEventListener('paste', stop, true);
        document.addEventListener('drop', stop, true);
        cleanups.push(() => {
          document.removeEventListener('paste', stop, true);
          document.removeEventListener('drop', stop, true);
        });
      }
      const beforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', beforeUnload);
      cleanups.push(() => window.removeEventListener('beforeunload', beforeUnload));
    }
    return () => cleanups.forEach((c) => c());
  }, [trackFocus, blockPaste, onPasteBlocked]);
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Minutos restantes en los que se avisa al alumno. */
export const TIME_WARNINGS = [10, 5, 1];

export function Timer({ deadline, onExpire, onWarn }: { deadline: number | null; onExpire(): void; onWarn(minutes: number): void }) {
  const t = useTheme();
  const [now, setNow] = useState(serverNow);
  const fired = useRef(false);
  const prevLeft = useRef<number | null>(null);
  useEffect(() => {
    const h = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(h);
  }, []);
  const left = deadline === null ? Infinity : deadline - now;
  const expired = left <= 0;
  useEffect(() => {
    if (!expired) fired.current = false;
    else if (!fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [expired, onExpire]);
  // avisa al cruzar 10, 5 y 1 minuto (no al abrir si ya pasó ese momento)
  useEffect(() => {
    if (!Number.isFinite(left)) return;
    const prev = prevLeft.current;
    prevLeft.current = left;
    if (prev === null) return;
    const crossed = TIME_WARNINGS.find((m) => prev > m * 60_000 && left <= m * 60_000 && left > 0);
    if (crossed) onWarn(crossed);
  }, [left, onWarn]);
  if (deadline === null) return <Pill icon="infinite-outline" text="Sin límite" color={t.textMuted} />;
  const color = left < 60_000 ? t.danger : left < 5 * 60_000 ? t.warning : t.success;
  return (
    <View style={[styles.timer, { borderColor: color, backgroundColor: color + '15' }]}>
      <Ionicons name="time-outline" size={16} color={color} />
      <Text style={{ color, fontWeight: '800', fontFamily: MONO, fontSize: 15, marginLeft: 5 }}>{formatDuration(left)}</Text>
    </View>
  );
}

export function ExamView() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const s = useStudent((x) => x.session)!;
  const banner = useStudent((x) => x.banner);
  const net = useStudent((x) => x.net);
  const pendingSync = useStudent((x) => x.pendingSync);
  const paper = s.paper!;
  const fontSize = s.fontSize ?? 14;
  const st = useStudent.getState();
  const q = paper.questions[s.current] ?? paper.questions[0];
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const answered = paper.questions.filter((x) => isAnswered(x, s.answers[x.id])).length;

  const onPasteBlocked = useCallback(() => {
    setToast('Pegar texto está desactivado durante el examen.');
    setTimeout(() => setToast(null), 2500);
  }, []);
  useExamGuards(paper.settings.trackFocus, paper.settings.blockPaste, onPasteBlocked);
  // examen bloqueado (en la sala del maestro; la práctica individual queda libre)
  const lock = useExamLockdown(s.transport.kind !== 'practice', useCallback((detail: string) => useStudent.getState().report('lockdown', detail), []));

  // sin actividad por un rato
  useEffect(() => {
    const h = setInterval(() => {
      if (idleMs() > 90_000) useStudent.getState().setActivity('idle');
    }, 15_000);
    return () => clearInterval(h);
  }, []);
  const touch = (a: Activity) => st.touch(a);

  const currentIndex = s.current;
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [currentIndex]);

  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const onWarn = useCallback((minutes: number) => {
    setTimeWarning(minutes === 1 ? '¡Queda 1 minuto! Al terminarse, tu examen se enviará solo.' : `Quedan ${minutes} minutos.`);
    setTimeout(() => setTimeWarning(null), 10_000);
    if (Platform.OS === 'web') {
      try {
        navigator.vibrate?.(minutes === 1 ? [200, 100, 200] : 200);
      } catch {
        /* sin vibración */
      }
    } else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [setTimeWarning]);

  const timeUp = useCallback(() => {
    if (useStudent.getState().session?.phase === 'exam') useStudent.getState().submit('timeout');
  }, []);

  const go = (i: number) => st.goTo(i);

  // atajos de teclado (web): ← → para moverse, letras para elegir opción, V/F
  const keyState = useRef({ q, current: s.current, total: paper.questions.length, confirm, answers: s.answers });
  useEffect(() => {
    keyState.current = { q, current: s.current, total: paper.questions.length, confirm, answers: s.answers };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const k = keyState.current;
      if (k.confirm || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const student = useStudent.getState();
      if (student.session?.phase !== 'exam' || student.session.submitting) return;
      const key = e.key.toLowerCase();
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        student.goTo(k.current + (e.key === 'ArrowRight' ? 1 : -1));
        return;
      }
      const { q: cur } = k;
      if (cur.type === 'truefalse' && (key === 'v' || key === 'f')) {
        student.touch('answering');
        student.setAnswer(cur.id, key === 'v');
        return;
      }
      if ((cur.type === 'single' || cur.type === 'multiple') && /^[a-z]$/.test(key)) {
        const opt = cur.options?.[key.charCodeAt(0) - 97];
        if (!opt) return;
        student.touch('answering');
        if (cur.type === 'single') student.setAnswer(cur.id, opt.id);
        else {
          const prev = k.answers[cur.id];
          const sel = Array.isArray(prev) ? prev : [];
          student.setAnswer(cur.id, sel.includes(opt.id) ? sel.filter((x) => x !== opt.id) : [...sel, opt.id]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // la lista de preguntas sigue a la pregunta actual (en el celular y en la barra lateral)
  const navScroll = useRef<ScrollView>(null);
  const navPos = useRef<Record<number, { x: number; y: number }>>({});
  const [navSize, setNavSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const p = navPos.current[currentIndex];
    if (!p || !navScroll.current) return;
    if (wide) navScroll.current.scrollTo({ y: Math.max(0, p.y - navSize.h / 2 + 19), animated: true });
    else navScroll.current.scrollTo({ x: Math.max(0, p.x - navSize.w / 2 + 19), animated: true });
  }, [currentIndex, wide, navSize]);

  const nav = (
    <ScrollView
      ref={navScroll}
      horizontal={!wide}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={wide ? styles.navGrid : styles.navRow}
      onLayout={(e) => setNavSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {paper.questions.map((x, i) => {
        const done = isAnswered(x, s.answers[x.id]);
        const cur = i === s.current;
        const flag = s.flagged.includes(x.id);
        return (
          <Pressable
            key={x.id}
            onLayout={(e) => {
              navPos.current[i] = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y };
            }}
            onPress={() => go(i)}
            accessibilityLabel={`Pregunta ${i + 1}${done ? ', respondida' : ''}${flag ? ', marcada' : ''}`}
            style={[styles.navBtn, { borderColor: cur ? t.primary : done ? t.primary + '88' : t.border, backgroundColor: done ? t.primary : t.surface, borderWidth: cur ? 2.5 : 1 }]}
          >
            <Text style={{ color: done ? '#fff' : t.text, fontWeight: '800', fontSize: 13 }}>{i + 1}</Text>
            {flag ? <View style={[styles.flagDot, { backgroundColor: t.warning, borderColor: t.surface }]} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const narrow = width < 600;
  const status = (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: narrow ? 0 : 2, flex: narrow ? 1 : undefined }}>
      <View style={[styles.dot, { backgroundColor: net === 'online' ? t.success : net === 'connecting' ? t.info : t.warning }]} />
      <Text style={{ color: t.textMuted, fontSize: 12, flexShrink: 1 }} numberOfLines={1}>
        {narrow ? '' : `${s.identity.name} · `}
        {answered}/{paper.questions.length}
        {narrow ? '' : ' respondidas'} ·{' '}
        <Text style={{ color: net !== 'online' ? t.warning : pendingSync ? t.textMuted : t.success }}>
          {net !== 'online' ? (narrow ? 'sin conexión, guardado aquí' : 'guardado en este dispositivo') : pendingSync ? 'guardando…' : 'guardado ✓'}
        </Text>
      </Text>
    </View>
  );
  const fontControls = (
    <View style={[styles.fontBox, { borderColor: t.border }]}>
      <Pressable onPress={() => st.setFontSize(fontSize - 2)} hitSlop={6} accessibilityLabel="Letra más pequeña" style={styles.fontBtn}>
        <Text style={{ color: t.text, fontSize: 12, fontWeight: '800' }}>A−</Text>
      </Pressable>
      <Pressable onPress={() => st.setFontSize(fontSize + 2)} hitSlop={6} accessibilityLabel="Letra más grande" style={styles.fontBtn}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>A+</Text>
      </Pressable>
    </View>
  );
  const openSubmit = () => {
    setConfirm(true);
    touch('reviewing');
  };
  const sendButton = <Button label={narrow ? 'Terminar' : 'Terminar examen'} icon="checkmark-done-outline" kind="primary" onPress={openSubmit} style={{ marginLeft: narrow ? 0 : 8 }} disabled={s.submitting} />;
  const title = (
    <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, flexShrink: 1 }} numberOfLines={1}>
      {paper.title}
    </Text>
  );

  return (
    <View style={{ flex: 1 }}>
      {narrow ? (
        // en el celular: título y tiempo arriba; avance, letra y enviar abajo (sin que nada se corte)
        <View style={[styles.examHeaderNarrow, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>{title}</View>
            <Timer deadline={s.deadline} onExpire={timeUp} onWarn={onWarn} />
          </View>
          <View style={[styles.headerRow, { marginTop: 6 }]}>
            {status}
            {fontControls}
            {sendButton}
          </View>
        </View>
      ) : (
        <View style={[styles.examHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <View style={{ flex: 1, minWidth: 140 }}>
            {title}
            {status}
          </View>
          {fontControls}
          <Timer deadline={s.deadline} onExpire={timeUp} onWarn={onWarn} />
          {sendButton}
        </View>
      )}
      <ProgressBar value={answered / Math.max(1, paper.questions.length)} height={3} style={{ borderRadius: 0 }} />

      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
        {wide ? (
          <View style={[styles.side, { borderRightColor: t.border, backgroundColor: t.surface }]}>
            <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 }}>PREGUNTAS</Text>
            {nav}
            <View style={{ marginTop: 14 }}>
              <Legend color={t.primary} text="Respondida" filled />
              <Legend color={t.border} text="Sin responder" />
              <Legend color={t.warning} text="Marcada para revisar" dot />
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: t.surface, borderBottomWidth: BORDER, borderBottomColor: t.border }}>{nav}</View>
        )}
        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', maxWidth: 900 }}>
            <NetBanner />
            {banner ? <Banner icon="megaphone-outline" color={t.accent} text={`Aviso del maestro: ${banner}`} onClose={() => st.dismissBanner()} /> : null}
            {timeWarning ? <Banner icon="alarm-outline" color={t.danger} text={timeWarning} onClose={() => setTimeWarning(null)} /> : null}
            {toast ? <Banner icon="hand-left-outline" color={t.danger} text={toast} /> : null}
            {lock.devtools ? <Banner icon="construct-outline" color={t.danger} text="Cierra las herramientas de desarrollo del navegador. Tu maestro ya recibió un aviso." /> : null}
            <Card>
              <QuestionView
                q={q}
                index={s.current}
                total={paper.questions.length}
                value={s.answers[q.id]}
                onChange={(v) => {
                  touch(q.type === 'code' ? 'coding' : 'answering');
                  st.setAnswer(q.id, v);
                }}
                settings={paper.settings}
                flagged={s.flagged.includes(q.id)}
                onToggleFlag={() => st.toggleFlag(q.id)}
                onRun={(d) => st.report('run', d)}
                onTest={(d) => st.report('test', d)}
                onBusy={(k) => touch(k ?? 'coding')}
                fontSize={fontSize}
              />
            </Card>
            <View style={styles.footerNav}>
              <Button label="Anterior" icon="chevron-back" onPress={() => go(s.current - 1)} disabled={s.current === 0} />
              <View style={{ flex: 1 }} />
              {s.current < paper.questions.length - 1 ? (
                <Button label="Siguiente" icon="chevron-forward" kind="primary" onPress={() => go(s.current + 1)} />
              ) : (
                <Button label="Revisar y terminar" icon="checkmark-done-outline" kind="primary" onPress={openSubmit} />
              )}
            </View>
            {wide && Platform.OS === 'web' ? (
              <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center', marginTop: -12, marginBottom: 24 }}>
                Atajos: ← → para cambiar de pregunta
                {q.type === 'single' || q.type === 'multiple' ? ` · A–${LETTERS[Math.max(0, (q.options?.length ?? 1) - 1)]} para elegir` : q.type === 'truefalse' ? ' · V o F para responder' : ''}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </View>
      {s.transport.kind !== 'practice' ? <Watermark text={`${s.identity.name} · Sala ${s.code}`} /> : null}
      {lock.cover && !s.submitting ? <LockCover reason={lock.cover} onResume={lock.resume} /> : null}
      {confirm && !lock.cover ? (
        <SubmitDialog
          questions={paper.questions}
          onCancel={() => {
            setConfirm(false);
            touch('reading');
          }}
          onGo={(i) => {
            setConfirm(false);
            go(i);
          }}
          onSubmit={() => {
            setConfirm(false);
            st.submit('manual');
          }}
        />
      ) : null}
      {s.submitting ? (
        <View style={[StyleSheet.absoluteFill, styles.sending]}>
          <Card style={{ alignItems: 'center', padding: 24 }}>
            <ActivityIndicator color={t.primary} size="large" />
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 16, marginTop: 12 }}>Enviando tu examen…</Text>
            <Text style={{ color: t.textMuted, marginTop: 4, textAlign: 'center' }}>{net === 'online' ? 'Calificando, espera un momento.' : 'Sin conexión: se enviará en cuanto se recupere. No cierres esta ventana.'}</Text>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Marca de agua con el nombre del alumno y la sala sobre todo el examen: si alguien
 * fotografía o captura la pantalla, se sabe de quién es. No estorba al tocar ni al leer.
 */
export function Watermark({ text }: { text: string }) {
  const t = useTheme();
  const row = Array.from({ length: 6 }, () => text).join('        ');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: 40 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.watermark}>
        {Array.from({ length: 22 }, (_, i) => (
          <Text key={i} numberOfLines={1} style={{ color: t.text, opacity: t.dark ? 0.07 : 0.055, fontSize: 15, fontWeight: '800', marginBottom: 56, marginLeft: (i % 2) * 120 }}>
            {row}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Oculta el examen mientras el alumno no está en pantalla completa o está en otra ventana. */
export function LockCover({ reason, onResume }: { reason: 'fullscreen' | 'away'; onResume(): void }) {
  const t = useTheme();
  const fs = reason === 'fullscreen';
  return (
    <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: t.bg }]} accessibilityViewIsModal>
      <Card accent={t.danger} style={{ alignItems: 'center', padding: 24, maxWidth: 460, width: '100%' }}>
        <Ionicons name={fs ? 'expand-outline' : 'eye-off-outline'} size={44} color={t.danger} />
        <Heading style={{ marginTop: 8, textAlign: 'center' }}>{fs ? 'El examen sigue en pantalla completa' : 'Regresa a tu examen'}</Heading>
        <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          {fs
            ? 'No puedes salir de pantalla completa hasta terminar el examen. Toca cualquier parte o presiona una tecla para volver.'
            : Platform.OS === 'web'
              ? 'Cambiaste de ventana o de pestaña.'
              : 'Saliste de la app del examen.'}{' '}
          Tu maestro ya recibió un aviso. El tiempo sigue corriendo y tus respuestas están guardadas.
        </Text>
        <Button label={fs ? 'Volver a pantalla completa' : 'Continuar el examen'} icon={fs ? 'expand-outline' : 'play'} kind="primary" onPress={onResume} style={{ marginTop: 16, height: 46 }} />
      </Card>
    </View>
  );
}

export function Legend({ color, text, filled, dot }: { color: string; text: string; filled?: boolean; dot?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <View style={{ width: dot ? 10 : 16, height: dot ? 10 : 16, borderRadius: dot ? 5 : 5, borderWidth: BORDER, borderColor: color, backgroundColor: filled || dot ? color : 'transparent', marginRight: 8, marginLeft: dot ? 3 : 0 }} />
      <Text style={{ color: t.textMuted, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

export function SubmitDialog({ questions, onCancel, onSubmit, onGo }: { questions: PaperQuestion[]; onCancel(): void; onSubmit(): void; onGo(i: number): void }) {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const pending = questions.map((q, i) => ({ q, i })).filter(({ q }) => !isAnswered(q, s.answers[q.id]));
  const flagged = questions.map((q, i) => ({ q, i })).filter(({ q }) => s.flagged.includes(q.id));
  const left = s.deadline === null ? null : s.deadline - serverNow();
  const all = !pending.length && !flagged.length;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: t.surface, borderColor: t.border }]}>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 4 }}>
            <Heading level="title" style={{ marginBottom: 6 }}>{all ? '¡Respondiste todo! ¿Terminar tu examen?' : '¿Terminar tu examen?'}</Heading>
            <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 12 }}>
              Se enviará a calificar y ya no podrás cambiar tus respuestas.
              {left !== null && left > 60_000 ? ` Aún te quedan ${formatDuration(left)}.` : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Pill icon="checkmark-done-outline" color={t.success} text={`${questions.length - pending.length} de ${questions.length} respondidas`} />
            </View>
            <JumpList title={`Sin responder (${pending.length})`} icon="alert-circle-outline" color={t.danger} items={pending.map((x) => x.i)} onGo={onGo} />
            <JumpList title={`Marcadas para revisar (${flagged.length})`} icon="flag-outline" color={t.warning} items={flagged.map((x) => x.i)} onGo={onGo} />
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <Button label="Seguir respondiendo" onPress={onCancel} />
            <Button label="Sí, terminar y enviar" icon="paper-plane" kind="primary" onPress={onSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Números de pregunta a los que se puede saltar desde la confirmación de envío. */
export function JumpList({ title, icon, color, items, onGo }: { title: string; icon: IconName; color: string; items: number[]; onGo(i: number): void }) {
  const t = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={{ color: t.text, fontSize: 13, fontWeight: '700', marginLeft: 5 }}>{title}</Text>
        <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 6 }}>· toca un número para ir</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((i) => (
          <Pressable key={i} onPress={() => onGo(i)} accessibilityRole="button" accessibilityLabel={`Ir a la pregunta ${i + 1}`} style={({ pressed }) => [styles.jump, { borderColor: color + '88', backgroundColor: pressed ? color + '30' : color + '12' }]}>
            <Text style={{ color: t.text, fontSize: 13, fontWeight: '800' }}>{i + 1}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
