/** Captura rápida: escribir o pegar varias preguntas en texto sencillo. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { questionTypeInfo } from '../../core/exam/config';
import { answerSummary, parseQuickText, QUICK_TEXT_EXAMPLE } from '../../core/exam/quickText';
import { plainText } from '../../core/exam/richText';
import type { Question } from '../../core/exam/types';
import { useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { Button } from '../ui';
import { Banner, IconName, Pill, TextField } from '../exam/kit';

const HELP: [string, string][] = [
  ['Separa cada pregunta con una línea en blanco.', 'remove-outline'],
  ['Opciones: «a) texto» o «- texto». Marca la correcta con * al inicio: «*b) push()». Si marcas varias, el alumno elige todas.', 'radio-button-on-outline'],
  ['Sin opciones, agrega «Respuesta: …»: Verdadero / Falso, un número (3,14 ± 0,01) o un texto (varias aceptadas con |).', 'create-outline'],
  ['«Tema: Arreglos» agrupa las siguientes preguntas. «Puntos: 2» cambia el valor de una.', 'pricetag-outline'],
];

export default function QuickTextModal({ onClose, onAdd }: { onClose(): void; onAdd(questions: Question[]): void }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [text, setText] = useState('');
  const { questions, issues } = useMemo(() => parseQuickText(text), [text]);

  const input = (
    <View style={{ flex: wide ? 1 : undefined }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, flex: 1 }}>Escribe o pega tus preguntas</Text>
        {text ? null : <Button label="Llenar con un ejemplo" icon="sparkles-outline" onPress={() => setText(QUICK_TEXT_EXAMPLE)} />}
      </View>
      <TextField value={text} onChangeText={setText} mono multiline minHeight={wide ? 360 : 220} placeholder={'1. ¿Qué método agrega al final de un arreglo?\na) shift()\n*b) push()\nc) pop()\n\n2. const permite reasignar la variable.\nRespuesta: Falso'} accessibilityLabel="Texto de las preguntas" style={wide ? { flex: 1 } : null} />
      <View style={{ marginTop: 10, gap: 4 }}>
        {HELP.map(([h, icon]) => (
          <View key={h} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Ionicons name={icon as IconName} size={14} color={t.textMuted} style={{ marginTop: 2 }} />
            <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 17, flex: 1 }}>{h}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const preview = (
    <View style={{ flex: wide ? 1 : undefined }}>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, marginBottom: 6 }}>Así quedarán ({questions.length})</Text>
      {issues.map((i, k) => (
        <Banner key={k} icon="alert-circle" color={t.danger} text={`Línea ${i.line}: ${i.message}`} />
      ))}
      {!questions.length && !issues.length ? <Text style={{ color: t.textMuted, fontSize: 13 }}>Aquí verás cada pregunta reconocida con su respuesta correcta.</Text> : null}
      {questions.map((q, i) => {
        const info = questionTypeInfo(q.type);
        return (
          <View key={q.id} style={[styles.item, { borderColor: t.border, backgroundColor: t.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <Text style={{ color: t.textMuted, fontWeight: '800', fontSize: 12 }}>{i + 1}.</Text>
              <Pill icon={info.icon as IconName} text={info.label} color={t.primary} />
              <Pill text={`${q.points} pts`} color={t.accent} />
              {q.topic ? <Pill icon="pricetag-outline" text={q.topic} /> : null}
            </View>
            <Text style={{ color: t.text, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
              {plainText(q.prompt)}
            </Text>
            <Text style={{ color: t.success, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
              {answerSummary(q)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <ModalShell title="Pegar varias preguntas" onClose={onClose} wide>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, flexGrow: 1 }}>
          {input}
          {preview}
        </View>
      </ScrollView>
      <View style={[styles.foot, { borderTopColor: t.border }]}>
        <Text style={{ color: t.textMuted, fontSize: 13, flex: 1, minWidth: 180 }}>
          {issues.length && questions.length ? `Se agregarán las ${questions.length} reconocidas; corrige las marcadas en rojo o agrégalas después.` : 'Después puedes editar cada pregunta como cualquier otra.'}
        </Text>
        <Button label="Cancelar" onPress={onClose} />
        <Button label={questions.length ? `Agregar ${questions.length} pregunta${questions.length === 1 ? '' : 's'}` : 'Agregar'} icon="add-circle-outline" kind="primary" disabled={!questions.length} onPress={() => onAdd(questions)} />
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  item: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  foot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
