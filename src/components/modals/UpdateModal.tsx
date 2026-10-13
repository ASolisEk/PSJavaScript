/**
 * Modal de actualización: informa sobre nuevas versiones disponibles
 * y gestiona el proceso de descarga e instalación.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { DownloadProgress, downloadAndInstall, CURRENT_VERSION } from '../../core/updater';
import { useApp } from '../../store/app';
import { useTheme } from '../../ui/theme';
import { Button } from '../ui';
import ModalShell from './ModalShell';

export default function UpdateModal() {
  const t = useTheme();
  const setModal = useApp((s) => s.setModal);
  const updateInfo = useApp((s) => s.updateInfo);

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>({
    status: 'idle',
    percent: 0,
    received: 0,
    total: 0,
  });
  const [installError, setInstallError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const release = updateInfo?.release;
  const currentVer = updateInfo?.currentVersion ?? CURRENT_VERSION;
  const latestVer = updateInfo?.latestVersion ?? release?.version ?? CURRENT_VERSION;

  const handleStartUpdate = async () => {
    if (!release) return;
    setDownloading(true);
    setInstallError(null);
    setCompleted(false);

    try {
      const res = await downloadAndInstall(release, (p) => {
        setProgress(p);
      });

      if (res.success) {
        setCompleted(true);
      } else {
        setInstallError(res.error ?? 'No se pudo completar la instalación automática.');
      }
    } catch (err: any) {
      setInstallError(err?.message ?? 'Error inesperado durante la descarga.');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenGitHub = () => {
    if (release?.releaseUrl) {
      Linking.openURL(release.releaseUrl);
    }
  };

  const handleDirectDownload = () => {
    if (release?.downloadUrl) {
      Linking.openURL(release.downloadUrl);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ModalShell title="Actualización disponible" onClose={() => setModal(null)} wide>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: t.primary + '18' }]}>
            <Ionicons name="sparkles" size={32} color={t.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.title, { color: t.text }]}>¡Nueva versión de PSJavaScript!</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.versionBadge, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
                <Text style={[styles.versionText, { color: t.textMuted }]}>Actual: v{currentVer}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={t.textMuted} style={{ marginHorizontal: 6 }} />
              <View style={[styles.versionBadge, { backgroundColor: t.success + '20', borderColor: t.success }]}>
                <Text style={[styles.versionText, { color: t.success, fontWeight: '700' }]}>Nueva: v{latestVer}</Text>
              </View>
            </View>
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
              Plataforma: <Text style={{ color: t.text, fontWeight: '600' }}>{updateInfo?.platformLabel ?? 'Escritorio'}</Text>
            </Text>
          </View>
        </View>

        {release?.notes ? (
          <View style={[styles.notesBox, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
            <Text style={[styles.notesHeader, { color: t.text }]}>Novedades en esta versión:</Text>
            <Text style={{ color: t.text, fontSize: 13, lineHeight: 20 }}>{release.notes}</Text>
          </View>
        ) : null}

        {/* Progreso de descarga */}
        {downloading || progress.status === 'downloading' || progress.status === 'installing' ? (
          <View style={[styles.progressCard, { backgroundColor: t.surfaceAlt, borderColor: t.primary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <ActivityIndicator size="small" color={t.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: t.text, fontWeight: '600', fontSize: 13 }}>
                {progress.status === 'installing'
                  ? 'Instalando y ejecutando actualización...'
                  : `Descargando ${release?.assetName ?? 'actualización'}...`}
              </Text>
              <Text style={{ color: t.primary, fontWeight: '700', marginLeft: 'auto', fontSize: 13 }}>
                {progress.percent}%
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: t.border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: t.primary, width: `${progress.percent}%` }]} />
            </View>
            {progress.total > 0 ? (
              <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 6, textAlign: 'right' }}>
                {formatBytes(progress.received)} de {formatBytes(progress.total)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Éxito */}
        {completed ? (
          <View style={[styles.statusBox, { backgroundColor: t.success + '18', borderColor: t.success }]}>
            <Ionicons name="checkmark-circle" size={24} color={t.success} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.success, fontWeight: '700', fontSize: 14 }}>
                ¡Descarga e instalación iniciada con éxito!
              </Text>
              <Text style={{ color: t.text, fontSize: 12, marginTop: 3 }}>
                El instalador de la nueva versión se ha puesto en marcha. Puedes reiniciar PSJavaScript cuando finalice la instalación.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Error */}
        {installError ? (
          <View style={[styles.statusBox, { backgroundColor: t.danger + '18', borderColor: t.danger }]}>
            <Ionicons name="alert-circle" size={24} color={t.danger} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.danger, fontWeight: '700', fontSize: 14 }}>
                No se pudo completar la instalación automática
              </Text>
              <Text style={{ color: t.text, fontSize: 12, marginTop: 2 }}>{installError}</Text>
              <Button
                label="Descargar paquete directamente"
                icon="download-outline"
                onPress={handleDirectDownload}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              />
            </View>
          </View>
        ) : null}

        {/* Acciones */}
        <View style={styles.actions}>
          {!completed && !downloading ? (
            <Button
              label="Descargar e instalar ahora"
              icon="cloud-download-outline"
              kind="primary"
              onPress={handleStartUpdate}
            />
          ) : null}

          {release?.releaseUrl ? (
            <Button
              label="Ver notas en GitHub"
              icon="logo-github"
              onPress={handleOpenGitHub}
              style={{ marginLeft: 8 }}
            />
          ) : null}

          <Button
            label={completed ? 'Cerrar' : 'Recordármelo más tarde'}
            onPress={() => setModal(null)}
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  versionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  versionText: { fontSize: 12 },
  notesBox: { padding: 14, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  notesHeader: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  progressCard: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statusBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
