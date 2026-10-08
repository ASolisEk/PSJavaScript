import React, { useEffect, useState, useRef } from 'react';
import { Image, Platform, StyleSheet, Text, View, Animated } from 'react-native';
import { useApp } from '../store/app';
import { useTheme } from '../ui/theme';

export default function Mascot() {
  const t = useTheme();
  const run = useApp((s) => s.run);
  const diagnostics = useApp((s) => s.diagnostics);
  
  const errorCount = diagnostics.filter((d: any) => d.severity === 'error').length;
  
  const [message, setMessage] = useState('');
  
  let state: 'idle' | 'confused' | 'running' = 'idle';
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
      setMessage('¡Hola! Soy tu asistente. Escribe código y te ayudaré.');
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [run?.status, run?.error, errorCount, diagnostics]);
  
  // En Web usamos mix-blend-mode multiply para volver el fondo blanco transparente
  const imageStyle = Platform.OS === 'web' ? { mixBlendMode: 'multiply' } as any : {};

  // Animación de rebote (bounce)
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -8, duration: 100, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ])
      ).start();
    } else if (state === 'confused') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      bounceAnim.stopAnimation();
      bounceAnim.setValue(0);
    }
  }, [state, bounceAnim]);

  // Sprite cropping positions
  // La imagen original tiene 3 gatos en horizontal.
  // Ajustamos el tamaño a 800x800 y movemos (left, top) para enfocar.
  const poses = {
    idle: { left: -10, top: -230 },
    confused: { left: -260, top: -230 },
    running: { left: -540, top: -230 },
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {message ? (
        <View style={[styles.bubble, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '500' }}>{message}</Text>
          <View style={[styles.arrow, { borderTopColor: t.surface }]} />
        </View>
      ) : null}
      <Animated.View style={[styles.catWrapper, { transform: [{ translateY: bounceAnim }, { translateX: state === 'confused' ? bounceAnim : 0 }] }]}>
        <Image
          source={require('../../assets/mascot.jpg')}
          style={[styles.catSprite, poses[state], imageStyle]}
          resizeMode="cover"
        />
      </Animated.View>
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
  catWrapper: {
    width: 220,
    height: 220,
    overflow: 'hidden',
    marginRight: 10,
  },
  catSprite: {
    width: 800,
    height: 800,
    position: 'absolute',
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
