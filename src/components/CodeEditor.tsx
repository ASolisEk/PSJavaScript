/**
 * Editor de código con resaltado de sintaxis.
 *
 * Técnica: un TextInput multilínea con texto transparente se superpone a una
 * capa que dibuja el código coloreado línea por línea. Ambos usan la misma
 * fuente monoespaciada, tamaño, interlineado y márgenes, por lo que el cursor
 * y la selección del TextInput coinciden con el texto visible.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Diagnostic } from '../core/analyzer';
import { CatalogItem, lookupHelp, suggest } from '../core/catalog';
import { dedentOnClose, INDENT, newlineWithIndent, toggleComment } from '../core/editor/indent';
import { declaredNames, LineToken, matchBracket, tokenize, tokensByLine, wordBefore } from '../core/editor/tokenizer';
import { useApp } from '../store/app';
import { MONO, Theme, useTheme } from '../ui/theme';

export interface EditorRequest {
  nonce: number;
  kind: 'jump' | 'insert' | 'replaceAll';
  line?: number;
  text?: string;
}

interface Props {
  code: string;
  onChange(code: string): void;
  breakpoints: number[];
  onToggleBreakpoint(line: number): void;
  execLine: number | null;
  errorLine: number | null;
  diagnostics: Diagnostic[];
  fontSize: number;
  showSymbolBar: boolean;
  currentVars?: Record<string, string>;
}

/** Último pedido externo atendido (compartido entre montajes del editor). */
let handledRequest = 0;

const PAD_TOP = 8;
/** En web, Text colapsa los espacios iniciales salvo con white-space: pre. */
const WEB_PRE: any = Platform.OS === 'web' ? { whiteSpace: 'pre' } : null;
const PAD_LEFT = 10;
const SYMBOLS: { label: string; insert: string }[] = [
  { label: '⇥', insert: INDENT + '$0' },
  { label: '{ }', insert: '{$0}' },
  { label: '( )', insert: '($0)' },
  { label: '[ ]', insert: '[$0]' },
  { label: ';', insert: ';$0' },
  { label: '=', insert: '=$0' },
  { label: '" "', insert: '"$0"' },
  { label: "' '", insert: "'$0'" },
  { label: '` `', insert: '`$0`' },
  { label: '${}', insert: '${$0}' },
  { label: '<', insert: '<$0' },
  { label: '>', insert: '>$0' },
  { label: '+', insert: '+$0' },
  { label: '-', insert: '-$0' },
  { label: '*', insert: '*$0' },
  { label: '/', insert: '/$0' },
  { label: '%', insert: '%$0' },
  { label: '!', insert: '!$0' },
  { label: '&&', insert: ' && $0' },
  { label: '||', insert: ' || $0' },
  { label: '.', insert: '.$0' },
  { label: ',', insert: ', $0' },
  { label: ':', insert: ': $0' },
  { label: '=>', insert: ' => $0' },
];

interface Sel {
  start: number;
  end: number;
}

// ───────────────────────────── líneas resaltadas ─────────────────────────────

interface LineProps {
  tokens: LineToken[];
  bg: string | undefined;
  brackets: string; // posiciones resaltadas serializadas (para memo)
  theme: Theme;
  fontSize: number;
  lh: number;
  currentVars?: Record<string, string>;
}

const HLine = memo(function HLine({ tokens, bg, brackets, theme, fontSize, lh, currentVars }: LineProps) {
  const bset = brackets ? new Set(brackets.split(',').map(Number)) : null;
  return (
    <View style={{ height: lh, backgroundColor: bg }}>
      <Text style={[{ fontFamily: MONO, fontSize, lineHeight: lh, color: theme.syntax.ident }, WEB_PRE]}>
        {tokens.map((t, i) => {
          const val = t.type === 'ident' && currentVars ? currentVars[t.text] : undefined;
          const extraProps: any = val !== undefined ? Platform.select({ web: { title: `${t.text} = ${val}` }, default: {} }) : {};
          return (
            <Text
              key={i}
              {...extraProps}
              style={[
                { color: theme.syntax[t.type] },
                t.type === 'comment' ? styles.italic : null,
                t.type === 'keyword' ? styles.bold : null,
                bset?.has(t.start) ? { backgroundColor: theme.bracket } : null,
                val !== undefined ? { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: theme.textMuted } : null,
              ]}
            >
              {t.text}
            </Text>
          );
        })}
        {tokens.length === 0 ? ' ' : ''}
      </Text>
    </View>
  );
});

interface GutterProps {
  n: number;
  bp: boolean;
  exec: boolean;
  sev: 'error' | 'warning' | 'info' | null;
  width: number;
  lh: number;
  fontSize: number;
  theme: Theme;
  onPress(n: number): void;
}

const GutterLine = memo(function GutterLine({ n, bp, exec, sev, width, lh, fontSize, theme, onPress }: GutterProps) {
  const color = sev === 'error' ? theme.danger : sev === 'warning' ? theme.warning : exec ? theme.text : theme.gutterText;
  return (
    <Pressable
      onPress={() => onPress(n)}
      accessibilityLabel={`Línea ${n}${bp ? ', punto de interrupción' : ''}`}
      style={{ height: lh, width, flexDirection: 'row', alignItems: 'center', backgroundColor: exec ? theme.execLine : undefined }}
    >
      <View style={{ width: 16, alignItems: 'center' }}>
        {bp ? <View style={[styles.bpDot, { backgroundColor: theme.danger }]} /> : exec ? <Text style={{ color: theme.warning, fontSize: fontSize - 2 }}>▶</Text> : null}
      </View>
      <Text style={{ flex: 1, textAlign: 'right', paddingRight: 8, fontFamily: MONO, fontSize: fontSize - 2, color, fontWeight: sev || exec ? '700' : '400' }}>{n}</Text>
    </Pressable>
  );
});

// ───────────────────────────── editor ─────────────────────────────

export default function CodeEditor(props: Props) {
  const { code, onChange, breakpoints, onToggleBreakpoint, execLine, errorLine, diagnostics, fontSize, showSymbolBar } = props;
  const theme = useTheme();
  const lh = Math.round(fontSize * 1.55);
  const charW = fontSize * 0.61;
  const inputRef = useRef<TextInput>(null);
  const vScroll = useRef<ScrollView>(null);
  const hScroll = useRef<ScrollView>(null);
  const codeRef = useRef(code);
  const selRef = useRef<Sel>({ start: 0, end: 0 });
  const [cursor, setCursor] = useState(0);
  const [sel, setSel] = useState<Sel | undefined>(undefined);
  const [viewport, setViewport] = useState({ w: 300, h: 300 });
  const scrollPos = useRef({ x: 0, y: 0 });
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const history = useRef<{ stack: { code: string; cursor: number }[]; index: number; last: number }>({ stack: [{ code, cursor: 0 }], index: 0, last: 0 });

  useLayoutEffect(() => {
    codeRef.current = code;
  }, [code]);

  const toks = useMemo(() => tokenize(code), [code]);
  const lines = useMemo(() => tokensByLine(code, toks), [code, toks]);
  const lineCount = lines.length;
  const lineStarts = useMemo(() => {
    const starts = [0];
    for (let i = 0; i < code.length; i++) if (code[i] === '\n') starts.push(i + 1);
    return starts;
  }, [code]);
  const longest = useMemo(() => code.split('\n').reduce((m, l) => Math.max(m, l.length), 0), [code]);
  const gutterW = Math.max(3, String(lineCount).length) * fontSize * 0.62 + 30;
  const contentW = Math.max(viewport.w - gutterW, longest * charW + PAD_LEFT * 2 + 80);
  const contentH = Math.max(viewport.h, lineCount * lh + PAD_TOP * 2 + lh * 4);

  const bracket = useMemo(() => matchBracket(toks, cursor), [toks, cursor]);
  const bracketByLine = useMemo(() => {
    const m = new Map<number, number[]>();
    if (bracket)
      for (const pos of bracket) {
        let li = 0;
        while (li + 1 < lineStarts.length && lineStarts[li + 1] <= pos) li++;
        m.set(li, [...(m.get(li) ?? []), pos]);
      }
    return m;
  }, [bracket, lineStarts]);

  const sevByLine = useMemo(() => {
    const m = new Map<number, 'error' | 'warning' | 'info'>();
    for (const d of diagnostics) {
      const prev = m.get(d.line);
      if (!prev || d.severity === 'error' || (d.severity === 'warning' && prev === 'info')) m.set(d.line, d.severity);
    }
    if (errorLine) m.set(errorLine, 'error');
    return m;
  }, [diagnostics, errorLine]);

  const bpSet = useMemo(() => new Set(breakpoints), [breakpoints]);
  const cursorLine = useMemo(() => {
    let li = 0;
    while (li + 1 < lineStarts.length && lineStarts[li + 1] <= cursor) li++;
    return li + 1;
  }, [cursor, lineStarts]);

  // ── historial (deshacer / rehacer) ──
  const pushHistory = useCallback((text: string, cur: number, force = false) => {
    const h = history.current;
    const now = Date.now();
    if (!force && now - h.last < 600 && h.index > 0) {
      h.stack[h.index] = { code: text, cursor: cur };
    } else {
      h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push({ code: text, cursor: cur });
      if (h.stack.length > 200) h.stack.shift();
      h.index = h.stack.length - 1;
    }
    h.last = now;
  }, []);

  const apply = useCallback(
    (text: string, caret: number | null, forceHistory = false) => {
      if (caret !== null) {
        selRef.current = { start: caret, end: caret };
        setSel({ start: caret, end: caret });
        setCursor(caret);
      }
      pushHistory(text, caret ?? selRef.current.start, forceHistory);
      codeRef.current = text;
      onChange(text);
    },
    [onChange, pushHistory],
  );

  const undo = useCallback(() => {
    const h = history.current;
    if (h.stack[h.index]?.code !== codeRef.current) {
      h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push({ code: codeRef.current, cursor: selRef.current.start });
      h.index = h.stack.length - 1;
    }
    if (h.index === 0) return;
    h.index--;
    const s = h.stack[h.index];
    h.last = 0;
    setSel({ start: s.cursor, end: s.cursor });
    selRef.current = { start: s.cursor, end: s.cursor };
    codeRef.current = s.code;
    onChange(s.code);
  }, [onChange]);

  const redo = useCallback(() => {
    const h = history.current;
    if (h.index >= h.stack.length - 1) return;
    h.index++;
    const s = h.stack[h.index];
    h.last = 0;
    setSel({ start: s.cursor, end: s.cursor });
    selRef.current = { start: s.cursor, end: s.cursor };
    codeRef.current = s.code;
    onChange(s.code);
  }, [onChange]);

  // ── inserción de fragmentos ──
  const insertAt = useCallback(
    (snippet: string, from: number, to: number) => {
      const text = codeRef.current;
      const lineStart = text.lastIndexOf('\n', from - 1) + 1;
      const indent = /^[ \t]*/.exec(text.slice(lineStart))![0];
      let ins = snippet
        .split('\n')
        .map((l, i) => (i === 0 ? l : indent + l))
        .join('\n');
      const caretIdx = ins.indexOf('$0');
      ins = ins.replace('$0', '');
      apply(text.slice(0, from) + ins + text.slice(to), from + (caretIdx >= 0 ? caretIdx : ins.length), true);
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [apply],
  );

  const insertSnippet = useCallback((snippet: string) => insertAt(snippet, selRef.current.start, selRef.current.end), [insertAt]);

  // ── cambios de texto ──
  const handleChange = useCallback(
    (raw: string) => {
      const text = raw.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\t/g, INDENT);
      const prev = codeRef.current;
      if (text.length === prev.length + 1) {
        // Posición de inserción: se prefiere la del cursor (el diff es ambiguo
        // cuando se repite el mismo carácter, p. ej. Enter junto a otro salto).
        const insertedAt = (c: number) => c >= 0 && c <= prev.length && text.slice(0, c) === prev.slice(0, c) && text.slice(c + 1) === prev.slice(c);
        let p = 0;
        while (p < prev.length && prev[p] === text[p]) p++;
        const c = selRef.current.start;
        if (insertedAt(c)) p = c;
        else if (insertedAt(c - 1)) p = c - 1;
        if (insertedAt(p)) {
          const ch = text[p];
          if (ch === '\n') {
            const r = newlineWithIndent(prev, p);
            apply(r.text, r.cursor, true);
            setSuggestions([]);
            return;
          }
          if (ch === '}' || ch === ']' || ch === ')') {
            const r = dedentOnClose(text, p + 1);
            if (r) {
              apply(r.text, r.cursor);
              return;
            }
          }
          // sugerencias de autocompletado
          const { word } = wordBefore(text, p + 1);
          if (/^[A-Za-z_$][\w$.]*$/.test(word) && (word.length >= 2 || word.endsWith('.'))) {
            setSuggestions(suggest(word, declaredNames(text)));
          } else setSuggestions([]);
          apply(text, null);
          return;
        }
      }
      setSuggestions([]);
      apply(text, null, text.length !== prev.length + 1 && text.length !== prev.length - 1);
    },
    [apply],
  );

  const ensureVisible = useCallback(
    (offset: number) => {
      const text = codeRef.current;
      const before = text.slice(0, offset);
      const line = before.split('\n').length;
      const col = offset - (before.lastIndexOf('\n') + 1);
      const y = PAD_TOP + (line - 1) * lh;
      const { y: sy, x: sx } = scrollPos.current;
      if (y < sy + 4 || y + lh * 2 > sy + viewport.h) vScroll.current?.scrollTo({ y: Math.max(0, y - viewport.h / 3), animated: true });
      const x = PAD_LEFT + col * charW;
      const visibleW = viewport.w - gutterW;
      if (x < sx + 10 || x > sx + visibleW - 30) hScroll.current?.scrollTo({ x: Math.max(0, x - visibleW / 2), animated: false });
    },
    [lh, charW, viewport, gutterW],
  );

  const onSelectionChange = useCallback(
    (e: NativeSyntheticEvent<{ selection: Sel }>) => {
      const s = e.nativeEvent.selection;
      selRef.current = s;
      setCursor(s.end);
      if (sel) setSel(undefined);
      ensureVisible(s.end);
    },
    [sel, ensureVisible],
  );

  // ── teclado físico (web / escritorio) ──
  const onKeyPress = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web') return;
      const ne = e.nativeEvent;
      const mod = ne.ctrlKey || ne.metaKey;
      const { start, end } = selRef.current;
      const text = codeRef.current;
      if (ne.key === 'Tab') {
        e.preventDefault();
        if (ne.shiftKey) {
          const ls = text.lastIndexOf('\n', start - 1) + 1;
          if (text.startsWith(INDENT, ls)) apply(text.slice(0, ls) + text.slice(ls + INDENT.length), Math.max(ls, start - INDENT.length), true);
        } else if (start !== end && text.slice(start, end).includes('\n')) {
          const ls = text.lastIndexOf('\n', start - 1) + 1;
          const block = text.slice(ls, end).split('\n').map((l) => INDENT + l).join('\n');
          apply(text.slice(0, ls) + block + text.slice(end), ls + block.length, true);
        } else insertAt(INDENT + '$0', start, end);
      } else if (mod && (ne.key === 'z' || ne.key === 'Z')) {
        e.preventDefault();
        if (ne.shiftKey) redo();
        else undo();
      } else if (mod && (ne.key === 'y' || ne.key === 'Y')) {
        e.preventDefault();
        redo();
      } else if (mod && ne.key === '/') {
        e.preventDefault();
        const r = toggleComment(text, start, end);
        apply(r.text, r.end, true);
      } else if (ne.key === 'Escape') setSuggestions([]);
    },
    [apply, insertAt, undo, redo],
  );

  // ── solicitudes externas (saltar a línea, insertar, reemplazar) ──
  const handleRequest = useCallback(
    (request: EditorRequest | null) => {
      if (!request || request.nonce <= handledRequest) return;
      handledRequest = request.nonce;
      if (request.kind === 'jump' && request.line) {
        const lines = codeRef.current.split('\n');
        let off = 0;
        for (let i = 0; i < Math.min(request.line, lines.length) - 1; i++) off += lines[i].length + 1;
        selRef.current = { start: off, end: off };
        setSel({ start: off, end: off });
        setCursor(off);
        vScroll.current?.scrollTo({ y: Math.max(0, (request.line - 4) * lh), animated: true });
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (request.kind === 'insert' && request.text !== undefined) {
        insertSnippet(request.text);
      } else if (request.kind === 'replaceAll' && request.text !== undefined) {
        apply(request.text, Math.min(selRef.current.start, request.text.length), true);
      }
    },
    [lh, insertSnippet, apply],
  );

  useEffect(() => {
    // pedido hecho justo antes de montar el editor (p. ej. al cambiar de panel)
    const pending = setTimeout(() => handleRequest(useApp.getState().editorRequest), 0);
    const unsubscribe = useApp.subscribe((s, prev) => {
      if (s.editorRequest !== prev.editorRequest) handleRequest(s.editorRequest);
    });
    return () => {
      clearTimeout(pending);
      unsubscribe();
    };
  }, [handleRequest]);

  // ── seguir la línea en ejecución ──
  useEffect(() => {
    if (!execLine) return;
    const y = PAD_TOP + (execLine - 1) * lh;
    const sy = scrollPos.current.y;
    if (y < sy || y + lh * 2 > sy + viewport.h) vScroll.current?.scrollTo({ y: Math.max(0, y - viewport.h / 3), animated: true });
  }, [execLine, lh, viewport.h]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport({ w: width, h: height });
  };
  const onVScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollPos.current.y = e.nativeEvent.contentOffset.y;
  };
  const onHScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollPos.current.x = e.nativeEvent.contentOffset.x;
  };

  const toggleBp = useCallback((n: number) => onToggleBreakpoint(n), [onToggleBreakpoint]);

  // ── barra de información: diagnóstico de la línea o ayuda de la palabra ──
  const info = useMemo(() => {
    const d = diagnostics.find((x) => x.line === cursorLine);
    if (d) return { kind: d.severity, text: d.message };
    let s = cursor;
    let e = cursor;
    while (s > 0 && /[\w$.]/.test(code[s - 1])) s--;
    while (e < code.length && /[\w$]/.test(code[e])) e++;
    const word = code.slice(s, e).replace(/^\.+/, '');
    const item = lookupHelp(word) ?? lookupHelp(word.slice(word.lastIndexOf('.')));
    if (item) return { kind: 'help' as const, text: `${item.signature ?? item.label} — ${item.doc}${item.pseint ? `  (PSeInt: ${item.pseint})` : ''}` };
    return null;
  }, [diagnostics, cursorLine, cursor, code]);

  const webInputStyle: any = Platform.OS === 'web' ? { outlineStyle: 'none', caretColor: theme.text, whiteSpace: 'pre', overflow: 'hidden', resize: 'none' } : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <ScrollView ref={vScroll} onScroll={onVScroll} scrollEventThrottle={32} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', minHeight: contentH }}>
            <View style={{ width: gutterW, backgroundColor: theme.gutter, paddingTop: PAD_TOP, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }}>
              {lines.map((_, i) => (
                <GutterLine
                  key={i}
                  n={i + 1}
                  bp={bpSet.has(i + 1)}
                  exec={execLine === i + 1}
                  sev={sevByLine.get(i + 1) ?? null}
                  width={gutterW}
                  lh={lh}
                  fontSize={fontSize}
                  theme={theme}
                  onPress={toggleBp}
                />
              ))}
            </View>
            <ScrollView ref={hScroll} horizontal onScroll={onHScroll} scrollEventThrottle={32} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
              <View style={{ width: contentW, height: contentH }}>
                <View pointerEvents="none" style={{ position: 'absolute', top: PAD_TOP, left: 0, right: 0 }}>
                  {lines.map((toksOfLine, i) => {
                    const n = i + 1;
                    const sev = sevByLine.get(n);
                    const bg =
                      execLine === n ? theme.execLine : sev === 'error' ? theme.errorLine : sev === 'warning' ? theme.warnLine : undefined;
                    return (
                      <View key={i} style={{ paddingLeft: PAD_LEFT }}>
                        <HLine tokens={toksOfLine} bg={bg} brackets={(bracketByLine.get(i) ?? []).join(',')} theme={theme} fontSize={fontSize} lh={lh} />
                      </View>
                    );
                  })}
                </View>
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={handleChange}
                  onSelectionChange={onSelectionChange}
                  onKeyPress={onKeyPress}
                  selection={sel}
                  multiline
                  scrollEnabled={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'default'}
                  textAlignVertical="top"
                  selectionColor={theme.primary}
                  cursorColor={theme.text}
                  smartInsertDelete={false}
                  accessibilityLabel="Editor de código"
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: contentW,
                      height: contentH,
                      paddingTop: PAD_TOP,
                      paddingLeft: PAD_LEFT,
                      paddingRight: PAD_LEFT,
                      paddingBottom: 0,
                      margin: 0,
                      borderWidth: 0,
                      fontFamily: MONO,
                      fontSize,
                      lineHeight: lh,
                      color: 'transparent',
                      backgroundColor: 'transparent',
                    },
                    webInputStyle,
                  ]}
                />
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {info ? (
        <View style={[styles.infoBar, { backgroundColor: theme.surfaceAlt, borderTopColor: theme.border }]}>
          <Ionicons
            name={info.kind === 'help' ? 'information-circle-outline' : info.kind === 'error' ? 'close-circle' : 'warning'}
            size={15}
            color={info.kind === 'error' ? theme.danger : info.kind === 'help' ? theme.info : theme.warning}
          />
          <Text style={{ color: theme.text, fontSize: 12, flex: 1, marginLeft: 6 }} numberOfLines={2}>
            {info.text}
          </Text>
        </View>
      ) : null}

      {suggestions.length ? (
        <ScrollView horizontal keyboardShouldPersistTaps="always" style={[styles.bar, { backgroundColor: theme.surfaceAlt, borderTopColor: theme.border }]} contentContainerStyle={styles.barContent}>
          {suggestions.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => {
                const { start } = wordBefore(codeRef.current, selRef.current.start);
                insertAt(s.insert, start, selRef.current.end);
              }}
              style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={{ color: s.kind === 'keyword' ? theme.syntax.keyword : s.kind === 'constant' ? theme.text : theme.syntax.func, fontFamily: MONO, fontSize: 13 }}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {showSymbolBar ? (
        <ScrollView horizontal keyboardShouldPersistTaps="always" style={[styles.bar, { backgroundColor: theme.surfaceAlt, borderTopColor: theme.border }]} contentContainerStyle={styles.barContent}>
          <Pressable onPress={undo} style={[styles.sym, { borderColor: theme.border, backgroundColor: theme.surface }]} accessibilityLabel="Deshacer">
            <Ionicons name="arrow-undo" size={16} color={theme.text} />
          </Pressable>
          <Pressable onPress={redo} style={[styles.sym, { borderColor: theme.border, backgroundColor: theme.surface }]} accessibilityLabel="Rehacer">
            <Ionicons name="arrow-redo" size={16} color={theme.text} />
          </Pressable>
          {SYMBOLS.map((s) => (
            <Pressable key={s.label} onPress={() => insertSnippet(s.insert)} style={[styles.sym, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={{ color: theme.text, fontFamily: MONO, fontSize: 14 }}>{s.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              const { start, end } = selRef.current;
              const r = toggleComment(codeRef.current, start, end);
              apply(r.text, r.end, true);
            }}
            style={[styles.sym, { borderColor: theme.border, backgroundColor: theme.surface }]}
            accessibilityLabel="Comentar líneas"
          >
            <Text style={{ color: theme.text, fontFamily: MONO, fontSize: 14 }}>{'//'}</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  italic: { fontStyle: 'italic' },
  bold: { fontWeight: '600' },
  bpDot: { width: 10, height: 10, borderRadius: 5 },
  infoBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth },
  bar: { flexGrow: 0, borderTopWidth: StyleSheet.hairlineWidth },
  barContent: { paddingHorizontal: 6, paddingVertical: 5, alignItems: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginRight: 6 },
  sym: { minWidth: 36, height: 32, paddingHorizontal: 8, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, marginRight: 5, alignItems: 'center', justifyContent: 'center' },
});
