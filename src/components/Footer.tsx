/** Pie de página: autor, versión y aviso de código libre. */
import { StyleSheet, Text, View } from 'react-native';
import { CURRENT_VERSION } from '../core/updater';
import { useTheme } from '../ui/theme';

const AUTHOR = 'Angel Solís Ek';
export const REPO_URL = 'https://github.com/ASolisEk/PSJavaScript';
const APP_VERSION = CURRENT_VERSION;

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
});
