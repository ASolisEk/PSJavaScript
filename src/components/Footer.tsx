/** Pie de página: banda verde de la marca con autor, versión y aviso de código libre. */
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { CURRENT_VERSION } from '../core/updater';
import { SPACE, useTheme } from '../ui/theme';

const AUTHOR = 'Angel Solís Ek';
export const REPO_URL = 'https://github.com/ASolisEk/PSJavaScript';
const APP_VERSION = CURRENT_VERSION;

export default function Footer() {
  const t = useTheme();
  return (
    <View style={[styles.footer, { backgroundColor: t.primary }]}>
      <Text style={[styles.text, { color: '#d7ffb8' }]}>
        Hecho por <Text style={{ fontWeight: '800', color: '#ffffff' }}>{AUTHOR}</Text> • Código libre (MIT) • v{APP_VERSION}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.md, paddingVertical: 6, columnGap: 10 },
  text: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
