import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Plantilla HTML raíz para la versión web de Expo Router.
 * Configura los metadatos del encabezado y los enlaces del favicon para la pestaña del navegador.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>PSJavaScript</title>

        {/* Iconos y favicons oficiales de PSJavaScript */}
        <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png" />
        <link rel="icon" type="image/png" href="./favicon.png" />
        <link rel="icon" type="image/x-icon" href="./favicon.ico" />
        <link rel="shortcut icon" href="./favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png" />
        <meta name="theme-color" content="#58cc02" />

        {/* Tipografía de la marca (redondeada) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
