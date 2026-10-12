/** Pie de página: autor, versión y aviso de código libre. */
import Constants from 'expo-constants';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ui/theme';

export const AUTHOR = 'Angel Solís Ek';
export const REPO_URL = 'https://github.com/ASolisEk/PSJavaScript';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function Footer() {
  const t = useTheme();
  return (
    <View style={[styles.footer, { backgroundColor: t.surfaceAlt, borderTopColor: t.border }]}>
      <Text style={[styles.text, { color: t.textMuted }]}>
        Hecho por <Text style={{ fontWeight: '700', color: t.text }}>{AUTHOR}</Text> • Código libre (MIT) • v{APP_VERSION}
      </Text>
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
