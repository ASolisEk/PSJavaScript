import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/app';
import { useTheme } from '../ui/theme';

const GIFS = {
  idle: 'https://i.pinimg.com/originals/1f/b8/1b/1fb81b3b3152e63ffaca019e06f0a7bc.gif', // escribiendo/estudiando
  confused: 'https://i.pinimg.com/originals/4d/58/ee/4d58ee3a092e554d6fd6dd29628565ba.gif', // dudando/preocupado/sudando
  running: 'https://i.pinimg.com/originals/00/df/d0/00dfd04aa45a715e1c31fa850c512881.gif', // bailando/tecleando rápido
};

export default function Mascot() {
  const t = useTheme();
  const run = useApp((s) => s.run);
  const diagnostics = useApp((s) => s.diagnostics);
  
  const errorCount = diagnostics.filter((d: any) => d.severity === 'error').length;
  
  const [message, setMessage] = useState('');
  
  let state: keyof typeof GIFS = 'idle';
  if (run?.status === 'running' || run?.status === 'input') state = 'running';
  else if (errorCount > 0 || run?.status === 'error') state = 'confused';
  
  useEffect(() => {
    if (run?.status === 'error') {
      setMessage(`¡Miau! Hubo un error de ejecución en la línea ${run.error?.line}:\n${run.error?.message}`);
    } else if (errorCount > 3) {
      setMessage(`¡Ay caramba! Tienes ${errorCount} errores de sintaxis. ¡Me estoy preocupando! Revísalos pronto.`);
    } else if (errorCount > 0) {
      setMessage(`¡Ojo! Detecté un error de sintaxis en la línea ${diagnostics[0].line}. ${diagnostics[0].message}`);
    } else if (run?.status === 'running') {
      setMessage('¡Corriendo tu código a toda velocidad! 🚀');
    } else if (run?.status === 'paused') {
      setMessage('Código pausado. ¡Aprovecha para inspeccionar las variables!');
    } else {
      setMessage('');
    }
  }, [run?.status, run?.error, errorCount, diagnostics]);
  
  // Magia CSS: Capoo es azul (tono ~200). Garfield es naranja (tono ~30).
  // Girar el tono -160 o +200 grados y aumentar saturación convierte al gatito en un Garfield.
  const imageStyle = Platform.OS === 'web' 
    ? { filter: 'hue-rotate(200deg) saturate(1.8) brightness(1.1) contrast(1.1)' } as any 
    : {};

  if (!message && state === 'idle') return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {message ? (
        <View style={[styles.bubble, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '500' }}>{message}</Text>
          <View style={[styles.arrow, { borderTopColor: t.surface }]} />
        </View>
      ) : null}
      <Image
        source={{ uri: GIFS[state] }}
        style={[styles.cat, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  cat: {
    width: 120,
    height: 120,
    marginRight: 10,
  },
  bubble: {
    maxWidth: 240,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: -10,
    marginRight: 30,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  arrow: {
    position: 'absolute',
    bottom: -10,
    right: 30,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  }
});
