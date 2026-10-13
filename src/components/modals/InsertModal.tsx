/** Paleta para insertar comandos, funciones, operadores y variables. */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CatalogItem, COMMANDS, FUNCTIONS, OPERATORS } from '../../core/catalog';
import { declaredNames } from '../../core/editor/tokenizer';
import { useActiveFile, useApp } from '../../store/app';
import { MONO, useTheme } from '../../ui/theme';
import { Chip, SectionTitle } from '../ui';
import ModalShell from './ModalShell';

type TabId = 'commands' | 'functions' | 'operators' | 'variables';

export default function InsertModal() {
  const t = useTheme();
  const setModal = useApp((s) => s.setModal);
  const insert = useApp((s) => s.insertSnippet);
  const file = useActiveFile();
  const [tab, setTab] = useState<TabId>('commands');
  const [q, setQ] = useState('');

  const items: CatalogItem[] = useMemo(() => {
    const base =
      tab === 'commands'
        ? COMMANDS
        : tab === 'functions'
          ? FUNCTIONS
          : tab === 'operators'
            ? OPERATORS
            : declaredNames(file?.code ?? '').map((n) => ({ label: n, kind: 'constant' as const, category: 'Variables y funciones del programa', insert: `${n}$0`, doc: '' }));
    const ql = q.toLowerCase();
    return base.filter((i) => !ql || i.label.toLowerCase().includes(ql) || i.doc.toLowerCase().includes(ql));
  }, [tab, q, file?.code]);

  const groups = useMemo(() => {
    const m = new Map<string, CatalogItem[]>();
    for (const i of items) m.set(i.category, [...(m.get(i.category) ?? []), i]);
    return [...m.entries()];
  }, [items]);

  return (
    <ModalShell title="Insertar" onClose={() => setModal(null)} wide>
      <View style={[styles.bar, { borderBottomColor: t.border }]}>
        <Chip label="Comandos" active={tab === 'commands'} onPress={() => setTab('commands')} />
        <Chip label="Funciones" active={tab === 'functions'} onPress={() => setTab('functions')} />
        <Chip label="Operadores" active={tab === 'operators'} onPress={() => setTab('operators')} />
        <Chip label="Variables" active={tab === 'variables'} onPress={() => setTab('variables')} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar…"
          placeholderTextColor={t.textMuted}
          style={[styles.search, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {groups.map(([cat, list]) => (
          <View key={cat}>
            <SectionTitle>{cat}</SectionTitle>
            <View style={styles.grid}>
              {list.map((i) => (
                <Pressable key={i.label} onPress={() => insert(i.insert)} style={({ pressed }) => [styles.card, { borderColor: t.border, backgroundColor: pressed ? t.surfaceAlt : t.surface }]}>
                  <Text style={{ color: t.syntax.func, fontFamily: MONO, fontWeight: '700', fontSize: 13 }}>{i.signature ?? i.label}</Text>
                  {i.doc ? <Text style={{ color: t.text, fontSize: 12, marginTop: 3 }}>{i.doc}</Text> : null}
                  {i.pseint ? <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 3 }}>PSeInt: {i.pseint}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', padding: 10, paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  search: { flexGrow: 1, minWidth: 140, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10, height: 34, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  card: { width: 250, flexGrow: 1, margin: 4, padding: 10, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
});
