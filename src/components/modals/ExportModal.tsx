/** Exportar a otros lenguajes (PSeInt, Python, C++, lenguaje coloquial). */
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXPORT_TARGETS, exportCode } from '../../core/exporters';
import { useActiveFile, useApp } from '../../store/app';
import { copyText, saveTextFile } from '../../ui/platform';
import { MONO, useTheme } from '../../ui/theme';
import { Button, Chip, SectionTitle } from '../ui';
import ModalShell from './ModalShell';

export default function ExportModal() {
  const t = useTheme();
  const file = useActiveFile();
  const setModal = useApp((s) => s.setModal);
  const [target, setTarget] = useState('pseint');
  const [copied, setCopied] = useState(false);
  const base = (file?.name ?? 'programa').replace(/\.js$/, '');
  const result = useMemo(() => exportCode(target, file?.code ?? '', base), [target, file?.code, base]);
  const ext = EXPORT_TARGETS.find((x) => x.id === target)!.extension;

  return (
    <ModalShell title="Exportar / convertir" onClose={() => setModal(null)} wide>
      <View style={[styles.bar, { borderBottomColor: t.border }]}>
        {EXPORT_TARGETS.map((x) => (
          <Chip key={x.id} label={x.name} active={target === x.id} onPress={() => setTarget(x.id)} />
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
        <ScrollView horizontal style={[styles.codeBox, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
          <Text selectable style={{ color: t.text, fontFamily: MONO, fontSize: 13, lineHeight: 19, padding: 12 }}>
            {result.code || '(sin resultado)'}
          </Text>
        </ScrollView>
        {result.warnings.length ? (
          <>
            <SectionTitle>Revisa estos puntos ({result.warnings.length})</SectionTitle>
            {result.warnings.map((w, i) => (
              <Text key={i} style={{ color: t.warning, fontSize: 12, marginBottom: 3 }}>
                • {w}
              </Text>
            ))}
          </>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: t.border }]}>
        <Button
          label={copied ? '¡Copiado!' : 'Copiar'}
          icon="copy-outline"
          onPress={async () => {
            await copyText(result.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={{ marginRight: 8 }}
        />
        <Button label={Platform.OS === 'web' ? `Descargar .${ext}` : 'Compartir'} icon="download-outline" kind="primary" onPress={() => saveTextFile(`${base}.${ext}`, result.code)} />
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  codeBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
