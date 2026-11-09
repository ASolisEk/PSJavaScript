/** Operaciones que difieren entre web y móvil. */
import * as Clipboard from 'expo-clipboard';
import { Alert, Platform, Share } from 'react-native';

export async function confirmDialog(title: string, message: string, okLabel = 'Aceptar'): Promise<boolean> {
  if (Platform.OS === 'web') return window.confirm(`${title}\n\n${message}`);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export async function copyText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

/** Descarga (web) o comparte (móvil) un archivo de texto. */
export async function saveTextFile(filename: string, text: string, mime = 'text/plain'): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  await Share.share({ title: filename, message: text });
}

/**
 * Selector de archivos del sistema (Android/iOS) y lectura del texto.
 * Se piden todos los tipos: muchos administradores de archivos de Android entregan
 * un .json como application/octet-stream y quedaría deshabilitado al filtrar.
 */
export async function pickTextFileNative(): Promise<{ name: string; text: string } | null> {
  if (Platform.OS === 'web') return null;
  const DocumentPicker = await import('expo-document-picker');
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  const asset = res.canceled ? null : res.assets?.[0];
  if (!asset) return null;
  const { File } = await import('expo-file-system');
  return { name: asset.name, text: await new File(asset.uri).text() };
}

/** Selector de archivos en cualquier plataforma (web o teléfono). */
export async function pickTextFile(accept = '.json,.txt'): Promise<{ name: string; text: string } | null> {
  return Platform.OS === 'web' ? pickTextFileWeb(accept) : pickTextFileNative();
}

/** Abre el selector de archivos del navegador y devuelve el texto (solo web). */
export function pickTextFileWeb(accept = '.js,.txt,.psc'): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') return resolve(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      resolve({ name: f.name, text: await f.text() });
    };
    input.click();
  });
}
