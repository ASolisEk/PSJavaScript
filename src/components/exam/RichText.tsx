/** Enunciados y opciones con código: ```bloques```, `código en línea` y **negritas**. */
import React, { useMemo } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import { Text } from '../../ui/text';
import { parseRichText } from '../../core/exam/richText';
import { MONO, useTheme } from '../../ui/theme';
import { CodeBlock } from './kit';

export default function RichText({ text, style, numberOfLines }: { text: string; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const t = useTheme();
  const blocks = useMemo(() => parseRichText(text), [text]);
  // caso común: un solo párrafo sin formato
  const plain = blocks.every((b) => b.kind === 'text' && b.parts.every((p) => p.kind === 'text')) && blocks.length <= 1;
  if (plain) {
    return (
      <Text style={style} numberOfLines={numberOfLines} selectable={false}>
        {text}
      </Text>
    );
  }
  return (
    <View style={{ flexShrink: 1 }}>
      {blocks.map((b, i) =>
        b.kind === 'code' ? (
          <CodeBlock key={i} code={b.code} style={{ marginVertical: 4 }} />
        ) : (
          <Text key={i} style={[style, i < blocks.length - 1 ? { marginBottom: 6 } : null]} numberOfLines={numberOfLines} selectable={false}>
            {b.parts.map((p, k) =>
              p.kind === 'code' ? (
                <Text key={k} style={{ fontFamily: MONO, backgroundColor: t.surfaceAlt, color: t.text }}>
                  {p.text}
                </Text>
              ) : p.kind === 'bold' ? (
                <Text key={k} style={{ fontWeight: '800' }}>
                  {p.text}
                </Text>
              ) : (
                p.text
              ),
            )}
          </Text>
        ),
      )}
    </View>
  );
}
