/** Entrar a la sala (código, nombre y conexión) o practicar por cuenta propia. */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../ui/text';
import { isValidRoomCode, normalizeRoomCode } from '../../../core/exam/random';
import { defaultTransport, transportOptions, TransportSpec } from '../../../core/exam/transport';
import { CERTIFICATIONS, practiceKey } from '../../../core/exam/certs';
import { useApp } from '../../../store/app';
import { useStudent } from '../../../store/student';
import { clearExamLink, readExamLink, rememberedStudent, rememberStudent } from '../../../ui/examLink';
import { MONO, useTheme } from '../../../ui/theme';
import { BackToEditorButton, Button, Chip } from '../../ui';
import { Banner, BigChoice, Card, Field, IconName, ScreenHeader, TextField } from '../kit';
import { clearCodeResults } from '../CodeAnswer';
import { ConnectionTest, NetworkOptions } from '../NetworkOptions';
import GuideModal from '../GuideModal';

import { Narrow, styles } from './shared';

// ───────────────────────────── entrar a la sala ─────────────────────────────

export function JoinView() {
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
  const [guide, setGuide] = useState(false);
  const options = transportOptions().filter((o) => o.available);
  useEffect(() => clearCodeResults(), []);
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
        right={<BackToEditorButton onPress={() => useApp.getState().setAppMode('ide')} />}
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
                <BigChoice
                  key={o.kind}
                  icon={o.icon as IconName}
                  title={o.label}
                  description={o.description}
                  selected={spec.kind === o.kind}
                  onPress={() => setSpec({ kind: o.kind, url: o.kind === 'lan' ? spec.url ?? '' : undefined, ...(o.kind === 'internet' && link?.transport?.net ? { net: link.transport.net } : {}) })}
                />
              ))}
              {spec.kind === 'internet' ? (
                <View style={{ marginBottom: 6 }}>
                  <ConnectionTest net={spec.net} />
                  {link?.transport?.net ? (
                    <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 6 }}>Usando los servidores que configuró tu maestro.</Text>
                  ) : (
                    <NetworkOptions value={spec.net} onChange={(net) => setSpec({ kind: 'internet', ...(net ? { net } : {}) })} />
                  )}
                </View>
              ) : null}
              {spec.kind === 'lan' ? (
                <Field label="Dirección del servidor del aula" hint="La muestra el maestro, por ejemplo 192.168.1.10:8787">
                  <TextField value={spec.url ?? ''} onChangeText={(url) => setSpec({ kind: 'lan', url })} placeholder="192.168.1.10:8787" autoCapitalize="none" mono />
                </Field>
              ) : null}
            </View>
          ) : null}

          {error ? <Banner icon="alert-circle" color={t.danger} text={error} /> : null}
          {error && spec.kind === 'internet' && !showNet ? <ConnectionTest net={spec.net} /> : null}
          <Button label={joining ? 'Conectando…' : 'Entrar a la sala'} icon="log-in-outline" kind="primary" onPress={join} disabled={!valid || joining} style={{ height: 46 }} />
        </Card>
        <Button label="¿Cómo funciona el examen?" icon="help-circle-outline" kind="ghost" onPress={() => setGuide(true)} style={{ alignSelf: 'center' }} />
        {guide ? <GuideModal who="student" onClose={() => setGuide(false)} /> : null}
        <PracticeCard name={name} />
        <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          Durante el examen no estarán disponibles la ayuda, la mascota, insertar comandos ni tus archivos. Tus respuestas se guardan en este dispositivo aunque se pierda la conexión.
        </Text>
      </Narrow>
    </View>
  );
}

/** Práctica individual para una certificación incluida (sin maestro ni código de sala). */
export function PracticeCard({ name }: { name: string }) {
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
