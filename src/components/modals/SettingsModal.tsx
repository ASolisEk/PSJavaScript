/** Configuración: perfil del lenguaje, ejecución y apariencia. */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { FLAG_LABELS, getProfile, PROFILES, ProfileFlags } from '../../core/profiles';
import { SPEEDS, useApp, useProfile } from '../../store/app';
import { useTheme } from '../../ui/theme';
import { checkForUpdate, CURRENT_VERSION, getPlatformLabel } from '../../core/updater';
import { COSTUMES, costumeForDate } from '../../core/holidays';
import { Button, Chip, SectionTitle } from '../ui';
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
  const setUpdateInfo = useApp((s) => s.setUpdateInfo);
  const profile = useProfile();
  const costume = settings.mascotCostume ?? 'auto';
  const [autoCostume] = React.useState(() => costumeForDate(new Date()));

  const [checkingUpdate, setCheckingUpdate] = React.useState(false);
  const [updateStatusText, setUpdateStatusText] = React.useState<string | null>(null);
  const [updateStatusColor, setUpdateStatusColor] = React.useState<string>(t.textMuted);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatusText(null);
    try {
      const res = await checkForUpdate({ allowWebCheck: true });
      if (res.hasUpdate) {
        setUpdateInfo(res);
        setModal('update');
      } else {
        setUpdateStatusText(`¡PSJavaScript está al día con la versión más reciente (v${res.latestVersion})!`);
        setUpdateStatusColor(t.success);
      }
    } catch {
      setUpdateStatusText('No se pudo verificar la actualización en este momento.');
      setUpdateStatusColor(t.danger);
    } finally {
      setCheckingUpdate(false);
    }
  };

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
        <Row label="Mostrar mascota" hint="Gatito que reacciona a errores, ejecución y reposo. Tócalo para ver consejos." value={settings.mascot} onChange={(v) => update({ mascot: v })} />
        {settings.mascot ? (
          <View style={[styles.row, { borderBottomColor: t.border, flexDirection: 'column', alignItems: 'stretch' }]}>
            <Text style={{ color: t.text, fontSize: 14 }}>Vestuario de la mascota</Text>
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>
              En automático se disfraza un mes antes de cada fiesta (10 días antes si hay otra fiesta ese mes) y conserva el vestuario 10 días después{autoCostume ? `. Hoy: ${autoCostume.emoji} ${autoCostume.name}` : ''}.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <Chip label="Automático" active={costume === 'auto'} onPress={() => update({ mascotCostume: 'auto' })} />
              <Chip label="Ninguno" active={costume === 'none'} onPress={() => update({ mascotCostume: 'none' })} />
              {COSTUMES.map((c) => (
                <Chip key={c.id} label={`${c.emoji} ${c.name}`} active={costume === c.id} onPress={() => update({ mascotCostume: c.id })} />
              ))}
            </View>
          </View>
        ) : null}
        <Row label="Barra de símbolos" hint="Teclas rápidas para { } ( ) ; = etc. (útil en el teléfono)." value={settings.symbolBar} onChange={(v) => update({ symbolBar: v })} />
        <Row label="Comentarios en diagramas" hint="Mostrar las notas y comentarios del código dentro del diagrama de flujo." value={settings.diagramComments ?? true} onChange={(v) => update({ diagramComments: v })} />

        <SectionTitle>Actualizaciones del programa</SectionTitle>
        <View style={[styles.row, { borderBottomColor: t.border }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>Versión instalada</Text>
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>
              v{CURRENT_VERSION} • {getPlatformLabel()}
            </Text>
            {updateStatusText ? (
              <Text style={{ color: updateStatusColor, fontSize: 12, marginTop: 4, fontWeight: '500' }}>
                {updateStatusText}
              </Text>
            ) : null}
          </View>
          <Button
            label={checkingUpdate ? 'Buscando...' : 'Buscar actualizaciones'}
            icon="cloud-download-outline"
            disabled={checkingUpdate}
            onPress={handleCheckUpdate}
          />
        </View>
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
