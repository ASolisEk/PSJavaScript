/** Modo explicativo: describe en lenguaje natural lo que hace cada paso. */
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { useApp } from '../../store/app';
import { BORDER, MONO, useTheme } from '../../ui/theme';
import { Empty, Switch } from '../ui';

const NO_ITEMS: never[] = [];

export default function ExplainPanel() {
  const t = useTheme();
  const items = useApp((s) => s.run?.explanations) ?? NO_ITEMS;
  const explain = useApp((s) => s.settings.explain);
  const update = useApp((s) => s.updateSettings);
  const jump = useApp((s) => s.jumpToLine);
  const scroll = useRef<ScrollView>(null);

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={[styles.toolbar, { borderBottomColor: t.border }]}>
        <Text style={{ color: t.text, fontSize: 13, flex: 1 }}>Explicar cada paso</Text>
        <Switch value={explain} onValueChange={(v) => update({ explain: v })} />
      </View>
      {!explain ? (
        <Empty icon="chatbubbles-outline" text="Activa el modo explicativo y vuelve a ejecutar para ver la descripción de cada paso." />
      ) : items.length === 0 ? (
        <Empty icon="chatbubbles-outline" text="Ejecuta el programa (preferentemente paso a paso) para ver la explicación de cada acción." />
      ) : (
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 10 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
          {items.map((e, i) => (
            <Pressable key={i} onPress={() => jump(e.line)} style={[styles.item, { borderLeftColor: i === items.length - 1 ? t.primary : t.border }]}>
              <Text style={{ color: t.textMuted, fontFamily: MONO, fontSize: 11, width: 64 }}>
                #{e.step} L{e.line}
              </Text>
              <Text style={{ color: t.text, fontSize: 13, flex: 1 }}>{e.text}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 44, borderBottomWidth: BORDER },
  item: { flexDirection: 'row', paddingVertical: 5, paddingLeft: 8, borderLeftWidth: 3, marginBottom: 2 },
});
