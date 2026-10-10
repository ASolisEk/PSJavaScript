/** Pie de página: autor y aviso de código libre. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../ui/theme';

export const AUTHOR = 'Angel Solis Ek';
export const REPO_URL = 'https://github.com/ASolisEk/PSJavaScript';
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

export default function Footer() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const link = (url: string, label: string, icon: React.ComponentProps<typeof Ionicons>['name']) => (
    <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link" style={styles.link}>
      <Ionicons name={icon} size={12} color={t.primary} />
      <Text style={[styles.text, { color: t.primary, marginLeft: 3 }]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={[styles.footer, { backgroundColor: t.surfaceAlt, borderTopColor: t.border }]}>
      <Text style={[styles.text, { color: t.textMuted }]}>
        Hecho por <Text style={{ fontWeight: '700', color: t.text }}>{AUTHOR}</Text> ·{' '}
        {compact ? 'Código libre (MIT)' : 'Código libre bajo licencia MIT: cualquiera puede descargarlo, usarlo, modificarlo y compartirlo'}
      </Text>
      <View style={styles.links}>
        {Platform.OS === 'web' && (
          <a href="/PSJavaScript-Setup.exe" download="PSJavaScript-Setup.exe" style={{ textDecoration: 'none' }}>
            <View style={styles.link}>
              <Ionicons name="logo-windows" size={12} color={t.primary} />
              <Text style={[styles.text, { color: t.primary, marginLeft: 3 }]}>{compact ? 'Windows' : 'Descargar para Windows'}</Text>
            </View>
          </a>
        )}
        {link(REPO_URL, compact ? 'Código' : 'Descargar el código en GitHub', 'logo-github')}
        {compact ? null : link(LICENSE_URL, 'Licencia', 'document-text-outline')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    columnGap: 10,
  },
  text: { fontSize: 11, textAlign: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  link: { flexDirection: 'row', alignItems: 'center' },
});
