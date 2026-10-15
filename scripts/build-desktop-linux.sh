#!/usr/bin/env bash
set -e

# scripts/build-desktop-linux.sh
# Genera la versión ejecutable para GNU/Linux (.AppImage y .deb) usando React Native (Expo) y Electron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "=================================================="
echo "  Compilando PSJavaScript para GNU/Linux"
echo "=================================================="

# 1. Asegurar iconos nativos para Linux y web
echo "1. Verificando iconos (PNG alta resolución y web favicon/png)..."
node scripts/generate-web-icons.js

# 2. Compilar versión web con Expo
echo "2. Exportando aplicación web de React Native..."
npm run export:web

# 3. Preparar directorio desktop-app y www
echo "3. Configurando directorio de la aplicación de escritorio..."
mkdir -p "desktop-app/www"

# Limpiar www previo y copiar distribución web
rm -rf desktop-app/www/*
cp -R dist/* desktop-app/www/

# Eliminar binarios pesados que pudieran estar en dist para no inflar la app
rm -f desktop-app/www/*.apk desktop-app/www/*.aab desktop-app/www/*.exe desktop-app/www/*.dmg desktop-app/www/*.AppImage desktop-app/www/*.deb desktop-app/www/*.tar.gz desktop-app/www/*.rpm desktop-app/www/*.snap desktop-app/www/*.zip desktop-app/www/*.blockmap

# 4. Inyectar fuentes Ionicons en base64 para garantizar soporte 100% offline
echo "4. Inyectando fuentes Ionicons base64 para visualización de iconos offline..."
node scripts/inject-fonts.js

# 5. Generar configuración y archivos de Electron (package.json, main.js, iconos)
echo "5. Generando configuración de Electron (package.json, main.js)..."
node scripts/setup-desktop.js

# 6. Instalar dependencias en desktop-app si es necesario
echo "6. Verificando dependencias de Electron en desktop-app..."
cd desktop-app
rm -rf out
if [ ! -d "node_modules" ]; then
  npm install
fi

# 7. Compilar instalador para GNU/Linux (.AppImage / .deb)
# Argumento 1: Formato deseado (AppImage, deb, all, tar.gz) - por defecto AppImage
# Argumento 2: Arquitectura (x64, arm64, all) - por defecto x64
TARGET="${1:-AppImage}"
ARCH="${2:-x64}"
echo "7. Empaquetando aplicación para GNU/Linux (Formato: $TARGET, Arquitectura: $ARCH)..."

BUILD_ARGS=("--linux")

if [ "$TARGET" = "all" ]; then
  BUILD_ARGS+=("AppImage" "deb")
else
  BUILD_ARGS+=("$TARGET")
fi

if [ "$ARCH" = "all" ]; then
  BUILD_ARGS+=("--x64" "--arm64")
elif [ -n "$ARCH" ]; then
  BUILD_ARGS+=("--$ARCH")
fi

npx electron-builder "${BUILD_ARGS[@]}"

cd "$ROOT_DIR"

# 8. Copiar instalador(es) generado(s) a la carpeta public
echo "8. Copiando instalador generado a la carpeta public/..."
mkdir -p public

COPIED=0

APPIMAGE_FILE=$(find desktop-app/out -maxdepth 1 -name "*.AppImage" 2>/dev/null | head -n 1)
if [ -n "$APPIMAGE_FILE" ] && [ -f "$APPIMAGE_FILE" ]; then
  cp -f "$APPIMAGE_FILE" "public/PSJavaScript.AppImage"
  chmod +x "public/PSJavaScript.AppImage" 2>/dev/null || true
  APPIMAGE_SIZE_BYTES=$(stat -c%s "public/PSJavaScript.AppImage" 2>/dev/null || stat -f%z "public/PSJavaScript.AppImage" 2>/dev/null || wc -c < "public/PSJavaScript.AppImage")
  APPIMAGE_SIZE_MB=$(( APPIMAGE_SIZE_BYTES / 1048576 ))
  echo "Instalador portable AppImage guardado en public/PSJavaScript.AppImage (${APPIMAGE_SIZE_MB} MB / ${APPIMAGE_SIZE_BYTES} bytes)"
  if [ "$APPIMAGE_SIZE_BYTES" -gt 104857600 ]; then
    echo "ERROR: El archivo .AppImage excede el límite de 100 MB de GitHub (${APPIMAGE_SIZE_MB} MB)"
    exit 1
  fi
  COPIED=1
fi

DEB_FILE=$(find desktop-app/out -maxdepth 1 -name "*.deb" 2>/dev/null | head -n 1)
if [ -n "$DEB_FILE" ] && [ -f "$DEB_FILE" ]; then
  cp -f "$DEB_FILE" "public/PSJavaScript.deb"
  DEB_SIZE_BYTES=$(stat -c%s "public/PSJavaScript.deb" 2>/dev/null || stat -f%z "public/PSJavaScript.deb" 2>/dev/null || wc -c < "public/PSJavaScript.deb")
  DEB_SIZE_MB=$(( DEB_SIZE_BYTES / 1048576 ))
  echo "Paquete Debian guardado en public/PSJavaScript.deb (${DEB_SIZE_MB} MB / ${DEB_SIZE_BYTES} bytes)"
  if [ "$DEB_SIZE_BYTES" -gt 104857600 ]; then
    echo "ERROR: El archivo .deb excede el límite de 100 MB de GitHub (${DEB_SIZE_MB} MB)"
    exit 1
  fi
  COPIED=1
fi

TARGZ_FILE=$(find desktop-app/out -maxdepth 1 -name "*.tar.gz" 2>/dev/null | head -n 1)
if [ -n "$TARGZ_FILE" ] && [ -f "$TARGZ_FILE" ]; then
  cp -f "$TARGZ_FILE" "public/PSJavaScript-linux-x64.tar.gz"
  TARGZ_SIZE_BYTES=$(stat -c%s "public/PSJavaScript-linux-x64.tar.gz" 2>/dev/null || stat -f%z "public/PSJavaScript-linux-x64.tar.gz" 2>/dev/null || wc -c < "public/PSJavaScript-linux-x64.tar.gz")
  TARGZ_SIZE_MB=$(( TARGZ_SIZE_BYTES / 1048576 ))
  echo "Archivo tar.gz guardado en public/PSJavaScript-linux-x64.tar.gz (${TARGZ_SIZE_MB} MB / ${TARGZ_SIZE_BYTES} bytes)"
  COPIED=1
fi

if [ "$COPIED" -eq 0 ]; then
  echo "ERROR: No se encontró ningún paquete de Linux (.AppImage, .deb o .tar.gz) en desktop-app/out"
  exit 1
fi

# 9. Regenerar la versión web para incluir el nuevo instalador descargable
echo "9. Regenerando sitio web para actualizar enlaces de descarga..."
npm run export:web

echo "=================================================="
echo "  ¡Compilación para GNU/Linux finalizada con éxito!"
if [ -f "public/PSJavaScript.AppImage" ]; then
  echo "  Instalador AppImage listo en: public/PSJavaScript.AppImage"
  echo "  Paquete origen: $APPIMAGE_FILE"
  echo "  Para ejecutar: chmod +x public/PSJavaScript.AppImage && ./public/PSJavaScript.AppImage"
fi
if [ -f "public/PSJavaScript.deb" ]; then
  echo "  Paquete Debian listo en: public/PSJavaScript.deb"
  echo "  Paquete origen: $DEB_FILE"
  echo "  Para instalar: sudo dpkg -i public/PSJavaScript.deb"
fi
if [ -f "public/PSJavaScript-linux-x64.tar.gz" ]; then
  echo "  Archivo tar.gz listo en: public/PSJavaScript-linux-x64.tar.gz"
fi
echo "=================================================="
