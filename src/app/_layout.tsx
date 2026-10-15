import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CURRENT_VERSION, configureUpdater } from '../core/updater';
import { useTheme } from '../ui/theme';

configureUpdater({
  version: CURRENT_VERSION,
  platformOS: Platform.OS,
  urlOpener: async (url) => {
    await Linking.openURL(url);
  },
});

function Root() {
  const t = useTheme();

  React.useEffect(() => {
    configureUpdater({
      version: CURRENT_VERSION,
      platformOS: Platform.OS,
      urlOpener: async (url) => {
        await Linking.openURL(url);
      },
    });

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'PSJavaScript';

      const updateLink = (rel: string, href: string, type?: string) => {
        let el = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
        if (!el) {
          el = document.createElement('link');
          el.rel = rel;
          document.head.appendChild(el);
        }
        if (type) el.type = type;
        el.href = href;
      };

      // Detectar si la aplicación corre en una subruta (ej. GitHub Pages /PSJavaScript/)
      const isGh = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
      const parts = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean) : [];
      const base = isGh && parts.length > 0 ? `/${parts[0]}/` : './';

      // Inyectar / actualizar explícitamente los favicons en el DOM
      updateLink('icon', `${base}favicon.png?v=2`, 'image/png');
      updateLink('shortcut icon', `${base}favicon.ico?v=2`);
      updateLink('apple-touch-icon', `${base}apple-touch-icon.png?v=2`);
    }
  }, []);

  return (
    <>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />
    </>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
