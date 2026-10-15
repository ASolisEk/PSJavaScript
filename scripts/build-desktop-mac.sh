#!/usr/bin/env bash
set -e

# scripts/build-desktop-mac.sh
# Genera la versión ejecutable para macOS (.dmg) usando React Native (Expo) y Electron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "=================================================="
echo "  Compilando PSJavaScript para macOS (.dmg)"
echo "=================================================="

# 1. Asegurar iconos nativos para macOS y web
echo "1. Verificando iconos (macOS .icns y web favicon/png)..."
node scripts/generate-icns.js
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

# 7. Compilar instalador para macOS (.dmg)
ARCH="${1:-arm64}"
echo "7. Empaquetando instalador de macOS (.dmg) para arquitectura: $ARCH..."

if [ "$ARCH" = "universal" ]; then
  npx electron-builder --mac dmg --universal
elif [ "$ARCH" = "all" ]; then
  npx electron-builder --mac dmg --arm64 --x64
else
  npx electron-builder --mac dmg "--$ARCH"
fi

cd "$ROOT_DIR"

# 8. Copiar instalador a la carpeta public
echo "8. Copiando instalador generado a la carpeta public/..."
mkdir -p public

DMG_FILE=$(find desktop-app/out -maxdepth 1 -name "*.dmg" | head -n 1)

if [ -n "$DMG_FILE" ] && [ -f "$DMG_FILE" ]; then
  cp -f "$DMG_FILE" "public/PSJavaScript.dmg"
  DMG_SIZE_BYTES=$(stat -f%z "public/PSJavaScript.dmg" 2>/dev/null || wc -c < "public/PSJavaScript.dmg")
  DMG_SIZE_MB=$(( DMG_SIZE_BYTES / 1048576 ))
  echo "Instalador guardado en public/PSJavaScript.dmg (${DMG_SIZE_MB} MB / ${DMG_SIZE_BYTES} bytes)"
  if [ "$DMG_SIZE_BYTES" -gt 104857600 ]; then
    echo "ERROR: El archivo .dmg excede el límite de 100 MB de GitHub (${DMG_SIZE_MB} MB)"
    exit 1
  fi
else
  echo "ERROR: No se encontró ningún archivo .dmg en desktop-app/out"
  exit 1
fi

# 9. Regenerar la versión web para incluir el nuevo instalador descargable
echo "9. Regenerando sitio web para actualizar enlaces de descarga..."
npm run export:web

echo "=================================================="
echo "  ¡Compilación para macOS finalizada con éxito!"
echo "  Instalador listo en: public/PSJavaScript.dmg"
echo "  Paquete en out: $DMG_FILE"
echo "=================================================="
