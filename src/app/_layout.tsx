import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../ui/theme';

function Root() {
  const t = useTheme();

  React.useEffect(() => {
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

      // Inyectar / actualizar explícitamente los favicons en el DOM
      updateLink('icon', '/favicon.png?v=1', 'image/png');
      updateLink('shortcut icon', '/favicon.ico?v=1');
      updateLink('apple-touch-icon', '/apple-touch-icon.png?v=1');
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
