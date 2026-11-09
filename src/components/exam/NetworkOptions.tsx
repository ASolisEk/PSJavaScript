/**
 * Opciones de red de las salas «Por Internet»: servidores TURN y de enlace propios, y el botón
 * «Probar conexión» (para el maestro al abrir la sala y para el alumno al entrar).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '../../ui/text';
import { diagnoseInternet, NetCheck } from '../../core/exam/transport/diagnose';
import { hasPeerNetwork, PeerNetwork } from '../../core/exam/transport';
import { useTheme } from '../../ui/theme';
import { Button, Field, TextField, Toggle } from '../ui';

/** Resultado de la prueba de conexión. */
export function ConnectionTest({ net }: { net?: PeerNetwork }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<NetCheck[] | null>(null);
  const run = async () => {
    setBusy(true);
    setChecks(null);
    try {
      setChecks(await diagnoseInternet(net));
    } finally {
      setBusy(false);
    }
  };
  const allOk = checks?.every((c) => c.ok !== false);
  const usable = checks && checks.find((c) => c.id === 'server')?.ok && checks.some((c) => (c.id === 'stun' || c.id === 'turn') && c.ok);
  return (
    <View style={{ marginTop: 6 }}>
      <Button label={busy ? 'Probando…' : 'Probar conexión'} icon="pulse-outline" size="sm" onPress={run} disabled={busy} style={{ alignSelf: 'flex-start' }} />
      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <ActivityIndicator color={t.primary} />
          <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 8 }}>Revisando el servidor de enlace y si la red deja pasar WebRTC (hasta 10 s)…</Text>
        </View>
      ) : null}
      {checks ? (
        <View style={{ marginTop: 8, gap: 6 }} accessibilityLiveRegion="polite">
          {checks.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name={c.ok ? 'checkmark-circle' : c.ok === false ? 'close-circle' : 'help-circle'} size={17} color={c.ok ? t.success : c.ok === false ? t.danger : t.textMuted} />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{c.label}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 17 }}>{c.detail}</Text>
              </View>
            </View>
          ))}
          <Text style={{ color: usable ? t.success : t.danger, fontSize: 13, fontWeight: '800' }}>
            {allOk ? '✓ Todo listo para usar la sala por Internet.' : usable ? '✓ Se puede usar la sala por Internet.' : '✗ En esta red la sala por Internet probablemente no funcionará. Configura un TURN propio o usa «Red del aula».'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const splitUrls = (text: string) =>
  text
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Formulario de servidores propios (TURN y enlace). `value` vacío = los públicos. */
export function NetworkOptions({ value, onChange }: { value?: PeerNetwork; onChange(net: PeerNetwork | undefined): void }) {
  const t = useTheme();
  const [open, setOpen] = useState(hasPeerNetwork(value));
  const ice = value?.iceServers?.[0];
  const urls = ice ? (Array.isArray(ice.urls) ? ice.urls.join('\n') : ice.urls) : '';
  const update = (patch: { urls?: string; username?: string; credential?: string; host?: string; port?: string; path?: string; secure?: boolean }) => {
    const u = patch.urls !== undefined ? splitUrls(patch.urls) : ice ? (Array.isArray(ice.urls) ? ice.urls : [ice.urls]) : [];
    const username = patch.username ?? ice?.username ?? '';
    const credential = patch.credential ?? ice?.credential ?? '';
    const host = (patch.host ?? value?.server?.host ?? '').trim();
    const port = Number(patch.port ?? value?.server?.port ?? '');
    const next: PeerNetwork = {
      ...(u.length ? { iceServers: [{ urls: u.length === 1 ? u[0] : u, ...(username ? { username } : {}), ...(credential ? { credential } : {}) }] } : {}),
      ...(host
        ? {
            server: {
              host,
              ...(Number.isInteger(port) && port > 0 ? { port } : {}),
              ...((patch.path ?? value?.server?.path) ? { path: patch.path ?? value?.server?.path } : {}),
              secure: patch.secure ?? value?.server?.secure ?? true,
            },
          }
        : {}),
    };
    onChange(hasPeerNetwork(next) ? next : undefined);
  };
  return (
    <View style={{ marginTop: 4 }}>
      <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: open ? 8 : 0 }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={16} color={t.textMuted} />
        <Text style={{ color: t.text, fontSize: 13, fontWeight: '700', marginLeft: 4 }}>Servidores propios (TURN) — si la red de la escuela bloquea la conexión</Text>
      </Pressable>
      {open ? (
        <View>
          <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 8 }}>
            Muchas redes escolares bloquean las conexiones directas. Un servidor TURN (por ejemplo con coturn, o de un proveedor) las retransmite; el puerto 443 con «turns:» suele pasar los firewalls. La configuración viaja en el enlace y el QR de la sala, así tus alumnos la usan sin escribir nada.
          </Text>
          <Field label="Dirección TURN" hint="Una o varias, separadas por comas. Ej. turns:turn.escuela.mx:443?transport=tcp">
            <TextField value={urls} onChangeText={(v) => update({ urls: v })} placeholder="turns:turn.escuela.mx:443" autoCapitalize="none" autoCorrect={false} mono />
          </Field>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Field label="Usuario" style={{ flex: 1, minWidth: 140 }}>
              <TextField value={ice?.username ?? ''} onChangeText={(v) => update({ username: v })} autoCapitalize="none" autoCorrect={false} />
            </Field>
            <Field label="Contraseña" style={{ flex: 1, minWidth: 140 }}>
              <TextField value={ice?.credential ?? ''} onChangeText={(v) => update({ credential: v })} autoCapitalize="none" autoCorrect={false} secureTextEntry />
            </Field>
          </View>
          <Field label="Servidor de enlace propio (opcional)" hint="Solo si la escuela tiene su propio PeerServer. Vacío = el público de PeerJS.">
            <TextField value={value?.server?.host ?? ''} onChangeText={(v) => update({ host: v })} placeholder="peer.escuela.mx" autoCapitalize="none" autoCorrect={false} mono />
          </Field>
          {value?.server?.host ? (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Field label="Puerto" style={{ width: 110 }}>
                <TextField value={value.server.port ? String(value.server.port) : ''} onChangeText={(v) => update({ port: v.replace(/\D/g, '') })} placeholder="443" keyboardType="numeric" />
              </Field>
              <Field label="Ruta" style={{ flex: 1, minWidth: 120 }}>
                <TextField value={value.server.path ?? ''} onChangeText={(v) => update({ path: v })} placeholder="/" autoCapitalize="none" mono />
              </Field>
              <View style={{ minWidth: 200, flex: 1 }}>
                <Toggle label="Conexión segura (https)" value={value.server.secure !== false} onChange={(secure) => update({ secure })} />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
