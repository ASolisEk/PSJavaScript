/** Pantalla principal del entorno: barra de herramientas, editor y paneles. */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCode } from '../core/editor/indent';
import { PanelId, SPEEDS, useActiveFile, useApp, useProfile } from '../store/app';
import type { VarDetail } from '../core/runner';
import { BORDER, MONO, RADIUS, SPACE, useTheme } from '../ui/theme';
import CodeEditor from './CodeEditor';
import Footer, { REPO_URL } from './Footer';
import ExportModal from './modals/ExportModal';
import FilesModal from './modals/FilesModal';
import HelpModal from './modals/HelpModal';
import InsertModal from './modals/InsertModal';
import SettingsModal from './modals/SettingsModal';
import UpdateModal from './modals/UpdateModal';
import ExamChooserModal from './exam/ExamChooserModal';
import { useTeacher } from '../store/teacher';
import { checkForUpdate, isNonWeb } from '../core/updater';
import ConsolePanel, { InputBar } from './panels/ConsolePanel';
import DesktopPanel from './panels/DesktopPanel';
import DiagramPanel from './panels/DiagramPanel';
import ExplainPanel from './panels/ExplainPanel';
import ProblemsPanel from './panels/ProblemsPanel';
import VariablesPanel from './panels/VariablesPanel';
import Mascot from './Mascot';
import { Button, IconButton, Tab, Tooltip } from './ui';

const PANELS: { id: PanelId; label: string; short: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'console', label: 'Consola', short: 'Consola', icon: 'terminal-outline' },
  { id: 'diagram', label: 'Diagrama', short: 'Diagrama', icon: 'git-network-outline' },
  { id: 'variables', label: 'Variables', short: 'Variables', icon: 'cube-outline' },
  { id: 'desktop', label: 'Prueba de escritorio', short: 'Escritorio', icon: 'grid-outline' },
  { id: 'explain', label: 'Explicación', short: 'Explicación', icon: 'chatbubbles-outline' },
  { id: 'problems', label: 'Problemas', short: 'Problemas', icon: 'alert-circle-outline' },
];

function PanelView({ id }: { id: PanelId }) {
  switch (id) {
    case 'console':
      return <ConsolePanel />;
    case 'variables':
      return <VariablesPanel />;
    case 'desktop':
      return <DesktopPanel />;
    case 'diagram':
      return <DiagramPanel />;
    case 'explain':
      return <ExplainPanel />;
    case 'problems':
      return <ProblemsPanel />;
  }
  return null;
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'Listo',
  running: 'Ejecutando…',
  paused: 'En pausa',
  input: 'Esperando un dato',
  finished: 'Finalizado',
  error: 'Error',
  stopped: 'Detenido',
};

function FileTabs() {
  const t = useTheme();
  const files = useApp((s) => s.files);
  const openIds = useApp((s) => s.openIds);
  const activeId = useApp((s) => s.activeId);
  const { openFile, closeTab, newFile } = useApp.getState();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ alignItems: 'flex-end' }}>
      {openIds.map((id) => {
        const f = files.find((x) => x.id === id);
        if (!f) return null;
        const active = id === activeId;
        return (
          <Pressable
            key={id}
            onPress={() => openFile(id)}
            style={[styles.fileTab, { backgroundColor: active ? t.surface : 'transparent', borderColor: active ? t.border : 'transparent' }]}
          >
            <Ionicons name="logo-javascript" size={14} color={active ? t.warning : t.textFaint} />
            <Text style={{ color: active ? t.text : t.textMuted, fontSize: 13, marginLeft: 6, fontWeight: active ? '800' : '600' }} numberOfLines={1}>
              {f.name}
            </Text>
            {openIds.length > 1 ? (
              <Pressable onPress={() => closeTab(id)} hitSlop={8} style={{ marginLeft: 6 }} accessibilityLabel={`Cerrar ${f.name}`}>
                <Ionicons name="close" size={13} color={t.textMuted} />
              </Pressable>
            ) : null}
          </Pressable>
        );
      })}
      <Pressable onPress={() => newFile()} style={styles.addTab} accessibilityLabel="Nuevo programa">
        <Ionicons name="add" size={20} color={t.accent} />
      </Pressable>
    </ScrollView>
  );
}

function Toolbar({ compact }: { compact: boolean }) {
  const t = useTheme();
  const status = useApp((s) => s.run?.status ?? 'idle');
  const speed = useApp((s) => s.settings.speed);
  const { runProgram, stepOnce, stepBack, pause, stop, setModal, updateSettings, replaceCode } = useApp.getState();
  const file = useActiveFile();
  const running = status === 'running';
  const active = status === 'running' || status === 'paused' || status === 'input';
  const canBack = status === 'paused' || status === 'finished' || status === 'error' || status === 'input';
  const speedIdx = Math.max(0, SPEEDS.indexOf(speed));
  const label = !compact;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar} style={{ overflow: 'visible' }} keyboardShouldPersistTaps="handled">
      <IconButton icon="folder-open-outline" label="Archivos" tooltip="Archivos y ejemplos" onPress={() => setModal('files')} showLabel={label} />
      <View style={[styles.sep, { backgroundColor: t.border }]} />
      <IconButton icon="play" label={status === 'paused' ? 'Continuar' : 'Ejecutar'} tooltip={status === 'paused' ? 'Continuar ejecución' : 'Ejecutar programa completo'} color={t.success} onPress={() => runProgram('run')} showLabel={label} disabled={running} />
      <IconButton icon="play-forward" label="Paso a paso" tooltip="Ejecución animada paso a paso" color={t.primary} onPress={() => runProgram('animate')} showLabel={label} disabled={running} />
      <IconButton icon="play-skip-forward" label="Siguiente paso" tooltip="Siguiente paso (una instrucción)" onPress={stepOnce} disabled={status === 'input'} />
      <IconButton icon="play-skip-back" label="Paso anterior" tooltip="Paso anterior (retroceder)" onPress={stepBack} disabled={!canBack} />
      <IconButton icon="pause" label="Pausar" tooltip="Pausar ejecución" onPress={pause} disabled={!running} />
      <IconButton icon="stop" label="Detener" tooltip="Detener ejecución" color={t.danger} onPress={stop} disabled={!active} />
      <Tooltip text={`Velocidad paso a paso: nivel ${speedIdx + 1} de 5 (${speed} ms)`}>
        <View style={[styles.speed, { borderColor: t.border }]}>
          <Tooltip text="Más lento">
            <Pressable onPress={() => updateSettings({ speed: SPEEDS[Math.max(0, speedIdx - 1)] })} hitSlop={6} accessibilityLabel="Más lento">
              <Ionicons name="remove" size={16} color={t.textMuted} />
            </Pressable>
          </Tooltip>
          <Ionicons name="speedometer-outline" size={15} color={t.textMuted} style={{ marginHorizontal: 4 }} />
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '800', width: 12, textAlign: 'center' }}>{speedIdx + 1}</Text>
          <Tooltip text="Más rápido">
            <Pressable onPress={() => updateSettings({ speed: SPEEDS[Math.min(SPEEDS.length - 1, speedIdx + 1)] })} hitSlop={6} accessibilityLabel="Más rápido">
              <Ionicons name="add" size={16} color={t.textMuted} />
            </Pressable>
          </Tooltip>
        </View>
      </Tooltip>
      <View style={[styles.sep, { backgroundColor: t.border }]} />
      <IconButton icon="add-circle-outline" label="Insertar" tooltip="Insertar comandos y estructuras" onPress={() => setModal('insert')} showLabel={label} />
      <IconButton
        icon="color-wand-outline"
        label="Formatear"
        tooltip="Formatear código (auto-indentación)"
        showLabel={label}
        onPress={() => {
          if (!file) return;
          replaceCode(formatCode(file.code));
          useApp.getState().setNotice('Código formateado correctamente ✨');
        }}
      />
      <IconButton icon="swap-horizontal" label="Exportar" tooltip="Exportar a otros lenguajes" onPress={() => setModal('export')} showLabel={label} />
      <View style={[styles.sep, { backgroundColor: t.border }]} />
      <IconButton icon="school-outline" label="Examen" tooltip="Modo Maestro (crear y aplicar exámenes) o presentar un examen" color={t.accent} onPress={() => setModal('exam')} showLabel={label} />
      <IconButton icon="settings-outline" label="Configuración y perfil" tooltip="Configuración y perfil del lenguaje" onPress={() => setModal('settings')} />
      <IconButton icon="help-circle-outline" label="Ayuda" tooltip="Ayuda y documentación del lenguaje" onPress={() => setModal('help')} />
    </ScrollView>
  );
}

function StatusBar() {
  const t = useTheme();
  const narrow = useWindowDimensions().width < 520;
  const run = useApp((s) => s.run);
  const diags = useApp((s) => s.diagnostics);
  const profile = useProfile();
  const { setModal, setPanel, setSidePanel } = useApp.getState();
  const status = run?.status ?? 'idle';
  const color = status === 'error' ? t.danger : status === 'finished' ? t.success : status === 'input' ? t.primary : status === 'paused' ? t.warning : t.textMuted;
  const errors = diags.filter((d) => d.severity === 'error').length;
  const warns = diags.filter((d) => d.severity === 'warning').length;
  return (
    <View style={[styles.status, { backgroundColor: t.surface, borderTopColor: t.border }]}>
      {status === 'running' ? <ActivityIndicator size="small" color={t.primary} style={{ transform: [{ scale: 0.7 }] }} /> : <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={{ color, fontSize: 12, fontWeight: '800', marginLeft: 6 }} numberOfLines={1}>
        {STATUS_LABEL[status]}
      </Text>
      {run && run.line && !narrow ? <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 10, fontFamily: MONO }}>Línea {run.line}</Text> : null}
      {run ? <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 10, fontFamily: MONO }}>Paso {run.stepCount}</Text> : null}
      <View style={{ flex: 1 }} />
      <Pressable
        onPress={() => {
          setPanel('problems');
          setSidePanel('problems');
        }}
        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
      >
        <Ionicons name="close-circle" size={13} color={errors ? t.danger : t.textMuted} />
        <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginLeft: 3 }}>{errors}</Text>
        <Ionicons name="warning" size={13} color={warns ? t.warning : t.textMuted} style={{ marginLeft: 8 }} />
        <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginLeft: 3 }}>{warns}</Text>
      </Pressable>
      <Pressable onPress={() => setModal('settings')}>
        <Text style={{ color: t.accent, fontSize: 12, fontWeight: '800' }} numberOfLines={1}>
          {narrow ? 'Perfil' : `Perfil: ${profile.name}`}
        </Text>
      </Pressable>
    </View>
  );
}

/** Aviso en el encabezado cuando el maestro tiene una sala abierta y está en el editor. */
function LiveRoomPill() {
  const t = useTheme();
  const room = useTeacher((s) => (s.live && s.room && s.room.status !== 'closed' ? s.room : null));
  if (!room) return null;
  return (
    <Pressable
      onPress={() => useApp.getState().setAppMode('teacher')}
      accessibilityLabel="Volver a la sala del examen"
      style={({ pressed }) => [styles.repoLink, { borderColor: t.accent, backgroundColor: pressed ? t.surfaceAlt : t.accentSoft }]}
    >
      <Ionicons name="radio-outline" size={15} color={t.accentDark} />
      <Text style={[styles.navLabel, { color: t.accentDark, marginLeft: 5 }]}>Sala {room.code}</Text>
    </Pressable>
  );
}

function Notice() {
  const t = useTheme();
  const notice = useApp((s) => s.notice);
  const runNotice = useApp((s) => s.run?.notice ?? null);
  const updateInfo = useApp((s) => s.updateInfo);
  const setNotice = useApp((s) => s.setNotice);
  const setModal = useApp((s) => s.setModal);
  const text = notice ?? runNotice;
  if (!text) return null;

  const isUpdateNotice = Boolean(updateInfo?.hasUpdate && text.includes('versión'));

  return (
    <View style={[styles.notice, { backgroundColor: isUpdateNotice ? t.primarySoft : t.warningSoft, borderBottomColor: isUpdateNotice ? t.primary : t.warning }]}>
      <Ionicons name={isUpdateNotice ? 'cloud-download-outline' : 'information-circle'} size={18} color={isUpdateNotice ? t.primaryDark : t.warning} />
      <Text style={{ color: t.text, fontSize: 13, fontWeight: '600', flex: 1, marginLeft: SPACE.sm }}>{text}</Text>
      {isUpdateNotice ? <Button label="Actualizar" kind="primary" size="sm" onPress={() => setModal('update')} style={{ marginRight: 6 }} /> : null}
      {notice ? <IconButton icon="close" label="Cerrar aviso" size={16} onPress={() => setNotice(null)} /> : null}
    </View>
  );
}

function MiniConsole() {
  const t = useTheme();
  const output = useApp((s) => s.run?.output);
  const setPanel = useApp((s) => s.setPanel);
  const lines = (output ?? []).filter((l) => l.kind !== 'system').slice(-4);
  if (!lines.length) return null;
  return (
    <Pressable onPress={() => setPanel('console')} style={[styles.mini, { backgroundColor: t.terminal.bg }]}>
      {lines.map((l) => {
        const color = l.kind === 'error' ? t.terminal.error : l.kind === 'warn' ? t.terminal.warn : l.kind === 'input' ? t.terminal.input : t.terminal.text;
        return (
          <Text key={l.id} style={{ color, fontFamily: MONO, fontSize: 13 }} numberOfLines={1}>
            {l.kind === 'input' ? `${l.prompt ?? ''} › ${l.text}` : l.text}
          </Text>
        );
      })}
    </Pressable>
  );
}

function FloatingDebugWidget() {
  const t = useTheme();
  const run = useApp((s) => s.run);
  const { runProgram, stepOnce, stepBack, pause, stop } = useApp.getState();

  const isDebugging = Boolean(
    run && (run.status === 'paused' || run.status === 'input' || (run.status === 'running' && run.mode === 'animate'))
  );

  if (!isDebugging || !run) return null;

  return (
    <View
      style={[
        styles.floatingDebugWidget,
        { backgroundColor: t.surface, borderColor: t.border },
      ]}
    >
      <View
        style={[
          styles.debugStepBadge,
          {
            backgroundColor: run.status === 'paused' ? t.warningSoft : run.status === 'input' ? t.accentSoft : t.primarySoft,
          },
        ]}
      >
        <Ionicons
          name={run.status === 'paused' ? 'pause-circle' : run.status === 'input' ? 'keypad-outline' : 'play-forward'}
          size={14}
          color={run.status === 'paused' ? t.warning : run.status === 'input' ? t.accentDark : t.primaryDark}
        />
        <Text
          style={{
            color: run.status === 'paused' ? t.warning : run.status === 'input' ? t.accentDark : t.primaryDark,
            fontSize: 11,
            fontWeight: '800',
            fontFamily: MONO,
            marginLeft: 5,
          }}
        >
          {run.status === 'input' ? 'Entrada' : `Paso ${run.stepCount}`}
        </Text>
      </View>

      <View style={[styles.floatingSep, { backgroundColor: t.border }]} />

      {run.status === 'paused' ? (
        <>
          <Tooltip text="Continuar (F5)" position="bottom">
            <Pressable
              onPress={() => runProgram('run')}
              style={({ pressed }) => [styles.floatingBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Continuar (F5)"
            >
              <Ionicons name="play" size={16} color={t.success} />
            </Pressable>
          </Tooltip>

          <Tooltip text="Siguiente paso (F7 / F10)" position="bottom">
            <Pressable
              onPress={stepOnce}
              style={({ pressed }) => [styles.floatingBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Siguiente paso (F7)"
            >
              <Ionicons name="play-skip-forward" size={16} color={t.accent} />
            </Pressable>
          </Tooltip>

          <Tooltip text="Paso anterior (Shift+F7)" position="bottom">
            <Pressable
              onPress={stepBack}
              style={({ pressed }) => [styles.floatingBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Paso anterior (Shift+F7)"
            >
              <Ionicons name="play-skip-back" size={16} color={t.textMuted} />
            </Pressable>
          </Tooltip>
        </>
      ) : run.status === 'running' ? (
        <Tooltip text="Pausar ejecución" position="bottom">
          <Pressable
            onPress={pause}
            style={({ pressed }) => [styles.floatingBtn, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Pausar"
          >
            <Ionicons name="pause" size={16} color={t.warning} />
          </Pressable>
        </Tooltip>
      ) : null}

      <Tooltip text="Detener ejecución (Shift+F5)" position="bottom">
        <Pressable
          onPress={stop}
          style={({ pressed }) => [styles.floatingBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Detener (Shift+F5)"
        >
          <Ionicons name="stop" size={16} color={t.danger} />
        </Pressable>
      </Tooltip>
    </View>
  );
}

function DebugBar() {
  const t = useTheme();
  const run = useApp((s) => s.run);
  const { runProgram, stepOnce, stepBack, stop } = useApp.getState();

  if (run?.status !== 'paused') return null;

  return (
    <View style={[styles.debugBar, { backgroundColor: t.warningSoft, borderTopColor: t.warning }]}>
      <Button label="Continuar" kind="primary" icon="play" onPress={() => runProgram('run')} />
      <Button label="Siguiente" icon="play-skip-forward" onPress={stepOnce} />
      <Button label="Anterior" icon="play-skip-back" onPress={stepBack} />
      <IconButton icon="stop" color={t.danger} label="Detener" onPress={stop} />
    </View>
  );
}

export default function IDE() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const hydrated = useApp((s) => s.hydrated);
  const file = useActiveFile();
  const panel = useApp((s) => s.panel);
  const sidePanel = useApp((s) => s.sidePanel);
  const modal = useApp((s) => s.modal);
  const diagnostics = useApp((s) => s.diagnostics);
  const fontSize = useApp((s) => s.settings.fontSize);
  const symbolBar = useApp((s) => s.settings.symbolBar);
  const run = useApp((s) => s.run);
  const { setCode, toggleBreakpoint, setPanel, setSidePanel, hydrate } = useApp.getState();
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length + (run?.error ? 1 : 0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // En plataformas diferentes a web (escritorio / móvil), verificar si existe versión más reciente
  useEffect(() => {
    if (!isNonWeb()) return;
    let mounted = true;
    const timer = setTimeout(() => {
      checkForUpdate()
        .then((res) => {
          if (!mounted) return;
          const { setUpdateInfo, setNotice, setModal } = useApp.getState();
          setUpdateInfo(res);
          if (res.hasUpdate) {
            setNotice(`¡Nueva versión v${res.latestVersion} disponible! Toca "Actualizar" para descargar e instalar.`);
            // Si el usuario no tiene abierto otro modal, mostrar diálogo de actualización
            if (!useApp.getState().modal) {
              setModal('update');
            }
          }
        })
        .catch(() => { });
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // En pantallas angostas, al terminar una ejecución completa se muestra la consola
  const lastStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const st = run?.status;
    if (!wide && st !== lastStatus.current) {
      if ((st === 'finished' || st === 'error') && run?.mode === 'run' && panel === 'editor') setPanel('console');
      if (st === 'error' && run?.error?.syntax) setPanel('problems');
    }
    if (wide && st === 'error' && st !== lastStatus.current) setSidePanel(run?.error?.syntax ? 'problems' : 'console');
    lastStatus.current = st;
  }, [run?.status, run?.mode, run?.error, wide, panel, setPanel, setSidePanel]);

  // Atajos de teclado (web / escritorio)
  const onKey = useCallback((e: KeyboardEvent) => {
    const s = useApp.getState();
    const mod = e.ctrlKey || e.metaKey;
    let handled = true;
    if (e.key === 'F5' && e.shiftKey) s.stop();
    else if (e.key === 'F5') s.runProgram('run');
    else if (e.key === 'F6') s.runProgram('animate');
    else if ((e.key === 'F7' || e.key === 'F10') && e.shiftKey) s.stepBack();
    else if (e.key === 'F7' || e.key === 'F10') s.stepOnce();
    else if (e.key === 'F1') s.setModal('help');
    else if (mod && e.key.toLowerCase() === 's') s.setNotice('Los programas se guardan automáticamente. Usa Archivos → descargar para obtener el .js');
    else if (mod && e.shiftKey && e.key.toLowerCase() === 'f') s.replaceCode(formatCode(s.activeFile().code));
    else if (mod && e.key.toLowerCase() === 'o') s.setModal('files');
    else handled = false;
    if (handled) e.preventDefault();
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  const varDetails = useMemo(() => {
    if (!run || (run.status !== 'paused' && run.status !== 'running' && run.status !== 'input')) return undefined;
    const frame = run.frames?.[0];
    if (!frame) return undefined;
    const changedSet = new Set((run.changed ?? []).map((c) => c.split('/').pop()!));
    const m: Record<string, VarDetail> = {};
    for (const scope of frame.scopes) {
      for (const v of scope.vars) {
        if (!(v.name in m)) {
          m[v.name] = {
            name: v.name,
            kind: v.kind,
            type: v.type,
            value: v.value,
            changed: changedSet.has(v.name),
          };
        }
      }
    }
    return m;
  }, [run]);

  const isDebugging = Boolean(
    run && (run.status === 'paused' || run.status === 'input' || (run.status === 'running' && run.mode === 'animate'))
  );

  if (!hydrated || !file) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  const execLine = run && (run.status === 'paused' || run.status === 'running' || run.status === 'input') ? run.line : null;
  const errorLine = run?.status === 'error' ? run.error?.line ?? null : null;
  const editor = (
    <CodeEditor
      key={file.id}
      code={file.code}
      onChange={setCode}
      breakpoints={file.breakpoints}
      onToggleBreakpoint={toggleBreakpoint}
      execLine={execLine}
      errorLine={errorLine}
      diagnostics={diagnostics}
      fontSize={fontSize}
      showSymbolBar={symbolBar && (Platform.OS !== 'web' || !wide)}
      varDetails={varDetails}
      isDebugging={isDebugging}
    />
  );
  const runActive = run && run.status !== 'idle';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandIcon}
              accessibilityLabel="PSJavaScript Icon"
            />
            <Text style={[styles.brand, { color: t.text }]}>
              PS<Text style={{ color: t.primary }}>JS</Text>
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <FileTabs />
          </View>
          <LiveRoomPill />
          {/* descargas de escritorio: no tienen sentido en un teléfono */}
          {Platform.OS === 'web' && width >= 700 && (
            <>
              <a href="PSJavaScript.dmg" download="PSJavaScript.dmg" style={{ textDecoration: 'none', marginRight: 8 }}>
                <View style={[styles.repoLink, { borderColor: t.borderStrong }]}>
                  <Ionicons name="logo-apple" size={16} color={t.textMuted} />
                  <Text style={[styles.navLabel, { color: t.textMuted, marginLeft: 5 }]}>macOS</Text>
                </View>
              </a>
              <a href="PSJavaScript-Setup.exe" download="PSJavaScript-Setup.exe" style={{ textDecoration: 'none', marginRight: 8 }}>
                <View style={[styles.repoLink, { borderColor: t.borderStrong }]}>
                  <Ionicons name="logo-windows" size={16} color={t.textMuted} />
                  <Text style={[styles.navLabel, { color: t.textMuted, marginLeft: 5 }]}>Windows</Text>
                </View>
              </a>
              <a href="PSJavaScript.AppImage" download="PSJavaScript.AppImage" style={{ textDecoration: 'none', marginRight: 8 }}>
                <View style={[styles.repoLink, { borderColor: t.borderStrong }]}>
                  <Ionicons name="logo-tux" size={16} color={t.textMuted} />
                  <Text style={[styles.navLabel, { color: t.textMuted, marginLeft: 5 }]}>Linux</Text>
                </View>
              </a>
            </>
          )}
          <Pressable
            onPress={() => Linking.openURL(REPO_URL)}
            accessibilityRole="link"
            accessibilityLabel="Ver el código fuente en GitHub"
            {...({ title: 'Ver el código fuente en GitHub' } as object)}
            style={({ pressed }) => [styles.repoLink, { borderColor: t.borderStrong, backgroundColor: pressed ? t.surfaceAlt : 'transparent' }]}
          >
            <Ionicons name="logo-github" size={16} color={t.textMuted} />
            {width >= 600 ? <Text style={[styles.navLabel, { color: t.textMuted, marginLeft: 5 }]}>Código fuente</Text> : null}
          </Pressable>
        </View>
        <View style={[styles.toolbarWrap, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <Toolbar compact={width < 1200} />
        </View>
        <Notice />

        <View style={{ flex: 1 }}>
          {wide ? (
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <View style={{ flex: 1.4, borderRightWidth: BORDER, borderRightColor: t.border, position: 'relative' }}>
                {editor}
                <FloatingDebugWidget />
              </View>
              <View style={{ flex: 0.8, minWidth: 300 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabs, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
                  {PANELS.map((p) => (
                    <Tab key={p.id} label={p.label} icon={p.icon} active={sidePanel === p.id} onPress={() => setSidePanel(p.id)} badge={p.id === 'problems' && errorCount ? errorCount : undefined} />
                  ))}
                </ScrollView>
                <View style={{ flex: 1 }}>
                  <PanelView id={sidePanel} />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabs, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
                <Tab label="Código" icon="code-slash" active={panel === 'editor'} onPress={() => setPanel('editor')} />
                {PANELS.map((p) => (
                  <Tab key={p.id} label={p.short} icon={p.icon} active={panel === p.id} onPress={() => setPanel(p.id)} badge={p.id === 'problems' && errorCount ? errorCount : undefined} />
                ))}
              </ScrollView>
              <View style={{ flex: 1, position: 'relative' }}>
                {panel === 'editor' ? editor : <PanelView id={panel} />}
                {panel === 'editor' && <FloatingDebugWidget />}
              </View>
              {panel === 'editor' && runActive ? <MiniConsole /> : null}
            </View>
          )}
          <Mascot />
        </View>

        <InputBar />
        <DebugBar />
        <View style={{ paddingBottom: insets.bottom, backgroundColor: t.primary }}>
          <StatusBar />
          <Footer />
        </View>
      </View>

      {modal === 'files' ? <FilesModal /> : null}
      {modal === 'export' ? <ExportModal /> : null}
      {modal === 'settings' ? <SettingsModal /> : null}
      {modal === 'help' ? <HelpModal /> : null}
      {modal === 'insert' ? <InsertModal /> : null}
      {modal === 'update' ? <UpdateModal /> : null}
      {modal === 'exam' ? <ExamChooserModal /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: SPACE.md, paddingTop: SPACE.sm, borderBottomWidth: BORDER },
  repoLink: { flexDirection: 'row', alignItems: 'center', height: 32, paddingHorizontal: 10, borderRadius: RADIUS.md, borderWidth: BORDER, marginRight: SPACE.sm, marginBottom: 6 },
  navLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  brandContainer: { flexDirection: 'row', alignItems: 'center', marginRight: SPACE.md, marginBottom: 9 },
  brandIcon: { width: 26, height: 26, borderRadius: RADIUS.sm, marginRight: SPACE.sm },
  brand: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  fileTab: { flexDirection: 'row', alignItems: 'center', height: 38, paddingHorizontal: 14, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, borderWidth: BORDER, borderBottomWidth: 0, marginBottom: -BORDER, maxWidth: 220 },
  addTab: { height: 38, width: 38, alignItems: 'center', justifyContent: 'center' },
  toolbarWrap: { borderBottomWidth: BORDER, zIndex: 100, overflow: 'visible' },
  toolbar: { alignItems: 'center', paddingHorizontal: SPACE.sm, paddingVertical: 4 },
  sep: { width: BORDER, height: 24, borderRadius: 1, marginHorizontal: SPACE.sm },
  speed: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: SPACE.sm, height: 34, marginLeft: 4 },
  tabs: { flexGrow: 0, borderBottomWidth: BORDER },
  status: { flexDirection: 'row', alignItems: 'center', height: 30, paddingHorizontal: SPACE.md, borderTopWidth: BORDER },
  dot: { width: 10, height: 10, borderRadius: 5 },
  notice: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.md, paddingVertical: 6, borderBottomWidth: BORDER },
  mini: { maxHeight: 92, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm },
  debugBar: { flexDirection: 'row', justifyContent: 'center', paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, borderTopWidth: BORDER, flexWrap: 'wrap', gap: SPACE.sm },
  floatingDebugWidget: {
    position: 'absolute',
    top: 10,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.lg,
    borderWidth: BORDER,
    zIndex: 100,
  },
  debugStepBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.sm, paddingVertical: 4, borderRadius: RADIUS.md },
  floatingSep: { width: BORDER, height: 18, marginHorizontal: 6 },
  floatingBtn: { padding: 7, borderRadius: RADIUS.md, marginHorizontal: 1, alignItems: 'center', justifyContent: 'center' },
});
