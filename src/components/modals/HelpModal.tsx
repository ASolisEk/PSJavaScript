/** Ayuda integrada: uso del entorno y referencia del lenguaje. */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/text';
import { HELP } from '../../core/help';
import { useApp } from '../../store/app';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import { Button, Chip, Heading, SectionTitle } from '../ui';
import ModalShell from './ModalShell';

export default function HelpModal() {
  const t = useTheme();
  const setModal = useApp((s) => s.setModal);
  const insert = useApp((s) => s.insertSnippet);
  const newFile = useApp((s) => s.newFile);
  const { width } = useWindowDimensions();
  const [topicId, setTopicId] = useState(HELP[0].id);
  const topic = HELP.find((h) => h.id === topicId)!;
  const narrow = width < 760;

  const list = (
    <>
      {(['Entorno', 'Lenguaje'] as const).map((g) => (
        <View key={g}>
          <SectionTitle>{g}</SectionTitle>
          {HELP.filter((h) => h.group === g).map((h) => (
            <Pressable key={h.id} onPress={() => setTopicId(h.id)} style={[styles.item, { backgroundColor: h.id === topicId ? t.surfaceAlt : undefined }]}>
              <Text style={{ color: h.id === topicId ? t.primary : t.text, fontWeight: h.id === topicId ? '700' : '400', fontSize: 13 }}>{h.title}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </>
  );

  const content = (
    <View>
      <Heading style={{ marginBottom: 10 }}>{topic.title}</Heading>
      {topic.blocks.map((b, i) => {
        if ('p' in b) return <Text key={i} style={{ color: t.text, fontSize: 14, lineHeight: 21, marginBottom: 10 }}>{b.p}</Text>;
        if ('list' in b)
          return (
            <View key={i} style={{ marginBottom: 10 }}>
              {b.list.map((x, j) => (
                <Text key={j} style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
                  • {x}
                </Text>
              ))}
            </View>
          );
        if ('code' in b)
          return (
            <View key={i} style={[styles.code, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
              <ScrollView horizontal>
                <Text selectable style={{ color: t.text, fontFamily: MONO, fontSize: 13, lineHeight: 19 }}>
                  {b.code}
                </Text>
              </ScrollView>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Button label="Insertar en el editor" icon="enter-outline" onPress={() => insert(b.code + '\n$0')} style={{ marginRight: 8 }} />
                <Button label="Abrir como programa" icon="open-outline" onPress={() => newFile(b.code + '\n', `${topic.id}.js`)} />
              </View>
            </View>
          );
        return (
          <ScrollView key={i} horizontal style={{ marginBottom: 12 }}>
            <View style={[styles.table, { borderColor: t.border }]}>
              {b.table.map((row, r) => (
                <View key={r} style={{ flexDirection: 'row', backgroundColor: r === 0 ? t.surfaceAlt : undefined }}>
                  {row.map((cell, c) => (
                    <Text
                      key={c}
                      style={[styles.cell, { color: t.text, borderColor: t.border, fontFamily: r === 0 ? undefined : MONO, fontWeight: r === 0 ? '700' : '400' }]}
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        );
      })}
    </View>
  );

  return (
    <ModalShell title="Ayuda" onClose={() => setModal(null)} wide>
      {narrow ? (
        // móvil: temas en una fila deslizable fija arriba y el contenido debajo
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, borderBottomWidth: BORDER, borderBottomColor: t.border }} contentContainerStyle={{ padding: 10, paddingBottom: 4 }}>
            {HELP.map((h) => (
              <Chip key={h.id} label={h.title} active={h.id === topicId} onPress={() => setTopicId(h.id)} />
            ))}
          </ScrollView>
          <ScrollView key={topicId} style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }}>
            {content}
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView style={{ width: 260, flexGrow: 0, borderRightWidth: BORDER, borderRightColor: t.border }} contentContainerStyle={{ padding: 10 }}>
            {list}
          </ScrollView>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }}>
            {content}
          </ScrollView>
        </View>
      )}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: 7, paddingHorizontal: 8, borderRadius: RADIUS.md },
  code: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 12, marginBottom: 12 },
  table: { borderWidth: BORDER, borderRadius: RADIUS.md, overflow: 'hidden' },
  cell: { width: 260, padding: 7, fontSize: 12, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
});
