# scripts/build-desktop.ps1
# Genera el instalador ejecutable de Windows (.exe) usando React Native (Expo) y Electron

$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host "  Compilando PSJavaScript para Windows (.exe)"
Write-Host "=================================================="

# 1. Asegurar iconos web
Write-Host "1. Verificando iconos web..."
node scripts/generate-web-icons.js

# 2. Compilar versión web con Expo
Write-Host "2. Exportando aplicación web de React Native..."
npm run export:web

# 3. Preparar directorio desktop-app y www
Write-Host "3. Configurando directorio de la aplicación de escritorio..."
if (!(Test-Path -Path "desktop-app")) {
    New-Item -ItemType Directory -Path "desktop-app" | Out-Null
}
if (Test-Path -Path "desktop-app/www") {
    Remove-Item -Recurse -Force "desktop-app/www"
}
New-Item -ItemType Directory -Path "desktop-app/www" | Out-Null

Copy-Item -Path "dist/*" -Destination "desktop-app/www" -Recurse

# Eliminar instaladores pesados que pudieran estar en dist para no inflar la app
Remove-Item -Path "desktop-app/www/*.apk", "desktop-app/www/*.aab", "desktop-app/www/*.exe", "desktop-app/www/*.dmg", "desktop-app/www/*.AppImage", "desktop-app/www/*.deb", "desktop-app/www/*.tar.gz", "desktop-app/www/*.rpm", "desktop-app/www/*.snap", "desktop-app/www/*.zip", "desktop-app/www/*.blockmap" -Force -ErrorAction SilentlyContinue

# 4. Inyectar fuentes Ionicons en base64 para garantizar soporte 100% offline
Write-Host "4. Inyectando fuentes Ionicons base64 para visualización de iconos offline..."
node scripts/inject-fonts.js

# 5. Generar configuración y archivos de Electron (package.json, main.js, iconos)
Write-Host "5. Generando configuración de Electron (package.json, main.js)..."
node scripts/setup-desktop.js

# 6. Instalar dependencias en desktop-app si es necesario
Write-Host "6. Verificando dependencias de Electron en desktop-app..."
Push-Location "desktop-app"
if (Test-Path -Path "out") {
    Remove-Item -Recurse -Force "out"
}
if (!(Test-Path -Path "node_modules")) {
    Write-Host "Instalando dependencias en desktop-app..."
    npm install
}

# 7. Compilar instalador para Windows (.exe)
Write-Host "7. Empaquetando instalador de Windows (.exe)..."
npx electron-builder --win

Pop-Location

# 8. Copiar instalador a la carpeta public y verificar tamaño (<100MB)
Write-Host "8. Copiando instalador generado a la carpeta public/..."
if (!(Test-Path -Path "public")) {
    New-Item -ItemType Directory -Path "public" | Out-Null
}

$exePath = Get-ChildItem -Path "desktop-app/out/PSJavaScript Setup *.exe" | Select-Object -First 1

if ($exePath) {
    Copy-Item -Path $exePath.FullName -Destination "public/PSJavaScript-Setup.exe" -Force
    $exeSize = (Get-Item "public/PSJavaScript-Setup.exe").Length
    $exeSizeMB = [math]::Round($exeSize / 1MB, 2)
    Write-Host "Instalador guardado en public/PSJavaScript-Setup.exe ($exeSizeMB MB / $exeSize bytes)"

    if ($exeSize -gt 104857600) {
        Write-Error "ERROR: public/PSJavaScript-Setup.exe excede el límite de 100 MB de GitHub ($exeSizeMB MB / $exeSize bytes)"
        exit 1
    }
} else {
    Write-Error "ERROR: No se encontró ningún archivo .exe en desktop-app/out"
    exit 1
}

# 9. Regenerar la versión web para incluir el nuevo instalador descargable
Write-Host "9. Regenerando sitio web para actualizar enlaces de descarga..."
npm run export:web

Write-Host "=================================================="
Write-Host "  ¡Compilación para Windows finalizada con éxito!"
Write-Host "  Instalador listo en: public/PSJavaScript-Setup.exe"
Write-Host "=================================================="
