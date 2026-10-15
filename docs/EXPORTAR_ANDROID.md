# Guía de Compilación y Exportación Local para Android

Esta guía documenta la configuración y el flujo de trabajo para compilar y exportar **PSJavaScript** en Android de manera **100% local**, sin requerir cuentas de pago ni servicios en la nube (como servidores remotos de EAS Build).

---

## 📋 Requisitos del Entorno

El equipo debe contar con:
1. **Java Development Kit (JDK 17)**: OpenJDK 17 (Zulu, Temurin u Homebrew OpenJDK).
2. **Android SDK & Command-line Tools**:
   - `build-tools` (versión 34.0.0 o superior).
   - `platforms` (android-34 o android-36).
   - `ndk` (versión 27.x para compilar React Native y Hermes).
   - `platform-tools` (con `adb`).
3. **Variables de entorno** (detectadas automáticamente por el script):
   - `JAVA_HOME`
   - `ANDROID_HOME` o `ANDROID_SDK_ROOT`

---

## 🚀 Comandos de Compilación

Todos los binarios generados se guardan automáticamente en la carpeta:
`dist-android/`

### 1. Generar APK Release (Distribución directa / Sideload)
Compila un archivo `.apk` optimizado con el motor Hermes listo para instalar en cualquier teléfono Android:
```bash
npm run build:android
# o equivalente:
npm run build:android:apk
```
* **Salida:** `dist-android/PSJavaScript-1.0.1-release.apk`

---

### 2. Generar Android App Bundle (.aab) para Google Play Store
Compila el paquete oficial requerido para subir a Google Play Console:
```bash
npm run build:android:aab
```
* **Salida:** `dist-android/PSJavaScript-1.0.1-release.aab`

---

### 3. Compilar e Instalar Directamente en el Teléfono (ADB)
Si tienes tu teléfono conectado por cable USB (o por Wi-Fi) con la opción **Depuración por USB** activada, o un emulador de Android abierto:
```bash
npm run build:android:install
```
El script compilará el APK y lo enviará directamente al dispositivo con `adb install -r`.

---

### 4. Generar APK Debug (Desarrollo y pruebas rápidas)
Para compilar un APK en modo depuración sin optimizaciones pesadas:
```bash
npm run build:android:debug
```
* **Salida:** `dist-android/PSJavaScript-1.0.1-debug.apk`

---

### 5. Exportación Estática de Bundles JS y Recursos
Para exportar únicamente el bundle compilado de Hermes (`.hbc`) y los assets sin empaquetar el APK completo:
```bash
npm run export:android
```
* **Salida:** `dist/_expo/static/js/android/`

---

### 6. Compilar Localmente con EAS CLI (Alternativa)
Si prefieres utilizar el flujo de EAS de forma estrictamente local:
```bash
npm run build:android:local-eas
```
(Utiliza el perfil `preview` con empaquetado de APK local).

---

## 🔐 Firma de Producción (Keystore)

Por defecto, para facilitar el desarrollo inmediato, la compilación de Release firma con el almacén de claves local de desarrollo (`debug.keystore`), permitiendo instalar la app sin pasos adicionales.

Si vas a publicar formalmente en tiendas o necesitas tu propia firma:

1. **Generar un nuevo Keystore:**
   ```bash
   node scripts/build-android.js --generate-keystore
   ```
   Esto creará `android/app/release.keystore` con alias `psjavascript`.

2. **Personalizar contraseñas mediante variables de entorno (opcional):**
   ```bash
   export PSJS_STORE_FILE="release.keystore"
   export PSJS_STORE_PASSWORD="tu_password"
   export PSJS_KEY_ALIAS="tu_alias"
   export PSJS_KEY_PASSWORD="tu_password"
   npm run build:android:apk
   ```

---

## 🧹 Limpieza y Mantenimiento

* **Limpiar caché de compilación nativa:**
  ```bash
  npm run build:android:clean
  ```
* **Regenerar el directorio nativo `android/` desde cero:**
  ```bash
  npm run prebuild:android
  ```
