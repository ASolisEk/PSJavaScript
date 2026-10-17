# scripts/build-desktop-linux.ps1
# Genera el paquete ejecutable para GNU/Linux (.tar.gz / portable) desde Windows usando React Native (Expo) y Electron

param (
    [string]$Target = "tar.gz",
    [string]$Arch = "x64"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host "  Compilando PSJavaScript para GNU/Linux (desde Windows)"
Write-Host "=================================================="

# 1. Asegurar iconos web y PNG
Write-Host "1. Verificando iconos (PNG alta resolución y web favicon/png)..."
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

# Eliminar binarios pesados que pudieran estar en dist para no inflar la app
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
    Remove-Item -Recurse -Force "out/linux-unpacked" -ErrorAction SilentlyContinue
    Remove-Item -Force "out/*.tar.gz" -ErrorAction SilentlyContinue
}
if (!(Test-Path -Path "node_modules")) {
    Write-Host "Instalando dependencias en desktop-app..."
    npm install
}

# 7. Empaquetar aplicación para GNU/Linux
# Nota: La creación de paquetes nativos .AppImage (mksquashfs) y .deb (fpm) requiere herramientas de Linux.
# En Windows sin Docker / WSL, electron-builder compila limpiamente el paquete portable .tar.gz (y linux-unpacked).
if ($Target -eq "AppImage" -or $Target -eq "deb") {
    Write-Host "AVISO: La compilación de .$Target requiere herramientas del kernel Linux (mksquashfs/fpm)." -ForegroundColor Yellow
    Write-Host "Compilando en formato portable .tar.gz compatible con cualquier distribución Linux..." -ForegroundColor Yellow
    $Target = "tar.gz"
}

Write-Host "7. Empaquetando aplicación para GNU/Linux (Formato: $Target, Arquitectura: $Arch)..."

$buildArgs = @("--linux", $Target)
if ($Arch -eq "all") {
    $buildArgs += @("--x64", "--arm64")
} elseif ($Arch) {
    $buildArgs += "--$Arch"
}

npx electron-builder @buildArgs

Pop-Location

# 8. Copiar instalador(es) generado(s) a la carpeta public
Write-Host "8. Copiando instalador generado a la carpeta public/..."
if (!(Test-Path -Path "public")) {
    New-Item -ItemType Directory -Path "public" | Out-Null
}

$copied = $false

$tarGzFile = Get-ChildItem -Path "desktop-app/out/*.tar.gz" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($tarGzFile) {
    Copy-Item -Path $tarGzFile.FullName -Destination "public/PSJavaScript-linux-x64.tar.gz" -Force
    $tarGzSize = (Get-Item "public/PSJavaScript-linux-x64.tar.gz").Length
    $tarGzSizeMB = [math]::Round($tarGzSize / 1MB, 2)
    Write-Host "Archivo tar.gz guardado en public/PSJavaScript-linux-x64.tar.gz ($tarGzSizeMB MB / $tarGzSize bytes)"
    $copied = $true
}

$appImageFile = Get-ChildItem -Path "desktop-app/out/*.AppImage" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($appImageFile) {
    Copy-Item -Path $appImageFile.FullName -Destination "public/PSJavaScript.AppImage" -Force
    $appImageSize = (Get-Item "public/PSJavaScript.AppImage").Length
    $appImageSizeMB = [math]::Round($appImageSize / 1MB, 2)
    Write-Host "Instalador portable AppImage guardado en public/PSJavaScript.AppImage ($appImageSizeMB MB / $appImageSize bytes)"
    if ($appImageSize -gt 104857600) {
        Write-Error "ERROR: public/PSJavaScript.AppImage excede el límite de 100 MB de GitHub ($appImageSizeMB MB)"
        exit 1
    }
    $copied = $true
}

$debFile = Get-ChildItem -Path "desktop-app/out/*.deb" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($debFile) {
    Copy-Item -Path $debFile.FullName -Destination "public/PSJavaScript.deb" -Force
    $debSize = (Get-Item "public/PSJavaScript.deb").Length
    $debSizeMB = [math]::Round($debSize / 1MB, 2)
    Write-Host "Paquete Debian guardado en public/PSJavaScript.deb ($debSizeMB MB / $debSize bytes)"
    if ($debSize -gt 104857600) {
        Write-Error "ERROR: public/PSJavaScript.deb excede el límite de 100 MB de GitHub ($debSizeMB MB)"
        exit 1
    }
    $copied = $true
}

if (-not $copied) {
    Write-Error "ERROR: No se encontró ningún paquete de Linux (.tar.gz, .AppImage o .deb) en desktop-app/out"
    exit 1
}

# 9. Regenerar la versión web para incluir el nuevo instalador descargable
Write-Host "9. Regenerando sitio web para actualizar enlaces de descarga..."
npm run export:web

Write-Host "=================================================="
Write-Host "  ¡Compilación para GNU/Linux finalizada con éxito!"
if (Test-Path "public/PSJavaScript.AppImage") {
    Write-Host "  Instalador AppImage disponible en: public/PSJavaScript.AppImage"
}
if (Test-Path "public/PSJavaScript.deb") {
    Write-Host "  Paquete Debian disponible en: public/PSJavaScript.deb"
}
if (Test-Path "public/PSJavaScript-linux-x64.tar.gz") {
    Write-Host "  Archivo portable tar.gz listo en: public/PSJavaScript-linux-x64.tar.gz"
}
Write-Host "=================================================="
