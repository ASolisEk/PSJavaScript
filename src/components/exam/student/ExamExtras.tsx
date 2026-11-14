/**
 * Herramientas del alumno durante el examen: preguntar al maestro (dudas sobre el
 * enunciado) y una hoja de borrador que no se envía ni se califica.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../../ui/text';
import { useStudent } from '../../../store/student';
import { RADIUS, useTheme } from '../../../ui/theme';
import { Button, TextField } from '../../ui';
import { Card } from '../kit';

export function ExamExtras({ canAsk }: { canAsk: boolean }) {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const [panel, setPanel] = useState<'ask' | 'scratch' | null>(null);
  const [text, setText] = useState('');
  const asks = s.asks ?? [];
  const waiting = asks.filter((a) => !a.answer).length;
  const toggle = (p: 'ask' | 'scratch') => setPanel((x) => (x === p ? null : p));
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {canAsk ? (
          <Button
            label={waiting ? `Preguntar al maestro (${waiting} sin respuesta)` : 'Preguntar al maestro'}
            icon="hand-left-outline"
            size="sm"
            kind={panel === 'ask' ? 'primary' : 'default'}
            onPress={() => toggle('ask')}
          />
        ) : null}
        <Button label="Borrador" icon="create-outline" size="sm" kind={panel === 'scratch' ? 'primary' : 'default'} onPress={() => toggle('scratch')} />
      </View>
      {panel === 'ask' ? (
        <Card style={{ marginTop: 10 }}>
          <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 8 }}>
            Tu maestro verá tu pregunta y la pregunta del examen en la que estás. Úsala para dudas sobre el enunciado, no para pedir la respuesta.
          </Text>
          {asks.length ? (
            <View style={{ gap: 6, marginBottom: 10 }}>
              {asks.slice(-5).map((a, i) => (
                <View key={i} style={{ borderRadius: RADIUS.md, padding: 8, backgroundColor: t.surfaceAlt }}>
                  <Text style={{ color: t.text, fontSize: 13 }}>
                    <Text style={{ fontWeight: '800' }}>Tú{a.question >= 0 ? ` (pregunta ${a.question + 1})` : ''}: </Text>
                    {a.text}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }}>
                    <Ionicons name={a.answer ? 'chatbubble-ellipses-outline' : 'time-outline'} size={14} color={a.answer ? t.success : t.textMuted} style={{ marginTop: 2, marginRight: 4 }} />
                    <Text style={{ color: a.answer ? t.text : t.textMuted, fontSize: 13, flex: 1 }}>{a.answer && a.answer !== '—' ? a.answer : a.answer ? 'El maestro la revisó.' : 'Esperando respuesta…'}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          <TextField value={text} onChangeText={setText} placeholder="Escribe tu duda…" multiline maxLength={500} />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button
              label="Enviar pregunta"
              icon="send"
              kind="primary"
              size="sm"
              disabled={!text.trim() || waiting >= 3}
              onPress={() => {
                useStudent.getState().ask(text);
                setText('');
              }}
            />
          </View>
          {waiting >= 3 ? <Text style={{ color: t.warning, fontSize: 12, marginTop: 6 }}>Espera a que el maestro responda antes de enviar otra.</Text> : null}
        </Card>
      ) : null}
      {panel === 'scratch' ? (
        <Card style={{ marginTop: 10 }}>
          <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 8 }}>Notas para ti: se guardan en este dispositivo y no se envían ni se califican.</Text>
          <TextField value={s.scratch ?? ''} onChangeText={(v) => useStudent.getState().setScratch(v)} placeholder="Operaciones, ideas, borradores…" multiline mono minHeight={140} />
        </Card>
      ) : null}
    </View>
  );
}
