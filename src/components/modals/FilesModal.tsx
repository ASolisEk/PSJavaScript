/** Archivos: programas guardados, ejemplos e importación. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EXAMPLES, Level } from '../../core/examples';
import { useApp } from '../../store/app';
import { confirmDialog, pickTextFileWeb, saveTextFile } from '../../ui/platform';
import { MONO, useTheme } from '../../ui/theme';
import { Button, Chip, IconButton, SectionTitle } from '../ui';
import ModalShell from './ModalShell';

type TabId = 'mine' | 'examples' | 'import';

export default function FilesModal() {
  const t = useTheme();
  const files = useApp((s) => s.files);
  const activeId = useApp((s) => s.activeId);
  const { setModal, openFile, newFile, openExample, renameFile, deleteFile, duplicateFile } = useApp.getState();
  const [tab, setTab] = useState<TabId>('mine');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [paste, setPaste] = useState('');
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...files].sort((a, b) => b.updatedAt - a.updatedAt).filter((f) => !query || f.name.toLowerCase().includes(query.toLowerCase())),
    [files, query],
  );
  const levels: Level[] = ['Básico', 'Intermedio', 'Avanzado'];

  return (
    <ModalShell title="Archivos" onClose={() => setModal(null)} wide>
      <View style={[styles.tabs, { borderBottomColor: t.border }]}>
        <Chip label="Mis programas" active={tab === 'mine'} onPress={() => setTab('mine')} />
        <Chip label="Ejemplos" active={tab === 'examples'} onPress={() => setTab('examples')} />
        <Chip label="Importar" active={tab === 'import'} onPress={() => setTab('import')} />
        <View style={{ flex: 1 }} />
        <Button label="Nuevo" icon="add" kind="primary" onPress={() => newFile()} />
      </View>

      {tab === 'mine' ? (
        <ScrollView contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar…"
            placeholderTextColor={t.textMuted}
            style={[styles.search, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
          />
          {sorted.map((f) => (
            <View key={f.id} style={[styles.fileRow, { borderColor: f.id === activeId ? t.primary : t.border, backgroundColor: t.surface }]}>
              <Pressable style={{ flex: 1 }} onPress={() => openFile(f.id)}>
                {renaming === f.id ? (
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                    onSubmitEditing={() => {
                      renameFile(f.id, newName);
                      setRenaming(null);
                    }}
                    onBlur={() => {
                      renameFile(f.id, newName);
                      setRenaming(null);
                    }}
                    style={[styles.search, { color: t.text, borderColor: t.primary, marginBottom: 0 }]}
                  />
                ) : (
                  <>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>
                      <Ionicons name="document-text-outline" size={14} /> {f.name}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>
                      {f.code.split('\n').length} líneas · modificado {new Date(f.updatedAt).toLocaleString()}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 11, fontFamily: MONO, marginTop: 4 }} numberOfLines={2}>
                      {f.code.trim().slice(0, 140)}
                    </Text>
                  </>
                )}
              </Pressable>
              <IconButton
                icon="pencil-outline"
                label="Renombrar"
                onPress={() => {
                  setRenaming(f.id);
                  setNewName(f.name);
                }}
                size={18}
              />
              <IconButton icon="copy-outline" label="Duplicar" onPress={() => duplicateFile(f.id)} size={18} />
              <IconButton icon="download-outline" label={Platform.OS === 'web' ? 'Descargar .js' : 'Compartir'} onPress={() => saveTextFile(f.name, f.code, 'text/javascript')} size={18} />
              <IconButton
                icon="trash-outline"
                label="Eliminar"
                color={t.danger}
                onPress={async () => {
                  if (await confirmDialog('Eliminar programa', `¿Eliminar "${f.name}"? Esta acción no se puede deshacer.`, 'Eliminar')) deleteFile(f.id);
                }}
                size={18}
              />
            </View>
          ))}
        </ScrollView>
      ) : null}

      {tab === 'examples' ? (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {levels.map((lv) => (
            <View key={lv}>
              <SectionTitle>{lv}</SectionTitle>
              <View style={styles.grid}>
                {EXAMPLES.filter((e) => e.level === lv).map((e) => (
                  <Pressable key={e.id} onPress={() => openExample(e.id)} style={({ pressed }) => [styles.exCard, { borderColor: t.border, backgroundColor: pressed ? t.surfaceAlt : t.surface }]}>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>{e.title}</Text>
                    <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={3}>
                      {e.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {tab === 'import' ? (
        <ScrollView contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: t.text, marginBottom: 8 }}>Pega el código JavaScript para crear un programa nuevo:</Text>
          <TextInput
            value={paste}
            onChangeText={setPaste}
            multiline
            placeholder="// pega aquí tu código"
            placeholderTextColor={t.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.paste, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt, fontFamily: MONO }]}
          />
          <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
            <Button label="Crear programa" icon="checkmark" kind="primary" disabled={!paste.trim()} onPress={() => newFile(paste, 'importado.js')} style={{ marginRight: 8 }} />
            {Platform.OS === 'web' ? (
              <Button
                label="Abrir archivo .js"
                icon="folder-open-outline"
                onPress={async () => {
                  const f = await pickTextFileWeb();
                  if (f) newFile(f.text, f.name.endsWith('.js') ? f.name : `${f.name}.js`);
                }}
              />
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap' },
  search: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10, height: 38, marginBottom: 10 },
  fileRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  exCard: { width: 230, flexGrow: 1, margin: 4, padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  paste: { minHeight: 220, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, fontSize: 13, textAlignVertical: 'top' },
});
