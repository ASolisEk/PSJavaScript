/** Ayuda integrada: uso del entorno y referencia del lenguaje. */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { HELP } from '../../core/help';
import { useApp } from '../../store/app';
import { MONO, useTheme } from '../../ui/theme';
import { Button, Chip, SectionTitle } from '../ui';
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
          {narrow ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {HELP.filter((h) => h.group === g).map((h) => (
                <Chip key={h.id} label={h.title} active={h.id === topicId} onPress={() => setTopicId(h.id)} />
              ))}
            </View>
          ) : (
            HELP.filter((h) => h.group === g).map((h) => (
              <Pressable key={h.id} onPress={() => setTopicId(h.id)} style={[styles.item, { backgroundColor: h.id === topicId ? t.surfaceAlt : undefined }]}>
                <Text style={{ color: h.id === topicId ? t.primary : t.text, fontWeight: h.id === topicId ? '700' : '400', fontSize: 13 }}>{h.title}</Text>
              </Pressable>
            ))
          )}
        </View>
      ))}
    </>
  );

  const content = (
    <View>
      <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', marginBottom: 10 }}>{topic.title}</Text>
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
        <ScrollView contentContainerStyle={{ padding: 14 }}>
          {list}
          <View style={{ height: 16 }} />
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView style={{ width: 260, flexGrow: 0, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: t.border }} contentContainerStyle={{ padding: 10 }}>
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
  item: { paddingVertical: 7, paddingHorizontal: 8, borderRadius: 6 },
  code: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 12, marginBottom: 12 },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden' },
  cell: { width: 260, padding: 7, fontSize: 12, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
});
