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

/**
 * Elige una imagen y la devuelve como data URI. En web se reduce (lado mayor ≤ `maxSide`)
 * para que viaje bien a los alumnos; devuelve un mensaje de error si queda muy grande.
 */
export async function pickImageDataUrl(maxChars: number, maxSide = 1200): Promise<{ uri: string } | { error: string } | null> {
  if (Platform.OS === 'web') {
    const file = await new Promise<File | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/gif,image/webp';
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.click();
    });
    if (!file) return null;
    const original = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    if (original.length <= maxChars && !/^data:image\/(png|jpe?g|webp)/.test(original)) return { uri: original };
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      el.src = original;
    }).catch(() => null);
    if (!img) return { error: 'No se pudo leer la imagen.' };
    let side = maxSide;
    for (let attempt = 0; attempt < 4; attempt++) {
      const k = Math.min(1, side / Math.max(img.width, img.height));
      if (k === 1 && original.length <= maxChars) return { uri: original };
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * k));
      canvas.height = Math.max(1, Math.round(img.height * k));
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL('image/png');
      const out = png.length <= maxChars ? png : canvas.toDataURL('image/jpeg', 0.82);
      if (out.length <= maxChars) return { uri: out };
      side = Math.round(side * 0.7);
    }
    return { error: 'La imagen es demasiado grande. Usa una más pequeña.' };
  }
  const DocumentPicker = await import('expo-document-picker');
  const res = await DocumentPicker.getDocumentAsync({ type: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], copyToCacheDirectory: true, multiple: false });
  const asset = res.canceled ? null : res.assets?.[0];
  if (!asset) return null;
  const { File } = await import('expo-file-system');
  const b64 = await (new File(asset.uri) as any).base64();
  const mime = asset.mimeType && /^image\/(png|jpe?g|gif|webp)$/.test(asset.mimeType) ? asset.mimeType : 'image/png';
  const uri = `data:${mime};base64,${b64}`;
  return uri.length <= maxChars ? { uri } : { error: 'La imagen es demasiado grande (máximo unos 300 KB).' };
}

/** Abre un documento HTML en una pestaña nueva (web, para imprimir) o lo comparte (móvil). */
export async function openHtml(filename: string, html: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const w = window.open(url, '_blank');
    if (!w) await saveTextFile(filename, html, 'text/html');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  await saveTextFile(filename, html, 'text/html');
}
