/**
 * Modo Examen (alumno). Sin ayuda, mascota, insertar ni archivos: solo el
 * examen. Se avisa al maestro si el alumno sale de la ventana o intenta pegar.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAnswered } from '../../core/exam/paper';
import { isValidRoomCode, normalizeRoomCode } from '../../core/exam/random';
import { defaultTransport, transportOptions, TransportSpec } from '../../core/exam/transport';
import { plainText } from '../../core/exam/richText';
import { CERTIFICATIONS, practiceKey } from '../../core/exam/certs';
import type { Activity, PaperQuestion, StudentResultView, TopicScore } from '../../core/exam/types';
import { useApp } from '../../store/app';
import { idleMs, serverNow, useStudent } from '../../store/student';
import { clearExamLink, readExamLink, rememberedStudent, rememberStudent } from '../../ui/examLink';
import { confirmDialog } from '../../ui/platform';
import { MONO, useTheme } from '../../ui/theme';
import { Button, Chip } from '../ui';
import { Banner, BigChoice, Card, Field, formatDuration, IconName, Pill, ProgressBar, ScreenHeader, TextField } from './kit';
import QuestionView from './QuestionView';
import RichText from './RichText';

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

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>{children}</View>;
}

function Narrow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '100%', maxWidth: 620 }}>{children}</View>
    </ScrollView>
  );
}

// ───────────────────────────── entrar a la sala ─────────────────────────────

function JoinView() {
  const t = useTheme();
  const [link] = useState(() => readExamLink());
  const [last] = useState(() => rememberedStudent());
  const joining = useStudent((s) => s.joining);
  const error = useStudent((s) => s.joinError);
  const [code, setCode] = useState(link?.code ?? '');
  const [name, setName] = useState(last.name);
  const [group, setGroup] = useState(last.group);
  const [spec, setSpec] = useState<TransportSpec>(link?.transport ?? defaultTransport());
  const [showNet, setShowNet] = useState(!!link?.transport && link.transport.kind !== 'internet');
  const options = transportOptions().filter((o) => o.available);
  const valid = isValidRoomCode(code) && name.trim().length >= 2 && (spec.kind !== 'lan' || !!spec.url?.trim());

  const join = async () => {
    if (!valid) return;
    rememberStudent({ name: name.trim(), group: group.trim() });
    const ok = await useStudent.getState().join({ code, name: name.trim(), group: group.trim(), transport: spec });
    if (ok) clearExamLink();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        icon="school-outline"
        title="Presentar examen"
        subtitle="Entra con el código que te dio tu maestro"
        color={t.success}
        right={<Button label="Volver al editor" icon="arrow-back" onPress={() => useApp.getState().setAppMode('ide')} />}
      />
      <Narrow>
        <Card>
          <Field label="Código de la sala" hint="Son 6 letras y números. No importan las mayúsculas.">
            <TextField
              value={code}
              onChangeText={(v) => setCode(normalizeRoomCode(v))}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              style={{ fontSize: 28, fontWeight: '800', letterSpacing: 8, textAlign: 'center', fontFamily: MONO, height: 60 }}
            />
          </Field>
          <Field label="Tu nombre completo">
            <TextField value={name} onChangeText={setName} placeholder="Nombre y apellidos" autoCapitalize="words" />
          </Field>
          <Field label="Grupo o matrícula (opcional)">
            <TextField value={group} onChangeText={setGroup} placeholder="Ej. 3°A o A01234" />
          </Field>

          <Pressable onPress={() => setShowNet((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name={showNet ? 'chevron-down' : 'chevron-forward'} size={16} color={t.textMuted} />
            <Text style={{ color: t.textMuted, fontSize: 13, marginLeft: 4 }}>
              Conexión: <Text style={{ color: t.text, fontWeight: '700' }}>{options.find((o) => o.kind === spec.kind)?.label ?? spec.kind}</Text> (cámbiala solo si tu maestro te lo indica)
            </Text>
          </Pressable>
          {showNet ? (
            <View style={{ marginBottom: 8 }}>
              {options.map((o) => (
                <BigChoice key={o.kind} icon={o.icon as IconName} title={o.label} description={o.description} selected={spec.kind === o.kind} onPress={() => setSpec({ kind: o.kind, url: o.kind === 'lan' ? spec.url ?? '' : undefined })} />
              ))}
              {spec.kind === 'lan' ? (
                <Field label="Dirección del servidor del aula" hint="La muestra el maestro, por ejemplo 192.168.1.10:8787">
                  <TextField value={spec.url ?? ''} onChangeText={(url) => setSpec({ kind: 'lan', url })} placeholder="192.168.1.10:8787" autoCapitalize="none" mono />
                </Field>
              ) : null}
            </View>
          ) : null}

          {error ? <Banner icon="alert-circle" color={t.danger} text={error} /> : null}
          <Button label={joining ? 'Conectando…' : 'Entrar a la sala'} icon="log-in-outline" kind="primary" onPress={join} disabled={!valid || joining} style={{ height: 46 }} />
        </Card>
        <PracticeCard name={name} />
        <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          Durante el examen no estarán disponibles la ayuda, la mascota, insertar comandos ni tus archivos. Tus respuestas se guardan en este dispositivo aunque se pierda la conexión.
        </Text>
      </Narrow>
    </View>
  );
}

/** Práctica individual para una certificación incluida (sin maestro ni código de sala). */
function PracticeCard({ name }: { name: string }) {
  const t = useTheme();
  const joining = useStudent((s) => s.joining);
  const [open, setOpen] = useState(false);
  const [certId, setCertId] = useState(CERTIFICATIONS[0].id);
  const cert = CERTIFICATIONS.find((c) => c.id === certId) ?? CERTIFICATIONS[0];
  const { full, topics } = cert.practiceOptions();
  const go = (key: string) => {
    if (joining) return;
    rememberStudent({ name: name.trim(), group: rememberedStudent().group });
    useStudent.getState().practice(practiceKey(cert.id, key), name);
  };
  return (
    <Card accent={t.accent}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Ionicons name="ribbon-outline" size={22} color={t.accent} />
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', flex: 1 }}>Practicar por mi cuenta</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }} accessibilityRole="tablist">
        {CERTIFICATIONS.map((c) => (
          <Chip key={c.id} label={c.short} active={c.id === cert.id} onPress={() => setCertId(c.id)} />
        ))}
      </View>
      <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>
        {cert.studentSummary} No necesitas código de sala; al terminar verás la respuesta correcta de cada pregunta.
      </Text>
      {full.map((o) => (
        <BigChoice key={o.key} icon={o.key === 'simulacro' ? 'timer-outline' : 'barbell-outline'} color={t.accent} title={o.title} description={o.description} onPress={() => go(o.key)} disabled={joining} />
      ))}
      <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: open ? 8 : 0 }} accessibilityRole="button">
        <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={16} color={t.textMuted} />
        <Text style={{ color: t.text, fontSize: 13, fontWeight: '700', marginLeft: 4 }}>Practicar un tema ({topics.length})</Text>
      </Pressable>
      {open ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {topics.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => go(o.key)}
              disabled={joining}
              style={({ pressed }) => [styles.topicBtn, { borderColor: t.border, backgroundColor: pressed ? t.surfaceAlt : t.surface }]}
              accessibilityRole="button"
              accessibilityLabel={`Practicar ${o.title}`}
            >
              <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{o.title}</Text>
              <Text style={{ color: t.textMuted, fontSize: 11 }}>{o.description}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

// ───────────────────────────── esperando / instrucciones ─────────────────────────────

function NetBanner() {
  const t = useTheme();
  const net = useStudent((s) => s.net);
  const detail = useStudent((s) => s.netDetail);
  if (net === 'online') return null;
  if (net === 'connecting') return <Banner icon="sync-outline" color={t.info} text="Conectando con el maestro…" />;
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
function placeLabel(s: { code: string; transport: { kind: string } }): string {
  return s.transport.kind === 'practice' ? 'Práctica individual' : `Sala ${s.code}`;
}

async function confirmLeave() {
  const practice = useStudent.getState().session?.transport.kind === 'practice';
  const ok = practice
    ? await confirmDialog('¿Salir de la práctica?', 'Se perderán las respuestas de este intento.', 'Salir')
    : await confirmDialog('¿Abandonar el examen?', 'Tu maestro verá que saliste. Si ya comenzaste, lo que no hayas enviado no se calificará.', 'Abandonar');
  if (!ok) return;
  useStudent.getState().leave();
  useApp.getState().setAppMode('ide');
}

function WaitingView() {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const room = s.room;
  const ready = s.phase === 'ready';
  if (s.roomClosed) return <EndedView />;
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader icon="school-outline" title={room?.title ?? 'Examen'} subtitle={`${placeLabel(s)} · ${s.identity.name}`} color={t.success} right={<Button label="Salir" icon="exit-outline" onPress={confirmLeave} />} />
      <Narrow>
        <NetBanner />
        {!room ? (
          <Card>
            <Centered>
              <ActivityIndicator color={t.primary} />
              <Text style={{ color: t.textMuted, marginTop: 10 }}>Entrando a la sala…</Text>
            </Centered>
          </Card>
        ) : (
          <>
            <Card accent={ready ? t.success : t.primary}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                {ready ? <Ionicons name="checkmark-circle" size={26} color={t.success} /> : <ActivityIndicator color={t.primary} />}
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginLeft: 10, flex: 1 }}>
                  {ready ? '¡El examen ya comenzó!' : 'Esperando a que el maestro inicie el examen…'}
                </Text>
              </View>
              <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>{room.description}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <Pill icon="help-circle-outline" text={`${room.questionCount} preguntas`} color={t.primary} />
                <Pill icon="time-outline" text={room.durationMin ? `${room.durationMin} minutos` : 'Sin límite de tiempo'} color={t.accent} />
              </View>
            </Card>
            <Card>
              <Text style={{ color: t.text, fontWeight: '800', marginBottom: 8 }}>
                <Ionicons name="lock-closed-outline" size={14} /> Durante el examen
              </Text>
              {room.restrictions.map((r) => (
                <Text key={r} style={{ color: t.textMuted, fontSize: 13, marginBottom: 4 }}>
                  • {r}: desactivado
                </Text>
              ))}
              <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>• Las preguntas aparecen en orden aleatorio.</Text>
              <Text style={{ color: t.textMuted, fontSize: 13 }}>• Tu maestro ve tu avance en tiempo real.</Text>
              {room.durationMin ? <Text style={{ color: t.textMuted, fontSize: 13 }}>• El tiempo empieza a contar al presionar «Comenzar». Al terminarse, tu examen se envía solo.</Text> : null}
            </Card>
            <Button label="Comenzar examen" icon="play" kind="primary" onPress={() => useStudent.getState().begin()} disabled={!ready} style={{ height: 50 }} />
          </>
        )}
      </Narrow>
    </View>
  );
}

/** La sala se cerró antes de que el alumno comenzara. */
function EndedView() {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const exit = () => {
    useStudent.getState().leave();
    useApp.getState().setAppMode('ide');
  };
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader icon="school-outline" title={s.room?.title ?? 'Examen'} subtitle={`${placeLabel(s)} · ${s.identity.name}`} color={t.success} />
      <Narrow>
        <Card accent={t.textMuted} style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="lock-closed-outline" size={44} color={t.textMuted} />
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', marginTop: 8 }}>El examen terminó</Text>
          <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            El maestro cerró la sala antes de que comenzaras tu examen. Si crees que es un error, avísale.
          </Text>
        </Card>
        <Button label="Salir del modo examen" icon="exit-outline" kind="primary" onPress={exit} style={{ height: 46 }} />
      </Narrow>
    </View>
  );
}

function RejectedView({ reason }: { reason: string }) {
  const t = useTheme();
  return (
    <Narrow>
      <Card accent={t.danger}>
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>No puedes entrar a esta sala</Text>
        <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 14 }}>{reason}</Text>
        <Button
          label="Volver"
          icon="arrow-back"
          kind="primary"
          onPress={() => {
            useStudent.getState().leave();
          }}
        />
      </Card>
    </Narrow>
  );
}

// ───────────────────────────── el examen ─────────────────────────────

function useExamGuards(trackFocus: boolean, blockPaste: boolean, onPasteBlocked: () => void) {
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

/** Minutos restantes en los que se avisa al alumno. */
const TIME_WARNINGS = [10, 5, 1];

function Timer({ deadline, onExpire, onWarn }: { deadline: number | null; onExpire(): void; onWarn(minutes: number): void }) {
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

function ExamView() {
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

  const nav = (
    <ScrollView horizontal={!wide} showsHorizontalScrollIndicator={false} contentContainerStyle={wide ? styles.navGrid : styles.navRow}>
      {paper.questions.map((x, i) => {
        const done = isAnswered(x, s.answers[x.id]);
        const cur = i === s.current;
        const flag = s.flagged.includes(x.id);
        return (
          <Pressable
            key={x.id}
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

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.examHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {paper.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={[styles.dot, { backgroundColor: net === 'online' ? t.success : net === 'connecting' ? t.info : t.warning }]} />
            <Text style={{ color: t.textMuted, fontSize: 12, flexShrink: 1 }} numberOfLines={1}>
              {s.identity.name} · {answered}/{paper.questions.length} respondidas ·{' '}
              <Text style={{ color: net !== 'online' ? t.warning : pendingSync ? t.textMuted : t.success }}>
                {net !== 'online' ? 'guardado en este dispositivo' : pendingSync ? 'guardando…' : 'guardado ✓'}
              </Text>
            </Text>
          </View>
        </View>
        <View style={[styles.fontBox, { borderColor: t.border }]}>
          <Pressable onPress={() => st.setFontSize(fontSize - 2)} hitSlop={6} accessibilityLabel="Letra más pequeña" style={styles.fontBtn}>
            <Text style={{ color: t.text, fontSize: 12, fontWeight: '800' }}>A−</Text>
          </Pressable>
          <Pressable onPress={() => st.setFontSize(fontSize + 2)} hitSlop={6} accessibilityLabel="Letra más grande" style={styles.fontBtn}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>A+</Text>
          </Pressable>
        </View>
        <Timer deadline={s.deadline} onExpire={timeUp} onWarn={onWarn} />
        <Button
          label={width < 520 ? 'Enviar' : 'Enviar a calificar'}
          icon="paper-plane-outline"
          kind="primary"
          onPress={() => {
            setConfirm(true);
            touch('reviewing');
          }}
          style={{ marginLeft: 8 }}
          disabled={s.submitting}
        />
      </View>
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
          <View style={{ backgroundColor: t.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>{nav}</View>
        )}
        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', maxWidth: 900 }}>
            <NetBanner />
            {banner ? <Banner icon="megaphone-outline" color={t.accent} text={`Aviso del maestro: ${banner}`} onClose={() => st.dismissBanner()} /> : null}
            {timeWarning ? <Banner icon="alarm-outline" color={t.danger} text={timeWarning} onClose={() => setTimeWarning(null)} /> : null}
            {toast ? <Banner icon="hand-left-outline" color={t.danger} text={toast} /> : null}
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
                <Button
                  label="Revisar y enviar"
                  icon="checkmark-done-outline"
                  kind="primary"
                  onPress={() => {
                    setConfirm(true);
                    touch('reviewing');
                  }}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </View>
      {confirm ? (
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

function Legend({ color, text, filled, dot }: { color: string; text: string; filled?: boolean; dot?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <View style={{ width: dot ? 10 : 16, height: dot ? 10 : 16, borderRadius: dot ? 5 : 5, borderWidth: 1, borderColor: color, backgroundColor: filled || dot ? color : 'transparent', marginRight: 8, marginLeft: dot ? 3 : 0 }} />
      <Text style={{ color: t.textMuted, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

function SubmitDialog({ questions, onCancel, onSubmit, onGo }: { questions: PaperQuestion[]; onCancel(): void; onSubmit(): void; onGo(i: number): void }) {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const pending = questions.map((q, i) => ({ q, i })).filter(({ q }) => !isAnswered(q, s.answers[q.id]));
  const flagged = questions.map((q, i) => ({ q, i })).filter(({ q }) => s.flagged.includes(q.id));
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>¿Enviar tu examen a calificar?</Text>
          <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 12 }}>Una vez enviado ya no podrás cambiar tus respuestas.</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <Pill icon="checkmark-done-outline" color={t.success} text={`${questions.length - pending.length} respondidas`} />
            {pending.length ? <Pill icon="alert-circle-outline" color={t.danger} text={`${pending.length} sin responder`} /> : null}
            {flagged.length ? <Pill icon="flag-outline" color={t.warning} text={`${flagged.length} marcadas`} /> : null}
          </View>
          {pending.length || flagged.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[...pending, ...flagged.filter((f) => !pending.some((p) => p.i === f.i))].map(({ i, q }) => (
                <Pressable key={q.id} onPress={() => onGo(i)} style={[styles.goChip, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
                  <Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>Ir a la {i + 1}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Button label="Seguir respondiendo" onPress={onCancel} />
            <Button label="Sí, enviar" icon="paper-plane" kind="primary" onPress={onSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ───────────────────────────── resultado ─────────────────────────────

const STATUS: Record<string, { icon: IconName; label: string; color: 'success' | 'warning' | 'danger' | 'textMuted' }> = {
  correct: { icon: 'checkmark-circle', label: 'Correcta', color: 'success' },
  partial: { icon: 'remove-circle', label: 'Parcial', color: 'warning' },
  wrong: { icon: 'close-circle', label: 'Incorrecta', color: 'danger' },
  blank: { icon: 'ellipse-outline', label: 'Sin responder', color: 'textMuted' },
};

function ResultView() {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const r: StudentResultView | null = s.result;
  const exit = () => {
    useStudent.getState().leave();
    useApp.getState().setAppMode('ide');
  };
  const review = r?.visibility === 'review';
  const reason = s.submitReason === 'timeout' ? 'Se terminó el tiempo y tu examen se envió automáticamente.' : s.submitReason === 'closed' ? 'El maestro cerró el examen y tus respuestas se enviaron automáticamente.' : s.submitReason === 'teacher' ? 'El maestro recogió tu examen.' : s.practiceKey ? 'Revisa abajo qué acertaste y la respuesta correcta de cada pregunta.' : 'Tu examen fue entregado.';
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader icon="school-outline" title={s.paper?.title ?? s.room?.title ?? 'Examen'} subtitle={`${s.identity.name} · ${placeLabel(s)}`} color={t.success} right={r ? <Button label="Salir" icon="exit-outline" kind="primary" onPress={exit} /> : null} />
      <Narrow>
        {!r ? (
          <Card style={{ alignItems: 'center' }}>
            <ActivityIndicator color={t.primary} />
            <Text style={{ color: t.text, marginTop: 10 }}>Esperando la calificación…</Text>
          </Card>
        ) : (
          <>
            <Card accent={r.visibility === 'none' ? t.success : r.passed ? t.success : t.danger} style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="checkmark-done-circle" size={54} color={t.success} />
              <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', marginTop: 6 }}>{s.practiceKey ? '¡Práctica terminada!' : '¡Examen enviado!'}</Text>
              <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>{reason}</Text>
              {r.visibility !== 'none' ? (
                <>
                  <Text style={{ color: r.passed ? t.success : t.danger, fontSize: 52, fontWeight: '900', marginTop: 12 }}>
                    {r.grade}
                    <Text style={{ fontSize: 22, color: t.textMuted }}> / {r.scale}</Text>
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: 14 }}>
                    {r.score} de {r.max} puntos · {r.percent}%
                  </Text>
                  <View style={{ marginTop: 10 }}>
                    <Pill solid icon={r.passed ? 'ribbon-outline' : 'alert-outline'} text={r.passed ? 'Aprobado' : 'No aprobado'} color={r.passed ? t.success : t.danger} />
                  </View>
                </>
              ) : (
                <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 10, textAlign: 'center' }}>Tu maestro te dará a conocer la calificación.</Text>
              )}
            </Card>
            {r.topics?.length ? <TopicsCard topics={r.topics} passPercent={s.paper?.settings.passPercent ?? 60} /> : null}
            {r.questions?.map((qr, i) => {
              const pq = s.paper?.questions.find((x) => x.id === qr.questionId);
              const st = STATUS[qr.status];
              const c = (t as any)[st.color] as string;
              return (
                <Card key={qr.questionId} accent={c}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name={st.icon} size={20} color={c} />
                    <Text style={{ color: t.text, fontWeight: '800', marginLeft: 8, flex: 1 }}>
                      Pregunta {i + 1} · {st.label}
                    </Text>
                    <Text style={{ color: t.textMuted, fontWeight: '700' }}>
                      {qr.score}/{qr.max}
                    </Text>
                  </View>
                  {pq ? (
                    review ? (
                      <View style={{ marginBottom: 6 }}>
                        {/* en el repaso se muestra también el código de la pregunta */}
                        <RichText text={pq.code ? `${pq.prompt}\n\n\`\`\`js\n${pq.code}\n\`\`\`` : pq.prompt} style={{ color: t.textMuted, fontSize: 13, lineHeight: 19 }} />
                      </View>
                    ) : (
                      <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 4 }} numberOfLines={3}>
                        {plainText(pq.prompt)}
                      </Text>
                    )
                  ) : null}
                  {pq && review && (pq.type === 'single' || pq.type === 'multiple') ? <ChosenAnswer q={pq} value={s.answers[pq.id]} /> : null}
                  <RichText text={qr.feedback} style={{ color: t.text, fontSize: 13 }} />
                  {qr.tests?.map((x) => (
                    <View key={x.id} style={{ marginTop: 3 }}>
                      <Text style={{ color: x.passed ? t.success : t.danger, fontSize: 12, fontFamily: x.call ? MONO : undefined }}>
                        {x.passed ? '✓' : '✗'} {x.name}
                        {x.hidden ? ' (oculto)' : ''}
                      </Text>
                      {review && !x.passed && x.expected !== undefined ? (
                        <Text style={{ color: t.textMuted, fontSize: 11, fontFamily: MONO, marginLeft: 14 }}>
                          esperado {x.expected.split('\n').join(' ⏎ ') || '(vacío)'} · obtenido {x.error ? x.error : x.actual?.split('\n').join(' ⏎ ') || '(vacío)'}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </Card>
              );
            })}
            {s.practiceKey ? (
              <Button
                label="Practicar de nuevo (otras preguntas)"
                icon="refresh"
                onPress={() => {
                  const key = s.practiceKey!;
                  const name = s.identity.name;
                  useStudent.getState().leave();
                  useStudent.getState().practice(key, name);
                }}
                style={{ height: 46, marginTop: 6 }}
              />
            ) : null}
            <Button label="Salir del modo examen" icon="exit-outline" kind="primary" onPress={exit} style={{ height: 46, marginTop: 6 }} />
          </>
        )}
      </Narrow>
    </View>
  );
}

/** Resultado por tema: dónde reforzar antes de la certificación. */
function TopicsCard({ topics, passPercent }: { topics: TopicScore[]; passPercent: number }) {
  const t = useTheme();
  const sorted = [...topics].sort((a, b) => a.score / (a.max || 1) - b.score / (b.max || 1));
  const weak = sorted.filter((x) => (x.max ? (x.score / x.max) * 100 : 0) < passPercent).length;
  return (
    <Card>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>Resultado por tema</Text>
      <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 10 }}>
        {weak ? `Repasa ${weak === 1 ? 'el tema' : `los ${weak} temas`} por debajo de ${passPercent} % (aparecen primero).` : `Superaste ${passPercent} % en todos los temas.`}
      </Text>
      {sorted.map((x) => {
        const pct = x.max ? Math.round((x.score / x.max) * 100) : 0;
        const c = pct >= passPercent ? t.success : pct >= 50 ? t.warning : t.danger;
        return (
          <View key={x.topic} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: t.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {x.topic}
              </Text>
              <Text style={{ color: c, fontSize: 12, fontWeight: '800' }}>
                {x.correct}/{x.total} · {pct}%
              </Text>
            </View>
            <ProgressBar value={pct / 100} color={c} />
          </View>
        );
      })}
    </Card>
  );
}

/** Qué opción eligió el alumno (al repasar). */
function ChosenAnswer({ q, value }: { q: PaperQuestion; value: unknown }) {
  const t = useTheme();
  const ids = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  const chosen = (q.options ?? []).filter((o) => ids.includes(o.id));
  if (!chosen.length) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
      <Text style={{ color: t.textMuted, fontSize: 13 }}>Tu respuesta: </Text>
      <View style={{ flex: 1 }}>
        {chosen.map((o) => (
          <RichText key={o.id} text={o.text} style={{ color: t.text, fontSize: 13 }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  examHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  fontBox: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, marginRight: 4 },
  fontBtn: { paddingHorizontal: 8, height: 32, alignItems: 'center', justifyContent: 'center' },
  timer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 5 },
  side: { width: 210, padding: 14, borderRightWidth: StyleSheet.hairlineWidth },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navRow: { paddingHorizontal: 10, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  navBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flagDot: { position: 'absolute', top: -3, right: -3, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  footerNav: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 24 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 480, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  topicBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexGrow: 1, flexBasis: 160 },
  goChip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  sending: { backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
});
