/** Prueba de escritorio: tabla con la evolución de las variables. */
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { useApp } from '../../store/app';
import { copyText } from '../../ui/platform';
import { BORDER, MONO, useTheme } from '../../ui/theme';
import { usePanelBottomPad } from '../../ui/layout';
import { Empty, IconButton } from '../ui';

const COL_W = 110;

export default function DesktopPanel() {
  const t = useTheme();
  // que la mascota no tape lo último en pantallas angostas
  const bottomPad = usePanelBottomPad();
  const desktop = useApp((s) => s.run?.desktop);
  const watches = useApp((s) => s.watches);
  const jump = useApp((s) => s.jumpToLine);
  const seek = useApp((s) => s.seek);
  const vref = useRef<ScrollView>(null);

  useEffect(() => {
    vref.current?.scrollToEnd({ animated: false });
  }, [desktop?.rows.length]);

  if (!desktop || !desktop.columns.length) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface }}>
        <Empty
          icon="grid-outline"
          text={
            'La prueba de escritorio se genera automáticamente al ejecutar: cada fila muestra los valores después de cada instrucción que modifica una variable.\n\n' +
            'Para elegir columnas, agrega expresiones vigiladas en el panel Variables.'
          }
        />
      </View>
    );
  }

  const csv = () => {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const head = ['Paso', 'Línea', ...desktop.columns].map(esc).join(',');
    const rows = desktop.rows.map((r) => [String(r.step), String(r.line), ...r.values].map(esc).join(','));
    copyText([head, ...rows].join('\n'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={[styles.toolbar, { borderBottomColor: t.border }]}>
        <Text style={{ color: t.textMuted, fontSize: 12, flex: 1 }} numberOfLines={1}>
          {desktop.rows.length} filas · {watches.length ? 'columnas: expresiones vigiladas' : 'columnas: todas las variables'}
          {desktop.truncated ? ' · (tabla truncada)' : ''}
        </Text>
        <IconButton icon="copy-outline" label="Copiar como CSV" onPress={csv} size={18} />
      </View>
      <ScrollView horizontal style={{ flex: 1 }}>
        <View>
          <View style={[styles.row, { backgroundColor: t.surfaceAlt, borderBottomColor: t.border }]}>
            <Text style={[styles.cell, styles.small, { color: t.textMuted, fontWeight: '700' }]}>Paso</Text>
            <Text style={[styles.cell, styles.small, { color: t.textMuted, fontWeight: '700' }]}>Línea</Text>
            {desktop.columns.map((c) => (
              <Text key={c} style={[styles.cell, { color: t.text, fontWeight: '700' }]} numberOfLines={1}>
                {c}
              </Text>
            ))}
          </View>
          <ScrollView ref={vref} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomPad }}>
            {desktop.rows.map((r, i) => (
              <Pressable
                key={i}
                onPress={() => jump(r.line)}
                onLongPress={() => seek(r.step + 1)}
                style={[styles.row, { borderBottomColor: t.border, backgroundColor: i % 2 ? t.surfaceAlt + '80' : undefined }]}
              >
                <Text style={[styles.cell, styles.small, { color: t.textMuted }]}>{r.step}</Text>
                <Text style={[styles.cell, styles.small, { color: t.primary }]}>{r.line}</Text>
                {r.values.map((v, j) => (
                  <Text
                    key={j}
                    style={[styles.cell, { color: r.changed[j] ? t.text : t.textMuted, fontWeight: r.changed[j] ? '700' : '400', backgroundColor: r.changed[j] ? t.execLine : undefined }]}
                    numberOfLines={2}
                  >
                    {v}
                  </Text>
                ))}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      <Text style={{ color: t.textMuted, fontSize: 11, padding: 6 }}>Toca una fila para ir a la línea; mantén presionado para volver la ejecución a ese paso.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 4, height: 40, borderBottomWidth: BORDER },
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { width: COL_W, paddingHorizontal: 8, paddingVertical: 6, fontFamily: MONO, fontSize: 12 },
  small: { width: 56 },
});
