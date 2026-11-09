// Pruebas en Node: reemplaza los módulos nativos (React Native, AsyncStorage, expo-crypto)
// por versiones simples en memoria, para poder probar los stores del maestro y del alumno.
import { registerHooks } from 'node:module';

const stubs = new URL('./stubs/', import.meta.url);
const map = {
  'react-native': 'react-native.cjs',
  '@react-native-async-storage/async-storage': 'async-storage.cjs',
  'expo-crypto': 'expo-crypto.cjs',
};

registerHooks({
  resolve(specifier, context, next) {
    const file = map[specifier];
    if (file) return { url: new URL(file, stubs).href, format: 'commonjs', shortCircuit: true };
    return next(specifier, context);
  },
});
