/**
 * Descargas: instaladores de la última versión publicada en GitHub Releases, con el
 * recomendado para el equipo del visitante, tamaño, fecha, huella SHA-256 y cómo instalar.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { DOWNLOAD_TARGETS, DownloadId, DownloadTarget, detectBrowserTarget, downloadUrl, fetchLatestRelease, formatSize, isAvailable, LatestRelease } from '../../core/downloads';
import { CURRENT_VERSION, GITHUB_RELEASES_URL } from '../../core/updater';
import { useApp } from '../../store/app';
import { copyText } from '../../ui/platform';
import { BORDER, MONO, RADIUS, useTheme } from '../../ui/theme';
import { Button } from '../ui';
import ModalShell from './ModalShell';

/** Descarga el archivo (web: enlace con «download»; en la app: abre el navegador). */
function startDownload(url: string, file: string) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.download = file;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  Linking.openURL(url);
}

/** Datos de la última versión y el instalador recomendado (compartido con el botón del encabezado). */
export function useLatestRelease() {
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState<DownloadId | null>(null);
  useEffect(() => {
    let alive = true;
    fetchLatestRelease().then((r) => {
      if (!alive) return;
      setRelease(r);
      setLoading(false);
    });
    detectBrowserTarget().then((id) => alive && setRecommended(id));
    return () => {
      alive = false;
    };
  }, []);
  return { release, loading, recommended };
}

export default function DownloadsModal() {
  const t = useTheme();
  const { release, loading, recommended } = useLatestRelease();
  // null: solo el recomendado muestra sus instrucciones; 'none': ninguno
  const [open, setOpen] = useState<DownloadId | 'none' | null>(null);
  const bestOpen = open === null || open === recommended;
  const best = recommended ? DOWNLOAD_TARGETS.find((d) => d.id === recommended) : undefined;
  const others = DOWNLOAD_TARGETS.filter((d) => d.id !== recommended);
  const date = release?.publishedAt ? new Date(release.publishedAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return (
    <ModalShell title="Descargar PSJavaScript" onClose={() => useApp.getState().setModal(null)}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {loading ? <ActivityIndicator color={t.primary} /> : null}
          <Text style={{ color: t.textMuted, fontSize: 13, flex: 1, minWidth: 220 }}>
            {loading
              ? 'Consultando la última versión…'
              : release
                ? `Versión ${release.version}${date ? ` · publicada el ${date}` : ''}. Funciona sin internet y guarda tus archivos en el equipo.`
                : `No se pudo consultar GitHub; los enlaces descargan la última versión publicada (esta página es la ${CURRENT_VERSION}).`}
          </Text>
          <Button label="Todas las versiones" icon="open-outline" size="sm" onPress={() => Linking.openURL(release?.url ?? GITHUB_RELEASES_URL)} />
        </View>

        {best ? (
          <TargetCard target={best} release={release} highlight open={bestOpen} onToggle={() => setOpen(bestOpen ? 'none' : best.id)} />
        ) : recommended === null && !loading && Platform.OS === 'web' && typeof navigator !== 'undefined' && /iphone|ipad/i.test(navigator.userAgent) ? (
          <Text style={{ color: t.textMuted, fontSize: 13 }}>En iPhone y iPad usa PSJavaScript directamente en el navegador: no hace falta instalar nada.</Text>
        ) : null}

        <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, marginTop: 4 }}>{best ? 'Otros sistemas' : 'Elige tu sistema'}</Text>
        {others.map((d) => (
          <TargetCard key={d.id} target={d} release={release} open={open === d.id} onToggle={() => setOpen(open === d.id ? null : d.id)} />
        ))}
        <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 17 }}>
          Los instaladores se compilan automáticamente en GitHub a partir del código publicado. La huella SHA-256 sirve para comprobar que el archivo llegó completo y sin cambios.
        </Text>
      </ScrollView>
    </ModalShell>
  );
}

function TargetCard({ target, release, highlight, open, onToggle }: { target: DownloadTarget; release: LatestRelease | null; highlight?: boolean; open: boolean; onToggle(): void }) {
  const t = useTheme();
  const color = t.dark ? target.dark : target.color;
  const asset = release?.assets[target.file];
  const available = isAvailable(target, release);
  const url = downloadUrl(target, release);
  const [copied, setCopied] = useState(false);
  return (
    <View style={[styles.card, { borderColor: highlight ? t.primary : t.border, backgroundColor: highlight ? t.primary + '0d' : t.surface }]}>
      <View style={styles.row}>
        <View style={[styles.logo, { backgroundColor: color + '1c' }]}>
          <Ionicons name={target.icon} size={26} color={color} />
        </View>
        <Pressable onPress={onToggle} style={{ flex: 1, minWidth: 160 }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>
            {highlight ? `Para tu equipo: ${target.label}` : target.label}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>
            {target.detail}
            {asset ? ` · ${formatSize(asset.size)}` : ''}
          </Text>
        </Pressable>
        {available === false ? (
          <Text style={{ color: t.textMuted, fontSize: 12 }}>No disponible en esta versión</Text>
        ) : (
          <Button label="Descargar" icon="download-outline" kind={highlight ? 'primary' : 'default'} onPress={() => startDownload(url, target.file)} />
        )}
        <Pressable onPress={onToggle} hitSlop={8} accessibilityLabel={open ? 'Ocultar instrucciones' : 'Ver cómo instalar'}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.textMuted} />
        </Pressable>
      </View>
      {open ? (
        <View style={{ marginTop: 10, gap: 4 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 13 }}>Cómo instalar</Text>
          {target.steps.map((s, i) => (
            <Text key={i} style={{ color: t.textMuted, fontSize: 13, lineHeight: 19 }}>
              {i + 1}. {s}
            </Text>
          ))}
          {asset?.sha256 ? (
            <Pressable
              onPress={() => {
                copyText(asset.sha256!);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              style={{ marginTop: 6 }}
              accessibilityLabel="Copiar huella SHA-256"
            >
              <Text style={{ color: t.textMuted, fontSize: 11 }}>SHA-256 {copied ? '(copiada ✓)' : '(toca para copiar)'}</Text>
              <Text selectable style={{ color: t.text, fontSize: 11, fontFamily: MONO }} numberOfLines={2}>
                {asset.sha256}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: BORDER, borderRadius: RADIUS.md, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  logo: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
});
