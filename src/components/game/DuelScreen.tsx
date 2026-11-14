/**
 * Duelo de dos jugadores: uno DEFIENDE la granja (dron normal) y el otro ATACA (dron intruso).
 * Cada quien escribe su programa; después los dos corren por turnos y gana quien sume más puntos.
 * Se juega en el mismo dispositivo (por turnos, sin mirar) o en línea con un código de sala.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../ui/text';
import { analyze, Diagnostic, hasBlockingErrors } from '../../core/analyzer';
import { isValidRoomCode, normalizeRoomCode } from '../../core/exam/random';
import { defaultTransport, transportOptions, TransportSpec } from '../../core/exam/transport';
import { API_DOCS, GAME_GLOBAL_NAMES, GameTheme, themed } from '../../core/game/api';
import { DUEL_LENGTHS, DUEL_STARTER, DuelConfig, DuelMatch, DuelRole, duelRules } from '../../core/game/duel';
import { DUEL_HACK_POINTS } from '../../core/game/world';
import { getProfile } from '../../core/profiles';
import { useApp } from '../../store/app';
import { roleOf, useDuel } from '../../store/duel';
import { useNetwork } from '../../store/network';
import { confirmDialog, copyText } from '../../ui/platform';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import CodeEditor from '../CodeEditor';
import ModalShell from '../modals/ModalShell';
import { Banner, Button, Card, CodeBlock, Field, IconName, Pill, ProgressBar, ScreenHeader, Segmented, TextField, tint } from '../ui';
import { playSound } from './sound';
import WorldView from './WorldView';

/** Los duelos usan siempre el mismo perfil del lenguaje: así los dos dispositivos simulan igual. */
const PROFILE = getProfile('flexible');

const ROLE: Record<DuelRole, { label: string; icon: IconName; verb: string; goal: string }> = {
  defense: { label: 'Defensa', icon: 'shield-checkmark', verb: 'defiende', goal: 'Cosecha todo lo que puedas y hackea al atacante cuando se acerque.' },
  attack: { label: 'Ataque', icon: 'bug', verb: 'ataca', goal: 'Roba las cosechas maduras antes que la defensa y no dejes que te hackeen.' },
};

const SPEEDS = [
  { id: 350, label: 'Lento' },
  { id: 120, label: 'Normal' },
  { id: 30, label: 'Rápido' },
];

function useRoleColor() {
  const t = useTheme();
  return (role: DuelRole) => (role === 'defense' ? t.accent : t.danger);
}

export default function DuelScreen({ theme, onExit }: { theme: GameTheme; onExit(): void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const phase = useDuel((s) => s.phase);
  const hydrated = useDuel((s) => s.hydrated);
  const names = useDuel((s) => s.names);
  const wins = useDuel((s) => s.wins);
  const ties = useDuel((s) => s.ties);
  const round = useDuel((s) => s.round);
  const netError = useDuel((s) => s.netError);

  useEffect(() => {
    useDuel.getState().hydrate();
    useNetwork.getState().hydrate();
  }, []);

  const exit = async () => {
    const st = useDuel.getState();
    if (st.phase !== 'menu' && !(await confirmDialog('¿Salir del duelo?', 'Se termina la serie y se pierde el marcador.', 'Salir'))) return;
    st.leave();
    if (st.phase === 'menu') onExit();
  };

  const played = wins[0] + wins[1] + ties;
  let body: React.ReactNode;
  if (!hydrated) body = <ActivityIndicator color={t.primary} style={{ marginTop: 40 }} />;
  else if (phase === 'menu') body = <DuelMenu theme={theme} />;
  else if (phase === 'lobby') body = <Lobby />;
  else if (phase === 'handoff') body = <Handoff />;
  else if (phase === 'code') body = <CodePhase key={`${round}-${useDuel.getState().writing}`} />;
  else if (phase === 'waiting') body = <WaitingRival />;
  else body = <Arena key={`${round}-${useDuel.getState().seed}`} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScreenHeader
        icon="people-outline"
        title="Duelo de drones"
        subtitle={phase === 'menu' ? 'Defensa contra ataque · 2 jugadores' : `Ronda ${round} · ${names[0]} contra ${names[1]}`}
        color={t.danger}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {played ? <Pill icon="trophy-outline" color={t.warning} text={`${names[0]} ${wins[0]} · ${wins[1]} ${names[1]}${ties ? ` · ${ties} empate${ties === 1 ? '' : 's'}` : ''}`} /> : null}
            <Button label={phase === 'menu' ? 'Volver al juego' : 'Salir del duelo'} icon="arrow-back" size="sm" onPress={exit} />
          </View>
        }
      />
      {netError && phase !== 'menu' ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
          <Banner icon="cloud-offline-outline" color={t.warning} text={netError} />
        </View>
      ) : null}
      {body}
    </View>
  );
}

// ───────────────────────────── menú ─────────────────────────────

function Rules({ turns }: { turns: number }) {
  const t = useTheme();
  return (
    <View>
      {duelRules(turns).map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{ color: t.textMuted, width: 16 }}>•</Text>
          <Text style={{ color: t.text, fontSize: 13, lineHeight: 19, flex: 1 }}>{r}</Text>
        </View>
      ))}
    </View>
  );
}

function LengthPicker() {
  const turns = useDuel((s) => s.turns);
  return (
    <Field label="Duración de la partida">
      <Segmented options={DUEL_LENGTHS.map((l) => ({ id: l.turns, label: `${l.label} (${l.turns})` }))} value={turns} onChange={(v) => useDuel.getState().setTurns(v)} />
    </Field>
  );
}

function DuelMenu({ theme }: { theme: GameTheme }) {
  const t = useTheme();
  const color = useRoleColor();
  const saved = useDuel((s) => s.savedNames);
  const turns = useDuel((s) => s.turns);
  const net = useDuel((s) => s.net);
  const netError = useDuel((s) => s.netError);
  const [mode, setMode] = useState<'local' | 'online'>('local');
  const [n0, setN0] = useState(saved[0]);
  const [n1, setN1] = useState(saved[1]);
  /** 0 o 1: quién defiende; 2: al azar. */
  const [first, setFirst] = useState<0 | 1 | 2>(2);
  const [online, setOnline] = useState<'host' | 'join'>('host');
  const [code, setCode] = useState('');
  const [spec, setSpec] = useState<TransportSpec>(() => defaultTransport());
  const options = transportOptions().filter((o) => o.available);
  const pick = (): 0 | 1 => (first === 2 ? (Math.random() < 0.5 ? 0 : 1) : first);
  const busy = net === 'opening';
  const transport = (): TransportSpec => (spec.kind === 'internet' && useNetwork.getState().net ? { ...spec, net: useNetwork.getState().net! } : spec);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '100%', maxWidth: 760 }}>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            {(['defense', 'attack'] as DuelRole[]).map((r) => (
              <View key={r} style={[styles.roleCard, { borderColor: tint(color(r), 0.5), backgroundColor: tint(color(r), 0.08) }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name={ROLE[r].icon} size={18} color={color(r)} />
                  <Text style={{ color: color(r), fontWeight: '900', fontSize: 15, marginLeft: 6 }}>{ROLE[r].label.toUpperCase()}</Text>
                </View>
                <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>
                  {r === 'defense' ? 'Programa el dron de la granja (modo normal).' : 'Programa el dron intruso (modo hackeo).'} {ROLE[r].goal}
                </Text>
              </View>
            ))}
          </View>
          <Rules turns={turns} />
        </Card>

        <Card>
          <Segmented
            options={[
              { id: 'local', label: 'En este dispositivo', icon: 'phone-portrait-outline' },
              { id: 'online', label: 'En línea (2 dispositivos)', icon: 'globe-outline' },
            ]}
            value={mode}
            onChange={(v) => setMode(v as 'local' | 'online')}
            style={{ marginBottom: 12 }}
          />
          {mode === 'local' ? (
            <>
              <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 10 }}>Cada jugador escribe su programa por turnos, sin que el otro mire. Después ven el combate juntos.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Field label="Jugador 1" style={{ flex: 1, minWidth: 180 }}>
                  <TextField value={n0} onChangeText={setN0} maxLength={40} />
                </Field>
                <Field label="Jugador 2" style={{ flex: 1, minWidth: 180 }}>
                  <TextField value={n1} onChangeText={setN1} maxLength={40} />
                </Field>
              </View>
              <Field label="¿Quién defiende primero?">
                <Segmented
                  options={[
                    { id: 0, label: n0.trim() || 'Jugador 1' },
                    { id: 1, label: n1.trim() || 'Jugador 2' },
                    { id: 2, label: 'Al azar', icon: 'shuffle-outline' },
                  ]}
                  value={first}
                  onChange={(v) => setFirst(v as 0 | 1 | 2)}
                />
              </Field>
              <LengthPicker />
              <Button
                label="Comenzar duelo"
                icon="flash"
                kind="primary"
                style={{ height: 48 }}
                onPress={() => useDuel.getState().startLocal({ names: [n0.trim() || 'Jugador 1', n1.trim() || 'Jugador 2'], defender: pick(), turns, theme })}
              />
            </>
          ) : (
            <>
              <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 10 }}>Cada quien programa en su dispositivo. Uno crea la sala y le dice el código al otro.</Text>
              <Segmented
                options={[
                  { id: 'host', label: 'Crear sala', icon: 'add-circle-outline' },
                  { id: 'join', label: 'Unirme con código', icon: 'log-in-outline' },
                ]}
                value={online}
                onChange={(v) => setOnline(v as 'host' | 'join')}
                style={{ marginBottom: 12 }}
              />
              <Field label="Tu nombre">
                <TextField value={online === 'host' ? n0 : n1} onChangeText={online === 'host' ? setN0 : setN1} maxLength={40} />
              </Field>
              {online === 'host' ? (
                <>
                  <Field label="Tu papel en la primera ronda">
                    <Segmented
                      options={[
                        { id: 0, label: 'Defiendo', icon: 'shield-checkmark-outline' },
                        { id: 1, label: 'Ataco', icon: 'bug-outline' },
                        { id: 2, label: 'Al azar', icon: 'shuffle-outline' },
                      ]}
                      value={first}
                      onChange={(v) => setFirst(v as 0 | 1 | 2)}
                    />
                  </Field>
                  <LengthPicker />
                </>
              ) : (
                <Field label="Código de la sala" hint="Las 6 letras y números que te dice tu rival.">
                  <TextField value={code} onChangeText={(v) => setCode(normalizeRoomCode(v))} placeholder="ABC123" autoCapitalize="characters" autoCorrect={false} maxLength={8} style={{ fontFamily: MONO, fontSize: 22, fontWeight: '800', letterSpacing: 6, textAlign: 'center' }} />
                </Field>
              )}
              <Field label="Conexión (la misma en los dos dispositivos)">
                <Segmented options={options.map((o) => ({ id: o.kind, label: o.label, icon: o.icon as IconName }))} value={spec.kind as any} onChange={(k) => setSpec({ kind: k as TransportSpec['kind'], url: k === 'lan' ? spec.url ?? '' : undefined })} />
              </Field>
              {spec.kind === 'lan' ? (
                <Field label="Dirección del servidor del aula" hint="La que muestra «npm run sala», por ejemplo 192.168.1.10:8787">
                  <TextField value={spec.url ?? ''} onChangeText={(url) => setSpec({ kind: 'lan', url })} placeholder="192.168.1.10:8787" autoCapitalize="none" mono />
                </Field>
              ) : null}
              {netError ? <Banner icon="alert-circle" color={t.danger} text={netError} /> : null}
              {online === 'host' ? (
                <Button
                  label={busy ? 'Creando sala…' : 'Crear sala'}
                  icon="radio-outline"
                  kind="primary"
                  disabled={busy || (spec.kind === 'lan' && !spec.url?.trim())}
                  style={{ height: 48 }}
                  onPress={() => useDuel.getState().host({ name: n0.trim() || 'Jugador 1', defender: pick(), turns, theme, transport: transport() })}
                />
              ) : (
                <Button
                  label={busy ? 'Conectando…' : 'Unirme al duelo'}
                  icon="log-in-outline"
                  kind="primary"
                  disabled={busy || !isValidRoomCode(code) || (spec.kind === 'lan' && !spec.url?.trim())}
                  style={{ height: 48 }}
                  onPress={() => useDuel.getState().join({ name: n1.trim() || 'Jugador 2', code, transport: transport() })}
                />
              )}
            </>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

// ───────────────────────────── esperas ─────────────────────────────

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 560 }}>{children}</View>
    </ScrollView>
  );
}

function Lobby() {
  const t = useTheme();
  const room = useDuel((s) => s.room);
  const me = useDuel((s) => s.me);
  return (
    <Centered>
      <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
        <ActivityIndicator color={t.primary} />
        {me === 0 ? (
          <>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '800', marginTop: 14 }}>CÓDIGO DE LA SALA</Text>
            <Text selectable style={{ color: t.text, fontSize: 44, fontWeight: '900', letterSpacing: 10, fontFamily: MONO }}>
              {room}
            </Text>
            <Text style={{ color: t.text, fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
              Dile este código a tu rival. En su dispositivo: Juego → Duelo → En línea → «Unirme con código».
            </Text>
            <Button label="Copiar código" icon="copy-outline" size="sm" onPress={() => room && copyText(room)} style={{ marginTop: 10 }} />
          </>
        ) : (
          <Text style={{ color: t.text, fontSize: 15, marginTop: 12 }}>Entrando a la sala {room}…</Text>
        )}
      </Card>
    </Centered>
  );
}

function Handoff() {
  const t = useTheme();
  const color = useRoleColor();
  const names = useDuel((s) => s.names);
  const defender = useDuel((s) => s.defender);
  const writing = useDuel((s) => s.writing);
  const who = writing === 'defense' ? defender : ((1 - defender) as 0 | 1);
  return (
    <Centered>
      <Card accent={color(writing)} style={{ alignItems: 'center', paddingVertical: 26 }}>
        <Ionicons name="swap-horizontal" size={34} color={color(writing)} />
        <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: '800', marginTop: 8 }}>PASA EL DISPOSITIVO A</Text>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '900', textAlign: 'center' }}>{names[who]}</Text>
        <View style={{ marginTop: 8 }}>
          <Pill icon={ROLE[writing].icon} color={color(writing)} text={`Le toca: ${ROLE[writing].label}`} solid />
        </View>
        <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 19 }}>
          {writing === 'attack' ? 'El programa de la defensa ya está guardado y oculto. ' : ''}El otro jugador no debe mirar la pantalla mientras escribes.
        </Text>
        <Button label={`Soy ${names[who]}: escribir mi programa`} icon="create-outline" kind="primary" onPress={() => useDuel.getState().takeDevice()} style={{ marginTop: 16, height: 46 }} />
      </Card>
    </Centered>
  );
}

function WaitingRival() {
  const t = useTheme();
  const names = useDuel((s) => s.names);
  const me = useDuel((s) => s.me);
  const rivalReady = useDuel((s) => s.rivalReady);
  return (
    <Centered>
      <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
        <ActivityIndicator color={t.primary} />
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginTop: 12, textAlign: 'center' }}>Tu programa está listo</Text>
        <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
          {rivalReady ? 'Empezando el combate…' : `Esperando a que ${names[1 - me]} termine el suyo…`}
        </Text>
        <Button label="Seguir editando" icon="create-outline" onPress={() => useDuel.getState().unready()} style={{ marginTop: 14 }} />
      </Card>
    </Centered>
  );
}

// ───────────────────────────── escribir el programa ─────────────────────────────

function CodePhase() {
  const t = useTheme();
  const color = useRoleColor();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const fontSize = useApp((s) => s.settings.fontSize);
  const mode = useDuel((s) => s.mode);
  const names = useDuel((s) => s.names);
  const defender = useDuel((s) => s.defender);
  const me = useDuel((s) => s.me);
  const writing = useDuel((s) => s.writing);
  const turns = useDuel((s) => s.turns);
  const theme = useDuel((s) => s.theme);
  const role: DuelRole = mode === 'local' ? writing : roleOf(me, defender);
  const player = mode === 'local' ? (role === 'defense' ? defender : 1 - defender) : me;
  const [code, setCode] = useState(() => useDuel.getState().drafts[role]);
  const [diags, setDiags] = useState<Diagnostic[]>([]);
  const [practice, setPractice] = useState(false);
  const [showHelp, setShowHelp] = useState(wide);
  const c = color(role);

  useEffect(() => {
    const h = setTimeout(() => {
      useDuel.getState().setDraft(role, code);
      try {
        // en el duelo el while (true) es lo normal: la partida termina por turnos
        setDiags(analyze(code, PROFILE, GAME_GLOBAL_NAMES).filter((d) => d.rule !== 'infinite-loop'));
      } catch {
        setDiags([]);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [code, role]);

  const blocking = hasBlockingErrors(diags);
  const cfg: DuelConfig = { seed: 'practica', turns, theme };
  const docs = API_DOCS.filter((d) => d.group === 'Acciones' || d.group === 'Sensores' || d.name === 'getRivalPos' || (role === 'defense' && d.name === 'hack')).filter(
    (d) => !['clear', 'swap', 'measure', 'canMove', 'getCompanion', 'getTickCount'].includes(d.name) && !(role === 'attack' && ['plant', 'useItem', 'getWater', 'numItems'].includes(d.name)),
  );

  const help = (
    <View>
      <Text style={[styles.label, { color: t.textMuted }]}>REGLAS</Text>
      <Rules turns={turns} />
      <Text style={[styles.label, { color: t.textMuted, marginTop: 12 }]}>FUNCIONES DE TU DRON</Text>
      {docs.map((d) => (
        <View key={d.name} style={[styles.doc, { borderLeftColor: tint(c, 0.5) }]}>
          <Text style={{ color: t.syntax.func, fontFamily: MONO, fontSize: 12, fontWeight: '700' }}>{themed(d.sig, theme)}</Text>
          <Text style={{ color: t.text, fontSize: 12, lineHeight: 17 }}>{d.doc}</Text>
        </View>
      ))}
      <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
        Direcciones: <Text style={{ fontFamily: MONO }}>North, East, South, West</Text>. La granja mide 6×6 y da la vuelta en los bordes.
      </Text>
    </View>
  );

  const editor = (
    <View style={[styles.editor, { borderColor: c }, wide ? { flex: 1 } : { height: 340 }]}>
      <CodeEditor code={code} onChange={setCode} breakpoints={[]} onToggleBreakpoint={() => {}} execLine={null} errorLine={null} diagnostics={diags} fontSize={fontSize} listenRequests={false} />
    </View>
  );

  const actions = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <Button label="Probar" icon="play-outline" onPress={() => setPractice(true)} disabled={blocking} />
      <Button
        label="Restablecer"
        icon="refresh"
        kind="ghost"
        onPress={async () => {
          if (await confirmDialog('¿Restablecer el programa?', 'Se borra lo que escribiste y vuelve el programa inicial.', 'Restablecer')) setCode(DUEL_STARTER[role]);
        }}
      />
      {!wide ? <Button label={showHelp ? 'Ocultar reglas' : 'Reglas y funciones'} icon="book-outline" kind="ghost" onPress={() => setShowHelp((v) => !v)} /> : null}
      <View style={{ flex: 1 }} />
      {blocking ? <Pill icon="alert-circle" color={t.danger} text="Corrige los errores marcados" /> : null}
      <Button label={mode === 'local' ? (role === 'defense' ? 'Listo: guardar y ocultar' : 'Listo: ¡a combatir!') : 'Listo'} icon="checkmark" kind="primary" disabled={blocking || !code.trim()} onPress={() => useDuel.getState().submitCode(code)} />
    </View>
  );

  const banner = (
    <View style={[styles.roleBanner, { borderColor: tint(c, 0.5), backgroundColor: tint(c, 0.08) }]}>
      <Ionicons name={ROLE[role].icon} size={22} color={c} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: c, fontWeight: '900', fontSize: 13 }}>
          {names[player].toUpperCase()} · {ROLE[role].label.toUpperCase()}
        </Text>
        <Text style={{ color: t.text, fontSize: 13, lineHeight: 18 }}>{ROLE[role].goal}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row', padding: 12, gap: 12 }}>
          <View style={{ flex: 1.3, minWidth: 0, gap: 10 }}>
            {banner}
            {editor}
            {actions}
          </View>
          <ScrollView style={[styles.side, { borderColor: t.border, backgroundColor: t.surface }]} contentContainerStyle={{ padding: 14 }}>
            {help}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }} keyboardShouldPersistTaps="handled">
          {banner}
          {editor}
          {actions}
          {showHelp ? <Card>{help}</Card> : null}
        </ScrollView>
      )}
      {practice ? (
        <ModalShell title={`Prueba: tu ${ROLE[role].label.toLowerCase()} contra el programa inicial del rival`} onClose={() => setPractice(false)} wide>
          <Arena practice={{ cfg, defense: role === 'defense' ? code : DUEL_STARTER.defense, attack: role === 'attack' ? code : DUEL_STARTER.attack, role }} />
        </ModalShell>
      ) : null}
    </View>
  );
}

// ───────────────────────────── combate y resultado ─────────────────────────────

interface Practice {
  cfg: DuelConfig;
  defense: string;
  attack: string;
  role: DuelRole;
}

function Arena({ practice }: { practice?: Practice }) {
  const t = useTheme();
  const color = useRoleColor();
  const { width } = useWindowDimensions();
  const wide = width >= 1000 && !practice;
  const sounds = useApp((s) => s.settings.gameSounds);
  const phase = useDuel((s) => s.phase);
  const names = useDuel((s) => s.names);
  const defender = useDuel((s) => s.defender);
  const mode = useDuel((s) => s.mode);
  const me = useDuel((s) => s.me);
  const wins = useDuel((s) => s.wins);
  const ties = useDuel((s) => s.ties);
  const [match] = useState(() => {
    if (practice) return new DuelMatch(practice.cfg, practice.defense, practice.attack, PROFILE);
    const s = useDuel.getState();
    return new DuelMatch({ seed: s.seed, turns: s.turns, theme: s.theme }, s.codes.defense, s.codes.attack, PROFILE);
  });
  const [, setVersion] = useState(0);
  const [speed, setSpeed] = useState(120);
  const [paused, setPaused] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const finished = match.finished;

  // el combate avanza solo, un turno cada `speed` milisegundos
  useEffect(() => {
    if (finished || paused) return;
    const h = setInterval(() => {
      const before = match.score.hacks;
      match.step();
      if (sounds && match.score.hacks > before) playSound('hack');
      setVersion((v) => v + 1);
    }, speed);
    return () => clearInterval(h);
  }, [match, speed, paused, finished, sounds]);

  // al terminar se anota el resultado en la serie
  useEffect(() => {
    if (!finished || practice) return;
    if (sounds) playSound('win');
    const h = setTimeout(() => useDuel.getState().finish(match.result()), 700);
    return () => clearTimeout(h);
  }, [finished, practice, match, sounds]);

  const score = match.score;
  const total = score.defense + score.attack;
  const label = (role: DuelRole) => (practice ? (role === practice.role ? 'Tú' : 'Programa inicial') : names[role === 'defense' ? defender : 1 - defender]);
  const result = finished ? match.result() : null;
  const done = practice ? finished : phase === 'result';
  const winnerText = !result ? '' : result.winner === 'tie' ? 'Empate' : `¡Gana ${label(result.winner)}!`;
  const youWon = result && mode === 'online' && !practice && result.winner !== 'tie' && roleOf(me, defender) === result.winner;

  const side = (role: DuelRole, align: 'flex-start' | 'flex-end') => (
    <View style={{ flex: 1, alignItems: align }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name={ROLE[role].icon} size={15} color={color(role)} />
        <Text style={{ color: color(role), fontWeight: '900', fontSize: 12 }}>{ROLE[role].label.toUpperCase()}</Text>
      </View>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
        {label(role)}
      </Text>
      <Text style={{ color: color(role), fontWeight: '900', fontSize: 30, lineHeight: 34 }} accessibilityLabel={`${ROLE[role].label}: ${score[role]} puntos`}>
        {score[role]}
      </Text>
    </View>
  );

  const scoreboard = (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {side('defense', 'flex-start')}
        <Text style={{ color: t.textMuted, fontWeight: '900', fontSize: 16, marginHorizontal: 8 }}>VS</Text>
        {side('attack', 'flex-end')}
      </View>
      <View style={[styles.versus, { backgroundColor: total ? color('attack') : t.border }]}>
        <View style={{ width: `${total ? (score.defense / total) * 100 : 50}%`, height: '100%', backgroundColor: total ? color('defense') : t.border }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
        <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700' }}>
          Turno {match.turn} de {match.cfg.turns}
        </Text>
        <ProgressBar value={match.turn / match.cfg.turns} height={6} style={{ flex: 1 }} />
      </View>
      {match.world.intruder?.stun ? <Text style={{ color: color('defense'), fontSize: 12, fontWeight: '700', marginTop: 6 }}>El atacante se está reiniciando ({match.world.intruder.stun} turnos)…</Text> : null}
    </Card>
  );

  const controls = !finished ? (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
      <Button label={paused ? 'Continuar' : 'Pausa'} icon={paused ? 'play' : 'pause'} size="sm" onPress={() => setPaused((p) => !p)} />
      <Segmented options={SPEEDS} value={speed} onChange={(v) => setSpeed(Number(v))} />
      <Button
        label="Ir al final"
        icon="play-skip-forward-outline"
        size="sm"
        kind="ghost"
        onPress={() => {
          match.runAll();
          setVersion((v) => v + 1);
        }}
      />
    </View>
  ) : null;

  const breakdown = result ? (
    <Card accent={result.winner === 'tie' ? t.warning : color(result.winner)}>
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 38, lineHeight: 46 }}>{result.winner === 'tie' ? '🤝' : '🏆'}</Text>
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>{winnerText}</Text>
        <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center' }}>
          {result.winner === 'tie'
            ? `Los dos terminaron con ${result.score.defense} puntos. ¡Mejoren sus programas y jueguen otra ronda!`
            : `${ROLE[result.winner].label} ${result.score[result.winner]} · ${result.score[result.winner === 'defense' ? 'attack' : 'defense']} ${ROLE[result.winner === 'defense' ? 'attack' : 'defense'].label}${youWon ? ' · ¡Ganaste!' : ''}`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <View style={[styles.break, { borderColor: tint(color('defense'), 0.4) }]}>
          <Text style={{ color: color('defense'), fontWeight: '900', fontSize: 12, marginBottom: 4 }}>DEFENSA · {label('defense')}</Text>
          <Text style={[styles.breakRow, { color: t.text }]}>Cosechas: {result.score.harvested} pts</Text>
          <Text style={[styles.breakRow, { color: t.text }]}>
            Hackeos: {result.score.hacks} × {DUEL_HACK_POINTS} = {result.score.hacks * DUEL_HACK_POINTS} pts
          </Text>
          <Text style={[styles.breakRow, { color: t.text, fontWeight: '900' }]}>Total: {result.score.defense}</Text>
        </View>
        <View style={[styles.break, { borderColor: tint(color('attack'), 0.4) }]}>
          <Text style={{ color: color('attack'), fontWeight: '900', fontSize: 12, marginBottom: 4 }}>ATAQUE · {label('attack')}</Text>
          <Text style={[styles.breakRow, { color: t.text }]}>Cosechas robadas: {result.score.stolen} pts</Text>
          <Text style={[styles.breakRow, { color: t.text }]}>Brotes arrancados: {result.score.sprouts} pts</Text>
          <Text style={[styles.breakRow, { color: t.text, fontWeight: '900' }]}>Total: {result.score.attack}</Text>
        </View>
      </View>
      {!practice && done ? (
        <>
          <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
            Serie: {names[0]} {wins[0]} · {wins[1]} {names[1]}
            {ties ? ` · ${ties} empate${ties === 1 ? '' : 's'}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 10 }}>
            <Button label="Revancha (cambiar papeles)" icon="swap-horizontal" kind="primary" onPress={() => useDuel.getState().rematch(true)} />
            <Button label="Revancha (mismos papeles)" icon="refresh" onPress={() => useDuel.getState().rematch(false)} />
            <Button label={showCode ? 'Ocultar programas' : 'Ver los dos programas'} icon="code-slash-outline" kind="ghost" onPress={() => setShowCode((v) => !v)} />
          </View>
          {mode === 'online' && me === 1 ? <Text style={{ color: t.textMuted, fontSize: 11, textAlign: 'center', marginTop: 6 }}>La revancha empieza cuando quien creó la sala la acepta.</Text> : null}
        </>
      ) : null}
    </Card>
  ) : null;

  const program = (role: DuelRole) => {
    const p = role === 'defense' ? match.defense : match.attack;
    if (practice && role !== practice.role) return null;
    if (!p.error && !p.output.length && !p.done) return null;
    return (
      <View key={role} style={[styles.console, { backgroundColor: t.terminal.bg }]}>
        <Text style={{ color: t.terminal.muted, fontSize: 11, fontWeight: '800', marginBottom: 3 }}>
          CONSOLA · {ROLE[role].label.toUpperCase()} ({label(role)})
        </Text>
        {p.output.slice(-8).map((l, i) => (
          <Text key={i} style={{ color: t.terminal.text, fontFamily: MONO, fontSize: 12, lineHeight: 17 }}>
            {l}
          </Text>
        ))}
        {p.error ? (
          <Text style={{ color: t.terminal.error, fontFamily: MONO, fontSize: 12, lineHeight: 17 }}>
            ✗ El programa se detuvo{p.errorLine ? ` en la línea ${p.errorLine}` : ''}: {p.error}
          </Text>
        ) : p.done ? (
          <Text style={{ color: t.terminal.warn, fontFamily: MONO, fontSize: 12 }}>El programa terminó: el dron se queda quieto (usa while (true) para que siga).</Text>
        ) : null}
      </View>
    );
  };

  const feed = match.events.length ? (
    <Card>
      <Text style={[styles.label, { color: t.textMuted }]}>LO QUE HA PASADO</Text>
      {match.events
        .slice(-7)
        .reverse()
        .map((e, i) => (
          <View key={`${e.turn}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <Ionicons name={ROLE[e.who].icon} size={13} color={color(e.who)} />
            <Text style={{ color: t.text, fontSize: 12, flex: 1 }} numberOfLines={2}>
              <Text style={{ color: t.textMuted }}>T{e.turn} · </Text>
              {label(e.who)} {e.text}
            </Text>
            {e.points ? <Text style={{ color: color(e.who), fontWeight: '900', fontSize: 12 }}>+{e.points}</Text> : null}
          </View>
        ))}
    </Card>
  ) : null;

  const codes = showCode ? (
    <Card>
      {(['defense', 'attack'] as DuelRole[]).map((r) => (
        <View key={r} style={{ marginBottom: 10 }}>
          <Text style={{ color: color(r), fontWeight: '900', fontSize: 12, marginBottom: 4 }}>
            {ROLE[r].label.toUpperCase()} · {label(r)}
          </Text>
          <CodeBlock code={useDuel.getState().codes[r]} maxHeight={260} />
        </View>
      ))}
    </Card>
  ) : null;

  const board = <WorldView world={match.world} theme={match.cfg.theme} version={match.world.version + match.turn} maxSize={wide ? 520 : 420} />;

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', padding: 12, gap: 12 }}>
        <ScrollView style={{ flex: 1.1 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          {board}
        </ScrollView>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          {breakdown}
          {scoreboard}
          {controls}
          {feed}
          {program('defense')}
          {program('attack')}
          {codes}
        </ScrollView>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 24 }}>
      {breakdown}
      {scoreboard}
      {controls}
      {board}
      <View style={{ height: 10 }} />
      {feed}
      {program('defense')}
      {program('attack')}
      {codes}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  roleCard: { flex: 1, minWidth: 240, borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10 },
  roleBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10 },
  editor: { borderWidth: BORDER, borderRadius: RADIUS.md, overflow: 'hidden' },
  side: { flex: 1, borderWidth: BORDER, borderRadius: RADIUS.lg },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  doc: { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 7 },
  versus: { height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  break: { flex: 1, minWidth: 200, borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10 },
  breakRow: { fontSize: 13, lineHeight: 20 },
  console: { borderRadius: RADIUS.md, padding: 10, marginBottom: 10 },
});
