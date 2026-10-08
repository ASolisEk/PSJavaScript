/** Configuración: perfil del lenguaje, ejecución y apariencia. */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { FLAG_LABELS, getProfile, PROFILES, ProfileFlags } from '../../core/profiles';
import { SPEEDS, useApp, useProfile } from '../../store/app';
import { useTheme } from '../../ui/theme';
import { Chip, SectionTitle } from '../ui';
import ModalShell from './ModalShell';

function Row({ label, value, onChange, hint }: { label: string; value: boolean; onChange(v: boolean): void; hint?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.border }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: t.text, fontSize: 14 }}>{label}</Text>
        {hint ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const BOOL_FLAGS = (Object.keys(FLAG_LABELS) as (keyof ProfileFlags)[]).filter((k) => k !== 'maxCallDepth');

export default function SettingsModal() {
  const t = useTheme();
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const setModal = useApp((s) => s.setModal);
  const profile = useProfile();

  const setFlag = (k: keyof ProfileFlags, v: boolean | number) => {
    const { id: _i, name: _n, description: _d, ...flags } = profile;
    update({ profileId: 'personalizado', customFlags: { ...flags, [k]: v } });
  };


  return (
    <ModalShell title="Configuración" onClose={() => setModal(null)} wide>
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <SectionTitle style={{ marginTop: 0 }}>Perfil del lenguaje</SectionTitle>
        {[...PROFILES, getProfile('personalizado', settings.customFlags)].map((p) => {
          const active = settings.profileId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                if (p.id === 'personalizado' && !Object.keys(settings.customFlags).length) {
                  const { id: _i, name: _n, description: _d, ...flags } = profile;
                  update({ profileId: p.id, customFlags: flags });
                } else update({ profileId: p.id });
              }}
              style={[styles.profile, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.surfaceAlt : t.surface }]}
            >
              <View style={[styles.radio, { borderColor: active ? t.primary : t.border }]}>{active ? <View style={[styles.radioDot, { backgroundColor: t.primary }]} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700' }}>{p.name}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>{p.description}</Text>
              </View>
            </Pressable>
          );
        })}

        <SectionTitle>Reglas (modificarlas activa el perfil personalizado)</SectionTitle>
        {BOOL_FLAGS.map((k) => (
          <Row key={k} label={FLAG_LABELS[k]} value={!!profile[k]} onChange={(v) => setFlag(k, v)} />
        ))}
        <View style={[styles.row, { borderBottomColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 14, flex: 1 }}>{FLAG_LABELS.maxCallDepth}</Text>
          {[100, 200, 500].map((n) => (
            <Chip key={n} label={String(n)} active={profile.maxCallDepth === n} onPress={() => setFlag('maxCallDepth', n)} />
          ))}
        </View>

        <SectionTitle>Ejecución</SectionTitle>
        <Row label="Modo explicativo" hint="Describe cada paso en lenguaje natural (panel Explicación)." value={settings.explain} onChange={(v) => update({ explain: v })} />
        <Row
          label="Ejecución en tiempo real"
          hint="Vuelve a ejecutar automáticamente al modificar el código, reutilizando los datos ya ingresados."
          value={settings.realtime}
          onChange={(v) => update({ realtime: v })}
        />
        <View style={[styles.row, { borderBottomColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 14, flex: 1 }}>Velocidad del paso a paso</Text>
          {SPEEDS.map((ms, i) => (
            <Chip key={ms} label={String(i + 1)} active={settings.speed === ms} onPress={() => update({ speed: ms })} />
          ))}
        </View>

        <SectionTitle>Apariencia</SectionTitle>
        <View style={[styles.row, { borderBottomColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 14, flex: 1 }}>Tema</Text>
          <Chip label="Sistema" active={settings.theme === 'system'} onPress={() => update({ theme: 'system' })} />
          <Chip label="Claro" active={settings.theme === 'light'} onPress={() => update({ theme: 'light' })} />
          <Chip label="Oscuro" active={settings.theme === 'dark'} onPress={() => update({ theme: 'dark' })} />
        </View>
        <View style={[styles.row, { borderBottomColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 14, flex: 1 }}>Tamaño de letra del editor</Text>
          {[12, 14, 16, 18, 20].map((n) => (
            <Chip key={n} label={String(n)} active={settings.fontSize === n} onPress={() => update({ fontSize: n })} />
          ))}
        </View>
        <Row label="Barra de símbolos" hint="Teclas rápidas para { } ( ) ; = etc. (útil en el teléfono)." value={settings.symbolBar} onChange={(v) => update({ symbolBar: v })} />
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap' },
  profile: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
});
