/** Si una pantalla falla al dibujarse, muestra un aviso para seguir en lugar de quedar en blanco. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/text';
import { recordError } from '../core/errorLog';

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    recordError(error, 'pantalla');
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#4b4b4b', marginBottom: 8 }}>Algo salió mal</Text>
        <Text style={{ fontSize: 14, color: '#777777', textAlign: 'center', marginBottom: 16, maxWidth: 420 }}>
          Esta pantalla tuvo un error. Tu código y tus exámenes están guardados. Puedes reintentar; si se repite, repórtalo desde Ajustes → «Reportar un problema».
        </Text>
        <Pressable onPress={() => this.setState({ error: null })} style={{ backgroundColor: '#58cc02', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }} accessibilityRole="button">
          <Text style={{ color: '#ffffff', fontWeight: '800' }}>REINTENTAR</Text>
        </Pressable>
      </View>
    );
  }
}
