/** Pantalla principal del entorno: barra de herramientas, editor y paneles. */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCode } from '../core/editor/indent';
import { PanelId, SPEEDS, useActiveFile, useApp, useProfile } from '../store/app';
import { MONO, useTheme } from '../ui/theme';
import CodeEditor from './CodeEditor';
import Footer, { REPO_URL } from './Footer';
import ExportModal from './modals/ExportModal';
import FilesModal from './modals/FilesModal';
import HelpModal from './modals/HelpModal';
import InsertModal from './modals/InsertModal';
import SettingsModal from './modals/SettingsModal';
import ConsolePanel, { InputBar } from './panels/ConsolePanel';
import DesktopPanel from './panels/DesktopPanel';
import DiagramPanel from './panels/DiagramPanel';
import ExplainPanel from './panels/ExplainPanel';
import ProblemsPanel from './panels/ProblemsPanel';
import VariablesPanel from './panels/VariablesPanel';
import Mascot from './Mascot';
import { Button, IconButton, Tab } from './ui';

const PANELS: { id: PanelId; label: string; short: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'console', label: 'Consola', short: 'Consola', icon: 'terminal-outline' },
  { id: 'variables', label: 'Variables', short: 'Variables', icon: 'cube-outline' },
  { id: 'desktop', label: 'Prueba de escritorio', short: 'Escritorio', icon: 'grid-outline' },
  { id: 'diagram', label: 'Diagrama', short: 'Diagrama', icon: 'git-network-outline' },
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
            <Ionicons name="logo-javascript" size={13} color={active ? '#e8b100' : t.textMuted} />
            <Text style={{ color: active ? t.text : t.textMuted, fontSize: 13, marginLeft: 5, fontWeight: active ? '600' : '400' }} numberOfLines={1}>
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
        <Ionicons name="add" size={18} color={t.textMuted} />
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar} keyboardShouldPersistTaps="handled">
      <IconButton icon="folder-open-outline" label="Archivos" onPress={() => setModal('files')} showLabel={label} />
      <View style={[styles.sep, { backgroundColor: t.border }]} />
      <IconButton icon="play" label={status === 'paused' ? 'Continuar' : 'Ejecutar'} color={t.success} onPress={() => runProgram('run')} showLabel={label} disabled={running} />
      <IconButton icon="play-forward" label="Paso a paso" color={t.primary} onPress={() => runProgram('animate')} showLabel={label} disabled={running} />
      <IconButton icon="play-skip-forward" label="Siguiente paso" onPress={stepOnce} disabled={status === 'input'} />
      <IconButton icon="play-skip-back" label="Paso anterior" onPress={stepBack} disabled={!canBack} />
      <IconButton icon="pause" label="Pausar" onPress={pause} disabled={!running} />
      <IconButton icon="stop" label="Detener" color={t.danger} onPress={stop} disabled={!active} />
      <View style={[styles.speed, { borderColor: t.border }]}>
        <Pressable onPress={() => updateSettings({ speed: SPEEDS[Math.max(0, speedIdx - 1)] })} hitSlop={6} accessibilityLabel="Más lento">
          <Ionicons name="remove" size={16} color={t.textMuted} />
        </Pressable>
        <Ionicons name="speedometer-outline" size={15} color={t.textMuted} style={{ marginHorizontal: 4 }} />
        <Text style={{ color: t.text, fontSize: 12, width: 12, textAlign: 'center' }}>{speedIdx + 1}</Text>
        <Pressable onPress={() => updateSettings({ speed: SPEEDS[Math.min(SPEEDS.length - 1, speedIdx + 1)] })} hitSlop={6} accessibilityLabel="Más rápido">
          <Ionicons name="add" size={16} color={t.textMuted} />
        </Pressable>
      </View>
      <View style={[styles.sep, { backgroundColor: t.border }]} />
      <IconButton icon="add-circle-outline" label="Insertar" onPress={() => setModal('insert')} showLabel={label} />
      <IconButton icon="color-wand-outline" label="Formatear código" onPress={() => file && replaceCode(formatCode(file.code))} />
      <IconButton icon="swap-horizontal" label="Exportar" onPress={() => setModal('export')} showLabel={label} />
      <IconButton icon="settings-outline" label="Configuración y perfil" onPress={() => setModal('settings')} />
      <IconButton icon="help-circle-outline" label="Ayuda" onPress={() => setModal('help')} />
    </ScrollView>
  );
}

function StatusBar() {
  const t = useTheme();
  const run = useApp((s) => s.run);
  const diags = useApp((s) => s.diagnostics);
  const profile = useProfile();
  const { setModal, setPanel, setSidePanel } = useApp.getState();
  const status = run?.status ?? 'idle';
  const color = status === 'error' ? t.danger : status === 'finished' ? t.success : status === 'input' ? t.primary : status === 'paused' ? t.warning : t.textMuted;
  const errors = diags.filter((d) => d.severity === 'error').length;
  const warns = diags.filter((d) => d.severity === 'warning').length;
  return (
    <View style={[styles.status, { backgroundColor: t.surfaceAlt, borderTopColor: t.border }]}>
      {status === 'running' ? <ActivityIndicator size="small" color={t.primary} style={{ transform: [{ scale: 0.7 }] }} /> : <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={{ color, fontSize: 12, fontWeight: '700', marginLeft: 6 }}>{STATUS_LABEL[status]}</Text>
      {run && run.line ? <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 10, fontFamily: MONO }}>Línea {run.line}</Text> : null}
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
        <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 3 }}>{errors}</Text>
        <Ionicons name="warning" size={13} color={warns ? t.warning : t.textMuted} style={{ marginLeft: 8 }} />
        <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 3 }}>{warns}</Text>
      </Pressable>
      <Pressable onPress={() => setModal('settings')}>
        <Text style={{ color: t.primary, fontSize: 12 }} numberOfLines={1}>
          Perfil: {profile.name}
        </Text>
      </Pressable>
    </View>
  );
}

function Notice() {
  const t = useTheme();
  const notice = useApp((s) => s.notice);
  const runNotice = useApp((s) => s.run?.notice ?? null);
  const setNotice = useApp((s) => s.setNotice);
  const text = notice ?? runNotice;
  if (!text) return null;
  return (
    <View style={[styles.notice, { backgroundColor: t.surfaceAlt, borderBottomColor: t.warning }]}>
      <Ionicons name="information-circle" size={16} color={t.warning} />
      <Text style={{ color: t.text, fontSize: 13, flex: 1, marginLeft: 6 }}>{text}</Text>
      {notice ? <IconButton icon="close" label="Cerrar aviso" size={16} onPress={() => setNotice(null)} /> : null}
    </View>
  );
}

function MiniConsole() {
  const output = useApp((s) => s.run?.output);
  const setPanel = useApp((s) => s.setPanel);
  const lines = (output ?? []).filter((l) => l.kind !== 'system').slice(-4);
  if (!lines.length) return null;
  return (
    <Pressable onPress={() => setPanel('console')} style={[styles.mini, { backgroundColor: '#1e1e1e', borderTopWidth: 0 }]}>
      {lines.map((l) => {
        const color = l.kind === 'error' ? '#ff5555' : l.kind === 'warn' ? '#f1fa8c' : l.kind === 'input' ? '#50fa7b' : '#f8f8f2';
        return (
          <Text key={l.id} style={{ color, fontFamily: MONO, fontSize: 13, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }} numberOfLines={1}>
            {l.kind === 'input' ? `${l.prompt ?? ''} › ${l.text}` : l.text}
          </Text>
        );
      })}
    </Pressable>
  );
}

function DebugBar() {
  const t = useTheme();
  const run = useApp((s) => s.run);
  const { runProgram, stepOnce, stepBack, stop } = useApp.getState();
  
  if (run?.status !== 'paused') return null;

  return (
    <View style={[{ backgroundColor: t.surfaceAlt, borderTopColor: t.warning, flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 2, flexWrap: 'wrap', gap: 8 }]}>
      <Button label="Continuar" kind="primary" icon="play" onPress={() => runProgram('run')} style={{ marginRight: 8 }} />
      <Button label="Siguiente" icon="play-skip-forward" onPress={stepOnce} style={{ marginRight: 8 }} />
      <Button label="Anterior" icon="play-skip-back" onPress={stepBack} style={{ marginRight: 8 }} />
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

  const currentVars = useMemo(() => {
    if (run?.status !== 'paused' && run?.status !== 'running') return undefined;
    const frame = run.frames?.[0];
    if (!frame) return undefined;
    const m: Record<string, string> = {};
    for (const scope of frame.scopes) {
      for (const v of scope.vars) {
        if (!(v.name in m)) m[v.name] = v.value;
      }
    }
    return m;
  }, [run?.status, run?.frames]);

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
      currentVars={currentVars}
    />
  );
  const runActive = run && run.status !== 'idle';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <Text style={[styles.brand, { color: t.text }]}>
            PS<Text style={{ color: '#e8b100' }}>JS</Text>
          </Text>
          <View style={{ flex: 1 }}>
            <FileTabs />
          </View>
          {Platform.OS === 'web' && (
            <>
              <a href="PSJavaScript.dmg" download="PSJavaScript.dmg" style={{ textDecoration: 'none', marginRight: 8 }}>
                <View style={[styles.repoLink, { borderColor: t.border, backgroundColor: t.surface }]}>
                  <Ionicons name="logo-apple" size={16} color={t.text} />
                  {width >= 600 ? <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', marginLeft: 5 }}>macOS</Text> : null}
                </View>
              </a>
              <a href="PSJavaScript-Setup.exe" download="PSJavaScript-Setup.exe" style={{ textDecoration: 'none', marginRight: 8 }}>
                <View style={[styles.repoLink, { borderColor: t.border, backgroundColor: t.surface }]}>
                  <Ionicons name="logo-windows" size={16} color={t.text} />
                  {width >= 600 ? <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', marginLeft: 5 }}>Windows</Text> : null}
                </View>
              </a>
            </>
          )}
          <Pressable
            onPress={() => Linking.openURL(REPO_URL)}
            accessibilityRole="link"
            accessibilityLabel="Ver el código fuente en GitHub"
            {...({ title: 'Ver el código fuente en GitHub' } as object)}
            style={({ pressed }) => [styles.repoLink, { borderColor: t.border, backgroundColor: pressed ? t.surfaceAlt : t.surface }]}
          >
            <Ionicons name="logo-github" size={16} color={t.text} />
            {width >= 600 ? <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', marginLeft: 5 }}>Código fuente</Text> : null}
          </Pressable>
        </View>
        <View style={[styles.toolbarWrap, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <Toolbar compact={width < 1200} />
        </View>
        <Notice />

        <View style={{ flex: 1 }}>
        {wide ? (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1.15, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: t.border }}>{editor}</View>
            <View style={{ flex: 1, minWidth: 380 }}>
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
            <View style={{ flex: 1 }}>{panel === 'editor' ? editor : <PanelView id={panel} />}</View>
            {panel === 'editor' && runActive ? <MiniConsole /> : null}
          </View>
        )}
          <Mascot />
        </View>

        <InputBar />
        <DebugBar />
        <View style={{ paddingBottom: insets.bottom, backgroundColor: t.surfaceAlt }}>
          <StatusBar />
          <Footer />
        </View>
      </View>

      {modal === 'files' ? <FilesModal /> : null}
      {modal === 'export' ? <ExportModal /> : null}
      {modal === 'settings' ? <SettingsModal /> : null}
      {modal === 'help' ? <HelpModal /> : null}
      {modal === 'insert' ? <InsertModal /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 10, paddingTop: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  repoLink: { flexDirection: 'row', alignItems: 'center', height: 28, paddingHorizontal: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginHorizontal: 8, marginBottom: 4 },
  brand: { fontSize: 17, fontWeight: '900', marginRight: 10, marginBottom: 8, letterSpacing: -0.5 },
  fileTab: { flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0, maxWidth: 220 },
  addTab: { height: 34, width: 34, alignItems: 'center', justifyContent: 'center' },
  toolbarWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  toolbar: { alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3 },
  sep: { width: StyleSheet.hairlineWidth, height: 24, marginHorizontal: 6 },
  speed: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 6, height: 30, marginLeft: 4 },
  tabs: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  status: { flexDirection: 'row', alignItems: 'center', height: 28, paddingHorizontal: 10, borderTopWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderBottomWidth: 2 },
  mini: { maxHeight: 92, paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
});
