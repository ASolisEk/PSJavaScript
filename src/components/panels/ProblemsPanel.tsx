/** Problemas: errores de sintaxis, advertencias del perfil y error de ejecución. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import type { ErrorHint } from '../../core/errors';
import { useApp, useProfile } from '../../store/app';
import { BORDER, RADIUS, useTheme } from '../../ui/theme';
import { Empty, SectionTitle } from '../ui';

function Hint({ hint }: { hint: ErrorHint }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700' }}>Causas posibles</Text>
      {hint.causes.map((c, i) => (
        <Text key={i} style={{ color: t.text, fontSize: 12, marginLeft: 8 }}>
          • {c}
        </Text>
      ))}
      <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Cómo solucionarlo</Text>
      {hint.solutions.map((c, i) => (
        <Text key={i} style={{ color: t.text, fontSize: 12, marginLeft: 8 }}>
          • {c}
        </Text>
      ))}
    </View>
  );
}

export default function ProblemsPanel() {
  const t = useTheme();
  const diagnostics = useApp((s) => s.diagnostics);
  const error = useApp((s) => s.run?.error ?? null);
  const profile = useProfile();
  const jump = useApp((s) => s.jumpToLine);
  const [expanded, setExpanded] = React.useState<number | null>(null);

  const icon = (sev: string) => (sev === 'error' ? 'close-circle' : sev === 'warning' ? 'warning' : 'information-circle');
  const color = (sev: string) => (sev === 'error' ? t.danger : sev === 'warning' ? t.warning : t.info);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.surface }} contentContainerStyle={{ padding: 12 }}>
      {error ? (
        <View style={[styles.card, { borderColor: t.danger, backgroundColor: t.errorLine }]}>
          <Pressable onPress={() => error.line && jump(error.line)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="bug" size={18} color={t.danger} />
            <Text style={{ color: t.danger, fontWeight: '700', marginLeft: 6, flex: 1 }}>
              {error.syntax ? 'Error de sintaxis' : 'Error de ejecución'} {error.line ? `· línea ${error.line}` : ''}
            </Text>
          </Pressable>
          {error.title ? <Text style={{ color: t.text, marginTop: 4, fontSize: 14, fontWeight: '700' }}>{error.title}</Text> : null}
          <Text style={{ color: t.text, marginTop: 4, fontSize: error.title ? 13 : 14 }}>
            {error.name !== 'Error' && !error.syntax ? `${error.name}: ` : ''}
            {error.message}
          </Text>
          {error.hint ? <Hint hint={error.hint} /> : null}
        </View>
      ) : null}

      <SectionTitle style={{ marginTop: error ? 12 : 0 }}>Análisis del código · perfil {profile.name}</SectionTitle>
      {diagnostics.length === 0 ? (
        <Empty icon="checkmark-circle-outline" text="No se encontraron problemas." />
      ) : (
        diagnostics.map((d, i) => (
          <Pressable
            key={i}
            onPress={() => {
              jump(d.line);
              setExpanded(expanded === i ? null : i);
            }}
            style={[styles.item, { borderBottomColor: t.border }]}
          >
            <Ionicons name={icon(d.severity) as any} size={16} color={color(d.severity)} style={{ marginTop: 1 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              {d.title ? <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{d.title}</Text> : null}
              <Text style={{ color: t.text, fontSize: 13, marginTop: d.title ? 2 : 0 }}>{d.message}</Text>
              <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>
                Línea {d.line}, columna {d.col + 1} · {d.rule}
                {d.detectedLine ? ` (lo noté en la línea ${d.detectedLine})` : ''}
              </Text>
              {/* los errores de sintaxis muestran su explicación sin tener que tocarlos */}
              {(expanded === i || d.rule === 'syntax') && d.hint ? <Hint hint={d.hint} /> : null}
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 10 },
  item: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: BORDER },
});
